# 实现计划：macOS 托盘应用重构

**分支**: `001-tray-app-refactor` | **日期**: 2026-01-04 | **规格**: [spec.md](./spec.md)
**输入**: 功能规格说明 `/specs/001-tray-app-refactor/spec.md`

## 摘要

将 WeComKeepAlive 重构为基于 Electron 的 macOS 原生托盘应用。核心功能包括：托盘模式运行（不显示 Dock 图标）、鼠标微移动保活（30-90秒随机间隔）、工作时段/工作日配置、辅助功能权限检测与引导、深浅色模式适配。

## 技术上下文

**语言/版本**: TypeScript 5.x (strict mode)
**主要依赖**: Electron 28+, nut-js (鼠标控制)
**存储**: electron-store (本地 JSON 配置持久化)
**测试**: Vitest (单元测试) + Playwright (E2E)
**目标平台**: macOS 12+ (Intel + Apple Silicon)
**项目类型**: 单一 Electron 项目 (main + renderer)
**性能目标**: 启动 <3s, 内存 <100MB, CPU 空闲 <1%
**约束**: 纯客户端，无后端服务，无网络依赖
**规模**: 单用户桌面工具，约 5 个主要界面/交互

## Constitution 检查

*门禁：Phase 0 研究前必须通过。Phase 1 设计后重新检查。*

| 原则 | 状态 | 说明 |
|------|------|------|
| I. Single-Process Desktop App | ✅ 通过 | 纯 Electron 架构，无后端服务 |
| II. macOS Tray-First Design | ✅ 通过 | 托盘优先，Dock 隐藏，支持开机自启 |
| III. Minimal Footprint | ✅ 通过 | 内存 <100MB，CPU 空闲 <1%，事件驱动 |
| IV. User Experience Simplicity | ✅ 通过 | 托盘菜单一键操作，配置项最小化 |
| V. Chinese Documentation | ✅ 通过 | 所有文档使用中文 |

**门禁结果**: 全部通过，可继续执行

## 项目结构

### 文档（本功能）

```text
specs/001-tray-app-refactor/
├── plan.md              # 本文件
├── research.md          # Phase 0 输出
├── data-model.md        # Phase 1 输出
├── quickstart.md        # Phase 1 输出
└── tasks.md             # Phase 2 输出 (/speckit.tasks 命令生成)
```

### 源代码（仓库根目录）

```text
src/
├── main/                    # Electron 主进程
│   ├── index.ts             # 主进程入口
│   ├── tray.ts              # 托盘管理
│   ├── window.ts            # 窗口管理
│   ├── mouse-mover.ts       # 鼠标移动服务
│   ├── permission.ts        # 权限检测
│   ├── store.ts             # 配置存储
│   └── scheduler.ts         # 工作时段调度
├── renderer/                # Electron 渲染进程
│   ├── index.html           # 主界面 HTML
│   ├── main.ts              # 渲染进程入口
│   ├── components/          # UI 组件
│   │   ├── Toggle.ts        # 开关组件
│   │   ├── TimePicker.ts    # 时间选择器
│   │   └── Countdown.ts     # 倒计时显示
│   └── styles/              # 样式文件
│       └── main.css         # 主样式
├── preload/                 # 预加载脚本
│   └── index.ts             # IPC 桥接
└── shared/                  # 共享类型
    └── types.ts             # TypeScript 类型定义

resources/
├── icons/                   # 应用图标
│   ├── tray-icon.png        # 托盘图标 (Template Image)
│   ├── tray-icon-active.png # 运行中状态图标
│   └── app-icon.icns        # 应用图标
└── locales/                 # 本地化（预留）

tests/
├── unit/                    # 单元测试
│   ├── scheduler.test.ts
│   └── store.test.ts
└── e2e/                     # E2E 测试
    └── app.test.ts
```

**结构决策**: 采用标准 Electron 项目结构，main/renderer/preload 分离，符合 Electron 安全最佳实践。

## 复杂度追踪

> 无 Constitution 违规，无需填写
