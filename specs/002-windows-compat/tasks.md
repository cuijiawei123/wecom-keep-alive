# Tasks: Windows 平台兼容支持

**Input**: Design documents from `/specs/002-windows-compat/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: 未明确要求测试，本任务清单不包含测试任务。

**Organization**: 任务按用户故事分组，支持独立实现和测试。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 所属用户故事（US1, US2, US3）
- 描述包含精确文件路径

## Path Conventions

- **项目类型**: Single Electron 桌面应用
- **源码路径**: `src/main/`, `src/renderer/`, `src/preload/`, `src/shared/`
- **资源路径**: `resources/icons/`
- **配置路径**: 根目录 `electron-builder.yml`, `package.json`

---

## Phase 1: Setup（项目配置）

**Purpose**: 准备 Windows 构建环境和资源文件

- [x] T001 创建 Windows 应用图标 `resources/icons/app-icon.ico`（包含 16x16, 32x32, 48x48, 64x64, 128x128, 256x256 尺寸）
- [x] T002 [P] 更新 `electron-builder.yml` 添加 Windows 打包配置（NSIS + Portable）
- [x] T003 [P] 更新 `package.json` 添加 Windows 构建脚本

---

## Phase 2: Foundational（平台抽象层基础设施）

**Purpose**: 创建跨平台鼠标控制抽象层，所有用户故事依赖此基础

**⚠️ CRITICAL**: 用户故事实现必须在此阶段完成后开始

- [x] T004 创建平台类型定义文件 `src/main/platform/types.ts`（MouseController 接口、MousePosition、PlatformInfo）
- [x] T005 创建平台工厂入口文件 `src/main/platform/index.ts`（createMouseController、getPlatformInfo 工厂函数）
- [x] T006 [P] 提取 macOS 鼠标实现到 `src/main/platform/mouse-darwin.ts`（从 mouse-mover.ts 提取 Python + Quartz 逻辑）
- [x] T007 [P] 实现 Windows 鼠标控制器 `src/main/platform/mouse-win32.ts`（PowerShell + System.Windows.Forms）
- [x] T008 重构 `src/main/mouse-mover.ts` 使用平台抽象层（替换直接的 Python 调用为 MouseController 接口）

**Checkpoint**: 平台抽象层完成，鼠标控制在 macOS 和 Windows 上均可工作

---

## Phase 3: User Story 1 - Windows 用户启动保活功能 (Priority: P1) 🎯 MVP

**Goal**: Windows 用户能够开启/关闭保活功能，系统执行鼠标微移动防止休眠

**Independent Test**: 在 Windows 系统上运行应用，开启保活开关，观察鼠标是否周期性微移动，状态显示"保活运行中"

### Implementation for User Story 1

- [x] T009 [US1] 修改 `src/main/permission.ts` 添加 Windows 平台权限处理（Windows 默认返回 true，跳过权限引导）
- [x] T010 [US1] 修改 `src/main/index.ts` 适配 Windows 窗口样式（移除 macOS 专属配置如 vibrancy、titleBarStyle）
- [x] T011 [US1] 修改 `src/main/index.ts` 适配 Windows Dock 隐藏逻辑（仅 macOS 调用 app.dock.hide()）
- [x] T012 [US1] 验证 `src/main/index.ts` 中 powerMonitor/resume 事件在 Windows 上正常工作

**Checkpoint**: Windows 用户可以启动应用并使用保活功能的开启/关闭

---

## Phase 4: User Story 2 - Windows 用户选择保活时长 (Priority: P1)

**Goal**: Windows 用户能够选择保活时长（30分钟、1小时、2小时、4小时、8小时、永久）

**Independent Test**: 在 Windows 上选择"2小时"保活时长，验证倒计时显示 02:00:00 并正确递减

### Implementation for User Story 2

- [x] T013 [US2] 验证 `src/shared/types.ts` 中时长配置在 Windows 上无需修改
- [x] T014 [US2] 验证 `src/renderer/main.ts` 时长选择 UI 在 Windows 上正常渲染
- [x] T015 [US2] 验证 `src/renderer/components/Countdown.ts` 倒计时组件在 Windows 上正常工作

**Checkpoint**: Windows 用户可以选择保活时长，倒计时正确显示

---

## Phase 5: User Story 3 - Windows 系统托盘交互 (Priority: P2)

**Goal**: Windows 用户通过系统托盘图标控制保活功能

**Independent Test**: 在 Windows 系统托盘找到应用图标，点击切换保活状态，右键显示菜单

### Implementation for User Story 3

- [x] T016 [US3] 修改 `src/main/tray.ts` 添加 Windows 图标路径选择逻辑（Windows 使用 PNG，macOS 使用 Template Image）
- [x] T017 [US3] 修改 `src/main/tray.ts` 适配 Windows 托盘点击行为（左键切换功能，与 macOS 行为一致）
- [x] T018 [US3] 验证托盘菜单在 Windows 上正确显示和响应

**Checkpoint**: Windows 用户可以通过系统托盘完整控制应用

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 完善跨平台体验和构建流程

- [x] T019 [P] 修改 `src/main/window.ts` 移除/条件化 macOS 专属窗口配置
- [x] T020 [P] 验证 `src/main/store.ts` 配置存储路径在 Windows 上正确（electron-store 自动处理）
- [ ] T021 在 Windows 环境执行 `npm run build` 验证构建成功
- [ ] T022 在 Windows 环境执行 `npm run package` 生成 NSIS 安装包和便携版
- [ ] T023 执行 `specs/002-windows-compat/quickstart.md` 中的 Windows 验证步骤

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖 - 可立即开始
- **Foundational (Phase 2)**: 依赖 Setup 完成 - **阻塞所有用户故事**
- **User Stories (Phase 3-5)**: 依赖 Foundational 完成
  - US1 和 US2 可并行（均为 P1 优先级）
  - US3 可在 US1/US2 完成后开始（P2 优先级）
- **Polish (Phase 6)**: 依赖所有用户故事完成

### User Story Dependencies

- **User Story 1 (P1)**: 依赖 Foundational 完成 - 核心功能，MVP 必需
- **User Story 2 (P1)**: 依赖 Foundational 完成 - 与 US1 并行，共同构成 MVP
- **User Story 3 (P2)**: 依赖 Foundational 完成 - 增强体验，可延后

### Within Each User Story

- 修改文件前确认平台抽象层已就绪
- 先修改主进程代码，再验证渲染进程
- 每个故事完成后独立测试

### Parallel Opportunities

- T002 和 T003 可并行（不同配置文件）
- T006 和 T007 可并行（不同平台实现文件）
- T019 和 T020 可并行（不同模块）
- US1 和 US2 可并行（无交叉依赖）

---

## Parallel Example: Foundational Phase

```bash
# 平台实现可并行开发：
Task: "提取 macOS 鼠标实现到 src/main/platform/mouse-darwin.ts"
Task: "实现 Windows 鼠标控制器 src/main/platform/mouse-win32.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2)

1. 完成 Phase 1: Setup（图标和构建配置）
2. 完成 Phase 2: Foundational（平台抽象层）
3. 完成 Phase 3: User Story 1（保活开关）
4. 完成 Phase 4: User Story 2（时长选择）
5. **STOP and VALIDATE**: 在 Windows 上测试核心功能
6. 可交付 MVP

### Incremental Delivery

1. Setup + Foundational → 平台抽象层就绪
2. 添加 US1 + US2 → 核心功能可用 → **MVP 交付**
3. 添加 US3 → 托盘交互完善 → 完整版交付
4. Polish → 构建验证和文档

### Single Developer Strategy

推荐执行顺序：
1. T001 → T002 → T003（Setup）
2. T004 → T005 → T006 → T007 → T008（Foundational，T006/T007 可并行）
3. T009 → T010 → T011 → T012（US1）
4. T013 → T014 → T015（US2，主要是验证）
5. T016 → T017 → T018（US3）
6. T019 → T020 → T021 → T022 → T023（Polish）

---

## Notes

- [P] 任务 = 不同文件，无依赖，可并行
- [Story] 标签映射任务到特定用户故事
- Windows 权限模型简单，无需复杂授权流程
- PowerShell 脚本在 Windows 10/11 默认可用
- 托盘图标使用 PNG 格式（非 ICO），Electron 自动处理
- 提交策略：每个任务或逻辑组完成后提交
