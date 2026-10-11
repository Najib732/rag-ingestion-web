"use client";

import type { ChatSession } from "@/lib/api";

// List of previous chats for the selected class + subject.
export function ChatSidebar({
  sessions,
  activeId,
  loading,
  onSelect,
  onNew,
}: {
  sessions: ChatSession[];
  activeId: string | null;
  loading: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <button
          type="button"
          onClick={onNew}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-3 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <span className="text-base leading-none">+</span> New chat
        </button>
      </div>

      <p className="px-4 pb-2 text-xs font-semibold uppercase tracking-wide text-muted">Previous chats</p>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {loading && <p className="px-2 py-2 text-sm text-muted">Loading…</p>}
        {!loading && sessions.length === 0 && (
          <p className="px-2 py-2 text-sm text-muted">No chats yet. Ask your first question!</p>
        )}
        <ul className="flex flex-col gap-0.5">
          {sessions.map((session) => (
            <li key={session.id}>
              <button
                type="button"
                onClick={() => onSelect(session.id)}
                className={`w-full rounded-lg px-3 py-2 text-left text-sm transition ${
                  session.id === activeId ? "bg-brand-soft font-medium text-brand" : "hover:bg-subtle"
                }`}
              >
                <span className="line-clamp-2">{session.title}</span>
                <span className="mt-0.5 block text-xs text-muted">{formatDate(session.createdAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}
