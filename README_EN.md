# CC CLI - Claude Code Configuration Management Tool

**Language**: [中文](README.md) | [English](README_EN.md)

[![NPM Version](https://img.shields.io/npm/v/@cjh0/cc-cli.svg)](https://www.npmjs.com/package/@cjh0/cc-cli)
[![Downloads](https://img.shields.io/npm/dm/@cjh0/cc-cli.svg)](https://www.npmjs.com/package/@cjh0/cc-cli)
![License](https://img.shields.io/badge/license-MIT-green.svg)

A command-line tool for one-click switching of Claude Code API configurations. Supports multi-site, multi-token management, intelligent configuration merging, and no manual file editing required.

## ✨ Core Features

- 🔄 **One-Click Switching** - Quickly switch between different API sites and tokens
- 📋 **Configuration Management** - View, add, and delete API configurations
- 🔗 **Intelligent Merging** - Automatically sync with Claude Code configuration files
- ⚙️ **Full Support** - Supports all Claude Code configuration items
- 💻 **Codex Support** - Manage Claude Code Codex configurations (Claude models only), support enabling/disabling yolo mode
- ☁️ **WebDAV Backup** - Support cloud backup and restore of configuration files (Nutstore, other standard WebDAV, etc.)

## 📦 Installation

```bash
# Global installation
npm install -g @cjh0/cc-cli
```

## 🚀 Usage

### Main Commands

```bash
# Start interactive interface
cc
# If you encounter command conflicts, use the backup command
cc-cli

# API configuration management
cc api

# Quick switch API configuration
cc apiuse

# View current status
cc status

# View help
cc --help
```

**⚠️ Command Conflict Resolution**: If you encounter `clang: error` errors, it means the `cc` command conflicts with the system's C compiler, please use the `cc-cli` command

Running `cc` will display an interactive menu, use arrow keys to select features:

- 📡 Claude Code API - Switch/view/add/delete Claude Code API configurations
- 💻 Codex API - Manage Claude Code Codex configurations (switch configurations, YOLO mode)
- 🔄 Backup - Backup and restore configuration files to/from WebDAV cloud storage
- 📊 Status View - View currently used configurations
- ❓ Help Documentation - Display help information

## 📋 Configuration File Description

### Intelligent Configuration Merging

The tool will automatically merge your selected API configuration with existing Claude Code settings, preserving all original configuration items and only updating API-related settings.

### Configuration Format Example

```json
{
  "sites": {
    "XX Public Site": {
      "url": "https://api.example.com", // (Optional) Site address to remember public sites, will support one-click opening later
      "description": "Supports both Claude Code and Codex", // Optional, can be left empty
      // Claude Code API configuration (minimal config, compatible with most official configurations, will override config file)
      "claude": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.example.com",
          "ANTHROPIC_AUTH_TOKEN": {
            "Token1": "sk-xxxxxxxxxxxxxx", // Supports multiple tokens
            "Token2": "sk-yyyyyyyyyyyyyy"
          }
        },
      },
      // Codex API configuration (minimal config, compatible with most official configurations)
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
    "XX Public Site 2": {
      ...
    }
  }
}
```

> **⚠️ Important Notes**:
>
> - `claude` field: For Claude Code API configuration (recommended)
> - `config` field: For Claude Code API configuration (backward compatibility)
> - `codex` field: For Codex API configuration, only supports Claude models
> - All three configurations can coexist in the same site for dual support
> - YOLO mode: Automatically enables `approval_policy=never` and `sandbox_mode=danger-full-access`

## 🔄 Working Principle

### Claude Code API Configuration Process

1. **Select Configuration** - Choose API site and token from the list
2. **Intelligent Merging** - Automatically merge with existing Claude Code configuration
3. **Immediate Effect** - No restart required, Claude Code uses new configuration immediately

### Codex API Configuration Process

1. **Select Site** - Choose from sites that support Codex
2. **Select Provider** - Choose service provider from model_providers
3. **Generate Configuration** - Automatically generate config.toml and auth.json files
4. **YOLO Mode** - Optionally enable the most permissive configuration mode

### WebDAV Backup Feature

Supports backing up configuration files to cloud storage to ensure configuration security:

#### Supported WebDAV Services
- **Nutstore** - `https://dav.jianguoyun.com/dav/`
- **Other WebDAV Services** - Any standard WebDAV protocol service

#### Backup Content
- **CC-CLI Configuration** - API configuration files
- **Claude Code Configuration** - settings.json, CLAUDE.md, .claude.json
- **Claude Code Directories** - agents/, commands/ directories (recursive backup)
- **Codex Configuration** - config.toml, AGENTS.md

#### Feature Characteristics
- 🔐 **Secure Authentication** - Supports username and password authentication
- 📦 **Selective Backup** - Can choose to backup specific configuration categories
- 🕒 **Automatic Cleanup** - Automatically keeps the latest 5 backup files
- 🔄 **Complete Recovery** - Supports selecting backup files and configuration categories for recovery
- 📊 **Status Monitoring** - Real-time display of backup status and cloud connectivity

## 📸 Interface Preview

<img src="https://qm-cloud.oss-cn-chengdu.aliyuncs.com/test/otherType/1758509266008.png" alt="CC CLI Interface Preview" width="50%">

#### Configuration Switching Interface

![Configuration Switching Interface](https://qm-cloud.oss-cn-chengdu.aliyuncs.com/test/otherType/switch-config.png)

## 📄 License

This project is open source under the MIT License.

---

**CC CLI** - Making Claude Code configuration management simple! 🚀