/**
 * @template T
 * @typedef PromiseStatusSuccessResult<T>
 * @property {boolean} pending
 * @property {true} result
 * @property {T} reason
 * @property {Function} resolve
 * @property {Function} reject
 */

/**
 * @typedef PromiseStatusErrorResult
 * @property {boolean} pending
 * @property {false} result
 * @property {Error} reason
 * @property {Function} resolve
 * @property {Function} reject
 */

/**
 * @template T
 * @typedef {PromiseStatusSuccessResult<T>|PromiseStatusErrorResult} PromiseStatusResult<T>
 */

/**
 * @template T
 * @returns {PromiseStatusResult<T>}
 */
export function createPromiseStatus() {
  return {
    pending: false,
    result: false,
    reason: null,
    resolve: null,
    reject: null,
  };
}

/**
 * @returns {boolean}
 */
export function isPromiseStatusPending(promiseStatus) {
  return promiseStatus.pending;
}

/**
 * @template T
 * @param {PromiseStatusResult<T>} promiseStatus
 * @returns {Promise<T>}
 */
export async function createPromiseStatusPromise(promiseStatus) {
  return new Promise((resolve, reject) => {
    if (promiseStatus.pending) {
      promiseStatus.pending = false;
      promiseStatus.resolve = null;
      promiseStatus.reject = null;
      if (promiseStatus.result) {
        resolve(promiseStatus.reason);
      } else {
        reject(promiseStatus.reason);
      }
    } else {
      promiseStatus.pending = true;
      promiseStatus.resolve = resolve;
      promiseStatus.reject = reject;
    }
  });
}

/**
 * @template T
 * @param {PromiseStatusResult<T>} promiseStatus
 * @param {T} reason
 */
export function resolvePromiseStatus(promiseStatus, reason) {
  if (typeof promiseStatus.resolve === 'function') {
    const { resolve } = promiseStatus;
    promiseStatus.pending = false;
    promiseStatus.resolve = null;
    promiseStatus.reject = null;
    resolve(reason);
  } else {
    promiseStatus.pending = true;
    promiseStatus.result = true;
    promiseStatus.reason = reason;
  }
}

/**
 * @template T
 * @param {PromiseStatusResult<T>} promiseStatus
 * @param {Error} reason
 */
export function rejectPromiseStatus(promiseStatus, reason) {
  if (typeof promiseStatus.resolve === 'function') {
    const { reject } = promiseStatus;
    promiseStatus.pending = false;
    promiseStatus.resolve = null;
    promiseStatus.reject = null;
    reject(reason);
  } else {
    promiseStatus.pending = true;
    promiseStatus.result = false;
    promiseStatus.reason = reason;
  }
}
