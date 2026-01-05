/**
 * Windows 平台鼠标控制器实现
 * 使用 PowerShell + System.Windows.Forms 实现鼠标位置获取和设置
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import type { MouseController, MousePosition } from './types';
import { DEFAULT_MOUSE_POSITION } from './types';

const execAsync = promisify(exec);

/**
 * Windows 鼠标控制器
 * 使用 PowerShell + System.Windows.Forms 实现
 */
export class Win32MouseController implements MouseController {
  /**
   * 获取当前鼠标位置
   * 使用 PowerShell 执行 System.Windows.Forms.Cursor.Position
   */
  async getPosition(): Promise<MousePosition> {
    // PowerShell 脚本：加载 Windows Forms 程序集并获取鼠标位置
    const script = `
Add-Type -AssemblyName System.Windows.Forms
$pos = [System.Windows.Forms.Cursor]::Position
Write-Output "$($pos.X),$($pos.Y)"
`.trim();

    try {
      const { stdout } = await execAsync(`powershell -NoProfile -Command "${script}"`, {
        windowsHide: true,
      });
      const parts = stdout.trim().split(',').map(Number);
      const x = parts[0] ?? DEFAULT_MOUSE_POSITION.x;
      const y = parts[1] ?? DEFAULT_MOUSE_POSITION.y;
      return { x, y };
    } catch (error) {
      console.error('[Windows] Failed to get mouse position:', error);
      return { ...DEFAULT_MOUSE_POSITION };
    }
  }

  /**
   * 设置鼠标位置
   * 使用 PowerShell 执行 System.Windows.Forms.Cursor.Position 设置
   */
  async setPosition(x: number, y: number): Promise<void> {
    // PowerShell 脚本：加载 Windows Forms 程序集并设置鼠标位置
    const script = `
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${Math.round(x)}, ${Math.round(y)})
`.trim();

    try {
      await execAsync(`powershell -NoProfile -Command "${script}"`, {
        windowsHide: true,
      });
    } catch (error) {
      console.error('[Windows] Failed to set mouse position:', error);
      // Windows 上没有备用方案，但鼠标模拟通常不会失败
    }
  }
}
