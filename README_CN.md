# CC CLI - Claude Code / Codex 配置管理工具

**Language**: [中文](README_CN.md) | [English](README.md)

[![NPM版本](https://img.shields.io/npm/v/@rebecca554owen/cc-cli.svg)](https://www.npmjs.com/package/@rebecca554owen/cc-cli)
[![下载量](https://img.shields.io/npm/dm/@rebecca554owen/cc-cli.svg)](https://www.npmjs.com/package/@rebecca554owen/cc-cli)
![License](https://img.shields.io/badge/license-MIT-green.svg)

一键切换 Claude Code / Codex 配置的命令行工具。支持多站点、多 Token 管理，智能合并配置，无需手动修改配置文件。

## 📸 界面预览

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│         ___ ___    ___ _    ___                      │
│        / __/ __|  / __| |  |_ _|                     │
│       | (_| (__  | (__| |__ | |                      │
│        ______|  ___|____|___|                        │
│                                                      │
│      Claude Code配置管理CLI工具                      │
│             v2.10.0 (最新)                          │
│                                                      │
│   🤖 当前激活配置                                    │
│   ══════════════════════════════════════════════════ │
│   📡 Claude Code: siliconflow                       │
│     BASEURL: http://192.168.5.10:3001/proxy/siliconflow │
│     TOKEN: sk-bTRkGXYhv3w3...                        │
│     MODEL: deepseek-ai/DeepSeek-V3.1-Terminus        │
│                                                      │
│   💻 Codex API: api                                  │
│     BASEURL: http://192.168.5.10:3001/proxy/coreshub/v1 │
│     API Key: sk-bTRkGXYhv3w3...                      │
│     MODEL: DeepSeek-V3.1-Terminus                    │
│                                                      │
│   💡 快速使用: cc use | cc usex                      │
│   🛠️  管理工具: cc api | cc apix                     │
│                                                      │
└──────────────────────────────────────────────────────┘

? 请选择功能模块：
  📡 Claude 配置管理 - Claude Code API 
  💻 Codex  配置管理 - OpenAI Codex API 
  📊 查看当前API状态 - Status
  📦 备份与恢复配置 - Backup & Restore
  ❓ 查看命令帮助文档 - Help
  ──────────────
  🚪 Exit - 退出
```

## 📑 目录

- [✨ 核心功能](#-核心功能)
- [📦 安装使用](#-安装使用)
- [🚀 使用方法](#-使用方法)
- [📋 配置文件说明](#-配置文件说明)
- [🔄 工作原理](#-工作原理)

## ✨ 核心功能

- 🔄 **一键切换** - 快速切换不同的 API 站点和 Token
- 📋 **配置管理** - 查看、添加、删除 API 配置
- 🔗 **智能合并** - 自动与 Claude Code 配置文件同步
- ⚙️ **完整支持** - 支持所有 Claude Code 配置项
- 💻 **Codex 支持** - 管理 Codex 配置，支持自动模式
- 🚀 **自动模式** - 无条件批准所有工具使用请求（Claude Code / Codex）

## 📦 安装使用

```bash
# 全局安装
npm install -g @rebecca554owen/cc-cli
```

## 🚀 使用方法

### 快速开始

```bash
# 启动交互式界面
cc

# 如果遇到命令冲突，使用备用命令
cc-cli
```

**⚠️ 命令冲突解决**：如果遇到 `clang: error` 错误，说明 `cc` 命令与系统的 C 编译器冲突，请使用 `cc-cli` 命令。

### Claude Code API 命令

```bash
# 交互式管理界面
cc api

# 快速切换配置（推荐）
cc use

# 命令行操作
cc api --list        # 列出所有配置
cc api --add         # 添加新配置
cc api --edit        # 编辑配置文件
cc api --delete      # 删除配置
cc api --help        # 显示帮助
```

### Codex API 命令

```bash
# 交互式管理界面
cc apix

# 快速切换配置（推荐）
cc usex

# 命令行操作
cc apix --list       # 列出所有配置
cc apix --edit       # 编辑配置文件
cc apix --auto       # 开启/关闭自动模式
cc apix --help       # 显示帮助
```

### 其他命令

```bash
# 查看当前配置状态
cc status

# 备份与恢复配置
cc backup

# 查看全局帮助
cc --help
```

## 📋 配置文件说明

### 配置文件位置

- **API 配置**: `~/.claude/api_configs.json`
- **Claude Code**: `~/.claude/settings.json`
- **Codex**: `~/.codex/config.toml`、`~/.codex/auth.json`

### 智能配置合并

工具会自动将你选择的 API 配置与现有的 Claude Code/Codex 设置合并，保留所有原有配置项，只更新 API 相关设置。

### 配置格式示例

#### 1. Claude Code 配置
```json
{
  "sites": {
    "Claude 示例": {
      "url": "https://api.anthropic.com",
      "description": "Claude Code API 配置",
      "claude": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
          "ANTHROPIC_AUTH_TOKEN": {
            "主力Token": "sk-ant-api03-xxxxxxxxxxxxxx",
            "备用Token": "sk-ant-api03-yyyyyyyyyyyyyy"
          }
        }
      }
    }
  }
}
```

#### 2. Codex 配置（高级认证）
```json
{
  "sites": {
    "Codex 示例": {
      "url": "https://api.openai.com",
      "description": "Codex 自定义认证配置",
      "codex": {
        "OPENAI_API_KEY": {
          "主要Key": "sk-xxxxxxxxxxxxxx",
          "测试Key": "sk-yyyyyyyyyyyyyy"
        },
        "model": "gpt-5",
        "model_reasoning_effort": "high",
        "model_providers": {
          "deepseek": {
            "name": "DeepSeek API",
            "base_url": "https://api.deepseek.com/v1",
            "wire_api": "chat",
            "requires_openai_auth": false,
            "http_headers": {
              "Authorization": "Bearer sk-bTRkGXYhv3w3odoM46291721A3Eb40Af99E08cEe8f3458Ad"
            }
          }
        }
      }
    }
  }
}
```

### Codex 高级认证

Codex 支持两种认证模式：

#### 1. 标准 OpenAI 认证
```json
"model_providers": {
  "openai": {
    "name": "OpenAI",
    "base_url": "https://api.openai.com/v1",
    "wire_api": "responses",
    "requires_openai_auth": true
  }
}
```

#### 2. 自定义 HTTP 头认证
```json
"model_providers": {
  "custom_api": {
    "name": "自定义 API",
    "base_url": "https://api.example.com/v1",
    "wire_api": "chat",
    "requires_openai_auth": false,
    "http_headers": {
      "Authorization": "Bearer sk-bTRkGXYhv3w3odoM46291721A3Eb40Af99E08cEe8f3458Ad",
      "X-API-Key": "custom-key",
      "Content-Type": "application/json"
    }
  }
}
```

**Wire API 模式：**
- `"responses"` - 标准 OpenAI 响应格式
- `"chat"` - 聊天完成格式（需要 `http_headers`）

## 🔄 工作原理

### 自动模式说明

**Claude Code 自动模式**：
- 添加 hooks 配置到 `~/.claude/settings.json`
- 使用 `cc claude-auto` 命令进行自动工具批准
- 自动批准所有工具使用请求，无需手动确认

**Codex 自动模式**：
- 设置 `approval_policy: "never"`
- 设置 `sandbox_mode: "danger-full-access"`
- 最宽松的执行权限
- 允许所有系统操作无需确认

⚠️ **警告**：自动模式会无条件批准所有操作，请谨慎使用！

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=rebecca554owen/cc-cli&type=Date)](https://star-history.com/#rebecca554owen/cc-cli&Date)

---

**开源协议**: MIT License
