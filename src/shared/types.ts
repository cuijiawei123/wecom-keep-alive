/**
 * 共享类型定义
 * 用于主进程、渲染进程和预加载脚本之间的类型共享
 */

/**
 * 保活时长选项 (分钟)
 */
export const DURATION_OPTIONS = [
  { label: '30 分钟', value: 30 },
  { label: '1 小时', value: 60 },
  { label: '2 小时', value: 120 },
  { label: '4 小时', value: 240 },
  { label: '8 小时', value: 480 },
  { label: '永久', value: 0 }, // 0 表示永久
] as const;

/**
 * 应用配置 - 持久化存储
 */
export interface AppConfig {
  /** 保活功能开关 */
  enabled: boolean;
  /** 保活时长 (分钟, 0 表示永久) */
  duration: number;
  /** 最后修改时间戳 */
  lastModified: number;
}

/**
 * 运行时状态 - 内存存储
 */
export interface RuntimeState {
  /** 当前是否正在执行保活 */
  isActive: boolean;
  /** 下次鼠标移动的时间戳 */
  nextMoveAt: number;
  /** 距离下次移动的秒数 */
  countdown: number;
  /** 是否已获得辅助功能权限 */
  hasPermission: boolean;
  /** 上次鼠标移动的时间戳 */
  lastMoveAt: number | null;
  /** 保活结束时间戳 (0 表示永久) */
  endAt: number;
  /** 剩余保活时间 (秒) */
  remainingTime: number;
}

/**
 * 托盘图标状态
 */
export type TrayIconState = 'idle' | 'active';

/**
 * 默认配置
 */
export const DEFAULT_CONFIG: AppConfig = {
  enabled: false,
  duration: 60, // 默认 1 小时
  lastModified: Date.now(),
};

/**
 * 鼠标移动间隔范围 (毫秒)
 */
export const MOVE_INTERVAL = {
  MIN: 30000, // 30 秒
  MAX: 90000, // 90 秒
} as const;

/**
 * 初始运行时状态
 */
export const INITIAL_RUNTIME_STATE: RuntimeState = {
  isActive: false,
  nextMoveAt: 0,
  countdown: 0,
  hasPermission: false,
  lastMoveAt: null,
  endAt: 0,
  remainingTime: 0,
};
