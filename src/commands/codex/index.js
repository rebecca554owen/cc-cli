import chalk from 'chalk';

import switchCommand from './switch.js';
import listCommand from './list.js';
import addCommand from './add.js';
import editCommand from './edit.js';
import deleteCommand from './delete.js';
import autoManager from '../../config/auto-manager-codex.js';
import { BaseCommand } from '../../utils/base-command.js';
import { createGenericMenu } from '../../utils/ui.js';

// Codex配置帮助信息
function showCodexHelp() {
  console.log(chalk.cyan.bold('💻 CC Codex 配置管理工具帮助'));
  console.log();
  console.log(chalk.white('用法:'));
  console.log('  cc apix [选项]');
  console.log();
  console.log(chalk.white('选项:'));
  console.log('  -a, --add        添加新Codex配置');
  console.log('  -d, --delete     删除Codex配置');
  console.log('  -e, --edit       编辑Codex配置文件');
  console.log('  -h, --help       显示此帮助信息');
  console.log('  -l, --list       列出所有Codex配置');
  console.log('  -s, --switch     切换Codex配置');
  console.log('  -y, --auto       开启或关闭自动模式');
  console.log();
  console.log(chalk.white('交互式功能:'));
  console.log('  🔄 切换Codex配置    选择不同的Codex服务提供商');
  console.log('  📋 查看配置    列出所有Codex配置');
  console.log('  ➕ 添加配置    添加新的Codex配置项');
  console.log('  📝 编辑配置    编辑Codex配置文件');
  console.log('  🗑️ 删除配置    删除指定Codex配置');
  console.log('  🚀 自动模式    开启/关闭Codex自动模式（approval_policy=never, sandbox_mode=danger-full-access）');
  console.log();
  console.log(chalk.white('智能选择:'));
  console.log('  - 当站点只有1个时，自动选择，不显示选择界面');
  console.log('  - 当服务商只有1个时，自动选择，不显示选择界面');
  console.log('  - 当API Key只有1个时，自动选择，不显示选择界面');
  console.log('  - 当前使用的配置会用绿色特殊标识，当前站点用⭐标识');
  console.log();
  console.log(chalk.white('配置文件:'));
  console.log(`  ${chalk.gray('~/.cc-cli/api_configs.json')}    统一配置文件`);
  console.log(`  ${chalk.gray('~/.codex/config.toml')}          Codex主配置文件`);
  console.log(`  ${chalk.gray('~/.codex/auth.json')}            Codex认证文件`);
  console.log(`  ${chalk.gray('~/.codex/hooks/')}               自动模式脚本目录`);
  console.log();
  console.log(chalk.white('示例:'));
  console.log(`  ${chalk.green('cc apix')}             # 显示交互式菜单`);
  console.log(`  ${chalk.green('cc apix --add')}       # 添加新配置`);
  console.log(`  ${chalk.green('cc apix --auto')}      # 开启/关闭自动模式`);
  console.log(`  ${chalk.green('cc apix --delete')}    # 删除配置`);
  console.log(`  ${chalk.green('cc apix --edit')}      # 编辑配置文件`);
  console.log(`  ${chalk.green('cc apix --help')}      # 显示帮助信息`);
  console.log(`  ${chalk.green('cc apix --list')}      # 列出所有配置`);
  console.log(`  ${chalk.green('cc apix --switch')}    # 切换Codex配置`);
}

// Codex命令类
class CodexCommand extends BaseCommand {
  constructor() {
    // 先将选项配置好，避免在super()之前使用this
    const options = {
      commandName: 'apix',
      description: 'Codex配置管理',
      subCommands: {
        switch: switchCommand,
        list: listCommand,
        add: addCommand,
        edit: editCommand,
        delete: deleteCommand
      },
      autoManager: autoManager,
      helpFunc: showCodexHelp,
      menuFunc: null, // 先设为null，后面再绑定
      optionsConfig: {
        list: { flag: '-l, --list', description: '列出所有Codex配置' },
        switch: { flag: '-s, --switch', description: '切换Codex配置' },
        add: { flag: '-a, --add', description: '添加新Codex配置' },
        edit: { flag: '-e, --edit', description: '编辑Codex配置文件' },
        delete: { flag: '-d, --delete', description: '删除Codex配置' },
        auto: { flag: '-y, --auto', description: '开启或关闭自动模式' },
        help: { flag: '-h, --help', description: '显示Codex命令帮助信息' }
      }
    };

    // 调用super()
    super(options);

    // 现在可以安全地设置menuFunc
    this.menuFunc = this.showInteractiveMenu.bind(this);
  }

  // 显示交互式Codex菜单
  async showInteractiveMenu() {
    // 使用通用菜单组件创建Codex菜单
    const menu = createGenericMenu({
      title: '💻 Codex配置管理',
      getAutoStatus: autoManager.checkAutoModeStatus.bind(autoManager),
      autoManager: autoManager,
      menuItems: [
        {
          name: '🔄 切换配置 - 切换到新Codex配置',
          value: 'switch',
          short: '切换配置',
          command: this.subCommands.switch
        },
        {
          name: '📋 查看配置 - 列出所有 Codex 配置',
          value: 'list',
          short: '查看配置',
          command: this.subCommands.list
        },
        {
          name: '➕ 添加配置 - 添加新的Codex配置',
          value: 'add',
          short: '添加配置',
          command: this.subCommands.add
        },
        {
          name: '📝 编辑配置 - 编辑当前 Codex 配置',
          value: 'edit',
          short: '编辑配置',
          command: this.subCommands.edit
        },
        {
          name: '🗑️ 删除配置 - 删除指定 Codex 配置',
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
  cc apix                 显示交互式 Codex 管理菜单
  cc apix --add           添加新 Codex 配置
  cc apix --auto          开启/关闭自动模式
  cc apix --delete        删除 Codex 配置
  cc apix --edit          编辑 Codex 配置文件
  cc apix --help          显示此帮助信息
  cc apix --list          列出所有 Codex 配置
  cc apix --switch        切换 Codex 配置

配置文件位置:
  ~/.cc-cli/api_configs.json    统一配置文件
  ~/.codex/config.toml          Codex 主配置文件
  ~/.codex/auth.json            Codex 认证文件
`);
  }

  // 执行Codex命令
  async execute(args = []) {
    await this.showInteractiveMenu();
  }
}

export default new CodexCommand();