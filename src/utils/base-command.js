import chalk from 'chalk';
import { program } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import fs from 'fs-extra';
import { exec } from 'child_process';

import ManagerConfig from '../core/manager-config.js';
import {
  showError,
  showSuccess,
  showInfo,
  showWarning,
  createBackChoice,
  waitForBackConfirm,
} from './ui.js';
import { getSiteIcon, formatError } from './formatter.js';

// 基础命令类
export class BaseCommand {
  // 构造函数
  constructor(options) {
    this.commandName = options.commandName;
    this.description = options.description;
    this.subCommands = options.subCommands || {};
    this.menuFunc = options.menuFunc;
    this.autoManager = options.autoManager;
    this.helpFunc = options.helpFunc;
    this.optionsConfig = options.optionsConfig || {
      list: { flag: '-l, --list', description: '列出所有配置' },
      switch: { flag: '-s, --switch', description: '切换配置' },
      add: { flag: '-a, --add', description: '添加新配置' },
      edit: { flag: '-e, --edit', description: '编辑配置文件' },
      delete: { flag: '-d, --delete', description: '删除配置' },
      help: { flag: '-h, --help', description: '显示命令帮助信息' },
      auto: { flag: '-y, --auto', description: '开启或关闭自动模式' }
    };
  }

  // 注册命令到commander
  async register(program) {
    const command = program
      .command(this.commandName)
      .description(this.description)
      .action(async (options) => {
        await this.handleCommandOptions(options);
      });

    // 动态添加选项
    for (const [key, config] of Object.entries(this.optionsConfig)) {
      if (config.flag && config.description) {
        command.option(config.flag, config.description);
      }
    }

    // 添加帮助信息
    if (this.helpFunc) {
      this.addHelpText(command);
    }
  }

  // 处理命令选项
  async handleCommandOptions(options) {
    // 处理帮助选项
    if (options.help) {
      if (this.helpFunc) {
        this.helpFunc();
      } else {
        this.showDefaultHelp();
      }
      return;
    }

    // 处理其他选项
    for (const [key, config] of Object.entries(this.optionsConfig)) {
      if (options[key] && this.subCommands[key]) {
        await this.subCommands[key].execute([]);
        return;
      }
    }

    // 处理自动模式选项
    if (options.auto) {
      if (this.autoManager) {
        await this.autoManager.toggleAutoMode({ waitForConfirm: false });
        return;
      }
    }

    // 默认显示交互式菜单
    if (this.menuFunc) {
      await this.menuFunc();
    }
  }

  // 添加帮助文本
  addHelpText(command) {
    const examples = Object.entries(this.optionsConfig).map(([key, config]) => {
      if (key === 'help') return null;
      const exampleText = `  cc ${this.commandName} ${config.flag.split(', ')[1]}`;
      const description = config.description;
      return {
        example: chalk.green(exampleText),
        description: chalk.gray(`# ${description}`)
      };
    }).filter(Boolean);

    const helpText = `\n\n示例:\n${examples.map(e => `${e.example}  ${e.description}`).join('\n')}\n\n配置文件位置:\n  ${chalk.gray('~/.cc-cli/api_configs.json')}    统一配置文件\n  ${chalk.gray('~/.codex/')}                     Codex配置文件目录`;

    command.addHelpText('after', helpText);
  }

  // 显示默认帮助信息
  showDefaultHelp() {
    console.log(chalk.cyan.bold(`💻 ${this.commandName.toUpperCase()} 配置管理工具帮助`));
    console.log();
    console.log(chalk.white('用法:'));
    console.log(`  cc ${this.commandName} [选项]`);
    console.log();
    console.log(chalk.white('选项:'));

    for (const [key, config] of Object.entries(this.optionsConfig)) {
      console.log(`  ${config.flag.padEnd(20)} ${config.description}`);
    }
  }

  // 显示交互式菜单
  async showInteractiveMenu() {
    if (this.menuFunc) {
      await this.menuFunc();
    } else {
      console.log(chalk.yellow('⚠️  交互式菜单功能未实现'));
    }
  }

  // 执行命令
  async execute(args = []) {
    await this.showInteractiveMenu();
  }
}

// 基础子命令类
export class BaseSubCommand {
  // 构造函数
  constructor(dependencies = {}) {
    this.dependencies = dependencies;
  }

  // 执行命令
  async execute(args = []) {
    try {
      await this._execute(args);
    } catch (error) {
      console.error(chalk.red(`❌ 命令执行失败: ${error.message}`));

      // 如果依赖中有错误显示函数，使用它
      if (this.dependencies.showError) {
        this.dependencies.showError(`命令执行失败: ${error.message}`);
      }
    }
  }

  // 具体执行逻辑（需要被子类实现）
  async _execute(args) {
    throw new Error('_execute方法需要被子类实现');
  }
}

// 通用选择器组件
export class SelectorComponent {
  // 创建选择器
  static create(options) {
    return new SelectorComponent(options);
  }

  constructor(options) {
    this.title = options.title || '请选择';
    this.choices = options.choices || [];
    this.autoSelectWhenSingle = options.autoSelectWhenSingle !== false;
    this.includeBackOption = options.includeBackOption !== false;
    this.backValue = options.backValue || '__back__';
  }

  // 显示选择器
  async show() {
    const inquirer = (await import('inquirer')).default;

    let displayChoices = [...this.choices];

    if (this.includeBackOption) {
      displayChoices.push({
        name: '↩️  返回',
        value: this.backValue,
        short: '返回'
      });
    }

    // 自动选择逻辑
    if (this.autoSelectWhenSingle && displayChoices.length === (this.includeBackOption ? 2 : 1)) {
      const selected = displayChoices[0].value;
      if (selected !== this.backValue) {
        console.log(chalk.gray(`✓ 自动选择: ${selected}`));
        return selected;
      }
    }

    const { choice } = await inquirer.prompt([{
      type: 'list',
      name: 'choice',
      message: this.title,
      choices: displayChoices,
      pageSize: 10
    }]);

    return choice;
  }
}

// 删除命令基类
export class DeleteCommandBase {
  constructor(config = {}) {
    this.configManager = new ManagerConfig();
    this.commandType = config.commandType; // 'claude' or 'codex'
    this.configField = config.configField; // 'claude' or 'codex'
    this.tokenField = config.tokenField; // 'ANTHROPIC_AUTH_TOKEN' or 'OPENAI_API_KEY'
    this.displayName = config.displayName; // 'Token' or 'API Key'
  }

  // 执行删除配置
  async execute(args = []) {
    try {
      showInfo(`🗑️  删除${this.commandType === 'claude' ? 'API' : 'Codex'}配置`);

      // 检查配置文件是否存在
      if (!(await this.configManager.configExists())) {
        showError("配置文件不存在");
        showInfo(`请先使用 cc ${this.commandType === 'claude' ? 'api' : 'apix'} --add 添加配置`);
        return;
      }

      // 读取所有配置
      const allConfigs = await this.configManager.getAllConfigs();

      // 验证配置结构 - 使用特定类型的验证方法
      const isValid = this.commandType === 'claude' 
        ? this.configManager.validateClaudeConfig(allConfigs)
        : this.configManager.validateCodexConfig(allConfigs);
        
      if (!isValid) {
        showError("配置文件格式无效");
        return;
      }

      // 检查是否有此类型的配置可删除
      const hasConfigs = Object.values(allConfigs.sites || {}).some(
        siteConfig => siteConfig[this.configField]
      );

      if (!hasConfigs) {
        showWarning(`没有找到${this.commandType === 'claude' ? 'Claude' : 'Codex'}配置`);
        return;
      }

      // 显示删除选项
      await this.showDeleteMenu(allConfigs);
    } catch (error) {
      showError(`删除配置操作失败: ${error.message}`);
    }
  }

  // 显示删除菜单（由子类实现）
  async showDeleteMenu(allConfigs) {
    throw new Error("showDeleteMenu 需要被子类实现");
  }

  // 获取站点配置的凭证数量
  getCredentialCount(siteConfig) {
    const config = siteConfig[this.configField];
    if (!config) return 0;

    if (this.commandType === 'claude') {
      return Object.keys(config.env?.[this.tokenField] || {}).length;
    } else {
      return Object.keys(config[this.tokenField] || {}).length;
    }
  }

  // 删除整个站点
  async deleteSite(allConfigs) {
    console.log(chalk.red.bold("\n🗑️  删除站点"));
    console.log(chalk.yellow(`⚠️  此操作将删除站点及其所有${this.displayName}配置`));

    // 筛选出有此类型配置的站点
    const filteredSites = Object.entries(allConfigs.sites).filter(
      ([, config]) => config[this.configField]
    );

    if (filteredSites.length === 0) {
      showWarning("没有可删除的站点");
      return;
    }

    // 选择要删除的站点
    const siteChoices = filteredSites.map(([key, config]) => {
      const icon = getSiteIcon(key, config);
      const count = this.getCredentialCount(config);
      return {
        name: `${icon} ${key} (${count}个${this.displayName})`,
        value: key,
        short: key,
      };
    });

    const { selectedSite } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedSite",
        message: "选择要删除的站点：",
        choices: siteChoices,
        pageSize: 10,
      },
    ]);

    const siteConfig = allConfigs.sites[selectedSite];
    const config = siteConfig[this.configField];

    // 显示站点信息
    console.log(chalk.white("\n📋 即将删除的站点信息："));
    console.log(chalk.gray(`站点标识: ${selectedSite}`));

    if (this.commandType === 'claude') {
      console.log(chalk.gray(`ANTHROPIC_BASE_URL: ${config?.env?.ANTHROPIC_BASE_URL}`));
      console.log(chalk.gray(`Token数量: ${this.getCredentialCount(siteConfig)}个`));
    } else {
      console.log(chalk.gray(`模型: ${config?.model || 'gpt-5'}`));
      console.log(chalk.gray(`API Key数量: ${this.getCredentialCount(siteConfig)}个`));
    }

    // 检查是否为当前使用的站点
    const currentConfig = this.commandType === 'claude'
      ? await this.configManager.getCurrentConfig()
      : await this.configManager.getCurrentCodexConfig();
    const isCurrentSite = currentConfig && currentConfig.site === selectedSite;

    if (isCurrentSite) {
      console.log(chalk.yellow("\n⚠️  警告: 这是当前正在使用的站点！"));
      console.log(chalk.yellow("删除后需要重新选择其他站点配置"));
    }

    // 确认删除
    const { confirmDelete } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmDelete",
        message: chalk.red("确认删除此站点？此操作不可撤销！"),
        default: false,
      },
    ]);

    if (!confirmDelete) {
      showInfo("取消删除操作");
      return;
    }

    // 执行删除
    const spinner = ora("正在创建备份...").start();

    try {
      // 创建完整备份
      const backupResults = await this.configManager.createFullBackup({
        includeCcCli: true,
        includeClaudeCode: true,
        includeCodex: true
      });
      spinner.succeed(`备份已创建: ${chalk.cyan(backupResults.backupDir)}`);

      // 开始删除操作
      spinner.start("正在删除站点...");

      // 删除站点配置
      delete allConfigs.sites[selectedSite];

      // 保存配置文件
      await fs.writeFile(
        this.configManager.configPath,
        JSON.stringify(allConfigs, null, 2),
        "utf8"
      );

      // 如果删除的是当前站点，清空当前配置
      if (isCurrentSite && this.commandType === 'claude') {
        await fs.remove(this.configManager.currentConfigPath);
      }

      spinner.succeed("站点删除成功");
      showSuccess(`🎉 站点 "${selectedSite}" 已成功删除！`);

      if (isCurrentSite) {
        showWarning(`当前配置已清空，请使用 cc ${this.commandType === 'claude' ? 'api' : 'apix'} 重新选择配置`);
      }

      showInfo(`使用 ${chalk.cyan(`cc ${this.commandType === 'claude' ? 'api' : 'apix'} --list`)} 查看剩余配置`);
    } catch (error) {
      spinner.fail();
      throw new Error(`删除站点失败: ${error.message}`);
    }
  }

  // 删除凭证（Token/API Key）
  async deleteCredential(allConfigs) {
    console.log(chalk.yellow.bold(`\n🔑 删除${this.displayName}`));

    // 筛选出有此类型配置的站点
    const filteredSites = Object.entries(allConfigs.sites).filter(
      ([, config]) => config[this.configField]
    );

    if (filteredSites.length === 0) {
      showWarning("没有可删除的站点");
      return;
    }

    // 选择站点
    const siteChoices = filteredSites.map(([key, config]) => {
      const icon = getSiteIcon(key, config);
      const count = this.getCredentialCount(config);
      return {
        name: `${icon} ${key} (${count}个${this.displayName})`,
        value: key,
        short: key,
      };
    });

    const { selectedSite } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedSite",
        message: "选择站点：",
        choices: siteChoices,
        pageSize: 10,
      },
    ]);

    const siteConfig = allConfigs.sites[selectedSite];
    const config = siteConfig[this.configField];

    // 获取凭证列表
    const credentials = this.commandType === 'claude'
      ? config?.env?.[this.tokenField] || {}
      : config?.[this.tokenField] || {};

    // 检查凭证数量
    if (Object.keys(credentials).length === 0) {
      showWarning(`该站点没有${this.displayName}可删除`);
      return;
    }

    if (Object.keys(credentials).length === 1) {
      showWarning(`该站点只有1个${this.displayName}，删除后站点将无法使用`);
      console.log(chalk.gray('建议使用"删除站点"功能删除整个站点'));

      const { confirmDeleteLast } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirmDeleteLast",
          message: `确认删除最后一个${this.displayName}？`,
          default: false,
        },
      ]);

      if (!confirmDeleteLast) {
        showInfo("取消删除操作");
        return;
      }
    }

    // 选择要删除的凭证
    const credentialChoices = Object.entries(credentials).map(([name, value]) => ({
      name: `🔑 ${name} (${value.substring(0, 15)}...)`,
      value: name,
      short: name,
    }));

    const { selectedCredential } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedCredential",
        message: `选择要删除的${this.displayName}：`,
        choices: credentialChoices,
        pageSize: 10,
      },
    ]);

    // 显示凭证信息
    console.log(chalk.white(`\n📋 即将删除的${this.displayName}信息：`));
    console.log(chalk.gray(`站点: ${selectedSite}`));
    console.log(chalk.gray(`${this.displayName}名称: ${selectedCredential}`));
    console.log(chalk.gray(`${this.displayName}值: ${credentials[selectedCredential].substring(0, 20)}...`));

    // 检查是否为当前使用的凭证
    const currentConfig = this.commandType === 'claude'
      ? await this.configManager.getCurrentConfig()
      : await this.configManager.getCurrentCodexConfig();

    const isCurrentCredential = currentConfig &&
      currentConfig.site === selectedSite &&
      (this.commandType === 'claude'
        ? currentConfig.token === credentials[selectedCredential]
        : currentConfig.apiKey === credentials[selectedCredential]);

    if (isCurrentCredential) {
      console.log(chalk.yellow(`\n⚠️  警告: 这是当前正在使用的${this.displayName}！`));
      console.log(chalk.yellow(`删除后需要重新选择其他${this.displayName}`));
    }

    // 确认删除
    const { confirmDelete } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmDelete",
        message: chalk.yellow(`确认删除此${this.displayName}?`),
        default: false,
      },
    ]);

    if (!confirmDelete) {
      showInfo("取消删除操作");
      return;
    }

    // 执行删除
    const spinner = ora("正在创建备份...").start();

    try {
      // 创建完整备份
      const backupResults = await this.configManager.createFullBackup({
        includeCcCli: true,
        includeClaudeCode: true,
        includeCodex: true
      });
      spinner.succeed(`备份已创建: ${chalk.cyan(backupResults.backupDir)}`);

      // 开始删除操作
      spinner.start(`正在删除${this.displayName}...`);

      // 删除凭证
      if (this.commandType === 'claude') {
        delete allConfigs.sites[selectedSite][this.configField].env[this.tokenField][selectedCredential];
      } else {
        delete allConfigs.sites[selectedSite][this.configField][this.tokenField][selectedCredential];
      }

      // 检查是否删除了所有凭证
      const remainingCredentials = this.commandType === 'claude'
        ? Object.keys(allConfigs.sites[selectedSite][this.configField].env[this.tokenField])
        : Object.keys(allConfigs.sites[selectedSite][this.configField][this.tokenField]);

      let deletedConfig = false;
      let deletedEntireSite = false;

      if (remainingCredentials.length === 0) {
        // 删除配置段
        delete allConfigs.sites[selectedSite][this.configField];
        deletedConfig = true;

        // 检查站点是否还有其他配置
        const hasOtherConfig = Object.keys(allConfigs.sites[selectedSite]).some(
          key => key !== 'url' && key !== 'description'
        );

        if (!hasOtherConfig) {
          // 如果站点没有其他配置，删除整个站点
          delete allConfigs.sites[selectedSite];
          deletedEntireSite = true;
          spinner.text = "正在删除站点（已无任何配置）...";
        } else {
          spinner.text = `正在删除${this.commandType === 'claude' ? 'Claude' : 'Codex'}配置（站点保留其他配置）...`;
        }
      }

      // 保存配置文件
      await fs.writeFile(
        this.configManager.configPath,
        JSON.stringify(allConfigs, null, 2),
        "utf8"
      );

      // 如果删除的是当前凭证，清空当前配置
      if (isCurrentCredential && this.commandType === 'claude') {
        await fs.remove(this.configManager.currentConfigPath);
      }

      if (deletedEntireSite) {
        spinner.succeed("站点删除成功（已无任何配置）");
        showSuccess(`🎉 站点 "${selectedSite}" 已被删除（所有配置已清空）`);
      } else if (deletedConfig) {
        spinner.succeed(`${this.commandType === 'claude' ? 'Claude' : 'Codex'}配置删除成功`);
        showSuccess(`🎉 站点 "${selectedSite}" 的${this.commandType === 'claude' ? 'Claude' : 'Codex'}配置已删除（保留其他配置）`);
      } else {
        spinner.succeed(`${this.displayName}删除成功`);
        showSuccess(`🎉 ${this.displayName} "${selectedCredential}" 已成功删除！`);
      }

      if (isCurrentCredential) {
        showWarning(`当前配置已清空，请使用 cc ${this.commandType === 'claude' ? 'api' : 'apix'} 重新选择配置`);
      }

      showInfo(`使用 ${chalk.cyan(`cc ${this.commandType === 'claude' ? 'api' : 'apix'} --list`)} 查看剩余配置`);
    } catch (error) {
      spinner.fail();
      throw new Error(`删除${this.displayName}失败: ${error.message}`);
    }
  }
}

// Edit命令基类
export class EditCommandBase {
  constructor(config = {}) {
    this.configManager = new ManagerConfig();
    this.commandType = config.commandType; // 'claude' or 'codex'
    this.commandName = config.commandName || 'api'; // 'api' or 'apix'
  }

  // 执行编辑配置文件
  async execute(args = []) {
    try {
      const skipWait = args.includes('--skip-wait');
      showInfo('📝 打开API配置文件进行编辑');

      // 检查配置文件是否存在
      const configExists = await this.configManager.configExists();

      if (!configExists) {
        showWarning('配置文件不存在，将创建默认配置文件');
        await this.createDefaultConfigFile();
      } else {
        // 如果配置文件存在，先创建完整备份
        const spinner = ora('正在创建备份...').start();
        try {
          const backupResults = await this.configManager.createFullBackup({
            includeCcCli: true,
            includeClaudeCode: true,
            includeCodex: true
          });
          spinner.succeed(`备份已创建: ${chalk.cyan(backupResults.backupDir)}`);
          showInfo('💡 编辑前已自动创建完整备份，如果配置出错可以恢复');
        } catch (error) {
          spinner.fail();
          showWarning(`创建备份失败: ${error.message}`);
          showWarning('将继续打开编辑器，请小心编辑配置文件');
        }
      }

      // 打开配置文件
      await this.openConfigFile();

      // 等待用户确认后返回
      if (!skipWait) {
        await waitForBackConfirm('编辑操作完成');
      }

    } catch (error) {
      showError(`编辑配置文件失败: ${error.message}`);
    }
  }

  // 创建默认配置文件
  async createDefaultConfigFile() {
    try {
      await this.configManager.ensureConfigDir();

      const defaultConfig = {
        sites: {
          "示例站点": {
            "description": "这是一个示例配置，请根据需要修改",
            "url": "https://api.example.com",
            "claude": {
              "env": {
                "ANTHROPIC_BASE_URL": "https://api.example.com",
                "ANTHROPIC_AUTH_TOKEN": {
                  "主账号": "sk-ant-api-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
                  "备用账号": "sk-ant-api-yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"
                }
              }
            }
          }
        }
      };

      await fs.writeFile(
        this.configManager.configPath,
        JSON.stringify(defaultConfig, null, 2),
        'utf8'
      );

      showSuccess(`默认配置文件已创建: ${this.configManager.configPath}`);

    } catch (error) {
      throw new Error(`创建默认配置文件失败: ${error.message}`);
    }
  }

  // 打开配置文件
  async openConfigFile() {
    const configPath = this.configManager.configPath;

    showInfo(`配置文件路径: ${chalk.cyan(configPath)}`);

    // 根据操作系统选择合适的打开命令
    let command;
    const platform = process.platform;

    if (platform === 'win32') {
      // Windows: 使用默认程序打开
      command = `start "" "${configPath}"`;
    } else if (platform === 'darwin') {
      // macOS: 使用 open 命令
      command = `open "${configPath}"`;
    } else {
      // Linux: 使用 xdg-open 命令
      command = `xdg-open "${configPath}"`;
    }

    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          // 如果默认程序打开失败，尝试用文本编辑器
          this.tryOpenWithTextEditor(configPath)
            .then(resolve)
            .catch(reject);
          return;
        }

        showSuccess('✅ 配置文件已在默认编辑器中打开');
        showInfo('💡 编辑完成后保存文件即可生效');
        showInfo(`💡 使用 ${chalk.cyan(`cc ${this.commandName} --list`)} 验证配置是否正确`);
        resolve();
      });
    });
  }

  // 尝试用文本编辑器打开
  async tryOpenWithTextEditor(configPath) {
    const editors = ['code', 'notepad', 'vim', 'nano', 'gedit'];

    for (const editor of editors) {
      try {
        await this.openWithEditor(editor, configPath);
        showSuccess(`✅ 配置文件已在 ${editor} 中打开`);
        showInfo('💡 编辑完成后保存文件即可生效');
        showInfo(`💡 使用 ${chalk.cyan(`cc ${this.commandName} --list`)} 验证配置是否正确`);
        return;
      } catch (error) {
        // 继续尝试下一个编辑器
        continue;
      }
    }

    // 所有编辑器都失败了，显示手动操作提示
    showWarning('无法自动打开编辑器');
    showInfo(`请手动打开配置文件: ${chalk.cyan(configPath)}`);
    showInfo('💡 编辑完成后保存文件即可生效');
    showInfo(`💡 使用 ${chalk.cyan(`cc ${this.commandName} --list`)} 验证配置是否正确`);
  }

  // 使用指定编辑器打开文件
  openWithEditor(editor, configPath) {
    return new Promise((resolve, reject) => {
      exec(`${editor} "${configPath}"`, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
}

// 快速使用命令基类（专用于 apiuse/apiusex 等快速命令）
export class QuickUseCommandBase {
  // 构造函数
  constructor(options) {
    this.commandName = options.commandName;
    this.description = options.description;
    this.commandType = options.commandType; // 'claude' or 'codex'
    this.configField = options.configField; // 'claude' or 'codex'
    this.tokenField = options.tokenField; // 'ANTHROPIC_AUTH_TOKEN' or 'OPENAI_API_KEY'
    this.displayName = options.displayName; // 'Claude' or 'Codex'
    this.configManager = new ManagerConfig();
  }

  // 注册命令到commander
  async register(program) {
    const command = program
      .command(this.commandName)
      .description(this.description)
      .action(async () => {
        await this.execute();
      });

    // 添加帮助文本
    this.addQuickHelpText(command);
  }

  // 执行快速使用命令
  async execute() {
    console.log(chalk.cyan.bold(`\n🚀 ${this.displayName} API 快速切换`));
    console.log(chalk.gray('═'.repeat(40)));

    const spinner = ora('正在加载配置...').start();

    try {
      // 检查配置文件是否存在
      if (!await this.configManager.configExists()) {
        spinner.fail();
        showError('配置文件不存在');
        showInfo('请确保 ~/.cc-cli/api_configs.json 文件存在');
        showInfo(`可以使用 "cc ${this.commandType === 'claude' ? 'api' : 'apix'} --add" 添加新配置`);
        return false;
      }

      // 读取所有配置
      const allConfigs = await this.configManager.getAllConfigs();

      // 验证配置结构 - 使用特定类型的验证方法
      const isValid = this.commandType === 'claude' 
        ? this.configManager.validateClaudeConfig(allConfigs)
        : this.configManager.validateCodexConfig(allConfigs);
        
      if (!isValid) {
        spinner.fail();
        showError('配置文件格式无效');
        showInfo('请检查配置文件格式或使用命令编辑配置');
        return false;
      }

      spinner.succeed('配置加载完成');

      // 过滤出有对应配置的站点
      const filteredSites = {};
      for (const [siteKey, siteConfig] of Object.entries(allConfigs.sites)) {
        if (siteConfig[this.configField]) {
          filteredSites[siteKey] = siteConfig;
        }
      }

      // 检查是否有可用的配置
      if (Object.keys(filteredSites).length === 0) {
        showError(`没有找到${this.displayName}配置`);
        showInfo(`请在api_configs.json中添加带有"${this.configField}"字段的站点配置`);
        return false;
      }

      // 执行快速切换逻辑
      await this.executeQuickSwitch(filteredSites);
      return true;

    } catch (error) {
      spinner.fail();
      showError(`快速切换失败: ${error.message}`);

      if (error.message.includes('配置文件不存在')) {
        showInfo('请确保以下文件存在：');
        console.log(chalk.gray('  ~/.cc-cli/api_configs.json'));
        showInfo(`使用 "cc ${this.commandType === 'claude' ? 'api' : 'apix'} --add" 来创建第一个配置`);
      }

      return false;
    }
  }

  // 执行快速切换逻辑（被子类实现）
  async executeQuickSwitch(filteredSites) {
    throw new Error('executeQuickSwitch方法需要被子类实现');
  }

  // 添加快速命令帮助文本
  addQuickHelpText(command) {
    const helpText = `\n\n这是一条快速命令，直接跳转到${this.displayName}配置选择界面。
\n如果您需要完整的配置管理功能，请使用：\n  ${chalk.cyan(`cc ${this.commandType === 'claude' ? 'api' : 'apix'}`)}`;
    command.addHelpText('after', helpText);
  }
}

// List命令基类
export class ListCommandBase {
  constructor(config = {}) {
    this.configManager = new ManagerConfig();
    this.commandType = config.commandType; // 'claude' or 'codex'
    this.configField = config.configField; // 'claude' or 'codex'
    this.displayName = config.displayName; // 'Claude' or 'Codex'
    this.commandName = config.commandName; // 'api' or 'apix'
    this.validateMethod = config.validateMethod; // 验证方法名称
    this.getCurrentMethod = config.getCurrentMethod; // 获取当前配置方法名称
    this.formatMethod = config.formatMethod; // 格式化方法
  }

  // 执行配置列表显示
  async execute(args = []) {
    const spinner = ora('正在加载配置...').start();

    try {
      // 检查配置文件是否存在
      if (!(await this.configManager.configExists())) {
        spinner.fail();

        const errorMessage = formatError(
          '配置文件不存在',
          '无法找到 ~/.cc-cli/api_configs.json 文件',
          `请使用 cc ${this.commandName} --add 添加${this.displayName}配置`
        );

        console.log(errorMessage);
        return;
      }

      // 读取所有配置
      const allConfigs = await this.configManager.getAllConfigs();

      // 验证配置
      const hasValidConfig = this.validateConfigs(allConfigs);

      if (!hasValidConfig) {
        spinner.fail();
        const errorMessage = formatError(
          `没有找到${this.displayName}配置`,
          `配置文件中未找到包含"${this.configField}"字段的站点配置`,
          `请使用 cc ${this.commandName} --add 添加${this.displayName}配置`
        );
        console.log(errorMessage);
        return;
      }

      spinner.succeed('配置加载完成');

      // 显示配置列表（不再传递currentConfig）
      const configList = this.formatMethod(allConfigs);
      console.log(configList);

      // 等待用户确认后返回
      await waitForBackConfirm('配置信息显示完成');

    } catch (error) {
      spinner.fail();

      if (error.message.includes('配置文件不存在')) {
        const errorMessage = formatError(
          `${this.displayName}配置文件访问失败`,
          error.message,
          `1. 确保配置文件存在\\n2. 检查用户目录权限\\n3. 尝试使用 cc ${this.commandName} --add 添加配置`
        );
        console.log(errorMessage);
      } else {
        showError(`读取配置失败: ${error.message}`);
      }
    }
  }

  // 验证配置
  validateConfigs(allConfigs) {
    if (this.validateMethod) {
      // 使用 ManagerConfig 的验证方法
      return this.configManager[this.validateMethod](allConfigs);
    }

    // 默认验证逻辑：检查是否有对应配置字段
    return Object.values(allConfigs.sites || {}).some(
      siteConfig => siteConfig[this.configField]
    );
  }


}

