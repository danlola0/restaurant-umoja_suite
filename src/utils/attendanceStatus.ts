import { AttendanceRecord, AttendanceType } from '../types';

export type DutyStatus = 'HORS_SERVICE' | 'EN_SERVICE' | 'EN_PAUSE' | 'TERMINE';

export function todayDateStr() {
  return new Date().toISOString().slice(0, 10);
}

export function deriveDutyStatus(records: AttendanceRecord[], employeeId: string, date = todayDateStr()): DutyStatus {
  const today = records
    .filter(record => record.employeeId === employeeId && record.date === date)
    .sort((a, b) => a.timestamp - b.timestamp);
  if (today.length === 0) return 'HORS_SERVICE';
  const last = today[today.length - 1];
  if (last.type === 'SORTIE') return 'TERMINE';
  if (last.type === 'DEBUT_PAUSE') return 'EN_PAUSE';
  return 'EN_SERVICE';
}

export function dutyStatusLabel(status: DutyStatus) {
  switch (status) {
    case 'EN_SERVICE': return 'En service';
    case 'EN_PAUSE': return 'En pause';
    case 'TERMINE': return 'Terminé';
    default: return 'Hors service';
  }
}

export const ATTENDANCE_TYPE_LABELS: Record<AttendanceType, string> = {
  ENTREE: 'Prise de poste',
  DEBUT_PAUSE: 'Début de pause',
  FIN_PAUSE: 'Fin de pause',
  SORTIE: 'Fin de service',
};
