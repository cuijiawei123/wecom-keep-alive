/**
 * 窗口管理模块
 * 负责主窗口的创建、显示、隐藏等操作
 * 支持 macOS 和 Windows 平台
 */

import { BrowserWindow, screen } from 'electron';
import { join } from 'path';

let mainWindow: BrowserWindow | null = null;

/**
 * 窗口配置
 */
const WINDOW_CONFIG = {
  width: 400,
  height: 500,
  minWidth: 360,
  minHeight: 400,
};

/**
 * 创建主窗口
 * 根据平台使用不同的窗口配置
 */
export function createMainWindow(): BrowserWindow {
  if (mainWindow && !mainWindow.isDestroyed()) {
    return mainWindow;
  }

  // 基础窗口配置（跨平台通用）
  const windowOptions: Electron.BrowserWindowConstructorOptions = {
    width: WINDOW_CONFIG.width,
    height: WINDOW_CONFIG.height,
    minWidth: WINDOW_CONFIG.minWidth,
    minHeight: WINDOW_CONFIG.minHeight,
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
    windowOptions.backgroundColor = '#00000000';
  }

  // Windows 专属配置
  if (process.platform === 'win32') {
    windowOptions.frame = true;
    windowOptions.autoHideMenuBar = true;
    windowOptions.backgroundColor = '#ffffff';
  }

  mainWindow = new BrowserWindow(windowOptions);

  // 窗口关闭时隐藏而非退出
  mainWindow.on('close', (event) => {
    event.preventDefault();
    mainWindow?.hide();
  });

  // 窗口失去焦点时隐藏（可选行为）
  // mainWindow.on('blur', () => {
  //   mainWindow?.hide();
  // });

  return mainWindow;
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
  if (!mainWindow || mainWindow.isDestroyed()) {
    mainWindow = createMainWindow();
  }

  // 将窗口定位到屏幕中央
  centerWindow();

  mainWindow.show();
  mainWindow.focus();
}

/**
 * 隐藏主窗口
 */
export function hideMainWindow(): void {
  mainWindow?.hide();
}

/**
 * 切换主窗口显示状态
 */
export function toggleMainWindow(): void {
  if (mainWindow?.isVisible()) {
    hideMainWindow();
  } else {
    showMainWindow();
  }
}

/**
 * 将窗口居中显示
 */
function centerWindow(): void {
  if (!mainWindow) return;

  const { width, height } = mainWindow.getBounds();
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  const x = Math.round((screenWidth - width) / 2);
  const y = Math.round((screenHeight - height) / 2);

  mainWindow.setPosition(x, y);
}

/**
 * 在托盘图标附近显示窗口
 */
export function showWindowNearTray(trayBounds: Electron.Rectangle): void {
  if (!mainWindow || mainWindow.isDestroyed()) {
    mainWindow = createMainWindow();
  }

  const { width } = mainWindow.getBounds();
  const { x: trayX, y: trayY, width: trayWidth } = trayBounds;

  // 计算窗口位置（在托盘图标下方居中）
  const windowX = Math.round(trayX + trayWidth / 2 - width / 2);
  const windowY = trayY + 10; // 托盘下方 10px

  mainWindow.setPosition(windowX, windowY);
  mainWindow.show();
  mainWindow.focus();
}

/**
 * 销毁主窗口
 */
export function destroyMainWindow(): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.destroy();
    mainWindow = null;
  }
}
