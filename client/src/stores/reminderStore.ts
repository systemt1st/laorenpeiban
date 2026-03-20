import { create } from 'zustand';
import type { Reminder, ReminderLog, CreateReminderParams, UpdateReminderParams } from '@/types';
import * as api from '@/services/api';

interface ReminderState {
  reminders: Reminder[];
  logs: ReminderLog[];
  isLoading: boolean;

  loadReminders: (userId: string) => Promise<void>;
  addReminder: (params: CreateReminderParams) => Promise<void>;
  updateReminder: (id: string, params: UpdateReminderParams) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  confirmReminder: (id: string) => Promise<void>;
  loadLogs: (userId: string, date?: string) => Promise<void>;
}

export const useReminderStore = create<ReminderState>((set) => ({
  reminders: [],
  logs: [],
  isLoading: false,

  loadReminders: async (userId: string) => {
    set({ isLoading: true });
    try {
      const res = await api.getReminders(userId);
      if (res.success && res.data) {
        set({ reminders: res.data });
      }
    } catch (err) {
      console.error('Failed to load reminders:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  addReminder: async (params: CreateReminderParams) => {
    set({ isLoading: true });
    try {
      const res = await api.createReminder(params);
      if (res.success && res.data) {
        set((state) => ({
          reminders: [...state.reminders, res.data!],
        }));
      }
    } catch (err) {
      console.error('Failed to add reminder:', err);
    } finally {
      set({ isLoading: false });
    }
  },

  updateReminder: async (id: string, params: UpdateReminderParams) => {
    try {
      const res = await api.updateReminder(id, params);
      if (res.success && res.data) {
        set((state) => ({
          reminders: state.reminders.map((r) => (r.id === id ? res.data! : r)),
        }));
      }
    } catch (err) {
      console.error('Failed to update reminder:', err);
    }
  },

  deleteReminder: async (id: string) => {
    try {
      const res = await api.deleteReminder(id);
      if (res.success) {
        set((state) => ({
          reminders: state.reminders.filter((r) => r.id !== id),
        }));
      }
    } catch (err) {
      console.error('Failed to delete reminder:', err);
    }
  },

  confirmReminder: async (id: string) => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;
    try {
      const res = await api.confirmReminder(id, userId);
      if (res.success && res.data) {
        set((state) => ({
          logs: [...state.logs, res.data!],
        }));
      }
    } catch (err) {
      console.error('Failed to confirm reminder:', err);
    }
  },

  loadLogs: async (userId: string, date?: string) => {
    try {
      const res = await api.getReminderLogs(userId, date);
      if (res.success && res.data) {
        set({ logs: res.data });
      }
    } catch (err) {
      console.error('Failed to load reminder logs:', err);
    }
  },
}));
