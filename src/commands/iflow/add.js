import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import { BaseCommand } from '../../utils/base-command.js';

// 添加iFlow配置命令
class AddCommand extends BaseCommand {
  constructor() {
    super({
      commandName: 'add',
      description: '添加新的iFlow配置'
    });
  }

  // 执行添加配置命令
  async execute() {
    try {
      console.log(chalk.cyan.bold('🌊 添加新的iFlow配置'));
      console.log();

      // 获取配置管理器
      const { default: ManagerConfig } = await import('../../core/manager-config.js');
      const configManager = new ManagerConfig();

      // 获取当前所有配置
      const allConfigs = await configManager.getAllConfigs();

      // 收集配置信息
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'configName',
          message: '请输入配置名称:',
          validate: (input) => {
            if (!input.trim()) {
              return '配置名称不能为空';
            }
            if (allConfigs.sites && allConfigs.sites[input.trim()]) {
              return '配置名称已存在，请使用其他名称';
            }
            return true;
          }
        },
        {
          type: 'input',
          name: 'description',
          message: '请输入配置描述:',
          default: 'iFlow配置'
        },
        {
          type: 'input',
          name: 'baseUrl',
          message: '请输入API基础URL:',
          default: 'https://api.iflow.com',
          validate: (input) => {
            if (!input.trim()) {
              return 'API基础URL不能为空';
            }
            return true;
          }
        },
        {
          type: 'input',
          name: 'apiKey',
          message: '请输入API密钥:',
          validate: (input) => {
            if (!input.trim()) {
              return 'API密钥不能为空';
            }
            return true;
          }
        },
        {
          type: 'input',
          name: 'modelName',
          message: '请输入模型名称:',
          default: 'iflow-model'
        }
      ]);

      // 创建新配置
      const newConfig = {
        description: answers.description,
        url: answers.baseUrl,
        iflow: {
          apiKey: answers.apiKey,
          baseUrl: answers.baseUrl,
          modelName: answers.modelName
        }
      };

      // 添加到配置中
      if (!allConfigs.sites) {
        allConfigs.sites = {};
      }
      allConfigs.sites[answers.configName] = newConfig;

      // 保存配置
      const { default: configPaths } = await import('../../config/paths-config.js');
      await fs.writeFile(
        configPaths.apiConfigs,
        JSON.stringify(allConfigs, null, 2),
        'utf8'
      );

      console.log(chalk.green('✅ iFlow配置添加成功！'));
      console.log(chalk.cyan(`📁 配置名称: ${answers.configName}`));
      console.log(chalk.cyan(`🔗 API URL: ${answers.baseUrl}`));
      console.log(chalk.cyan(`🤖 模型名称: ${answers.modelName}`));
      console.log(chalk.gray('💡 使用 cc apii --switch 切换到新配置'));

    } catch (error) {
      console.error(chalk.red('❌ 添加iFlow配置失败:'), error.message);
      throw error;
    }
  }
}

export default new AddCommand();