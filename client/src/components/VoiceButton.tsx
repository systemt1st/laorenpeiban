import React from 'react';
import { Mic } from 'lucide-react';

interface VoiceButtonProps {
  isListening: boolean;
  onStart: () => void;
  onStop: () => void;
}

const VoiceButton: React.FC<VoiceButtonProps> = ({ isListening, onStart, onStop }) => {
  return (
    <div className="flex flex-col items-center w-full">
      <button
        onTouchStart={(e) => {
          e.preventDefault();
          onStart();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          onStop();
        }}
        onTouchCancel={(e) => {
          e.preventDefault();
          onStop();
        }}
        onMouseDown={onStart}
        onMouseUp={onStop}
        onMouseLeave={() => {
          if (isListening) onStop();
        }}
        className={`relative flex items-center justify-center w-[78%] h-[56px] rounded-2xl select-none transition-all duration-200 ${
          isListening
            ? 'bg-danger-500 shadow-lg shadow-danger-500/30'
            : 'bg-primary-500 shadow-lg shadow-primary-500/30'
        }`}
        aria-label={isListening ? '松开结束录音' : '按住开始说话'}
      >
        {/* Pulse rings when recording */}
        {isListening && (
          <>
            <div className="absolute inset-0 rounded-2xl bg-danger-400 opacity-30 voice-pulse-ring" />
            <div
              className="absolute rounded-2xl bg-danger-400 opacity-15 voice-pulse-ring"
              style={{ inset: '-6px', animationDelay: '0.4s' }}
            />
          </>
        )}

        <div className="flex items-center space-x-2.5 relative z-10">
          <Mic
            size={24}
            className={`${isListening ? 'text-white voice-pulse-dot' : 'text-white'}`}
          />
          <span className="text-white text-[16px] font-medium">
            {isListening ? '松开结束' : '按住说话'}
          </span>
        </div>
      </button>

      <p className="mt-1.5 text-gray-400 text-[13px]">
        {isListening ? '正在聆听...' : '按住按钮开始语音输入'}
      </p>
    </div>
  );
};

export default VoiceButton;
