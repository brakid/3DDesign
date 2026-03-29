import { Database } from 'bun:sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../../data/designs.db');

export const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS designs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    tags TEXT DEFAULT '[]',
    filename TEXT NOT NULL,
    thumbnail TEXT,
    cover_image TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_category ON designs(category);
`);

interface DesignRow {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  tags: string;
  filename: string;
  thumbnail: string | null;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
}

function rowToDesign(row: DesignRow) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    tags: JSON.parse(row.tags || '[]'),
    filename: row.filename,
    thumbnail: row.thumbnail,
    coverImage: row.cover_image,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function getDesigns(filters?: { tags?: string[]; category?: string; search?: string }) {
  let query = 'SELECT * FROM designs WHERE 1=1';
  const params: (string | number)[] = [];

  if (filters?.search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }

  if (filters?.category) {
    query += ' AND category = ?';
    params.push(filters.category);
  }

  query += ' ORDER BY created_at DESC';

  const rows = db.query<DesignRow>(query).all(...params);

  let designs = rows.map(rowToDesign);

  if (filters?.tags && filters.tags.length > 0) {
    designs = designs.filter(design =>
      filters.tags!.some(tag => design.tags.includes(tag))
    );
  }

  return { designs, total: designs.length };
}

export function getDesignById(id: number) {
  const row = db.query<DesignRow>('SELECT * FROM designs WHERE id = ?').get(id);
  if (!row) return null;
  return rowToDesign(row);
}

export function createDesign(data: {
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  filename: string;
  coverImage?: string;
}) {
  db.query(`
    INSERT INTO designs (name, description, category, tags, filename, cover_image)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    data.name,
    data.description || null,
    data.category || null,
    JSON.stringify(data.tags || []),
    data.filename,
    data.coverImage || null
  );

  const lastId = db.query<{ id: number }>('SELECT last_insert_rowid() as id').get();
  return getDesignById(lastId!.id);
}

export function updateDesign(id: number, data: Partial<{
  name: string;
  description: string;
  category: string;
  tags: string[];
  thumbnail: string;
}>) {
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (data.name !== undefined) {
    fields.push('name = ?');
    values.push(data.name);
  }
  if (data.description !== undefined) {
    fields.push('description = ?');
    values.push(data.description);
  }
  if (data.category !== undefined) {
    fields.push('category = ?');
    values.push(data.category);
  }
  if (data.tags !== undefined) {
    fields.push('tags = ?');
    values.push(JSON.stringify(data.tags));
  }
  if (data.thumbnail !== undefined) {
    fields.push('thumbnail = ?');
    values.push(data.thumbnail);
  }

  fields.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  db.query(`UPDATE designs SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getDesignById(id);
}

export function deleteDesign(id: number) {
  const design = getDesignById(id);
  if (!design) return false;
  
  db.query('DELETE FROM designs WHERE id = ?').run(id);
  return true;
}

export function getAllTags(): string[] {
  const rows = db.query<{ tags: string }>('SELECT tags FROM designs').all();
  const tagSet = new Set<string>();
  
  for (const row of rows) {
    try {
      const tags = JSON.parse(row.tags || '[]');
      tags.forEach((tag: string) => tagSet.add(tag));
    } catch {}
  }
  
  return Array.from(tagSet).sort();
}
