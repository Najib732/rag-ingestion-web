# StudyMate — frontend

Next.js frontend for the RAG backend in `~/Desktop/RagIngestion`.

- **Welcome** (`/`) — choose Student or Admin.
- **Student** (`/student`) — enter Class ID + Subject ID, then chat with that subject's materials (answers show their sources).
- **Admin** (`/admin`) — sign in with the admin password, upload materials for any class/subject, view how each was split into topic chunks, continue unfinished ones, delete.

The admin password is set in the backend: `dotnet user-secrets set "Admin:ApiKey" "<password>"`.

## Run

1. Start the backend (needs PostgreSQL and Ollama running):

   ```bash
   cd ~/Desktop/RagIngestion
   dotnet user-secrets set "You:ApiKey" "YOUR_KEY"      # once (or Gemini:ApiKey with AI:TextProvider = Gemini)
   dotnet user-secrets set "Admin:ApiKey" "PASSWORD"    # once
   dotnet run                                            # http://localhost:5193
   ```

2. Start the frontend:

   ```bash
   cd ~/Desktop/rag-ingestion-web
   npm run dev                                           # http://localhost:3000
   ```

## Configuration

`.env.local` sets the backend address:

```
NEXT_PUBLIC_API_URL=http://localhost:5193
```

If the frontend runs on another address, add it to `Cors:AllowedOrigins` in the backend's `appsettings.json`.

## Code layout

```
src/
├── app/
│   ├── page.tsx              welcome (student / admin)
│   ├── student/page.tsx      student area
│   └── admin/page.tsx        admin area
├── components/
│   ├── student/              StudentApp (header + join/chat), JoinForm
│   ├── chat/                 ChatView, ChatSidebar, ChatInput, AnswerContent, SourceList
│   ├── admin/                AdminGate (sign in), AdminDashboard, UploadCard, ChunkPanel
│   ├── documents/StatusBadge.tsx
│   ├── ScopeProvider.tsx     student's class/subject (remembered on the device)
│   └── Brand.tsx
└── lib/
    ├── api.ts                every call to the backend (admin calls send X-Admin-Key)
    └── browserStore.ts       saved values: admin password (this tab), student class/subject
```
