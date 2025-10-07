/**
 * Codex 配置文件构建器
 * 负责生成和管理 Codex 的 TOML 配置文件
 */
class CodexConfigBuilder {
  constructor(existingConfig = '') {
    this.existingConfig = existingConfig;
    this.lines = existingConfig.split('\n');
    this.topLevelConfig = [];
    this.sectionConfigs = [];
  }

  /**
   * 生成完整的 TOML 配置
   * @param {Object} codexConfig Codex配置
   * @param {string} providerKey 提供商key
   * @param {Object} providerConfig 提供商配置
   * @returns {string} 生成的TOML配置内容
   */
  generate(codexConfig, providerKey, providerConfig) {
    // 解析现有配置
    const { topLevelConfig, sectionConfigs } = this.parseExisting(codexConfig);

    // 构建新配置
    const newConfig = [];

    // 1. 添加核心配置
    this.addCoreConfig(newConfig, codexConfig, providerKey);

    // 2. 添加其他顶级配置
    this.addOtherTopLevelConfig(newConfig, codexConfig);

    // 3. 确保必要的默认参数
    this.ensureRequiredDefaults(newConfig, topLevelConfig);

    // 4. 添加保留的配置
    if (topLevelConfig.length > 0) {
      newConfig.push(...topLevelConfig);
    }

    newConfig.push(''); // 空行分隔

    // 5. 添加 provider 配置
    this.addProviderConfig(newConfig, providerKey, providerConfig);

    // 6. 添加其他 section 配置
    if (sectionConfigs.length > 0) {
      newConfig.push('');
      newConfig.push(...sectionConfigs);
    }

    return newConfig.join('\n') + '\n';
  }

  /**
   * 解析现有配置
   * @param {Object} codexConfig Codex配置
   * @returns {Object} 解析结果
   * @private
   */
  parseExisting(codexConfig) {
    const topLevelConfig = [];
    const sectionConfigs = [];
    let inModelProvidersSection = false;
    let inOtherSection = false;
    let currentSection = [];

    // 获取新配置中的所有顶级配置项
    const newTopLevelKeys = this.getNewTopLevelKeys(codexConfig);

    for (const line of this.lines) {
      const trimmedLine = line.trim();

      // 检查是否进入model_providers section
      if (trimmedLine.startsWith('[model_providers')) {
        inModelProvidersSection = true;
        continue;
      }

      // 检查是否进入其他section
      if (trimmedLine.startsWith('[') && !trimmedLine.startsWith('[model_providers')) {
        if (inOtherSection && currentSection.length > 0) {
          sectionConfigs.push(...currentSection);
          currentSection = [];
        }
        inModelProvidersSection = false;
        inOtherSection = true;
        currentSection.push(line);
        continue;
      }

      // 在model_providers section内，跳过所有内容
      if (inModelProvidersSection) {
        continue;
      }

      // 在其他section内
      if (inOtherSection) {
        currentSection.push(line);
        continue;
      }

      // 跳过OPENAI_API_KEY（它属于auth.json）
      if (trimmedLine.startsWith('OPENAI_API_KEY =')) {
        continue;
      }

      // 跳过所有与新配置同名的配置项
      if (this.shouldSkipLine(trimmedLine, newTopLevelKeys)) {
        continue;
      }

      // 保留其他顶级配置
      if (!trimmedLine.startsWith('[') && trimmedLine !== '') {
        topLevelConfig.push(line);
      }
    }

    // 保存最后一个section
    if (inOtherSection && currentSection.length > 0) {
      sectionConfigs.push(...currentSection);
    }

    // 移除末尾的空行
    while (topLevelConfig.length > 0 && topLevelConfig[topLevelConfig.length - 1].trim() === '') {
      topLevelConfig.pop();
    }

    return { topLevelConfig, sectionConfigs };
  }

  /**
   * 获取新配置的顶级键列表
   * @param {Object} codexConfig Codex配置
   * @returns {Array<string>} 顶级键列表
   * @private
   */
  getNewTopLevelKeys(codexConfig) {
    const newTopLevelKeys = [];
    Object.keys(codexConfig).forEach(key => {
      if (key !== 'OPENAI_API_KEY' && key !== 'model_providers' && key !== 'requires_openai_auth') {
        newTopLevelKeys.push(key);
      }
    });
    newTopLevelKeys.push('model', 'model_provider');

    // 添加必要的默认参数
    const requiredDefaults = ['model_reasoning_effort', 'disable_response_storage'];
    requiredDefaults.forEach(key => {
      if (!newTopLevelKeys.includes(key)) {
        newTopLevelKeys.push(key);
      }
    });

    return newTopLevelKeys;
  }

  /**
   * 判断是否应该跳过某行
   * @param {string} line 行内容
   * @param {Array<string>} keys 键列表
   * @returns {boolean} 是否跳过
   * @private
   */
  shouldSkipLine(line, keys) {
    for (const key of keys) {
      if (line.startsWith(`${key} =`)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 添加核心配置（model和model_provider）
   * @param {Array} config 配置数组
   * @param {Object} codexConfig Codex配置
   * @param {string} providerKey 提供商key
   * @private
   */
  addCoreConfig(config, codexConfig, providerKey) {
    config.push(`model = "${codexConfig.model || 'gpt-5'}"`);
    config.push(`model_provider = "${providerKey}"`);
  }

  /**
   * 添加其他顶级配置
   * @param {Array} config 配置数组
   * @param {Object} codexConfig Codex配置
   * @private
   */
  addOtherTopLevelConfig(config, codexConfig) {
    Object.entries(codexConfig).forEach(([key, value]) => {
      if (key !== 'OPENAI_API_KEY' && key !== 'model_providers' && key !== 'model') {
        const formattedValue = this.formatConfigValue(value);
        if (formattedValue !== null) {
          config.push(`${key} = ${formattedValue}`);
        }
      }
    });
  }

  /**
   * 格式化配置值
   * @param {*} value 值
   * @returns {string|null} 格式化后的值
   * @private
   */
  formatConfigValue(value) {
    if (typeof value === 'string') {
      return `"${value}"`;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    return null;
  }

  /**
   * 确保必要的默认参数存在
   * @param {Array} newConfig 新配置数组
   * @param {Array} existingConfig 现有配置数组
   * @private
   */
  ensureRequiredDefaults(newConfig, existingConfig) {
    const requiredDefaults = {
      'model_reasoning_effort': 'high',
      'disable_response_storage': true
    };

    const allConfigLines = [...newConfig, ...existingConfig];

    Object.entries(requiredDefaults).forEach(([key, defaultValue]) => {
      const hasConfig = allConfigLines.some(line =>
        line.trim().startsWith(`${key} =`)
      );

      if (!hasConfig) {
        const formattedValue = this.formatConfigValue(defaultValue);
        if (formattedValue !== null) {
          newConfig.push(`${key} = ${formattedValue}`);
        }
      }
    });
  }

  /**
   * 添加 provider 配置
   * @param {Array} config 配置数组
   * @param {string} providerKey 提供商key
   * @param {Object} providerConfig 提供商配置
   * @private
   */
  addProviderConfig(config, providerKey, providerConfig) {
    config.push(`[model_providers.${providerKey}]`);

    const providerName = providerConfig.name || providerKey;
    config.push(`name = "${providerName}"`);
    config.push(`base_url = "${providerConfig.base_url}"`);

    const wireApi = providerConfig.wire_api || "responses";
    config.push(`wire_api = "${wireApi}"`);

    const requiresOpenaiAuth = providerConfig.requires_openai_auth !== undefined
      ? providerConfig.requires_openai_auth
      : true;
    config.push(`requires_openai_auth = ${requiresOpenaiAuth}`);

    // 添加其他provider配置
    Object.entries(providerConfig).forEach(([key, value]) => {
      if (!["name", "base_url", "wire_api", "requires_openai_auth"].includes(key)) {
        const formattedValue = this.formatTomlValue(value);
        if (formattedValue !== undefined) {
          config.push(`${key} = ${formattedValue}`);
        }
      }
    });
  }

  /**
   * 格式化 TOML 值（支持复杂类型）
   * @param {*} value 值
   * @returns {string|undefined} 格式化后的值
   * @private
   */
  formatTomlValue(value) {
    if (value === undefined || value === null) {
      return undefined;
    }
    if (typeof value === "string") {
      const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"");
      return `"${escaped}"`;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      return String(value);
    }
    if (Array.isArray(value)) {
      const formattedItems = value
        .map((item) => this.formatTomlValue(item))
        .filter((item) => item !== undefined);
      return `[${formattedItems.join(", ")}]`;
    }
    if (typeof value === "object") {
      const entries = Object.entries(value)
        .map(([key, val]) => {
          const formattedValue = this.formatTomlValue(val);
          if (formattedValue === undefined) {
            return undefined;
          }
          const escapedKey = key.replace(/"/g, "\\\"");
          return `"${escapedKey}" = ${formattedValue}`;
        })
        .filter(Boolean);
      return `{ ${entries.join(", ")} }`;
    }
    return undefined;
  }
}

export default CodexConfigBuilder;
