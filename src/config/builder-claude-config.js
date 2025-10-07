/**
 * Claude 配置文件构建器
 * 负责生成和管理 Claude Code 的 settings.json 配置
 */
class ClaudeConfigBuilder {
  /**
   * 深度合并对象
   * @param {Object} target 目标对象
   * @param {Object} source 源对象
   * @returns {Object} 合并后的对象
   */
  deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (
          typeof source[key] === "object" &&
          source[key] !== null &&
          !Array.isArray(source[key])
        ) {
          result[key] = this.deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }

    return result;
  }

  /**
   * 构建 Claude 配置
   * @param {Object} currentSettings 当前的 settings.json 内容
   * @param {Object} claudeConfig 站点的 Claude 配置
   * @param {string} selectedToken 选择的 Token 值
   * @returns {Object} 合并后的配置对象
   */
  build(currentSettings, claudeConfig, selectedToken) {
    // 复制当前设置
    const newSettings = { ...currentSettings };

    // 需要删除重置的配置项
    if (newSettings.env) {
      delete newSettings.env.ANTHROPIC_AUTH_TOKEN;
      delete newSettings.env.ANTHROPIC_AUTH_KEY;
      delete newSettings.env.ANTHROPIC_API_KEY;
    }
    // 重置模型配置
    delete newSettings.model;

    // 准备合并的配置
    const configToMerge = { ...claudeConfig };

    // 特殊处理：ANTHROPIC_AUTH_TOKEN 使用选中的具体 token 值
    if (configToMerge.env && configToMerge.env.ANTHROPIC_AUTH_TOKEN) {
      configToMerge.env.ANTHROPIC_AUTH_TOKEN = selectedToken;
    }

    // 深度合并配置
    const mergedSettings = this.deepMerge(newSettings, configToMerge);

    return mergedSettings;
  }

  /**
   * 从配置中提取 Token 名称
   * @param {Object} claudeConfig Claude 配置对象
   * @param {string} token Token 值
   * @returns {string} Token 名称
   */
  getTokenName(claudeConfig, token) {
    const rawTokens = claudeConfig.env.ANTHROPIC_AUTH_TOKEN;
    const tokens =
      typeof rawTokens === "string" ? { 默认Token: rawTokens } : rawTokens;
    const tokenName = Object.keys(tokens).find(
      (key) => tokens[key] === token
    );
    return tokenName || '未知Token';
  }
}

export default ClaudeConfigBuilder;
