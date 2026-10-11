import Link from "next/link";
import { Brand } from "@/components/Brand";

// Welcome screen: students go to the chat, admins to the materials dashboard.
export default function HomePage() {
  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-7xl items-center px-4 py-3">
          <Brand />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Learn from your class materials</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Ask questions and get answers taken straight from the books and notes uploaded for your class.
          </p>

          <div className="mt-10 grid gap-4 text-left sm:grid-cols-2">
            <Choice
              href="/student"
              title="I'm a student"
              text="Enter your Class ID and Subject ID, then ask anything about your study materials."
              action="Start studying"
              primary
            />
            <Choice
              href="/admin"
              title="Admin"
              text="Upload materials, see how they are split into topics, and fix unfinished uploads."
              action="Go to dashboard"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function Choice({ href, title, text, action, primary }: { href: string; title: string; text: string; action: string; primary?: boolean }) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-2xl border border-line bg-surface p-6 shadow-sm transition hover:border-brand hover:shadow-md"
    >
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{text}</p>
      <span
        className={`mt-5 inline-flex w-fit items-center gap-1 rounded-xl px-4 py-2 text-sm font-semibold transition ${
          primary ? "bg-brand text-white group-hover:opacity-90" : "bg-subtle text-ink group-hover:bg-brand-soft group-hover:text-brand"
        }`}
      >
        {action} →
      </span>
    </Link>
  );
}
