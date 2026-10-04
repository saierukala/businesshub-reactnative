import { useEffect, useState } from 'react';

// Waits until the user stops typing before the value changes, so a search is not sent on every keystroke.
export function useDebounced<T>(value: T, ms = 350): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}
