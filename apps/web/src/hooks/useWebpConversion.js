import { useSyncExternalStore, useCallback } from 'react';

const KEY = 'webp_conversion_enabled';

function getSnapshot() {
  const v = localStorage.getItem(KEY);
  return v === null ? true : v === 'true';
}

function subscribe(cb) {
  const handler = (e) => {
    if (e.key === KEY || e.key === null) cb();
  };
  window.addEventListener('storage', handler);
  window.addEventListener('webp-toggle', cb);
  return () => {
    window.removeEventListener('storage', handler);
    window.removeEventListener('webp-toggle', cb);
  };
}

export function useWebpConversion() {
  const enabled = useSyncExternalStore(subscribe, getSnapshot);

  const setEnabled = useCallback((val) => {
    localStorage.setItem(KEY, String(val));
    window.dispatchEvent(new Event('webp-toggle'));
  }, []);

  return [enabled, setEnabled];
}
