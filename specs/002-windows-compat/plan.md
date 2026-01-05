# Implementation Plan: Windows 平台兼容支持

**Branch**: `002-windows-compat` | **Date**: 2026-01-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-windows-compat/spec.md`

## Summary

实现 WeComKeepAlive 应用在 Windows 平台的兼容支持。核心需求是将现有 macOS 专用的鼠标控制实现（Python + Quartz）替换为跨平台方案，同时适配 Windows 系统托盘、权限模型和休眠/唤醒事件。技术方案采用平台抽象层 + 条件编译模式，Windows 端使用 PowerShell 脚本或 Node.js 原生模块实现鼠标控制。

## Technical Context

**Language/Version**: TypeScript 5.3, Node.js 20+  
**Primary Dependencies**: Electron 28, electron-vite 2.0, electron-builder 24  
**Storage**: electron-store (本地 JSON 文件)  
**Testing**: Vitest (Unit) + Playwright (E2E)  
**Target Platform**: Windows 10/11, macOS (Intel + Apple Silicon)  
**Project Type**: Single Electron 桌面应用 (main + renderer + preload)  
**Performance Goals**: 内存 < 100MB，CPU 空闲时接近 0%  
**Constraints**: 无需管理员权限，普通用户权限运行  
**Scale/Scope**: 单用户桌面工具，无并发需求

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原则 | 状态 | 说明 |
|------|------|------|
| I. Single-Process Desktop App | ✅ 通过 | 保持 Electron 单进程架构，无后端服务 |
| II. macOS Tray-First Design | ⚠️ 需扩展 | 需扩展为跨平台托盘设计，Windows 使用系统托盘 |
| III. Minimal Footprint | ✅ 通过 | Windows 实现同样遵循最小资源占用原则 |
| IV. User Experience Simplicity | ✅ 通过 | Windows 版本保持与 macOS 一致的简洁体验 |
| V. Chinese Documentation | ✅ 通过 | 所有文档使用中文 |

**Constitution 兼容性**: 原则 II 需要从 "macOS Tray-First" 理解为 "Tray-First Design"，Windows 系统托盘与 macOS 菜单栏功能等价。无违规。

## Project Structure

### Documentation (this feature)

```text
specs/002-windows-compat/
├── plan.md              # 本文件
├── research.md          # Phase 0 研究输出
├── data-model.md        # Phase 1 数据模型
├── quickstart.md        # Phase 1 快速开始指南
├── contracts/           # Phase 1 接口契约
└── tasks.md             # Phase 2 任务清单
```

### Source Code (repository root)

```text
src/
├── main/
│   ├── index.ts              # 主进程入口（需适配平台判断）
│   ├── mouse-mover.ts        # 鼠标移动服务（需重构为平台抽象）
│   ├── permission.ts         # 权限管理（需适配 Windows）
│   ├── store.ts              # 配置存储（无需修改）
│   ├── tray.ts               # 托盘管理（需适配 Windows）
│   ├── window.ts             # 窗口管理（需适配 Windows）
│   └── platform/             # 【新增】平台抽象层
│       ├── index.ts          # 平台检测与工厂
│       ├── mouse-darwin.ts   # macOS 鼠标实现
│       └── mouse-win32.ts    # Windows 鼠标实现
├── preload/
│   └── index.ts              # 预加载脚本（无需修改）
├── renderer/
│   ├── index.html            # 主页面（无需修改）
│   ├── main.ts               # 渲染进程入口（无需修改）
│   ├── components/           # UI 组件（无需修改）
│   └── styles/               # 样式（无需修改）
└── shared/
    ├── ipc-channels.ts       # IPC 通道定义（无需修改）
    └── types.ts              # 类型定义（无需修改）

resources/
├── icons/
│   ├── app-icon.icns         # macOS 图标（已有）
│   ├── app-icon.ico          # 【新增】Windows 图标
│   ├── tray-active.png       # 托盘激活图标
│   └── tray-idle.png         # 托盘空闲图标
```

**Structure Decision**: 保持现有单项目结构，新增 `src/main/platform/` 目录实现平台抽象层，遵循策略模式隔离平台差异。

## Complexity Tracking

> 无 Constitution 违规，无需记录复杂度追踪。
