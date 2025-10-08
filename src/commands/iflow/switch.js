import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import { BaseCommand } from '../../utils/base-command.js';

// 切换iFlow配置命令
class SwitchCommand extends BaseCommand {
  constructor() {
    super({
      commandName: 'switch',
      description: '切换iFlow配置'
    });
  }

  // 执行切换配置命令
  async execute() {
    try {
      console.log(chalk.cyan.bold('🔄 切换iFlow配置'));
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

      // 如果只有一个配置，直接切换
      if (iflowConfigs.length === 1) {
        const [configName] = iflowConfigs[0];
        await this.switchToConfig(configManager, configName, allConfigs);
        return;
      }

      // 创建选择列表
      const choices = iflowConfigs.map(([name, config]) => {
        const isCurrent = allConfigs.currentIflowConfig && allConfigs.currentIflowConfig.site === name;
        const prefix = isCurrent ? '👉 ' : '   ';
        return {
          name: `${prefix}${name} - ${config.description || '无描述'} (${config.url})`,
          value: name,
          disabled: isCurrent
        };
      });

      // 选择要切换的配置
      const { configName } = await inquirer.prompt([
        {
          type: 'list',
          name: 'configName',
          message: '请选择要切换到的iFlow配置:',
          choices
        }
      ]);

      // 切换配置
      await this.switchToConfig(configManager, configName, allConfigs);

    } catch (error) {
      console.error(chalk.red('❌ 切换iFlow配置失败:'), error.message);
      throw error;
    }
  }

  // 切换到指定配置
  async switchToConfig(configManager, configName, allConfigs) {
    try {
      // 获取配置详情
      const config = allConfigs.sites[configName];
      
      console.log(chalk.cyan(`🔄 正在切换到配置: ${configName}`));
      
      // 更新当前iFlow配置
      allConfigs.currentIflowConfig = {
        site: configName,
        siteName: config.description || configName,
        baseUrl: config.url,
        model: config.iflow?.modelName || config.iflow?.model || '未设置',
        apiKey: config.iflow?.apiKey || '未设置'
      };
      
      // 保存配置
      const { default: configPaths } = await import('../../config/paths-config.js');
      await fs.writeFile(
        configPaths.apiConfigs,
        JSON.stringify(allConfigs, null, 2),
        'utf8'
      );

      // 更新iFlow配置文件
      await this.updateIflowConfig(config);

      console.log(chalk.green('✅ iFlow配置已激活！'));
      console.log(chalk.cyan(`📁 当前配置: ${configName}`));
      console.log(chalk.cyan(`🔗 API URL: ${config.url}`));
      
      if (config.iflow) {
        console.log(chalk.cyan(`🤖 模型名称: ${config.iflow.modelName || config.iflow.model || '未设置'}`));
      }
      console.log(chalk.gray('💡 现在可以使用iFlow服务了'));

    } catch (error) {
      console.error(chalk.red('❌ 切换配置失败:'), error.message);
      throw error;
    }
  }

  // 更新iFlow配置文件
  async updateIflowConfig(config) {
    try {
      const { default: configPaths } = await import('../../config/paths-config.js');
      
      // 确保iFlow配置目录存在
      await fs.ensureDir(configPaths.iflowDir);
      
      // 读取现有配置，保留额外字段
      let existingConfig = {};
      try {
        const existingContent = await fs.readFile(configPaths.iflowConfig, 'utf8');
        existingConfig = JSON.parse(existingContent);
      } catch (error) {
        // 如果文件不存在或解析失败，使用空对象
        existingConfig = {};
      }
      
      // 创建iFlow配置，保留现有字段
      const iflowConfig = {
        ...existingConfig,
        baseUrl: config.url,
        apiKey: config.iflow?.apiKey || '',
        model: config.iflow?.model || config.iflow?.modelName || 'gpt-4-turbo',
        modelName: config.iflow?.model || config.iflow?.modelName || 'gpt-4-turbo'
      };
      
      // 写入iFlow配置文件
      await fs.writeFile(
        configPaths.iflowConfig,
        JSON.stringify(iflowConfig, null, 2),
        'utf8'
      );
      
      console.log(chalk.gray(`💡 iFlow配置文件已更新: ${configPaths.iflowConfig}`));
      
    } catch (error) {
      console.error(chalk.red('❌ 更新iFlow配置文件失败:'), error.message);
      throw error;
    }
  }
}

export default new SwitchCommand();