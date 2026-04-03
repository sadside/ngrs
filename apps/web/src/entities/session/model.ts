import { createStore, createEvent, sample } from 'effector';
import type { User } from './api';
import { clearTokens } from '@/shared/lib/auth';

export const sessionSet = createEvent<User>();
export const sessionCleared = createEvent();

export const $user = createStore<User | null>(null)
  .on(sessionSet, (_, user) => user)
  .reset(sessionCleared);

export const $isAuth = $user.map((user) => user !== null);
export const $role = $user.map((user) => user?.role ?? null);
export const $isAdmin = $role.map((role) => role === 'ADMIN');
export const $isLogist = $role.map((role) => role === 'LOGIST');
export const $isDriver = $role.map((role) => role === 'DRIVER');
export const $isAdminOrLogist = $role.map(
  (role) => role === 'ADMIN' || role === 'LOGIST',
);

sample({
  clock: sessionCleared,
  fn: () => clearTokens(),
});
