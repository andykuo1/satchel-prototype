export function el(selector, event, callback) {
  document.querySelector(selector).addEventListener(event, callback);
}
