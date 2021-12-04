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
    this.addEventListener(event, callback);
    return this;
  }

  /**
   * @param {keyof T} event
   * @param {T[keyof T]} callback
   * @returns {Eventable}
   */
  off(event, callback) {
    this.removeEventListener(event, callback);
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
      this.removeEventListener(event, wrapper);
    }.bind(this);
    this.addEventListener(event, wrapper);
    return this;
  }

  /**
   * @param {keyof T} event
   * @param {...any} args
   * @returns {Eventable}
   */
  emit(event, ...args) {
    this.dispatchEvent(event, args);
    return this;
  }

  /**
   * @protected
   * @param {keyof T} event
   * @param {T[keyof T]} callback
   */
  addEventListener(event, callback) {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      eventListeners.push(callback);
    } else {
      this.listeners[event] = [callback];
    }
  }

  /**
   * @protected
   * @param {keyof T} event
   * @param {T[keyof T]} callback
   */
  removeEventListener(event, callback) {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      const i = eventListeners.indexOf(callback);
      if (i >= 0) {
        eventListeners.splice(i, 1);
      }
    }
  }

  /**
   * @protected
   * @param {keyof T} event
   * @returns {Array<T[keyof T]>}
   */
  getEventListeners(event) {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      return eventListeners.slice();
    }
    return [];
  }

  /**
   * @protected
   * @param {keyof T} event
   * @returns {number}
   */
  countEventListeners(event) {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      return eventListeners.length;
    }
    return 0;
  }

  /**
   * @protected
   * @param {keyof T} event
   * @param {Array<any>} args
   */
  dispatchEvent(event, args) {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      for (const callback of eventListeners) {
        const f = /** @type {Function} */ (/** @type {unknown} */ (callback));
        f.apply(undefined, args);
      }
    }
  }

  /**
   * @protected
   */
  clearEventListeners() {
    this.listeners = /** @type {Record<keyof T, Array<T[keyof T]>>} */ ({});
  }
}
