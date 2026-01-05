# 任务清单：macOS 托盘应用重构

**输入**: 设计文档来自 `/specs/001-tray-app-refactor/`
**前置条件**: plan.md (必需), spec.md (必需), research.md, data-model.md

**测试**: 本功能规格未明确要求测试，任务清单不包含测试任务。

**组织方式**: 任务按用户故事分组，支持独立实现和测试。

## 格式说明: `[ID] [P?] [Story?] 描述`

- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 所属用户故事 (US1, US2, US3, US4, US5)
- 描述中包含具体文件路径

## 路径约定

- **项目类型**: 单一 Electron 项目
- **主进程**: `src/main/`
- **渲染进程**: `src/renderer/`
- **预加载**: `src/preload/`
- **共享类型**: `src/shared/`
- **资源**: `resources/`

---

## Phase 1: 项目初始化

**目的**: 创建项目结构和基础配置

- [x] T001 创建项目目录结构 (src/main, src/renderer, src/preload, src/shared, resources/icons)
- [x] T002 初始化 package.json，配置 Electron 28+ 和 TypeScript 依赖
- [x] T003 [P] 创建 tsconfig.json，启用 strict mode
- [x] T004 [P] 配置 ESLint + Prettier
- [x] T005 [P] 创建 electron-builder 配置文件 (electron-builder.yml)
- [x] T006 安装核心依赖: electron, nut-js, electron-store

---

## Phase 2: 基础设施 (阻塞性前置)

**目的**: 所有用户故事共享的核心基础设施

**⚠️ 关键**: 此阶段完成前，任何用户故事都无法开始

- [x] T007 创建共享类型定义 src/shared/types.ts (AppConfig, RuntimeState, TrayIconState)
- [x] T008 [P] 实现配置存储服务 src/main/store.ts (electron-store 封装)
- [x] T009 [P] 创建 IPC 通道定义 src/shared/ipc-channels.ts
- [x] T010 实现预加载脚本 src/preload/index.ts (contextBridge 暴露 API)
- [x] T011 创建主进程入口 src/main/index.ts (app 生命周期管理)

**检查点**: 基础设施就绪 - 用户故事实现可以开始

---

## Phase 3: 用户故事 1 - 托盘模式启动与基本控制 (优先级: P1) 🎯 MVP

**目标**: 应用启动后仅在菜单栏显示图标，支持托盘菜单控制

**独立测试**: 启动应用 → 验证 Dock 无图标 → 点击托盘图标 → 验证菜单弹出

### 实现任务

- [x] T012 [US1] 配置 LSUIElement 隐藏 Dock 图标 (package.json 或 Info.plist)
- [x] T013 [P] [US1] 创建托盘图标资源 resources/icons/tray-iconTemplate.png (16x16, 32x32)
- [x] T014 [P] [US1] 创建运行状态图标 resources/icons/tray-icon-activeTemplate.png
- [x] T015 [US1] 实现托盘管理模块 src/main/tray.ts (创建托盘、构建菜单)
- [x] T016 [US1] 实现托盘菜单项: 开始/停止、打开主界面、退出
- [x] T017 [US1] 实现托盘图标状态切换 (idle/active 图标切换)
- [x] T018 [US1] 在主进程入口集成托盘模块 src/main/index.ts

**检查点**: 用户故事 1 完成，应用可以托盘模式运行并响应菜单操作

---

## Phase 4: 用户故事 2 - 鼠标微移动保活 (优先级: P1) 🎯 MVP

**目标**: 后台自动进行 1 像素鼠标微移动，间隔 30-90 秒随机

**独立测试**: 启动保活 → 等待 30-90 秒 → 观察鼠标微移动

### 实现任务

- [x] T019 [US2] 实现鼠标移动服务 src/main/mouse-mover.ts (nut-js 封装)
- [x] T020 [US2] 实现随机间隔计算 (30000-90000ms)
- [x] T021 [US2] 实现移动调度逻辑 (setTimeout 链式调用)
- [x] T022 [US2] 添加启动/停止控制方法
- [x] T023 [US2] 集成到托盘菜单的开始/停止操作

**检查点**: 用户故事 2 完成，鼠标微移动功能可独立工作

---

## Phase 5: 用户故事 3 - 主控制面板 (优先级: P2)

**目标**: 提供可视化配置界面，包括开关、时段设置、倒计时显示

**独立测试**: 打开主界面 → 操作配置项 → 验证配置生效

### 实现任务

- [x] T024 [US3] 实现窗口管理模块 src/main/window.ts (创建/显示/隐藏窗口)
- [x] T025 [P] [US3] 创建主界面 HTML src/renderer/index.html
- [x] T026 [P] [US3] 创建主界面样式 src/renderer/styles/main.css (现代简洁风格)
- [x] T027 [US3] 实现渲染进程入口 src/renderer/main.ts
- [x] T028 [P] [US3] 实现 Toggle 开关组件 src/renderer/components/Toggle.ts
- [x] T029 [P] [US3] 实现时间选择器组件 src/renderer/components/TimePicker.ts
- [x] T030 [P] [US3] 实现倒计时显示组件 src/renderer/components/Countdown.ts
- [x] T031 [US3] 实现工作时段调度器 src/main/scheduler.ts (时段检查、工作日判断)
- [x] T032 [US3] 实现主进程与渲染进程 IPC 通信 (配置读写、状态同步)
- [x] T033 [US3] 集成调度器到鼠标移动服务 (时段外自动暂停)

**检查点**: 用户故事 3 完成，主界面可配置所有选项

---

## Phase 6: 用户故事 4 - macOS 辅助功能权限处理 (优先级: P2)

**目标**: 启动时检测权限，无权限时引导用户开启

**独立测试**: 无权限状态启动 → 验证引导弹窗 → 点击跳转 → 验证打开系统设置

### 实现任务

- [x] T034 [US4] 实现权限检测模块 src/main/permission.ts (systemPreferences API)
- [x] T035 [US4] 实现权限引导弹窗 (dialog.showMessageBox)
- [x] T036 [US4] 实现跳转系统设置功能 (shell.openExternal)
- [x] T037 [US4] 在应用启动流程中集成权限检测
- [x] T038 [US4] 实现权限状态变化监听 (用户授权后自动恢复)

**检查点**: 用户故事 4 完成，权限引导流程完整

---

## Phase 7: 用户故事 5 - 深浅色模式适配 (优先级: P3)

**目标**: 托盘图标自动适配系统深色/浅色模式

**独立测试**: 切换系统外观模式 → 观察托盘图标颜色变化

### 实现任务

- [x] T039 [US5] 确保托盘图标使用 Template Image 格式 (文件名包含 Template)
- [x] T040 [US5] 验证深色模式下图标显示效果
- [x] T041 [US5] 验证浅色模式下图标显示效果
- [x] T042 [US5] 监听系统外观模式变化事件 (nativeTheme.on('updated'))

**检查点**: 用户故事 5 完成，托盘图标适配深浅色模式

---

## Phase 8: 收尾与优化

**目的**: 跨用户故事的改进和优化

- [ ] T043 [P] 创建应用图标 resources/icons/app-icon.icns
- [x] T044 [P] 配置 electron-builder 打包脚本 (DMG 格式)
- [x] T045 处理系统休眠/唤醒事件 (powerMonitor API)
- [x] T046 添加错误处理和日志记录
- [ ] T047 运行 quickstart.md 验证清单
- [ ] T048 优化启动性能 (目标 <3s)

---

## 依赖关系与执行顺序

### 阶段依赖

- **Phase 1 (初始化)**: 无依赖 - 可立即开始
- **Phase 2 (基础设施)**: 依赖 Phase 1 完成 - **阻塞所有用户故事**
- **Phase 3 (US1)**: 依赖 Phase 2 完成
- **Phase 4 (US2)**: 依赖 Phase 2 完成，可与 US1 并行
- **Phase 5 (US3)**: 依赖 Phase 2 完成，依赖 US1 的托盘模块
- **Phase 6 (US4)**: 依赖 Phase 2 完成，可与 US1/US2 并行
- **Phase 7 (US5)**: 依赖 US1 的托盘图标
- **Phase 8 (收尾)**: 依赖所有用户故事完成

### 用户故事依赖

- **US1 (托盘模式)**: Phase 2 后可开始 - 无其他故事依赖
- **US2 (鼠标移动)**: Phase 2 后可开始 - 可与 US1 并行
- **US3 (主面板)**: 依赖 US1 (托盘菜单"打开主界面")
- **US4 (权限处理)**: Phase 2 后可开始 - 可与 US1/US2 并行
- **US5 (深浅色)**: 依赖 US1 (托盘图标)

### 并行机会

- T003, T004, T005 可并行 (Phase 1)
- T008, T009 可并行 (Phase 2)
- T013, T014 可并行 (US1 图标资源)
- T025, T026 可并行 (US3 HTML/CSS)
- T028, T029, T030 可并行 (US3 组件)
- US1 和 US2 可并行开发
- US4 可与 US1/US2 并行开发

---

## 并行执行示例

```bash
# Phase 1 并行任务:
Task: "创建 tsconfig.json" (T003)
Task: "配置 ESLint + Prettier" (T004)
Task: "创建 electron-builder 配置" (T005)

# US1 图标资源并行:
Task: "创建托盘图标资源" (T013)
Task: "创建运行状态图标" (T014)

# US3 组件并行:
Task: "实现 Toggle 开关组件" (T028)
Task: "实现时间选择器组件" (T029)
Task: "实现倒计时显示组件" (T030)
```

---

## 实现策略

### MVP 优先 (仅 US1 + US2)

1. 完成 Phase 1: 项目初始化
2. 完成 Phase 2: 基础设施 (**关键 - 阻塞所有故事**)
3. 完成 Phase 3: US1 托盘模式
4. 完成 Phase 4: US2 鼠标移动
5. **停止并验证**: 测试 MVP 功能
6. 可选: 打包发布 MVP 版本

### 增量交付

1. 完成初始化 + 基础设施 → 基础就绪
2. 添加 US1 → 托盘模式可用 → 验证
3. 添加 US2 → 核心保活功能可用 → **MVP 完成**
4. 添加 US3 → 配置界面可用 → 验证
5. 添加 US4 → 权限引导完善 → 验证
6. 添加 US5 → 视觉体验优化 → 验证
7. 完成收尾 → 发布就绪

---

## 备注

- [P] 任务 = 不同文件，无依赖，可并行
- [Story] 标签映射到 spec.md 中的用户故事
- 每个用户故事应可独立完成和测试
- 每个任务或逻辑组完成后提交
- 在任何检查点停止以独立验证故事
- 避免: 模糊任务、同文件冲突、破坏独立性的跨故事依赖
