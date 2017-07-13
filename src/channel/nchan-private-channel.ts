import { NchanChannel } from './';

/**
 * This class represents an Nchan private channel.
 */
export class NchanPrivateChannel extends NchanChannel {
    /**
     * Trigger client event on the channel.
     *
     * @param  {string}  eventName
     * @param  {object}  data
     * @return {NchanPrivateChannel}
     */
    whisper(eventName, data): NchanPrivateChannel {
        this.connector.socket.send(JSON.stringify({
            channel: this.name,
            event: `client-${eventName}`,
            data: data
        }));

        return this;
    }
}
