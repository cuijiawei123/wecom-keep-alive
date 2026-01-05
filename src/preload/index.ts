/**
 * 预加载脚本
 * 使用 contextBridge 安全地暴露 API 给渲染进程
 */

import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/ipc-channels';
import type { AppConfig, RuntimeState } from '../shared/types';

/**
 * 暴露给渲染进程的 API
 */
const electronAPI = {
  // 配置相关
  config: {
    /**
     * 获取当前配置
     */
    get: (): Promise<AppConfig> => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET),

    /**
     * 更新配置
     */
    set: (config: Partial<AppConfig>): Promise<void> =>
      ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SET, config),

    /**
     * 监听配置变化
     */
    onChange: (callback: (config: AppConfig) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, config: AppConfig): void => {
        callback(config);
      };
      ipcRenderer.on(IPC_CHANNELS.CONFIG_CHANGED, handler);
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.CONFIG_CHANGED, handler);
      };
    },
  },

  // 状态相关
  state: {
    /**
     * 获取当前运行状态
     */
    get: (): Promise<RuntimeState> => ipcRenderer.invoke(IPC_CHANNELS.STATE_GET),

    /**
     * 监听状态变化
     */
    onChange: (callback: (state: RuntimeState) => void): (() => void) => {
      const handler = (_event: Electron.IpcRendererEvent, state: RuntimeState): void => {
        callback(state);
      };
      ipcRenderer.on(IPC_CHANNELS.STATE_CHANGED, handler);
      return () => {
        ipcRenderer.removeListener(IPC_CHANNELS.STATE_CHANGED, handler);
      };
    },
  },

  // 控制相关
  control: {
    /**
     * 启动保活
     */
    start: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.CONTROL_START),

    /**
     * 停止保活
     */
    stop: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.CONTROL_STOP),

    /**
     * 切换保活状态
     */
    toggle: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.CONTROL_TOGGLE),
  },

  // 权限相关
  permission: {
    /**
     * 检查辅助功能权限
     */
    check: (): Promise<boolean> => ipcRenderer.invoke(IPC_CHANNELS.PERMISSION_CHECK),

    /**
     * 请求辅助功能权限（显示系统提示）
     */
    request: (): Promise<boolean> => ipcRenderer.invoke(IPC_CHANNELS.PERMISSION_REQUEST),

    /**
     * 打开系统设置
     */
    openSettings: (): Promise<void> => ipcRenderer.invoke(IPC_CHANNELS.PERMISSION_OPEN_SETTINGS),
  },

  // 窗口相关
  window: {
    /**
     * 隐藏窗口
     */
    hide: (): void => {
      ipcRenderer.send(IPC_CHANNELS.WINDOW_HIDE);
    },

    /**
     * 关闭窗口
     */
    close: (): void => {
      ipcRenderer.send(IPC_CHANNELS.WINDOW_CLOSE);
    },
  },

  // 应用相关
  app: {
    /**
     * 退出应用
     */
    quit: (): void => {
      ipcRenderer.send(IPC_CHANNELS.APP_QUIT);
    },

    /**
     * 获取应用版本
     */
    getVersion: (): Promise<string> => ipcRenderer.invoke(IPC_CHANNELS.APP_VERSION),
  },
};

/**
 * 暴露 API 到渲染进程的 window 对象
 */
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

/**
 * 类型声明，供渲染进程使用
 */
export type ElectronAPI = typeof electronAPI;
