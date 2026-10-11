"use client";

import { useEffect, useState } from "react";
import { getChunks, type ChunkItem, type DocumentItem } from "@/lib/api";

// Slide-over panel showing how a document was split: every topic chunk, grouped by
// the ~400-word part it came from.
export function ChunkPanel({ document, onClose }: { document: DocumentItem; onClose: () => void }) {
  const [chunks, setChunks] = useState<ChunkItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getChunks(document.id)
      .then((result) => {
        if (!cancelled) setChunks(result);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [document.id]);

  // Close with the Escape key.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const groups = new Map<number, ChunkItem[]>();
  for (const chunk of chunks ?? []) {
    const list = groups.get(chunk.sourceChunkIndex) ?? [];
    list.push(chunk);
    groups.set(chunk.sourceChunkIndex, list);
  }
  const topics = new Set((chunks ?? []).map((c) => c.topic ?? "General"));

  return (
    <div className="fixed inset-0 z-50">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="absolute inset-y-0 right-0 flex w-full max-w-2xl flex-col bg-surface shadow-2xl">
        <div className="flex items-start gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold">{document.fileName}</h2>
            <p className="text-sm text-muted">
              Class {document.classId} · Subject {document.subjectId}
              {chunks && ` · ${chunks.length} chunks · ${topics.size} topics`}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-2 py-1 text-muted hover:bg-subtle" aria-label="Close">
            ✕
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {error && <p className="rounded-xl bg-danger-soft px-4 py-3 text-sm text-danger">{error}</p>}
          {!chunks && !error && <p className="text-sm text-muted">Loading chunks…</p>}
          {chunks && chunks.length === 0 && (
            <p className="text-sm text-muted">No chunks yet. Use &ldquo;Continue&rdquo; to process this document.</p>
          )}

          {[...groups.entries()].map(([source, list]) => (
            <section key={source} className="mb-5">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
                Part {source + 1} (~400 words) → {list.length} topic chunk{list.length === 1 ? "" : "s"}
              </h3>
              <ul className="flex flex-col gap-2">
                {list.map((chunk) => {
                  const isOpen = open === chunk.id;
                  return (
                    <li key={chunk.id} className="rounded-xl border border-line bg-subtle">
                      <button
                        type="button"
                        onClick={() => setOpen(isOpen ? null : chunk.id)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left"
                        aria-expanded={isOpen}
                      >
                        <span className="grid h-6 min-w-6 place-items-center rounded-md bg-surface px-1 text-xs font-semibold text-brand">
                          {chunk.chunkIndex + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate font-medium">{chunk.topic ?? "General"}</span>
                        <span className="shrink-0 text-xs text-muted">{chunk.wordCount} words</span>
                        <span className={`shrink-0 text-muted transition ${isOpen ? "rotate-180" : ""}`}>▾</span>
                      </button>
                      {isOpen && (
                        <p className="whitespace-pre-line border-t border-line px-4 py-3 text-sm leading-relaxed text-muted">
                          {chunk.content}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      </aside>
    </div>
  );
}
