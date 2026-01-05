# Quickstart: Windows 平台兼容支持

**Feature**: 002-windows-compat | **Date**: 2026-01-05

## 开发环境准备

### Windows 开发环境

```powershell
# 1. 确保 Node.js 20+ 已安装
node --version  # 应显示 v20.x.x 或更高

# 2. 确保 PowerShell 可用（Windows 10/11 默认已安装）
powershell -Command "Write-Output 'PowerShell OK'"

# 3. 克隆仓库并切换分支
git clone <repo-url>
cd wecom_keep_alive
git checkout 002-windows-compat

# 4. 安装依赖
npm install

# 5. 启动开发模式
npm run dev
```

### macOS 开发环境（交叉验证）

```bash
# 确保 Python 3 和 Quartz 可用
python3 -c "import Quartz; print('Quartz OK')"

# 启动开发模式
npm run dev
```

---

## 快速验证

### 验证鼠标控制（Windows）

```powershell
# 在 PowerShell 中测试鼠标位置获取
Add-Type -AssemblyName System.Windows.Forms
$pos = [System.Windows.Forms.Cursor]::Position
Write-Output "当前鼠标位置: X=$($pos.X), Y=$($pos.Y)"

# 测试鼠标位置设置
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(100, 100)
Write-Output "鼠标已移动到 (100, 100)"
```

### 验证鼠标控制（macOS）

```bash
# 测试鼠标位置获取
python3 -c "
import Quartz
loc = Quartz.NSEvent.mouseLocation()
screen = Quartz.NSScreen.mainScreen().frame()
print(f'当前鼠标位置: X={int(loc.x)}, Y={int(screen.size.height - loc.y)}')
"

# 测试鼠标位置设置
python3 -c "
import Quartz
event = Quartz.CGEventCreateMouseEvent(None, Quartz.kCGEventMouseMoved, (100, 100), Quartz.kCGMouseButtonLeft)
Quartz.CGEventPost(Quartz.kCGHIDEventTap, event)
print('鼠标已移动到 (100, 100)')
"
```

---

## 核心文件导航

| 文件 | 用途 | 修改内容 |
|------|------|----------|
| `src/main/platform/index.ts` | 平台工厂 | 【新建】根据平台返回实现 |
| `src/main/platform/types.ts` | 接口定义 | 【新建】MouseController 接口 |
| `src/main/platform/mouse-darwin.ts` | macOS 实现 | 【新建】从 mouse-mover.ts 提取 |
| `src/main/platform/mouse-win32.ts` | Windows 实现 | 【新建】PowerShell 方案 |
| `src/main/mouse-mover.ts` | 鼠标移动服务 | 【修改】使用平台抽象层 |
| `src/main/permission.ts` | 权限管理 | 【修改】Windows 直接返回 true |
| `src/main/index.ts` | 主进程入口 | 【修改】适配 Windows 窗口样式 |
| `src/main/tray.ts` | 托盘管理 | 【修改】Windows 图标路径 |
| `electron-builder.yml` | 打包配置 | 【修改】添加 Windows 配置 |

---

## 开发流程

### 1. 创建平台抽象层

```typescript
// src/main/platform/types.ts
export interface MouseController {
  getPosition(): Promise<{ x: number; y: number }>;
  setPosition(x: number, y: number): Promise<void>;
}

// src/main/platform/index.ts
import { DarwinMouseController } from './mouse-darwin';
import { Win32MouseController } from './mouse-win32';

export function createMouseController(): MouseController {
  switch (process.platform) {
    case 'darwin':
      return new DarwinMouseController();
    case 'win32':
      return new Win32MouseController();
    default:
      throw new Error(`Unsupported platform: ${process.platform}`);
  }
}
```

### 2. 实现 Windows 鼠标控制

```typescript
// src/main/platform/mouse-win32.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import type { MouseController } from './types';

const execAsync = promisify(exec);

export class Win32MouseController implements MouseController {
  async getPosition(): Promise<{ x: number; y: number }> {
    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      $pos = [System.Windows.Forms.Cursor]::Position
      Write-Output "$($pos.X),$($pos.Y)"
    `;
    try {
      const { stdout } = await execAsync(`powershell -Command "${script}"`);
      const [x, y] = stdout.trim().split(',').map(Number);
      return { x: x ?? 500, y: y ?? 500 };
    } catch {
      return { x: 500, y: 500 };
    }
  }

  async setPosition(x: number, y: number): Promise<void> {
    const script = `
      Add-Type -AssemblyName System.Windows.Forms
      [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(${x}, ${y})
    `;
    await execAsync(`powershell -Command "${script}"`);
  }
}
```

### 3. 修改 mouse-mover.ts 使用抽象层

```typescript
// src/main/mouse-mover.ts
import { createMouseController } from './platform';

const mouseController = createMouseController();

// 替换原有的 getMousePosition 和 setMousePosition 调用
const pos = await mouseController.getPosition();
await mouseController.setPosition(newX, newY);
```

---

## 构建与测试

### 本地构建

```bash
# 构建所有平台
npm run build

# 仅构建 Windows
npm run build -- --win

# 仅构建 macOS
npm run build -- --mac
```

### 运行测试

```bash
# 单元测试
npm test

# E2E 测试
npm run test:e2e
```

### 打包发布

```bash
# 打包 Windows 安装包
npm run package -- --win

# 打包 macOS DMG
npm run package -- --mac
```

---

## 常见问题

### Q: Windows 上 PowerShell 脚本执行失败？

A: 检查 PowerShell 执行策略：

```powershell
Get-ExecutionPolicy
# 如果是 Restricted，需要修改：
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Q: Windows 上鼠标移动无效？

A: 确认应用不是以管理员身份运行，普通用户权限即可。管理员模式可能导致某些安全软件拦截。

### Q: 如何在 macOS 上测试 Windows 代码？

A: 可以修改 `process.platform` 判断逻辑进行模拟测试，但完整测试需要在 Windows 环境进行。推荐使用 Windows 虚拟机或 CI/CD 环境。
