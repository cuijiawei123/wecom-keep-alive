# 技术研究：macOS 托盘应用重构

**分支**: `001-tray-app-refactor` | **日期**: 2026-01-04

## 1. 鼠标控制库选型

### 决策
选用 **nut-js** 作为鼠标控制库

### 理由
- 纯 JavaScript 实现，无需编译原生模块
- 支持 macOS Apple Silicon 和 Intel
- 活跃维护，TypeScript 类型支持完善
- API 简洁：`mouse.move()`, `mouse.getPosition()`

### 备选方案
| 方案 | 优点 | 缺点 | 排除原因 |
|------|------|------|----------|
| robotjs | 成熟稳定 | 需要编译原生模块，Apple Silicon 支持不完善 | 编译复杂度高 |
| @jitsi/robotjs | robotjs 分支 | 同上 | 同上 |
| AppleScript | 系统原生 | 功能有限，异步调用复杂 | 不够灵活 |

---

## 2. Electron 托盘模式实现

### 决策
使用 Electron 内置 `Tray` API + `LSUIElement` 配置

### 实现要点
1. **隐藏 Dock 图标**: 在 `package.json` 或 `Info.plist` 中设置 `LSUIElement: true`
2. **托盘图标**: 使用 Template Image（文件名包含 `Template`），macOS 自动处理深浅色
3. **托盘菜单**: 使用 `Menu.buildFromTemplate()` 构建上下文菜单
4. **状态指示**: 通过切换托盘图标表示运行/停止状态

### 代码示例
```typescript
// 托盘图标自动适配深浅色
const tray = new Tray(path.join(__dirname, 'tray-iconTemplate.png'));

// 隐藏 Dock 图标
app.dock.hide();
```

---

## 3. macOS 辅助功能权限检测

### 决策
使用 Electron `systemPreferences.isTrustedAccessibilityClient()` API

### 实现要点
1. **检测权限**: `systemPreferences.isTrustedAccessibilityClient(false)` 仅检测不提示
2. **引导开启**: `systemPreferences.isTrustedAccessibilityClient(true)` 检测并弹出系统提示
3. **跳转设置**: 使用 `shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility')`

### 权限流程
```
启动 → 检测权限 → 有权限 → 正常运行
                → 无权限 → 显示引导弹窗 → 用户点击 → 打开系统设置
```

---

## 4. 配置持久化方案

### 决策
使用 **electron-store** 库

### 理由
- 专为 Electron 设计，API 简洁
- 自动处理文件路径（`userData` 目录）
- 支持 TypeScript 类型推断
- 支持加密存储（本项目不需要）

### 配置结构
```typescript
interface AppConfig {
  enabled: boolean;           // 保活开关
  workTimeStart: string;      // 工作开始时间 "09:00"
  workTimeEnd: string;        // 工作结束时间 "18:30"
  workdayOnly: boolean;       // 仅工作日
  lastModified: number;       // 最后修改时间戳
}
```

---

## 5. 随机间隔实现

### 决策
使用 `setTimeout` + 随机数生成

### 实现要点
1. **间隔范围**: 30-90 秒 (30000-90000 毫秒)
2. **随机算法**: `Math.floor(Math.random() * 60000) + 30000`
3. **事件驱动**: 每次移动后计算下一次间隔，避免固定轮询

### 伪代码
```typescript
function scheduleNextMove() {
  const delay = Math.floor(Math.random() * 60000) + 30000;
  setTimeout(() => {
    moveMouse();
    scheduleNextMove();
  }, delay);
}
```

---

## 6. 工作时段调度

### 决策
使用系统时间检查 + 定时器

### 实现要点
1. **时间检查**: 每次鼠标移动前检查当前时间是否在工作时段内
2. **工作日判断**: `new Date().getDay()` 返回 0-6，1-5 为工作日
3. **边界处理**: 跨天时段（如 22:00-06:00）需特殊处理（本项目不涉及）

### 判断逻辑
```typescript
function isWithinWorkTime(): boolean {
  const now = new Date();
  const day = now.getDay();
  
  // 工作日检查
  if (config.workdayOnly && (day === 0 || day === 6)) {
    return false;
  }
  
  // 时段检查
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const startTime = parseTime(config.workTimeStart);
  const endTime = parseTime(config.workTimeEnd);
  
  return currentTime >= startTime && currentTime <= endTime;
}
```

---

## 7. UI 框架选型

### 决策
使用原生 HTML/CSS + TypeScript，不引入重型框架

### 理由
- 界面简单（1 个主界面，3-4 个控件）
- 减少打包体积
- 符合 Constitution "Minimal Footprint" 原则
- Tailwind CSS 可选，用于快速样式开发

### 备选方案
| 方案 | 优点 | 缺点 | 排除原因 |
|------|------|------|----------|
| React | 生态丰富 | 增加打包体积 | 过度设计 |
| Vue | 轻量 | 仍需构建工具配置 | 不必要 |
| Svelte | 编译时框架 | 学习成本 | 不必要 |

---

## 8. 构建工具选型

### 决策
使用 **electron-builder**

### 理由
- 社区主流，文档完善
- 支持 DMG、PKG 等 macOS 格式
- 支持代码签名和公证
- 配置简单，开箱即用

### 配置要点
```json
{
  "mac": {
    "target": "dmg",
    "icon": "resources/icons/app-icon.icns",
    "category": "public.app-category.utilities"
  },
  "dmg": {
    "contents": [
      { "x": 130, "y": 220 },
      { "x": 410, "y": 220, "type": "link", "path": "/Applications" }
    ]
  }
}
```
