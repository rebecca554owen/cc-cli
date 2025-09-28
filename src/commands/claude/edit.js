import chalk from 'chalk';
import { exec } from 'child_process';
import fs from 'fs-extra';
import path from 'path';

import ConfigManager from '../../core/ConfigManager.js';
import { showError, showSuccess, showInfo, showWarning, waitForBackConfirm } from '../../utils/ui.js';

/**
 * API配置编辑命令
 */
class EditCommand {
  constructor() {
    this.configManager = new ConfigManager();
  }

  /**
   * 执行编辑配置文件
   * @param {Array} args 参数
   */
  async execute(args = []) {
    try {
      showInfo('📝 打开API配置文件进行编辑');

      // 检查配置文件是否存在
      const configExists = await this.configManager.configExists();

      if (!configExists) {
        showWarning('配置文件不存在，将创建默认配置文件');
        await this.createDefaultConfigFile();
      }

      // 打开配置文件
      await this.openConfigFile();

      // 等待用户确认后返回
      await waitForBackConfirm('编辑操作完成');

    } catch (error) {
      showError(`编辑配置文件失败: ${error.message}`);
    }
  }

  /**
   * 创建默认配置文件
   */
  async createDefaultConfigFile() {
    try {
      await this.configManager.ensureConfigDir();

      const defaultConfig = {
        sites: {
          "示例站点": {
            "description": "这是一个示例配置，请根据需要修改",
            "url": "https://api.example.com",
            "config": {
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

  /**
   * 打开配置文件
   */
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
        showInfo(`💡 使用 ${chalk.cyan('cc api --list')} 验证配置是否正确`);
        resolve();
      });
    });
  }

  /**
   * 尝试用文本编辑器打开
   */
  async tryOpenWithTextEditor(configPath) {
    const editors = ['code', 'notepad', 'vim', 'nano', 'gedit'];

    for (const editor of editors) {
      try {
        await this.openWithEditor(editor, configPath);
        showSuccess(`✅ 配置文件已在 ${editor} 中打开`);
        showInfo('💡 编辑完成后保存文件即可生效');
        showInfo(`💡 使用 ${chalk.cyan('cc api --list')} 验证配置是否正确`);
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
    showInfo(`💡 使用 ${chalk.cyan('cc api --list')} 验证配置是否正确`);
  }

  /**
   * 使用指定编辑器打开文件
   */
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

export default new EditCommand();