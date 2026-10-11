"use client";

import { useState } from "react";
import { Brand } from "@/components/Brand";
import { checkAdminPassword } from "@/lib/api";
import { adminKeyStore } from "@/lib/browserStore";

// Shows the password form until the admin has logged in, then the admin pages.
// The password is checked against the backend and kept only for this browser tab.
export function AdminGate({ children }: { children: React.ReactNode }) {
  const key = adminKeyStore.useValue();

  if (key === undefined) return null; // not read yet
  if (!key) return <LoginForm />;

  return <>{children}</>;
}

function LoginForm() {
  const [password, setPassword] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;

    setChecking(true);
    setError(null);
    try {
      // Save the password only after the server accepted it (saving switches to the dashboard).
      if (await checkAdminPassword(password)) {
        adminKeyStore.set(password);
        return;
      }
      setError("Wrong password. Please try again.");
    } catch (err) {
      setError((err as Error).message);
    }
    setChecking(false);
  }

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-7xl items-center px-4 py-3">
          <Brand suffix="Admin" />
        </div>
      </header>
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-line bg-surface p-6 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight">Admin sign in</h1>
          <p className="mt-1 text-sm text-muted">Manage study materials and how they are split into topics.</p>
          <label className="mt-5 block">
            <span className="text-sm font-medium">Admin password</span>
            <input
              type="password"
              value={password}
              autoFocus
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-line bg-background px-3 py-2.5 outline-none focus:border-brand"
            />
          </label>
          {error && <p className="mt-3 text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={checking || !password}
            className="mt-5 w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
          >
            {checking ? "Checking…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
