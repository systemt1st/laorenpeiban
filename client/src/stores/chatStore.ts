import { create } from 'zustand';
import type { Message } from '@/types';
import * as api from '@/services/api';
import { detectEmergencyKeywords } from '@/utils/emergency';

interface ChatState {
  messages: Message[];
  currentConversationId: string | null;
  isLoading: boolean;
  isEmergency: boolean;
  emergencyLevel: string | null;

  sendMessage: (text: string) => Promise<void>;
  loadHistory: (conversationId: string) => Promise<void>;
  clearChat: () => void;
  setEmergency: (level: string | null) => void;
  addWelcomeMessage: (nickname?: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  currentConversationId: null,
  isLoading: false,
  isEmergency: false,
  emergencyLevel: null,

  sendMessage: async (text: string) => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    // Check for emergency keywords
    const detection = detectEmergencyKeywords(text);
    if (detection.isEmergency && detection.level) {
      set({
        isEmergency: true,
        emergencyLevel: detection.level,
      });
    }

    // Add user message to list immediately
    const userMessage: Message = {
      id: `temp-user-${Date.now()}`,
      conversationId: get().currentConversationId || '',
      userId,
      role: 'user',
      content: text,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
    }));

    try {
      const res = await api.sendMessage({
        userId,
        message: text,
        conversationId: get().currentConversationId || undefined,
      });

      if (res.success && res.data) {
        const { reply, conversationId, isEmergency: serverEmergency, emergencyLevel: serverLevel } = res.data;

        // Create assistant message
        const assistantMessage: Message = {
          id: `msg-${Date.now()}`,
          conversationId,
          userId,
          role: 'assistant',
          content: reply,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          messages: [...state.messages, assistantMessage],
          currentConversationId: conversationId,
          isLoading: false,
          isEmergency: state.isEmergency || serverEmergency,
          emergencyLevel: serverLevel || state.emergencyLevel,
        }));
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      // Add error message
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        conversationId: get().currentConversationId || '',
        userId,
        role: 'assistant',
        content: '抱歉，消息发送失败了。请检查网络后重试。',
        createdAt: new Date().toISOString(),
      };
      set((state) => ({
        messages: [...state.messages, errorMessage],
        isLoading: false,
      }));
    }
  },

  loadHistory: async (conversationId: string) => {
    set({ isLoading: true });
    try {
      const res = await api.getChatHistory(conversationId);
      if (res.success && res.data) {
        set({
          messages: res.data,
          currentConversationId: conversationId,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
      set({ isLoading: false });
    }
  },

  clearChat: () => {
    set({
      messages: [],
      currentConversationId: null,
      isLoading: false,
      isEmergency: false,
      emergencyLevel: null,
    });
  },

  setEmergency: (level: string | null) => {
    set({
      isEmergency: level !== null,
      emergencyLevel: level,
    });
  },

  addWelcomeMessage: (nickname?: string) => {
    const hour = new Date().getHours();
    let greeting: string;
    if (hour >= 5 && hour < 12) {
      greeting = '早上好';
    } else if (hour >= 12 && hour < 14) {
      greeting = '中午好';
    } else if (hour >= 14 && hour < 18) {
      greeting = '下午好';
    } else {
      greeting = '晚上好';
    }

    const name = nickname || '您';
    const content = `${greeting}，${name}！我是小助，陪您聊天、提醒和关心您。您想聊点什么？`;

    const welcomeMessage: Message = {
      id: 'welcome',
      conversationId: '',
      userId: '',
      role: 'assistant',
      content,
      createdAt: new Date().toISOString(),
    };

    set((state) => {
      if (state.messages.length === 0) {
        return { messages: [welcomeMessage] };
      }
      return state;
    });
  },
}));
