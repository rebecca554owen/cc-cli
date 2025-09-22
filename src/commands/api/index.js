const chalk = require('chalk');
const { program } = require('commander');

const switchCommand = require('./switch');
const listCommand = require('./list');
const addCommand = require('./add');
const editCommand = require('./edit');
const deleteCommand = require('./delete');
const { showApiMenu } = require('../../utils/ui');

/**
 * API命令模块
 */
class ApiCommand {
  constructor() {
    this.subCommands = {
      switch: switchCommand,
      list: listCommand,
      add: addCommand,
      edit: editCommand,
      delete: deleteCommand
    };
  }

  /**
   * 注册API命令到commander
   * @param {Object} program commander实例
   */
  async register(program) {
    const apiCommand = program
      .command('api')
      .description('API配置管理')
      .option('-l, --list', '列出所有配置')
      .option('-a, --add', '添加新配置')
      .option('-e, --edit', '编辑配置文件')
      .option('-d, --delete', '删除配置')
      .option('-h, --help', '显示API命令帮助信息')
      .action(async (options) => {
        if (options.help) {
          this.showHelp();
          return;
        }

        if (options.list) {
          await this.subCommands.list.execute([]);
          return;
        }

        if (options.add) {
          await this.subCommands.add.execute([]);
          return;
        }

        if (options.edit) {
          await this.subCommands.edit.execute([]);
          return;
        }

        if (options.delete) {
          await this.subCommands.delete.execute([]);
          return;
        }

        // 默认显示交互式菜单
        await this.showInteractiveMenu();
      });

    // 添加帮助信息
    apiCommand.addHelpText('after', `

示例:
  cc api              显示交互式API管理菜单
  cc api --list       列出所有API配置
  cc api --add        添加新的API配置
  cc api --edit       编辑配置文件
  cc api --delete     删除API配置
  cc api --help       显示此帮助信息

配置文件位置:
  ~/.claude/api_configs.json    API配置文件（包含当前激活配置）

注意:
  - 如果URL或Token只有一个选项，会自动选择
  - 当前使用的配置会用 ⭐ 标识
  - 所有操作都会实时更新Claude Code配置
`);
  }

  /**
   * 显示API命令帮助信息
   */
  showHelp() {
    console.log(chalk.cyan.bold('📡 CC API 配置管理工具帮助'));
    console.log();
    console.log(chalk.white('用法:'));
    console.log('  cc api [选项]');
    console.log();
    console.log(chalk.white('选项:'));
    console.log('  -l, --list     列出所有API配置并标识当前使用的配置');
    console.log('  -a, --add      添加新的API配置');
    console.log('  -e, --edit     编辑配置文件');
    console.log('  -d, --delete   删除API配置');
    console.log('  -h, --help     显示此帮助信息');
    console.log();
    console.log(chalk.white('交互式功能:'));
    console.log('  🔄 切换配置    选择不同的API站点、URL和Token');
    console.log('  📋 查看配置    查看所有配置的详细信息');
    console.log('  ➕ 添加配置    添加新的API配置项');
    console.log('  ✏️  编辑配置    打开配置文件进行编辑');
    console.log('  🗑️  删除配置    删除不需要的配置');
    console.log();
    console.log(chalk.white('智能选择:'));
    console.log('  - 当URL只有1个时，自动选择，不显示选择界面');
    console.log('  - 当Token只有1个时，自动选择，不显示选择界面');
    console.log('  - 当前使用的配置会用 ⭐ 特殊标识');
    console.log();
    console.log(chalk.white('配置文件:'));
    console.log(`  ${chalk.gray('~/.claude/api_configs.json')}    API配置文件（包含当前激活配置）`);
    console.log();
    console.log(chalk.white('示例:'));
    console.log(`  ${chalk.green('cc api')}           # 显示交互式菜单`);
    console.log(`  ${chalk.green('cc api --list')}    # 列出所有配置`);
    console.log(`  ${chalk.green('cc api --add')}     # 添加新配置`);
    console.log(`  ${chalk.green('cc api --edit')}    # 编辑配置文件`);
    console.log(`  ${chalk.green('cc api --delete')}  # 删除配置`);
    console.log(`  ${chalk.green('cc api --help')}    # 显示帮助信息`);
  }

  /**
   * 显示交互式API菜单
   */
  async showInteractiveMenu() {
    try {
      const choice = await showApiMenu();

      switch (choice) {
        case 'switch':
          await this.subCommands.switch.execute([]);
          break;
        case 'list':
          await this.subCommands.list.execute([]);
          break;
        case 'add':
          await this.subCommands.add.execute([]);
          break;
        case 'edit':
          await this.subCommands.edit.execute([]);
          break;
        case 'delete':
          await this.subCommands.delete.execute([]);
          break;
        case 'back':
          return;
        default:
          console.log(chalk.red('❌ 无效选择'));
      }
    } catch (error) {
      console.error(chalk.red('❌ API菜单操作失败:'), error.message);
      throw error;
    }
  }

  /**
   * 执行API命令
   * @param {Array} args 参数
   */
  async execute(args = []) {
    await this.showInteractiveMenu();
  }
}

module.exports = new ApiCommand();