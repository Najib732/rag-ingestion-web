"use client";

import { useSyncExternalStore } from "react";

// A value saved in the browser (localStorage or sessionStorage) that React components can read.
// Every component using it updates when it changes. Falls back to memory if storage is blocked.
export function createStoredValue(kind: "local" | "session", key: string) {
  const changeEvent = `stored-value:${key}`;
  let memory: string | null = null;

  function storage(): Storage {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  }

  function get(): string | null {
    try {
      return storage().getItem(key);
    } catch {
      return memory;
    }
  }

  function set(value: string | null) {
    memory = value;
    try {
      if (value === null) storage().removeItem(key);
      else storage().setItem(key, value);
    } catch {
      // Storage blocked — the value lives in memory until the page is closed.
    }
    window.dispatchEvent(new Event(changeEvent));
  }

  function subscribe(onChange: () => void) {
    window.addEventListener(changeEvent, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(changeEvent, onChange);
      window.removeEventListener("storage", onChange);
    };
  }

  // undefined = not read yet (server render); null = nothing saved.
  function useValue(): string | null | undefined {
    return useSyncExternalStore(subscribe, get, () => undefined);
  }

  return { get, set, useValue };
}

// The admin password is kept only for this browser tab (sessionStorage).
export const adminKeyStore = createStoredValue("session", "rag-admin-key");

// The student's ID, class + subject are remembered on this device (localStorage).
export const studentScopeStore = createStoredValue("local", "rag-student-scope");
