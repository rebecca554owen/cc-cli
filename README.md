# CC CLI - Claude Code Configuration Management Tool

**Language**: [中文](README_CN.md) | [English](README.md)

[![NPM Version](https://img.shields.io/npm/v/@rebecca554owen/cc-cli.svg)](https://www.npmjs.com/package/@rebecca554owen/cc-cli)
[![Downloads](https://img.shields.io/npm/dm/@rebecca554owen/cc-cli.svg)](https://www.npmjs.com/package/@rebecca554owen/cc-cli)
![License](https://img.shields.io/badge/license-MIT-green.svg)

A command-line tool for one-click switching of Claude Code / Codex configurations. Supports multi-site, multi-token management, intelligent configuration merging, and no manual file editing required.

## 📸 Interface Preview

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   ____   ____     ____  _      ___                  │
│  / ___| / ___|   / ___|| |    |_ _|                 │
│ | |    | |      | |    | |     | |                  │
│ | |___ | |___   | |___ | |___  | |                  │
│  \____| \____|   \____||_____||___|                 │
│                                                      │
│  CC CLI 终端配置管理工具                             │
│  v3.0.0 (最新)                                       │
│                                                      │
└──────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────┐
│ 📊 当前状态 & 工具                                    │
│                                                      │
│ 🤖 当前激活配置                                      │
│ ════════════════════════════════════════════════════ │
│ 📡 Claude Code: Claude Official                     │
│   站点: Claude Official                             │
│   URL: https://api.anthropic.com...                 │
│                                                      │
│ 💻 Codex API: OpenAI Official                       │
│   站点: OpenAI Official                             │
│   服务商: OpenAI                                    │
│   URL: https://api.openai.com...                    │
│                                                      │
│ ⚡ Crush AI: DeepSeek API                          │
│   站点: DeepSeek API                               │
│   URL: https://api.deepseek.com...                 │
│                                                      │
│ 💡 快速使用: cc use | cc usex | cc usec             │
│                                                      │
│ 🛠️  管理工具: cc api | cc apix | cc apic           │
└──────────────────────────────────────────────────────┘

? 请选择功能模块：
  📡 Claude配置管理 - Claude Code API
  💻 Codex配置管理 - Codex API
  💘 Crush配置管理 - Crush AI API
  📊 查看当前状态 - Status
  ❓ 帮助文档 - Help
  ──────────
  🚪 Exit - 退出
```

## 📑 Table of Contents

- [✨ Core Features](#-core-features)
- [📦 Installation](#-installation)
- [🚀 Usage](#-usage)
- [📋 Configuration File Description](#-configuration-file-description)
- [🔄 Working Principle](#-working-principle)

## ✨ Core Features

- 🔄 **One-Click Switching** - Quickly switch between different API sites and tokens
- 📋 **Configuration Management** - View, add, and delete API configurations
- 🔗 **Intelligent Merging** - Automatically sync with Claude Code/Codex/Crush configuration files
- ⚙️ **Full Support** - Supports all Claude Code/Codex/Crush configuration items
- 💻 **Codex Support** - Manage Codex configurations with auto mode support
- 💘 **Crush Support** - Manage Crush AI configurations with auto mode support
- 🚀 **Auto Mode** - Unconditionally approve all tool usage requests (Claude Code / Codex / Crush)

## 📦 Installation

```bash
# Global installation
npm install -g @rebecca554owen/cc-cli
```

## 🚀 Usage

### Quick Start

```bash
# Start interactive interface
cc

# If you encounter command conflicts, use the backup command
cc-cli
```

**⚠️ Command Conflict Resolution**: If you encounter `clang: error` errors, it means the `cc` command conflicts with the system's C compiler, please use the `cc-cli` command.

### Claude Code API Commands

```bash
# Interactive management interface
cc api

# Quick switch configuration (Recommended)
cc use

# Command line operations
cc api --list        # List all configurations
cc api --switch      # Switch configuration
cc api --add         # Add new configuration
cc api --edit        # Edit configuration file
cc api --delete      # Delete configuration
cc api --help        # Show help
```

### Codex API Commands

```bash
# Interactive management interface
cc apix

# Quick switch configuration (Recommended)
cc usex

# Command line operations
cc apix --list       # List all configurations
cc apix --switch     # Switch configuration
cc apix --edit       # Edit configuration file
cc apix --auto       # Enable/Disable auto mode
cc apix --help       # Show help
```

### Crush AI Commands

```bash
# Interactive management interface
cc apic

# Quick switch configuration (Recommended)
cc usec

# Command line operations
cc apic --list       # List all configurations
cc apic --switch     # Switch configuration
cc apic --add        # Add new configuration
cc apic --edit       # Edit configuration file
cc apic --delete     # Delete configuration
cc apic --help       # Show help
```

### Other Commands

```bash
# View current configuration status
cc status

# View global help
cc --help
```

## 📋 Configuration File Description

### Configuration File Locations

- **API Configuration**: `~/.claude/api_configs.json`
- **Claude Code**: `~/.claude/settings.json`
- **Codex**: `~/.codex/config.toml`, `~/.codex/auth.json`

### Intelligent Configuration Merging

The tool will automatically merge your selected API configuration with existing Claude Code/Codex settings, preserving all original configuration items and only updating API-related settings.

### Configuration Format Examples

#### 1. Claude Code Configuration
```json
{
  "sites": {
    "Claude Example": {
      "url": "https://api.anthropic.com",
      "description": "Claude Code API configuration",
      "claude": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
          "ANTHROPIC_AUTH_TOKEN": {
            "Primary Token": "sk-ant-api03-xxxxxxxxxxxxxx",
            "Backup Token": "sk-ant-api03-yyyyyyyyyyyyyy"
          }
        }
      }
    }
  }
}
```

#### 2. Codex Configuration (Advanced Authentication)
```json
{
  "sites": {
    "Codex Example": {
      "url": "https://api.openai.com",
      "description": "Codex with custom authentication",
      "codex": {
        "OPENAI_API_KEY": {
          "Primary Key": "sk-xxxxxxxxxxxxxx",
          "Test Key": "sk-yyyyyyyyyyyyyy"
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

#### 3. Crush Configuration
```json
{
  "sites": {
    "Crush Example": {
      "url": "https://api.crush.ai",
      "description": "Crush AI configuration",
      "crush": {
        "env": {
          "CRUSH_API_KEY": {
            "Primary Key": "crush-xxxxxxxxxxxxxx",
            "Backup Key": "crush-yyyyyyyyyyyyyy"
          },
          "CRUSH_BASE_URL": "https://api.crush.ai"
        }
      }
    }
  }
}
```



### Codex Advanced Authentication

Codex supports two authentication modes:

#### 1. Standard OpenAI Authentication
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

#### 2. Custom Authentication with HTTP Headers
```json
"model_providers": {
  "custom_api": {
    "name": "Custom API",
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

**Wire API Modes:**
- `"responses"` - Standard OpenAI response format
- `"chat"` - Chat completion format (requires `http_headers`)

## 🔄 Working Principle

### Auto Mode Explanation

**Claude Code Auto Mode**:
- Adds hooks configuration to `~/.claude/settings.json`
- Uses `cc claude-auto` command for automatic tool approval
- Automatically approves all tool usage requests without manual confirmation

**Codex Auto Mode**:
- Set `approval_policy: "never"`
- Set `sandbox_mode: "danger-full-access"`
- Most permissive execution permissions
- Allows all system operations without confirmation

**Crush Auto Mode**:
- Set `auto_mode: true` in crush.json configuration
- Uses `cc crush-auto` command for automatic tool approval
- Automatically approves all tool usage requests

⚠️ **Warning**: Auto mode will unconditionally approve all operations, use with caution!

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=rebecca554owen/cc-cli&type=Date)](https://star-history.com/#rebecca554owen/cc-cli&Date)

---

**License**: MIT License
