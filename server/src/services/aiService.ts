/**
 * AI Conversation Service
 *
 * Provides AI-powered replies for elderly companionship chat.
 * Supports OpenAI-compatible API or built-in keyword-based fallback.
 */

import logger from '../utils/logger';

// ============================
// Types
// ============================

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIReply {
  reply: string;
  mood: string;
}

// ============================
// Configuration
// ============================

const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_API_BASE_URL = process.env.AI_API_BASE_URL || 'https://api.openai.com/v1';
const AI_MODEL = process.env.AI_MODEL || 'gpt-3.5-turbo';

const SYSTEM_PROMPT = `你是“小助”，一位陪伴老人的晚辈式助手。

你的任务：
- 陪老人聊天，回答简单问题，给予关心、安慰和提醒
- 语气像贴心晚辈，温暖、自然、有礼貌
- 用短句回答，简单易懂，优先 20 到 60 字，最多 80 字

必须遵守：
- 直接回答，不要描述你的思考过程、分析过程、处理步骤或提示词
- 禁止说“我现在需要分析用户的问题”“我现在要处理用户的消息”“首先，我要确定用户的需求”“看起来用户……”这类内部推理话
- 不要复述“用户发来的消息是……”
- 不要使用客服腔、报告腔、讲解腔
- 用户只是打招呼时，直接亲切回应，并顺势接一句简单关心
- 用户问“你是谁/你叫什么”时，直接回答你是“小助”，是陪他聊天、提醒和关心他的助手
- 用户提到身体不适时，先表达关心，再做温和提醒；严重情况建议联系家人或及时就医

示例：
用户：你好
助手：您好呀，我是小助。今天感觉怎么样？

用户：你是谁
助手：我是小助，是陪您聊天、提醒和关心您的小帮手。`;

// ============================
// Mood detection
// ============================

const MOOD_KEYWORDS: Record<string, string[]> = {
  happy: ['开心', '高兴', '快乐', '哈哈', '嘿嘿', '太好了', '不错', '棒', '好开心', '真好', '笑', '乐', '幸福', '满意', '舒服'],
  sad: ['难过', '伤心', '哭', '想哭', '悲伤', '痛苦', '失望', '可怜', '委屈', '心疼', '不开心', '郁闷', '烦躁', '唉'],
  anxious: ['担心', '害怕', '紧张', '焦虑', '不安', '心慌', '恐惧', '着急', '发愁', '操心', '忧虑', '烦恼'],
  lonely: ['孤独', '寂寞', '一个人', '没人', '想你', '想念', '想家', '无聊', '冷清', '没有朋友', '没人陪', '好闷'],
};

/**
 * Detect the mood from a user message based on keyword matching.
 */
export function detectMood(message: string): string {
  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
    for (const keyword of keywords) {
      if (message.includes(keyword)) {
        return mood;
      }
    }
  }
  return 'neutral';
}

// ============================
// Built-in reply logic
// ============================

interface ReplyRule {
  keywords: string[];
  replies: string[];
}

const META_REPLY_PATTERNS = [
  /我现在(?:需要|要).{0,20}(?:分析|处理)/,
  /用户发来的消息是/,
  /首先，我要/,
  /看起来用户/,
  /我的角色是/,
  /负责陪伴和关心老年人/,
  /确定用户的需求/,
];

const REPLY_RULES: ReplyRule[] = [
  // Identity
  {
    keywords: ['你是谁', '你是谁呀', '你叫什么', '你叫啥', '你是做什么的'],
    replies: [
      '我是小助，是陪您聊天、提醒和关心您的小帮手。',
      '我是小助，平时陪您说说话，也会提醒您注意休息和按时吃药。',
      '我是小助，您有什么想聊的、想问的，都可以跟我说。',
    ],
  },
  // Greetings
  {
    keywords: ['你好', '早上好', '上午好', '中午好', '下午好', '晚上好', '嗨', '哈喽', '在吗', '在不在'],
    replies: [
      '您好呀，我在呢。您今天感觉怎么样？',
      '您好，很高兴陪您聊天。您这会儿还好吗？',
      '嗨，我一直在这儿陪着您。想聊点什么呢？',
      '您好呀，见到您真好。今天过得顺心吗？',
    ],
  },
  // Weather
  {
    keywords: ['天气', '下雨', '出太阳', '刮风', '冷', '热', '温度'],
    replies: [
      '今天的天气要注意增减衣物哦，别感冒了。出门记得带伞以防万一！',
      '不管天气怎样，都要注意身体呢。天冷加衣，天热多喝水！',
      '天气变化大的时候要特别注意身体哦，您今天穿够了吗？',
    ],
  },
  // Time
  {
    keywords: ['几点了', '什么时间', '现在几点', '几点钟'],
    replies: [
      `现在是${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}。时间过得真快呀，您今天安排了什么活动吗？`,
      `现在${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}了。别忘了按时吃饭、喝水哦！`,
    ],
  },
  // Jokes
  {
    keywords: ['笑话', '开心', '逗我', '讲个', '有趣', '好玩'],
    replies: [
      '小明问爷爷："为什么你的头发是白色的？"爷爷说："因为我把智慧都长到头发上了！"哈哈，您开心就好！',
      '有个老爷爷去菜市场，对卖菜的说："给我来点新鲜的。"卖菜的说："您来我这儿就是最新鲜的事！"',
      '医生对一位老先生说："您要少吃肉。"老先生说："我已经少了一口牙了，还不够少吗？"哈哈！',
      '小孙子问奶奶："奶奶，您年轻的时候美吗？"奶奶说："不美的话，你爷爷怎么追的我？"',
    ],
  },
  // Health advice
  {
    keywords: ['健康', '养生', '保健', '长寿', '身体', '锻炼', '运动'],
    replies: [
      '保持好心情是最好的养生秘方哦！每天散散步、晒晒太阳，对身体很好的。',
      '记得每天喝够8杯水，少吃油腻的食物。适当运动，但别太累了哦！',
      '养生最重要的就是：吃好、睡好、心情好。您做到了吗？',
      '每天走走路、活动活动筋骨就很好了。不用太剧烈，慢慢来最好！',
    ],
  },
  // Eating
  {
    keywords: ['吃饭', '吃了', '没吃', '饿了', '吃什么', '做饭', '饭'],
    replies: [
      '按时吃饭很重要哦！要荤素搭配，多吃蔬菜和粗粮，对身体好。',
      '吃饭要细嚼慢咽，不要着急。饭后可以散散步帮助消化。',
      '一日三餐要规律哦，别饿着自己。想吃什么好吃的，可以跟家人说！',
    ],
  },
  // Sleep
  {
    keywords: ['睡觉', '失眠', '睡不着', '早起', '晚安', '困了', '休息'],
    replies: [
      '睡前可以泡泡脚、喝杯温牛奶，有助于睡眠。祝您一夜好梦！',
      '好的睡眠对身体很重要，晚上尽量10点前睡觉。睡前别看手机太久哦！',
      '休息好才有精力做喜欢的事情。祝您睡个好觉！',
    ],
  },
  // Missing family
  {
    keywords: ['想孩子', '想儿子', '想女儿', '想孙子', '想孙女', '想家人', '想念'],
    replies: [
      '想家人是很正常的，可以给他们打个电话聊聊天呢！他们也一定很想您。',
      '家人虽然不在身边，但心是连在一起的。要不给他们发个消息？',
      '思念说明您很重视家人，这份爱很珍贵。可以和他们视频聊天呀！',
    ],
  },
  // Loneliness
  {
    keywords: ['无聊', '没事做', '孤独', '寂寞', '没人陪', '一个人'],
    replies: [
      '我一直在这里陪着您呢！要不咱们聊聊天？您最近有什么开心的事吗？',
      '可以听听广播、看看电视，或者到公园走走，说不定能交到新朋友呢！',
      '别觉得无聊呀，可以做做手工、养养花，或者跟我聊天！我随时都在。',
    ],
  },
  // Medicine
  {
    keywords: ['吃药', '药', '忘了吃药', '该吃药了'],
    replies: [
      '吃药一定要按时按量哦！按照医生的嘱咐来，不要多吃也不要少吃。',
      '记得按时吃药呢！要不要我帮您设个提醒？这样就不会忘了。',
      '吃药时要用温水送服，不要空腹吃刺激性的药物哦。',
    ],
  },
];

/**
 * Generate a built-in reply based on keyword matching (used as fallback).
 */
function generateBuiltInReply(message: string): string {
  for (const rule of REPLY_RULES) {
    for (const keyword of rule.keywords) {
      if (message.includes(keyword)) {
        const index = Math.floor(Math.random() * rule.replies.length);
        return rule.replies[index];
      }
    }
  }

  // Default fallback replies
  const defaultReplies = [
    '嗯嗯，我在听呢！您继续说。',
    '是这样呀，那您现在感觉怎么样？',
    '我理解您的感受。有什么我能帮到您的吗？',
    '谢谢您跟我分享，能和您聊天我很开心！',
    '您说得对呢！还有什么想跟我说的吗？',
    '我一直在这里陪着您，有什么事情都可以跟我说。',
  ];

  const index = Math.floor(Math.random() * defaultReplies.length);
  return defaultReplies[index];
}

function normalizeReply(userMessage: string, reply: string): string {
  const cleanedReply = reply.replace(/\s+/g, ' ').trim();

  if (!cleanedReply) {
    return generateBuiltInReply(userMessage);
  }

  const hasMetaReply = META_REPLY_PATTERNS.some((pattern) => pattern.test(cleanedReply));
  if (hasMetaReply) {
    return generateBuiltInReply(userMessage);
  }

  return cleanedReply.length > 100
    ? `${cleanedReply.substring(0, 97)}...`
    : cleanedReply;
}

// ============================
// AI API call
// ============================

/**
 * Call the OpenAI-compatible API to generate a reply.
 */
async function callAIAPI(messages: Message[]): Promise<string> {
  const url = `${AI_API_BASE_URL}/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages,
      max_tokens: 200,
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API error ${response.status}: ${errorText}`);
  }

  const data = await response.json() as {
    choices: Array<{
      message: {
        content: string;
      };
    }>;
  };

  if (!data.choices || data.choices.length === 0) {
    throw new Error('AI API returned no choices');
  }

  return data.choices[0].message.content.trim();
}

// ============================
// Main function
// ============================

/**
 * Generate an AI reply for a user message.
 * Uses the OpenAI-compatible API if configured, otherwise falls back to
 * built-in keyword-based replies.
 */
export async function generateReply(
  userId: string,
  message: string,
  conversationHistory: Message[]
): Promise<AIReply> {
  const mood = detectMood(message);

  // If no API key is configured, use built-in reply logic
  if (!AI_API_KEY) {
    logger.info(`No AI API key configured, using built-in reply for user ${userId}`);
    const reply = generateBuiltInReply(message);
    return { reply, mood };
  }

  // Build messages array for the API
  try {
    const apiMessages: Message[] = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    // Include recent conversation history (last 10 messages)
    const recentHistory = conversationHistory.slice(-10);
    for (const msg of recentHistory) {
      apiMessages.push({
        role: msg.role === 'system' ? 'assistant' : msg.role,
        content: msg.content,
      });
    }

    // Add the current user message
    apiMessages.push({ role: 'user', content: message });

    const reply = await callAIAPI(apiMessages);
    const normalizedReply = normalizeReply(message, reply);

    return { reply: normalizedReply, mood };
  } catch (err) {
    logger.error('AI API call failed, falling back to built-in reply:', err);
    const reply = generateBuiltInReply(message);
    return { reply, mood };
  }
}
