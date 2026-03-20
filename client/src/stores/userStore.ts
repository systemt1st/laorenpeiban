import { create } from 'zustand';
import type { User, UserPreferences, HealthProfile, EmergencyContact } from '@/types';
import * as api from '@/services/api';

interface UserState {
  user: User | null;
  preferences: UserPreferences | null;
  health: HealthProfile | null;
  emergencyContacts: EmergencyContact[];
  isSetupComplete: boolean;
  isLoading: boolean;

  setUser: (user: User | null) => void;
  setPreferences: (preferences: UserPreferences | null) => void;
  setHealth: (health: HealthProfile | null) => void;
  setEmergencyContacts: (contacts: EmergencyContact[]) => void;
  loadUser: (id: string) => Promise<void>;
  initUser: (nickname: string, age?: number, gender?: 'male' | 'female' | 'other') => Promise<User | null>;
  checkSetup: () => boolean;
  loadEmergencyContacts: () => Promise<void>;
  addEmergencyContact: (name: string, relationship: string, phone: string, priority?: number) => Promise<void>;
  updateEmergencyContact: (contactId: string, params: Partial<{ name: string; relationship: string; phone: string; priority: number }>) => Promise<void>;
  deleteEmergencyContact: (contactId: string) => Promise<void>;
  updateUserProfile: (params: Partial<Pick<User, 'nickname' | 'age' | 'gender' | 'address'>>) => Promise<void>;
  updateUserPreferences: (params: Partial<Pick<UserPreferences, 'voiceSpeed' | 'voiceVolume' | 'fontSize' | 'interests'>>) => Promise<void>;
  updateUserHealth: (params: Partial<Pick<HealthProfile, 'conditions' | 'medications' | 'allergies'>>) => Promise<void>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  preferences: null,
  health: null,
  emergencyContacts: [],
  isSetupComplete: false,
  isLoading: false,

  setUser: (user) => {
    set({ user });
    if (user) {
      localStorage.setItem('userId', user.id);
    } else {
      localStorage.removeItem('userId');
    }
  },

  setPreferences: (preferences) => set({ preferences }),

  setHealth: (health) => set({ health }),

  setEmergencyContacts: (contacts) => set({ emergencyContacts: contacts }),

  loadUser: async (id: string) => {
    set({ isLoading: true });
    try {
      const res = await api.getUser(id);
      if (res.success && res.data) {
        set({ user: res.data, isSetupComplete: true });
        localStorage.setItem('userId', id);
      }
    } catch (err) {
      console.error('Failed to load user:', err);
      localStorage.removeItem('userId');
      set({ isSetupComplete: false });
    } finally {
      set({ isLoading: false });
    }
  },

  initUser: async (nickname, age = 70, gender = 'other') => {
    set({ isLoading: true });
    try {
      const res = await api.createUser({ nickname, age, gender });
      if (res.success && res.data) {
        set({ user: res.data, isSetupComplete: true });
        localStorage.setItem('userId', res.data.id);
        return res.data;
      }
      return null;
    } catch (err) {
      console.error('Failed to init user:', err);
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  checkSetup: () => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      set({ isSetupComplete: true });
      return true;
    }
    set({ isSetupComplete: false });
    return false;
  },

  loadEmergencyContacts: async () => {
    const { user } = get();
    if (!user) return;
    try {
      const res = await api.getEmergencyContacts(user.id);
      if (res.success && res.data) {
        set({ emergencyContacts: res.data });
      }
    } catch (err) {
      console.error('Failed to load emergency contacts:', err);
    }
  },

  addEmergencyContact: async (name, relationship, phone, priority = 1) => {
    const { user } = get();
    if (!user) return;
    try {
      const res = await api.addEmergencyContact({
        userId: user.id,
        name,
        relationship,
        phone,
        priority,
      });
      if (res.success && res.data) {
        set((state) => ({
          emergencyContacts: [...state.emergencyContacts, res.data!],
        }));
      }
    } catch (err) {
      console.error('Failed to add emergency contact:', err);
    }
  },

  updateEmergencyContact: async (contactId, params) => {
    try {
      const res = await api.updateEmergencyContact(contactId, params);
      if (res.success && res.data) {
        set((state) => ({
          emergencyContacts: state.emergencyContacts.map((c) =>
            c.id === contactId ? res.data! : c
          ),
        }));
      }
    } catch (err) {
      console.error('Failed to update emergency contact:', err);
    }
  },

  deleteEmergencyContact: async (contactId) => {
    try {
      const res = await api.deleteEmergencyContact(contactId);
      if (res.success) {
        set((state) => ({
          emergencyContacts: state.emergencyContacts.filter((c) => c.id !== contactId),
        }));
      }
    } catch (err) {
      console.error('Failed to delete emergency contact:', err);
    }
  },

  updateUserProfile: async (params) => {
    const { user } = get();
    if (!user) return;
    try {
      const res = await api.updateUser(user.id, params);
      if (res.success && res.data) {
        set({ user: res.data });
      }
    } catch (err) {
      console.error('Failed to update user profile:', err);
    }
  },

  updateUserPreferences: async (params) => {
    const { user } = get();
    if (!user) return;
    try {
      const res = await api.updatePreferences(user.id, params);
      if (res.success && res.data) {
        set({ preferences: res.data });
      }
    } catch (err) {
      console.error('Failed to update preferences:', err);
    }
  },

  updateUserHealth: async (params) => {
    const { user } = get();
    if (!user) return;
    try {
      const res = await api.updateHealth(user.id, params);
      if (res.success && res.data) {
        set({ health: res.data });
      }
    } catch (err) {
      console.error('Failed to update health:', err);
    }
  },
}));
