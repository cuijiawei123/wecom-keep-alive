# WeComKeepAlive

<p align="center">
  <img src="resources/icons/tray-iconTemplate@2x.png" alt="WeComKeepAlive Logo" width="64" height="64">
</p>

<p align="center">
  <strong>跨平台桌面保活工具 - 防止企业微信等应用因系统休眠而掉线</strong>
</p>

<p align="center">
  <a href="#功能特性">功能特性</a> •
  <a href="#下载安装">下载安装</a> •
  <a href="#使用方法">使用方法</a> •
  <a href="#开发指南">开发指南</a> •
  <a href="#常见问题">常见问题</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/platform-macOS%20%7C%20Windows-blue" alt="Platform">
  <img src="https://img.shields.io/badge/electron-28.0-brightgreen" alt="Electron">
  <img src="https://img.shields.io/badge/license-MIT-green" alt="License">
</p>

---

## 功能特性

- 🖱️ **智能保活** - 通过微小的鼠标移动（1像素）防止系统进入休眠状态
- ⏱️ **灵活时长** - 支持 30分钟、1小时、2小时、4小时、8小时或永久保活
- 🎯 **系统托盘** - 最小化到系统托盘，不干扰日常工作
- 🌍 **跨平台** - 完美支持 macOS 和 Windows
- 🔒 **隐私安全** - 纯本地运行，不收集任何用户数据
- ⚡ **轻量高效** - 资源占用极低，后台静默运行

## 下载安装

### macOS

1. 从 [Releases](../../releases) 页面下载最新的 `.dmg` 文件
2. 打开 DMG 文件，将应用拖入 Applications 文件夹
3. 首次运行需要在「系统设置 → 隐私与安全性 → 辅助功能」中授权

### Windows

1. 从 [Releases](../../releases) 页面下载最新的安装包：
   - `WeComKeepAlive-Setup-x.x.x.exe` - 安装版
   - `WeComKeepAlive-x.x.x-portable.exe` - 便携版（无需安装）
2. 运行安装程序或直接打开便携版
3. Windows 无需额外权限配置

## 使用方法

### 基本操作

1. **启动应用** - 应用启动后自动最小化到系统托盘
2. **开启保活** - 点击托盘图标打开主界面，开启保活开关
3. **选择时长** - 选择保活持续时间（默认 2 小时）
4. **后台运行** - 关闭窗口后应用继续在托盘运行

### 托盘操作

| 操作 | macOS | Windows |
|------|-------|---------|
| 打开菜单 | 点击托盘图标 | 右键点击托盘图标 |
| 快速切换 | 通过菜单 | 左键点击托盘图标 |
| 退出应用 | 菜单 → 退出 | 菜单 → 退出 |

### 保活时长选项

| 选项 | 说明 |
|------|------|
| 30 分钟 | 适合短暂离开 |
| 1 小时 | 午休时间 |
| 2 小时 | 默认选项，适合大多数场景 |
| 4 小时 | 半天会议 |
| 8 小时 | 全天工作 |
| 永久 | 持续保活直到手动关闭 |

## 工作原理

WeComKeepAlive 通过周期性地执行微小的鼠标移动（1像素往返）来模拟用户活动，从而：

- 防止系统进入休眠/睡眠状态
- 保持企业微信等即时通讯软件的在线状态
- 避免因长时间无操作导致的自动锁屏

**技术实现**：
- macOS: 使用 Python + Quartz 框架控制鼠标
- Windows: 使用 PowerShell + System.Windows.Forms 控制鼠标

## 开发指南

### 环境要求

- Node.js 20+
- npm 或 yarn
- macOS 10.15+ 或 Windows 10+

### 本地开发

```bash
# 克隆项目
git clone https://github.com/your-username/wecom_keep_alive.git
cd wecom_keep_alive

# 安装依赖
npm install

# 启动开发模式
npm run dev
```

### 构建打包

```bash
# 构建应用
npm run build

# 打包 macOS 版本
npm run package:mac

# 打包 Windows 版本
npm run package:win

# 同时打包两个平台
npm run package:all
```

### 项目结构

```
wecom_keep_alive/
├── src/
│   ├── main/           # 主进程代码
│   │   ├── platform/   # 跨平台抽象层
│   │   ├── index.ts    # 应用入口
│   │   ├── tray.ts     # 托盘管理
│   │   └── mouse-mover.ts  # 鼠标移动服务
│   ├── renderer/       # 渲染进程（UI）
│   ├── preload/        # 预加载脚本
│   └── shared/         # 共享类型定义
├── resources/          # 资源文件（图标等）
└── release/            # 打包输出目录
```

## 常见问题

### macOS 相关

**Q: 为什么需要辅助功能权限？**

A: macOS 系统要求应用必须获得辅助功能权限才能控制鼠标。这是系统安全机制，请放心授权。

**Q: 如何授权辅助功能权限？**

A: 系统设置 → 隐私与安全性 → 辅助功能 → 找到 WeComKeepAlive 并开启

### Windows 相关

**Q: Windows 需要管理员权限吗？**

A: 不需要。Windows 默认允许应用程序模拟鼠标输入。

**Q: 杀毒软件报警怎么办？**

A: 由于应用会模拟鼠标操作，部分杀毒软件可能误报。请将应用添加到白名单。

### 通用问题

**Q: 保活期间可以正常使用电脑吗？**

A: 可以。鼠标移动幅度仅 1 像素且会立即归位，不影响正常使用。

**Q: 会影响电脑性能吗？**

A: 不会。应用资源占用极低，CPU 使用率接近 0%。

**Q: 锁屏后保活还有效吗？**

A: 锁屏状态下鼠标模拟可能无效，但应用会在解锁后自动恢复。

## 贡献指南

欢迎提交 Issue 和 Pull Request！

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 开源协议

本项目基于 [MIT License](LICENSE) 开源。

## 致谢

- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
- [electron-vite](https://electron-vite.org/) - Electron 开发构建工具
- [electron-builder](https://www.electron.build/) - 应用打包工具

---

<p align="center">
  如果这个项目对你有帮助，请给一个 ⭐ Star 支持一下！
</p>
