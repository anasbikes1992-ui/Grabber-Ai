// events/bus.js — Event Bus (docs/04 §4): append-only, at-least-once,
// idempotent handlers (EH-09). The event log IS the audit trail (Article IX).
import { makeEvent } from '../kernel/types.js';

export class EventBus {
  #log = [];
  #handlers = new Map(); // type -> [{name, fn}]
  #delivered = new Set(); // `${handlerName}:${eventId}` — idempotency

  /** Append and deliver. Accepts either a full event or makeEvent() args. */
  emit(eventOrArgs) {
    const event = eventOrArgs.id ? eventOrArgs : makeEvent(eventOrArgs);
    this.#log.push(event);
    for (const key of [event.type, '*']) {
      for (const { name, fn } of this.#handlers.get(key) ?? []) {
        const dedupe = `${name}:${event.id}`;
        if (this.#delivered.has(dedupe)) continue; // idempotent delivery
        this.#delivered.add(dedupe);
        fn(event); // handlers must not throw; failures are their own events
      }
    }
    return event;
  }

  /** Subscribe a named (idempotency-keyed) handler. type '*' = all events. */
  subscribe(type, name, fn) {
    if (!this.#handlers.has(type)) this.#handlers.set(type, []);
    this.#handlers.get(type).push({ name, fn });
  }

  /** The append-only log. Immutable events, immutable list. */
  replay(filter = () => true) {
    return this.#log.filter(filter);
  }

  get depth() { return this.#log.length; }
}
