"use client";

import { Brand } from "@/components/Brand";
import { ChatView } from "@/components/chat/ChatView";
import { useScope } from "@/components/ScopeProvider";
import { JoinForm } from "./JoinForm";

// Student area: first ask for Student ID + Class ID + Subject ID, then show the chat.
export function StudentApp() {
  const { scope, leave } = useScope();

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Brand />
          {scope && (
            <div className="ml-auto flex items-center gap-2 text-sm">
              <span className="rounded-lg bg-subtle px-3 py-1.5">
                Student <strong>{scope.studentId}</strong>
                <span className="mx-2 text-muted">·</span>
                Class <strong>{scope.classId}</strong>
                <span className="mx-2 text-muted">·</span>
                Subject <strong>{scope.subjectId}</strong>
              </span>
              <button type="button" onClick={leave} className="rounded-lg px-3 py-1.5 font-medium text-brand hover:bg-brand-soft">
                Change
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col">
        {scope ? (
          // key: switching student/class/subject starts the chat fresh
          <ChatView
            key={`${scope.studentId}-${scope.classId}-${scope.subjectId}`}
            userId={scope.studentId}
            classId={scope.classId}
            subjectId={scope.subjectId}
          />
        ) : (
          <JoinForm />
        )}
      </main>
    </div>
  );
}
