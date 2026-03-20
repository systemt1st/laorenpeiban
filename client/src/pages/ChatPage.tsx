import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';
import { useChatStore } from '@/stores/chatStore';
import { useUserStore } from '@/stores/userStore';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import VoiceButton from '@/components/VoiceButton';
import { formatTime, getGreeting } from '@/utils/format';

/** Three-dot thinking animation */
const ThinkingBubble: React.FC = () => (
  <div className="flex items-start space-x-2 mb-4">
    <div className="bg-[#E3F2FD] rounded-2xl rounded-tl-sm px-5 py-3 max-w-[80%]">
      <div className="flex items-center space-x-1.5">
        <span className="w-2.5 h-2.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2.5 h-2.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2.5 h-2.5 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
);

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { messages, isLoading, isEmergency, emergencyLevel, sendMessage, addWelcomeMessage } = useChatStore();
  const { user } = useUserStore();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Use the existing speech recognition hook
  const {
    isListening,
    transcript,
    finalTranscript,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  // Track last processed final transcript to avoid duplicates
  const lastProcessedRef = useRef('');

  // Add welcome message on first load
  useEffect(() => {
    addWelcomeMessage(user?.nickname);
  }, [user?.nickname, addWelcomeMessage]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  // Navigate to emergency page if emergency detected
  useEffect(() => {
    if (isEmergency && (emergencyLevel === 'critical' || emergencyLevel === 'high')) {
      navigate('/emergency');
    }
  }, [isEmergency, emergencyLevel, navigate]);

  // Update input text with speech recognition transcript (interim results)
  useEffect(() => {
    if (transcript && isListening) {
      setInputText(transcript);
    }
  }, [transcript, isListening]);

  // When final transcript is ready, populate the input
  useEffect(() => {
    if (finalTranscript && finalTranscript !== lastProcessedRef.current) {
      lastProcessedRef.current = finalTranscript;
      setInputText(finalTranscript);
    }
  }, [finalTranscript]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isLoading) return;
    setInputText('');
    resetTranscript();
    lastProcessedRef.current = '';
    await sendMessage(text);
  }, [inputText, isLoading, sendMessage, resetTranscript]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend],
  );

  const handleVoiceStart = useCallback(() => {
    resetTranscript();
    lastProcessedRef.current = '';
    startListening();
  }, [startListening, resetTranscript]);

  const handleVoiceStop = useCallback(() => {
    stopListening();
  }, [stopListening]);

  const greeting = getGreeting(user?.nickname);

  return (
    <div className="flex flex-col h-[calc(100vh-56px-70px)]">
      {/* Greeting header */}
      <div className="px-4 py-3 bg-white border-b border-gray-100">
        <h2 className="text-elder-lg font-bold text-[#212121]">{greeting}</h2>
        <p className="text-[16px] text-gray-500 mt-0.5">有什么我可以帮您的吗？</p>
      </div>

      {/* Messages area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin"
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isSystem = msg.role === 'system';

          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center">
                <div className="bg-gray-100 rounded-xl px-4 py-2 max-w-[90%]">
                  <p className="text-[14px] text-gray-500 text-center">{msg.content}</p>
                </div>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] ${
                  isUser
                    ? 'bg-[#E8F5E9] rounded-2xl rounded-tr-sm'
                    : 'bg-[#E3F2FD] rounded-2xl rounded-tl-sm'
                } px-4 py-3`}
              >
                <p className="text-elder-base text-[#212121] leading-relaxed whitespace-pre-wrap break-words">
                  {msg.content}
                </p>
                <p
                  className={`text-[13px] mt-1.5 ${
                    isUser ? 'text-right text-success-600' : 'text-primary-400'
                  }`}
                >
                  {formatTime(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}

        {/* Thinking animation */}
        {isLoading && <ThinkingBubble />}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="bg-white border-t border-gray-200 px-4 py-3 space-y-3">
        {/* Voice button */}
        <VoiceButton
          isListening={isListening}
          onStart={handleVoiceStart}
          onStop={handleVoiceStop}
        />

        {/* Text input row */}
        <div className="flex items-center space-x-3">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入消息..."
            className="flex-1 h-[52px] px-4 text-elder-base bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-transparent transition-all"
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || isLoading}
            className={`flex items-center justify-center w-[52px] h-[52px] rounded-2xl transition-all ${
              inputText.trim() && !isLoading
                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30 btn-press'
                : 'bg-gray-200 text-gray-400'
            }`}
            aria-label="发送消息"
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
