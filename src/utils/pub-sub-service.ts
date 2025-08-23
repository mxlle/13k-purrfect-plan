import { defineEnum } from "./enums";

type PubSubEvent = defineEnum<typeof PubSubEvent>
export const PubSubEvent = defineEnum({
  START_NEW_GAME: 0,
  GAME_START: 1,
  GAME_END: 2,
  MUTE_MUSIC: 3,
  UNMUTE_MUSIC: 4,
  CLOSE_DIALOG: 5,
})

type EventDataTypes = {
  [PubSubEvent.START_NEW_GAME]: { shouldIncreaseLevel: boolean };
  [PubSubEvent.GAME_START]: undefined;
  [PubSubEvent.GAME_END]: undefined;
  [PubSubEvent.MUTE_MUSIC]: undefined;
  [PubSubEvent.UNMUTE_MUSIC]: undefined;
  [PubSubEvent.CLOSE_DIALOG]: boolean;
};

type Callback<Event extends PubSubEvent> = (data: EventDataTypes[Event]) => void;

/**
 * A service that allows components to subscribe to events and publish events.
 */
export class PubSubService {
  _subscriptions: {
    [event in PubSubEvent]?: Callback<event>[];
  } = {};

  /**
   * Subscribes to an event.
   */
  subscribe<Event extends PubSubEvent>(event: Event, callback: Callback<Event>) {
    if (!this._subscriptions[event]) {
      this._subscriptions[event] = [];
    }

    this._subscriptions[event].push(callback);
  }

  /**
   * Unsubscribes from an event.
   */
  unsubscribe<Event extends PubSubEvent>(event: Event, callback: Callback<Event>) {
    if (!this._subscriptions[event]) {
      return;
    }

    const index = this._subscriptions[event].indexOf(callback);
    if (index >= 0) {
      this._subscriptions[event].splice(index, 1);
    }
  }

  /**
   * Publishes an event.
   */
  publish<Event extends PubSubEvent>(event: Event, data?: EventDataTypes[Event]) {
    if (!this._subscriptions[event]) {
      return;
    }

    this._subscriptions[event].forEach((cb) => cb(data));
  }
}

export const pubSubService = new PubSubService();
