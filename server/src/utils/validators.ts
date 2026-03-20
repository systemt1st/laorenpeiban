import Joi from 'joi';

// ==================== User Schemas ====================

export const createUserSchema = Joi.object({
  nickname: Joi.string().min(1).max(50).required()
    .messages({
      'string.empty': '昵称不能为空',
      'string.max': '昵称不能超过50个字符',
      'any.required': '昵称为必填项',
    }),
  age: Joi.number().integer().min(0).max(150).optional()
    .messages({
      'number.min': '年龄不能小于0',
      'number.max': '年龄不能超过150',
    }),
  gender: Joi.string().valid('male', 'female', 'other').optional()
    .messages({
      'any.only': '性别只能为 male、female 或 other',
    }),
  address: Joi.string().max(200).optional().allow(''),
  avatarUrl: Joi.string().uri().optional().allow(''),
});

export const updateUserSchema = Joi.object({
  nickname: Joi.string().min(1).max(50).optional(),
  age: Joi.number().integer().min(0).max(150).optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  address: Joi.string().max(200).optional().allow(''),
  avatarUrl: Joi.string().uri().optional().allow(''),
}).min(1).messages({
  'object.min': '至少需要提供一个更新字段',
});

// ==================== Message Schemas ====================

export const sendMessageSchema = Joi.object({
  userId: Joi.string().required()
    .messages({
      'string.empty': '用户ID不能为空',
      'any.required': '用户ID为必填项',
    }),
  message: Joi.string().min(1).max(5000).required()
    .messages({
      'string.empty': '消息内容不能为空',
      'string.max': '消息内容不能超过5000个字符',
      'any.required': '消息内容为必填项',
    }),
  conversationId: Joi.string().optional().allow(null, ''),
});

// ==================== Reminder Schemas ====================

export const createReminderSchema = Joi.object({
  userId: Joi.string().required()
    .messages({
      'string.empty': '用户ID不能为空',
      'any.required': '用户ID为必填项',
    }),
  type: Joi.string().valid('medicine', 'water', 'checkup', 'custom').required()
    .messages({
      'any.only': '提醒类型只能为 medicine、water、checkup 或 custom',
      'any.required': '提醒类型为必填项',
    }),
  title: Joi.string().min(1).max(100).required()
    .messages({
      'string.empty': '提醒标题不能为空',
      'string.max': '提醒标题不能超过100个字符',
      'any.required': '提醒标题为必填项',
    }),
  description: Joi.string().max(500).optional().allow(''),
  time: Joi.string().pattern(/^\d{2}:\d{2}$/).required()
    .messages({
      'string.pattern.base': '时间格式应为 HH:mm',
      'any.required': '提醒时间为必填项',
    }),
  days: Joi.array().items(
    Joi.number().integer().min(0).max(6)
  ).optional(),
  repeat: Joi.boolean().optional().default(true),
  enabled: Joi.boolean().optional().default(true),
  extraData: Joi.object().optional(),
});

export const updateReminderSchema = Joi.object({
  type: Joi.string().valid('medicine', 'water', 'checkup', 'custom').optional(),
  title: Joi.string().min(1).max(100).optional(),
  description: Joi.string().max(500).optional().allow(''),
  time: Joi.string().pattern(/^\d{2}:\d{2}$/).optional(),
  days: Joi.array().items(
    Joi.number().integer().min(0).max(6)
  ).optional(),
  repeat: Joi.boolean().optional(),
  enabled: Joi.boolean().optional(),
  extraData: Joi.object().optional(),
}).min(1);

// ==================== Emergency Contact Schemas ====================

export const createEmergencyContactSchema = Joi.object({
  userId: Joi.string().required()
    .messages({
      'string.empty': '用户ID不能为空',
      'any.required': '用户ID为必填项',
    }),
  name: Joi.string().min(1).max(50).required()
    .messages({
      'string.empty': '联系人姓名不能为空',
      'any.required': '联系人姓名为必填项',
    }),
  relationship: Joi.string().min(1).max(50).required()
    .messages({
      'string.empty': '与用户关系不能为空',
      'any.required': '与用户关系为必填项',
    }),
  phone: Joi.string().pattern(/^1[3-9]\d{9}$|^\d{3,4}-?\d{7,8}$/).required()
    .messages({
      'string.pattern.base': '请输入有效的电话号码',
      'any.required': '电话号码为必填项',
    }),
  priority: Joi.number().integer().min(0).max(10).optional().default(0),
});

// ==================== Emergency Event Schemas ====================

export const createEmergencyEventSchema = Joi.object({
  userId: Joi.string().required()
    .messages({
      'string.empty': '用户ID不能为空',
      'any.required': '用户ID为必填项',
    }),
  triggerKeyword: Joi.string().min(1).max(200).required()
    .messages({
      'string.empty': '触发关键词不能为空',
      'any.required': '触发关键词为必填项',
    }),
  userDescription: Joi.string().max(1000).optional().allow(''),
  riskLevel: Joi.string().valid('low', 'medium', 'high', 'critical').required()
    .messages({
      'any.only': '风险等级只能为 low、medium、high 或 critical',
      'any.required': '风险等级为必填项',
    }),
  actionTaken: Joi.string().max(500).optional().allow(''),
  context: Joi.string().max(2000).optional().allow(''),
});

// ==================== Validation Helper ====================

/**
 * Validate data against a Joi schema.
 * Returns { value, error } where error is a formatted string or null.
 */
export function validate<T>(
  schema: Joi.ObjectSchema,
  data: unknown
): { value: T; error: string | null } {
  const { value, error } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const messages = error.details.map((d) => d.message).join('; ');
    return { value: value as T, error: messages };
  }

  return { value: value as T, error: null };
}
