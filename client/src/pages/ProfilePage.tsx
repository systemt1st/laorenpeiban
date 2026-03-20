import React, { useEffect, useState, useCallback } from 'react';
import {
  ChevronRight,
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

// ========================================
// Collapsible Section
// ========================================

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const Section: React.FC<SectionProps> = ({ title, icon, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-4 py-4 touch-target"
      >
        <div className="flex items-center space-x-3">
          <span className="text-primary-500">{icon}</span>
          <span className="text-elder-base font-bold text-[#212121]">{title}</span>
        </div>
        <ChevronRight
          size={22}
          className={`text-gray-400 transition-transform duration-200 ${
            open ? 'rotate-90' : ''
          }`}
        />
      </button>
      {open && <div className="px-4 pb-4 border-t border-gray-100 pt-3">{children}</div>}
    </div>
  );
};

// ========================================
// Basic Info Section
// ========================================

const BasicInfoSection: React.FC = () => {
  const { user, updateUserProfile } = useUserStore();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [age, setAge] = useState(user?.age?.toString() || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(user?.gender || 'other');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (user) {
      setNickname(user.nickname);
      setAge(user.age?.toString() || '');
      setGender(user.gender);
    }
  }, [user]);

  const handleSave = async () => {
    await updateUserProfile({
      nickname: nickname.trim(),
      age: parseInt(age) || undefined,
      gender,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <Section title="基本信息" icon={<UserIcon size={24} />} defaultOpen>
      <div className="space-y-4">
        {/* Nickname */}
        <div>
          <label className="block text-[16px] text-gray-500 mb-1">称呼</label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            onBlur={handleSave}
            className="w-full h-[48px] px-4 text-elder-base bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>

        {/* Age */}
        <div>
          <label className="block text-[16px] text-gray-500 mb-1">年龄</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            onBlur={handleSave}
            className="w-full h-[48px] px-4 text-elder-base bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>

        {/* Gender */}
        <div>
          <label className="block text-[16px] text-gray-500 mb-1">性别</label>
          <div className="flex space-x-3">
            {[
              { value: 'male' as const, label: '男' },
              { value: 'female' as const, label: '女' },
              { value: 'other' as const, label: '其他' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setGender(opt.value);
                  setTimeout(handleSave, 100);
                }}
                className={`flex-1 h-[48px] rounded-xl text-elder-base font-medium transition-all ${
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
          <div className="flex items-center space-x-1 text-success-500 text-[16px]">
            <Check size={18} />
            <span>已保存</span>
          </div>
        )}
      </div>
    </Section>
  );
};

// ========================================
// Emergency Contacts Section
// ========================================

interface ContactFormData {
  name: string;
  relationship: string;
  phone: string;
}

const EmergencyContactsSection: React.FC = () => {
  const { emergencyContacts, loadEmergencyContacts, addEmergencyContact, updateEmergencyContact, deleteEmergencyContact, user } = useUserStore();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ContactFormData>({ name: '', relationship: '', phone: '' });
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
    setForm({ name: contact.name, relationship: contact.relationship, phone: contact.phone });
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

  return (
    <Section title="紧急联系人" icon={<Phone size={24} />}>
      <div className="space-y-3">
        {emergencyContacts.map((contact) => (
          <div
            key={contact.id}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
          >
            <div className="flex-1 min-w-0">
              <p className="text-elder-base font-medium text-[#212121] truncate">
                {contact.name}
                <span className="text-[14px] text-gray-400 ml-2">({contact.relationship})</span>
              </p>
              <p className="text-[16px] text-primary-500">{contact.phone}</p>
            </div>
            <div className="flex items-center space-x-2 ml-2 flex-shrink-0">
              <button
                onClick={() => handleOpenEdit(contact)}
                className="touch-target flex items-center justify-center w-[40px] h-[40px] rounded-lg bg-primary-50"
              >
                <Edit size={18} className="text-primary-500" />
              </button>
              <button
                onClick={() => handleDelete(contact.id)}
                className={`touch-target flex items-center justify-center w-[40px] h-[40px] rounded-lg transition-all ${
                  confirmDeleteId === contact.id
                    ? 'bg-danger-500'
                    : 'bg-danger-50'
                }`}
              >
                <Trash2
                  size={18}
                  className={confirmDeleteId === contact.id ? 'text-white' : 'text-danger-500'}
                />
              </button>
            </div>
          </div>
        ))}

        {/* Add button */}
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center space-x-2 w-full h-[48px] rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-primary-300 hover:text-primary-500 transition-all"
        >
          <Plus size={20} />
          <span className="text-[16px] font-medium">添加联系人</span>
        </button>

        {/* Inline form */}
        {showForm && (
          <div className="p-4 bg-primary-50 rounded-xl space-y-3">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="姓名"
              className="w-full h-[48px] px-4 text-elder-base bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            <input
              type="text"
              value={form.relationship}
              onChange={(e) => setForm({ ...form, relationship: e.target.value })}
              placeholder="关系（如：儿子、女儿）"
              className="w-full h-[48px] px-4 text-elder-base bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="电话号码"
              className="w-full h-[48px] px-4 text-elder-base bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-300"
            />
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                }}
                className="flex-1 h-[48px] rounded-xl bg-gray-200 text-gray-600 text-[16px] font-medium"
              >
                取消
              </button>
              <button
                onClick={handleSubmitContact}
                disabled={!form.name.trim() || !form.phone.trim()}
                className={`flex-1 h-[48px] rounded-xl text-[16px] font-medium transition-all ${
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
// Preferences Section
// ========================================

const PreferencesSection: React.FC = () => {
  const { preferences, updateUserPreferences } = useUserStore();
  const [voiceSpeed, setVoiceSpeed] = useState(preferences?.voiceSpeed ?? 1.0);
  const [fontSize, setFontSize] = useState<'large' | 'xlarge' | 'xxlarge'>(
    preferences?.fontSize ?? 'large',
  );
  const [voiceVolume, setVoiceVolume] = useState(preferences?.voiceVolume ?? 80);

  useEffect(() => {
    if (preferences) {
      setVoiceSpeed(preferences.voiceSpeed);
      setFontSize(preferences.fontSize);
      setVoiceVolume(preferences.voiceVolume);
    }
  }, [preferences]);

  const handleSave = useCallback(
    async (params: Partial<{ voiceSpeed: number; fontSize: 'large' | 'xlarge' | 'xxlarge'; voiceVolume: number }>) => {
      await updateUserPreferences(params);
    },
    [updateUserPreferences],
  );

  return (
    <Section title="偏好设置" icon={<Settings size={24} />}>
      <div className="space-y-5">
        {/* Voice speed */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[16px] text-gray-500">语速</label>
            <span className="text-[16px] text-primary-500 font-medium">
              {voiceSpeed.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.1"
            value={voiceSpeed}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              setVoiceSpeed(val);
            }}
            onMouseUp={() => handleSave({ voiceSpeed })}
            onTouchEnd={() => handleSave({ voiceSpeed })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
          />
          <div className="flex justify-between text-[13px] text-gray-400 mt-1">
            <span>慢</span>
            <span>正常</span>
            <span>快</span>
          </div>
        </div>

        {/* Volume */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[16px] text-gray-500">音量</label>
            <span className="text-[16px] text-primary-500 font-medium">{voiceVolume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={voiceVolume}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setVoiceVolume(val);
            }}
            onMouseUp={() => handleSave({ voiceVolume })}
            onTouchEnd={() => handleSave({ voiceVolume })}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-500"
          />
        </div>

        {/* Font size */}
        <div>
          <label className="block text-[16px] text-gray-500 mb-2">字体大小</label>
          <div className="flex space-x-3">
            {[
              { value: 'large' as const, label: '大', sample: 'text-[20px]' },
              { value: 'xlarge' as const, label: '特大', sample: 'text-[24px]' },
              { value: 'xxlarge' as const, label: '超大', sample: 'text-[28px]' },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setFontSize(opt.value);
                  handleSave({ fontSize: opt.value });
                }}
                className={`flex-1 h-[48px] rounded-xl font-medium transition-all ${opt.sample} ${
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
// Health Profile Section
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

const HealthSection: React.FC = () => {
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

  return (
    <Section title="健康档案" icon={<Heart size={24} />}>
      <div className="space-y-5">
        {/* Conditions */}
        <div>
          <label className="block text-[16px] text-gray-500 mb-2">健康状况</label>
          <div className="flex flex-wrap gap-2">
            {commonConditions.map((condition) => (
              <button
                key={condition}
                onClick={() => toggleCondition(condition)}
                className={`px-4 h-[40px] rounded-xl text-[16px] font-medium transition-all ${
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

        {/* Medications */}
        <div>
          <label className="block text-[16px] text-gray-500 mb-2">正在服用的药物</label>
          <div className="space-y-2">
            {medications.map((med, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
              >
                <span className="text-elder-base text-[#212121]">{med}</span>
                <button
                  onClick={() => removeMedicine(index)}
                  className="touch-target flex items-center justify-center w-[36px] h-[36px] rounded-lg bg-danger-50"
                >
                  <X size={16} className="text-danger-500" />
                </button>
              </div>
            ))}
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMedicine}
                onChange={(e) => setNewMedicine(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addMedicine();
                }}
                placeholder="输入药物名称"
                className="flex-1 h-[48px] px-4 text-elder-base bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-300"
              />
              <button
                onClick={addMedicine}
                disabled={!newMedicine.trim()}
                className={`w-[48px] h-[48px] rounded-xl flex items-center justify-center transition-all ${
                  newMedicine.trim()
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                <Plus size={22} />
              </button>
            </div>
          </div>
        </div>

        {/* Allergies */}
        <div>
          <label className="block text-[16px] text-gray-500 mb-2">过敏信息</label>
          <textarea
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            onBlur={handleAllergiesSave}
            placeholder="如有过敏情况请填写"
            rows={3}
            className="w-full px-4 py-3 text-elder-base bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-300 resize-none"
          />
        </div>
      </div>
    </Section>
  );
};

// ========================================
// Family Code Section
// ========================================

const FamilyCodeSection: React.FC = () => {
  const { user } = useUserStore();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!user?.familyCode) return;
    try {
      await navigator.clipboard.writeText(user.familyCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
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

  return (
    <Section title="家属验证码" icon={<Shield size={24} />}>
      <div className="text-center py-2">
        <p className="text-[16px] text-gray-500 mb-3">
          将此验证码分享给家属，用于登录家属端查看您的状态
        </p>
        <div className="flex items-center justify-center space-x-3">
          <span className="text-elder-2xl font-bold tracking-[8px] text-primary-500 bg-primary-50 px-6 py-3 rounded-xl">
            {user?.familyCode || '------'}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="mt-3 px-6 h-[44px] rounded-xl bg-primary-50 text-primary-500 text-[16px] font-medium transition-all"
        >
          {copied ? '已复制' : '复制验证码'}
        </button>
      </div>
    </Section>
  );
};

// ========================================
// Profile Page
// ========================================

const ProfilePage: React.FC = () => {
  return (
    <div className="px-4 py-4 space-y-4">
      <h2 className="text-elder-xl font-bold text-[#212121]">个人设置</h2>
      <BasicInfoSection />
      <EmergencyContactsSection />
      <PreferencesSection />
      <HealthSection />
      <FamilyCodeSection />
      {/* Spacer for bottom nav */}
      <div className="h-4" />
    </div>
  );
};

export default ProfilePage;
