import chalk from 'chalk';
import inquirer from 'inquirer';
import ora from 'ora';
import ManagerConfig from '../../core/manager-config.js';
import { showSuccess, showError, showInfo, createBackChoice } from '../../utils/ui.js';

/**
 * 备份与恢复命令
 */
class BackupCommand {
  constructor() {
    this.configManager = new ManagerConfig();
  }

  // 注册命令
  async register(program) {
    const command = program
      .command('backup')
      .description('配置备份与恢复')
      .action(async () => {
        await this.execute();
      });
  }

  // 执行命令
  async execute() {
    await this.showBackupMenu();
  }

  // 显示备份菜单
  async showBackupMenu() {
    console.clear();
    console.log(chalk.cyan.bold('\n📦 配置备份与恢复'));
    console.log(chalk.gray('═'.repeat(50)));

    while (true) {
      const { action } = await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: '请选择操作：',
          choices: [
            {
              name: '💾 创建备份 - 选择要备份的配置',
              value: 'create',
              short: '创建备份'
            },
            {
              name: '♻️  恢复备份 - 从备份恢复配置',
              value: 'restore',
              short: '恢复备份'
            },
            {
              name: '📋 查看备份 - 列出所有备份',
              value: 'list',
              short: '查看备份'
            },
            new inquirer.Separator(),
            createBackChoice('back')
          ],
          pageSize: 10
        }
      ]);

      if (action === 'back') {
        break;
      }

      switch (action) {
        case 'create':
          await this.createBackup();
          break;
        case 'restore':
          await this.restoreBackup();
          break;
        case 'list':
          await this.listBackups();
          break;
      }
    }
  }

  // 创建备份
  async createBackup() {
    console.log(chalk.cyan.bold('\n💾 创建配置备份'));
    console.log(chalk.gray('─'.repeat(50)));

    // 选择要备份的配置
    const { backupItems } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'backupItems',
        message: '选择要备份的配置：',
        choices: [
          {
            name: '📁 CC-CLI 配置 - api_configs.json',
            value: 'ccCli',
            checked: true
          },
          {
            name: '📄 Claude Code 配置 - settings.json, CLAUDE.md, agents/, commands/',
            value: 'claudeCode',
            checked: true
          },
          {
            name: '📄 Codex 配置 - config.toml, auth.json, AGENTS.md',
            value: 'codex',
            checked: true
          }
        ],
        validate: (answer) => {
          if (answer.length === 0) {
            return '至少选择一个配置项进行备份';
          }
          return true;
        }
      }
    ]);

    const spinner = ora('正在创建备份...').start();

    try {
      const options = {
        includeCcCli: backupItems.includes('ccCli'),
        includeClaudeCode: backupItems.includes('claudeCode'),
        includeCodex: backupItems.includes('codex')
      };

      const backupResults = await this.configManager.createFullBackup(options);

      spinner.succeed('备份创建成功！');

      showSuccess(`\n✅ 备份已保存到: ${chalk.cyan(backupResults.backupDir)}`);
      showInfo(`\n📋 已备份的文件 (${backupResults.files.length}个):`);
      backupResults.files.forEach(file => {
        console.log(chalk.gray(`   • ${file}`));
      });

      console.log(chalk.gray(`\n💡 备份目录: ${this.configManager.backupsDir}`));

    } catch (error) {
      spinner.fail();
      showError(`创建备份失败: ${error.message}`);
    }

    await this.waitForContinue();
  }

  // 恢复备份
  async restoreBackup() {
    console.log(chalk.cyan.bold('\n♻️  恢复配置备份'));
    console.log(chalk.gray('─'.repeat(50)));

    const spinner = ora('正在加载备份列表...').start();

    try {
      const fullBackups = await this.configManager.getFullBackupsList();
      const apiBackups = await this.configManager.getBackupsList();

      spinner.succeed('备份列表加载完成');

      if (fullBackups.length === 0 && apiBackups.length === 0) {
        showError('没有找到可用的备份');
        await this.waitForContinue();
        return;
      }

      const choices = [];

      // 添加完整备份选项
      if (fullBackups.length > 0) {
        choices.push(new inquirer.Separator(chalk.cyan('完整备份:')));
        fullBackups.forEach((backup, index) => {
          const timeStr = backup.mtime.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });
          const sizeMB = (backup.size / 1024 / 1024).toFixed(2);
          choices.push({
            name: `📦 ${timeStr} (${sizeMB} MB)`,
            value: { type: 'full', path: backup.path },
            short: `完整备份 ${index + 1}`
          });
        });
      }

      // 添加API配置备份选项
      if (apiBackups.length > 0) {
        choices.push(new inquirer.Separator(chalk.cyan('\nAPI配置备份:')));
        apiBackups.forEach((backup, index) => {
          const timeStr = backup.mtime.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });
          const sizeKB = (backup.size / 1024).toFixed(2);
          choices.push({
            name: `📄 ${timeStr} (${sizeKB} KB)`,
            value: { type: 'api', path: backup.path },
            short: `API备份 ${index + 1}`
          });
        });
      }

      choices.push(new inquirer.Separator());
      choices.push({
        name: '❌ 取消恢复',
        value: null,
        short: '取消'
      });

      const { selectedBackup } = await inquirer.prompt([
        {
          type: 'list',
          name: 'selectedBackup',
          message: '选择要恢复的备份：',
          choices,
          pageSize: 15
        }
      ]);

      if (!selectedBackup) {
        showInfo('已取消恢复操作');
        await this.waitForContinue();
        return;
      }

      // 根据备份类型执行不同的恢复流程
      if (selectedBackup.type === 'full') {
        await this.restoreFullBackup(selectedBackup.path);
      } else {
        await this.restoreApiBackup(selectedBackup.path);
      }

    } catch (error) {
      spinner.fail();
      showError(`恢复备份失败: ${error.message}`);
      await this.waitForContinue();
    }
  }

  // 恢复完整备份
  async restoreFullBackup(backupPath) {
    // 选择要恢复的配置项
    const { restoreItems } = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'restoreItems',
        message: '选择要恢复的配置：',
        choices: [
          {
            name: '📁 CC-CLI 配置',
            value: 'ccCli',
            checked: true
          },
          {
            name: '📄 Claude Code 配置',
            value: 'claudeCode',
            checked: true
          },
          {
            name: '📄 Codex 配置',
            value: 'codex',
            checked: true
          }
        ],
        validate: (answer) => {
          if (answer.length === 0) {
            return '至少选择一个配置项进行恢复';
          }
          return true;
        }
      }
    ]);

    // 确认恢复
    const { confirmRestore } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmRestore',
        message: chalk.yellow('确认要恢复选中的配置？当前配置文件将被覆盖！'),
        default: false
      }
    ]);

    if (!confirmRestore) {
      showInfo('已取消恢复操作');
      await this.waitForContinue();
      return;
    }

    const spinner = ora('正在恢复备份...').start();

    try {
      const options = {
        restoreCcCli: restoreItems.includes('ccCli'),
        restoreClaudeCode: restoreItems.includes('claudeCode'),
        restoreCodex: restoreItems.includes('codex')
      };

      const restoredFiles = await this.configManager.restoreFromFullBackup(backupPath, options);

      spinner.succeed('备份恢复成功！');

      showSuccess(`\n✅ 已恢复 ${restoredFiles.length} 个文件/目录:`);
      restoredFiles.forEach(file => {
        console.log(chalk.gray(`   • ${file}`));
      });

    } catch (error) {
      spinner.fail();
      showError(`恢复备份失败: ${error.message}`);
    }

    await this.waitForContinue();
  }

  // 恢复API配置备份
  async restoreApiBackup(backupPath) {
    // 确认恢复
    const { confirmRestore } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmRestore',
        message: chalk.yellow('确认要恢复此API配置备份？当前配置将被覆盖！'),
        default: false
      }
    ]);

    if (!confirmRestore) {
      showInfo('已取消恢复操作');
      await this.waitForContinue();
      return;
    }

    const spinner = ora('正在恢复备份...').start();

    try {
      await this.configManager.restoreFromBackup(backupPath);
      spinner.succeed('备份恢复成功！');
      showSuccess('\n✅ API配置已成功恢复');
      showInfo('💡 使用 cc api --list 或 cc apix --list 查看配置');
    } catch (error) {
      spinner.fail();
      showError(`恢复备份失败: ${error.message}`);
    }

    await this.waitForContinue();
  }

  // 列出所有备份
  async listBackups() {
    console.log(chalk.cyan.bold('\n📋 备份列表'));
    console.log(chalk.gray('─'.repeat(50)));

    const spinner = ora('正在加载备份列表...').start();

    try {
      const fullBackups = await this.configManager.getFullBackupsList();
      const apiBackups = await this.configManager.getBackupsList();

      spinner.succeed('备份列表加载完成');

      if (fullBackups.length === 0 && apiBackups.length === 0) {
        showInfo('\n没有找到任何备份');
        await this.waitForContinue();
        return;
      }

      // 显示完整备份
      if (fullBackups.length > 0) {
        console.log(chalk.cyan.bold('\n📦 完整备份:'));
        fullBackups.forEach((backup, index) => {
          const timeStr = backup.mtime.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });
          const sizeMB = (backup.size / 1024 / 1024).toFixed(2);
          console.log(chalk.white(`\n${index + 1}. ${backup.name}`));
          console.log(chalk.gray(`   时间: ${timeStr}`));
          console.log(chalk.gray(`   大小: ${sizeMB} MB`));
          console.log(chalk.gray(`   路径: ${backup.path}`));
        });
      }

      // 显示API配置备份
      if (apiBackups.length > 0) {
        console.log(chalk.cyan.bold('\n📄 API配置备份:'));
        apiBackups.forEach((backup, index) => {
          const timeStr = backup.mtime.toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
          });
          const sizeKB = (backup.size / 1024).toFixed(2);
          console.log(chalk.white(`\n${index + 1}. ${backup.name}`));
          console.log(chalk.gray(`   时间: ${timeStr}`));
          console.log(chalk.gray(`   大小: ${sizeKB} KB`));
        });
      }

      console.log(chalk.gray(`\n💡 备份目录: ${this.configManager.backupsDir}`));

    } catch (error) {
      spinner.fail();
      showError(`加载备份列表失败: ${error.message}`);
    }

    await this.waitForContinue();
  }

  // 等待用户确认继续
  async waitForContinue() {
    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: chalk.gray('按回车键继续...'),
        prefix: ''
      }
    ]);
  }
}

export default new BackupCommand();
