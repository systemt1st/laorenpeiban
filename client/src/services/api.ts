import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import type {
  ApiResponse,
  User,
  ChatResponse,
  Conversation,
  Message,
  Reminder,
  ReminderLog,
  EmergencyContact,
  EmergencyEvent,
  UserPreferences,
  HealthProfile,
  FamilyDashboard,
  CreateUserParams,
  SendMessageParams,
  CreateReminderParams,
  UpdateReminderParams,
  EmergencyContactParams,
  UpdatePreferencesParams,
  UpdateHealthParams,
} from '@/types';

// ========================================
// Axios 实例配置
// ========================================

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 可在此处添加 token 或自定义 header
    const userId = localStorage.getItem('userId');
    if (userId && config.headers) {
      config.headers['X-User-Id'] = userId;
    }
    return config;
  },
  (error: AxiosError) => {
    console.error('[Request Error]', error.message);
    return Promise.reject(error);
  },
);

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response) {
      const { status, data } = error.response;
      const errorMessage = data?.error?.message || '请求失败，请稍后重试';

      switch (status) {
        case 400:
          console.error('[Bad Request]', errorMessage);
          break;
        case 401:
          console.error('[Unauthorized]', errorMessage);
          break;
        case 404:
          console.error('[Not Found]', errorMessage);
          break;
        case 500:
          console.error('[Server Error]', errorMessage);
          break;
        default:
          console.error(`[Error ${status}]`, errorMessage);
      }
    } else if (error.request) {
      console.error('[Network Error] 网络连接失败，请检查网络');
    } else {
      console.error('[Error]', error.message);
    }

    return Promise.reject(error);
  },
);

// ========================================
// 用户相关 API
// ========================================

/** 创建用户 */
export async function createUser(params: CreateUserParams): Promise<ApiResponse<User>> {
  const { data } = await api.post<ApiResponse<User>>('/users', params);
  return data;
}

/** 获取用户信息 */
export async function getUser(userId: string): Promise<ApiResponse<User>> {
  const { data } = await api.get<ApiResponse<User>>(`/users/${userId}`);
  return data;
}

/** 更新用户信息 */
export async function updateUser(
  userId: string,
  params: Partial<Pick<User, 'nickname' | 'age' | 'gender' | 'address' | 'avatarUrl'>>,
): Promise<ApiResponse<User>> {
  const { data } = await api.put<ApiResponse<User>>(`/users/${userId}`, params);
  return data;
}

/** 更新用户偏好设置 */
export async function updatePreferences(
  userId: string,
  params: UpdatePreferencesParams,
): Promise<ApiResponse<UserPreferences>> {
  const { data } = await api.put<ApiResponse<UserPreferences>>(
    `/users/${userId}/preferences`,
    params,
  );
  return data;
}

/** 更新健康档案 */
export async function updateHealth(
  userId: string,
  params: UpdateHealthParams,
): Promise<ApiResponse<HealthProfile>> {
  const { data } = await api.put<ApiResponse<HealthProfile>>(
    `/users/${userId}/health`,
    params,
  );
  return data;
}

// ========================================
// 对话相关 API
// ========================================

/** 发送聊天消息 */
export async function sendMessage(params: SendMessageParams): Promise<ApiResponse<ChatResponse>> {
  const { data } = await api.post<ApiResponse<ChatResponse>>('/chat/send', params);
  return data;
}

/** 获取对话历史消息 */
export async function getChatHistory(
  conversationId: string,
  page: number = 1,
  limit: number = 50,
): Promise<ApiResponse<Message[]>> {
  const { data } = await api.get<ApiResponse<Message[]>>(
    `/chat/conversations/${conversationId}/messages`,
    { params: { page, limit } },
  );
  return data;
}

/** 获取用户对话列表 */
export async function getConversations(
  userId: string,
  page: number = 1,
  limit: number = 20,
): Promise<ApiResponse<Conversation[]>> {
  const { data } = await api.get<ApiResponse<Conversation[]>>(
    `/chat/conversations`,
    { params: { userId, page, limit } },
  );
  return data;
}

// ========================================
// 提醒相关 API
// ========================================

/** 创建提醒 */
export async function createReminder(
  params: CreateReminderParams,
): Promise<ApiResponse<Reminder>> {
  const { data } = await api.post<ApiResponse<Reminder>>('/reminders', params);
  return data;
}

/** 获取用户提醒列表 */
export async function getReminders(userId: string): Promise<ApiResponse<Reminder[]>> {
  const { data } = await api.get<ApiResponse<Reminder[]>>('/reminders', {
    params: { userId },
  });
  return data;
}

/** 更新提醒 */
export async function updateReminder(
  reminderId: string,
  params: UpdateReminderParams,
): Promise<ApiResponse<Reminder>> {
  const { data } = await api.put<ApiResponse<Reminder>>(
    `/reminders/${reminderId}`,
    params,
  );
  return data;
}

/** 删除提醒 */
export async function deleteReminder(reminderId: string): Promise<ApiResponse<null>> {
  const { data } = await api.delete<ApiResponse<null>>(`/reminders/${reminderId}`);
  return data;
}

/** 确认提醒 */
export async function confirmReminder(
  reminderId: string,
  userId: string,
): Promise<ApiResponse<ReminderLog>> {
  const { data } = await api.post<ApiResponse<ReminderLog>>(
    `/reminders/${reminderId}/confirm`,
    { userId },
  );
  return data;
}

/** 获取提醒日志 */
export async function getReminderLogs(
  userId: string,
  date?: string,
): Promise<ApiResponse<ReminderLog[]>> {
  const { data } = await api.get<ApiResponse<ReminderLog[]>>('/reminders/logs', {
    params: { userId, date },
  });
  return data;
}

// ========================================
// 紧急联系人相关 API
// ========================================

/** 添加紧急联系人 */
export async function addEmergencyContact(
  params: EmergencyContactParams,
): Promise<ApiResponse<EmergencyContact>> {
  const { data } = await api.post<ApiResponse<EmergencyContact>>(
    '/emergency/contacts',
    params,
  );
  return data;
}

/** 获取紧急联系人列表 */
export async function getEmergencyContacts(
  userId: string,
): Promise<ApiResponse<EmergencyContact[]>> {
  const { data } = await api.get<ApiResponse<EmergencyContact[]>>(
    '/emergency/contacts',
    { params: { userId } },
  );
  return data;
}

/** 更新紧急联系人 */
export async function updateEmergencyContact(
  contactId: string,
  params: Partial<Omit<EmergencyContactParams, 'userId'>>,
): Promise<ApiResponse<EmergencyContact>> {
  const { data } = await api.put<ApiResponse<EmergencyContact>>(
    `/emergency/contacts/${contactId}`,
    params,
  );
  return data;
}

/** 删除紧急联系人 */
export async function deleteEmergencyContact(
  contactId: string,
): Promise<ApiResponse<null>> {
  const { data } = await api.delete<ApiResponse<null>>(
    `/emergency/contacts/${contactId}`,
  );
  return data;
}

// ========================================
// 紧急事件相关 API
// ========================================

/** 创建紧急事件 */
export async function createEmergencyEvent(
  params: Pick<EmergencyEvent, 'userId' | 'triggerKeyword' | 'userDescription' | 'riskLevel' | 'context'>,
): Promise<ApiResponse<EmergencyEvent>> {
  const { data } = await api.post<ApiResponse<EmergencyEvent>>(
    '/emergency/events',
    params,
  );
  return data;
}

/** 获取紧急事件列表 */
export async function getEmergencyEvents(
  userId: string,
  page: number = 1,
  limit: number = 20,
): Promise<ApiResponse<EmergencyEvent[]>> {
  const { data } = await api.get<ApiResponse<EmergencyEvent[]>>(
    '/emergency/events',
    { params: { userId, page, limit } },
  );
  return data;
}

// ========================================
// 家属相关 API
// ========================================

/** 验证家属码 */
export async function verifyFamilyCode(
  familyCode: string,
): Promise<ApiResponse<{ valid: boolean; userId: string }>> {
  const { data } = await api.post<ApiResponse<{ valid: boolean; userId: string }>>(
    '/family/verify',
    { familyCode },
  );
  return data;
}

/** 获取家属看板数据 */
export async function getFamilyDashboard(
  userId: string,
): Promise<ApiResponse<FamilyDashboard>> {
  const { data } = await api.get<ApiResponse<FamilyDashboard>>(
    `/family/dashboard/${userId}`,
  );
  return data;
}

/** 获取家属概要 */
export async function getFamilySummary(
  userId: string,
  days: number = 7,
): Promise<ApiResponse<{ summary: string; period: string }>> {
  const { data } = await api.get<ApiResponse<{ summary: string; period: string }>>(
    `/family/summary/${userId}`,
    { params: { days } },
  );
  return data;
}

export default api;
