import chalk from 'chalk';

import switchCommand from './switch.js';
import listCommand from './list.js';
import addCommand from './add.js';
import editCommand from './edit.js';
import deleteCommand from './delete.js';
import autoManager from '../../config/auto-manager-claude.js';
import { BaseCommand } from '../../utils/base-command.js';
import { createGenericMenu } from '../../utils/ui.js';

// Claude配置帮助信息
function showClaudeHelp() {
  console.log(chalk.cyan.bold('📡 CC API 配置管理工具帮助'));
  console.log();
  console.log(chalk.white('用法:'));
  console.log('  cc api [选项]');
  console.log();
  console.log(chalk.white('选项:'));
  console.log('  -a, --add        添加新的API配置');
  console.log('  -d, --delete     删除API配置');
  console.log('  -e, --edit       编辑配置文件');
  console.log('  -h, --help       显示此帮助信息');
  console.log('  -l, --list       列出所有API配置并标识当前使用的配置');
  console.log('  -s, --switch     切换配置');
  console.log('  -y, --auto       开启或关闭自动模式');
  console.log();
  console.log(chalk.white('交互式功能:'));
  console.log('  🔄 切换配置    选择不同的API站点、URL和Token');
  console.log('  📋 查看配置    查看所有配置的详细信息');
  console.log('  ➕ 添加配置    添加新的API配置项');
  console.log('  ✏️ 编辑配置    打开配置文件进行编辑');
  console.log('  🗑️ 删除配置    删除不需要的配置');
  console.log('  🚀 自动模式    开启/关闭Claude Code自动模式（无需手动确认工具使用）');
  console.log();
  console.log(chalk.white('智能选择:'));
  console.log('  - 当URL只有1个时，自动选择，不显示选择界面');
  console.log('  - 当Token只有1个时，自动选择，不显示选择界面');
  console.log('  - 当前使用的配置会用绿色特殊标识，当前站点用⭐标识');
  console.log();
  console.log(chalk.white('配置文件:'));
  console.log(`  ${chalk.gray('~/.cc-cli/api_configs.json')}    API配置文件（包含当前激活配置）`);
  console.log(`  ${chalk.gray('~/.claude/settings.json')}       Claude Code全局配置文件`);
  console.log(`  ${chalk.gray('~/.claude/hooks/')}              自动模式脚本目录`);
  console.log();
  console.log(chalk.white('示例:'));
  console.log(`  ${chalk.green('cc api')}           # 显示交互式菜单`);
  console.log(`  ${chalk.green('cc api --add')}     # 添加新配置`);
  console.log(`  ${chalk.green('cc api --auto')}    # 开启/关闭自动模式`);
  console.log(`  ${chalk.green('cc api --delete')}  # 删除配置`);
  console.log(`  ${chalk.green('cc api --edit')}    # 编辑配置文件`);
  console.log(`  ${chalk.green('cc api --help')}    # 显示帮助信息`);
  console.log(`  ${chalk.green('cc api --list')}    # 列出所有配置`);
  console.log(`  ${chalk.green('cc api --switch')}  # 切换Claude配置`);
}

// Claude API命令类
class ApiCommand extends BaseCommand {
  constructor() {
    // 先将选项配置好，避免在super()之前使用this
    const options = {
      commandName: 'api',
      description: 'Claude配置管理',
      subCommands: {
        switch: switchCommand,
        list: listCommand,
        add: addCommand,
        edit: editCommand,
        delete: deleteCommand
      },
      autoManager: autoManager,
      helpFunc: showClaudeHelp,
      menuFunc: null, // 先设为null，后面再绑定
      optionsConfig: {
        list: { flag: '-l, --list', description: '列出所有配置' },
        switch: { flag: '-s, --switch', description: '切换Claude配置' },
        add: { flag: '-a, --add', description: '添加新配置' },
        edit: { flag: '-e, --edit', description: '编辑配置文件' },
        delete: { flag: '-d, --delete', description: '删除配置' },
        auto: { flag: '-y, --auto', description: '开启或关闭自动模式' },
        help: { flag: '-h, --help', description: '显示API命令帮助信息' }
      }
    };

    // 调用super()
    super(options);

    // 现在可以安全地设置menuFunc
    this.menuFunc = this.showInteractiveMenu.bind(this);
  }

  // 显示交互式API菜单
  async showInteractiveMenu() {
    // 使用通用菜单组件创建Claude菜单
    const menu = createGenericMenu({
      title: '📡 Claude配置管理',
      getAutoStatus: autoManager.checkAutoModeStatus.bind(autoManager),
      autoManager: autoManager,
      menuItems: [
        {
          name: '🔄 切换配置 - 切换到新Claude配置',
          value: 'switch',
          short: '切换Claude配置',
          command: this.subCommands.switch
        },
        {
          name: '📋 查看配置 - 列出所有 Claude 配置',
          value: 'list',
          short: '查看配置',
          command: this.subCommands.list
        },
        {
          name: '➕ 添加配置 - 添加新的 Claude配置',
          value: 'add',
          short: '添加配置',
          command: this.subCommands.add
        },
        {
          name: '✏️ 编辑配置 - 编辑当前 Claude 配置',
          value: 'edit',
          short: '编辑配置',
          command: this.subCommands.edit
        },
        {
          name: '🗑️ 删除配置 - 删除指定 Claude 配置',
          value: 'delete',
          short: '删除配置',
          command: this.subCommands.delete
        }
      ]
    });

    await menu();
  }

  // 添加命令帮助文本
  addHelpText(command) {
    command.addHelpText('after', `

示例:
  cc api              显示交互式API管理菜单
  cc api --add        添加新的API配置
  cc api --auto       开启/关闭自动模式
  cc api --delete     删除API配置
  cc api --edit       编辑配置文件
  cc api --help       显示此帮助信息
  cc api --list       列出所有API配置
  cc api --switch     切换 Claude 配置

配置文件位置:
  ~/.cc-cli/api_configs.json    API 配置文件（包含当前激活配置）
  ~/.claude/settings.json       Claude Code 全局配置文件
  ~/.claude/hooks/              自动模式脚本目录

注意:
  - 如果URL或Token只有一个选项，会自动选择
  - 当前使用的配置会用绿色标识，当前站点用⭐标识
  - 所有操作都会实时更新Claude Code配置
  - 自动模式会自动批准所有工具使用，请谨慎启用
`);
  }

  // 执行API命令
  async execute(args = []) {
    await this.showInteractiveMenu();
  }
}

export default new ApiCommand();