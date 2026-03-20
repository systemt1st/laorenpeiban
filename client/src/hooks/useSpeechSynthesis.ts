import { useState, useRef, useCallback, useEffect } from 'react';

// ========================================
// Hook 返回值类型
// ========================================

export interface UseSpeechSynthesisReturn {
  /** 是否正在播报 */
  isSpeaking: boolean;
  /** 浏览器是否支持语音合成 */
  isSupported: boolean;
  /** 播报文字 */
  speak: (text: string) => void;
  /** 停止播报 */
  cancel: () => void;
  /** 设置语速 (0.5-2.0) */
  setRate: (rate: number) => void;
  /** 设置音量 (0-1) */
  setVolume: (vol: number) => void;
}

/** 段落间的停顿时长（毫秒） */
const PAUSE_BETWEEN_SEGMENTS_MS = 300;

/** 默认语速（适合老年人，稍慢） */
const DEFAULT_RATE = 0.9;

/** 默认音量 */
const DEFAULT_VOLUME = 1.0;

// ========================================
// 辅助函数
// ========================================

/**
 * 将长文本按句号、问号、感叹号分段，避免长文本被浏览器截断。
 * 分段策略：按中文和英文标点拆分，保留标点在句尾。
 */
function splitTextIntoSegments(text: string): string[] {
  // 按中英文句号、问号、感叹号分割，保留分隔符
  const segments = text.split(/(?<=[。！？.!?])/);

  // 过滤空字符串并去除首尾空白
  const result: string[] = [];
  let buffer = '';

  for (const segment of segments) {
    const trimmed = segment.trim();
    if (!trimmed) continue;

    buffer += trimmed;

    // 如果当前片段已经以句末标点结尾，或者缓冲区长度已够，则输出
    if (/[。！？.!?]$/.test(buffer) || buffer.length >= 100) {
      result.push(buffer);
      buffer = '';
    }
  }

  // 处理最后剩余的文本
  if (buffer.trim()) {
    result.push(buffer.trim());
  }

  // 如果原文没有任何分隔符，返回原文整体
  if (result.length === 0 && text.trim()) {
    result.push(text.trim());
  }

  return result;
}

/**
 * 尝试从可用语音列表中找到中文语音
 */
function findChineseVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  // 优先精确匹配 zh-CN
  const zhCNVoice = voices.find(
    (v) => v.lang === 'zh-CN' || v.lang === 'zh_CN',
  );
  if (zhCNVoice) return zhCNVoice;

  // 其次匹配 zh 开头的任意方言
  const zhVoice = voices.find(
    (v) => v.lang.startsWith('zh'),
  );
  if (zhVoice) return zhVoice;

  // 最后尝试匹配名称中含 Chinese 的
  const chineseVoice = voices.find(
    (v) => v.name.toLowerCase().includes('chinese') || v.name.includes('中文'),
  );
  if (chineseVoice) return chineseVoice;

  return null;
}

// ========================================
// useSpeechSynthesis Hook
// ========================================

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);

  // 浏览器支持检测
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // 语速和音量使用 ref 存储，避免触发不必要的重新渲染
  const rateRef = useRef(DEFAULT_RATE);
  const volumeRef = useRef(DEFAULT_VOLUME);

  // 中文语音缓存
  const chineseVoiceRef = useRef<SpeechSynthesisVoice | null>(null);
  const voicesLoadedRef = useRef(false);

  // 分段播报的队列和计时器
  const segmentQueueRef = useRef<string[]>([]);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 组件卸载标记
  const isMountedRef = useRef(true);

  // 当前是否正在执行分段播报流程
  const isPlayingQueueRef = useRef(false);

  /**
   * 加载并缓存中文语音
   */
  const loadVoices = useCallback(() => {
    if (!isSupported || voicesLoadedRef.current) return;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      chineseVoiceRef.current = findChineseVoice(voices);
      voicesLoadedRef.current = true;
    }
  }, [isSupported]);

  /**
   * 初始化：监听 voiceschanged 事件加载语音列表
   * 部分浏览器（Chrome）异步加载语音列表，需要监听此事件
   */
  useEffect(() => {
    if (!isSupported) return;

    // 立即尝试加载
    loadVoices();

    // 监听异步加载
    const handleVoicesChanged = () => {
      loadVoices();
    };

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
    };
  }, [isSupported, loadVoices]);

  /**
   * 清理停顿计时器
   */
  const clearPauseTimer = useCallback(() => {
    if (pauseTimerRef.current) {
      clearTimeout(pauseTimerRef.current);
      pauseTimerRef.current = null;
    }
  }, []);

  /**
   * 播报队列中的下一段文本
   */
  const speakNextSegment = useCallback(() => {
    if (!isMountedRef.current || !isSupported) {
      isPlayingQueueRef.current = false;
      setIsSpeaking(false);
      return;
    }

    const nextText = segmentQueueRef.current.shift();

    if (!nextText) {
      // 队列已空，播报结束
      isPlayingQueueRef.current = false;
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(nextText);

    // 配置语音参数
    utterance.lang = 'zh-CN';
    utterance.rate = rateRef.current;
    utterance.volume = volumeRef.current;
    utterance.pitch = 1.0;

    // 设置中文语音（如果可用）
    if (chineseVoiceRef.current) {
      utterance.voice = chineseVoiceRef.current;
    }

    // 当前段播报结束
    utterance.onend = () => {
      if (!isMountedRef.current) return;

      if (segmentQueueRef.current.length > 0) {
        // 还有后续段落，添加停顿后继续播报
        pauseTimerRef.current = setTimeout(() => {
          speakNextSegment();
        }, PAUSE_BETWEEN_SEGMENTS_MS);
      } else {
        // 全部播报完毕
        isPlayingQueueRef.current = false;
        setIsSpeaking(false);
      }
    };

    // 错误处理
    utterance.onerror = (event) => {
      if (!isMountedRef.current) return;

      // 'canceled' 不是真正的错误，是调用 cancel() 后的正常行为
      if (event.error !== 'canceled') {
        console.error('[SpeechSynthesis] Error:', event.error);
      }

      // 出错时清空队列，停止播报
      segmentQueueRef.current = [];
      isPlayingQueueRef.current = false;
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, [isSupported]);

  /**
   * 播报文字
   * - 自动取消之前的播报
   * - 长文本按标点分段播报
   * - iOS Safari 兼容处理
   */
  const speak = useCallback((text: string) => {
    if (!isSupported || !text.trim()) return;

    // 先取消当前正在进行的播报
    window.speechSynthesis.cancel();
    clearPauseTimer();
    segmentQueueRef.current = [];
    isPlayingQueueRef.current = false;

    // 确保语音列表已加载
    if (!voicesLoadedRef.current) {
      loadVoices();
    }

    // iOS Safari 兼容处理：
    // iOS 要求 speechSynthesis.speak() 必须在用户交互的调用栈中执行。
    // 这里通过 resume() 来确保合成引擎处于活跃状态。
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    // 将文本分段
    const segments = splitTextIntoSegments(text);
    segmentQueueRef.current = segments;
    isPlayingQueueRef.current = true;

    setIsSpeaking(true);

    // 开始播报第一段
    speakNextSegment();
  }, [isSupported, clearPauseTimer, loadVoices, speakNextSegment]);

  /**
   * 停止播报
   */
  const cancel = useCallback(() => {
    if (!isSupported) return;

    // 清空段落队列
    segmentQueueRef.current = [];
    isPlayingQueueRef.current = false;
    clearPauseTimer();

    // 取消当前正在播报的语音
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported, clearPauseTimer]);

  /**
   * 设置语速
   * @param rate 语速，范围 0.5 ~ 2.0
   */
  const setRate = useCallback((rate: number) => {
    rateRef.current = Math.max(0.5, Math.min(2.0, rate));
  }, []);

  /**
   * 设置音量
   * @param vol 音量，范围 0 ~ 1
   */
  const setVolume = useCallback((vol: number) => {
    volumeRef.current = Math.max(0, Math.min(1, vol));
  }, []);

  /**
   * 组件卸载时的清理
   */
  useEffect(() => {
    isMountedRef.current = true;

    // Chrome 有一个已知 bug：长时间不活动后 speechSynthesis 会暂停。
    // 通过定期 resume() 来解决此问题。
    let keepAliveTimer: ReturnType<typeof setInterval> | null = null;

    if (isSupported) {
      keepAliveTimer = setInterval(() => {
        if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
          // 引擎正常工作中，不需要干预
        } else if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }, 5000);
    }

    return () => {
      isMountedRef.current = false;

      // 清理定时器
      if (keepAliveTimer) {
        clearInterval(keepAliveTimer);
      }

      if (pauseTimerRef.current) {
        clearTimeout(pauseTimerRef.current);
        pauseTimerRef.current = null;
      }

      // 取消所有播报
      segmentQueueRef.current = [];
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  return {
    isSpeaking,
    isSupported,
    speak,
    cancel,
    setRate,
    setVolume,
  };
}
