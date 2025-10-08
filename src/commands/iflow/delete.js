import chalk from 'chalk';
import inquirer from 'inquirer';
import { BaseCommand } from '../../utils/base-command.js';

// 删除iFlow配置命令
class DeleteCommand extends BaseCommand {
  constructor() {
    super({
      commandName: 'delete',
      description: '删除iFlow配置'
    });
  }

  // 执行删除配置命令
  async execute() {
    try {
      console.log(chalk.cyan.bold('🗑️ 删除iFlow配置'));
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
        return;
      }

      // 创建选择列表
      const choices = iflowConfigs.map(([name, config]) => ({
        name: `${name} - ${config.description || '无描述'} (${config.url})`,
        value: name
      }));

      // 选择要删除的配置
      const { configName } = await inquirer.prompt([
        {
          type: 'list',
          name: 'configName',
          message: '请选择要删除的iFlow配置:',
          choices
        }
      ]);

      // 确认删除
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `确定要删除配置 "${configName}" 吗？`,
          default: false
        }
      ]);

      if (!confirm) {
        console.log(chalk.yellow('❌ 取消删除操作'));
        return;
      }

      // 检查是否为当前使用的配置
      if (allConfigs.currentConfig === configName) {
        console.log(chalk.yellow('⚠️  不能删除当前正在使用的配置'));
        console.log(chalk.gray('💡 请先使用 cc apii --switch 切换到其他配置'));
        return;
      }

      // 删除配置
      delete allConfigs.sites[configName];

      // 保存配置
      const { default: configPaths } = await import('../../config/paths-config.js');
      const fs = await import('fs-extra');
      await fs.writeFile(
        configPaths.apiConfigs,
        JSON.stringify(allConfigs, null, 2),
        'utf8'
      );

      console.log(chalk.green('✅ iFlow配置删除成功！'));
      console.log(chalk.cyan(`📁 已删除配置: ${configName}`));

    } catch (error) {
      console.error(chalk.red('❌ 删除iFlow配置失败:'), error.message);
      throw error;
    }
  }
}

export default new DeleteCommand();