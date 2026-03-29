import type { Design } from '../types';

const API_BASE = '/api';

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('adminToken');
  
  const headers: HeadersInit = {
    ...options.headers,
  };
  
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return response.json();
}

export async function getDesigns(filters?: { tags?: string[]; category?: string; search?: string }): Promise<{ designs: Design[]; total: number }> {
  const params = new URLSearchParams();
  
  if (filters?.tags?.length) {
    filters.tags.forEach(tag => params.append('tags', tag));
  }
  if (filters?.category) {
    params.set('category', filters.category);
  }
  if (filters?.search) {
    params.set('search', filters.search);
  }

  const queryString = params.toString();
  return fetchWithAuth(`/designs${queryString ? `?${queryString}` : ''}`);
}

export async function getDesign(id: number): Promise<Design> {
  return fetchWithAuth(`/designs/${id}`);
}

export async function getTags(): Promise<string[]> {
  const result = await fetchWithAuth('/designs/tags');
  return result.tags;
}

export async function login(password: string): Promise<{ token: string; expiresAt: string }> {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });

  if (!response.ok) {
    throw new Error('Invalid password');
  }

  return response.json();
}

export async function verifyToken(): Promise<boolean> {
  const token = localStorage.getItem('adminToken');
  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE}/auth/verify`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const result = await response.json();
    return result.valid;
  } catch {
    return false;
  }
}

export async function uploadDesign(formData: FormData): Promise<Design> {
  return fetchWithAuth('/admin/designs', {
    method: 'POST',
    body: formData,
  });
}

export async function deleteDesign(id: number): Promise<void> {
  await fetchWithAuth(`/admin/designs/${id}`, { method: 'DELETE' });
}

export function getModelUrl(filename: string): string {
  return `/uploads/models/${filename}`;
}

export function getThumbnailUrl(thumbnail: string | null): string | null {
  return thumbnail ? `/uploads/thumbnails/${thumbnail}` : null;
}

export function getCoverUrl(coverImage: string | null): string | null {
  return coverImage ? `/uploads/covers/${coverImage}` : null;
}
