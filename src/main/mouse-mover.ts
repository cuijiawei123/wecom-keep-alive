/**
 * 鼠标移动服务
 * 使用平台抽象层实现跨平台保活功能
 */

import { MOVE_INTERVAL } from '../shared/types';
import { createMouseController, type MouseController } from './platform';

/**
 * 安全的日志输出函数
 * 防止在应用退出时 console.log 写入已关闭的管道导致 EIO 错误
 */
function safeLog(...args: unknown[]): void {
  try {
    console.log(...args);
  } catch {
    // 忽略写入错误（通常发生在应用退出时）
  }
}

function safeError(...args: unknown[]): void {
  try {
    console.error(...args);
  } catch {
    // 忽略写入错误
  }
}

/**
 * 鼠标移动服务类
 */
export class MouseMover {
  private isRunning: boolean = false;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private nextMoveAt: number = 0;
  private lastMoveAt: number | null = null;

  // 平台鼠标控制器
  private mouseController: MouseController;

  // 状态变化回调
  private onStateChange: ((state: MouseMoverState) => void) | null = null;

  constructor() {
    // 创建平台对应的鼠标控制器
    this.mouseController = createMouseController();
  }

  /**
   * 设置状态变化回调
   */
  setOnStateChange(callback: (state: MouseMoverState) => void): void {
    this.onStateChange = callback;
  }

  /**
   * 启动鼠标移动服务
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.scheduleNextMove();
    this.notifyStateChange();
    safeLog('[保活] 🟢 服务已启动');
  }

  /**
   * 停止鼠标移动服务
   */
  stop(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    this.nextMoveAt = 0;
    this.notifyStateChange();
    safeLog('[保活] 🔴 服务已停止');
  }

  /**
   * 获取当前状态
   */
  getState(): MouseMoverState {
    return {
      isRunning: this.isRunning,
      nextMoveAt: this.nextMoveAt,
      lastMoveAt: this.lastMoveAt,
      countdown: this.getCountdown(),
    };
  }

  /**
   * 获取倒计时秒数
   */
  getCountdown(): number {
    if (!this.isRunning || this.nextMoveAt === 0) return 0;
    const remaining = Math.max(0, this.nextMoveAt - Date.now());
    return Math.ceil(remaining / 1000);
  }

  /**
   * 计算随机间隔
   */
  private getRandomInterval(): number {
    const range = MOVE_INTERVAL.MAX - MOVE_INTERVAL.MIN;
    return Math.floor(Math.random() * range) + MOVE_INTERVAL.MIN;
  }

  /**
   * 调度下一次移动
   */
  private scheduleNextMove(): void {
    if (!this.isRunning) return;

    const delay = this.getRandomInterval();
    this.nextMoveAt = Date.now() + delay;

    this.timeoutId = setTimeout(() => {
      void this.performMove();
    }, delay);

    this.notifyStateChange();
  }

  /**
   * 执行鼠标移动
   */
  private async performMove(): Promise<void> {
    if (!this.isRunning) return;

    try {
      // 获取当前鼠标位置（使用平台抽象层）
      const currentPos = await this.mouseController.getPosition();
      safeLog(`[保活] 当前鼠标位置: (${currentPos.x}, ${currentPos.y})`);

      // 随机选择移动方向 (上下左右)
      const direction = Math.floor(Math.random() * 4);
      const directionName = ['上', '下', '左', '右'][direction];
      const offset = 1; // 移动 1 像素

      let newX = currentPos.x;
      let newY = currentPos.y;

      switch (direction) {
        case 0: // 上
          newY = currentPos.y - offset;
          break;
        case 1: // 下
          newY = currentPos.y + offset;
          break;
        case 2: // 左
          newX = currentPos.x - offset;
          break;
        case 3: // 右
        default:
          newX = currentPos.x + offset;
          break;
      }

      // 移动鼠标（使用平台抽象层）
      await this.mouseController.setPosition(newX, newY);

      // 移动回原位置（保持鼠标位置不变）
      await this.mouseController.setPosition(currentPos.x, currentPos.y);

      this.lastMoveAt = Date.now();
      safeLog(
        `[保活] ✅ 鼠标微移动完成 - 方向: ${directionName}, 时间: ${new Date().toLocaleTimeString()}`
      );
    } catch (error) {
      safeError('[保活] ❌ 鼠标移动失败:', error);
    }

    // 调度下一次移动
    this.scheduleNextMove();
  }

  /**
   * 通知状态变化
   */
  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }

  /**
   * 检查是否正在运行
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

/**
 * 鼠标移动服务状态
 */
export interface MouseMoverState {
  isRunning: boolean;
  nextMoveAt: number;
  lastMoveAt: number | null;
  countdown: number;
}

/**
 * 导出单例实例
 */
export const mouseMover = new MouseMover();
