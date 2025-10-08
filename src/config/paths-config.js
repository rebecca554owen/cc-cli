import path from 'path';
import os from 'os';
import fs from 'fs-extra';

/**
 * 配置路径管理器
 * 统一管理所有配置文件和目录的路径
 * 避免路径硬编码分散在各个文件中
 */
class ConfigPaths {
  constructor() {
    // 基础目录
    this._homeDir = os.homedir();
    this._claudeDir = path.join(this._homeDir, '.claude');
    this._codexDir = path.join(this._homeDir, '.codex');
    this._iflowDir = path.join(this._homeDir, '.iflow');
    this._ccCliDir = path.join(this._homeDir, '.cc-cli');
  }

  // ==================== 基础目录 ====================

  /**
   * 用户主目录
   * @returns {string} 用户主目录路径
   */
  get homeDir() {
    return this._homeDir;
  }

  /**
   * Claude Code 配置目录 (~/.claude)
   * @returns {string} Claude 配置目录路径
   */
  get claudeDir() {
    return this._claudeDir;
  }

  /**
   * Codex 配置目录 (~/.codex)
   * @returns {string} Codex 配置目录路径
   */
  get codexDir() {
    return this._codexDir;
  }

  /**
   * iFlow 配置目录 (~/.iflow)
   * @returns {string} iFlow 配置目录路径
   */
  get iflowDir() {
    return this._iflowDir;
  }

  /**
   * CC-CLI 配置目录 (~/.cc-cli)
   * @returns {string} CC-CLI 配置目录路径
   */
  get ccCliDir() {
    return this._ccCliDir;
  }

  // ==================== Claude Code 相关路径 ====================

  /**
   * Claude Code 全局配置文件 (~/.claude/settings.json)
   * @returns {string} settings.json 文件路径
   */
  get claudeSettings() {
    return path.join(this._claudeDir, 'settings.json');
  }

  /**
   * Claude Code hooks 目录 (~/.claude/hooks)
   * @returns {string} hooks 目录路径
   */
  get claudeHooksDir() {
    return path.join(this._claudeDir, 'hooks');
  }

  // ==================== Codex 相关路径 ====================

  /**
   * Codex 主配置文件 (~/.codex/config.toml)
   * @returns {string} config.toml 文件路径
   */
  get codexConfig() {
    return path.join(this._codexDir, 'config.toml');
  }

  /**
   * Codex 认证文件 (~/.codex/auth.json)
   * @returns {string} auth.json 文件路径
   */
  get codexAuth() {
    return path.join(this._codexDir, 'auth.json');
  }

  // ==================== iFlow 相关路径 ====================

  /**
   * iFlow 主配置文件 (~/.iflow/config.json)
   * @returns {string} config.json 文件路径
   */
  get iflowConfig() {
    return path.join(this._iflowDir, 'config.json');
  }

  /**
   * iFlow 认证文件 (~/.iflow/auth.json)
   * @returns {string} auth.json 文件路径
   */
  get iflowAuth() {
    return path.join(this._iflowDir, 'auth.json');
  }



  // ==================== CC-CLI 相关路径 ====================

  /**
   * CC-CLI 统一 API 配置文件 (~/.cc-cli/api_configs.json)
   * @returns {string} api_configs.json 文件路径
   */
  get apiConfigs() {
    return path.join(this._ccCliDir, 'api_configs.json');
  }

  /**
   * CC-CLI 备份目录 (~/.cc-cli/backups)
   * @returns {string} 备份目录路径
   */
  get backupsDir() {
    return path.join(this._ccCliDir, 'backups');
  }

  // ==================== 辅助方法 ====================

  /**
   * 获取所有配置目录列表
   * @returns {Array<{name: string, path: string}>} 配置目录列表
   */
  getAllConfigDirs() {
    return [
      { name: 'Claude', path: this.claudeDir },
      { name: 'Codex', path: this.codexDir },
      { name: 'iFlow', path: this.iflowDir },
      { name: 'CC-CLI', path: this.ccCliDir }
    ];
  }

  /**
   * 获取所有配置文件列表
   * @returns {Array<{name: string, path: string, description: string}>} 配置文件列表
   */
  getAllConfigFiles() {
    return [
      {
        name: 'Claude Settings',
        path: this.claudeSettings,
        description: 'Claude Code 全局配置'
      },
      {
        name: 'Codex Config',
        path: this.codexConfig,
        description: 'Codex 主配置文件'
      },
      {
        name: 'Codex Auth',
        path: this.codexAuth,
        description: 'Codex 认证文件'
      },
      {
        name: 'iFlow Config',
        path: this.iflowConfig,
        description: 'iFlow 主配置文件'
      },
      {
        name: 'iFlow Auth',
        path: this.iflowAuth,
        description: 'iFlow 认证文件'
      },
      {
        name: 'API Configs',
        path: this.apiConfigs,
        description: 'CC-CLI 统一 API 配置'
      }
    ];
  }

  /**
   * 获取指定服务的配置目录
   * @param {'claude'|'codex'|'iflow'|'ccCli'} service 服务名称
   * @returns {string} 配置目录路径
   */
  getServiceDir(service) {
    const dirs = {
      claude: this.claudeDir,
      codex: this.codexDir,
      iflow: this.iflowDir,
      ccCli: this.ccCliDir
    };
    return dirs[service] || null;
  }

  /**
  * 生成自定义路径
   * @param {'claude'|'codex'|'ccCli'} service 服务名称
   * @param {string} filename 文件名
   * @returns {string} 完整文件路径
   */
  getCustomPath(service, filename) {
    const baseDir = this.getServiceDir(service);
    return baseDir ? path.join(baseDir, filename) : null;
  }
}

// 导出单例实例
export default new ConfigPaths();
