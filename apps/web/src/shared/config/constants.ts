export const API_URL = '/api';

export const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Руководитель',
  LOGIST: 'Логист',
  DRIVER: 'Водитель',
};

export const USER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Ожидает',
  ACTIVE: 'Активен',
  BLOCKED: 'Заблокирован',
};

export const TRIP_STATUS_LABELS: Record<string, string> = {
  ASSIGNED: 'Назначен',
  EN_ROUTE_TO_LOADING: 'Едет на погрузку',
  LOADING: 'На погрузке',
  EN_ROUTE_TO_UNLOADING: 'Едет на выгрузку',
  UNLOADING: 'На выгрузке',
  COMPLETED: 'Завершён',
  CANCELLED: 'Отменён',
};

export const TRIP_STATUS_COLORS: Record<string, string> = {
  ASSIGNED: 'bg-secondary-100 text-secondary-800',
  EN_ROUTE_TO_LOADING: 'bg-accent-100 text-accent-800',
  LOADING: 'bg-primary-100 text-primary-800',
  EN_ROUTE_TO_UNLOADING: 'bg-accent-100 text-accent-800',
  UNLOADING: 'bg-primary-100 text-primary-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export const VEHICLE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Активен',
  INACTIVE: 'Неактивен',
};

export const CONTRACTOR_TYPE_LABELS: Record<string, string> = {
  SENDER: 'Грузоотправитель',
  RECEIVER: 'Грузополучатель',
  BOTH: 'Грузоотправитель/получатель',
};

export const OWNERSHIP_LABELS: Record<string, string> = {
  OWNED: 'Собственность',
  JOINT: 'Совместная',
  LEASED: 'Лизинг',
  RENTED: 'Аренда',
  GRATUITOUS: 'Безвозмездное',
};
