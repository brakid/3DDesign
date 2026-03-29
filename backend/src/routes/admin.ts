import { Router, Request, Response } from 'express';
import multer from 'multer';
import { createDesign, updateDesign, deleteDesign } from '../db/index.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';
import { parseFilename } from '../utils/filename.js';
import path from 'path';
import fs from 'fs/promises';

const router = Router();

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'model') {
        cb(null, './uploads/models');
      } else if (file.fieldname === 'thumbnail') {
        cb(null, './uploads/thumbnails');
      } else {
        cb(null, './uploads');
      }
    },
    filename: (req, file, cb) => {
      if (file.fieldname === 'model') {
        const ext = path.extname(file.originalname).toLowerCase();
        const base = parseFilename(file.originalname);
        cb(null, `${base}-${Date.now()}${ext}`);
      } else if (file.fieldname === 'thumbnail') {
        cb(null, `thumb-${Date.now()}.png`);
      } else {
        cb(null, `${Date.now()}-${file.originalname}`);
      }
    }
  }),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.fieldname === 'model') {
      if (['.obj', '.gltf', '.glb'].includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Only OBJ, GLTF, and GLB files are allowed'));
      }
    } else if (file.fieldname === 'thumbnail') {
      if (['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Only PNG, JPG, and WebP images are allowed'));
      }
    } else {
      cb(null, true);
    }
  },
  limits: { fileSize: 50 * 1024 * 1024 }
});

router.post('/', 
  authMiddleware, 
  requireAdmin, 
  upload.fields([
    { name: 'model', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
  ]),
  async (req: Request, res: Response) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const modelFile = files['model']?.[0];
      
      if (!modelFile) {
        return res.status(400).json({ error: 'Model file required' });
      }

      const { name, description, category, tags } = req.body;
      const tagArray = tags ? (Array.isArray(tags) ? tags : JSON.parse(tags)) : [];

      const thumbnailFile = files['thumbnail']?.[0];
      let thumbnailFilename: string | null = null;

      const design = createDesign({
        name: name || parseFilename(modelFile.originalname),
        description,
        category,
        tags: tagArray,
        filename: modelFile.filename,
      });

      if (thumbnailFile) {
        const updatedDesign = updateDesign(design.id, { thumbnail: thumbnailFile.filename });
        if (updatedDesign) {
          design.thumbnail = thumbnailFile.filename;
        }
      }

      res.status(201).json({ success: true, design });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Upload failed' });
    }
  }
);

router.post('/:id/cover', authMiddleware, requireAdmin, (req: Request, res: Response) => {
  const uploadCover = multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, './uploads/covers');
      },
      filename: (req, file, cb) => {
        cb(null, `cover-${Date.now()}${path.extname(file.originalname)}`);
      }
    }),
    fileFilter: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Only JPG, PNG, and WebP images are allowed'));
      }
    },
    limits: { fileSize: 10 * 1024 * 1024 }
  }).single('cover');

  uploadCover(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Cover image required' });
    }

    const id = parseInt(req.params.id, 10);
    const design = updateDesign(id, { thumbnail: req.file.filename });
    
    if (!design) {
      return res.status(404).json({ error: 'Design not found' });
    }

    res.json({ success: true, coverImage: req.file.filename });
  });
});

router.delete('/:id', authMiddleware, requireAdmin, async (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  const { getDesignById } = await import('../db/index.js');
  const design = getDesignById(id);

  if (design) {
    try {
      await fs.unlink(`./uploads/models/${design.filename}`).catch(() => {});
      if (design.thumbnail) {
        await fs.unlink(`./uploads/thumbnails/${design.thumbnail}`).catch(() => {});
      }
      if (design.coverImage) {
        await fs.unlink(`./uploads/covers/${design.coverImage}`).catch(() => {});
      }
    } catch {}
  }

  const deleted = deleteDesign(id);
  
  if (!deleted) {
    return res.status(404).json({ error: 'Design not found' });
  }

  res.json({ success: true });
});

export default router;
