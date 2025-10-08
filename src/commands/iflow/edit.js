import chalk from 'chalk';
import { BaseCommand } from '../../utils/base-command.js';

// 编辑iFlow配置命令
class EditCommand extends BaseCommand {
  constructor() {
    super({
      commandName: 'edit',
      description: '编辑iFlow配置文件'
    });
  }

  // 执行编辑配置命令
  async execute() {
    try {
      console.log(chalk.cyan.bold('📝 编辑iFlow配置'));
      console.log();

      // 获取配置管理器
      const { default: ManagerConfig } = await import('../../core/manager-config.js');
      const configManager = new ManagerConfig();

      // 获取当前所有配置
      const allConfigs = await configManager.getAllConfigs();

      // 检查是否有iFlow配置
      const iflowConfigs = Object.entries(allConfigs.sites || {})
        .filter(([_, config]) => config.iflow);

      if (iflowConfigs.length === 0) {
        console.log(chalk.yellow('⚠️  没有找到iFlow配置'));
        console.log(chalk.gray('💡 使用 cc apii --add 添加新的iFlow配置'));
        return;
      }

      // 获取配置文件路径
      const { default: configPaths } = await import('../../config/paths-config.js');
      const configPath = configPaths.apiConfigs;

      console.log(chalk.cyan(`📁 配置文件路径: ${configPath}`));
      console.log(chalk.gray('💡 编辑完成后保存文件即可生效'));

      // 使用系统默认编辑器打开配置文件
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      // 根据操作系统选择编辑器
      const editor = process.platform === 'win32' ? 'notepad' : 'nano';
      
      try {
        await execAsync(`${editor} "${configPath}"`, { stdio: 'inherit' });
        console.log(chalk.green('✅ 配置文件编辑完成'));
      } catch (error) {
        console.log(chalk.yellow('⚠️  无法打开编辑器，请手动编辑配置文件'));
        console.log(chalk.cyan(`📁 配置文件路径: ${configPath}`));
      }

    } catch (error) {
      console.error(chalk.red('❌ 编辑iFlow配置失败:'), error.message);
      throw error;
    }
  }
}

export default new EditCommand();