export interface Design {
  id: number;
  name: string;
  description: string | null;
  category: string | null;
  tags: string[];
  filename: string;
  thumbnail: string | null;
  coverImage: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DesignCreateInput {
  name: string;
  description?: string;
  category?: string;
  tags?: string[];
  filename: string;
  coverImage?: string;
}

export interface DesignListResponse {
  designs: Design[];
  total: number;
}

export interface DesignFilter {
  tags?: string[];
  category?: string;
  search?: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
}

export interface ApiError {
  error: string;
  code?: string;
}

export interface UploadResponse {
  success: boolean;
  design?: Design;
  error?: string;
}
