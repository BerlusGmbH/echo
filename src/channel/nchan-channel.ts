import { EventFormatter } from './../util';
import { Channel } from './channel';
import { EventEmitter } from "events";
import {NchanConnector} from "../connector/nchan-connector";

/**
 * This class represents a Socket.io channel.
 */
export class NchanChannel extends Channel {
    /**
     * The Socket.io client instance.
     *
     * @type {NchanConnector}
     */
    connector: NchanConnector = null;

    /**
     * The name of the channel.
     *
     * @type {object}
     */
    name: any;

    /**
     * Channel options.
     *
     * @type {any}
     */
    options: any;

    /**
     * The event formatter.
     *
     * @type {EventFormatter}
     */
    eventFormatter: EventFormatter;

    /**
     * The event emitter.
     *
     * @type {any}
     */
    emitter: EventEmitter;

    /**
     * Create a new class instance.
     *
     * @param  {NchanConnector} connector
     * @param  {string} name
     * @param  {any} options
     */
    constructor(connector: NchanConnector, name: string, options: any) {
        super();

        this.connector = connector;
        this.name = name;
        this.options = options;
        this.eventFormatter = new EventFormatter(this.options.namespace);
        this.emitter = new EventEmitter();
    }

    /**
     * Listen for an event on the channel instance.
     *
     * @param  {string} event
     * @param  {Function} callback
     * @return {SocketIoChannel}
     */
    listen(event: string, callback: Function): NchanChannel {
        this.on(this.eventFormatter.format(event), callback);
        return this;
    }

    /**
     * Bind the channel's socket to an event and store the callback.
     *
     * @param  {string} event
     * @param  {Function} callback
     */
    on(event: string, callback: Function): void {
        let listener = (data) => {
            if (data.channels.indexOf(this.name) > -1) {
                callback(data);
            }
        };
        this.emitter.on(event, listener);
    }
}
