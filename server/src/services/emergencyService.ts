/**
 * Emergency Detection Service
 *
 * Detects emergency situations from user messages using keyword-based
 * analysis and provides first-aid guidance.
 */

// ============================
// Emergency keyword definitions
// ============================

interface KeywordEntry {
  keyword: string;
  guidance: string[];
}

const CRITICAL_KEYWORDS: KeywordEntry[] = [
  {
    keyword: '胸痛',
    guidance: [
      '请立即停止一切活动，坐下或半卧休息',
      '如果有硝酸甘油，请立即舌下含服一片',
      '松开衣领和腰带，保持呼吸通畅',
      '请家人立即拨打120急救电话',
      '不要独自移动，等待救援',
    ],
  },
  {
    keyword: '胸闷',
    guidance: [
      '请立即坐下休息，不要进行任何体力活动',
      '松开紧身衣物，保持空气流通',
      '如果有常备药物请按医嘱服用',
      '请家人立即拨打120急救电话',
      '持续关注症状变化，如加重请立即呼救',
    ],
  },
  {
    keyword: '喘不上气',
    guidance: [
      '请立即坐起来，上身前倾，双手撑在膝盖上',
      '尝试缓慢深呼吸：用鼻子吸气4秒，嘴巴呼气6秒',
      '打开窗户，保持空气流通',
      '请家人立即拨打120急救电话',
      '不要平躺，保持坐位或半卧位',
    ],
  },
  {
    keyword: '摔倒了',
    guidance: [
      '请不要急于站起来，先感受一下是否有疼痛',
      '如果感觉哪里疼痛，请不要移动那个部位',
      '尝试慢慢活动手指和脚趾，检查是否能活动',
      '如果能活动，请慢慢翻身侧卧，再尝试起身',
      '如果无法动弹或剧烈疼痛，请呼救等待帮助',
    ],
  },
  {
    keyword: '晕倒',
    guidance: [
      '如果可以的话，请躺平并抬高双腿',
      '松开所有紧身衣物，保持呼吸通畅',
      '请家人立即拨打120急救电话',
      '不要给昏迷的人喂水或食物',
      '保持周围安静，等待专业救援',
    ],
  },
  {
    keyword: '呼吸困难',
    guidance: [
      '请立即坐起来，保持上身直立',
      '松开衣领、腰带等束缚物',
      '打开门窗，保持空气流通',
      '请家人立即拨打120急救电话',
      '如有氧气瓶请立即使用，保持冷静',
    ],
  },
  {
    keyword: '意识模糊',
    guidance: [
      '请立即坐下或躺下，避免摔倒',
      '请家人立即拨打120急救电话',
      '检查是否有低血糖的可能，可以喝一杯糖水',
      '保持呼吸通畅，头偏向一侧',
      '不要独自行动，等待家人或救援',
    ],
  },
  {
    keyword: '大出血',
    guidance: [
      '请立即用干净的布或毛巾按压伤口',
      '保持按压不要松开，持续按压至少15分钟',
      '如果是四肢出血，将受伤部位抬高于心脏位置',
      '请家人立即拨打120急救电话',
      '不要清洗大面积出血的伤口，保持按压',
    ],
  },
  {
    keyword: '心脏',
    guidance: [
      '请立即停止活动，坐下休息',
      '如果有硝酸甘油或速效救心丸，请按医嘱服用',
      '松开衣领和腰带，保持呼吸通畅',
      '请家人立即拨打120急救电话',
      '保持冷静，避免情绪激动',
    ],
  },
  {
    keyword: '中风',
    guidance: [
      '请立即拨打120急救电话，中风需要尽快治疗',
      '让患者平卧，头部稍微抬高',
      '记录症状开始的时间，这对治疗很重要',
      '不要给患者吃任何东西或喝水',
      '等待救护车时保持患者安静，不要移动',
    ],
  },
];

const HIGH_KEYWORDS: KeywordEntry[] = [
  {
    keyword: '头很痛',
    guidance: [
      '请立即坐下或躺下休息',
      '在安静、光线较暗的环境中休息',
      '如果有常备止痛药请按医嘱服用',
      '如果伴有呕吐、视力模糊，请立即就医',
    ],
  },
  {
    keyword: '剧痛',
    guidance: [
      '请立即停止活动，找一个舒适的姿势休息',
      '记住疼痛的位置和性质，就医时告诉医生',
      '如果疼痛持续加重，请立即拨打120',
      '不要随意服用止痛药，等待专业诊断',
    ],
  },
  {
    keyword: '出血',
    guidance: [
      '用干净的布按压出血部位',
      '保持按压至少10分钟',
      '如果出血量大或无法止住，请立即就医',
      '受伤部位尽量抬高',
    ],
  },
  {
    keyword: '看不清',
    guidance: [
      '请立即坐下，不要走动以防摔倒',
      '闭眼休息几分钟，看是否有改善',
      '如果突然视力丧失，请立即拨打120',
      '这可能是中风的征兆，请尽快就医',
    ],
  },
  {
    keyword: '高烧',
    guidance: [
      '请多喝温水，保持充足饮水',
      '用温水毛巾擦拭额头和腋下来物理降温',
      '如果有退烧药请按医嘱服用',
      '如果体温超过39度或持续不退，请就医',
    ],
  },
  {
    keyword: '抽搐',
    guidance: [
      '请让患者平躺，清除周围危险物品',
      '将头偏向一侧，防止呕吐物窒息',
      '不要强行按压或往嘴里塞东西',
      '请立即拨打120急救电话',
    ],
  },
  {
    keyword: '吞咽困难',
    guidance: [
      '请停止进食，避免呛噎',
      '保持坐直的姿势，不要平躺',
      '如果伴有呼吸困难请立即就医',
      '可以小口喝温水试试是否能缓解',
    ],
  },
];

const MEDIUM_KEYWORDS: KeywordEntry[] = [
  {
    keyword: '不舒服',
    guidance: [
      '请先坐下休息一会儿',
      '喝一杯温水',
      '如果持续不舒服，请让家人陪同就医',
    ],
  },
  {
    keyword: '难受',
    guidance: [
      '请先坐下休息，放松身心',
      '喝一杯温水，做几次深呼吸',
      '如果持续难受，建议尽快就医',
    ],
  },
  {
    keyword: '没力气',
    guidance: [
      '请坐下或躺下休息',
      '喝一杯温糖水补充能量',
      '检查今天是否按时吃饭、喝水',
      '如果持续无力，建议就医检查',
    ],
  },
  {
    keyword: '头晕',
    guidance: [
      '请立即坐下或躺下，避免摔倒',
      '闭眼休息几分钟',
      '可能是低血压或低血糖，喝一杯温糖水',
      '如果反复头晕，建议就医检查',
    ],
  },
  {
    keyword: '恶心',
    guidance: [
      '请坐下休息，不要进食',
      '可以闻一闻新鲜的柠檬或生姜',
      '如果伴有呕吐，注意补充水分',
      '如果持续恶心，建议就医',
    ],
  },
  {
    keyword: '肚子痛',
    guidance: [
      '请躺下休息，双腿弯曲可以缓解腹痛',
      '用热水袋暖一暖肚子',
      '回忆是否吃了不干净的东西',
      '如果疼痛加重或持续，请就医',
    ],
  },
];

// ============================
// Types
// ============================

export interface EmergencyDetectionResult {
  isEmergency: boolean;
  level: 'critical' | 'high' | 'medium' | null;
  keyword: string | null;
}

// ============================
// Detection functions
// ============================

/**
 * Detect emergency keywords in a user message.
 * Returns the highest-priority match found.
 */
export function detectEmergency(message: string): EmergencyDetectionResult {
  // Check critical level first
  for (const entry of CRITICAL_KEYWORDS) {
    if (message.includes(entry.keyword)) {
      return { isEmergency: true, level: 'critical', keyword: entry.keyword };
    }
  }

  // Check high level
  for (const entry of HIGH_KEYWORDS) {
    if (message.includes(entry.keyword)) {
      return { isEmergency: true, level: 'high', keyword: entry.keyword };
    }
  }

  // Check medium level
  for (const entry of MEDIUM_KEYWORDS) {
    if (message.includes(entry.keyword)) {
      return { isEmergency: true, level: 'medium', keyword: entry.keyword };
    }
  }

  return { isEmergency: false, level: null, keyword: null };
}

/**
 * Get emergency first-aid guidance for a detected keyword and level.
 */
export function getEmergencyGuidance(keyword: string, level: string): string[] {
  let keywords: KeywordEntry[];

  switch (level) {
    case 'critical':
      keywords = CRITICAL_KEYWORDS;
      break;
    case 'high':
      keywords = HIGH_KEYWORDS;
      break;
    case 'medium':
      keywords = MEDIUM_KEYWORDS;
      break;
    default:
      return ['请注意休息，如有不适请及时就医。'];
  }

  const entry = keywords.find((k) => k.keyword === keyword);
  if (entry) {
    return entry.guidance;
  }

  // Fallback guidance based on level
  switch (level) {
    case 'critical':
      return [
        '请立即拨打120急救电话',
        '保持冷静，不要独自行动',
        '等待专业救援人员到达',
      ];
    case 'high':
      return [
        '请立即停止活动，坐下休息',
        '请家人陪同尽快就医',
        '如果症状加重，立即拨打120',
      ];
    case 'medium':
      return [
        '请先坐下休息',
        '喝一杯温水',
        '如果持续不适，请及时就医',
      ];
    default:
      return ['请注意休息，如有不适请及时就医。'];
  }
}
