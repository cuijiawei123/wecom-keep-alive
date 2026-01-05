# Research: Windows 平台兼容支持

**Feature**: 002-windows-compat | **Date**: 2026-01-05

## 研究任务清单

1. Windows 鼠标控制 API 方案选择
2. Windows 权限模型差异
3. Windows 系统托盘实现
4. Windows 休眠/唤醒事件处理
5. electron-builder Windows 打包配置
6. 跨平台代码组织最佳实践

---

## 1. Windows 鼠标控制 API 方案

### 决策: 使用 PowerShell + .NET 方案

### 理由

1. **无需原生模块编译**: 避免 node-gyp 依赖和跨平台编译问题
2. **系统内置**: PowerShell 在 Windows 10/11 默认可用
3. **权限友好**: 无需管理员权限即可模拟鼠标输入
4. **实现简单**: 与现有 macOS Python 脚本方案架构一致

### 实现方案

```powershell
# 获取鼠标位置
Add-Type -AssemblyName System.Windows.Forms
$pos = [System.Windows.Forms.Cursor]::Position
Write-Output "$($pos.X),$($pos.Y)"

# 设置鼠标位置
Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point(X, Y)
```

### 备选方案（已排除）

| 方案 | 优点 | 缺点 | 排除原因 |
|------|------|------|----------|
| robotjs | 成熟库 | 需要 node-gyp 编译 | 编译复杂度高 |
| @nut-tree/nut-js | 现代 API | 依赖重 | 包体积大 |
| Windows API (FFI) | 原生性能 | 实现复杂 | 过度工程 |

---

## 2. Windows 权限模型差异

### 决策: Windows 默认允许鼠标模拟，无需权限请求流程

### 理由

1. **Windows 设计哲学**: 与 macOS 不同，Windows 默认允许应用程序模拟用户输入
2. **UAC 不影响**: 鼠标模拟不触发 UAC 提权，普通用户权限足够
3. **简化用户体验**: 无需引导用户授权

### 实现方案

```typescript
// permission.ts 修改
checkPermission(): boolean {
  if (process.platform === 'win32') {
    // Windows 默认有权限
    return true;
  }
  // macOS 逻辑保持不变
  return systemPreferences.isTrustedAccessibilityClient(false);
}
```

### 边缘情况处理

| 场景 | 行为 | 处理方式 |
|------|------|----------|
| UAC 提权窗口激活 | 鼠标模拟可能被阻止 | 忽略，等待窗口关闭后继续 |
| 锁屏状态 | 鼠标模拟无效 | 正常，锁屏本身阻止休眠 |
| 远程桌面会话 | 可能有限制 | 文档说明，非核心场景 |

---

## 3. Windows 系统托盘实现

### 决策: 使用 Electron Tray API，与 macOS 代码共享

### 理由

Electron 的 `Tray` API 已经跨平台抽象，Windows 和 macOS 使用相同代码即可。

### 差异点

| 特性 | macOS | Windows | 处理方式 |
|------|-------|---------|----------|
| 图标格式 | Template Image (.png) | ICO 或 PNG | 根据平台选择图标 |
| 点击行为 | 左键显示菜单 | 左键触发事件，右键菜单 | 统一为左键切换功能 |
| 图标位置 | 右上角菜单栏 | 右下角系统托盘 | 系统默认，无需处理 |

### 实现方案

```typescript
// tray.ts 修改
const iconPath = process.platform === 'win32'
  ? join(__dirname, '../../resources/icons/tray-idle.png')
  : join(__dirname, '../../resources/icons/tray-idleTemplate.png');
```

---

## 4. Windows 休眠/唤醒事件处理

### 决策: 使用 Electron `powerMonitor` API

### 理由

Electron 已提供跨平台的电源事件 API，无需平台特定代码。

### 实现方案

```typescript
import { powerMonitor } from 'electron';

// 已有 app.on('resume') 可继续使用
// 或使用更明确的 powerMonitor API
powerMonitor.on('resume', () => {
  // 系统唤醒后恢复保活
});

powerMonitor.on('suspend', () => {
  // 系统休眠前可选保存状态
});
```

### 测试场景

- Windows 睡眠 (S3)
- Windows 休眠 (S4)
- Windows 现代待机 (S0 低功耗空闲)

---

## 5. electron-builder Windows 打包配置

### 决策: 添加 NSIS 安装包 + 便携版

### 理由

1. **NSIS 安装包**: Windows 用户熟悉的安装体验
2. **便携版**: 免安装，适合企业环境限制

### 配置方案

```yaml
# electron-builder.yml 新增
win:
  target:
    - target: nsis
      arch:
        - x64
    - target: portable
      arch:
        - x64
  icon: resources/icons/app-icon.ico

nsis:
  oneClick: true
  perMachine: false
  allowToChangeInstallationDirectory: false
  createDesktopShortcut: true
  createStartMenuShortcut: true
```

### 图标准备

需要创建 `app-icon.ico` 文件，包含以下尺寸：
- 16x16, 32x32, 48x48, 64x64, 128x128, 256x256

---

## 6. 跨平台代码组织最佳实践

### 决策: 平台抽象层 + 策略模式

### 理由

1. **单一职责**: 每个平台实现独立文件
2. **开闭原则**: 新增平台无需修改现有代码
3. **测试友好**: 可独立测试每个平台实现

### 目录结构

```text
src/main/platform/
├── index.ts          # 工厂函数，根据 process.platform 返回实现
├── types.ts          # 接口定义
├── mouse-darwin.ts   # macOS 实现
└── mouse-win32.ts    # Windows 实现
```

### 接口定义

```typescript
// platform/types.ts
export interface MouseController {
  getPosition(): Promise<{ x: number; y: number }>;
  setPosition(x: number, y: number): Promise<void>;
}

// platform/index.ts
export function createMouseController(): MouseController {
  if (process.platform === 'darwin') {
    return new DarwinMouseController();
  } else if (process.platform === 'win32') {
    return new Win32MouseController();
  }
  throw new Error(`Unsupported platform: ${process.platform}`);
}
```

---

## 总结

| 研究项 | 决策 | 风险等级 |
|--------|------|----------|
| 鼠标控制 | PowerShell + .NET | 低 |
| 权限模型 | 无需权限请求 | 低 |
| 系统托盘 | Electron Tray API | 低 |
| 休眠/唤醒 | powerMonitor API | 低 |
| 打包配置 | NSIS + Portable | 低 |
| 代码组织 | 平台抽象层 | 低 |

所有 NEEDS CLARIFICATION 已解决，可进入 Phase 1 设计阶段。
