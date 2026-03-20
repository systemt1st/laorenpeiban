/**
 * 紧急检测工具函数（前端版本）
 */

interface EmergencyDetection {
  isEmergency: boolean;
  level: 'critical' | 'high' | 'medium' | null;
  keyword: string | null;
}

/** 紧急关键词分级表 */
const EMERGENCY_KEYWORDS: Record<string, 'critical' | 'high' | 'medium'> = {
  // 危急级别 - 需要立即呼叫急救
  '胸口疼': 'critical',
  '胸痛': 'critical',
  '心脏疼': 'critical',
  '喘不上气': 'critical',
  '呼吸困难': 'critical',
  '晕倒': 'critical',
  '摔倒了': 'critical',
  '不能动': 'critical',
  '救命': 'critical',
  '中风': 'critical',
  '脑溢血': 'critical',
  '大出血': 'critical',
  '昏迷': 'critical',
  '意识不清': 'critical',
  '抽搐': 'critical',

  // 高风险级别 - 需要联系家人
  '头很晕': 'high',
  '头晕': 'high',
  '很痛': 'high',
  '疼得厉害': 'high',
  '受伤了': 'high',
  '流血': 'high',
  '摔了一跤': 'high',
  '站不起来': 'high',
  '看不清': 'high',
  '吐了': 'high',
  '发烧': 'high',
  '心慌': 'high',
  '手脚发麻': 'high',
  '说不出话': 'high',

  // 中风险级别 - 需要关注
  '不太舒服': 'medium',
  '不舒服': 'medium',
  '难受': 'medium',
  '没力气': 'medium',
  '吃不下饭': 'medium',
  '睡不着': 'medium',
  '害怕': 'medium',
  '孤独': 'medium',
  '想哭': 'medium',
  '不想活': 'critical',
  '活不下去': 'critical',
};

/** 检测文本中的紧急关键词 */
export function detectEmergencyKeywords(text: string): EmergencyDetection {
  const normalizedText = text.trim().toLowerCase();

  for (const [keyword, level] of Object.entries(EMERGENCY_KEYWORDS)) {
    if (normalizedText.includes(keyword)) {
      return {
        isEmergency: true,
        level,
        keyword,
      };
    }
  }

  return {
    isEmergency: false,
    level: null,
    keyword: null,
  };
}

/** 根据关键词获取急救指导 */
export function getEmergencyGuidance(keyword: string | null): string[] {
  if (!keyword) {
    return ['请保持冷静', '如果感到不适，请按下SOS按钮求助'];
  }

  const detection = EMERGENCY_KEYWORDS[keyword];

  if (detection === 'critical') {
    return [
      '请保持冷静，不要移动',
      '正在为您拨打急救电话',
      '如果有家人在身边，请让他们陪伴您',
      '保持呼吸通畅，不要紧张',
      '等待救援人员到来',
    ];
  }

  if (detection === 'high') {
    return [
      '请先坐下或躺下休息',
      '正在联系您的家人',
      '如果症状加重，请立即拨打120',
      '保持电话畅通',
      '不要自行服用不确定的药物',
    ];
  }

  return [
    '请注意休息，不要过度劳累',
    '建议您量一下血压和体温',
    '如果持续不舒服，建议就医检查',
    '可以联系家人聊聊天',
  ];
}
