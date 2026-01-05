/**
 * macOS 平台鼠标控制器实现
 * 使用 Python + Quartz 框架实现鼠标位置获取和设置
 */

import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import type { MouseController, MousePosition } from './types';
import { DEFAULT_MOUSE_POSITION } from './types';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

/**
 * macOS 鼠标控制器
 * 使用 Python + Quartz 框架实现
 */
export class DarwinMouseController implements MouseController {
  /**
   * 获取当前鼠标位置
   * 使用 Python + Quartz 获取，处理坐标系转换（Quartz 原点在左下角）
   */
  async getPosition(): Promise<MousePosition> {
    const pythonScript = `
import Quartz
loc = Quartz.NSEvent.mouseLocation()
screen = Quartz.NSScreen.mainScreen().frame()
print(f"{int(loc.x)},{int(screen.size.height - loc.y)}")
`;
    try {
      const { stdout } = await execAsync(`python3 -c '${pythonScript}'`);
      const parts = stdout.trim().split(',').map(Number);
      const x = parts[0] ?? DEFAULT_MOUSE_POSITION.x;
      const y = parts[1] ?? DEFAULT_MOUSE_POSITION.y;
      return { x, y };
    } catch (error) {
      console.error('[macOS] 获取鼠标位置失败:', error);
      return { ...DEFAULT_MOUSE_POSITION };
    }
  }

  /**
   * 设置鼠标位置
   * 使用 CGEventCreateMouseEvent 移动鼠标
   * 失败时尝试 AppleScript 备用方案
   */
  async setPosition(x: number, y: number): Promise<void> {
    const pythonScript = `
import Quartz
event = Quartz.CGEventCreateMouseEvent(None, Quartz.kCGEventMouseMoved, (${x}, ${y}), Quartz.kCGMouseButtonLeft)
Quartz.CGEventPost(Quartz.kCGHIDEventTap, event)
`;
    try {
      await execAsync(`python3 -c '${pythonScript}'`);
    } catch (error) {
      console.error('[macOS] Python 鼠标移动失败:', error);
      // 备用方案：使用 AppleScript 模拟 Shift 键按下释放（无副作用）
      await this.simulateKeyPress();
    }
  }

  /**
   * 备用方案：模拟按键（Shift 键，无副作用）
   * 当鼠标移动失败时，通过按键模拟保持系统活跃
   */
  private async simulateKeyPress(): Promise<void> {
    const script = `
tell application "System Events"
  key down shift
  key up shift
end tell
`;
    try {
      await execFileAsync('osascript', ['-e', script]);
    } catch (error) {
      console.error('[macOS] AppleScript 按键模拟失败:', error);
    }
  }
}
