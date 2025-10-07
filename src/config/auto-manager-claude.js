import fs from 'fs-extra';
import BaseAutoManager from './base-auto-manager.js';
import configPaths from './paths-config.js';

/**
 * Claude Code 自动模式管理器
 * 负责 Claude Code 的自动模式开启和关闭
 * 通过修改 ~/.claude/settings.json 的 hooks 配置实现
 */
class ClaudeAutoManager extends BaseAutoManager {
  constructor() {
    super({
      configDir: configPaths.claudeDir,
      configFile: configPaths.claudeSettings,
      displayName: 'Claude Code'
    });

    this.autoCommand = 'cc claude-auto'; // 自动模式使用的命令
  }

  /**
   * 检查自动模式状态
   * @returns {Promise<boolean>} true表示已开启，false表示未开启
   */
  async checkAutoModeStatus() {
    try {
      // 如果配置文件不存在，认为未开启
      if (!await fs.pathExists(this.configFile)) {
        return false;
      }

      // 读取配置文件内容
      const settingsContent = await fs.readFile(this.configFile, 'utf8');
      const settings = JSON.parse(settingsContent);

      // 检查是否存在自动模式的hooks配置
      if (settings.hooks && settings.hooks.PreToolUse) {
        for (const hook of settings.hooks.PreToolUse) {
          if (hook.hooks && hook.hooks.some(h =>
            h.type === 'command' &&
            h.command &&
            (h.command.includes('cc claude-auto') || h.command.includes('claude-auto'))
          )) {
            return true;
          }

          // 检测旧命令并自动迁移
          if (hook.hooks && hook.hooks.some(h =>
            h.type === 'command' &&
            h.command &&
            (h.command.includes('cc claude-yolo') || h.command.includes('claude-yolo'))
          )) {
            // 自动迁移到新命令
            await this.migrateToNewCommand();
            return true;
          }
        }
      }

      return false;

    } catch (error) {
      // 发生错误时认为未开启
      return false;
    }
  }

  /**
   * 获取自动模式的配置说明
   * @returns {Array<string>} 配置说明数组
   */
  getAutoConfigDescription() {
    return [
      'Claude Code hooks配置',
      `命令: ${this.autoCommand}`,
      '自动批准所有工具使用'
    ];
  }

  /**
   * 开启自动模式
   */
  async enableAutoMode() {
    // 确保Claude配置目录存在
    await fs.ensureDir(this.configDir);

    // 添加hooks配置
    await this.addAutoHook();
  }

  /**
   * 关闭自动模式
   */
  async disableAutoMode() {
    // 移除hooks配置
    await this.removeAutoHook();
  }

  /**
   * 迁移旧命令到新命令
   * @private
   */
  async migrateToNewCommand() {
    if (!await fs.pathExists(this.configFile)) {
      return;
    }

    // 读取现有配置
    const settingsContent = await fs.readFile(this.configFile, 'utf8');
    const settings = JSON.parse(settingsContent);

    // 更新所有旧命令为新命令
    if (settings.hooks && settings.hooks.PreToolUse) {
      settings.hooks.PreToolUse = settings.hooks.PreToolUse.map(hook => {
        if (hook.hooks) {
          hook.hooks = hook.hooks.map(h => {
            if (h.type === 'command' && h.command &&
                (h.command.includes('cc claude-yolo') || h.command.includes('claude-yolo'))) {
              return {
                ...h,
                command: this.autoCommand
              };
            }
            return h;
          });
        }
        return hook;
      });

      // 写入配置文件
      await fs.writeFile(this.configFile, JSON.stringify(settings, null, 2), 'utf8');
    }
  }

  /**
   * 添加自动模式hooks配置
   * @private
   */
  async addAutoHook() {
    let settings = {};

    // 读取现有配置
    if (await fs.pathExists(this.configFile)) {
      const settingsContent = await fs.readFile(this.configFile, 'utf8');
      settings = JSON.parse(settingsContent);
    }

    // 确保hooks结构存在
    if (!settings.hooks) {
      settings.hooks = {};
    }
    if (!settings.hooks.PreToolUse) {
      settings.hooks.PreToolUse = [];
    }

    // 添加自动模式hooks配置
    const autoHook = {
      matcher: ".*",
      hooks: [
        {
          type: "command",
          command: this.autoCommand
        }
      ]
    };

    // 检查是否已存在相同配置，避免重复添加
    const existingHook = settings.hooks.PreToolUse.find(hook =>
      hook.hooks && hook.hooks.some(h =>
        h.type === 'command' &&
        h.command &&
        (h.command.includes('cc claude-yolo') || h.command.includes('claude-yolo'))
      )
    );

    if (!existingHook) {
      settings.hooks.PreToolUse.push(autoHook);
    }

    // 写入配置文件
    await fs.writeFile(this.configFile, JSON.stringify(settings, null, 2), 'utf8');
  }

  /**
   * 移除自动模式hooks配置
   * @private
   */
  async removeAutoHook() {
    if (!await fs.pathExists(this.configFile)) {
      return;
    }

    // 读取现有配置
    const settingsContent = await fs.readFile(this.configFile, 'utf8');
    const settings = JSON.parse(settingsContent);

    // 移除自动模式hooks配置（包括新旧命令）
    if (settings.hooks && settings.hooks.PreToolUse) {
      settings.hooks.PreToolUse = settings.hooks.PreToolUse.filter(hook =>
        !(hook.hooks && hook.hooks.some(h =>
          h.type === 'command' &&
          h.command &&
          (h.command.includes('cc claude-auto') || h.command.includes('claude-auto') ||
           h.command.includes('cc claude-yolo') || h.command.includes('claude-yolo'))
        ))
      );

      // 如果PreToolUse为空，删除
      if (settings.hooks.PreToolUse.length === 0) {
        delete settings.hooks.PreToolUse;
      }

      // 如果hooks为空，删除hooks节点
      if (Object.keys(settings.hooks).length === 0) {
        delete settings.hooks;
      }
    }

    // 写入配置文件
    await fs.writeFile(this.configFile, JSON.stringify(settings, null, 2), 'utf8');
  }

  /**
   * 获取自动模式相关配置文件路径
   * @returns {Object} 配置文件路径信息
   */
  getConfigPaths() {
    return {
      ...super.getConfigPaths(),
      autoCommand: this.autoCommand
    };
  }
}

// 导出单例实例
export default new ClaudeAutoManager();
