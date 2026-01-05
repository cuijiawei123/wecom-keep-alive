/**
 * 平台抽象层 API 契约
 * Feature: 002-windows-compat
 * Date: 2026-01-05
 *
 * 本文件定义跨平台鼠标控制的接口契约。
 * 实现文件位于 src/main/platform/
 */

// ============================================================================
// 类型定义
// ============================================================================

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

// ============================================================================
// 鼠标控制器接口
// ============================================================================

/**
 * 鼠标控制器接口
 *
 * 各平台需实现此接口以提供鼠标位置获取和设置能力。
 *
 * @example
 * ```typescript
 * const controller = createMouseController();
 * const pos = await controller.getPosition();
 * await controller.setPosition(pos.x + 1, pos.y);
 * ```
 */
export interface MouseController {
  /**
   * 获取当前鼠标位置
   *
   * @returns Promise<MousePosition> 当前鼠标坐标
   * @throws Error 获取失败时抛出异常
   *
   * @remarks
   * - macOS: 使用 Python + Quartz 获取
   * - Windows: 使用 PowerShell + System.Windows.Forms 获取
   */
  getPosition(): Promise<MousePosition>;

  /**
   * 设置鼠标位置
   *
   * @param x - 目标 X 坐标
   * @param y - 目标 Y 坐标
   * @throws Error 设置失败时抛出异常
   *
   * @remarks
   * - macOS: 使用 Python + Quartz CGEventCreateMouseEvent
   * - Windows: 使用 PowerShell + System.Windows.Forms.Cursor
   */
  setPosition(x: number, y: number): Promise<void>;
}

// ============================================================================
// 工厂函数签名
// ============================================================================

/**
 * 创建平台对应的鼠标控制器
 *
 * @returns MouseController 平台特定实现
 * @throws Error 不支持的平台
 *
 * @example
 * ```typescript
 * import { createMouseController } from './platform';
 *
 * const controller = createMouseController();
 * ```
 */
export type CreateMouseController = () => MouseController;

/**
 * 获取当前平台信息
 *
 * @returns PlatformInfo 平台信息
 *
 * @example
 * ```typescript
 * import { getPlatformInfo } from './platform';
 *
 * const info = getPlatformInfo();
 * if (info.needsPermission) {
 *   // 显示权限引导
 * }
 * ```
 */
export type GetPlatformInfo = () => PlatformInfo;

// ============================================================================
// 平台实现要求
// ============================================================================

/**
 * macOS 实现要求 (mouse-darwin.ts)
 *
 * 1. getPosition():
 *    - 使用 python3 执行 Quartz 脚本
 *    - 处理坐标系转换（Quartz 原点在左下角）
 *    - 失败时返回默认值 {x: 500, y: 500}
 *
 * 2. setPosition():
 *    - 使用 CGEventCreateMouseEvent
 *    - 事件类型: kCGEventMouseMoved
 *    - 失败时尝试 AppleScript 备用方案
 */

/**
 * Windows 实现要求 (mouse-win32.ts)
 *
 * 1. getPosition():
 *    - 使用 PowerShell 执行
 *    - 加载 System.Windows.Forms 程序集
 *    - 读取 [System.Windows.Forms.Cursor]::Position
 *    - 失败时返回默认值 {x: 500, y: 500}
 *
 * 2. setPosition():
 *    - 使用 PowerShell 执行
 *    - 设置 [System.Windows.Forms.Cursor]::Position
 *    - 使用 System.Drawing.Point 构造坐标
 */

// ============================================================================
// 错误处理约定
// ============================================================================

/**
 * 平台操作错误
 */
export class PlatformError extends Error {
  constructor(
    message: string,
    public readonly platform: Platform,
    public readonly operation: 'getPosition' | 'setPosition',
    public readonly cause?: Error
  ) {
    super(`[${platform}] ${operation} failed: ${message}`);
    this.name = 'PlatformError';
  }
}
