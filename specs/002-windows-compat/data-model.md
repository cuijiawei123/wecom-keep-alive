# Data Model: Windows 平台兼容支持

**Feature**: 002-windows-compat | **Date**: 2026-01-05

## 概述

本功能不涉及新的数据实体或持久化存储变更。现有数据模型（`AppConfig`、`RuntimeState`）完全适用于 Windows 平台。本文档聚焦于新增的平台抽象层接口定义。

---

## 现有数据模型（无变更）

### AppConfig（配置存储）

```typescript
// src/shared/types.ts - 无需修改
interface AppConfig {
  enabled: boolean;           // 是否启用保活
  duration: number;           // 保活时长（分钟），0 表示永久
  launchAtLogin: boolean;     // 开机自启动
}
```

### RuntimeState（运行时状态）

```typescript
// src/shared/types.ts - 无需修改
interface RuntimeState {
  isActive: boolean;          // 保活是否运行中
  hasPermission: boolean;     // 是否有权限（Windows 恒为 true）
  endAt: number;              // 结束时间戳，0 表示永久
  remainingTime: number;      // 剩余秒数
  nextMoveAt: number;         // 下次移动时间戳
  countdown: number;          // 下次移动倒计时秒数
  lastMoveAt: number | null;  // 上次移动时间戳
}
```

---

## 新增接口定义

### MouseController 接口

平台抽象层核心接口，定义鼠标控制能力。

```typescript
// src/main/platform/types.ts

/**
 * 鼠标位置
 */
export interface MousePosition {
  x: number;
  y: number;
}

/**
 * 鼠标控制器接口
 * 平台实现需实现此接口
 */
export interface MouseController {
  /**
   * 获取当前鼠标位置
   * @returns 鼠标坐标 {x, y}
   */
  getPosition(): Promise<MousePosition>;

  /**
   * 设置鼠标位置
   * @param x X 坐标
   * @param y Y 坐标
   */
  setPosition(x: number, y: number): Promise<void>;

  /**
   * 执行保活动作（可选覆盖）
   * 默认实现：获取位置 → 微移动 → 恢复位置
   */
  performKeepAlive?(): Promise<void>;
}

/**
 * 平台类型
 */
export type Platform = 'darwin' | 'win32' | 'linux';

/**
 * 平台信息
 */
export interface PlatformInfo {
  platform: Platform;
  needsPermission: boolean;
  permissionName: string;
}
```

### PermissionChecker 接口

权限检查抽象（可选，当前实现直接在 permission.ts 中处理）。

```typescript
// src/main/platform/types.ts

/**
 * 权限检查器接口
 */
export interface PermissionChecker {
  /**
   * 检查是否有权限
   */
  check(): boolean;

  /**
   * 请求权限
   */
  request(): Promise<boolean>;

  /**
   * 是否需要权限引导
   */
  needsGuidance(): boolean;
}
```

---

## 平台实现映射

| 接口 | macOS 实现 | Windows 实现 |
|------|------------|--------------|
| `MouseController` | `DarwinMouseController` | `Win32MouseController` |
| `PermissionChecker` | `DarwinPermissionChecker` | `Win32PermissionChecker`（空实现） |

---

## 状态转换图

保活功能状态机（跨平台一致）：

```
                    ┌─────────────┐
                    │   Idle      │
                    │ (未启动)    │
                    └──────┬──────┘
                           │ start()
                           ▼
    ┌──────────────────────────────────────────┐
    │                 Active                    │
    │              (保活运行中)                 │
    │                                          │
    │  ┌─────────┐    timeout    ┌─────────┐  │
    │  │ Waiting │──────────────▶│ Moving  │  │
    │  │(等待中) │◀──────────────│(移动中) │  │
    │  └─────────┘   complete    └─────────┘  │
    │                                          │
    └──────────────────┬───────────────────────┘
                       │ stop() / duration expired
                       ▼
                ┌─────────────┐
                │   Idle      │
                └─────────────┘
```

---

## 验证规则

| 字段 | 规则 | 错误处理 |
|------|------|----------|
| `duration` | 0 或 30/60/120/240/480 | 使用默认值 60 |
| `MousePosition.x` | >= 0 | 使用 500 |
| `MousePosition.y` | >= 0 | 使用 500 |

---

## 存储位置

| 平台 | 配置文件路径 |
|------|--------------|
| macOS | `~/Library/Application Support/WeComKeepAlive/config.json` |
| Windows | `%APPDATA%/WeComKeepAlive/config.json` |

由 `electron-store` 自动管理，无需手动处理路径差异。
