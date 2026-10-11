"use client";

import { useState } from "react";
import type { Source } from "@/lib/api";

// The book passages the answer was based on. Each one can be opened to read the full text.
export function SourceList({
  sources,
  highlighted,
}: {
  sources: Source[];
  highlighted: number | null;
}) {
  const [open, setOpen] = useState<number | null>(null);

  if (sources.length === 0) return null;

  return (
    <div className="mt-3 border-t border-line pt-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Sources from your materials</p>
      <ul className="flex flex-col gap-1.5">
        {sources.map((source, i) => {
          const number = i + 1;
          const isOpen = open === number || highlighted === number;
          return (
            <li
              key={source.chunkId}
              className={`rounded-lg border transition ${
                highlighted === number ? "border-brand bg-brand-soft" : "border-line bg-subtle"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : number)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
                aria-expanded={isOpen}
              >
                <span className="grid h-5 min-w-5 place-items-center rounded-md bg-surface text-[11px] font-semibold text-brand">
                  {number}
                </span>
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-medium">{source.topic ?? "General"}</span>
                  <span className="text-muted"> · {source.fileName}</span>
                </span>
                <span className="shrink-0 text-xs text-muted" title="How closely this passage matches the question">
                  {Math.round(source.similarity * 100)}% match
                </span>
                <span className={`shrink-0 text-muted transition ${isOpen ? "rotate-180" : ""}`}>▾</span>
              </button>
              {isOpen && (
                <p className="whitespace-pre-line border-t border-line px-3 py-2 text-sm leading-relaxed text-muted">
                  {source.content}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
