/**
 * @template T
 * @typedef PromiseStatusSuccessResult<T>
 * @property {boolean} complete
 * @property {true} result
 * @property {T} reason
 * @property {Array<Function>} resolve
 * @property {Array<Function>} reject
 */

/**
 * @typedef PromiseStatusErrorResult
 * @property {boolean} complete
 * @property {false} result
 * @property {Error} reason
 * @property {Array<Function>} resolve
 * @property {Array<Function>} reject
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
    complete: false,
    result: false,
    reason: null,
    resolve: [],
    reject: [],
  };
}

/**
 * @returns {boolean}
 */
export function isPromiseStatusPending(promiseStatus) {
  return !promiseStatus.complete && (promiseStatus.resolve.length > 0 || promiseStatus.reject.length > 0);
}

/**
 * @template T
 * @param {PromiseStatusResult<T>} promiseStatus
 * @returns {Promise<T>}
 */
export async function createPromiseStatusPromise(promiseStatus) {
  return new Promise((resolve, reject) => {
    if (promiseStatus.complete) {
      if (promiseStatus.result) {
        resolve(promiseStatus.reason);
      } else {
        reject(promiseStatus.reason);
      }
    } else {
      promiseStatus.resolve.push(resolve);
      promiseStatus.reject.push(reject);
    }
  });
}

/**
 * @template T
 * @param {PromiseStatusResult<T>} promiseStatus
 * @param {T} reason
 */
export function resolvePromiseStatus(promiseStatus, reason) {
  if (!promiseStatus.complete) {
    let resolvers = promiseStatus.resolve;
    promiseStatus.complete = true;
    promiseStatus.resolve = [];
    promiseStatus.reject = [];
    promiseStatus.result = true;
    promiseStatus.reason = reason;
    for(let resolver of resolvers) {
      resolver(reason);
    }
  } else {
    throw new Error('Cannot resolve pending promise already completed.');
  }
}

/**
 * @template T
 * @param {PromiseStatusResult<T>} promiseStatus
 * @param {Error} reason
 */
export function rejectPromiseStatus(promiseStatus, reason) {
  if (!promiseStatus.complete) {
    let rejectors = promiseStatus.reject;
    promiseStatus.complete = true;
    promiseStatus.resolve = [];
    promiseStatus.reject = [];
    promiseStatus.result = false;
    promiseStatus.reason = reason;
    for(let rejector of rejectors) {
      rejector(reason);
    }
  } else {
    throw new Error('Cannot reject pending promise already completed.');
  }
}
