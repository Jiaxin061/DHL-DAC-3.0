import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { uploadFile } from '../services/api';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / 1048576).toFixed(1) + ' MB';
}

export default function UploadPage() {
  const navigate  = useNavigate();
  const inputRef  = useRef(null);
  const user      = JSON.parse(localStorage.getItem('kb_user') || '{}');

  const [file,          setFile]          = useState(null);
  const [dragOver,      setDragOver]      = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [extracted,     setExtracted]     = useState(null);  // upload result
  const [creatingDraft, setCreatingDraft] = useState(false);
  const [error,         setError]         = useState('');
  const [step,          setStep]          = useState(1); // 1=pick, 2=extracted, 3=done

  const FILE_ICON = { 'application/pdf': '📄', 'text/plain': '📝', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝' };

  function handleFileSelect(selected) {
    setError('');
    setExtracted(null);
    setStep(1);
    if (!selected) return;
    const allowed = ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(selected.type)) {
      setError('Unsupported file type. Please upload a PDF, DOCX, or TXT file.');
      return;
    }
    setFile(selected);
  }

  function handleDrop(e) {
    e.preventDefault(); setDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  }

  async function handleUpload() {
    if (!file) return;
    setUploading(true); setError('');
    try {
      const res = await uploadFile(file);
      setExtracted(res.data.data);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Upload failed. Is the backend running?');
    } finally {
      setUploading(false);
    }
  }

  async function handleCreateDraft() {
    if (!extracted) return;
    setCreatingDraft(true); setError('');
    try {
      const res = await axios.post(`${API_BASE}/api/draft`, {
        sourceFileId: extracted.sourceFileId,
        createdBy: user.email || 'system',
      });
      setStep(3);
      const articleId = res.data.data.article.id;
      // Navigate to the draft editor after short delay
      setTimeout(() => navigate(`/draft/${articleId}`), 800);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create draft.');
    } finally {
      setCreatingDraft(false);
    }
  }

  function reset() {
    setFile(null); setExtracted(null);
    setError(''); setStep(1);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <main className="page-content">
      <div className="page-header">
        <h1>📤 Upload Document</h1>
        <p>Upload a PDF, DOCX, or TXT file to extract text and auto-generate a draft article.</p>
      </div>

      {/* Step bar */}
      <div className="step-bar">
        <div className={`step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>
          <div className="step-circle">{step > 1 ? '✓' : '1'}</div>
          <span>Select File</span>
        </div>
        <div className="step-line" />
        <div className={`step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'done' : ''}`}>
          <div className="step-circle">{step > 2 ? '✓' : '2'}</div>
          <span>Extract Text</span>
        </div>
        <div className="step-line" />
        <div className={`step ${step >= 3 ? 'active' : ''}`}>
          <div className="step-circle">3</div>
          <span>Create Draft</span>
        </div>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      <div className="card">
        {/* Step 1 — file picker */}
        {step === 1 && (
          <>
            <div
              id="upload-zone"
              className={`upload-zone ${dragOver ? 'drag-over' : ''}`}
              onClick={() => inputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <div className="upload-icon">☁️</div>
              <p><strong>Click to browse</strong> or drag &amp; drop your file here</p>
              <p className="file-types">Supported: PDF · DOCX · TXT &nbsp;|&nbsp; Max 10 MB</p>
            </div>
            <input
              ref={inputRef} type="file" style={{ display: 'none' }}
              accept=".pdf,.docx,.txt,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={e => handleFileSelect(e.target.files[0])}
            />

            {file && (
              <div className="file-selected mt-2">
                <span className="file-icon">{FILE_ICON[file.type] || '📄'}</span>
                <div className="file-info">
                  <div className="file-name">{file.name}</div>
                  <div className="file-size">{formatBytes(file.size)}</div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={reset}>✕</button>
              </div>
            )}

            <div className="flex-end mt-3">
              <button
                id="btn-upload"
                className="btn btn-primary"
                disabled={!file || uploading}
                onClick={handleUpload}
              >
                {uploading ? '⏳ Uploading...' : '⬆️ Upload & Extract'}
              </button>
            </div>
          </>
        )}

        {/* Step 2 — extracted text preview */}
        {step === 2 && extracted && (
          <>
            <div className="alert alert-success">
              ✅ Text extracted from <strong>{extracted.fileName}</strong> ({formatBytes(extracted.fileSizeBytes)})
            </div>

            <div className="form-group mt-2">
              <label className="form-label">Extracted Text Preview</label>
              <div className="extracted-preview">
                {extracted.extractedText}
              </div>
            </div>

            <div className="flex-between mt-3">
              <button className="btn btn-secondary" onClick={reset}>← Start over</button>
              <button
                id="btn-create-draft"
                className="btn btn-primary"
                disabled={creatingDraft}
                onClick={handleCreateDraft}
              >
                {creatingDraft ? '⏳ Creating...' : '✨ Create Draft Article'}
              </button>
            </div>
          </>
        )}

        {/* Step 3 — success */}
        {step === 3 && (
          <div className="empty-state">
            <div className="empty-icon">🎉</div>
            <h3>Draft Created!</h3>
            <p>Redirecting you to the draft editor...</p>
          </div>
        )}
      </div>
    </main>
  );
}
