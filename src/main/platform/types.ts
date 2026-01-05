/**
 * 平台抽象层类型定义
 * 定义跨平台鼠标控制的接口契约
 */

/**
 * 鼠标位置
 */
export interface MousePosition {
  /** X 坐标（像素） */
  x: number;
  /** Y 坐标（像素） */
  y: number;
}

/**
 * 支持的平台类型
 */
export type Platform = 'darwin' | 'win32';

/**
 * 平台信息
 */
export interface PlatformInfo {
  /** 当前平台 */
  platform: Platform;
  /** 是否需要权限授权 */
  needsPermission: boolean;
  /** 权限名称（用于 UI 显示） */
  permissionName: string;
}

/**
 * 鼠标控制器接口
 * 各平台需实现此接口以提供鼠标位置获取和设置能力
 */
export interface MouseController {
  /**
   * 获取当前鼠标位置
   * @returns Promise<MousePosition> 当前鼠标坐标
   */
  getPosition(): Promise<MousePosition>;

  /**
   * 设置鼠标位置
   * @param x - 目标 X 坐标
   * @param y - 目标 Y 坐标
   */
  setPosition(x: number, y: number): Promise<void>;
}

/**
 * 默认鼠标位置（获取失败时使用）
 */
export const DEFAULT_MOUSE_POSITION: MousePosition = {
  x: 500,
  y: 500,
};
