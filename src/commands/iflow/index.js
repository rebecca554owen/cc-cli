import chalk from 'chalk';

import switchCommand from './switch.js';
import listCommand from './list.js';
import addCommand from './add.js';
import editCommand from './edit.js';
import deleteCommand from './delete.js';
import autoManager from '../../config/auto-manager-iflow.js';
import { BaseCommand } from '../../utils/base-command.js';
import { createGenericMenu } from '../../utils/ui.js';

// iFlow配置帮助信息
function showIflowHelp() {
  console.log(chalk.cyan.bold('🌊 CC iFlow 配置管理工具帮助'));
  console.log();
  console.log(chalk.white('用法:'));
  console.log('  cc apii [选项]');
  console.log();
  console.log(chalk.white('选项:'));
  console.log('  -a, --add        添加新iFlow配置');
  console.log('  -d, --delete     删除iFlow配置');
  console.log('  -e, --edit       编辑iFlow配置文件');
  console.log('  -h, --help       显示此帮助信息');
  console.log('  -l, --list       列出所有iFlow配置');
  console.log('  -s, --switch     切换iFlow配置');
  console.log('  -y, --auto       开启或关闭自动模式');
  console.log();
  console.log(chalk.white('交互式功能:'));
  console.log('  🔄 切换iFlow配置    选择不同的iFlow服务提供商');
  console.log('  📋 查看配置    列出所有iFlow配置');
  console.log('  ➕ 添加配置    添加新的iFlow配置项');
  console.log('  📝 编辑配置    编辑iFlow配置文件');
  console.log('  🗑️ 删除配置    删除指定iFlow配置');
  console.log('  🚀 自动模式    开启/关闭iFlow自动模式');
  console.log();
  console.log(chalk.white('智能选择:'));
  console.log('  - 当站点只有1个时，自动选择，不显示选择界面');
  console.log('  - 当服务商只有1个时，自动选择，不显示选择界面');
  console.log('  - 当API Key只有1个时，自动选择，不显示选择界面');
  console.log('  - 当前使用的配置会用绿色特殊标识，当前站点用⭐标识');
  console.log();
  console.log(chalk.white('配置文件:'));
  console.log(`  ${chalk.gray('~/.cc-cli/api_configs.json')}    统一配置文件`);
  console.log(`  ${chalk.gray('~/.iflow/config.json')}          iFlow主配置文件`);
  console.log(`  ${chalk.gray('~/.iflow/auth.json')}            iFlow认证文件`);
  console.log();
  console.log(chalk.white('示例:'));
  console.log(`  ${chalk.green('cc apii')}             # 显示交互式菜单`);
  console.log(`  ${chalk.green('cc apii --add')}       # 添加新配置`);
  console.log(`  ${chalk.green('cc apii --auto')}      # 开启/关闭自动模式`);
  console.log(`  ${chalk.green('cc apii --delete')}    # 删除配置`);
  console.log(`  ${chalk.green('cc apii --edit')}      # 编辑配置文件`);
  console.log(`  ${chalk.green('cc apii --help')}      # 显示帮助信息`);
  console.log(`  ${chalk.green('cc apii --list')}      # 列出所有配置`);
  console.log(`  ${chalk.green('cc apii --switch')}    # 切换iFlow配置`);
}

// iFlow命令类
class IflowCommand extends BaseCommand {
  constructor() {
    // 先将选项配置好，避免在super()之前使用this
    const options = {
      commandName: 'apii',
      description: 'iFlow配置管理',
      subCommands: {
        switch: switchCommand,
        list: listCommand,
        add: addCommand,
        edit: editCommand,
        delete: deleteCommand
      },
      autoManager: autoManager,
      helpFunc: showIflowHelp,
      menuFunc: null, // 先设为null，后面再绑定
      optionsConfig: {
        list: { flag: '-l, --list', description: '列出所有iFlow配置' },
        switch: { flag: '-s, --switch', description: '切换iFlow配置' },
        add: { flag: '-a, --add', description: '添加新iFlow配置' },
        edit: { flag: '-e, --edit', description: '编辑iFlow配置文件' },
        delete: { flag: '-d, --delete', description: '删除iFlow配置' },
        auto: { flag: '-y, --auto', description: '开启或关闭自动模式' },
        help: { flag: '-h, --help', description: '显示iFlow命令帮助信息' }
      }
    };

    // 调用super()
    super(options);

    // 现在可以安全地设置menuFunc
    this.menuFunc = this.showInteractiveMenu.bind(this);
  }

  // 显示交互式iFlow菜单
  async showInteractiveMenu() {
    try {
      // 获取配置管理器
      const { default: ManagerConfig } = await import('../../core/manager-config.js');
      const configManager = new ManagerConfig();
      
      // 检查是否为首次使用，如果是则自动初始化配置
      if (await configManager.isFirstUse()) {
        console.log(chalk.yellow('⚠️  首次使用，正在初始化配置...'));
        await configManager.autoInitializeConfig();
        console.log(chalk.green('✅ 配置初始化完成'));
        console.log('');
      }
      
      // 使用通用菜单组件创建iFlow菜单
      const menu = createGenericMenu({
        title: '🌊 iFlow配置管理',
        getAutoStatus: autoManager.checkAutoModeStatus.bind(autoManager),
        autoManager: autoManager,
        menuItems: [
          {
            name: '🔄 切换配置 - 切换到新iFlow配置',
            value: 'switch',
            short: '切换配置',
            command: this.subCommands.switch
          },
          {
            name: '📋 查看配置 - 列出所有 iFlow 配置',
            value: 'list',
            short: '查看配置',
            command: this.subCommands.list
          },
          {
            name: '➕ 添加配置 - 添加新的iFlow配置',
            value: 'add',
            short: '添加配置',
            command: this.subCommands.add
          },
          {
            name: '📝 编辑配置 - 编辑当前 iFlow 配置',
            value: 'edit',
            short: '编辑配置',
            command: this.subCommands.edit
          },
          {
            name: '🗑️ 删除配置 - 删除指定 iFlow 配置',
            value: 'delete',
            short: '删除配置',
            command: this.subCommands.delete
          }
        ]
      });

      await menu();
    } catch (error) {
      console.error(chalk.red('❌ 显示iFlow菜单失败:'), error.message);
      throw error;
    }
  }

  // 添加命令帮助文本
  addHelpText(command) {
    command.addHelpText('after', `

示例:
  cc apii                 显示交互式 iFlow 管理菜单
  cc apii --add           添加新 iFlow 配置
  cc apii --auto          开启/关闭自动模式
  cc apii --delete        删除 iFlow 配置
  cc apii --edit          编辑 iFlow 配置文件
  cc apii --help          显示此帮助信息
  cc apii --list          列出所有 iFlow 配置
  cc apii --switch        切换 iFlow 配置

配置文件位置:
  ~/.cc-cli/api_configs.json    统一配置文件
  ~/.iflow/config.json          iFlow 主配置文件
  ~/.iflow/auth.json            iFlow 认证文件
`);
  }

  // 执行iFlow命令
  async execute(args = []) {
    await this.showInteractiveMenu();
  }
}

export default new IflowCommand();