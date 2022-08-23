export function useEventListener(m, target, event, callback) {
  useConnectedEffect(m, () => {
    target.addEventListener(event, callback);
    return () => {
      target.removeEventListener(event, callback);
    };
  });
}

export function useConnectedEffect(m, callback) {
  m.events.on('connected', () => {
    let result = callback();
    if (typeof result === 'function') {
      m.events.once('disconnected', result);
    }
  });
}
