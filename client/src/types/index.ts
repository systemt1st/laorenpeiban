// ========================================
// 用户相关类型
// ========================================

export interface User {
  id: string;
  nickname: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  address: string;
  avatarUrl: string;
  familyCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  voiceSpeed: number;
  voiceVolume: number;
  fontSize: 'large' | 'xlarge' | 'xxlarge';
  interests: string[];
}

export interface HealthProfile {
  id: string;
  userId: string;
  conditions: string[];
  medications: string[];
  allergies: string;
}

// ========================================
// 对话相关类型
// ========================================

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  summary: string;
  mood: string;
  messageCount: number;
  startedAt: string;
  endedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

// ========================================
// 提醒相关类型
// ========================================

export interface Reminder {
  id: string;
  userId: string;
  type: 'medicine' | 'water' | 'checkup' | 'custom';
  title: string;
  description: string;
  time: string;
  days: number[];
  repeat: boolean;
  enabled: boolean;
  extraData: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface ReminderLog {
  id: string;
  reminderId: string;
  userId: string;
  triggeredAt: string;
  confirmed: boolean;
  confirmedAt: string | null;
}

// ========================================
// 紧急联系相关类型
// ========================================

export interface EmergencyContact {
  id: string;
  userId: string;
  name: string;
  relationship: string;
  phone: string;
  priority: number;
  createdAt: string;
}

export interface EmergencyEvent {
  id: string;
  userId: string;
  triggerKeyword: string;
  userDescription: string;
  riskLevel: 'critical' | 'high' | 'medium';
  actionTaken: string;
  context: string;
  resolved: boolean;
  createdAt: string;
  resolvedAt: string | null;
}

// ========================================
// API 通用类型
// ========================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface ChatResponse {
  reply: string;
  conversationId: string;
  mood: string;
  isEmergency: boolean;
  emergencyLevel: string | null;
}

// ========================================
// 家属看板类型
// ========================================

export interface FamilyDashboard {
  user: User;
  todayStats: {
    chatCount: number;
    mood: string;
    reminderTotal: number;
    reminderCompleted: number;
    emergencyCount: number;
  };
  recentSummary: string;
  reminderLogs: ReminderLog[];
}

// ========================================
// 请求参数类型
// ========================================

export interface CreateUserParams {
  nickname: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  address?: string;
}

export interface SendMessageParams {
  userId: string;
  message: string;
  conversationId?: string;
}

export interface CreateReminderParams {
  userId: string;
  type: Reminder['type'];
  title: string;
  description?: string;
  time: string;
  days: number[];
  repeat?: boolean;
  extraData?: Record<string, unknown>;
}

export interface UpdateReminderParams {
  title?: string;
  description?: string;
  time?: string;
  days?: number[];
  repeat?: boolean;
  enabled?: boolean;
  extraData?: Record<string, unknown>;
}

export interface EmergencyContactParams {
  userId: string;
  name: string;
  relationship: string;
  phone: string;
  priority?: number;
}

export interface UpdatePreferencesParams {
  voiceSpeed?: number;
  voiceVolume?: number;
  fontSize?: 'large' | 'xlarge' | 'xxlarge';
  interests?: string[];
}

export interface UpdateHealthParams {
  conditions?: string[];
  medications?: string[];
  allergies?: string;
}
