export type UserRole = 'admin' | 'teacher' | 'student';

export type UserStatus = 'active' | 'blocked' | 'pending';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatar?: string;
  createdAt: Date;
  lastLogin?: Date;
  classIds: string[];
  phone?: string;
  bio?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  emailVerified: boolean;
}

export type EventType = 'class' | 'exam' | 'assignment' | 'holiday' | 'meeting' | 'other';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // ISO date string
  startTime?: string; // HH:MM
  endTime?: string;   // HH:MM
  type: EventType;
  classId?: string;
  createdBy: string;
  recurrence: RecurrenceType;
  recurrenceEnd?: string;
  reminder?: number; // minutes before
  color?: string;
  attendees?: string[]; // user ids
}

export interface Class {
  id: string;
  name: string;
  subject: string;
  description?: string;
  teacherId: string;
  studentIds: string[];
  code: string; // join code
  createdAt: Date;
  schedule?: string; // e.g. "Mon/Wed 10:00-11:30"
  room?: string;
  color: string;
  isArchived: boolean;
}

export type AssignmentStatus = 'pending' | 'submitted' | 'graded' | 'late';

export interface Assignment {
  id: string;
  title: string;
  description: string;
  classId: string;
  createdBy: string;
  dueDate: string;
  maxScore?: number;
  attachments?: Attachment[];
  submissions: Submission[];
  createdAt: Date;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  submittedAt?: Date;
  status: AssignmentStatus;
  score?: number;
  feedback?: string;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  uploadedAt: Date;
}

export interface AttendanceRecord {
  id: string;
  classId: string;
  date: string;
  records: { studentId: string; present: boolean; note?: string }[];
  createdBy: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  read: boolean;
  createdAt: Date;
  link?: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  activeEvents: number;
  pendingAssignments: number;
  attendanceRate: number;
}

export type CalendarView = 'month' | 'week' | 'day';

export interface CalendarState {
  currentDate: Date;
  view: CalendarView;
  events: CalendarEvent[];
  selectedEvent: CalendarEvent | null;
}
