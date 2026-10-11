"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { askQuestion, getMessages, listSessions, type ChatSession, type Source } from "@/lib/api";
import { AnswerContent } from "./AnswerContent";
import { ChatInput } from "./ChatInput";
import { ChatSidebar } from "./ChatSidebar";
import { SourceList } from "./SourceList";

// One message on screen. Sources only exist for answers given in this visit
// (the backend does not store them with the chat history).
interface UiMessage {
  id: string;
  role: "User" | "Assistant";
  content: string;
  sources?: Source[];
  pending?: boolean;
  error?: string;
  question?: string; // for "Try again" on a failed answer
  questionId?: string; // the question bubble that belongs to a failed answer
}

const SUGGESTIONS = [
  "Summarize the main topics in simple words",
  "Explain the most important terms",
  "Give me 5 practice questions with answers",
];

export function ChatView({ userId, classId, subjectId }: { userId: string; classId: number; subjectId: number }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [highlight, setHighlight] = useState<{ messageId: string; index: number } | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  // Ignores answers to an older chat if the user switched chats meanwhile.
  const viewVersion = useRef(0);

  const refreshSessions = useCallback(async () => {
    try {
      setSessions(await listSessions(userId, classId, subjectId));
      setPageError(null);
    } catch (e) {
      setPageError((e as Error).message);
    } finally {
      setSessionsLoading(false);
    }
  }, [userId, classId, subjectId]);

  // Load this class/subject's previous chats.
  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

  // Keep the newest message in view.
  useEffect(() => {
    if (messages.length === 0) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function startNewChat() {
    viewVersion.current++;
    setActiveId(null);
    setMessages([]);
    setSidebarOpen(false);
  }

  async function openSession(id: string) {
    const version = ++viewVersion.current;
    setActiveId(id);
    setSidebarOpen(false);
    setHistoryLoading(true);
    setMessages([]);
    try {
      const history = await getMessages(id);
      if (version !== viewVersion.current) return;
      setMessages(history.map((m) => ({ id: m.id, role: m.role, content: m.content })));
    } catch (e) {
      if (version === viewVersion.current) setPageError((e as Error).message);
    } finally {
      if (version === viewVersion.current) setHistoryLoading(false);
    }
  }

  async function send(question: string) {
    const version = viewVersion.current;
    const pendingId = crypto.randomUUID();
    const questionId = crypto.randomUUID();

    setSending(true);
    setMessages((prev) => {
      // Drop an earlier failed answer and its question (they were never saved on the server).
      const failed = new Set<string>();
      for (const m of prev) {
        if (m.error) {
          failed.add(m.id);
          if (m.questionId) failed.add(m.questionId);
        }
      }
      return [
        ...prev.filter((m) => !failed.has(m.id)),
        { id: questionId, role: "User", content: question },
        { id: pendingId, role: "Assistant", content: "", pending: true },
      ];
    });

    try {
      const response = await askQuestion(activeId, userId, classId, subjectId, question);
      if (version !== viewVersion.current) return;

      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId ? { id: pendingId, role: "Assistant", content: response.answer, sources: response.sources } : m,
        ),
      );

      // First question of a new chat → it now has an id and appears in the list.
      if (activeId === null) {
        setActiveId(response.sessionId);
        refreshSessions();
      }
    } catch (e) {
      if (version !== viewVersion.current) return;
      // Show the error in place of the answer, with a "Try again" button.
      setMessages((prev) =>
        prev.map((m) =>
          m.id === pendingId
            ? { id: pendingId, role: "Assistant", content: "", error: (e as Error).message, question, questionId }
            : m,
        ),
      );
    } finally {
      setSending(false);
    }
  }

  const isEmpty = messages.length === 0 && !historyLoading;

  return (
    <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1">
      {/* Sidebar: always visible on desktop, slide-over on mobile */}
      <aside className="hidden w-72 shrink-0 border-r border-line bg-surface md:block">
        <ChatSidebar sessions={sessions} activeId={activeId} loading={sessionsLoading} onSelect={openSession} onNew={startNewChat} />
      </aside>
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <button type="button" aria-label="Close chats" className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-surface shadow-xl">
            <ChatSidebar sessions={sessions} activeId={activeId} loading={sessionsLoading} onSelect={openSession} onNew={startNewChat} />
          </aside>
        </div>
      )}

      <section className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-line px-4 py-2 md:hidden">
          <button type="button" onClick={() => setSidebarOpen(true)} className="rounded-lg border border-line px-3 py-1.5 text-sm">
            ☰ Chats
          </button>
          <button type="button" onClick={startNewChat} className="rounded-lg px-3 py-1.5 text-sm text-brand">
            + New chat
          </button>
        </div>

        {pageError && (
          <div className="mx-4 mt-4 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
            {pageError}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
            {historyLoading && <p className="text-center text-sm text-muted">Loading conversation…</p>}

            {isEmpty && (
              <EmptyState classId={classId} subjectId={subjectId} disabled={sending} onPick={send} />
            )}

            {messages.map((message) =>
              message.role === "User" ? (
                <div key={message.id} className="flex justify-end">
                  <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-brand px-4 py-2.5 text-[15px] text-white">
                    {message.content}
                  </div>
                </div>
              ) : (
                <div key={message.id} className="flex gap-3">
                  <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-soft text-sm font-bold text-brand">
                    S
                  </span>
                  <div className="min-w-0 flex-1 rounded-2xl rounded-tl-md border border-line bg-surface px-4 py-3 shadow-sm">
                    {message.pending && <Thinking />}
                    {message.error && (
                      <div className="text-sm">
                        <p className="font-medium text-danger">Sorry, the answer could not be generated.</p>
                        <p className="mt-1 text-muted">{message.error}</p>
                        <button
                          type="button"
                          disabled={sending}
                          onClick={() => send(message.question!)}
                          className="mt-3 rounded-lg border border-line px-3 py-1.5 font-medium hover:bg-subtle disabled:opacity-40"
                        >
                          Try again
                        </button>
                      </div>
                    )}
                    {!message.pending && !message.error && (
                      <>
                        <AnswerContent
                          content={message.content}
                          sourceCount={message.sources?.length ?? 0}
                          onCite={(index) => setHighlight({ messageId: message.id, index })}
                        />
                        <SourceList
                          sources={message.sources ?? []}
                          highlighted={highlight?.messageId === message.id ? highlight.index : null}
                        />
                      </>
                    )}
                  </div>
                </div>
              ),
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <div className="border-t border-line bg-background px-4 py-3">
          <div className="mx-auto max-w-3xl">
            <ChatInput disabled={sending} onSend={send} />
            <p className="mt-2 text-center text-xs text-muted">
              Answers come only from the materials uploaded for Class {classId}, Subject {subjectId}.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function EmptyState({
  classId,
  subjectId,
  disabled,
  onPick,
}: {
  classId: number;
  subjectId: number;
  disabled: boolean;
  onPick: (q: string) => void;
}) {
  return (
    <div className="flex flex-col items-center py-10 text-center">
      <span className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-soft text-2xl font-bold text-brand">S</span>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight">What would you like to learn?</h1>
      <p className="mt-2 max-w-md text-muted">
        Ask a question about the study materials for Class {classId}, Subject {subjectId}. Answers show exactly
        which part of the material they came from.
      </p>
      <div className="mt-6 flex w-full max-w-xl flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            disabled={disabled}
            onClick={() => onPick(s)}
            className="rounded-xl border border-line bg-surface px-4 py-2.5 text-sm transition hover:border-brand hover:text-brand disabled:opacity-40"
          >
            {s}
          </button>
        ))}
      </div>
      <p className="mt-8 max-w-md text-sm text-muted">
        If you keep getting &ldquo;could not find&rdquo; answers, check the Class and Subject ID with your teacher.
      </p>
    </div>
  );
}

function Thinking() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted" role="status">
      <span className="flex gap-1">
        <span className="h-2 w-2 animate-bounce rounded-full bg-brand [animation-delay:-0.3s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-brand [animation-delay:-0.15s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-brand" />
      </span>
      Reading your materials…
    </div>
  );
}
