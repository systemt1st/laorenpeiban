import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Plus, X, User as UserIcon, Phone, Heart } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';

interface ContactForm {
  name: string;
  relationship: string;
  phone: string;
}

const SetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { initUser, addEmergencyContact } = useUserStore();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Basic info
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<'male' | 'female' | 'other'>('other');

  // Step 2: Emergency contacts
  const [contacts, setContacts] = useState<ContactForm[]>([
    { name: '', relationship: '', phone: '' },
  ]);

  const totalSteps = 3;

  const handleNext = useCallback(async () => {
    if (step === 1) {
      if (!nickname.trim()) return;
      setIsSubmitting(true);
      const user = await initUser(nickname.trim(), parseInt(age) || 70, gender);
      setIsSubmitting(false);
      if (user) {
        setStep(2);
      }
    } else if (step === 2) {
      // Add contacts
      setIsSubmitting(true);
      for (const contact of contacts) {
        if (contact.name.trim() && contact.phone.trim()) {
          await addEmergencyContact(
            contact.name.trim(),
            contact.relationship.trim() || '家人',
            contact.phone.trim(),
          );
        }
      }
      setIsSubmitting(false);
      setStep(3);
    } else if (step === 3) {
      navigate('/chat', { replace: true });
    }
  }, [step, nickname, age, gender, contacts, initUser, addEmergencyContact, navigate]);

  const addContactField = () => {
    setContacts([...contacts, { name: '', relationship: '', phone: '' }]);
  };

  const removeContactField = (index: number) => {
    if (contacts.length <= 1) return;
    setContacts(contacts.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, field: keyof ContactForm, value: string) => {
    const updated = [...contacts];
    updated[index] = { ...updated[index], [field]: value };
    setContacts(updated);
  };

  const canProceed = (): boolean => {
    if (step === 1) return nickname.trim().length > 0;
    if (step === 2) return contacts.some((c) => c.name.trim() && c.phone.trim());
    return true;
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] safe-area-inset flex flex-col">
      {/* Progress indicator */}
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[16px] text-gray-500">
            {step}/{totalSteps}
          </span>
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center space-x-1 text-primary-500 touch-target"
            >
              <ArrowLeft size={18} />
              <span className="text-[16px]">上一步</span>
            </button>
          )}
        </div>
        <div className="flex space-x-2">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div
              key={i}
              className={`flex-1 h-[6px] rounded-full transition-all ${
                i < step ? 'bg-primary-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 px-6 py-6">
        {/* Step 1: Basic info */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center w-[80px] h-[80px] rounded-full bg-primary-50 mx-auto mb-4">
                <UserIcon size={40} className="text-primary-500" />
              </div>
              <h2 className="text-elder-xl font-bold text-[#212121]">
                您好！
              </h2>
              <p className="text-elder-base text-gray-500 mt-2">
                您希望我怎么称呼您？
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-elder-base font-medium text-[#212121] mb-2">
                  称呼
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="例如：张阿姨、李叔叔"
                  autoFocus
                  className="w-full h-[56px] px-4 text-elder-lg bg-white rounded-2xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400"
                />
              </div>

              <div>
                <label className="block text-elder-base font-medium text-[#212121] mb-2">
                  年龄（选填）
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="例如：70"
                  className="w-full h-[56px] px-4 text-elder-lg bg-white rounded-2xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400"
                />
              </div>

              <div>
                <label className="block text-elder-base font-medium text-[#212121] mb-2">
                  性别（选填）
                </label>
                <div className="flex space-x-3">
                  {[
                    { value: 'male' as const, label: '男' },
                    { value: 'female' as const, label: '女' },
                    { value: 'other' as const, label: '不填' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setGender(opt.value)}
                      className={`flex-1 h-[56px] rounded-2xl text-elder-base font-medium transition-all ${
                        gender === opt.value
                          ? 'bg-primary-500 text-white shadow-md'
                          : 'bg-white border-2 border-gray-200 text-gray-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Emergency contacts */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center w-[80px] h-[80px] rounded-full bg-warning-50 mx-auto mb-4">
                <Phone size={40} className="text-warning-500" />
              </div>
              <h2 className="text-elder-xl font-bold text-[#212121]">
                添加紧急联系人
              </h2>
              <p className="text-elder-base text-gray-500 mt-2">
                请至少添加一位家人的联系方式
              </p>
            </div>

            <div className="space-y-4">
              {contacts.map((contact, index) => (
                <div key={index} className="bg-white rounded-2xl p-4 space-y-3 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[16px] text-gray-500">
                      联系人 {index + 1}
                    </span>
                    {contacts.length > 1 && (
                      <button
                        onClick={() => removeContactField(index)}
                        className="touch-target flex items-center justify-center w-[36px] h-[36px] rounded-lg bg-danger-50"
                      >
                        <X size={18} className="text-danger-500" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={contact.name}
                    onChange={(e) => updateContact(index, 'name', e.target.value)}
                    placeholder="姓名"
                    className="w-full h-[52px] px-4 text-elder-base bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                  <input
                    type="text"
                    value={contact.relationship}
                    onChange={(e) => updateContact(index, 'relationship', e.target.value)}
                    placeholder="关系（如：儿子、女儿、邻居）"
                    className="w-full h-[52px] px-4 text-elder-base bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                  <input
                    type="tel"
                    value={contact.phone}
                    onChange={(e) => updateContact(index, 'phone', e.target.value)}
                    placeholder="电话号码"
                    className="w-full h-[52px] px-4 text-elder-base bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-300"
                  />
                </div>
              ))}

              <button
                onClick={addContactField}
                className="flex items-center justify-center space-x-2 w-full h-[52px] rounded-2xl border-2 border-dashed border-gray-300 text-gray-400"
              >
                <Plus size={20} />
                <span className="text-[16px] font-medium">再添加一位</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Complete */}
        {step === 3 && (
          <div className="flex flex-col items-center justify-center text-center py-12">
            <div className="flex items-center justify-center w-[100px] h-[100px] rounded-full bg-success-50 mx-auto mb-6">
              <Check size={48} className="text-success-500" />
            </div>
            <h2 className="text-elder-xl font-bold text-[#212121]">
              设置完成！
            </h2>
            <p className="text-elder-base text-gray-500 mt-3 max-w-xs">
              很高兴认识您！现在可以开始使用了，有什么需要随时跟我说。
            </p>
            <div className="flex items-center justify-center w-[60px] h-[60px] rounded-full bg-primary-50 mt-8">
              <Heart size={28} className="text-primary-500" />
            </div>
          </div>
        )}
      </div>

      {/* Bottom button */}
      <div className="px-6 pb-8">
        <button
          onClick={handleNext}
          disabled={!canProceed() || isSubmitting}
          className={`flex items-center justify-center space-x-2 w-full h-[64px] rounded-2xl text-elder-lg font-bold transition-all ${
            canProceed() && !isSubmitting
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 btn-press'
              : 'bg-gray-200 text-gray-400'
          }`}
        >
          {isSubmitting ? (
            <span>请稍候...</span>
          ) : step === 3 ? (
            <>
              <span>开始使用</span>
              <ArrowRight size={24} />
            </>
          ) : (
            <>
              <span>下一步</span>
              <ArrowRight size={24} />
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default SetupPage;
