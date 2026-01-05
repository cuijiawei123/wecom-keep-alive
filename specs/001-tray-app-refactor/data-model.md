# 数据模型：macOS 托盘应用重构

**分支**: `001-tray-app-refactor` | **日期**: 2026-01-04

## 实体定义

### 1. AppConfig（应用配置）

用户可配置的应用设置，持久化存储在本地。

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| enabled | boolean | 是 | false | 保活功能开关 |
| workTimeStart | string | 是 | "09:00" | 工作开始时间 (HH:mm) |
| workTimeEnd | string | 是 | "18:30" | 工作结束时间 (HH:mm) |
| workdayOnly | boolean | 是 | false | 仅工作日生效 |
| lastModified | number | 是 | Date.now() | 最后修改时间戳 |

**验证规则**:
- `workTimeStart` 和 `workTimeEnd` 必须为有效的 HH:mm 格式
- `workTimeStart` 必须早于 `workTimeEnd`（不支持跨天）
- 时间范围: 00:00 - 23:59

**存储位置**: `~/Library/Application Support/wecom-keep-alive/config.json`

---

### 2. RuntimeState（运行时状态）

应用运行时的内存状态，不持久化。

| 字段 | 类型 | 说明 |
|------|------|------|
| isActive | boolean | 当前是否正在执行保活 |
| nextMoveAt | number | 下次鼠标移动的时间戳 |
| countdown | number | 距离下次移动的秒数 |
| hasPermission | boolean | 是否已获得辅助功能权限 |
| lastMoveAt | number \| null | 上次鼠标移动的时间戳 |

**状态转换**:

```
[初始化] → hasPermission=false
    ↓ (权限检测通过)
[待机] → isActive=false, hasPermission=true
    ↓ (用户启用 / 进入工作时段)
[运行中] → isActive=true, countdown 倒计时
    ↓ (用户禁用 / 离开工作时段)
[待机]
```

---

### 3. TrayState（托盘状态）

托盘图标和菜单的状态。

| 字段 | 类型 | 说明 |
|------|------|------|
| icon | 'idle' \| 'active' | 当前图标状态 |
| menuItems | MenuItem[] | 菜单项列表 |

**菜单项结构**:

| 菜单项 | 类型 | 快捷键 | 说明 |
|--------|------|--------|------|
| 开始/停止 | toggle | - | 根据 isActive 显示不同文本 |
| 打开主界面 | click | - | 显示配置窗口 |
| 分隔线 | separator | - | - |
| 退出 | click | ⌘Q | 退出应用 |

---

## 实体关系

```
┌─────────────────┐
│   AppConfig     │ ←── 持久化存储 (electron-store)
│   (用户配置)     │
└────────┬────────┘
         │ 读取/写入
         ▼
┌─────────────────┐
│  RuntimeState   │ ←── 内存状态
│   (运行状态)     │
└────────┬────────┘
         │ 驱动
         ▼
┌─────────────────┐
│   TrayState     │ ←── UI 状态
│   (托盘状态)     │
└─────────────────┘
```

---

## TypeScript 类型定义

```typescript
// src/shared/types.ts

/**
 * 应用配置 - 持久化存储
 */
export interface AppConfig {
  /** 保活功能开关 */
  enabled: boolean;
  /** 工作开始时间 (HH:mm) */
  workTimeStart: string;
  /** 工作结束时间 (HH:mm) */
  workTimeEnd: string;
  /** 仅工作日生效 */
  workdayOnly: boolean;
  /** 最后修改时间戳 */
  lastModified: number;
}

/**
 * 运行时状态 - 内存存储
 */
export interface RuntimeState {
  /** 当前是否正在执行保活 */
  isActive: boolean;
  /** 下次鼠标移动的时间戳 */
  nextMoveAt: number;
  /** 距离下次移动的秒数 */
  countdown: number;
  /** 是否已获得辅助功能权限 */
  hasPermission: boolean;
  /** 上次鼠标移动的时间戳 */
  lastMoveAt: number | null;
}

/**
 * 托盘图标状态
 */
export type TrayIconState = 'idle' | 'active';

/**
 * 默认配置
 */
export const DEFAULT_CONFIG: AppConfig = {
  enabled: false,
  workTimeStart: '09:00',
  workTimeEnd: '18:30',
  workdayOnly: false,
  lastModified: Date.now(),
};

/**
 * 鼠标移动间隔范围 (毫秒)
 */
export const MOVE_INTERVAL = {
  MIN: 30000,  // 30 秒
  MAX: 90000,  // 90 秒
} as const;
```
