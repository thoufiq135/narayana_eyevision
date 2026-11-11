import { attendanceStudents } from './data/attendanceData';

export type StudentRecord = {
  name: string;
  id: string;
  attendance: number;
  meals: number;
  status: string;
  lastSeen: string;
  meal: string;
  history: Array<{
    date: string;
    meal: string;
    status: string;
    time: string;
  }>;
};

export const attendanceStudents: StudentRecord[] = [ ... ];