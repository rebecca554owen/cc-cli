## [1.1.0](https://github.com/cjh-store/cc/compare/v1.0.0...v1.1.0) (2025-09-21)

### Features

* **api:** 重构删除命令模块 ([984dcf4](https://github.com/cjh-store/cc/commit/984dcf4bed7f0ac94ebf6273d265a180603e1a39))

## 1.0.0 (2025-09-21)

### Features

* Claude Code配置管理CLI工具初始发布 ([240c51a](https://github.com/cjh-store/cc/commit/240c51af53daf0f89bd3cdc9af961f9b2201a4b0))

## 1.0.0 (2025-09-21)

### Features

* Claude Code配置管理CLI工具初始发布 ([240c51a](https://github.com/cjh-store/cc/commit/240c51af53daf0f89bd3cdc9af961f9b2201a4b0))

## 1.0.0 (2025-09-21)

### Features

* Claude Code配置管理CLI工具初始发布 ([240c51a](https://github.com/cjh-store/cc/commit/240c51af53daf0f89bd3cdc9af961f9b2201a4b0))

## [1.1.0](https://github.com/cjh-store/cc/compare/v1.0.0...v1.1.0) (2025-09-21)

### Features

* 优化日志显示功能 ([55919e3](https://github.com/cjh-store/cc/commit/55919e3be2a3dbbd8c36b4ec86b0216d2e6d8dcb))

## 1.0.0 (2025-09-21)

### Bug Fixes

* 修复GitHub Actions构建问题 ([40bbe45](https://github.com/cjh-store/cc/commit/40bbe457ef78f9318c716a80b1f5cbb249679717))
* 修复repository URL配置 ([a9d5f27](https://github.com/cjh-store/cc/commit/a9d5f270195fceab0fa25eda559d4ab6df0b3e31))

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-9-21

### 🎉 Initial Release

#### ✨ Features

- **🔄 智能配置切换** - 支持 API 站点和 Token 快速切换
- **📋 完整配置管理** - 查看、添加、删除 API 配置
- **🔗 智能合并系统** - 与 Claude Code settings.json 无缝合并
- **⚙️ 全配置支持** - 支持所有 Claude Code 配置项（env、hooks、permissions 等）
- **🌏 中英文支持** - 站点标识支持中英文字符
- **🎨 美观交互界面** - 现代化命令行界面设计
- **🛡️ 安全删除机制** - 防误删保护和智能警告系统

#### 🚀 Core Commands

- `cc` - 交互式主菜单
- `cc api` - API 配置管理
- `cc api --list` - 列出所有配置
- `cc api --add` - 添加新配置
- `cc api --delete` - 删除配置
- `cc status` - 查看当前状态

#### 🔧 Technical Features

- **智能 Token 选择** - 单 Token 时自动选择
- **配置统计显示** - 完整的站点和 Token 统计
- **历史记录管理** - 配置切换历史追踪
- **深度配置合并** - 保留现有 settings.json 所有配置

#### 📦 Installation

```bash
npm install -g @cjh0/cc-cli
```

#### 🎯 Requirements

- Node.js >= 14.0.0
- Claude Code installed
