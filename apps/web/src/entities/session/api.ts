import { api } from '@/shared/api/client';

export interface User {
  id: string;
  login: string;
  fullName: string;
  phone: string | null;
  role: 'ADMIN' | 'LOGIST' | 'DRIVER';
  status: 'PENDING' | 'ACTIVE' | 'BLOCKED';
  telegramChatId: string | null;
  telegramLinkedAt: string | null;
}

interface LoginResponse {
  accessToken?: string;
  refreshToken?: string;
  status: 'ACTIVE' | 'PENDING';
}

interface RegisterResponse {
  id: string;
  status: string;
}

export async function loginFn(data: {
  login: string;
  password: string;
}): Promise<LoginResponse> {
  const res = await api.post<LoginResponse>('/auth/login', data);
  return res.data;
}

export async function registerFn(data: {
  login: string;
  password: string;
  fullName: string;
  phone?: string;
}): Promise<RegisterResponse> {
  const res = await api.post<RegisterResponse>('/auth/register', data);
  return res.data;
}

export async function getMeFn(): Promise<User> {
  const res = await api.get<User>('/auth/me');
  return res.data;
}
