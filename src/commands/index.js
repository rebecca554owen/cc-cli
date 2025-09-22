const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');

/**
 * 命令注册中心
 * 自动扫描和注册所有命令模块
 */
class CommandRegistry {
  constructor() {
    this.commands = new Map();
    this.commandsDir = path.join(__dirname);
  }

  /**
   * 注册所有命令到commander
   * @param {Object} program commander实例
   */
  async registerCommands(program) {
    try {
      // 注册API命令
      const apiCommand = require('./api');
      this.commands.set('api', apiCommand);
      await apiCommand.register(program);

      // 注册API快速使用命令
      const apiUseCommand = require('./api/apiuse');
      this.commands.set('apiuse', apiUseCommand);
      program
        .command('apiuse')
        .description('快速切换 Claude Code API 配置')
        .action(async () => {
          await this.executeCommand('apiuse', []);
        });

      // 注册Codex命令（仅用于交互式菜单，不注册独立命令）
      const codexCommand = require('./codex');
      this.commands.set('codexapi', codexCommand);

      // 注册状态命令
      program
        .command('status')
        .description('查看当前配置状态')
        .action(async () => {
          await this.executeCommand('status', []);
        });

      // 注册帮助命令
      program
        .command('help')
        .description('显示帮助信息')
        .action(async () => {
          program.help();
        });

    } catch (error) {
      console.error(chalk.red('❌ 命令注册失败:'), error.message);
      throw error;
    }
  }

  /**
   * 执行指定命令
   * @param {string} commandName 命令名称
   * @param {Array} args 参数
   */
  async executeCommand(commandName, args = []) {
    try {
      if (commandName === 'status') {
        await this.showStatus();
        return;
      }

      if (commandName === 'help') {
        await this.showHelp();
        return;
      }

      if (commandName === 'apiuse') {
        const apiUseCommand = this.commands.get('apiuse');
        await apiUseCommand.execute(args);
        return;
      }

      const command = this.commands.get(commandName);
      if (!command) {
        throw new Error(`未找到命令: ${commandName}`);
      }

      if (typeof command.execute === 'function') {
        await command.execute(args);
      } else {
        throw new Error(`命令 ${commandName} 未实现execute方法`);
      }
    } catch (error) {
      console.error(chalk.red(`❌ 执行命令 ${commandName} 失败:`), error.message);
      throw error;
    }
  }

  /**
   * 显示帮助信息
   */
  async showHelp() {
    const { formatMainHelp } = require('../utils/formatter');
    console.log(formatMainHelp());
  }

  /**
   * 显示当前状态
   */
  async showStatus() {
    const ConfigManager = require('../core/ConfigManager');
    const configManager = new ConfigManager();
    
    try {
      const currentConfig = await configManager.getCurrentConfig();
      let allConfigs = null;
      
      // 尝试获取所有配置，用于解析URL
      try {
        allConfigs = await configManager.getAllConfigs();
      } catch (error) {
        // 忽略错误，继续显示基本状态
      }
      
      const { formatStatus } = require('../utils/formatter');
      
      console.log(formatStatus(currentConfig, allConfigs));
    } catch (error) {
      console.log(chalk.yellow('⚠️  当前没有配置或配置文件不存在'));
    }
  }

  /**
   * 获取所有已注册的命令
   */
  getCommands() {
    return Array.from(this.commands.keys());
  }
}

module.exports = CommandRegistry;