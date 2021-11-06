/**
 * @template T
 */
export class Eventable
{
    constructor()
    {
        /** @private */
        this.listeners = /** @type {Record<keyof T, Array<T[keyof T]>>} */({});
    }

    /**
     * @param {keyof T} event 
     * @param {T[keyof T]} callback
     */
    on(event, callback)
    {
        let eventListeners = this.listeners[event];
        if (eventListeners)
        {
            eventListeners.push(callback);
        }
        else
        {
            this.listeners[event] = [callback];
        }
        return this;
    }

    /**
     * @param {keyof T} event 
     * @param {T[keyof T]} callback
     */
    off(event, callback)
    {
        let eventListeners = this.listeners[event];
        if (eventListeners)
        {
            let i = eventListeners.indexOf(callback);
            if (i >= 0)
            {
                eventListeners.splice(i, 1);
            }
        }
        return this;
    }

    /**
     * @param {keyof T} event
     * @param {T[keyof T]} callback
     */
    once(event, callback)
    {
        let f = /** @type {Function} */(/** @type {unknown} */(callback));
        let wrapper = function() {
            f.apply(undefined, arguments);
            this.off(event, wrapper);
        }.bind(this);
        this.on(event, wrapper);
        return this;
    }

    /**
     * @param {keyof T} event
     * @param {...any} args
     */
    emit(event, ...args)
    {
        let eventListeners = this.listeners[event];
        if (eventListeners)
        {
            for(let callback of eventListeners)
            {
                let f = /** @type {Function} */(/** @type {unknown} */(callback));
                f.apply(undefined, args);
            }
        }
        return this;
    }
}
