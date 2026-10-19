import type { Root } from "react-dom/client";

import * as Menu from "@radix-ui/react-context-menu";
import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

async function openMenu(onSelect: () => void, onDisabledSelect: () => void) {
  await act(() => {
    root.render(
      createElement(
        Menu.Root,
        { modal: false },
        createElement(
          Menu.Trigger,
          { asChild: true },
          createElement("button", { type: "button" }, "Open menu"),
        ),
        createElement(
          Menu.Portal,
          null,
          createElement(
            Menu.Content,
            null,
            createElement(Menu.Item, { onSelect }, "Edit"),
            createElement(Menu.Item, { disabled: true, onSelect: onDisabledSelect }, "Delete"),
          ),
        ),
      ),
    );
  });
  await act(() => {
    container.querySelector("button")?.dispatchEvent(
      new MouseEvent("contextmenu", {
        button: 2,
        bubbles: true,
        cancelable: true,
        clientX: 20,
        clientY: 20,
      }),
    );
  });
  expect(document.querySelector('[role="menu"]')).not.toBeNull();
}

describe("Radix context menu compatibility", () => {
  it("opens on right-click, ignores disabled items, and closes after selection", async () => {
    const onSelect = vi.fn();
    const onDisabledSelect = vi.fn();
    await openMenu(onSelect, onDisabledSelect);
    const items = document.querySelectorAll<HTMLElement>('[role="menuitem"]');
    expect([...items].map((item) => item.textContent)).toEqual(["Edit", "Delete"]);
    await act(() => items[1].click());
    expect(onDisabledSelect).not.toHaveBeenCalled();
    expect(document.querySelector('[role="menu"]')).not.toBeNull();
    await act(() => items[0].click());
    expect(onSelect).toHaveBeenCalledOnce();
    expect(document.querySelector('[role="menu"]')).toBeNull();
  });

  it("dismisses with Escape without selecting an item", async () => {
    const onSelect = vi.fn();
    await openMenu(onSelect, vi.fn());
    await act(() => {
      document
        .querySelector('[role="menu"]')
        ?.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
        );
    });
    expect(document.querySelector('[role="menu"]')).toBeNull();
    expect(onSelect).not.toHaveBeenCalled();
  });
});
