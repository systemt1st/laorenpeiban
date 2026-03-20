/**
 * 格式化工具函数
 */

/** 格式化时间为 HH:mm */
export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/** 格式化日期为 MM月DD日 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${month}月${day}日`;
}

/** 根据时间返回问候语 */
export function getGreeting(nickname?: string): string {
  const hour = new Date().getHours();
  let greeting: string;

  if (hour >= 5 && hour < 12) {
    greeting = '早上好';
  } else if (hour >= 12 && hour < 14) {
    greeting = '中午好';
  } else if (hour >= 14 && hour < 18) {
    greeting = '下午好';
  } else {
    greeting = '晚上好';
  }

  if (nickname) {
    return `${greeting}，${nickname}`;
  }
  return greeting;
}

/** 返回周几名称 */
export function getDayName(day: number): string {
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return dayNames[day] || '';
}

/** 返回提醒类型对应的 emoji 图标 */
export function getReminderIcon(type: string): string {
  switch (type) {
    case 'medicine':
      return '\uD83D\uDC8A';
    case 'water':
      return '\uD83D\uDCA7';
    case 'checkup':
      return '\uD83C\uDFE5';
    case 'custom':
    default:
      return '\uD83D\uDCCC';
  }
}

/** 返回提醒类型的中文名称 */
export function getReminderTypeName(type: string): string {
  switch (type) {
    case 'medicine':
      return '吃药';
    case 'water':
      return '喝水';
    case 'checkup':
      return '就医';
    case 'custom':
    default:
      return '自定义';
  }
}
