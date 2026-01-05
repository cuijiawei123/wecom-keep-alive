/**
 * 平台抽象层入口
 * 提供跨平台鼠标控制的工厂函数
 */

import type { MouseController, PlatformInfo, Platform } from './types';
import { DarwinMouseController } from './mouse-darwin';
import { Win32MouseController } from './mouse-win32';

/**
 * 创建平台对应的鼠标控制器
 * @returns MouseController 平台特定实现
 * @throws Error 不支持的平台
 */
export function createMouseController(): MouseController {
  const platform = process.platform as Platform;

  switch (platform) {
    case 'darwin':
      return new DarwinMouseController();
    case 'win32':
      return new Win32MouseController();
    default:
      throw new Error(`不支持的平台: ${process.platform}`);
  }
}

/**
 * 获取当前平台信息
 * @returns PlatformInfo 平台信息
 */
export function getPlatformInfo(): PlatformInfo {
  const platform = process.platform as Platform;

  switch (platform) {
    case 'darwin':
      return {
        platform: 'darwin',
        needsPermission: true,
        permissionName: '辅助功能',
      };
    case 'win32':
      return {
        platform: 'win32',
        needsPermission: false,
        permissionName: '',
      };
    default:
      // 默认返回 Windows 配置（无需权限）
      return {
        platform: 'win32',
        needsPermission: false,
        permissionName: '',
      };
  }
}

// 导出类型
export type { MouseController, MousePosition, PlatformInfo, Platform } from './types';
