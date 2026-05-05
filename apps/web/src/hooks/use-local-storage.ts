import type { Dispatch, SetStateAction } from "react";
import { useCallback, useEffect, useState } from "react";

function readStoredValue<T>(key: string, initialValue: T) {
  if (typeof window === "undefined") {
    return initialValue;
  }

  const item = window.localStorage.getItem(key);
  return item ? (JSON.parse(item) as T) : initialValue;
}

export function useLocalStorage<T>(
  key: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState(() => readStoredValue(key, initialValue));

  useEffect(() => {
    setStoredValue(readStoredValue(key, initialValue));
  }, [initialValue, key]);

  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (value) => {
      setStoredValue((currentValue) => {
        const nextValue = value instanceof Function ? value(currentValue) : value;
        window.localStorage.setItem(key, JSON.stringify(nextValue));
        return nextValue;
      });
    },
    [key],
  );

  return [storedValue, setValue];
}
