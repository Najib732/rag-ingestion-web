"use client";

import { useRef, useState } from "react";

const ACCEPTED = [".txt", ".md"];
const MAX_MB = 25;

// Admin chooses the class + subject, then drops a file to upload.
export function UploadCard({
  uploading,
  onUpload,
}: {
  uploading: boolean;
  onUpload: (file: File, classId: number, subjectId: number) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function choose(chosen: File | undefined) {
    setError(null);
    if (!chosen) return;

    const extension = chosen.name.slice(chosen.name.lastIndexOf(".")).toLowerCase();
    if (!ACCEPTED.includes(extension)) {
      setError(`Please choose a ${ACCEPTED.join(" or ")} file.`);
      return;
    }
    if (chosen.size === 0) {
      setError("This file is empty.");
      return;
    }
    if (chosen.size > MAX_MB * 1024 * 1024) {
      setError(`The file is larger than ${MAX_MB} MB.`);
      return;
    }
    setFile(chosen);
  }

  function submit() {
    const c = Number(classId);
    const s = Number(subjectId);
    if (!file) return;
    if (!Number.isInteger(c) || c <= 0 || !Number.isInteger(s) || s <= 0) {
      setError("Enter the Class ID and Subject ID for this material.");
      return;
    }
    onUpload(file, c, s);
    setFile(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm">
      <h2 className="text-lg font-semibold">Upload material</h2>
      <p className="mt-1 text-sm text-muted">It is split into ~400-word parts, then into topics, and stored for search.</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <IdField label="Class ID" value={classId} onChange={setClassId} />
        <IdField label="Subject ID" value={subjectId} onChange={setSubjectId} />
      </div>

      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          choose(e.dataTransfer.files[0]);
        }}
        className={`mt-3 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-7 text-center transition ${
          dragging ? "border-brand bg-brand-soft" : "border-line hover:border-brand hover:bg-subtle"
        }`}
      >
        <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-soft text-lg text-brand">↑</span>
        {file ? (
          <>
            <span className="mt-2 font-medium">{file.name}</span>
            <span className="text-sm text-muted">{formatSize(file.size)} · click to choose another</span>
          </>
        ) : (
          <>
            <span className="mt-2 font-medium">Drop a file here, or click to browse</span>
            <span className="text-sm text-muted">.txt or .md, up to {MAX_MB} MB</span>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="sr-only"
          onChange={(e) => choose(e.target.files?.[0])}
        />
      </label>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <button
        type="button"
        onClick={submit}
        disabled={!file || uploading}
        className="mt-4 w-full rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {uploading ? "Uploading and splitting into topics…" : "Upload and process"}
      </button>
      {uploading && (
        <p className="mt-2 text-center text-xs text-muted">This can take a few minutes for a large book. Keep this page open.</p>
      )}
    </div>
  );
}

function IdField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{label}</span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
        placeholder="e.g. 7"
        className="mt-1 w-full rounded-xl border border-line bg-background px-3 py-2 outline-none focus:border-brand"
      />
    </label>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
