// All calls to the .NET backend live here. Components never call fetch() directly.

import { adminKeyStore } from "./browserStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5193";

// ---------- Types (match the backend JSON) ----------

export type DocumentStatus = "Uploaded" | "Processing" | "Completed" | "Failed";

export interface DocumentItem {
  id: string;
  classId: number;
  subjectId: number;
  fileName: string;
  status: DocumentStatus;
  createdAt: string;
  chunkCount: number;
}

export interface ChunkItem {
  id: string;
  chunkIndex: number;
  sourceChunkIndex: number;
  topic: string | null;
  wordCount: number;
  content: string;
}

export interface IngestionResult {
  documentId: string;
  status: DocumentStatus;
  totalSourceChunks: number;
  processedSourceChunks: number;
  finalChunks: number;
  error: string | null;
}

export interface ChatSession {
  id: string;
  userId: string;
  classId: number;
  subjectId: number;
  title: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "User" | "Assistant";
  content: string;
  createdAt: string;
}

export interface Source {
  chunkId: string;
  documentId: string;
  fileName: string;
  topic: string | null;
  content: string;
  similarity: number;
}

export interface ChatResponse {
  sessionId: string;
  answer: string;
  sources: Source[];
}

// ---------- Helpers ----------

export class ApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
  }
}

const UNREACHABLE = "Cannot reach the server. Please check that the backend is running.";

// Admin endpoints need the admin password in the X-Admin-Key header.
function adminHeaders(extra?: HeadersInit): HeadersInit {
  return { ...extra, "X-Admin-Key": adminKeyStore.get() ?? "" };
}

// Turns any failed response into a readable message for the user.
async function readError(response: Response): Promise<string> {
  const text = await response.text();
  if (!text) return `Request failed (${response.status}).`;

  try {
    const json = JSON.parse(text);
    if (typeof json === "string") return json;
    if (json.error) return json.error;
    if (json.title) return json.title;
  } catch {
    // Not JSON — use the plain text.
  }
  return text;
}

async function send(path: string, init?: RequestInit): Promise<Response> {
  try {
    return await fetch(`${API_URL}${path}`, init);
  } catch {
    throw new ApiError(UNREACHABLE);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await send(path, init);
  if (!response.ok) {
    throw new ApiError(await readError(response), response.status);
  }
  return response.json() as Promise<T>;
}

// Upload + process return the result even when processing failed (HTTP 502),
// so the page can show how far it got and offer "Continue".
async function requestIngestion(path: string, init: RequestInit): Promise<IngestionResult> {
  const response = await send(path, init);
  if (response.ok || response.status === 502) {
    return response.json() as Promise<IngestionResult>;
  }
  throw new ApiError(await readError(response), response.status);
}

function query(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  return search.toString();
}

// ---------- Documents (admin only) ----------

// Checks a password at sign-in without saving it. false = wrong password.
export async function checkAdminPassword(password: string): Promise<boolean> {
  const response = await send("/api/documents?classId=0", { headers: { "X-Admin-Key": password } });
  if (response.status === 401) return false;
  if (!response.ok) throw new ApiError(await readError(response), response.status);
  return true;
}

export function listDocuments(classId?: number, subjectId?: number): Promise<DocumentItem[]> {
  return request(`/api/documents?${query({ classId, subjectId })}`, { headers: adminHeaders() });
}

export function uploadDocument(file: File, classId: number, subjectId: number): Promise<IngestionResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("classId", String(classId));
  form.append("subjectId", String(subjectId));
  return requestIngestion("/api/documents", { method: "POST", body: form, headers: adminHeaders() });
}

export function processDocument(id: string): Promise<IngestionResult> {
  return requestIngestion(`/api/documents/${id}/process`, { method: "POST", headers: adminHeaders() });
}

export function getChunks(id: string): Promise<ChunkItem[]> {
  return request(`/api/documents/${id}/chunks`, { headers: adminHeaders() });
}

export async function deleteDocument(id: string): Promise<void> {
  const response = await send(`/api/documents/${id}`, { method: "DELETE", headers: adminHeaders() });
  if (!response.ok) throw new ApiError(await readError(response), response.status);
}

// ---------- Chat (students) ----------

export function askQuestion(
  sessionId: string | null,
  userId: string,
  classId: number,
  subjectId: number,
  question: string,
): Promise<ChatResponse> {
  return request("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, userId, classId, subjectId, question }),
  });
}

export function listSessions(userId: string, classId: number, subjectId: number): Promise<ChatSession[]> {
  return request(`/api/chat/sessions?${query({ userId, classId, subjectId })}`);
}

export function getMessages(sessionId: string): Promise<ChatMessage[]> {
  return request(`/api/chat/sessions/${sessionId}/messages`);
}
