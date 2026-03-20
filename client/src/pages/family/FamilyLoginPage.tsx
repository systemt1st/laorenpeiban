import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowRight, AlertTriangle } from 'lucide-react';
import * as api from '@/services/api';

const FamilyLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = useCallback(async () => {
    const trimmedCode = code.trim();
    if (trimmedCode.length < 6) {
      setError('请输入6位验证码');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await api.verifyFamilyCode(trimmedCode);
      if (res.success && res.data?.valid) {
        // Store family session info
        localStorage.setItem('familyUserId', res.data.userId);
        localStorage.setItem('familyCode', trimmedCode);
        navigate('/family/dashboard', { replace: true });
      } else {
        setError('验证码无效，请检查后重试');
      }
    } catch (err) {
      console.error('Failed to verify family code:', err);
      setError('验证失败，请检查网络后重试');
    } finally {
      setIsLoading(false);
    }
  }, [code, navigate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] safe-area-inset flex flex-col items-center justify-center px-6">
      {/* Logo / Icon */}
      <div className="flex items-center justify-center w-[100px] h-[100px] rounded-full bg-primary-50 mb-8">
        <Shield size={48} className="text-primary-500" />
      </div>

      <h1 className="text-elder-xl font-bold text-[#212121] mb-2">家属登录</h1>
      <p className="text-elder-base text-gray-500 mb-8 text-center">
        请输入老人端提供的6位验证码
      </p>

      {/* Code input */}
      <div className="w-full max-w-sm space-y-4">
        <input
          type="text"
          value={code}
          onChange={(e) => {
            const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6);
            setCode(val);
            setError('');
          }}
          onKeyDown={handleKeyDown}
          placeholder="输入验证码"
          maxLength={6}
          autoFocus
          className="w-full h-[64px] px-6 text-center text-elder-2xl tracking-[12px] font-bold bg-white rounded-2xl border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 uppercase"
        />

        {/* Error message */}
        {error && (
          <div className="flex items-center space-x-2 text-danger-500 text-[16px]">
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Verify button */}
        <button
          onClick={handleVerify}
          disabled={code.trim().length < 6 || isLoading}
          className={`flex items-center justify-center space-x-2 w-full h-[64px] rounded-2xl text-elder-lg font-bold transition-all ${
            code.trim().length >= 6 && !isLoading
              ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30 btn-press'
              : 'bg-gray-200 text-gray-400'
          }`}
        >
          {isLoading ? (
            <span>验证中...</span>
          ) : (
            <>
              <span>验证登录</span>
              <ArrowRight size={24} />
            </>
          )}
        </button>
      </div>

      {/* Footer */}
      <p className="mt-12 text-[14px] text-gray-400 text-center">
        验证码可在老人端「我的」-「家属验证码」处查看
      </p>
    </div>
  );
};

export default FamilyLoginPage;
