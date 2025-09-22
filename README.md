# CC CLI - Claude Code 配置管理工具

[![NPM版本](https://img.shields.io/npm/v/@cjh0/cc-cli.svg)](https://www.npmjs.com/package/@cjh0/cc-cli)
[![下载量](https://img.shields.io/npm/dm/@cjh0/cc-cli.svg)](https://www.npmjs.com/package/@cjh0/cc-cli)
![License](https://img.shields.io/badge/license-MIT-green.svg)

一键切换 Claude Code API 配置的命令行工具。支持多站点、多Token管理，智能合并配置，无需手动修改文件。

## ✨ 核心功能

- 🔄 **一键切换** - 快速切换不同的 API 站点和 Token
- 📋 **配置管理** - 查看、添加、删除 API 配置
- 🔗 **智能合并** - 自动与 Claude Code 配置文件同步
- ⚙️ **完整支持** - 支持所有 Claude Code 配置项

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
# 或者
cc-cli api

# 查看当前状态
cc status

# 查看帮助
cc --help
```

**⚠️ 命令冲突解决**：如果遇到 `clang: error` 错误，说明 `cc` 命令与系统的C编译器冲突，请使用 `cc-cli` 命令

运行 `cc` 后会显示交互式菜单，按方向键选择功能：
- 📡 API配置管理 - 切换/查看/添加/删除配置
- 📊 状态查看 - 查看当前使用的配置
- ❓ 帮助文档 - 显示帮助信息

## 📋 配置文件说明

### 智能配置合并

工具会自动将你选择的API配置与现有的 Claude Code 设置合并，保留所有原有配置项，只更新API相关设置。

### 配置文件位置

- `~/.claude/api_configs.json` - 存储API配置
- `~/.claude/settings.json` - Claude Code主配置文件

### 配置格式示例

```json
{
  "sites": {
    "站点名称": {
      "url": "https://api.example.com",
      "description": "站点描述",
      "config": {
        "env": {
          "ANTHROPIC_BASE_URL": "https://api.example.com",
          "ANTHROPIC_AUTH_TOKEN": {
            "Token1": "sk-xxxxxxxxxxxxxx",
            "Token2": "sk-yyyyyyyyyyyyyy"
          }
        },
        "model": "claude-3-5-sonnet-20241022"
      }
    }
  }
}
```

## 📸 界面预览
![CC CLI 界面预览](https://qm-cloud.oss-cn-chengdu.aliyuncs.com/test/otherType/1758509266008.png)



#### 配置切换界面
![配置切换界面](https://qm-cloud.oss-cn-chengdu.aliyuncs.com/test/otherType/switch-config.png)

## 🔄 工作原理

1. **选择配置** - 从列表中选择API站点和Token
2. **智能合并** - 自动与现有Claude Code配置合并
3. **立即生效** - 无需重启，Claude Code立即使用新配置

## 📄 许可证

本项目基于 MIT 许可证开源。

---

**CC CLI** - 让 Claude Code 配置管理变得简单！ 🚀
