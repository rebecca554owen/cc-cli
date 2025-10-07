import path from 'path';
import fs from 'fs-extra';
import chalk from 'chalk';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      const { default: apiCommand } = await import('./claude/index.js');
      this.commands.set('api', apiCommand);
      await apiCommand.register(program);

      // 注册API快速使用命令
      const { default: apiUseCommand } = await import('./claude/apiuse.js');
      this.commands.set('use', apiUseCommand);
      await apiUseCommand.register(program);

      // 注册Codex命令
      const { default: codexCommand } = await import('./codex/index.js');
      this.commands.set('apix', codexCommand);
      await codexCommand.register(program);

      // 注册Codex快速使用命令
      const { default: codexApiUseCommand } = await import('./codex/apiuse.js');
      this.commands.set('usex', codexApiUseCommand);
      await codexApiUseCommand.register(program);

      // 注册备份命令
      const { default: backupCommand } = await import('./backup/index.js');
      this.commands.set('backup', backupCommand);
      await backupCommand.register(program);

      // 注册状态命令
      program
        .command('status')
        .description('查看当前配置状态               ')
        .action(async () => {
          await this.executeCommand('status', []);
        });

      // 注册Claude自动模式Hook命令（供Claude Code hooks内部调用）
      const { default: claudeAutoCommand } = await import('./claude/auto.js');
      program
        .command('claude-auto')
        .description('Claude Code自动模式钩子处理器（内部使用）')
        .option('-h, --help', '显示帮助信息')
        .action(async (options) => {
          if (options.help) {
            claudeAutoCommand.showHelp();
            return;
          }
          await claudeAutoCommand.execute();
        });



      // 注册帮助命令
      program
        .command('help')
        .description('显示帮助信息')
        .action(async () => {
          console.clear();
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

      if (commandName === 'backup') {
        const command = this.commands.get('backup');
        if (command) {
          await command.execute(args);
        }
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
    // 清屏
    console.clear();
    const { formatMainHelp } = await import('../utils/formatter.js');
    console.log(formatMainHelp());
  }

  /**
   * 显示当前状态
   */
  async showStatus() {
    const { default: ManagerConfig } = await import('../core/manager-config.js');
    const configManager = new ManagerConfig();

    try {
      const currentConfig = await configManager.getCurrentConfig();
      const currentCodexConfig = await configManager.getCurrentCodexConfig();

      const { formatStatus } = await import('../utils/formatter.js');
      
      // 读取版本信息
      const { readFileSync } = await import('fs');
      const { join, dirname } = await import('path');
      const { fileURLToPath } = await import('url');
      
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const pkg = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf8'));

      console.log(formatStatus(currentConfig, currentCodexConfig, pkg.version));
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

export default CommandRegistry;
