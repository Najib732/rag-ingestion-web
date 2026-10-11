"use client";

// The student's Student ID + Class ID + Subject ID. Remembered on this device so they don't
// have to enter it again. null = the student has not entered it yet.

import { createContext, useContext } from "react";
import { studentScopeStore } from "@/lib/browserStore";

export interface StudentScope {
  studentId: string; // UUID
  classId: number;
  subjectId: number;
}

interface ScopeState {
  scope: StudentScope | null;
  join: (studentId: string, classId: number, subjectId: number) => void;
  leave: () => void;
}

const ScopeContext = createContext<ScopeState | null>(null);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID.test(value);
}

function parse(raw: string | null): StudentScope | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (isUuid(value.studentId) && Number.isInteger(value.classId) && Number.isInteger(value.subjectId)) return value;
  } catch {
    // Invalid saved value — ask again.
  }
  return null;
}

export function ScopeProvider({ children }: { children: React.ReactNode }) {
  const raw = studentScopeStore.useValue();

  // Not read yet (server render) — show nothing instead of flashing the join form.
  if (raw === undefined) return null;

  const state: ScopeState = {
    scope: parse(raw),
    join: (studentId, classId, subjectId) => studentScopeStore.set(JSON.stringify({ studentId, classId, subjectId })),
    leave: () => studentScopeStore.set(null),
  };

  return <ScopeContext.Provider value={state}>{children}</ScopeContext.Provider>;
}

export function useScope(): ScopeState {
  const state = useContext(ScopeContext);
  if (!state) throw new Error("useScope must be used inside ScopeProvider");
  return state;
}
