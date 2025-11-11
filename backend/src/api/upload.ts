import { Router } from 'express';
import multer from 'multer';
import { logger } from '../utils/logger';

const router = Router();

// Configure multer for file uploads
const upload = multer({
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow specific file types
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/json',
      'text/csv',
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

// Upload documents for verification
router.post('/documents', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    logger.info('Document upload received:', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    // TODO: Process document upload
    // - Store in IPFS
    // - Extract data for verification
    // - Update user verification status
    
    res.status(200).json({
      success: true,
      fileId: 'placeholder-file-id',
      message: 'Document uploaded successfully',
    });
  } catch (error) {
    logger.error('Document upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Upload credit reports
router.post('/credit-report', upload.single('report'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    logger.info('Credit report upload received:', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
    });

    // TODO: Process credit report
    // - Parse report data
    // - Update credit score
    // - Store securely
    
    res.status(200).json({
      success: true,
      fileId: 'placeholder-report-id',
      message: 'Credit report uploaded successfully',
    });
  } catch (error) {
    logger.error('Credit report upload error:', error);
    res.status(500).json({ error: 'Upload failed' });
  }
});

// Health check for upload service
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;