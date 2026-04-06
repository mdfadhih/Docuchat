# DocuChat — AI-Powered Document Q&A

[![Live Demo](https://img.shields.io/badge/Live%20Demo-docuchat--navy.vercel.app-e8ff47?style=flat-square&labelColor=0e0e0f)](https://docuchat-navy.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat-square&logo=render&logoColor=white)](https://docuchat-v2qw.onrender.com/health)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

> Upload any PDF. Ask questions in plain English. Get instant AI-powered answers — grounded in your document.

---

## What is DocuChat?

DocuChat is a full-stack **RAG (Retrieval-Augmented Generation)** application that lets users upload PDF documents and chat with them using natural language. It uses vector embeddings to find the most relevant sections of your document and feeds them to Gemini AI to generate accurate, context-grounded answers.

Built as a portfolio project demonstrating end-to-end AI engineering — from vector database design to streaming LLM responses.

---

## Live Demo

**Frontend:** [docuchat-navy.vercel.app](https://docuchat-navy.vercel.app)  
**Backend Health:** [docuchat-v2qw.onrender.com/health](https://docuchat-v2qw.onrender.com/health)

> Note: Backend runs on Render free tier — first request after inactivity may take ~30 seconds to wake up.

---

## Features

- **PDF Upload** — drag & drop or click to upload any PDF document
- **Vector Search** — semantic similarity search using Gemini embeddings (768 dimensions)
- **Streaming Responses** — AI answers stream token by token in real time
- **Smart Suggestions** — generates 3 document-specific suggested questions after each upload
- **Multi-document Support** — upload a new PDF and all previous data is cleared automatically
- **Responsive UI** — works on desktop and mobile browsers
- **Dark Theme** — minimal dark UI with DM Serif Display typography

---

## Tech Stack

### Frontend

| Technology            | Purpose                   |
| --------------------- | ------------------------- |
| React 18 + TypeScript | UI framework              |
| Vite                  | Build tool                |
| Tailwind CSS          | Styling                   |
| react-dropzone        | PDF drag & drop           |
| Fetch API             | HTTP requests + streaming |

### Backend

| Technology        | Purpose                  |
| ----------------- | ------------------------ |
| Node.js + Express | REST API server          |
| Multer            | PDF file upload handling |
| pdf-parse         | PDF text extraction      |
| @google/genai     | Gemini AI SDK            |

### AI & Database

| Technology            | Purpose                          |
| --------------------- | -------------------------------- |
| Google Gemini API     | Embeddings + text generation     |
| gemini-embedding-001  | 768-dim vector embeddings        |
| gemini-2.0-flash      | Streaming answer generation      |
| Supabase (PostgreSQL) | Vector storage with pgvector     |
| Cosine Similarity     | JavaScript-based semantic search |

### DevOps

| Technology     | Purpose                |
| -------------- | ---------------------- |
| Vercel         | Frontend hosting + CDN |
| Render         | Backend hosting        |
| GitHub Actions | CI/CD pipeline         |
| Git            | Version control        |

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     User Browser                         │
│              (Vercel — docuchat-navy.vercel.app)         │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────────┐
│                  Express Backend                          │
│           (Render — docuchat-v2qw.onrender.com)          │
│                                                          │
│  POST /api/upload          POST /api/query               │
│  ┌─────────────────┐      ┌──────────────────────┐       │
│  │ 1. Parse PDF    │      │ 1. Embed question    │       │
│  │ 2. Chunk text   │      │ 2. Cosine similarity │       │
│  │ 3. Embed chunks │      │ 3. Retrieve top 4    │       │
│  │ 4. Store vectors│      │ 4. Build RAG prompt  │       │
│  │ 5. Gen suggests │      │ 5. Stream answer     │       │
│  └────────┬────────┘      └──────────┬───────────┘       │
└───────────┼───────────────────────────┼───────────────────┘
            │                           │
┌───────────▼───────────┐   ┌───────────▼───────────┐
│      Supabase          │   │     Gemini API         │
│   (pgvector store)     │   │  embeddings + flash    │
└────────────────────────┘   └────────────────────────┘
```

---

## RAG Pipeline Explained

1. **Upload** — user drops a PDF into the UI
2. **Parse** — `pdf-parse` extracts raw text from the PDF
3. **Chunk** — text is split into 500-word chunks with 50-word overlap
4. **Embed** — each chunk is converted to a 768-dimensional vector using `gemini-embedding-001`
5. **Store** — vectors stored in Supabase (pgvector) with chunk content and metadata
6. **Suggest** — Gemini reads the first 2 chunks and generates 3 relevant questions
7. **Query** — user asks a question
8. **Search** — question is embedded → cosine similarity against all stored chunks → top 4 retrieved
9. **Generate** — top chunks used as context in a RAG prompt → Gemini streams the answer

---

## Project Structure

```
DocuChat/
├── backend/                    # Node.js Express API
│   ├── server.js               # Express app entry point
│   ├── routes/
│   │   ├── upload.js           # PDF upload + embedding pipeline
│   │   └── query.js            # RAG query + streaming response
│   ├── services/
│   │   ├── pdfParser.js        # PDF text extraction + chunking
│   │   ├── embeddings.js       # Gemini embedding generation
│   │   └── vectorStore.js      # Supabase vector CRUD + cosine search
│   ├── .env.example            # Environment variable template
│   └── package.json
│
├── frontend/                   # React + TypeScript SPA
│   ├── src/
│   │   ├── App.tsx             # Root component + state management
│   │   ├── App.css             # Dark theme styles
│   │   └── components/
│   │       ├── FileUpload.tsx  # Drag & drop PDF uploader
│   │       └── ChatWindow.tsx  # Streaming chat interface
│   ├── index.html
│   └── package.json
│
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI pipeline
│
├── .gitignore                  # Protects .env files
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- A [Google AI Studio](https://aistudio.google.com) account (free Gemini API key)
- A [Supabase](https://supabase.com) project (free tier)

### 1. Clone the repo

```bash
git clone https://github.com/mdfadhih/Docuchat.git
cd Docuchat
```

### 2. Set up the database

Go to your Supabase project → SQL Editor → run:

```sql
-- Enable pgvector
create extension if not exists vector;

-- Create documents table
create table documents (
  id         bigserial primary key,
  content    text,
  embedding  vector,
  metadata   jsonb,
  created_at timestamp default now()
);

-- Create similarity search function
create or replace function match_documents(
  query_embedding vector,
  match_count     int default 4
)
returns table(id bigint, content text, metadata jsonb)
language sql stable as $$
  select id, content, metadata
  from documents
  order by embedding <=> query_embedding
  limit match_count;
$$;
```

### 3. Configure backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_supabase_anon_key_here
PORT=3001
```

### 4. Install and run backend

```bash
npm install
node server.js
# Server running on port 3001
```

### 5. Configure and run frontend

```bash
cd ../frontend
npm install
npm run dev
# Open http://localhost:5173
```

---

## Deployment

### Backend → Render

| Setting               | Value                                            |
| --------------------- | ------------------------------------------------ |
| Root Directory        | `backend`                                        |
| Build Command         | `npm install`                                    |
| Start Command         | `node server.js`                                 |
| Environment Variables | `GEMINI_API_KEY`, `SUPABASE_URL`, `SUPABASE_KEY` |

### Frontend → Vercel

| Setting               | Value                                               |
| --------------------- | --------------------------------------------------- |
| Root Directory        | `frontend`                                          |
| Framework Preset      | Vite                                                |
| Build Command         | `npm run build`                                     |
| Environment Variables | `VITE_API_URL=https://your-render-url.onrender.com` |

---

## Environment Variables

### Backend (`backend/.env`)

| Variable         | Description                 |
| ---------------- | --------------------------- |
| `GEMINI_API_KEY` | Google AI Studio API key    |
| `SUPABASE_URL`   | Your Supabase project URL   |
| `SUPABASE_KEY`   | Supabase anon/public key    |
| `PORT`           | Server port (default: 3001) |

### Frontend (`frontend/.env`)

| Variable       | Description                        |
| -------------- | ---------------------------------- |
| `VITE_API_URL` | Backend URL (Render in production) |

---

## API Reference

### `POST /api/upload`

Upload a PDF and generate vector embeddings.

**Request:** `multipart/form-data` with field `pdf` (File)

**Response:**

```json
{
  "success": true,
  "filename": "document.pdf",
  "chunks": 9,
  "suggestions": [
    "What are the key topics covered?",
    "How does the authentication flow work?",
    "What are the main requirements?"
  ]
}
```

### `POST /api/query`

Ask a question and receive a streaming answer.

**Request:**

```json
{ "question": "What is SAML?" }
```

**Response:** Server-Sent Events stream

```
data: {"text":"SAML"}
data: {"text":" stands"}
data: {"text":" for..."}
data: [DONE]
```

### `GET /health`

Health check endpoint.

**Response:** `{ "status": "ok" }`

---

## Key Technical Decisions

**Why cosine similarity in JavaScript instead of pgvector RPC?**  
Supabase's free tier pgvector has type casting limitations with the JS client for high-dimensional vectors. Computing cosine similarity in Node.js with the raw embedding values is more reliable and fast enough for typical document sizes (under 100 chunks).

**Why Gemini over OpenAI?**  
Gemini API has a genuinely free tier (15 requests/minute, 1M tokens/day) with no credit card required — making this project fully deployable at $0 cost.

**Why 768 dimensions?**  
Supabase free tier pgvector supports a maximum of 2000 dimensions for indexes. `gemini-embedding-001` supports configurable output dimensions — 768 gives a good balance of quality and compatibility.

---

## Author

**Mohamed Fadhih**  
Full Stack Developer | Melbourne, Australia

- GitHub: [@mdfadhih](https://github.com/mdfadhih)
- LinkedIn: [linkedin.com/in/fadhih](https://linkedin.com/in/fadhih)
- Portfolio: [my-portfolio-seven-tawny-79.vercel.app](https://my-portfolio-seven-tawny-79.vercel.app)
- Email: mdfadhih377@gmail.com

---

## License

MIT — feel free to fork and build on this project.
