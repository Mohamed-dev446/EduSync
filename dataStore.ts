import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CalendarEvent, Class, Assignment, AttendanceRecord, Notification, User, Submission
} from '../types';
import {
  MOCK_EVENTS, MOCK_CLASSES, MOCK_ASSIGNMENTS, MOCK_ATTENDANCE, MOCK_NOTIFICATIONS, MOCK_USERS
} from '../lib/mockData';
import { generateId } from '../lib/utils';
import { userRegistry } from './authStore';

interface DataStore {
  events: CalendarEvent[];
  classes: Class[];
  assignments: Assignment[];
  attendance: AttendanceRecord[];
  notifications: Notification[];
  users: User[];

  // Events
  addEvent: (event: Omit<CalendarEvent, 'id'>) => CalendarEvent;
  updateEvent: (id: string, data: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;

  // Classes
  addClass: (cls: Omit<Class, 'id' | 'code' | 'createdAt' | 'isArchived'>) => Class;
  updateClass: (id: string, data: Partial<Class>) => void;
  deleteClass: (id: string) => void;
  archiveClass: (id: string) => void;
  addStudentToClass: (classId: string, studentId: string) => void;
  removeStudentFromClass: (classId: string, studentId: string) => void;
  joinClassByCode: (code: string, studentId: string) => { success: boolean; error?: string };

  // Assignments
  addAssignment: (assignment: Omit<Assignment, 'id' | 'createdAt' | 'submissions'>) => Assignment;
  updateAssignment: (id: string, data: Partial<Assignment>) => void;
  deleteAssignment: (id: string) => void;
  submitAssignment: (assignmentId: string, studentId: string, data: Partial<Submission>) => void;
  gradeSubmission: (assignmentId: string, submissionId: string, score: number, feedback?: string) => void;

  // Attendance
  saveAttendance: (record: Omit<AttendanceRecord, 'id'>) => void;
  getAttendanceForClass: (classId: string) => AttendanceRecord[];

  // Notifications
  addNotification: (notif: Omit<Notification, 'id' | 'createdAt'>) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: (userId: string) => void;
  getUserNotifications: (userId: string) => Notification[];

  // Users
  getUsers: () => User[];
  updateUser: (id: string, data: Partial<User>) => void;
  blockUser: (id: string) => void;
  unblockUser: (id: string) => void;
  deleteUser: (id: string) => void;

  // Reset
  resetToMock: () => void;
}

import { generateClassCode } from '../lib/utils';

export const useDataStore = create<DataStore>()(
  persist(
    (set, get) => ({
      events: MOCK_EVENTS,
      classes: MOCK_CLASSES,
      assignments: MOCK_ASSIGNMENTS,
      attendance: MOCK_ATTENDANCE,
      notifications: MOCK_NOTIFICATIONS,
      users: MOCK_USERS,

      // ─── Events ───────────────────────────────────────────────────────────
      addEvent: (event) => {
        const newEvent: CalendarEvent = { ...event, id: generateId() };
        set((s) => ({ events: [...s.events, newEvent] }));
        return newEvent;
      },
      updateEvent: (id, data) => {
        set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, ...data } : e)) }));
      },
      deleteEvent: (id) => {
        set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
      },

      // ─── Classes ──────────────────────────────────────────────────────────
      addClass: (cls) => {
        const newClass: Class = {
          ...cls,
          id: generateId(),
          code: generateClassCode(),
          createdAt: new Date(),
          isArchived: false,
        };
        set((s) => ({ classes: [...s.classes, newClass] }));
        return newClass;
      },
      updateClass: (id, data) => {
        set((s) => ({ classes: s.classes.map((c) => (c.id === id ? { ...c, ...data } : c)) }));
      },
      deleteClass: (id) => {
        set((s) => ({ classes: s.classes.filter((c) => c.id !== id) }));
      },
      archiveClass: (id) => {
        set((s) => ({
          classes: s.classes.map((c) => (c.id === id ? { ...c, isArchived: !c.isArchived } : c)),
        }));
      },
      addStudentToClass: (classId, studentId) => {
        set((s) => ({
          classes: s.classes.map((c) =>
            c.id === classId && !c.studentIds.includes(studentId)
              ? { ...c, studentIds: [...c.studentIds, studentId] }
              : c
          ),
        }));
      },
      removeStudentFromClass: (classId, studentId) => {
        set((s) => ({
          classes: s.classes.map((c) =>
            c.id === classId
              ? { ...c, studentIds: c.studentIds.filter((id) => id !== studentId) }
              : c
          ),
        }));
      },
      joinClassByCode: (code, studentId) => {
        const cls = get().classes.find((c) => c.code.toUpperCase() === code.toUpperCase());
        if (!cls) return { success: false, error: 'Código de clase no encontrado.' };
        if (cls.isArchived) return { success: false, error: 'Esta clase está archivada.' };
        if (cls.studentIds.includes(studentId)) return { success: false, error: 'Ya estás en esta clase.' };
        get().addStudentToClass(cls.id, studentId);
        return { success: true };
      },

      // ─── Assignments ──────────────────────────────────────────────────────
      addAssignment: (assignment) => {
        const newAssignment: Assignment = {
          ...assignment,
          id: generateId(),
          createdAt: new Date(),
          submissions: [],
        };
        set((s) => ({ assignments: [...s.assignments, newAssignment] }));
        return newAssignment;
      },
      updateAssignment: (id, data) => {
        set((s) => ({
          assignments: s.assignments.map((a) => (a.id === id ? { ...a, ...data } : a)),
        }));
      },
      deleteAssignment: (id) => {
        set((s) => ({ assignments: s.assignments.filter((a) => a.id !== id) }));
      },
      submitAssignment: (assignmentId, studentId, data) => {
        set((s) => ({
          assignments: s.assignments.map((a) => {
            if (a.id !== assignmentId) return a;
            const existing = a.submissions.find((sub) => sub.studentId === studentId);
            if (existing) {
              return {
                ...a,
                submissions: a.submissions.map((sub) =>
                  sub.studentId === studentId
                    ? { ...sub, ...data, status: 'submitted' as const, submittedAt: new Date() }
                    : sub
                ),
              };
            }
            const newSub: Submission = {
              id: generateId(),
              assignmentId,
              studentId,
              status: 'submitted',
              submittedAt: new Date(),
              attachments: [],
              ...data,
            };
            return { ...a, submissions: [...a.submissions, newSub] };
          }),
        }));
      },
      gradeSubmission: (assignmentId, submissionId, score, feedback) => {
        set((s) => ({
          assignments: s.assignments.map((a) => {
            if (a.id !== assignmentId) return a;
            return {
              ...a,
              submissions: a.submissions.map((sub) =>
                sub.id === submissionId
                  ? { ...sub, score, feedback, status: 'graded' as const }
                  : sub
              ),
            };
          }),
        }));
      },

      // ─── Attendance ───────────────────────────────────────────────────────
      saveAttendance: (record) => {
        const existing = get().attendance.find(
          (a) => a.classId === record.classId && a.date === record.date
        );
        if (existing) {
          set((s) => ({
            attendance: s.attendance.map((a) =>
              a.classId === record.classId && a.date === record.date
                ? { ...a, records: record.records }
                : a
            ),
          }));
        } else {
          const newRecord: AttendanceRecord = { ...record, id: generateId() };
          set((s) => ({ attendance: [...s.attendance, newRecord] }));
        }
      },
      getAttendanceForClass: (classId) => {
        return get().attendance.filter((a) => a.classId === classId);
      },

      // ─── Notifications ────────────────────────────────────────────────────
      addNotification: (notif) => {
        const newNotif: Notification = { ...notif, id: generateId(), createdAt: new Date() };
        set((s) => ({ notifications: [newNotif, ...s.notifications] }));
      },
      markNotificationRead: (id) => {
        set((s) => ({
          notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }));
      },
      markAllRead: (userId) => {
        set((s) => ({
          notifications: s.notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n)),
        }));
      },
      getUserNotifications: (userId) => {
        return get().notifications.filter((n) => n.userId === userId).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      },

      // ─── Users ────────────────────────────────────────────────────────────
      getUsers: () => {
        // Merge store users with auth registry
        return get().users;
      },
      updateUser: (id, data) => {
        set((s) => ({ users: s.users.map((u) => (u.id === id ? { ...u, ...data } : u)) }));
      },
      blockUser: (id) => {
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, status: 'blocked' as const } : u)),
        }));
      },
      unblockUser: (id) => {
        set((s) => ({
          users: s.users.map((u) => (u.id === id ? { ...u, status: 'active' as const } : u)),
        }));
      },
      deleteUser: (id) => {
        set((s) => ({ users: s.users.filter((u) => u.id !== id) }));
      },

      resetToMock: () => {
        set({
          events: MOCK_EVENTS,
          classes: MOCK_CLASSES,
          assignments: MOCK_ASSIGNMENTS,
          attendance: MOCK_ATTENDANCE,
          notifications: MOCK_NOTIFICATIONS,
          users: MOCK_USERS,
        });
      },
    }),
    {
      name: 'edusync-data',
    }
  )
);
