/**
 * @template T
 */
export class Eventable {
  constructor() {
    /** @private */
    this.listeners = /** @type {Record<keyof T, Array<T[keyof T]>>} */ ({});
  }

  /**
   * @param {keyof T} event
   * @param {T[keyof T]} callback
   * @returns {Eventable}
   */
  on(event, callback) {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      eventListeners.push(callback);
    } else {
      this.listeners[event] = [callback];
    }
    return this;
  }

  /**
   * @param {keyof T} event
   * @param {T[keyof T]} callback
   * @returns {Eventable}
   */
  off(event, callback) {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      const i = eventListeners.indexOf(callback);
      if (i >= 0) {
        eventListeners.splice(i, 1);
      }
    }
    return this;
  }

  /**
   * @param {keyof T} event
   * @param {T[keyof T]} callback
   * @returns {Eventable}
   */
  once(event, callback) {
    const f = /** @type {Function} */ (/** @type {unknown} */ (callback));
    const wrapper = function () {
      f.apply(undefined, arguments);
      this.off(event, wrapper);
    }.bind(this);
    this.on(event, wrapper);
    return this;
  }

  /**
   * @param {keyof T} event
   * @param {...any} args
   * @returns {Eventable}
   */
  emit(event, ...args) {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      for (const callback of eventListeners) {
        const f = /** @type {Function} */ (/** @type {unknown} */ (callback));
        f.apply(undefined, args);
      }
    }
    return this;
  }

  /**
   * @returns {Eventable}
   */
  clearEventListeners() {
    this.listeners = /** @type {Record<keyof T, Array<T[keyof T]>>} */ ({});
    return this;
  }
}
