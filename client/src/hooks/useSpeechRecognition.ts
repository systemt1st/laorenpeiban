import { useState, useRef, useCallback, useEffect } from 'react';

// ========================================
// Web Speech API 类型声明
// ========================================

interface SpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
  onspeechend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}

// ========================================
// Hook 返回值类型
// ========================================

export interface UseSpeechRecognitionReturn {
  /** 是否正在识别 */
  isListening: boolean;
  /** 当前识别文本（包含中间结果） */
  transcript: string;
  /** 最终确认的文本 */
  finalTranscript: string;
  /** 错误信息 */
  error: string | null;
  /** 浏览器是否支持语音识别 */
  isSupported: boolean;
  /** 开始语音识别 */
  startListening: () => void;
  /** 停止语音识别 */
  stopListening: () => void;
  /** 重置所有文本 */
  resetTranscript: () => void;
}

// ========================================
// 错误信息映射（中文友好提示）
// ========================================

const ERROR_MESSAGES: Record<string, string> = {
  'not-allowed': '麦克风权限被拒绝，请在浏览器设置中允许使用麦克风',
  'no-speech': '没有检测到语音，请再试一次',
  'network': '网络连接出现问题，请检查网络后重试',
  'audio-capture': '未检测到麦克风设备，请检查麦克风连接',
  'aborted': '语音识别已取消',
  'service-not-allowed': '语音识别服务不可用，请稍后重试',
  'language-not-supported': '不支持当前语言设置',
};

/** 3秒无语音自动停止的超时时长 */
const SILENCE_TIMEOUT_MS = 3000;

// ========================================
// useSpeechRecognition Hook
// ========================================

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 浏览器支持检测
  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // 维护 recognition 实例引用，避免重复创建
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  // 静音超时计时器
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 用于追踪组件是否已卸载
  const isMountedRef = useRef(true);

  // 用于追踪是否主动停止（区分手动停止和自动停止）
  const isManualStopRef = useRef(false);

  /**
   * 清除静音计时器
   */
  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  /**
   * 重置静音计时器（每次有语音活动时重置）
   */
  const resetSilenceTimer = useCallback(() => {
    clearSilenceTimer();
    silenceTimerRef.current = setTimeout(() => {
      // 3秒无语音，自动停止识别
      if (recognitionRef.current && isMountedRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // 忽略已停止状态下的错误
        }
      }
    }, SILENCE_TIMEOUT_MS);
  }, [clearSilenceTimer]);

  /**
   * 获取或创建 SpeechRecognition 实例
   */
  const getRecognition = useCallback((): SpeechRecognitionInstance | null => {
    if (!isSupported) return null;

    if (recognitionRef.current) {
      return recognitionRef.current;
    }

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    const recognition = new SpeechRecognitionAPI();

    // 基本配置
    recognition.lang = 'zh-CN';
    recognition.continuous = false;       // 单次模式，每段话结束后自动停止
    recognition.interimResults = true;    // 实时显示中间结果
    recognition.maxAlternatives = 1;

    // 开始识别回调
    recognition.onstart = () => {
      if (!isMountedRef.current) return;
      setIsListening(true);
      setError(null);
      resetSilenceTimer();
    };

    // 识别结果回调
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (!isMountedRef.current) return;

      let interimText = '';
      let finalText = '';

      // 遍历所有识别结果
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;

        if (result.isFinal) {
          finalText += text;
        } else {
          interimText += text;
        }
      }

      // 有语音活动，重置静音计时器
      resetSilenceTimer();

      // 更新中间结果（实时展示）
      if (interimText) {
        setTranscript(interimText);
      }

      // 更新最终结果
      if (finalText) {
        setFinalTranscript(finalText);
        setTranscript(finalText);
      }
    };

    // 错误回调
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (!isMountedRef.current) return;

      clearSilenceTimer();

      const errorType = event.error;
      const friendlyMessage = ERROR_MESSAGES[errorType] || `语音识别出错：${errorType}`;

      // 'aborted' 和 'no-speech' 不视为严重错误
      if (errorType !== 'aborted') {
        setError(friendlyMessage);
      }

      setIsListening(false);
    };

    // 识别结束回调（无论正常结束还是异常都会触发）
    recognition.onend = () => {
      if (!isMountedRef.current) return;
      clearSilenceTimer();
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    return recognition;
  }, [isSupported, clearSilenceTimer, resetSilenceTimer]);

  /**
   * 开始语音识别
   */
  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('当前浏览器不支持语音识别，请使用 Chrome 或 Edge 浏览器');
      return;
    }

    const recognition = getRecognition();
    if (!recognition) return;

    // 清除之前的状态
    setError(null);
    setTranscript('');
    isManualStopRef.current = false;

    try {
      recognition.start();
    } catch {
      // 可能由于上一次识别未完全停止导致的 InvalidStateError
      // 尝试先停止再重新开始
      try {
        recognition.stop();
      } catch {
        // 忽略
      }
      // 短暂延迟后重试
      setTimeout(() => {
        try {
          recognition.start();
        } catch (retryErr) {
          if (isMountedRef.current) {
            setError('语音识别启动失败，请稍后重试');
            console.error('[SpeechRecognition] Failed to start:', retryErr);
          }
        }
      }, 100);
    }
  }, [isSupported, getRecognition]);

  /**
   * 停止语音识别
   */
  const stopListening = useCallback(() => {
    isManualStopRef.current = true;
    clearSilenceTimer();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // 忽略已停止状态下的错误
      }
    }

    setIsListening(false);
  }, [clearSilenceTimer]);

  /**
   * 重置所有文本
   */
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setFinalTranscript('');
    setError(null);
  }, []);

  /**
   * 组件卸载时的清理
   */
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;

      // 清理静音计时器
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      // 停止识别并释放引用
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // 忽略清理时的错误
        }
        // 移除事件监听，防止回调在卸载后触发
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.onstart = null;
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    finalTranscript,
    error,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
  };
}
