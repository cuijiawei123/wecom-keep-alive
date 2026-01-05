# 快速开始：macOS 托盘应用重构

**分支**: `001-tray-app-refactor` | **日期**: 2026-01-04

## 环境要求

- **Node.js**: 18.x 或更高版本
- **npm**: 9.x 或更高版本
- **macOS**: 12.0 (Monterey) 或更高版本
- **Xcode Command Line Tools**: 用于原生模块编译

## 快速开始

### 1. 克隆并安装依赖

```bash
git clone <repo-url>
cd wecom_keep_alive
npm install
```

### 2. 开发模式运行

```bash
npm run dev
```

应用将以开发模式启动，支持热重载。

### 3. 构建生产版本

```bash
npm run build
```

构建产物位于 `dist/` 目录。

### 4. 打包 DMG

```bash
npm run package
```

DMG 安装包位于 `release/` 目录。

## 项目脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发模式运行 |
| `npm run build` | 构建生产版本 |
| `npm run package` | 打包 DMG |
| `npm run lint` | 代码检查 |
| `npm run test` | 运行单元测试 |
| `npm run test:e2e` | 运行 E2E 测试 |

## 目录结构

```
wecom_keep_alive/
├── src/
│   ├── main/           # 主进程代码
│   ├── renderer/       # 渲染进程代码
│   ├── preload/        # 预加载脚本
│   └── shared/         # 共享类型
├── resources/          # 静态资源（图标等）
├── tests/              # 测试文件
├── specs/              # 功能规格文档
└── dist/               # 构建输出
```

## 开发注意事项

### 辅助功能权限

开发时需要在系统设置中为终端/IDE 授予辅助功能权限，否则鼠标控制功能无法工作。

**路径**: 系统设置 → 隐私与安全性 → 辅助功能

### 托盘图标

托盘图标使用 Template Image 格式，文件名必须包含 `Template` 后缀：
- `tray-iconTemplate.png` (常规状态)
- `tray-iconTemplate@2x.png` (Retina 显示器)

### 热重载

- 主进程修改后需要重启应用
- 渲染进程修改支持热重载

## 验证清单

完成开发后，请验证以下功能：

- [ ] 应用启动后仅在菜单栏显示图标，Dock 无图标
- [ ] 点击托盘图标弹出菜单
- [ ] 保活功能可正常启动/停止
- [ ] 鼠标在 30-90 秒间隔内发生微移动
- [ ] 工作时段设置生效
- [ ] 工作日模式生效
- [ ] 深浅色模式切换时托盘图标正确适配
- [ ] 无辅助功能权限时显示引导弹窗
- [ ] 配置在重启后保持
