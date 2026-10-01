import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

const POLL_MS = 4000;

/** Loads the current group order and refreshes it every few seconds,
 *  so everyone sees new orders appear without reloading. */
export function useGroupOrder() {
  const [group, setGroup] = useState(undefined); // undefined = loading, null = none yet
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    try {
      setGroup(await api.getCurrent());
      setError('');
    } catch (e) {
      setError('Can’t reach the server. Is the backend running on port 3000?');
    }
  }, []);

  useEffect(() => {
    refresh();
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  return { group, setGroup, error, refresh };
}
