<!--
Sync Impact Report
==================
Version change: 1.0.0 → 1.1.0
Modified principles: None
Added sections:
  - V. Chinese Documentation (新增中文文档原则)
Removed sections: None
Templates requiring updates:
  - .specify/templates/plan-template.md ✅ (compatible, no changes needed)
  - .specify/templates/spec-template.md ✅ (compatible, no changes needed)
  - .specify/templates/tasks-template.md ✅ (compatible, no changes needed)
Follow-up TODOs: None
-->

# WeCom Keep Alive Constitution

## Core Principles

### I. Single-Process Desktop App

本项目是一个纯客户端 Electron 桌面应用，不涉及后端服务。所有功能 MUST 在单一 Electron 进程架构内完成（main + renderer）。禁止引入独立后端服务、数据库服务器或外部 API 依赖（系统 API 除外）。

### II. macOS Tray-First Design

应用 MUST 以系统托盘（Tray）模式运行，常驻 macOS 右上角菜单栏。主窗口为可选，核心交互通过 Tray 菜单完成。应用 MUST 支持：
- 开机自启动
- 后台静默运行
- 托盘图标状态指示

### III. Minimal Footprint

作为常驻后台工具，应用 MUST 保持最小资源占用：
- 内存占用 SHOULD 低于 100MB
- CPU 空闲时 MUST 接近 0%
- 禁止不必要的轮询或定时器（使用事件驱动）

### IV. User Experience Simplicity

用户体验 MUST 简洁直观：
- 配置项 SHOULD 最小化，提供合理默认值
- 关键操作 MUST 可通过托盘菜单一键完成
- 错误信息 MUST 清晰可理解

### V. Chinese Documentation

项目所有文档 MUST 使用中文编写，包括但不限于：
- 规格说明文档（spec）
- 实现计划文档（plan）
- 任务清单（tasks）
- 代码注释（关键逻辑处）
- 提交信息（commit message 描述部分）

代码中的变量名、函数名 SHOULD 使用英文，但注释和文档说明 MUST 使用中文。

## Technology Stack

**Runtime**: Electron (Node.js + Chromium)
**Language**: TypeScript (strict mode)
**Target Platform**: macOS (Intel + Apple Silicon)
**Build Tool**: electron-builder 或 electron-forge
**Testing**: Playwright (E2E) + Vitest (Unit)

## Development Workflow

1. **分支策略**: 功能分支从 `main` 创建，完成后合并回 `main`
2. **代码规范**: ESLint + Prettier，提交前 MUST 通过 lint 检查
3. **提交规范**: Conventional Commits 格式
4. **发布流程**: 通过 CI 自动构建 DMG 安装包

## Governance

本 Constitution 是项目的最高指导原则，所有设计决策 MUST 符合上述原则。

**修订流程**:
1. 提出修订 PR 并说明理由
2. 评估对现有功能的影响
3. 更新版本号（遵循语义化版本）
4. 同步更新相关文档

**版本策略**:
- MAJOR: 原则删除或重大重定义
- MINOR: 新增原则或重要扩展
- PATCH: 措辞澄清、格式修正

**Version**: 1.1.0 | **Ratified**: 2026-01-04 | **Last Amended**: 2026-01-04
