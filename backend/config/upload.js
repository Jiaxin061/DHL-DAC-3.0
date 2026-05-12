const multer = require('multer');
const path   = require('path');
const fs     = require('fs');

// Ensure the uploads directory exists
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Store files on disk with original name (sanitized) + timestamp to avoid collisions
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const timestamp  = Date.now();
    const safeName   = file.originalname.replace(/\s+/g, '_');
    cb(null, `${timestamp}_${safeName}`);
  },
});

// Accept PDF, DOCX, TXT, and images (PNG, JPG, JPEG)
const fileFilter = (req, file, cb) => {
  const allowed = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/json',
    'message/rfc822',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/png',
    'image/jpeg',
    'image/jpg'
  ];

  if (allowed.includes(file.mimetype) || file.originalname.endsWith('.eml')) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Allowed: PDF, DOCX, PPTX, TXT, JSON, EML, PNG, JPG.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB max
});

module.exports = { upload, UPLOAD_DIR };
