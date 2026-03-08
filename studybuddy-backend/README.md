# StudyBuddy REST API

## Setup

Create and activate a virtual environment:

```bash
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Add a `.env` file with your keys (copy from `.env.example`):

```
GROQ_API_KEY=your_groq_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Run

```bash
uvicorn main:app --reload
```

## Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | / | Health check |
| POST | /api/student/register | Register new student |
| POST | /api/student/login | Login by email |
| GET | /api/student/{student_id} | Get student by ID |
| POST | /api/upload | Upload PDF, process with RAG |
| GET | /api/documents/{student_id} | List all uploaded resources |
| PUT | /api/documents/{student_id}/{document_id} | Update document metadata |
| DELETE | /api/documents/{student_id}/{document_id} | Delete document |
| POST | /api/chat | Chat with RAG context |
| GET | /api/talks/{student_id} | List chat/voice talks |
| DELETE | /api/talks/{student_id}/{talk_id} | Delete one talk |
| DELETE | /api/talks/{student_id} | Delete all talks |
| GET | /api/flashcards/{student_id} | List flashcards |
| POST | /api/flashcards | Create flashcard |
| PATCH | /api/flashcards/{student_id}/{flashcard_id} | Update flashcard |
| DELETE | /api/flashcards/{student_id}/{flashcard_id} | Delete flashcard |
| GET | /api/flashcards/{student_id}/review-stats | Get review streak/history |
| POST | /api/flashcards/{student_id}/review-stats/increment | Increment daily review count |
| GET | /api/schedule/{student_id} | List custom schedule events |
| POST | /api/schedule | Create schedule event |
| DELETE | /api/schedule/{student_id}/{event_id} | Delete schedule event |
| GET | /api/workspaces/{student_id} | List workspaces |
| POST | /api/workspaces | Create workspace |
| DELETE | /api/workspaces/{student_id}/{workspace_id} | Delete workspace |
| GET | /api/workspaces/{student_id}/documents | List workspace-resource links |
| POST | /api/workspaces/{student_id}/{workspace_id}/documents/{document_id} | Assign resource to workspace |
| DELETE | /api/workspaces/{student_id}/{workspace_id}/documents/{document_id} | Remove resource from workspace |
| POST | /api/notes/generate | Generate notes from PDF |
| POST | /api/voice/stt | Speech-to-text (transcribe audio) |
| POST | /api/voice/tts | Text-to-speech |
| GET | /api/memory/{student_id} | Get greeting and recent sessions |
| POST | /api/memory/session | Save study session |

## cURL Examples

Set values first in PowerShell:

```powershell
$BASE = "http://localhost:8000"
$STUDENT_ID = "<student-uuid>"
$DOC_ID = "<document-uuid>"
$TALK_ID = "<talk-uuid>"
$FLASHCARD_ID = "<flashcard-uuid>"
$EVENT_ID = "<schedule-event-uuid>"
$WORKSPACE_ID = "<workspace-uuid>"
```

Register:

```powershell
curl.exe -X POST "$BASE/api/student/register" -H "Content-Type: application/json" -d "{\"name\":\"Asha\",\"email\":\"asha@example.com\"}"
```

Upload PDF (insert resource):

```powershell
curl.exe -X POST "$BASE/api/upload" -F "student_id=$STUDENT_ID" -F "file=@C:/path/to/notes.pdf"
```

List resources:

```powershell
curl.exe "$BASE/api/documents/$STUDENT_ID"
```

Update resource metadata:

```powershell
curl.exe -X PUT "$BASE/api/documents/$STUDENT_ID/$DOC_ID" -H "Content-Type: application/json" -d "{\"summary\":\"Updated summary from cURL\"}"
```

Delete resource:

```powershell
curl.exe -X DELETE "$BASE/api/documents/$STUDENT_ID/$DOC_ID"
```

Create talk (chat text):

```powershell
curl.exe -X POST "$BASE/api/chat" -H "Content-Type: application/json" -d "{\"student_id\":\"$STUDENT_ID\",\"question\":\"Summarize my PDF\",\"source\":\"text\"}"
```

List talks:

```powershell
curl.exe "$BASE/api/talks/$STUDENT_ID?limit=50"
```

Delete one talk:

```powershell
curl.exe -X DELETE "$BASE/api/talks/$STUDENT_ID/$TALK_ID"
```

Delete all talks:

```powershell
curl.exe -X DELETE "$BASE/api/talks/$STUDENT_ID"
```

Create flashcard:

```powershell
curl.exe -X POST "$BASE/api/flashcards" -H "Content-Type: application/json" -d "{\"student_id\":\"$STUDENT_ID\",\"subject\":\"DSA\",\"question\":\"What is BFS?\",\"answer\":\"Breadth-first graph traversal\"}"
```

List flashcards:

```powershell
curl.exe "$BASE/api/flashcards/$STUDENT_ID"
```

Update flashcard (mastered=true):

```powershell
curl.exe -X PATCH "$BASE/api/flashcards/$STUDENT_ID/$FLASHCARD_ID" -H "Content-Type: application/json" -d "{\"mastered\":true}"
```

Increment review stats:

```powershell
curl.exe -X POST "$BASE/api/flashcards/$STUDENT_ID/review-stats/increment"
```

Create schedule event:

```powershell
curl.exe -X POST "$BASE/api/schedule" -H "Content-Type: application/json" -d "{\"student_id\":\"$STUDENT_ID\",\"title\":\"Graphs Revision\",\"subject\":\"DSA\",\"date\":\"2026-03-10\",\"start_time\":\"18:00\",\"end_time\":\"19:00\",\"priority\":\"high\"}"
```

List schedule events:

```powershell
curl.exe "$BASE/api/schedule/$STUDENT_ID"
```

Delete schedule event:

```powershell
curl.exe -X DELETE "$BASE/api/schedule/$STUDENT_ID/$EVENT_ID"
```

Create workspace:

```powershell
curl.exe -X POST "$BASE/api/workspaces" -H "Content-Type: application/json" -d "{\"student_id\":\"$STUDENT_ID\",\"name\":\"Linear Algebra\"}"
```

Assign resource to workspace:

```powershell
curl.exe -X POST "$BASE/api/workspaces/$STUDENT_ID/$WORKSPACE_ID/documents/$DOC_ID"
```

List workspace-resource links:

```powershell
curl.exe "$BASE/api/workspaces/$STUDENT_ID/documents"
```
