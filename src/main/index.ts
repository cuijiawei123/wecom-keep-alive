/**
 * 主进程入口
 * 应用生命周期管理
 */

import { app, BrowserWindow, ipcMain, nativeTheme } from 'electron';
import { join } from 'path';
import { configStore } from './store';
import { trayManager } from './tray';
import { mouseMover } from './mouse-mover';
import { permissionManager } from './permission';
import { IPC_CHANNELS } from '../shared/ipc-channels';
import { INITIAL_RUNTIME_STATE, RuntimeState, AppConfig } from '../shared/types';

// 运行时状态
let runtimeState: RuntimeState = { ...INITIAL_RUNTIME_STATE };
let mainWindow: BrowserWindow | null = null;
let durationTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 创建主窗口
 * 根据平台使用不同的窗口配置
 */
function createWindow(): void {
  // 基础窗口配置（跨平台通用）
  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: 400,
    height: 420,
    show: false,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  };

  // macOS 专属配置
  if (process.platform === 'darwin') {
    windowOptions.titleBarStyle = 'hiddenInset';
    windowOptions.vibrancy = 'under-window';
    windowOptions.visualEffectState = 'active';
  }

  // Windows 专属配置
  if (process.platform === 'win32') {
    // Windows 使用默认标题栏样式
    windowOptions.frame = true;
    windowOptions.autoHideMenuBar = true;
  }

  mainWindow = new BrowserWindow(windowOptions);

  // 开发模式加载本地服务器，生产模式加载打包文件
  if (process.env.NODE_ENV === 'development') {
    void mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    void mainWindow.loadFile(join(__dirname, '../renderer/index.html'));
  }

  // 窗口关闭时隐藏而非退出
  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow?.hide();
  });
}

/**
 * 注册 IPC 处理器
 */
function registerIpcHandlers(): void {
  // 配置相关
  ipcMain.handle(IPC_CHANNELS.CONFIG_GET, () => {
    return configStore.getConfig();
  });

  ipcMain.handle(IPC_CHANNELS.CONFIG_SET, (_event, config: Partial<AppConfig>) => {
    configStore.setConfig(config);
    // 通知渲染进程配置已更新
    mainWindow?.webContents.send(IPC_CHANNELS.CONFIG_CHANGED, configStore.getConfig());
  });

  // 状态相关
  ipcMain.handle(IPC_CHANNELS.STATE_GET, () => {
    return runtimeState;
  });

  // 控制相关
  ipcMain.handle(IPC_CHANNELS.CONTROL_START, () => {
    startKeepAlive();
  });

  ipcMain.handle(IPC_CHANNELS.CONTROL_STOP, () => {
    stopKeepAlive();
  });

  ipcMain.handle(IPC_CHANNELS.CONTROL_TOGGLE, () => {
    if (runtimeState.isActive) {
      stopKeepAlive();
    } else {
      startKeepAlive();
    }
  });

  // 权限相关
  ipcMain.handle(IPC_CHANNELS.PERMISSION_CHECK, () => {
    return permissionManager.checkPermission();
  });

  ipcMain.handle(IPC_CHANNELS.PERMISSION_REQUEST, () => {
    return permissionManager.requestPermission();
  });

  ipcMain.handle(IPC_CHANNELS.PERMISSION_OPEN_SETTINGS, async () => {
    await permissionManager.openAccessibilitySettings();
  });

  // 窗口相关
  ipcMain.on(IPC_CHANNELS.WINDOW_SHOW, () => {
    mainWindow?.show();
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_HIDE, () => {
    mainWindow?.hide();
  });

  ipcMain.on(IPC_CHANNELS.WINDOW_CLOSE, () => {
    mainWindow?.hide();
  });

  // 应用相关
  ipcMain.on(IPC_CHANNELS.APP_QUIT, () => {
    app.exit(0);
  });

  ipcMain.handle(IPC_CHANNELS.APP_VERSION, () => {
    return app.getVersion();
  });
}

/**
 * 启动保活功能
 */
function startKeepAlive(): void {
  if (!runtimeState.hasPermission) {
    void permissionManager.showPermissionDialog();
    return;
  }

  // 获取配置的保活时长
  const duration = configStore.get('duration') as number;

  // 计算结束时间
  let endAt = 0;
  if (duration > 0) {
    endAt = Date.now() + duration * 60 * 1000;

    // 设置定时器，到时自动停止
    if (durationTimer) {
      clearTimeout(durationTimer);
    }
    durationTimer = setTimeout(() => {
      stopKeepAlive();
    }, duration * 60 * 1000);
  }

  mouseMover.start();
  configStore.set('enabled', true);
  updateRuntimeState({
    isActive: true,
    endAt,
    remainingTime: duration > 0 ? duration * 60 : 0,
  });
  trayManager.setActive(true);
}

/**
 * 停止保活功能
 */
function stopKeepAlive(): void {
  // 清除定时器
  if (durationTimer) {
    clearTimeout(durationTimer);
    durationTimer = null;
  }

  mouseMover.stop();
  configStore.set('enabled', false);
  updateRuntimeState({
    isActive: false,
    endAt: 0,
    remainingTime: 0,
  });
  trayManager.setActive(false);
}

/**
 * 广播状态变化到渲染进程
 */
function broadcastState(): void {
  mainWindow?.webContents.send(IPC_CHANNELS.STATE_CHANGED, runtimeState);
}

/**
 * 更新运行时状态
 */
export function updateRuntimeState(updates: Partial<RuntimeState>): void {
  runtimeState = { ...runtimeState, ...updates };
  broadcastState();
}

/**
 * 获取运行时状态
 */
export function getRuntimeState(): RuntimeState {
  return runtimeState;
}

/**
 * 获取主窗口实例
 */
export function getMainWindow(): BrowserWindow | null {
  return mainWindow;
}

/**
 * 显示主窗口
 */
export function showMainWindow(): void {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
}

/**
 * 初始化应用
 */
async function initializeApp(): Promise<void> {
  // macOS: 隐藏 Dock 图标
  if (process.platform === 'darwin') {
    app.dock.hide();
  }

  // 注册 IPC 处理器
  registerIpcHandlers();

  // 创建主窗口
  createWindow();

  // 初始化托盘
  trayManager.init(() => {
    if (runtimeState.isActive) {
      stopKeepAlive();
    } else {
      startKeepAlive();
    }
  });

  // 初始化权限检测
  const hasPermission = await permissionManager.init();
  updateRuntimeState({ hasPermission });

  // 设置权限变化回调
  permissionManager.setOnPermissionChange((hasPermission) => {
    updateRuntimeState({ hasPermission });
    if (hasPermission && configStore.get('enabled')) {
      // 权限恢复后，如果之前是启用状态，自动恢复
      startKeepAlive();
    }
  });

  // 初始化鼠标移动服务状态回调
  mouseMover.setOnStateChange((state) => {
    updateRuntimeState({
      isActive: state.isRunning,
      nextMoveAt: state.nextMoveAt,
      countdown: state.countdown,
      lastMoveAt: state.lastMoveAt,
    });
  });

  // 监听系统主题变化
  nativeTheme.on('updated', () => {
    // 托盘图标使用 Template Image，macOS 会自动处理
  });
}

// 应用准备就绪
app.whenReady().then(() => {
  void initializeApp();
});

// 所有窗口关闭时不退出应用（托盘模式）
app.on('window-all-closed', () => {
  // 不执行任何操作，保持应用运行
});

// macOS: 点击 Dock 图标时显示窗口
app.on('activate', () => {
  if (mainWindow) {
    mainWindow.show();
  }
});

// 防止多实例运行
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // 用户尝试运行第二个实例时，聚焦到主窗口
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// 处理系统休眠/唤醒（使用 powerMonitor API，跨平台支持）
import { powerMonitor } from 'electron';

app.whenReady().then(() => {
  powerMonitor.on('resume', () => {
    // 系统唤醒后，检查是否需要恢复保活
    if (configStore.get('enabled') && runtimeState.hasPermission && runtimeState.isActive) {
      // 检查是否还有剩余时间
      if (runtimeState.endAt === 0 || runtimeState.endAt > Date.now()) {
        mouseMover.start();
        trayManager.setActive(true);
      } else {
        // 时间已过，停止保活
        stopKeepAlive();
      }
    }
  });
});
