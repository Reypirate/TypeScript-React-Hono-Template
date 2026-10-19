import type { Dispatch, SetStateAction } from "react";

import { useCallback, useMemo, useSyncExternalStore } from "react";

function readSnapshot(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parseValue<T>(snapshot: string | null, initialValue: T): T {
  if (snapshot === null) return initialValue;
  try {
    return JSON.parse(snapshot) as T;
  } catch {
    return initialValue;
  }
}

export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const listener = (event: StorageEvent) => {
        if (event.storageArea === window.localStorage && (event.key === key || event.key === null))
          onChange();
      };
      window.addEventListener("storage", listener);
      return () => window.removeEventListener("storage", listener);
    },
    [key],
  );
  // Subscribe to the stable serialized value; parsing inside getSnapshot would create new objects.
  const snapshot = useSyncExternalStore(
    subscribe,
    () => readSnapshot(key),
    () => null,
  );
  const storedValue = useMemo(() => parseValue(snapshot, initialValue), [snapshot, initialValue]);
  const setValue: Dispatch<SetStateAction<T>> = useCallback(
    (value) => {
      const currentValue = parseValue(readSnapshot(key), initialValue);
      const nextValue =
        typeof value === "function" ? (value as (previous: T) => T)(currentValue) : value;
      window.localStorage.setItem(key, JSON.stringify(nextValue));
      // Native storage events reach other tabs; notify subscribers in this tab as well.
      window.dispatchEvent(new StorageEvent("storage", { key, storageArea: window.localStorage }));
    },
    [key, initialValue],
  );
  return [storedValue, setValue];
}
