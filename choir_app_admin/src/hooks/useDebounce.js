import { useEffect, useRef } from 'react';

export default function useDebounce(value, delay, callback) {
  const timer = useRef(null);
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { if (callback) callback(value); }, delay || 300);
    return () => clearTimeout(timer.current);
  }, [value, delay]);
}
