import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageCircle,
  Clock,
  AlertTriangle,
  Settings,
  LogOut,
  Heart,
  Check,
  X,
  ArrowLeft,
} from 'lucide-react';
import type { FamilyDashboard } from '@/types';
import * as api from '@/services/api';
import { formatTime } from '@/utils/format';

/** Mood label mapping */
function getMoodLabel(mood: string): { text: string; color: string } {
  switch (mood) {
    case 'happy':
      return { text: '开心', color: 'text-success-500' };
    case 'calm':
      return { text: '平静', color: 'text-primary-500' };
    case 'sad':
      return { text: '低落', color: 'text-warning-500' };
    case 'anxious':
      return { text: '焦虑', color: 'text-warning-600' };
    case 'angry':
      return { text: '烦躁', color: 'text-danger-500' };
    default:
      return { text: '正常', color: 'text-gray-500' };
  }
}

/** Stat card component */
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color }) => (
  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center space-y-2">
    <div className={`${color}`}>{icon}</div>
    <span className="text-elder-lg font-bold text-[#212121]">{value}</span>
    <span className="text-[14px] text-gray-500">{label}</span>
  </div>
);

const FamilyDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<FamilyDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const familyUserId = localStorage.getItem('familyUserId');

  useEffect(() => {
    if (!familyUserId) {
      navigate('/family', { replace: true });
      return;
    }

    const loadDashboard = async () => {
      setIsLoading(true);
      try {
        const res = await api.getFamilyDashboard(familyUserId);
        if (res.success && res.data) {
          setDashboard(res.data);
        } else {
          setError('加载数据失败');
        }
      } catch (err) {
        console.error('Failed to load family dashboard:', err);
        setError('网络连接失败，请稍后重试');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [familyUserId, navigate]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('familyUserId');
    localStorage.removeItem('familyCode');
    navigate('/family', { replace: true });
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-elder-base text-gray-500">加载中...</p>
        </div>
      </div>
    );
  }

  if (error && !dashboard) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-6">
        <div className="text-center">
          <AlertTriangle size={48} className="text-warning-500 mx-auto mb-4" />
          <p className="text-elder-base text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 h-[48px] bg-primary-500 text-white rounded-2xl text-[16px] font-medium"
          >
            重试
          </button>
        </div>
      </div>
    );
  }

  const stats = dashboard?.todayStats;
  const moodInfo = getMoodLabel(stats?.mood || '');
  const reminderRate = stats && stats.reminderTotal > 0
    ? Math.round((stats.reminderCompleted / stats.reminderTotal) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-[#FAFAFA] safe-area-inset">
      {/* Header */}
      <div className="bg-primary-500 text-white px-4 py-6 safe-area-top">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => navigate('/family')}
            className="flex items-center space-x-1 touch-target"
          >
            <ArrowLeft size={22} />
            <span className="text-[16px]">返回</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-1 touch-target"
          >
            <LogOut size={20} />
            <span className="text-[16px]">退出</span>
          </button>
        </div>
        <h1 className="text-elder-xl font-bold">
          {dashboard?.user.nickname || '老人'} 的状态
        </h1>
        <p className="text-[16px] opacity-80 mt-1">今日概览</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Today's stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="对话次数"
            value={stats?.chatCount ?? 0}
            icon={<MessageCircle size={28} />}
            color="text-primary-500"
          />
          <StatCard
            label="今日情绪"
            value={moodInfo.text}
            icon={<Heart size={28} />}
            color={moodInfo.color}
          />
          <StatCard
            label="吃药完成率"
            value={`${reminderRate}%`}
            icon={<Clock size={28} />}
            color="text-success-500"
          />
          <StatCard
            label="紧急事件"
            value={stats?.emergencyCount ?? 0}
            icon={<AlertTriangle size={28} />}
            color={
              (stats?.emergencyCount ?? 0) > 0
                ? 'text-danger-500'
                : 'text-gray-400'
            }
          />
        </div>

        {/* Recent conversation summary */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-elder-base font-bold text-[#212121] mb-2 flex items-center space-x-2">
            <MessageCircle size={20} className="text-primary-500" />
            <span>最近对话摘要</span>
          </h3>
          <p className="text-[16px] text-gray-600 leading-relaxed">
            {dashboard?.recentSummary || '今天暂无对话记录'}
          </p>
        </div>

        {/* Reminder logs */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <h3 className="text-elder-base font-bold text-[#212121] mb-3 flex items-center space-x-2">
            <Clock size={20} className="text-success-500" />
            <span>今日提醒执行情况</span>
          </h3>
          {dashboard?.reminderLogs && dashboard.reminderLogs.length > 0 ? (
            <div className="space-y-2">
              {dashboard.reminderLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <div className="flex items-center space-x-2">
                    {log.confirmed ? (
                      <div className="w-[28px] h-[28px] rounded-full bg-success-50 flex items-center justify-center">
                        <Check size={16} className="text-success-500" />
                      </div>
                    ) : (
                      <div className="w-[28px] h-[28px] rounded-full bg-danger-50 flex items-center justify-center">
                        <X size={16} className="text-danger-500" />
                      </div>
                    )}
                    <span className="text-[16px] text-[#212121]">
                      提醒 #{log.reminderId.slice(-4)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[14px] text-gray-400">
                      {formatTime(log.triggeredAt)}
                    </span>
                    <span
                      className={`ml-2 text-[14px] font-medium ${
                        log.confirmed ? 'text-success-500' : 'text-danger-500'
                      }`}
                    >
                      {log.confirmed ? '已确认' : '未确认'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[16px] text-gray-400 text-center py-4">
              今天暂无提醒记录
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            className="flex flex-col items-center justify-center h-[80px] bg-white rounded-2xl shadow-sm border border-gray-100 space-y-1"
            onClick={() => {/* Could navigate to conversation history */}}
          >
            <MessageCircle size={24} className="text-primary-500" />
            <span className="text-[16px] font-medium text-[#212121]">对话记录</span>
          </button>
          <button
            className="flex flex-col items-center justify-center h-[80px] bg-white rounded-2xl shadow-sm border border-gray-100 space-y-1"
            onClick={() => {/* Could navigate to reminder records */}}
          >
            <Clock size={24} className="text-success-500" />
            <span className="text-[16px] font-medium text-[#212121]">提醒记录</span>
          </button>
          <button
            className="flex flex-col items-center justify-center h-[80px] bg-white rounded-2xl shadow-sm border border-gray-100 space-y-1"
            onClick={() => {/* Could navigate to emergency events */}}
          >
            <AlertTriangle size={24} className="text-danger-500" />
            <span className="text-[16px] font-medium text-[#212121]">紧急事件</span>
          </button>
          <button
            className="flex flex-col items-center justify-center h-[80px] bg-white rounded-2xl shadow-sm border border-gray-100 space-y-1"
            onClick={() => {/* Could navigate to remote config */}}
          >
            <Settings size={24} className="text-warning-500" />
            <span className="text-[16px] font-medium text-[#212121]">远程配置</span>
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center justify-center space-x-2 w-full h-[52px] rounded-2xl bg-white border border-gray-200 text-danger-500 text-[16px] font-medium"
        >
          <LogOut size={20} />
          <span>退出登录</span>
        </button>

        {/* Spacer */}
        <div className="h-4" />
      </div>
    </div>
  );
};

export default FamilyDashboardPage;
