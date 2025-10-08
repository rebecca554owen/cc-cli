import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import { BaseCommand } from '../../utils/base-command.js';
import listCommand from './list.js';

// iFlow API快速使用命令
class ApiUseCommand extends BaseCommand {
  constructor() {
    super({
      commandName: 'usei',
      description: 'iFlow API快速使用',
      subCommands: {
        list: listCommand
      },
      optionsConfig: {
        list: { flag: '-l, --list', description: '列出所有iFlow配置' },
        help: { flag: '-h, --help', description: '显示命令帮助信息' }
      }
    });
    
    // 设置菜单函数
    this.menuFunc = this.execute.bind(this);
  }

  // 显示交互式菜单
  async showInteractiveMenu() {
    await this.execute();
  }

  // 执行API快速使用命令
  async execute() {
    try {
      console.log(chalk.cyan.bold('🌊 iFlow API快速使用'));
      console.log();

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

      // 获取当前所有配置
      const allConfigs = await configManager.getAllConfigs();

      // 检查是否有配置文件
      if (!allConfigs || !allConfigs.sites) {
        console.log(chalk.yellow('⚠️  没有找到配置文件'));
        console.log(chalk.gray('💡 使用 cc apii --add 添加新的iFlow配置'));
        return;
      }

      // 检查是否有iFlow配置
      const iflowConfigs = Object.entries(allConfigs.sites || {})
        .filter(([_, config]) => config.iflow);

      if (iflowConfigs.length === 0) {
        console.log(chalk.yellow('⚠️  没有找到iFlow配置'));
        console.log(chalk.gray('💡 使用 cc apii --add 添加新的iFlow配置'));
        return;
      }

      // 如果只有一个配置，直接使用
      if (iflowConfigs.length === 1) {
        const [configName] = iflowConfigs[0];
        await this.useConfig(configManager, configName, allConfigs);
        return;
      }

      // 创建选择列表
      const choices = iflowConfigs.map(([name, config]) => {
        const isCurrent = allConfigs.currentConfig === name;
        const prefix = isCurrent ? '👉 ' : '   ';
        return {
          name: `${prefix}${name} - ${config.description || '无描述'} (${config.url})`,
          value: name
        };
      });

      // 选择要使用的配置
      const { configName } = await inquirer.prompt([
        {
          type: 'list',
          name: 'configName',
          message: '请选择要使用的iFlow配置:',
          choices
        }
      ]);

      // 使用配置
      await this.useConfig(configManager, configName, allConfigs);

    } catch (error) {
      console.error(chalk.red('❌ 使用iFlow配置失败:'), error.message);
      throw error;
    }
  }

  // 使用指定配置
  async useConfig(configManager, configName, allConfigs) {
    try {
      // 获取配置详情
      const config = allConfigs.sites[configName];
      
      console.log(chalk.cyan(`🌊 正在使用配置: ${configName}`));
      
      // 更新当前配置
      allConfigs.currentConfig = configName;
      
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
      console.error(chalk.red('❌ 使用配置失败:'), error.message);
      throw error;
    }
  }

  // 更新iFlow配置文件
  async updateIflowConfig(config) {
    try {
      const { default: configPaths } = await import('../../config/paths-config.js');
      
      // 确保iFlow配置目录存在
      await fs.ensureDir(configPaths.iflowDir);
      
      // 创建iFlow配置
      const iflowConfig = {
        baseUrl: config.url,
        apiKey: config.iflow?.apiKey || '',
        modelName: config.iflow?.modelName || config.iflow?.model || 'iflow-model',
        description: config.description || 'iFlow配置'
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

export default new ApiUseCommand();