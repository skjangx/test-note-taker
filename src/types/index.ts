export interface Note {
  id: string;
  title: string;
  content: string;
  folderId?: string;
  tagIds: string[];
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface CachedData {
  user: User | null;
  notes: Note[];
  folders: Folder[];
  tags: Tag[];
  lastSync: string;
}

export type Theme = 'light' | 'dark';
export type ViewMode = 'list' | 'grid';