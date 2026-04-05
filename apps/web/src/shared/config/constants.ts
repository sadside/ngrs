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

export const VEHICLE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Активен',
  IN_REPAIR: 'На ремонте',
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
