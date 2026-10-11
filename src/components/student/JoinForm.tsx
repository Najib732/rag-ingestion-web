"use client";

import { useState } from "react";
import { isUuid, useScope } from "@/components/ScopeProvider";

// The student types their Student ID and the Class ID + Subject ID given by their teacher.
export function JoinForm() {
  const { join } = useScope();
  const [studentId, setStudentId] = useState("");
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const st = studentId.trim().toLowerCase();
    const c = Number(classId);
    const s = Number(subjectId);
    if (!isUuid(st)) {
      setError("That Student ID doesn't look right. It should look like 8f1c2a3b-1234-5678-9abc-def012345678.");
      return;
    }
    if (![c, s].every((n) => Number.isInteger(n) && n > 0)) {
      setError("Please enter both numbers. Ask your teacher if you don't know them.");
      return;
    }
    join(st, c, s);
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-10">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-xl font-bold text-brand">S</span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">Start studying</h1>
        <p className="mt-1 text-sm text-muted">Enter your student ID and the class and subject your teacher gave you.</p>

        <label className="mt-4 block">
          <span className="text-sm font-medium">Student ID</span>
          <input
            type="text"
            value={studentId}
            autoFocus
            spellCheck={false}
            autoComplete="off"
            onChange={(e) => setStudentId(e.target.value)}
            placeholder="e.g. 8f1c2a3b-1234-5678-9abc-def012345678"
            className="mt-1 w-full rounded-xl border border-line bg-background px-3 py-2.5 font-mono text-sm outline-none focus:border-brand"
          />
        </label>
        <NumberField label="Class ID" value={classId} onChange={setClassId} />
        <NumberField label="Subject ID" value={subjectId} onChange={setSubjectId} />

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}

        <button
          type="submit"
          className="mt-5 w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Continue
        </button>
      </form>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  autoFocus?: boolean;
}) {
  return (
    <label className="mt-4 block">
      <span className="text-sm font-medium">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
        placeholder="e.g. 7"
        className="mt-1 w-full rounded-xl border border-line bg-background px-3 py-2.5 outline-none focus:border-brand"
      />
    </label>
  );
}
