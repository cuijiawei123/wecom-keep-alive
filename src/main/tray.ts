/**
 * 托盘管理模块
 * 负责系统托盘图标和菜单的创建与管理
 * 支持 macOS 和 Windows 平台
 */

import { Tray, Menu, nativeImage, app } from 'electron';
import { join } from 'path';
import { TrayIconState } from '../shared/types';
import { showMainWindow } from './index';

let tray: Tray | null = null;
let currentIconState: TrayIconState = 'idle';

// 图标路径
const ICONS_DIR = join(__dirname, '../../resources/icons');

/**
 * 获取托盘图标路径
 * macOS 使用 Template Image，Windows 使用普通 PNG
 */
function getIconPath(state: TrayIconState): string {
  const isWindows = process.platform === 'win32';

  if (isWindows) {
    // Windows: 使用普通 PNG 图标
    const iconName = state === 'active' ? 'tray-icon-activeTemplate.png' : 'tray-iconTemplate.png';
    return join(ICONS_DIR, iconName);
  } else {
    // macOS: 使用 Template Image（系统自动处理深浅色）
    const iconName = state === 'active' ? 'tray-icon-activeTemplate.png' : 'tray-iconTemplate.png';
    return join(ICONS_DIR, iconName);
  }
}

/**
 * 创建托盘图标
 */
function createTrayIcon(state: TrayIconState): Electron.NativeImage {
  const iconPath = getIconPath(state);
  const icon = nativeImage.createFromPath(iconPath);

  // macOS: 设置为 Template Image，系统会自动处理深浅色模式
  // Windows: 不设置 Template，使用原始图标颜色
  if (process.platform === 'darwin') {
    icon.setTemplateImage(true);
  }

  return icon;
}

/**
 * 构建托盘菜单
 * 根据平台调整快捷键显示
 */
function buildContextMenu(
  isActive: boolean,
  onToggle: () => void,
  onShowWindow: () => void,
  onQuit: () => void
): Menu {
  // 根据平台设置退出快捷键
  const quitAccelerator = process.platform === 'darwin' ? 'Command+Q' : 'Alt+F4';

  return Menu.buildFromTemplate([
    {
      label: isActive ? '停止保活' : '开始保活',
      click: onToggle,
    },
    { type: 'separator' },
    {
      label: '打开主界面',
      click: onShowWindow,
    },
    { type: 'separator' },
    {
      label: '退出',
      accelerator: quitAccelerator,
      click: onQuit,
    },
  ]);
}

/**
 * 托盘管理器类
 */
export class TrayManager {
  private isActive: boolean = false;
  private onToggleCallback: (() => void) | null = null;

  /**
   * 初始化托盘
   */
  init(onToggle: () => void): void {
    this.onToggleCallback = onToggle;

    // 创建托盘图标
    const icon = createTrayIcon('idle');
    tray = new Tray(icon);

    // 设置托盘提示文字
    tray.setToolTip('WeComKeepAlive - 点击打开菜单');

    // 更新菜单
    this.updateMenu();

    // 点击托盘图标时的行为
    // macOS: 显示菜单
    // Windows: 左键切换功能，右键显示菜单
    if (process.platform === 'win32') {
      // Windows: 左键点击切换保活状态
      tray.on('click', () => {
        this.onToggleCallback?.();
      });
      // Windows: 右键显示菜单（Electron 默认行为）
    } else {
      // macOS: 点击显示菜单
      tray.on('click', () => {
        tray?.popUpContextMenu();
      });
    }
  }

  /**
   * 更新托盘菜单
   */
  updateMenu(): void {
    if (!tray) return;

    const menu = buildContextMenu(
      this.isActive,
      () => this.onToggleCallback?.(),
      () => showMainWindow(),
      () => app.exit(0)
    );

    tray.setContextMenu(menu);
  }

  /**
   * 设置活动状态
   */
  setActive(active: boolean): void {
    this.isActive = active;
    this.updateIcon(active ? 'active' : 'idle');
    this.updateMenu();
  }

  /**
   * 更新托盘图标
   */
  updateIcon(state: TrayIconState): void {
    if (!tray || currentIconState === state) return;

    currentIconState = state;
    const icon = createTrayIcon(state);
    tray.setImage(icon);
  }

  /**
   * 获取当前图标状态
   */
  getIconState(): TrayIconState {
    return currentIconState;
  }

  /**
   * 销毁托盘
   */
  destroy(): void {
    if (tray) {
      tray.destroy();
      tray = null;
    }
  }
}

/**
 * 导出单例实例
 */
export const trayManager = new TrayManager();
