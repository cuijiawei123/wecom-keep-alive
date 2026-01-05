# Windows 图标说明

## 图标文件

Windows 版本需要 `app-icon.ico` 文件，包含以下尺寸：
- 16x16
- 32x32
- 48x48
- 64x64
- 128x128
- 256x256

## 生成方法

1. 准备一个 256x256 或更大的 PNG 图标
2. 使用在线工具（如 https://icoconvert.com/）转换为 ICO
3. 或使用 ImageMagick：
   ```bash
   convert app-icon.png -define icon:auto-resize=256,128,64,48,32,16 app-icon.ico
   ```

## 临时方案

当前 electron-builder 配置使用 PNG 图标，Electron 会自动处理格式转换。
如需更好的 Windows 图标显示效果，请手动创建 ICO 文件。
