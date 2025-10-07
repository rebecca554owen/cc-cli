import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import fs from 'fs-extra';

import ManagerConfig from '../../core/manager-config.js';
import { showError, showSuccess, showInfo, showWarning } from '../../utils/ui.js';
import { formatError } from '../../utils/formatter.js';

/**
 * Codex配置添加命令
 */
class CodexAddCommand {
  constructor() {
    this.configManager = new ManagerConfig();
  }

  /**
   * 执行添加新配置
   * @param {Array} args 参数
   */
  async execute(args = []) {
    try {
      showInfo('📝 交互式添加Codex配置');

      // 检查配置文件是否存在
      const configExists = await this.configManager.configExists();

      if (!configExists) {
        const createConfig = await this.askCreateConfigFile();
        if (!createConfig) {
          showInfo('取消操作');
          return;
        }
        await this.createEmptyConfigFile();
      }

      // 开始配置创建流程
      await this.startConfigCreation();

    } catch (error) {
      showError(`添加配置操作失败: ${error.message}`);
    }
  }

  /**
   * 询问是否创建配置文件
   */
  async askCreateConfigFile() {
    console.log(chalk.yellow('\n⚠️  配置文件不存在'));
    console.log(chalk.gray('需要先创建配置文件才能添加配置'));

    const { create } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'create',
        message: '是否创建新的配置文件？',
        default: true
      }
    ]);

    return create;
  }

  /**
   * 创建空的配置文件
   */
  async createEmptyConfigFile() {
    const spinner = ora('创建配置文件...').start();

    try {
      await this.configManager.ensureConfigDir();

      const emptyConfig = {
        sites: {}
      };

      await fs.writeFile(
        this.configManager.configPath,
        JSON.stringify(emptyConfig, null, 2),
        'utf8'
      );

      spinner.succeed('配置文件创建成功');
      showSuccess(`配置文件已创建: ${this.configManager.configPath}`);

    } catch (error) {
      spinner.fail();
      throw new Error(`创建配置文件失败: ${error.message}`);
    }
  }

  /**
   * 开始配置创建流程
   */
  async startConfigCreation() {
    console.log(chalk.cyan('\n🚀 开始创建新的Codex配置'));
    console.log(chalk.gray('请按照提示逐步输入配置信息\n'));

    // 1. 基本信息
    const basicInfo = await this.collectBasicInfo();

    // 2. 模型配置
    const modelConfig = await this.collectModelConfig();

    // 3. API Key配置
    const apiKey = await this.collectApiKey();

    // 4. 服务提供商配置
    const providers = await this.collectProviders();

    // 5. 确认和保存
    await this.confirmAndSave(basicInfo, modelConfig, apiKey, providers);
  }

  /**
   * 收集基本信息
   */
  async collectBasicInfo() {
    console.log(chalk.white.bold('📋 第1步: 基本信息'));

    // 获取现有配置以检查重复
    let existingConfig = {};
    try {
      existingConfig = await this.configManager.getAllConfigs();
    } catch (error) {
      // 配置文件可能为空，忽略错误
    }

    const questions = [
      {
        type: 'input',
        name: 'siteKey',
        message: '站点标识 (用于内部识别，支持中英文):',
        validate: (input) => {
          if (!input.trim()) {
            return '站点标识不能为空';
          }
          if (existingConfig.sites && existingConfig.sites[input]) {
            return `站点标识 "${input}" 已存在，请使用其他标识`;
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'description',
        message: '站点描述 (可选):',
        default: ''
      }
    ];

    return await inquirer.prompt(questions);
  }

  /**
   * 收集模型配置
   */
  async collectModelConfig() {
    console.log(chalk.white.bold('\n🤖 第2步: 模型配置'));

    const modelInfo = await inquirer.prompt([
      {
        type: 'input',
        name: 'model',
        message: '模型名称 (如: gpt-4, gpt-5):',
        default: 'gpt-5',
        validate: (input) => {
          if (!input.trim()) {
            return '模型名称不能为空';
          }
          return true;
        }
      }
    ]);

    console.log(chalk.green(`✓ 模型: ${modelInfo.model}`));

    return modelInfo.model;
  }

  /**
   * 收集API Key配置
   */
  async collectApiKey() {
    console.log(chalk.white.bold('\n🔑 第3步: OPENAI_API_KEY配置'));

    const apiKeys = {};
    let continueAdding = true;
    let keyCount = 0;

    while (continueAdding) {
      keyCount++;
      console.log(chalk.gray(`\n添加第 ${keyCount} 个API Key:`));

      const keyInfo = await inquirer.prompt([
        {
          type: 'input',
          name: 'keyName',
          message: 'API Key名称 (如: 主账号, 测试账号):',
          validate: (input) => {
            if (!input.trim()) {
              return 'API Key名称不能为空';
            }
            if (apiKeys[input]) {
              return `API Key名称 "${input}" 已存在`;
            }
            return true;
          }
        },
        {
          type: 'password',
          name: 'keyValue',
          message: 'API Key值:',
          mask: '*',
          validate: (input) => {
            if (!input.trim()) {
              return 'API Key值不能为空';
            }
            if (input.length < 10) {
              return 'API Key值长度不能少于10个字符';
            }
            return true;
          }
        }
      ]);

      apiKeys[keyInfo.keyName] = keyInfo.keyValue;
      console.log(chalk.green(`✓ 已添加API Key: ${keyInfo.keyName} -> ${keyInfo.keyValue.substring(0, 10)}...`));

      if (keyCount === 1) {
        const { addMore } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'addMore',
            message: '是否添加更多API Key？',
            default: false
          }
        ]);
        continueAdding = addMore;
      } else {
        const { addMore } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'addMore',
            message: '是否继续添加API Key？',
            default: false
          }
        ]);
        continueAdding = addMore;
      }
    }

    return apiKeys;
  }

  /**
   * 收集服务提供商配置
   */
  async collectProviders() {
    console.log(chalk.white.bold('\n🌐 第4步: 服务提供商配置 (可选)'));

    const providers = {};
    let continueAdding = true;

    const { addProviders } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'addProviders',
        message: '是否添加自定义服务提供商？',
        default: false
      }
    ]);

    if (!addProviders) {
      console.log(chalk.gray('使用默认服务提供商'));
      return providers;
    }

    let providerCount = 0;

    while (continueAdding) {
      providerCount++;
      console.log(chalk.gray(`\n添加第 ${providerCount} 个服务提供商:`));

      const providerInfo = await inquirer.prompt([
        {
          type: 'input',
          name: 'providerKey',
          message: '提供商标识 (如: openai, azure):',
          validate: (input) => {
            if (!input.trim()) {
              return '提供商标识不能为空';
            }
            if (providers[input]) {
              return `提供商标识 "${input}" 已存在`;
            }
            return true;
          }
        },
        {
          type: 'input',
          name: 'providerName',
          message: '提供商显示名称:',
          default: function(answers) {
            return answers.providerKey;
          },
          validate: (input) => {
            if (!input.trim()) {
              return '提供商名称不能为空';
            }
            return true;
          }
        },
        {
          type: 'input',
          name: 'baseUrl',
          message: 'API基础地址:',
          validate: (input) => {
            if (!input.trim()) {
              return 'API基础地址不能为空';
            }
            try {
              new URL(input);
              return true;
            } catch (error) {
              return '请输入有效的URL地址 (如: https://api.openai.com)';
            }
          }
        }
      ]);

      providers[providerInfo.providerKey] = {
        name: providerInfo.providerName,
        base_url: providerInfo.baseUrl
      };

      console.log(chalk.green(`✓ 已添加提供商: ${providerInfo.providerName}`));

      const { addMore } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'addMore',
          message: '是否继续添加提供商？',
          default: false
        }
      ]);
      continueAdding = addMore;
    }

    return providers;
  }

  /**
   * 确认并保存配置
   */
  async confirmAndSave(basicInfo, model, apiKeys, providers) {
    console.log(chalk.white.bold('\n📝 第5步: 确认配置'));

    // 显示配置预览
    console.log(chalk.cyan('\n配置预览:'));
    console.log(chalk.white(`站点标识: ${chalk.yellow(basicInfo.siteKey)}`));
    if (basicInfo.description) {
      console.log(chalk.white(`站点描述: ${chalk.yellow(basicInfo.description)}`));
    }

    console.log(chalk.white(`\n模型: ${chalk.yellow(model)}`));

    console.log(chalk.white(`\nOPENAI_API_KEY配置 (${Object.keys(apiKeys).length}个):`));
    Object.entries(apiKeys).forEach(([name, key]) => {
      console.log(chalk.gray(`  ${name}: ${key.substring(0, 15)}...`));
    });

    if (Object.keys(providers).length > 0) {
      console.log(chalk.white(`\n服务提供商 (${Object.keys(providers).length}个):`));
      Object.entries(providers).forEach(([key, provider]) => {
        console.log(chalk.gray(`  ${provider.name}: ${provider.base_url}`));
      });
    }

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: '\n确认保存此配置？',
        default: true
      }
    ]);

    if (!confirm) {
      showWarning('取消保存配置');
      return;
    }

    // 保存配置
    const spinner = ora('保存配置...').start();

    try {
      // 读取现有配置
      let allConfigs = {};
      try {
        allConfigs = await this.configManager.getAllConfigs();
      } catch (error) {
        allConfigs = { sites: {} };
      }

      // 添加新的Codex配置
      allConfigs.sites[basicInfo.siteKey] = {
        description: basicInfo.description || undefined,
        codex: {
          model: model,
          OPENAI_API_KEY: apiKeys,
          ...(Object.keys(providers).length > 0 && {
            model_providers: providers
          })
        }
      };

      // 保存到文件
      await fs.writeFile(
        this.configManager.configPath,
        JSON.stringify(allConfigs, null, 2),
        'utf8'
      );

      spinner.succeed('配置保存成功');

      showSuccess(`🎉 Codex配置 "${basicInfo.siteKey}" 已成功添加！`);
      showInfo(`配置文件位置: ${this.configManager.configPath}`);
      showInfo(`使用 ${chalk.cyan('cc apix --list')} 查看所有配置`);
      showInfo(`使用 ${chalk.cyan('cc apix')} 切换到新配置`);

    } catch (error) {
      spinner.fail();
      throw new Error(`保存配置失败: ${error.message}`);
    }
  }
}

export default new CodexAddCommand();