# Hexo Pro 项目构建指南

## 📋 项目结构

```
hexo-pro-client/           # 主项目（React前端）
├── hexo-pro/             # 子模块：Hexo插件后端
├── hexo-pro-desktop/     # 子模块：桌面端应用
├── client/               # React前端源码
├── config/               # Webpack配置
└── BUILD_GUIDE.md        # 本文档
```

## 🏗️ 构建流程说明

### 1. 前端构建流程

```bash
# 在 hexo-pro-client 根目录执行
yarn build
```

**构建步骤：**
1. Webpack读取 `client/src` 源码
2. 编译 TypeScript + React 代码
3. 打包并优化静态资源
4. 输出到 `hexo-pro/www/` 目录

### 2. 桌面端构建流程

```bash
# 方式一：在 hexo-pro-client 根目录一键构建
yarn build:desktop

# 方式二：单独构建桌面端
cd hexo-pro-desktop
yarn copy-core
yarn build:electron
```

**构建步骤：**
1. 构建前端资源（如果www目录不存在）
2. 复制hexo-pro后端文件到桌面端
3. 复制前端资源到桌面端
4. 打包Electron应用

## 🚀 快速开始

### 初次设置

```bash
# 1. 克隆主项目（包含子模块）
git clone --recursive <hexo-pro-client-repo>
cd hexo-pro-client

# 2. 安装主项目依赖
yarn install

# 3. 设置桌面端
yarn setup:desktop

# 4. 构建前端资源
yarn build
```

### 开发模式

```bash
# 前端开发
yarn dev

# 桌面端开发（需要先构建前端）
yarn dev:desktop
```

### 生产构建

```bash
# 构建前端
yarn build

# 构建桌面端
yarn build:desktop
```

## 📦 构建顺序要求

根据项目依赖关系，**必须**按以下顺序构建：

1. **hexo-pro-client** 前端构建 → `hexo-pro/www/`
2. **hexo-pro-desktop** 复制核心文件 → 包含前端资源

⚠️ **重要提醒：**
- hexo-pro-desktop 依赖 hexo-pro 的前端资源
- 必须先执行 `yarn build` 生成前端资源
- 然后再执行桌面端相关命令

## 🔄 自动化工作流

### package.json 脚本说明

**hexo-pro-client 脚本：**
- `yarn build` - 构建前端资源
- `yarn build:desktop` - 一键构建桌面端（包含前端构建）
- `yarn dev:desktop` - 开发模式启动桌面端
- `yarn setup:desktop` - 初始化桌面端环境

**hexo-pro-desktop 脚本：**
- `yarn copy-core` - 复制核心文件（智能检测路径）
- `yarn build:electron` - 打包Electron应用
- `yarn dev` - 开发模式运行

## 🔍 路径检测机制

desktop的复制脚本会自动检测运行环境：

- **子模块模式**: 检测到 `../../../hexo-pro` 存在
- **独立项目模式**: 使用 `../../hexo-pro-client/hexo-pro` 路径

这确保了在不同的项目结构下都能正常工作。

## 🚨 常见问题

### 1. 前端资源找不到

**现象**: www目录不存在或为空  
**解决**: 先执行 `yarn build` 构建前端资源

### 2. 桌面端构建失败

**现象**: copy-core 脚本找不到源文件  
**解决**: 检查 hexo-pro 子模块是否正确初始化

### 3. 路径错误

**现象**: 复制脚本报告路径不存在  
**解决**: 确认项目结构符合预期，检查子模块状态

## 📝 版本管理

当修改前端代码后：

1. 在 `hexo-pro-client` 中测试前端功能
2. 执行 `yarn build` 更新 `hexo-pro/www`
3. 提交 `hexo-pro` 子模块的更改
4. 测试桌面端功能
5. 提交 `hexo-pro-desktop` 的更改
6. 提交主项目的更改

## 💡 最佳实践

1. **开发前端时**: 使用 `yarn dev` 热重载开发
2. **测试桌面端时**: 先 `yarn build` 再 `yarn dev:desktop`
3. **发布版本时**: 使用 `yarn build:desktop` 一键构建
4. **CI/CD时**: 按顺序构建，确保依赖关系正确 