import { useState, useEffect, useRef, useCallback } from 'react';
import type { Message } from '@/types';
import * as api from '@/services/api';
import { detectEmergencyKeywords } from '@/utils/emergency';
import { useSpeechRecognition } from './useSpeechRecognition';
import { useSpeechSynthesis } from './useSpeechSynthesis';

// ========================================
// Hook 返回值类型
// ========================================

export interface UseChatReturn {
  /** 消息列表 */
  messages: Message[];
  /** 是否正在语音识别 */
  isListening: boolean;
  /** 是否正在语音播报 */
  isSpeaking: boolean;
  /** 是否正在等待 AI 回复 */
  isLoading: boolean;
  /** 是否检测到紧急情况 */
  isEmergency: boolean;
  /** 紧急等级 */
  emergencyLevel: string | null;
  /** 当前语音识别的实时文本（中间结果） */
  currentTranscript: string;
  /** 开始语音输入 */
  startVoiceInput: () => void;
  /** 停止语音输入 */
  stopVoiceInput: () => void;
  /** 发送文本消息 */
  sendTextMessage: (text: string) => void;
  /** 清空所有消息 */
  clearMessages: () => void;
}

// ========================================
// Hook 配置参数
// ========================================

interface UseChatOptions {
  /** 用户 ID，不传则从 localStorage 获取 */
  userId?: string;
  /** 用户昵称，用于生成欢迎消息 */
  nickname?: string;
  /** 已有的会话 ID，用于加载历史消息 */
  conversationId?: string;
  /** 连续对话模式：AI 播报结束后自动重新开始语音识别（默认关闭） */
  continuousMode?: boolean;
}

// ========================================
// 辅助函数
// ========================================

/**
 * 根据当前时间段生成问候语
 */
function generateGreeting(nickname?: string): string {
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
  return `${greeting}，${name}！我是您的陪伴助手，有什么我可以帮您的吗？您可以跟我聊天，或者问我任何问题。`;
}

/**
 * 生成唯一消息 ID
 */
function generateMessageId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ========================================
// useChat Hook
// ========================================

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const {
    userId: propUserId,
    nickname,
    conversationId: initialConversationId,
    continuousMode = false,
  } = options;

  // ---- 状态 ----
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [emergencyLevel, setEmergencyLevel] = useState<string | null>(null);

  // ---- Refs ----
  const conversationIdRef = useRef<string | null>(initialConversationId || null);
  const isMountedRef = useRef(true);
  const isProcessingRef = useRef(false);
  const lastProcessedTranscriptRef = useRef<string>('');

  // ---- 整合语音识别和语音合成 ----
  const {
    isListening,
    transcript,
    finalTranscript,
    error: recognitionError,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  const {
    isSpeaking,
    speak,
    cancel: cancelSpeech,
  } = useSpeechSynthesis();

  /**
   * 获取用户 ID
   */
  const getUserId = useCallback((): string | null => {
    return propUserId || localStorage.getItem('userId');
  }, [propUserId]);

  /**
   * 添加消息到列表
   */
  const addMessage = useCallback((message: Message) => {
    if (!isMountedRef.current) return;
    setMessages((prev) => [...prev, message]);
  }, []);

  /**
   * 核心：发送消息到后端并处理回复
   */
  const processMessage = useCallback(async (text: string) => {
    const trimmedText = text.trim();
    if (!trimmedText || isProcessingRef.current) return;

    const userId = getUserId();
    if (!userId) {
      console.error('[useChat] No userId available');
      return;
    }

    isProcessingRef.current = true;

    // 1. 前端紧急关键词检测
    const detection = detectEmergencyKeywords(trimmedText);
    if (detection.isEmergency && detection.level) {
      setIsEmergency(true);
      setEmergencyLevel(detection.level);
    }

    // 2. 立即添加用户消息到列表
    const userMessage: Message = {
      id: generateMessageId('user'),
      conversationId: conversationIdRef.current || '',
      userId,
      role: 'user',
      content: trimmedText,
      createdAt: new Date().toISOString(),
    };
    addMessage(userMessage);

    // 3. 发送到后端 API
    setIsLoading(true);

    try {
      const res = await api.sendMessage({
        userId,
        message: trimmedText,
        conversationId: conversationIdRef.current || undefined,
      });

      if (!isMountedRef.current) return;

      if (res.success && res.data) {
        const {
          reply,
          conversationId: newConversationId,
          isEmergency: serverEmergency,
          emergencyLevel: serverLevel,
        } = res.data;

        // 更新会话 ID
        conversationIdRef.current = newConversationId;

        // 更新服务端紧急检测结果
        if (serverEmergency) {
          setIsEmergency(true);
          if (serverLevel) {
            setEmergencyLevel(serverLevel);
          }
        }

        // 4. 添加 AI 回复消息
        const assistantMessage: Message = {
          id: generateMessageId('assistant'),
          conversationId: newConversationId,
          userId,
          role: 'assistant',
          content: reply,
          createdAt: new Date().toISOString(),
        };
        addMessage(assistantMessage);

        // 5. 语音播报 AI 回复
        speak(reply);
      } else {
        // API 返回失败
        const errorMessage: Message = {
          id: generateMessageId('error'),
          conversationId: conversationIdRef.current || '',
          userId,
          role: 'assistant',
          content: '抱歉，我暂时无法回复，请稍后再试。',
          createdAt: new Date().toISOString(),
        };
        addMessage(errorMessage);
      }
    } catch (err) {
      if (!isMountedRef.current) return;

      console.error('[useChat] Failed to send message:', err);

      // 网络错误友好提示
      const errorMessage: Message = {
        id: generateMessageId('error'),
        conversationId: conversationIdRef.current || '',
        userId: userId,
        role: 'assistant',
        content: '网络好像不太好，消息没发出去。请检查一下网络，再跟我说一次吧。',
        createdAt: new Date().toISOString(),
      };
      addMessage(errorMessage);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
      isProcessingRef.current = false;
    }
  }, [getUserId, addMessage, speak]);

  /**
   * 当 finalTranscript 变化时，自动发送消息
   * 这是语音输入的核心流转：识别完成 -> 自动发送
   */
  useEffect(() => {
    if (
      finalTranscript &&
      finalTranscript.trim() &&
      finalTranscript !== lastProcessedTranscriptRef.current
    ) {
      lastProcessedTranscriptRef.current = finalTranscript;
      processMessage(finalTranscript);
    }
  }, [finalTranscript, processMessage]);

  /**
   * 连续对话模式：AI 播报结束后自动重新开始语音识别
   */
  useEffect(() => {
    if (
      continuousMode &&
      !isSpeaking &&
      !isListening &&
      !isLoading &&
      messages.length > 0 &&
      // 确保上一条消息是 AI 回复（即刚播报完毕）
      messages[messages.length - 1]?.role === 'assistant' &&
      // 不在紧急状态下自动开始（紧急时需要人工介入）
      !isEmergency
    ) {
      // 短暂延迟后重新开始识别，给用户准备时间
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          resetTranscript();
          startListening();
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [
    continuousMode,
    isSpeaking,
    isListening,
    isLoading,
    messages,
    isEmergency,
    resetTranscript,
    startListening,
  ]);

  /**
   * 处理语音识别错误：显示友好提示
   */
  useEffect(() => {
    if (recognitionError) {
      const userId = getUserId();
      if (!userId || !isMountedRef.current) return;

      // 只对非 "no-speech" 类错误显示消息（无语音不需要特别提示）
      if (!recognitionError.includes('没有检测到语音')) {
        const errorMsg: Message = {
          id: generateMessageId('sys-error'),
          conversationId: conversationIdRef.current || '',
          userId,
          role: 'system',
          content: recognitionError,
          createdAt: new Date().toISOString(),
        };
        addMessage(errorMsg);
      }
    }
  }, [recognitionError, getUserId, addMessage]);

  /**
   * 首次加载：显示欢迎消息
   */
  useEffect(() => {
    const userId = getUserId();
    if (!userId) return;

    // 仅在消息列表为空时添加欢迎消息
    setMessages((prev) => {
      if (prev.length > 0) return prev;

      const welcomeMessage: Message = {
        id: 'welcome',
        conversationId: '',
        userId: '',
        role: 'assistant',
        content: generateGreeting(nickname),
        createdAt: new Date().toISOString(),
      };
      return [welcomeMessage];
    });
    // 仅在初始化时运行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * 组件卸载清理
   */
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ========================================
  // 对外暴露的方法
  // ========================================

  /**
   * 开始语音输入
   */
  const startVoiceInput = useCallback(() => {
    // 如果正在播报，先停止
    cancelSpeech();
    // 重置之前的识别文本
    resetTranscript();
    // 开始识别
    startListening();
  }, [cancelSpeech, resetTranscript, startListening]);

  /**
   * 停止语音输入
   */
  const stopVoiceInput = useCallback(() => {
    stopListening();
  }, [stopListening]);

  /**
   * 发送文本消息（手动输入）
   */
  const sendTextMessage = useCallback((text: string) => {
    if (!text.trim()) return;
    // 如果正在播报，先停止
    cancelSpeech();
    processMessage(text);
  }, [cancelSpeech, processMessage]);

  /**
   * 清空所有消息
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    conversationIdRef.current = null;
    setIsEmergency(false);
    setEmergencyLevel(null);
    resetTranscript();
    cancelSpeech();
    lastProcessedTranscriptRef.current = '';
  }, [resetTranscript, cancelSpeech]);

  return {
    messages,
    isListening,
    isSpeaking,
    isLoading,
    isEmergency,
    emergencyLevel,
    currentTranscript: transcript,
    startVoiceInput,
    stopVoiceInput,
    sendTextMessage,
    clearMessages,
  };
}
