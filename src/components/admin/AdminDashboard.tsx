"use client";

import { useCallback, useEffect, useState } from "react";
import { Brand } from "@/components/Brand";
import { StatusBadge } from "@/components/documents/StatusBadge";
import {
  ApiError,
  deleteDocument,
  listDocuments,
  processDocument,
  uploadDocument,
  type DocumentItem,
  type IngestionResult,
} from "@/lib/api";
import { adminKeyStore } from "@/lib/browserStore";
import { ChunkPanel } from "./ChunkPanel";
import { UploadCard } from "./UploadCard";

interface Notice {
  kind: "success" | "warning" | "error";
  text: string;
}

interface Filter {
  classId?: number;
  subjectId?: number;
}

export function AdminDashboard() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>({});
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<DocumentItem | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  // Wrong/expired password → back to the sign-in form.
  const handleError = useCallback((e: unknown) => {
    if (e instanceof ApiError && e.status === 401) {
      adminKeyStore.set(null);
      return;
    }
    setNotice({ kind: "error", text: (e as Error).message });
  }, []);

  const refresh = useCallback(async () => {
    try {
      setDocuments(await listDocuments(filter.classId, filter.subjectId));
    } catch (e) {
      handleError(e);
    }
  }, [filter, handleError]);

  // Load the list whenever the filter changes.
  useEffect(() => {
    let cancelled = false;
    listDocuments(filter.classId, filter.subjectId)
      .then((docs) => {
        if (!cancelled) setDocuments(docs);
      })
      .catch((e) => {
        if (!cancelled) handleError(e);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [filter, handleError]);

  function showResult(fileName: string, result: IngestionResult) {
    if (result.status === "Completed") {
      setNotice({ kind: "success", text: `"${fileName}" is ready: ${result.finalChunks} topic chunks created.` });
    } else {
      setNotice({
        kind: "warning",
        text:
          `"${fileName}" stopped after ${result.processedSourceChunks} of ${result.totalSourceChunks} parts. ` +
          `Saved work is kept — press "Continue" to finish.${result.error ? ` Reason: ${result.error}` : ""}`,
      });
    }
  }

  async function upload(file: File, classId: number, subjectId: number) {
    setUploading(true);
    setNotice(null);
    try {
      showResult(file.name, await uploadDocument(file, classId, subjectId));
    } catch (e) {
      handleError(e);
    } finally {
      setUploading(false);
      refresh();
    }
  }

  async function continueProcessing(doc: DocumentItem) {
    setBusyId(doc.id);
    setNotice(null);
    try {
      showResult(doc.fileName, await processDocument(doc.id));
    } catch (e) {
      handleError(e);
    } finally {
      setBusyId(null);
      refresh();
    }
  }

  async function remove(doc: DocumentItem) {
    setBusyId(doc.id);
    setConfirmDeleteId(null);
    setNotice(null);
    try {
      await deleteDocument(doc.id);
      setNotice({ kind: "success", text: `"${doc.fileName}" and its chunks were deleted.` });
    } catch (e) {
      handleError(e);
    } finally {
      setBusyId(null);
      refresh();
    }
  }

  const ready = documents.filter((d) => d.status === "Completed").length;
  const unfinished = documents.length - ready;
  const totalChunks = documents.reduce((sum, d) => sum + d.chunkCount, 0);

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3">
          <Brand suffix="Admin" />
          <button
            type="button"
            onClick={() => adminKeyStore.set(null)}
            className="ml-auto rounded-lg px-3 py-1.5 text-sm font-medium text-muted hover:bg-subtle hover:text-ink"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">Study materials</h1>
        <p className="mt-1 text-muted">Upload materials for each class and subject, and check how they were split into topics.</p>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat label="Documents" value={documents.length} />
          <Stat label="Ready" value={ready} tone="success" />
          <Stat label="Not finished" value={unfinished} tone={unfinished > 0 ? "warning" : undefined} />
          <Stat label="Topic chunks" value={totalChunks} />
        </div>

        {notice && <NoticeBanner notice={notice} onClose={() => setNotice(null)} />}

        <div className="mt-6 grid gap-6 lg:grid-cols-[340px_1fr]">
          <div>
            <UploadCard uploading={uploading} onUpload={upload} />
          </div>

          <div className="rounded-2xl border border-line bg-surface shadow-sm">
            <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
              <h2 className="mr-auto text-lg font-semibold">All documents</h2>
              <FilterInput label="Class" value={filter.classId} onChange={(v) => setFilter({ ...filter, classId: v })} />
              <FilterInput label="Subject" value={filter.subjectId} onChange={(v) => setFilter({ ...filter, subjectId: v })} />
              <button type="button" onClick={() => refresh()} className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:bg-subtle">
                Refresh
              </button>
            </div>

            {loading && <p className="px-5 py-10 text-center text-sm text-muted">Loading…</p>}
            {!loading && documents.length === 0 && (
              <div className="px-5 py-12 text-center">
                <p className="font-medium">No documents</p>
                <p className="mt-1 text-sm text-muted">
                  {filter.classId || filter.subjectId ? "Nothing matches this filter." : "Upload the first material on the left."}
                </p>
              </div>
            )}

            <ul className="divide-y divide-line">
              {documents.map((doc) => {
                const busy = busyId === doc.id;
                const confirming = confirmDeleteId === doc.id;
                return (
                  <li key={doc.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5">
                    <div className="min-w-0 flex-1 basis-56">
                      <p className="truncate font-medium">{doc.fileName}</p>
                      <p className="text-sm text-muted">
                        Class {doc.classId} · Subject {doc.subjectId} · {doc.chunkCount} chunks · {formatDate(doc.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={busy && !confirming ? "Processing" : doc.status} />
                    <div className="flex gap-1.5">
                      {confirming ? (
                        <>
                          <button type="button" onClick={() => remove(doc)} className="rounded-lg bg-danger px-3 py-1.5 text-sm font-semibold text-white">
                            Delete
                          </button>
                          <button type="button" onClick={() => setConfirmDeleteId(null)} className="rounded-lg border border-line px-3 py-1.5 text-sm">
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setViewing(doc)}
                            disabled={doc.chunkCount === 0}
                            className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium hover:bg-subtle disabled:opacity-40"
                          >
                            View chunks
                          </button>
                          {doc.status !== "Completed" && (
                            <button
                              type="button"
                              onClick={() => continueProcessing(doc)}
                              disabled={busyId !== null || uploading}
                              className="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-40"
                            >
                              {busy ? "Working…" : "Continue"}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(doc.id)}
                            disabled={busyId !== null}
                            className="rounded-lg px-3 py-1.5 text-sm font-medium text-danger hover:bg-danger-soft disabled:opacity-40"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </main>

      {viewing && <ChunkPanel document={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "success" | "warning" }) {
  const color = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-ink";
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3 shadow-sm">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${color}`}>{value}</p>
    </div>
  );
}

// Empty = no filter. Applied on Enter or when leaving the box.
function FilterInput({ label, value, onChange }: { label: string; value?: number; onChange: (v?: number) => void }) {
  const [draft, setDraft] = useState(value?.toString() ?? "");

  function commit() {
    const next = draft === "" ? undefined : Number(draft);
    if (next !== value) onChange(next);
  }

  return (
    <label className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm focus-within:border-brand">
      <span className="text-muted">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        value={draft}
        placeholder="All"
        onChange={(e) => setDraft(e.target.value.replace(/[^0-9]/g, ""))}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className="w-10 bg-transparent font-semibold outline-none placeholder:font-normal placeholder:text-muted"
        aria-label={`Filter by ${label}`}
      />
    </label>
  );
}

function NoticeBanner({ notice, onClose }: { notice: Notice; onClose: () => void }) {
  const styles = {
    success: "border-success/30 bg-success-soft text-success",
    warning: "border-warning/30 bg-warning-soft text-warning",
    error: "border-danger/30 bg-danger-soft text-danger",
  };
  return (
    <div className={`mt-6 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${styles[notice.kind]}`} role="status">
      <p className="flex-1">{notice.text}</p>
      <button type="button" onClick={onClose} className="font-semibold opacity-70 hover:opacity-100" aria-label="Dismiss">
        ✕
      </button>
    </div>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
}
