import {Connector} from "./connector";
import {NchanChannel, NchanPresenceChannel, NchanPrivateChannel, PresenceChannel} from "./../channel";

/**
 * This class creates a connector to Pusher.
 */
export class NchanConnector extends Connector {
    /**
     * The Nchan instance.
     *
     * @type {WebSocket}
     */
    socket: WebSocket = null;

    /**
     * All of the subscribed channel names.
     *
     * @type {any}
     */
    channels: any = {};

    lastMessageId: string = Math.floor(Date.now() / 1000) + ':-,[0]';

    /**
     * Connect to Nchan Server start listening for subscribed channels.
     *
     * @return void
     */
    connect(): void {
        if(this.hasChannels()) {
            if(this.isConnected()) {
                this.disconnect();
            }
            this.connectSocket();
        }
    }

    connectSocket: Function = this.debounce(function() {
        let url:string = this.options.host + '?channels=' + this.getChannelNames();
        url = NchanConnector.websocketizeURL(url);
        url = NchanConnector.addLastMsgIdToQueryString(url, this.lastMessageId);
        this.socket = new WebSocket(url, 'ws+meta.nchan');
        this.socket.onmessage = this.onMessage.bind(this);
    }, 100, false);

    /**
     * Listen for an event on a channel instance.
     *
     * @param  {string} name
     * @param  {string} event
     * @param  {Function} callback
     * @return {PusherChannel}
     */
    listen(name: string, event: string, callback: Function): NchanChannel {
        return this.channel(name).listen(event, callback);
    }

    /**
     * Get a channel instance by name.
     *
     * @param  {string} name
     * @return {PusherChannel}
     */
    channel(name: string): NchanChannel {
        if (!this.channels[name]) {
            this.channels[name] = new NchanChannel(
                this,
                name,
                this.options
            );
            this.connect();
        }

        return this.channels[name];
    }

    /**
     * Get a private channel instance by name.
     *
     * @param  {string} name
     * @return {PusherPrivateChannel}
     */
    privateChannel(name: string): NchanChannel {
        if (!this.channels['private-' + name]) {
            this.channels['private-' + name] = new NchanPrivateChannel(
                this,
                'private-' + name,
                this.options
            );
            this.connect();
        }

        return this.channels['private-' + name];
    }

    /**
     * Get a presence channel instance by name.
     *
     * @param  {string} name
     * @return {PresenceChannel}
     */
    presenceChannel(name: string): PresenceChannel {
        if (!this.channels['presence-' + name]) {
            this.channels['presence-' + name] = new NchanPresenceChannel(
                this,
                'presence-' + name,
                this.options
            );
            this.connect();
        }

        return this.channels['presence-' + name];
    }

    /**
     * Leave the given channel.
     *
     * @param  {string} channel
     */
    leave(channel: string) {
        let channels = [channel, 'private-' + channel, 'presence-' + channel];
        let hasChanged = false;

        channels.forEach((name: string) => {
            if (this.channels[name]) {
                delete this.channels[name];
                hasChanged = true;
            }
        });
        if(this.isConnected() && hasChanged) {
            this.connect();
        }
    }

    /**
     * Get the socket ID for the connection.
     *
     * @return {string}
     */
    socketId(): string {
        return '';
    }

    /**
     * Disconnect Pusher connection.
     *
     * @return void
     */
    disconnect(): void {
        if(this.isConnected()) {
            this.socket.close();
            this.socket = null;
        }
    }

    isConnected(): boolean {
        return Boolean(this.socket);
    }

    onMessage(message: MessageEvent): void {
        let parse = message.data.match(/^id: (.*)\n(content-type: (.*)\n)?\n/m);
        let data = JSON.parse(message.data.substr(parse[0].length));
        data.messageId = this.lastMessageId = parse[1];
        data.contentType = parse[3];
        Object.keys(this.channels).map(function (key: string) {
            return this.channels[key].emitter.emit(data.event, data);
        }, this);
    };

    static addLastMsgIdToQueryString(url: string, msgid: string): string {
        if (msgid) {
            let m = url.match(/(\?.*)$/);
            url += (m ? "&" : "?") + "last_event_id=" + encodeURIComponent(msgid);
        }
        return url;
    }

    static websocketizeURL(url: string) {
        let m = url.match(/^((\w+:)?\/\/([^\/]+))?(\/)?(.*)/);
        let protocol = m[2];
        let host = m[3];
        let absolute = m[4];
        let path = m[5];

        let loc;
        if(typeof window == "object") {
            loc = window.location;
        }

        if(!protocol && loc) {
            protocol = loc.protocol;
        }
        if(protocol == "https:") {
            protocol = "wss:";
        }
        else if(protocol == "http:") {
            protocol = "ws:";
        }
        else {
            protocol = "wss:"; //default setting: secure
        }

        if(!host && loc) {
            host = loc.host;
        }

        if(!absolute) {
            path = loc ? loc.pathname.match(/(.*\/)[^/]*/)[1] + path : "/" + path;
        }
        else {
            path = "/" + path;
        }

        return protocol + "//" + host + path;
    }

    getChannelNames(): string {
        return Object.keys(this.channels).map(function (key: string) {
            return this.channels[key].name;
        }, this).join(',');
    }

    hasChannels() {
        if(!this.channels) {
            return false;
        }
        return Object.keys(this.channels).length > 0;
    }

    debounce(func: Function, wait: number, immediate: boolean): Function {
        let timeout;
        return function() {
            let context = this, args = arguments;
            let later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            let callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    };
}
