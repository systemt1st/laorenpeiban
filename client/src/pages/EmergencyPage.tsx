import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Heart, ArrowLeft, AlertTriangle, Shield } from 'lucide-react';
import { useUserStore } from '@/stores/userStore';
import { useChatStore } from '@/stores/chatStore';
import * as api from '@/services/api';
import { getEmergencyGuidance } from '@/utils/emergency';

const EmergencyPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, emergencyContacts, loadEmergencyContacts } = useUserStore();
  const { emergencyLevel, setEmergency } = useChatStore();

  useEffect(() => {
    if (user?.id) {
      loadEmergencyContacts();
    }
  }, [user?.id, loadEmergencyContacts]);

  // Create emergency event record
  useEffect(() => {
    if (user?.id) {
      api.createEmergencyEvent({
        userId: user.id,
        triggerKeyword: 'SOS按钮触发',
        userDescription: '',
        riskLevel: (emergencyLevel as 'critical' | 'high' | 'medium') || 'high',
        context: 'SOS按钮或紧急检测触发',
      }).catch((err) => {
        console.error('Failed to create emergency event:', err);
      });
    }
  }, [user?.id, emergencyLevel]);

  const primaryContact = emergencyContacts.length > 0
    ? emergencyContacts.reduce((prev, curr) =>
        prev.priority < curr.priority ? prev : curr
      )
    : null;

  const handleCall120 = useCallback(() => {
    window.location.href = 'tel:120';
  }, []);

  const handleCallFamily = useCallback(() => {
    if (primaryContact) {
      window.location.href = `tel:${primaryContact.phone}`;
    }
  }, [primaryContact]);

  const handleDismiss = useCallback(() => {
    setEmergency(null);
    navigate('/chat');
  }, [navigate, setEmergency]);

  const guidance = getEmergencyGuidance(null);

  return (
    <div className="min-h-screen bg-[#FAFAFA] safe-area-inset flex flex-col">
      {/* Header */}
      <div className="bg-danger-500 text-white px-4 py-6 safe-area-top">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center space-x-1 mb-4 touch-target"
        >
          <ArrowLeft size={24} />
          <span className="text-[16px]">返回</span>
        </button>
        <div className="flex items-center space-x-3">
          <AlertTriangle size={36} />
          <h1 className="text-elder-2xl font-bold">紧急求助</h1>
        </div>
        <p className="text-elder-base mt-2 opacity-90">
          您是否需要紧急帮助？
        </p>
      </div>

      {/* Action buttons */}
      <div className="flex-1 px-4 py-6 space-y-4">
        {/* Call 120 */}
        <button
          onClick={handleCall120}
          className="flex items-center justify-center space-x-4 w-full h-[80px] bg-danger-500 text-white rounded-2xl text-elder-lg font-bold shadow-lg shadow-danger-500/30 btn-press"
        >
          <Phone size={32} />
          <span>拨打 120 急救电话</span>
        </button>

        {/* Call family */}
        <button
          onClick={handleCallFamily}
          disabled={!primaryContact}
          className={`flex items-center justify-center space-x-4 w-full h-[80px] rounded-2xl text-elder-lg font-bold shadow-lg btn-press ${
            primaryContact
              ? 'bg-warning-500 text-white shadow-warning-500/30'
              : 'bg-gray-300 text-gray-500'
          }`}
        >
          <Heart size={32} />
          <span>
            {primaryContact
              ? `联系家人 (${primaryContact.name})`
              : '未设置紧急联系人'}
          </span>
        </button>

        {/* I'm OK */}
        <button
          onClick={handleDismiss}
          className="flex items-center justify-center space-x-4 w-full h-[80px] bg-success-500 text-white rounded-2xl text-elder-lg font-bold shadow-lg shadow-success-500/30 btn-press"
        >
          <Shield size={32} />
          <span>我没事，返回对话</span>
        </button>
      </div>

      {/* Emergency tips */}
      <div className="px-4 pb-6">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-elder-base font-bold text-[#212121] mb-3 flex items-center space-x-2">
            <AlertTriangle size={20} className="text-warning-500" />
            <span>急救小贴士</span>
          </h3>
          <ul className="space-y-2">
            {guidance.map((tip, index) => (
              <li
                key={index}
                className="flex items-start space-x-2 text-[16px] text-gray-600"
              >
                <span className="text-primary-500 font-bold mt-0.5">{index + 1}.</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EmergencyPage;
