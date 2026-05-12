# 📚 AI Knowledge Base System

A robust, full-stack application designed to transform unstructured documents and operational data (PDF, DOCX, TXT, PPTX, EML, JSON chat logs, Images) into structured, searchable knowledge base articles. 

The system features an automated extraction pipeline, an AI-powered drafting engine (Google Gemini API), a strict review workflow (`Draft` → `Reviewed` → `Published`), detailed audit history, and built-in support for UiPath RPA (Robotic Process Automation) document ingestion.

---

## 🛠️ Tech Stack

**Frontend**
- React (Vite)
- React Router DOM
- Axios
- Vanilla CSS (Custom Design System with Dark Mode)

**Backend**
- Node.js & Express
- SQLite (sqlite3) with WAL mode for high concurrency
- Multer (File upload handling)
- Document Parsing (`pdf-parse`, `mammoth`, `officeparser`, `mailparser`)
- OCR Engine (`tesseract.js` for Image processing)
- AI Engine (`@google/generative-ai` for Gemini Flash generation)

**Automation**
- UiPath (Automated local folder monitoring and batch ingestion)

---

## ✨ Key Features

1. **Multi-format Document Ingestion**
   - Upload PDF, DOCX, TXT, PPTX, EML (Email Threads), JSON (Chat Logs), or Image files (PNG, JPG).
   - Alternatively, directly paste raw operational text for instant processing.
   - Built-in text extraction and OCR (Optical Character Recognition) handles messy data gracefully.

2. **AI-Powered Drafting Engine**
   - Extracted text is fed into **Google Gemini (Flash)**.
   - Automatically generates a structured draft featuring a precise Title, Summary, structured SOP Steps, extracted Warnings, and Auto-Tags.

3. **Strict Publishing Workflow**
   - Articles follow a strictly enforced status flow: `Draft` → `Reviewed` → `Published`.
   - Each transition allows reviewers to add approval remarks.

3. **Audit Trail & Versioning**
   - Complete tracking of article history (creation, edits, and status changes).
   - Auto-incrementing version numbers on every save.

4. **RPA Automation Ready**
   - Includes dedicated APIs (`/api/draft/from-text`) to support UiPath robots.
   - Bots can ingest hundreds of files from a designated folder and queue them as drafts automatically.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- npm or yarn

### 1. Backend Setup
The backend runs on port `5000` and uses a local SQLite database.

```bash
# Navigate to the backend directory
cd backend

# Configure your environment variables
# Edit the .env file and add your Gemini API Key:
# GEMINI_API_KEY=your_gemini_api_key_here

# Install dependencies
npm install

# Start the development server (uses nodemon)
npm run dev
```
*Note: The SQLite database (`backend/database/knowledge_base.db`) will be created automatically on the first run, along with the `uploads` directory.*

### 2. Frontend Setup
The frontend runs on Vite (typically port `5173` or `5175`).

```bash
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

### 3. Usage
- Open the frontend URL provided by Vite (e.g., `http://localhost:5175`).
- Log in with any email, name, and role (e.g., Editor, Reviewer, Admin). The system auto-registers you on first login.
- Go to the **Upload** page to ingest your first document!

---

## 📡 API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/login` | Simple identity login & auto-registration |
| `GET`  | `/api/articles` | List articles (supports `?search=` and `?status=`) |
| `POST` | `/api/articles` | Create a new article manually |
| `GET`  | `/api/articles/:id` | Get specific article details |
| `PUT`  | `/api/articles/:id` | Update an article (increments version) |
| `PATCH`| `/api/articles/:id/status` | Promote workflow status (Draft → Reviewed → Published) |
| `GET`  | `/api/articles/:id/history`| View audit trail of an article |
| `POST` | `/api/upload` | Upload a file and extract its text (OCR applied for images) |
| `POST` | `/api/draft` | Generate an AI draft from an uploaded file ID via Gemini |
| `POST` | `/api/draft/from-text` | Generate an AI draft directly from raw text (For RPA) |

---

## 🤖 UiPath RPA Integration

To set up automated ingestion via UiPath:
1. Ensure the Backend server is running.
2. Open the `.xaml` files located in the `rpa/` folder using UiPath Studio.
3. The robot is configured to monitor a local `inputs/` folder, read files, extract text natively or via OCR, and send POST requests to the `/api/draft/from-text` endpoint.

---

## 📂 Project Structure

```text
knowledge-base-system/
├── backend/                  # Express API Server
│   ├── config/               # Database and Multer configurations
│   ├── database/             # SQLite DB files
│   ├── routes/               # API endpoint definitions
│   ├── services/             # AI Integration (aiService.js)
│   ├── utils/                # Text extraction, OCR, and parsing logic
│   └── server.js             # Entry point
├── frontend/                 # React Application
│   ├── src/
│   │   ├── components/       # Reusable UI components (Navbar, Badges)
│   │   ├── pages/            # App screens (Upload, DraftBuilder, Detail, List)
│   │   ├── services/         # Axios API service
│   │   └── utils/            # Helper formatting functions
│   └── vite.config.js
├── rpa/                      # UiPath Automation flows
└── README.md                 # You are here!
```

---

*Built with ❤️ for AI-assisted Document Management.*
