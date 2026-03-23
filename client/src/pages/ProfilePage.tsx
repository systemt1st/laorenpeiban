import React, { useEffect, useState, useCallback } from 'react';
import {
  ChevronDown,
  Plus,
  Trash2,
  Edit,
  Phone,
  Heart,
  Shield,
  Settings,
  User as UserIcon,
  X,
  Check,
} from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import type { EmergencyContact } from '@/types';

type SectionKey = 'basic' | 'contacts' | 'preferences' | 'health' | 'family';

const genderLabels = {
  male: '男',
  female: '女',
  other: '其他',
} as const;

const fontSizeLabels = {
  large: '大',
  xlarge: '特大',
  xxlarge: '超大',
} as const;

function toSafeText(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

function toSafeNumber(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizeVolume(value: unknown): number {
  const volume = toSafeNumber(value, 80);
  return volume <= 1 ? Math.round(volume * 100) : Math.round(volume);
}

function maskPhone(phone: unknown): string {
  const safePhone = toSafeText(phone, '');
  if (!safePhone) return '未填写电话';
  if (safePhone.length < 7) return safePhone;
  return `${safePhone.slice(0, 3)}****${safePhone.slice(-4)}`;
}

// ========================================
// 折叠分组
// ========================================

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  summary: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

const Section: React.FC<SectionProps> = ({
  title,
  icon,
  summary,
  children,
  isOpen,
  onToggle,
}) => {
  return (
    <section className="bg-white rounded-[18px] shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-3.5 py-3 touch-target text-left"
      >
        <div className="flex items-start space-x-2.5 min-w-0 flex-1">
          <span className="mt-0.5 text-primary-500 flex-shrink-0">{icon}</span>
          <div className="min-w-0">
            <div className="text-[17px] leading-6 font-bold text-[#212121]">{title}</div>
            <p className="mt-0.5 text-[13px] leading-5 text-gray-500 truncate">{summary}</p>
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && <div className="px-3.5 pb-3.5 pt-2.5 border-t border-gray-100">{children}</div>}
    </section>
  );
};

// ========================================
// 基本信息
// ========================================

interface ToggleableSectionProps {
  isOpen: boolean;
  onToggle: () => void;
}

const BasicInfoSection: React.FC<ToggleableSectionProps> = ({ isOpen, onToggle }) => {
  const { user, updateUserProfile } = useUserStore();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [age, setAge] = useState(user?.age?.toString() || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(user?.gender || 'other');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setNickname(toSafeText(user.nickname, ''));
      setAge(user.age ? String(user.age) : '');
      setGender(
        user.gender === 'male' || user.gender === 'female' || user.gender === 'other'
          ? user.gender
          : 'other',
      );
    }
  }, [user]);

  const handleSave = async (
    overrides?: Partial<{
      nickname: string;
      age: string;
      gender: 'male' | 'female' | 'other';
    }>
  ) => {
    const nextNickname = overrides?.nickname ?? nickname;
    const nextAge = overrides?.age ?? age;
    const nextGender = overrides?.gender ?? gender;

    await updateUserProfile({
      nickname: nextNickname.trim(),
      age: parseInt(nextAge, 10) || undefined,
      gender: nextGender,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const summary = [
    toSafeText(nickname, '未设置称呼'),
    age ? `${toSafeNumber(age, 0)}岁` : '未填年龄',
    genderLabels[gender] || '其他',
  ].join(' · ');

  return (
    <Section
      title="基本信息"
      icon={<UserIcon size={20} />}
      summary={summary}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="space-y-3">
        <div>
          <label className="block text-[14px] text-gray-500 mb-1">称呼</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onBlur={() => {
              void handleSave();
            }}
            className="w-full h-[42px] px-3.5 text-[16px] bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>

        <div>
          <label className="block text-[14px] text-gray-500 mb-1">年龄</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            onBlur={() => {
              void handleSave();
            }}
            className="w-full h-[42px] px-3.5 text-[16px] bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>

        <div>
          <label className="block text-[14px] text-gray-500 mb-1">性别</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { value: 'male' as const, label: '男' },
              { value: 'female' as const, label: '女' },
              { value: 'other' as const, label: '其他' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setGender(opt.value);
                  void handleSave({ gender: opt.value });
                }}
                className={`h-[40px] rounded-xl text-[16px] font-medium transition-all ${
                  gender === opt.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {saved && (
          <div className="flex items-center space-x-1 text-success-500 text-[14px]">
            <Check size={14} />
            <span>已保存</span>
          </div>
        )}
      </div>
    </Section>
  );
};

// ========================================
// 紧急联系人
// ========================================

interface ContactFormData {
  name: string;
  relationship: string;
  phone: string;
}

const EmergencyContactsSection: React.FC<ToggleableSectionProps> = ({
  isOpen,
  onToggle,
}) => {
  const {
    emergencyContacts,
    loadEmergencyContacts,
    addEmergencyContact,
    updateEmergencyContact,
    deleteEmergencyContact,
    user,
  } = useUserStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ContactFormData>({
    name: '',
    relationship: '',
    phone: '',
  });
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadEmergencyContacts();
    }
  }, [user?.id, loadEmergencyContacts]);

  const handleOpenAdd = () => {
    setForm({ name: '', relationship: '', phone: '' });
    setEditingId(null);
    setShowForm(true);
  };

  const handleOpenEdit = (contact: EmergencyContact) => {
    setForm({
      name: contact.name,
      relationship: contact.relationship,
      phone: contact.phone,
    });
    setEditingId(contact.id);
    setShowForm(true);
  };

  const handleSubmitContact = async () => {
    if (!form.name.trim() || !form.phone.trim()) return;

    if (editingId) {
      await updateEmergencyContact(editingId, {
        name: form.name.trim(),
        relationship: form.relationship.trim(),
        phone: form.phone.trim(),
      });
    } else {
      await addEmergencyContact(
        form.name.trim(),
        form.relationship.trim(),
        form.phone.trim(),
      );
    }

    setShowForm(false);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    if (confirmDeleteId === id) {
      await deleteEmergencyContact(id);
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const summary =
    emergencyContacts.length > 0
      ? `已添加${emergencyContacts.length}位：${emergencyContacts
          .slice(0, 2)
          .map((contact) => `${contact.name} ${maskPhone(contact.phone)}`)
          .join(' · ')}`
      : '还没有紧急联系人，建议尽快添加';

  return (
    <Section
      title="紧急联系人"
      icon={<Phone size={20} />}
      summary={summary}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="space-y-2">
        {emergencyContacts.length === 0 && !showForm && (
          <div className="px-3 py-2.5 rounded-xl bg-gray-50 text-[14px] text-gray-500 leading-5">
            紧急情况下可以一键联系家人，建议至少添加 1 位联系人。
          </div>
        )}

        {emergencyContacts.map((contact) => (
          <div
            key={contact.id}
            className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl"
          >
            <div className="flex-1 min-w-0">
              <p className="text-[16px] leading-5 font-medium text-[#212121] truncate">
                {contact.name}
                <span className="text-[13px] text-gray-400 ml-2">
                  {contact.relationship || '联系人'}
                </span>
              </p>
              <p className="text-[14px] text-primary-500 mt-0.5">{contact.phone}</p>
            </div>
            <div className="flex items-center space-x-1.5 ml-2 flex-shrink-0">
              <button
                onClick={() => handleOpenEdit(contact)}
                className="touch-target flex items-center justify-center w-[36px] h-[36px] rounded-lg bg-primary-50"
              >
                <Edit size={16} className="text-primary-500" />
              </button>
              <button
                onClick={() => handleDelete(contact.id)}
                className={`touch-target flex items-center justify-center w-[36px] h-[36px] rounded-lg transition-all ${
                  confirmDeleteId === contact.id ? 'bg-danger-500' : 'bg-danger-50'
                }`}
              >
                <Trash2
                  size={16}
                  className={confirmDeleteId === contact.id ? 'text-white' : 'text-danger-500'}
                />
              </button>
            </div>
          </div>
        ))}

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center space-x-2 w-full h-[40px] rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-primary-300 hover:text-primary-500 transition-all"
        >
          <Plus size={16} />
          <span className="text-[14px] font-medium">添加联系人</span>
        </button>

        {showForm && (
          <div className="p-3 bg-primary-50 rounded-xl space-y-2">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="姓名"
              className="w-full h-[40px] px-3.5 text-[16px] bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            <input
              type="text"
              value={form.relationship}
              onChange={(e) => setForm({ ...form, relationship: e.target.value })}
              placeholder="关系（如：儿子）"
              className="w-full h-[40px] px-3.5 text-[16px] bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="电话号码"
              className="w-full h-[40px] px-3.5 text-[16px] bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="h-[40px] rounded-xl bg-gray-200 text-gray-600 text-[14px] font-medium"
              >
                取消
              </button>
              <button
                onClick={handleSubmitContact}
                disabled={!form.name.trim() || !form.phone.trim()}
                className={`h-[40px] rounded-xl text-[14px] font-medium transition-all ${
                  form.name.trim() && form.phone.trim()
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {editingId ? '保存' : '添加'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
};

// ========================================
// 偏好设置
// ========================================

const PreferencesSection: React.FC<ToggleableSectionProps> = ({ isOpen, onToggle }) => {
  const { preferences, updateUserPreferences } = useUserStore();
  const [voiceSpeed, setVoiceSpeed] = useState(toSafeNumber(preferences?.voiceSpeed, 1.0));
  const [fontSize, setFontSize] = useState<'large' | 'xlarge' | 'xxlarge'>(
    preferences?.fontSize === 'large' ||
      preferences?.fontSize === 'xlarge' ||
      preferences?.fontSize === 'xxlarge'
      ? preferences.fontSize
      : 'large',
  );
  const [voiceVolume, setVoiceVolume] = useState(normalizeVolume(preferences?.voiceVolume));

  useEffect(() => {
    if (preferences) {
      setVoiceSpeed(toSafeNumber(preferences.voiceSpeed, 1.0));
      setFontSize(
        preferences.fontSize === 'large' ||
          preferences.fontSize === 'xlarge' ||
          preferences.fontSize === 'xxlarge'
          ? preferences.fontSize
          : 'large',
      );
      setVoiceVolume(normalizeVolume(preferences.voiceVolume));
    }
  }, [preferences]);

  const handleSave = useCallback(
    async (
      params: Partial<{
        voiceSpeed: number;
        fontSize: 'large' | 'xlarge' | 'xxlarge';
        voiceVolume: number;
      }>
    ) => {
      await updateUserPreferences(params);
    },
    [updateUserPreferences],
  );

  const summary = `语速 ${toSafeNumber(voiceSpeed, 1).toFixed(1)}x · 音量 ${normalizeVolume(
    voiceVolume,
  )}% · 字体 ${fontSizeLabels[fontSize] || '大'}`;

  return (
    <Section
      title="偏好设置"
      icon={<Settings size={20} />}
      summary={summary}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[14px] text-gray-500">语速</label>
            <span className="text-[14px] text-primary-500 font-medium">
              {toSafeNumber(voiceSpeed, 1).toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={voiceSpeed}
            onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
            onMouseUp={() => handleSave({ voiceSpeed })}
            onTouchEnd={() => handleSave({ voiceSpeed })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
          />
          <div className="flex justify-between text-[12px] text-gray-400 mt-0.5">
            <span>慢</span>
            <span>正常</span>
            <span>快</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[14px] text-gray-500">音量</label>
            <span className="text-[14px] text-primary-500 font-medium">
              {normalizeVolume(voiceVolume)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={voiceVolume}
            onChange={(e) => setVoiceVolume(parseInt(e.target.value, 10))}
            onMouseUp={() => handleSave({ voiceVolume })}
            onTouchEnd={() => handleSave({ voiceVolume })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
          />
        </div>

        <div>
          <label className="block text-[14px] text-gray-500 mb-1">字体大小</label>
          <div className="grid grid-cols-3 gap-1.5">
            {[
              { value: 'large' as const, label: '大', sample: 'text-[18px]' },
              { value: 'xlarge' as const, label: '特大', sample: 'text-[20px]' },
              { value: 'xxlarge' as const, label: '超大', sample: 'text-[22px]' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setFontSize(opt.value);
                  handleSave({ fontSize: opt.value });
                }}
                className={`h-[40px] rounded-xl font-medium transition-all ${opt.sample} ${
                  fontSize === opt.value
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
};

// ========================================
// 健康档案
// ========================================

const commonConditions = [
  '高血压',
  '糖尿病',
  '心脏病',
  '关节炎',
  '哮喘',
  '骨质疏松',
  '白内障',
  '听力下降',
];

const HealthSection: React.FC<ToggleableSectionProps> = ({ isOpen, onToggle }) => {
  const { health, updateUserHealth } = useUserStore();
  const [conditions, setConditions] = useState<string[]>(health?.conditions || []);
  const [medications, setMedications] = useState<string[]>(health?.medications || []);
  const [allergies, setAllergies] = useState(health?.allergies || '');
  const [newMedicine, setNewMedicine] = useState('');

  useEffect(() => {
    if (health) {
      setConditions(health.conditions || []);
      setMedications(health.medications || []);
      setAllergies(health.allergies || '');
    }
  }, [health]);

  const toggleCondition = async (condition: string) => {
    const updated = conditions.includes(condition)
      ? conditions.filter((c) => c !== condition)
      : [...conditions, condition];

    setConditions(updated);
    await updateUserHealth({ conditions: updated });
  };

  const addMedicine = async () => {
    if (!newMedicine.trim()) return;
    const updated = [...medications, newMedicine.trim()];
    setMedications(updated);
    setNewMedicine('');
    await updateUserHealth({ medications: updated });
  };

  const removeMedicine = async (index: number) => {
    const updated = medications.filter((_, i) => i !== index);
    setMedications(updated);
    await updateUserHealth({ medications: updated });
  };

  const handleAllergiesSave = async () => {
    await updateUserHealth({ allergies: allergies.trim() });
  };

  const summary = `慢病 ${Array.isArray(conditions) ? conditions.length : 0} 项 · 药物 ${
    Array.isArray(medications) ? medications.length : 0
  } 项 · ${
    toSafeText(allergies, '') ? '已填写过敏信息' : '未填写过敏信息'
  }`;

  return (
    <Section
      title="健康档案"
      icon={<Heart size={20} />}
      summary={summary}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="space-y-3">
        <div>
          <label className="block text-[14px] text-gray-500 mb-1.5">健康状况</label>
          <div className="flex flex-wrap gap-1.5">
            {commonConditions.map((condition) => (
              <button
                key={condition}
                onClick={() => toggleCondition(condition)}
                className={`px-3 h-[34px] rounded-xl text-[14px] font-medium transition-all ${
                  conditions.includes(condition)
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {condition}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[14px] text-gray-500 mb-1.5">正在服用的药物</label>
          <div className="space-y-2">
            {medications.map((med, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl"
              >
                <span className="text-[15px] text-[#212121]">{med}</span>
                <button
                  onClick={() => removeMedicine(index)}
                  className="touch-target flex items-center justify-center w-[32px] h-[32px] rounded-lg bg-danger-50"
                >
                  <X size={14} className="text-danger-500" />
                </button>
              </div>
            ))}
            <div className="flex space-x-1.5">
              <input
                type="text"
                value={newMedicine}
                onChange={(e) => setNewMedicine(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addMedicine();
                }}
                placeholder="输入药物名称"
                className="flex-1 h-[40px] px-3.5 text-[16px] bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
              <button
                onClick={addMedicine}
                disabled={!newMedicine.trim()}
                className={`w-[40px] h-[40px] rounded-xl flex items-center justify-center transition-all ${
                  newMedicine.trim()
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-[14px] text-gray-500 mb-1">过敏信息</label>
          <textarea
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            onBlur={handleAllergiesSave}
            placeholder="如有过敏情况请填写"
            rows={3}
            className="w-full px-3.5 py-2.5 text-[16px] bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
          />
        </div>
      </div>
    </Section>
  );
};

// ========================================
// 家属验证码
// ========================================

const FamilyCodeSection: React.FC<ToggleableSectionProps> = ({ isOpen, onToggle }) => {
  const { user } = useUserStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!user?.familyCode) return;

    try {
      await navigator.clipboard.writeText(user.familyCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = user.familyCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const safeFamilyCode = toSafeText(user?.familyCode, '');
  const summary = safeFamilyCode
    ? `家属可用验证码 ${safeFamilyCode} 登录查看您的状态`
    : '暂未生成家属验证码';

  return (
    <Section
      title="家属验证码"
      icon={<Shield size={20} />}
      summary={summary}
      isOpen={isOpen}
      onToggle={onToggle}
    >
      <div className="text-center py-0.5">
        <p className="text-[14px] text-gray-500 mb-2.5 leading-5">
          分享给家属后，他们可以查看您的状态和提醒完成情况。
        </p>
        <div className="flex items-center justify-center">
          <span className="text-[24px] font-bold tracking-[4px] text-primary-500 bg-primary-50 px-4 py-2.5 rounded-xl">
            {safeFamilyCode || '------'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="mt-2.5 px-5 h-[38px] rounded-xl bg-primary-50 text-primary-500 text-[14px] font-medium transition-all"
        >
          {copied ? '已复制' : '复制验证码'}
        </button>
      </div>
    </Section>
  );
};

// ========================================
// 个人设置页
// ========================================

const ProfilePage: React.FC = () => {
  const [openSection, setOpenSection] = useState<SectionKey | null>(null);

  const toggleSection = useCallback((section: SectionKey) => {
    setOpenSection((current) => (current === section ? null : section));
  }, []);

  return (
    <div className="px-3 py-3 space-y-2.5 pb-20">
      <div className="px-1">
        <h2 className="text-[22px] leading-8 font-bold text-[#212121]">个人设置</h2>
        <p className="mt-0.5 text-[14px] leading-5 text-gray-500">
          常用内容都收在这里，点一下即可展开，不用来回滑动找功能。
        </p>
      </div>

      <BasicInfoSection
        isOpen={openSection === 'basic'}
        onToggle={() => toggleSection('basic')}
      />
      <EmergencyContactsSection
        isOpen={openSection === 'contacts'}
        onToggle={() => toggleSection('contacts')}
      />
      <PreferencesSection
        isOpen={openSection === 'preferences'}
        onToggle={() => toggleSection('preferences')}
      />
      <HealthSection
        isOpen={openSection === 'health'}
        onToggle={() => toggleSection('health')}
      />
      <FamilyCodeSection
        isOpen={openSection === 'family'}
        onToggle={() => toggleSection('family')}
      />
    </div>
  );
};

export default ProfilePage;
