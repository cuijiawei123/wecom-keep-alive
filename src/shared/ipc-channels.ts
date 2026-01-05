/**
 * IPC 通道定义
 * 用于主进程和渲染进程之间的通信
 */

/**
 * 主进程 -> 渲染进程 的通道
 */
export const IPC_CHANNELS = {
  // 配置相关
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',
  CONFIG_CHANGED: 'config:changed',

  // 状态相关
  STATE_GET: 'state:get',
  STATE_CHANGED: 'state:changed',

  // 控制相关
  CONTROL_START: 'control:start',
  CONTROL_STOP: 'control:stop',
  CONTROL_TOGGLE: 'control:toggle',

  // 权限相关
  PERMISSION_CHECK: 'permission:check',
  PERMISSION_REQUEST: 'permission:request',
  PERMISSION_OPEN_SETTINGS: 'permission:open-settings',

  // 窗口相关
  WINDOW_SHOW: 'window:show',
  WINDOW_HIDE: 'window:hide',
  WINDOW_CLOSE: 'window:close',

  // 应用相关
  APP_QUIT: 'app:quit',
  APP_VERSION: 'app:version',
} as const;

/**
 * IPC 通道类型
 */
export type IpcChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];
