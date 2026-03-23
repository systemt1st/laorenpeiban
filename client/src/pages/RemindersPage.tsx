import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, X, ChevronRight } from 'lucide-react';
import { useReminderStore } from '@/stores/reminderStore';
import { useUserStore } from '@/stores/userStore';
import type { Reminder, CreateReminderParams } from '@/types';
import { getReminderIcon, getDayName } from '@/utils/format';

/** Reminder type option */
interface TypeOption {
  value: Reminder['type'];
  label: string;
  icon: string;
}

const typeOptions: TypeOption[] = [
  { value: 'medicine', label: '吃药', icon: '\uD83D\uDC8A' },
  { value: 'water', label: '喝水', icon: '\uD83D\uDCA7' },
  { value: 'checkup', label: '就医', icon: '\uD83C\uDFE5' },
  { value: 'custom', label: '自定义', icon: '\uD83D\uDCCC' },
];

const dayOptions = [
  { value: 0, label: '日' },
  { value: 1, label: '一' },
  { value: 2, label: '二' },
  { value: 3, label: '三' },
  { value: 4, label: '四' },
  { value: 5, label: '五' },
  { value: 6, label: '六' },
];

/** Add/Edit reminder modal */
interface ReminderFormProps {
  onClose: () => void;
  onSubmit: (params: CreateReminderParams) => void;
  editingReminder?: Reminder | null;
}

const ReminderForm: React.FC<ReminderFormProps> = ({ onClose, onSubmit, editingReminder }) => {
  const { user } = useUserStore();
  const [type, setType] = useState<Reminder['type']>(editingReminder?.type || 'medicine');
  const [title, setTitle] = useState(editingReminder?.title || '');
  const [time, setTime] = useState(editingReminder?.time || '08:00');
  const [selectedDays, setSelectedDays] = useState<number[]>(
    editingReminder?.days || [1, 2, 3, 4, 5, 6, 0],
  );

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleSubmit = () => {
    if (!title.trim() || !user) return;
    onSubmit({
      userId: user.id,
      type,
      title: title.trim(),
      time,
      days: selectedDays,
      repeat: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center">
      <div className="w-full max-w-lg bg-white rounded-t-3xl p-4 space-y-4 animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-[20px] font-bold text-[#212121]">
            {editingReminder ? '编辑提醒' : '添加提醒'}
          </h3>
          <button
            onClick={onClose}
            className="touch-target flex items-center justify-center w-[40px] h-[40px] rounded-xl bg-gray-100"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Type selection */}
        <div>
          <label className="block text-[15px] font-medium text-[#212121] mb-1.5">
            提醒类型
          </label>
          <div className="grid grid-cols-4 gap-2">
            {typeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => {
                  setType(opt.value);
                  if (!title.trim()) setTitle(opt.label);
                }}
                className={`flex flex-col items-center py-2.5 px-1.5 rounded-2xl border-2 transition-all ${
                  type === opt.value
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 bg-white'
                }`}
              >
                <span className="text-[24px]">{opt.icon}</span>
                <span className="text-[14px] mt-0.5 font-medium">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-[15px] font-medium text-[#212121] mb-1.5">
            提醒内容
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="例如：吃降压药"
            className="w-full h-[46px] px-3.5 text-[16px] bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>

        {/* Time */}
        <div>
          <label className="block text-[15px] font-medium text-[#212121] mb-1.5">
            提醒时间
          </label>
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full h-[46px] px-3.5 text-[16px] bg-gray-50 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-300"
          />
        </div>

        {/* Repeat days */}
        <div>
          <label className="block text-[15px] font-medium text-[#212121] mb-1.5">
            重复日期
          </label>
          <div className="flex justify-between space-x-1.5">
            {dayOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => toggleDay(opt.value)}
                className={`flex items-center justify-center w-[38px] h-[38px] rounded-full text-[14px] font-medium transition-all ${
                  selectedDays.includes(opt.value)
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-500'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={!title.trim()}
          className={`w-full h-[48px] rounded-2xl text-[16px] font-bold transition-all ${
            title.trim()
              ? 'bg-primary-500 text-white shadow-md shadow-primary-500/30 btn-press'
              : 'bg-gray-200 text-gray-400'
          }`}
        >
          {editingReminder ? '保存修改' : '添加提醒'}
        </button>
      </div>
    </div>
  );
};

/** Single reminder card */
interface ReminderCardProps {
  reminder: Reminder;
  onEdit: (reminder: Reminder) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, enabled: boolean) => void;
}

const ReminderCard: React.FC<ReminderCardProps> = ({ reminder, onEdit, onDelete, onToggle }) => {
  const [showDelete, setShowDelete] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const daysText = reminder.days.length === 7
    ? '每天'
    : reminder.days.map((d) => getDayName(d)).join(' ');

  const handleDelete = () => {
    if (confirmingDelete) {
      onDelete(reminder.id);
    } else {
      setConfirmingDelete(true);
      setTimeout(() => setConfirmingDelete(false), 3000);
    }
  };

  return (
    <div
      className={`bg-white rounded-[18px] p-3 shadow-sm border transition-all ${
        reminder.enabled ? 'border-gray-100' : 'border-gray-200 opacity-60'
      }`}
    >
      <div className="flex items-center space-x-3">
        {/* Icon */}
        <div className="flex items-center justify-center w-[46px] h-[46px] rounded-xl bg-primary-50 text-[24px] flex-shrink-0">
          {getReminderIcon(reminder.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0" onClick={() => onEdit(reminder)}>
          <h4 className="text-[16px] font-bold text-[#212121] truncate">
            {reminder.title}
          </h4>
          <p className="text-[15px] text-primary-500 font-medium">{reminder.time}</p>
          <p className="text-[13px] text-gray-400 mt-0.5">{daysText}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-1.5 flex-shrink-0">
          {/* Enable/disable toggle */}
          <button
            onClick={() => onToggle(reminder.id, !reminder.enabled)}
            className={`w-[46px] h-[26px] rounded-full transition-all relative ${
              reminder.enabled ? 'bg-primary-500' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-[3px] w-[20px] h-[20px] bg-white rounded-full shadow transition-all ${
                reminder.enabled ? 'left-[23px]' : 'left-[3px]'
              }`}
            />
          </button>

          {/* More actions button */}
          <button
            onClick={() => setShowDelete(!showDelete)}
            className="touch-target flex items-center justify-center"
          >
            <ChevronRight size={18} className="text-gray-400" />
          </button>
        </div>
      </div>

      {/* Delete area */}
      {showDelete && (
        <div className="flex items-center justify-end space-x-2.5 mt-2.5 pt-2.5 border-t border-gray-100">
          <button
            onClick={() => onEdit(reminder)}
            className="flex items-center space-x-1 px-3.5 h-[36px] rounded-xl bg-primary-50 text-primary-500 text-[14px] font-medium"
          >
            <span>编辑</span>
          </button>
          <button
            onClick={handleDelete}
            className={`flex items-center space-x-1 px-3.5 h-[36px] rounded-xl text-[14px] font-medium transition-all ${
              confirmingDelete
                ? 'bg-danger-500 text-white'
                : 'bg-danger-50 text-danger-500'
            }`}
          >
            <Trash2 size={16} />
            <span>{confirmingDelete ? '确认删除' : '删除'}</span>
          </button>
        </div>
      )}
    </div>
  );
};

/** Empty state */
const EmptyState: React.FC<{ onAdd: () => void }> = ({ onAdd }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    <div className="text-[52px] mb-3">{'\u23F0'}</div>
    <h3 className="text-[18px] font-bold text-[#212121] mb-1.5">
      还没有提醒
    </h3>
    <p className="text-[15px] leading-7 text-gray-500 mb-5 max-w-[18rem]">
      添加吃药、喝水等提醒，我会按时提醒您
    </p>
    <button
      onClick={onAdd}
      className="flex items-center space-x-2 px-6 h-[48px] bg-primary-500 text-white rounded-2xl text-[16px] font-bold shadow-md shadow-primary-500/30 btn-press"
    >
      <Plus size={20} />
      <span>添加提醒</span>
    </button>
  </div>
);

const RemindersPage: React.FC = () => {
  const { user } = useUserStore();
  const { reminders, loadReminders, addReminder, updateReminder, deleteReminder } = useReminderStore();
  const [showForm, setShowForm] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  useEffect(() => {
    if (user?.id) {
      loadReminders(user.id);
    }
  }, [user?.id, loadReminders]);

  const handleAdd = useCallback(() => {
    setEditingReminder(null);
    setShowForm(true);
  }, []);

  const handleEdit = useCallback((reminder: Reminder) => {
    setEditingReminder(reminder);
    setShowForm(true);
  }, []);

  const handleSubmit = useCallback(
    async (params: CreateReminderParams) => {
      if (editingReminder) {
        await updateReminder(editingReminder.id, {
          title: params.title,
          time: params.time,
          days: params.days,
          repeat: params.repeat,
        });
      } else {
        await addReminder(params);
      }
    },
    [editingReminder, addReminder, updateReminder],
  );

  const handleDelete = useCallback(
    async (id: string) => {
      await deleteReminder(id);
    },
    [deleteReminder],
  );

  const handleToggle = useCallback(
    async (id: string, enabled: boolean) => {
      await updateReminder(id, { enabled });
    },
    [updateReminder],
  );

  return (
    <div className="px-3 py-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[22px] leading-8 font-bold text-[#212121]">我的提醒</h2>
        {reminders.length > 0 && (
          <button
            onClick={handleAdd}
            className="flex items-center space-x-1 px-3.5 h-[40px] bg-primary-500 text-white rounded-2xl text-[15px] font-medium shadow-sm btn-press"
          >
            <Plus size={18} />
            <span>添加</span>
          </button>
        )}
      </div>

      {/* Reminder list or empty state */}
      {reminders.length === 0 ? (
        <EmptyState onAdd={handleAdd} />
      ) : (
        <div className="space-y-2.5">
          {reminders.map((reminder) => (
            <ReminderCard
              key={reminder.id}
              reminder={reminder}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}

      {/* Add/Edit form modal */}
      {showForm && (
        <ReminderForm
          onClose={() => {
            setShowForm(false);
            setEditingReminder(null);
          }}
          onSubmit={handleSubmit}
          editingReminder={editingReminder}
        />
      )}
    </div>
  );
};

export default RemindersPage;
