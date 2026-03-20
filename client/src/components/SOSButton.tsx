import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SOSButton: React.FC = () => {
  const navigate = useNavigate();
  const [pressing, setPressing] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const triggeredRef = useRef(false);

  const HOLD_DURATION = 2000; // 2 seconds

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleStart = useCallback(() => {
    triggeredRef.current = false;
    setPressing(true);
    setProgress(0);
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const newProgress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setProgress(newProgress);

      if (elapsed >= HOLD_DURATION && !triggeredRef.current) {
        triggeredRef.current = true;
        clearTimer();
        setPressing(false);
        setProgress(0);
        // Vibrate if supported
        if (navigator.vibrate) {
          navigator.vibrate(200);
        }
        navigate('/emergency');
      }
    }, 30);
  }, [clearTimer, navigate]);

  const handleEnd = useCallback(() => {
    if (!triggeredRef.current) {
      clearTimer();
      setPressing(false);
      setProgress(0);
    }
  }, [clearTimer]);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  // SVG circle parameters
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="fixed right-4 z-40" style={{ bottom: '90px' }}>
      {/* Pulse animation rings */}
      {!pressing && (
        <>
          <div className="absolute inset-0 rounded-full bg-danger-500 opacity-20 voice-pulse-ring" />
          <div
            className="absolute rounded-full bg-danger-500 opacity-10 voice-pulse-ring"
            style={{
              inset: '-8px',
              animationDelay: '0.5s',
            }}
          />
        </>
      )}

      {/* SOS Button */}
      <button
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
        onTouchCancel={handleEnd}
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        className="relative flex items-center justify-center w-[70px] h-[70px] rounded-full bg-danger-500 shadow-lg shadow-danger-500/30 select-none"
        aria-label="SOS紧急求助"
      >
        {/* Progress ring */}
        {pressing && (
          <svg
            className="absolute inset-0 -rotate-90"
            width="70"
            height="70"
            viewBox="0 0 70 70"
          >
            {/* Background circle */}
            <circle
              cx="35"
              cy="35"
              r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="4"
            />
            {/* Progress circle */}
            <circle
              cx="35"
              cy="35"
              r={radius}
              fill="none"
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-75"
            />
          </svg>
        )}

        <span className="text-white font-bold text-[18px] tracking-wider">
          SOS
        </span>
      </button>
    </div>
  );
};

export default SOSButton;
