import { Router, Request, Response } from 'express';
import { getDesigns, getDesignById, getAllTags } from '../db/index.js';
import { optionalAuth, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.get('/', optionalAuth, (req: Request, res: Response) => {
  const { tags, category, search } = req.query;
  
  const filters = {
    tags: tags ? (Array.isArray(tags) ? tags as string[] : [tags as string]) : undefined,
    category: category as string | undefined,
    search: search as string | undefined,
  };

  const result = getDesigns(filters);
  res.json(result);
});

router.get('/tags', (req: Request, res: Response) => {
  const tags = getAllTags();
  res.json({ tags });
});

router.get('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid ID' });
  }

  const design = getDesignById(id);
  if (!design) {
    return res.status(404).json({ error: 'Design not found' });
  }

  res.json(design);
});

export default router;
