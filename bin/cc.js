#!/usr/bin/env node

import { program } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 读取 package.json
const packageJson = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));

// 设置程序信息
program
  .name('cc')
  .description('Claude Code配置管理CLI工具')
  .version(packageJson.version);

// 添加详细帮助文本
program.addHelpText('after', `

主要功能:
  📡 Claude 配置管理      切换、查看、添加、删除 Claude API 配置
  💻 Codex  配置管理      切换、查看、添加、删除 Codex  API 配置

  📊 状态查看             查看当前使用的配置信息

基本命令:
  cc              启动交互式界面
  cc api          Claude配置管理
  cc use          快速切换 Claude Code API 配置
  cc apix         Codex配置管理
  cc usex         快速切换 Codex API 配置

  cc status       查看当前状态

快速使用示例:
  cc                   # 启动交互式界面
  cc status            # 查看当前配置状态
  cc api               # Claude 配置管理菜单
  cc apix              # Codex 配置管理菜单
  cc api --list        # 列出所有 Claude Code 配置
  cc apix --list       # 列出所有 Codex 配置
  cc api --switch      # 切换 Claude Code 配置
  cc apix --switch     # 切换 Codex 配置
  cc api --auto        # 开启/关闭自动模式
  cc apix --auto       # 开启/关闭自动模式
  cc use               # 快速切换 Claude Code 配置
  cc usex              # 快速切换 Codex 配置

配置文件:
  ~/.cc-cli/api_configs.json    统一配置文件
  ~/.claude/settings.json       Claude Code 配置
  ~/.codex/config.toml          Codex 配置

`);

// 导入主程序入口
const { default: main } = await import('../src/index.js');

// 启动主程序
main(program)
  .catch(error => {
    console.error('❌ 程序执行错误:', error.message);
    process.exit(1);
  });