/**
 * 权限检测模块
 * 检测和请求 macOS 辅助功能权限
 * Windows 平台无需权限检测
 */

import { systemPreferences, dialog, shell } from 'electron';

/**
 * 辅助功能权限设置 URL (macOS)
 */
const ACCESSIBILITY_SETTINGS_URL =
  'x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility';

/**
 * 权限管理器类
 */
export class PermissionManager {
  private hasPermission: boolean = false;
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private onPermissionChange: ((hasPermission: boolean) => void) | null = null;

  /**
   * 设置权限变化回调
   */
  setOnPermissionChange(callback: (hasPermission: boolean) => void): void {
    this.onPermissionChange = callback;
  }

  /**
   * 检查辅助功能权限（不弹出系统提示）
   * Windows 平台默认有权限，无需检测
   */
  checkPermission(): boolean {
    // Windows 平台默认允许鼠标模拟，无需权限
    if (process.platform === 'win32') {
      this.hasPermission = true;
      return true;
    }

    // 非 macOS 和非 Windows 系统，假定有权限
    if (process.platform !== 'darwin') {
      this.hasPermission = true;
      return true;
    }

    // macOS 需要检查辅助功能权限
    this.hasPermission = systemPreferences.isTrustedAccessibilityClient(false);
    return this.hasPermission;
  }

  /**
   * 请求辅助功能权限（弹出系统提示）
   * Windows 平台直接返回 true
   */
  requestPermission(): boolean {
    // Windows 平台无需请求权限
    if (process.platform === 'win32') {
      this.hasPermission = true;
      return true;
    }

    if (process.platform !== 'darwin') {
      this.hasPermission = true;
      return true;
    }

    // macOS: 传入 true 会弹出系统权限请求对话框
    this.hasPermission = systemPreferences.isTrustedAccessibilityClient(true);
    return this.hasPermission;
  }

  /**
   * 显示权限引导弹窗
   * 仅 macOS 需要显示
   */
  async showPermissionDialog(): Promise<boolean> {
    // Windows 平台无需权限引导
    if (process.platform === 'win32') {
      return true;
    }

    if (process.platform !== 'darwin') {
      return true;
    }

    const result = await dialog.showMessageBox({
      type: 'warning',
      title: '需要辅助功能权限',
      message: 'WeComKeepAlive 需要辅助功能权限才能控制鼠标',
      detail:
        '请在系统设置中为本应用开启辅助功能权限。\n\n' +
        '路径：系统设置 → 隐私与安全性 → 辅助功能',
      buttons: ['打开系统设置', '稍后再说'],
      defaultId: 0,
      cancelId: 1,
    });

    if (result.response === 0) {
      await this.openAccessibilitySettings();
      return true;
    }

    return false;
  }

  /**
   * 打开系统辅助功能设置
   * 仅 macOS 支持
   */
  async openAccessibilitySettings(): Promise<void> {
    if (process.platform !== 'darwin') {
      return;
    }
    await shell.openExternal(ACCESSIBILITY_SETTINGS_URL);
  }

  /**
   * 开始监听权限变化
   * Windows 平台无需监听
   */
  startWatching(): void {
    // Windows 平台无需监听权限变化
    if (process.platform === 'win32') {
      return;
    }

    if (this.checkInterval) return;

    // 每 2 秒检查一次权限状态（仅 macOS）
    this.checkInterval = setInterval(() => {
      const currentPermission = this.checkPermission();
      if (currentPermission !== this.hasPermission) {
        this.hasPermission = currentPermission;
        this.onPermissionChange?.(currentPermission);
      }
    }, 2000);
  }

  /**
   * 停止监听权限变化
   */
  stopWatching(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * 获取当前权限状态
   */
  getPermissionStatus(): boolean {
    return this.hasPermission;
  }

  /**
   * 初始化权限检测
   * 返回是否有权限
   */
  async init(): Promise<boolean> {
    const hasPermission = this.checkPermission();

    // Windows 平台直接返回 true，无需引导
    if (process.platform === 'win32') {
      return true;
    }

    if (!hasPermission && process.platform === 'darwin') {
      // macOS: 显示引导弹窗
      await this.showPermissionDialog();
      // 开始监听权限变化
      this.startWatching();
    }

    return hasPermission;
  }
}

/**
 * 导出单例实例
 */
export const permissionManager = new PermissionManager();
