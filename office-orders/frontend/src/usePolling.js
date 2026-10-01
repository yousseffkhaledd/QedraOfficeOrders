import { useCallback, useEffect, useState } from 'react';

const POLL_MS = 4000;

/** Loads data and reloads it every few seconds, so everyone sees changes
 *  without refreshing. `key` restarts it when it changes (e.g. a different group). */
export function usePolling(load, key) {
    const [data, setData] = useState(undefined); // undefined = still loading
    const [error, setError] = useState('');

    // eslint-disable-next-line react-hooks/exhaustive-deps
    const refresh = useCallback(async () => {
        try {
            setData(await load());
            setError('');
        } catch (e) {
            setError(e.message);
        }
    }, [key]);

    useEffect(() => {
        setData(undefined);
        refresh();
        const t = setInterval(refresh, POLL_MS);
        return () => clearInterval(t);
    }, [refresh]);

    return { data, setData, error };
}