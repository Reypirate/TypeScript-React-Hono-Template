import type { Root } from "react-dom/client";

import { act, createElement, Fragment } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useLocalStorage } from "./use-local-storage";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let container: HTMLDivElement;
let root: Root;

function Counter({ storageKey = "count", initialValue = 0 }) {
  const [value, setValue] = useLocalStorage(storageKey, initialValue);
  return createElement("button", { onClick: () => setValue((current) => current + 1) }, value);
}

beforeEach(() => {
  window.localStorage.clear();
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

describe("useLocalStorage", () => {
  it("reads persisted values and applies functional updates", () => {
    window.localStorage.setItem("count", "3");
    act(() => root.render(createElement(Counter)));
    expect(container.textContent).toBe("3");
    act(() => container.querySelector("button")?.click());
    expect(container.textContent).toBe("4");
    expect(window.localStorage.getItem("count")).toBe("4");
  });

  it("synchronizes components using the same key in one tab", () => {
    act(() =>
      root.render(createElement(Fragment, null, createElement(Counter), createElement(Counter))),
    );
    act(() => container.querySelector("button")?.click());
    expect([...container.querySelectorAll("button")].map((button) => button.textContent)).toEqual([
      "1",
      "1",
    ]);
  });

  it("reacts to cross-tab changes and storage clears", () => {
    act(() => root.render(createElement(Counter)));
    act(() => {
      window.localStorage.setItem("count", "8");
      window.dispatchEvent(
        new StorageEvent("storage", { key: "count", storageArea: window.localStorage }),
      );
    });
    expect(container.textContent).toBe("8");
    act(() => {
      window.localStorage.clear();
      window.dispatchEvent(
        new StorageEvent("storage", { key: null, storageArea: window.localStorage }),
      );
    });
    expect(container.textContent).toBe("0");
  });

  it("switches keys without retaining the previous key's value", () => {
    window.localStorage.setItem("first", "5");
    window.localStorage.setItem("second", "9");
    act(() => root.render(createElement(Counter, { storageKey: "first" })));
    expect(container.textContent).toBe("5");
    act(() => root.render(createElement(Counter, { storageKey: "second" })));
    expect(container.textContent).toBe("9");
  });

  it("uses the fallback for malformed or inaccessible storage", () => {
    window.localStorage.setItem("count", "invalid JSON");
    act(() => root.render(createElement(Counter, { initialValue: 7 })));
    expect(container.textContent).toBe("7");
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("Storage blocked");
    });
    act(() => root.render(createElement(Counter, { initialValue: 6 })));
    expect(container.textContent).toBe("6");
  });
});
