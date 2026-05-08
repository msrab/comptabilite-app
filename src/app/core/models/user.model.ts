export interface User {
  id: string;
  username: string;
  password: string;
  displayName: string;
  role: 'admin' | 'editor' | 'viewer';
  createdAt: Date;
}
