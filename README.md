# CC CLI - Claude Code 配置管理工具

**Language**: [中文](README.md) | [English](README_EN.md)

[![NPM版本](https://img.shields.io/npm/v/@cjh0/cc-cli.svg)](https://www.npmjs.com/package/@cjh0/cc-cli)
[![下载量](https://img.shields.io/npm/dm/@cjh0/cc-cli.svg)](https://www.npmjs.com/package/@cjh0/cc-cli)
![License](https://img.shields.io/badge/license-MIT-green.svg)

一键切换 claude code / codex 配置的命令行工具。支持多站点、多 Token 管理，智能合并配置，WebDAV 云端备份，无需手动修改配置文件。

## ✨ 核心功能

- 🔄 **一键切换** - 快速切换不同的 API 站点和 Token
- 📋 **配置管理** - 查看、添加、删除 API 配置
- 🔗 **智能合并** - 自动与 Claude Code 配置文件同步
- ⚙️ **完整支持** - 支持所有 Claude Code 配置项
- 💻 **Codex 支持** - 管理 Claude Code Codex 配置（仅支持 Claude 模型），支持开启/关闭yolo模式
- ☁️ **WebDAV 备份** - 支持配置文件云端备份与恢复（坚果云、其他标准WebDAV等）
  - **CC-CLI配置备份** - 📁.cc-cli下api_config.json 等等
  - **Claude Code配置备份** - 📄 settings.json 📄 CLAUDE.md 📁 agents/ 📁 commands/
  - **Codex备份** - 📄 config.toml 📄 auth.json 📄 AGENTS.md

## 📦 安装使用

```bash
# 全局安装
npm install -g @cjh0/cc-cli
```

## 🚀 使用方法

### 主要命令

```bash
# 启动交互式界面
cc
# 如果遇到命令冲突，使用备用命令
cc-cli

# API配置管理
cc api

# 快速切换 API 配置
cc apiuse

# 查看当前状态
cc status

# 查看帮助
cc --help
```

**⚠️ 命令冲突解决**：如果遇到 `clang: error` 错误，说明 `cc` 命令与系统的 C 编译器冲突，请使用 `cc-cli` 命令

运行 `cc` 后会显示交互式菜单，按方向键选择功能：

- 📡 Claude Code API - 切换/查看/添加/删除 Claude Code API 配置
- 💻 Codex API - 管理 Claude Code Codex 配置（切换配置、YOLO 模式）
- 🔄 Backup - 备份与恢复配置文件到WebDAV云端存储
- 📊 状态查看 - 查看当前使用的配置
- ❓ 帮助文档 - 显示帮助信息

## 📋 配置文件说明

### 智能配置合并

工具会自动将你选择的 API 配置与现有的 Claude Code 设置合并，保留所有原有配置项，只更新 API 相关设置。



### 配置格式示例

```json
{
  "sites": {
    "XX公益站": {
      "url": "https://api.example.com", // （可选）站点的地址 免得忘记公益站点，后期会支持一键打开
      "description": "同时支持Claude Code和Codex", // 随意 可不填
      // Claude Code API配置（最简配置，兼容官方大部分配置，会覆盖配置文件）
      "claude": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.example.com",
          "ANTHROPIC_AUTH_TOKEN": {
            "Token1": "sk-xxxxxxxxxxxxxx", // 支持多个token
            "Token2": "sk-yyyyyyyyyyyyyy"
          }
        },
      },
      // Codex API配置(最简配置，兼容官方大部分配置)
      "codex": {
        "OPENAI_API_KEY": "sk-xxxxxxxxxxxxxx",
        "model": "gpt-5",
        "model_providers": {
          "duckcoding": {
            "name": "duckcoding",
            "base_url": "https://jp.duckcoding.com/v1"
          }
        }
      }
    }
    "XX公益站2": {
      ...
    }
  }
}
```

> **⚠️ 重要说明**：
>
> - `claude` 字段：用于 Claude Code API 配置（推荐使用）
> - `config` 字段：用于 Claude Code API 配置（向后兼容）
> - `codex` 字段：用于 Codex API 配置，仅支持 Claude 模型
> - 三种配置可在同一站点中共存，实现双重支持
> - YOLO 模式：自动开启 `approval_policy=never` 和 `sandbox_mode=danger-full-access`


## 🔄 工作原理

### Claude Code API 配置流程

1. **选择配置** - 从列表中选择 API 站点和 Token
2. **智能合并** - 自动与现有 Claude Code 配置合并
3. **立即生效** - 无需重启，Claude Code 立即使用新配置

### Codex API 配置流程

1. **选择站点** - 从支持 Codex 的站点中选择
2. **选择提供商** - 从 model_providers 中选择服务提供商
3. **生成配置** - 自动生成 config.toml 和 auth.json 文件
4. **YOLO 模式** - 可选开启最宽松配置模式

### WebDAV 备份功能

支持将配置文件备份到云端存储，确保配置安全：

#### 支持的 WebDAV 服务
- **坚果云** - `https://dav.jianguoyun.com/dav/`
- **其他 WebDAV 服务** - 任何标准 WebDAV 协议服务

#### 备份内容
- **CC-CLI配置** - 📁.cc-cli下api_config.json 等等
- **Claude Code配置** - 📄 settings.json 📄 CLAUDE.md 📁 agents/ 📁 commands/
- **Codex配置** - 📄 config.toml 📄 auth.json 📄 AGENTS.md

#### 功能特性
- 🔐 **安全认证** - 支持用户名密码认证
- 📦 **选择性备份** - 可选择备份特定配置类别
- 🕒 **自动清理** - 自动保留最新5个备份文件
- 🔄 **完整恢复** - 支持选择备份文件和配置类别恢复
- 📊 **状态监控** - 实时显示备份状态和云端连接情况

## 📸 界面预览

<img src="https://qm-cloud.oss-cn-chengdu.aliyuncs.com/test/otherType/1758509266008.png" alt="CC CLI 界面预览" width="50%">

#### 配置切换界面

![配置切换界面](https://qm-cloud.oss-cn-chengdu.aliyuncs.com/test/otherType/switch-config.png)



## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=cjh-store/cc&type=Date)](https://star-history.com/#cjh-store/cc&Date)

---


