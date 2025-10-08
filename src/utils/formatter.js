import chalk from "chalk";
import boxen from "boxen";

// 格式化配置项显示
function formatConfigItem(config, title, titleColor, tokenKey, setupCommand) {
  if (!config) {
    return chalk.yellow(title + "\n") + chalk.gray(`   未配置，请使用 ${setupCommand} 设置`);
  }

  return titleColor(title + "\n") +
    `${chalk.white("站点：")} ${chalk.cyan(config.siteName)}\n` +
    `${chalk.white("Token名称：")} ${chalk.gray(config[tokenKey])}\n` +
    `${chalk.white("更新时间：")} ${chalk.gray(new Date(config.updatedAt).toLocaleString())}`;
}

// 格式化当前状态显示
function formatStatus(hasClaudeConfig, hasCodexConfig, hasIflowConfig, claudeConfig, codexConfig, iflowConfig, versionInfo = null, claudeSite = null, codexSite = null, iflowSite = null) {
  // 合并Banner和状态显示
  let statusContent = '';
  
  // 添加Banner信息
  statusContent += chalk.cyan.bold('      ___ ___    ___ _    ___    \n');
  statusContent += chalk.cyan.bold('     / __/ __|  / __| |  |_ _|   \n');
  statusContent += chalk.cyan.bold('    | (_| (__  | (__| |__ | |    \n');
  statusContent += chalk.cyan.bold('     \___\___|  \___|____|___|   \n');
  statusContent += chalk.cyan.bold('                                 \n');
  statusContent += chalk.white.bold('   Claude Code配置管理CLI工具    \n');
  
  if (versionInfo) {
    statusContent += chalk.green.bold(`          v${versionInfo} (最新)   \n`);
  }
  
  statusContent += '\n';
  
  // 添加状态配置信息
  statusContent += chalk.cyan.bold("🤖 当前激活配置\n");
  statusContent += chalk.gray("═".repeat(50)) + "\n";

  // Claude配置
  if (hasClaudeConfig && claudeConfig) {
    statusContent += chalk.blue("📡 Claude Code 当前使用站点: ") + 
      chalk.white(claudeSite || "未知配置") + "\n";
    if (claudeConfig.env && claudeConfig.env.ANTHROPIC_BASE_URL) {
      statusContent += chalk.gray("  BASEURL: ") + 
        chalk.cyan(claudeConfig.env.ANTHROPIC_BASE_URL) + "\n";
    }
    if (claudeConfig.env && claudeConfig.env.ANTHROPIC_AUTH_TOKEN) {
      // 显示完整的 TOKEN，不截断
      const token = claudeConfig.env.ANTHROPIC_AUTH_TOKEN;
      const displayToken = typeof token === 'string' ? token : JSON.stringify(token);
      statusContent += chalk.gray("  TOKEN: ") + 
        chalk.cyan(displayToken) + "\n";
    }
    if (claudeConfig.env && claudeConfig.env.ANTHROPIC_MODEL) {
      statusContent += chalk.gray("  MODEL: ") + 
        chalk.cyan(claudeConfig.env.ANTHROPIC_MODEL) + "\n";
    }
    statusContent += "\n";
  }

  // Codex配置
  if (hasCodexConfig && codexConfig) {
    statusContent += chalk.magenta("💻 Codex API 当前使用站点: ") + 
      chalk.white(codexSite || "未知配置") + "\n";
    if (codexConfig.content) {
      // 从TOML内容中提取信息
      const lines = codexConfig.content.split('\n');
      let baseUrl = '';
      let model = '';
      let apiKey = '';
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('base_url = ')) {
          baseUrl = trimmedLine.replace('base_url = ', '').replace(/"/g, '');
        } else if (trimmedLine.startsWith('model = ')) {
          model = trimmedLine.replace('model = ', '').replace(/"/g, '');
        } else if (trimmedLine.includes('Authorization') && trimmedLine.includes('Bearer')) {
          const match = trimmedLine.match(/Bearer\s+([a-zA-Z0-9_-]+)/);
          if (match && match[1]) {
            apiKey = match[1];
          }
        }
      }
      
      if (baseUrl) {
        statusContent += chalk.gray("  BASEURL: ") + 
          chalk.cyan(baseUrl) + "\n";
      }
      if (apiKey) {
        // 显示完整的 API Key，不截断
        statusContent += chalk.gray("  TOKEN: ") + 
          chalk.cyan(apiKey) + "\n";
      }
      if (model) {
        statusContent += chalk.gray("  MODEL: ") + chalk.cyan(model) + "\n";
      }
    }
    statusContent += "\n";
  }

  // iFlow配置
  if (hasIflowConfig && iflowConfig) {
    statusContent += chalk.green("🌊 iFlow API 当前使用站点: ") + 
      chalk.white(iflowSite || "未知配置") + "\n";
    if (iflowConfig.baseUrl) {
      statusContent += chalk.gray("  BASEURL: ") + 
        chalk.cyan(iflowConfig.baseUrl) + "\n";
    }
    if (iflowConfig.apiKey && iflowConfig.apiKey !== '未设置' && iflowConfig.apiKey !== '自动从默认配置获取') {
      // 显示完整的 API Key，不截断
      statusContent += chalk.gray("  TOKEN: ") + 
        chalk.cyan(iflowConfig.apiKey) + "\n";
    }
    if (iflowConfig.model || iflowConfig.modelName) {
      statusContent += chalk.gray("  MODEL: ") + chalk.cyan(iflowConfig.model || iflowConfig.modelName) + "\n";
    }
    statusContent += "\n";
  }

  // 如果没有配置，显示提示信息
  if (!hasClaudeConfig && !hasCodexConfig && !hasIflowConfig) {
    statusContent += chalk.yellow("⚠️  当前没有配置\n\n") +
      chalk.white("请使用 ") +
      chalk.cyan("cc api") +
      chalk.white(" 或 ") +
      chalk.cyan("cc apix") +
      chalk.white(" 来设置配置");
  }

  // 快速使用提示
  statusContent += chalk.gray("💡 快速使用: ") + 
    chalk.cyan("cc use") + chalk.gray(" | ") + 
    chalk.cyan("cc usex") + chalk.gray(" | ") + 
    chalk.cyan("cc usei") + "\n";

  // 工具选项
  statusContent += chalk.gray("🛠️  管理工具: ") + 
    chalk.cyan("cc api") + chalk.gray(" | ") + 
    chalk.cyan("cc apix") + chalk.gray(" | ") + 
    chalk.cyan("cc apii");

  return boxen(statusContent, {
    padding: 1,
    margin: 1,
    borderStyle: "round",
    borderColor: "green",
    title: "📊 当前状态 & 工具",
    titleAlignment: "center",
    width: 80, // 加长显示画面以适应完整URL
  });
}

// 格式化配置列表显示
function formatConfigList(allConfigs, currentConfig) {
  let output = chalk.cyan.bold("📋 Claude API配置列表\n");
  output += chalk.gray("═".repeat(40)) + "\n\n";

  for (const [siteKey, siteConfig] of Object.entries(allConfigs.sites)) {
    // 跳过没有claude配置的站点
    if (!siteConfig.claude) {
      continue;
    }

    const siteIcon = getSiteIcon(siteKey, siteConfig);
    const isCurrentSite = currentConfig && currentConfig.site === siteKey;

    if (isCurrentSite) {
      output += chalk.green.bold(`${siteIcon} ${siteKey}`);
    } else {
      output += chalk.white.bold(`${siteIcon} ${siteKey}`);
    }

    if (siteConfig.description) {
      output += chalk.gray(` [${siteConfig.description}]`);
    }

    if (isCurrentSite) {
      output += chalk.yellow(" ⭐");
    }

    output += "\n";

    // ANTHROPIC_BASE_URL
    const claudeConfig = siteConfig.claude;
    const baseUrl = claudeConfig?.env?.ANTHROPIC_BASE_URL || claudeConfig?.baseUrl;
    output += `├─ 📡 ANTHROPIC_BASE_URL: ${baseUrl}\n`;

    // ANTHROPIC_AUTH_TOKEN - 支持字符串和对象格式
    const authTokensRaw = claudeConfig?.env?.ANTHROPIC_AUTH_TOKEN || claudeConfig?.token;
    const tokensSource =
      typeof authTokensRaw === "string"
        ? { "默认Token": authTokensRaw }
        : authTokensRaw;
    const tokens = Object.entries(tokensSource || {});
    output += `└─ 🔑 ANTHROPIC_AUTH_TOKEN (${tokens.length}个):\n`;

    tokens.forEach(([tokenName, tokenValue], index) => {
      const isLastToken = index === tokens.length - 1;
      const prefix = isLastToken ? "   └─" : "   ├─";
      const isCurrentToken = isCurrentSite && currentConfig && currentConfig.token === tokenValue;

      if (isCurrentToken) {
        output += chalk.green(`${prefix} ${tokenName}: ${formatToken(tokenValue)}`);
      } else {
        output += `${prefix} ${tokenName}: ${formatToken(tokenValue)}`;
      }
      output += "\n";
    });

    output += "\n";
  }

  return output;
}

// 格式化Codex配置列表
function formatCodexConfigList(allConfigs, currentConfig) {
  let output = chalk.cyan.bold("💻 Codex配置列表\n");
  output += chalk.gray("═".repeat(40)) + "\n\n";

  for (const [siteKey, siteConfig] of Object.entries(allConfigs.sites)) {
    // 只显示有 codex 配置的站点
    if (!siteConfig.codex) {
      continue;
    }

    const siteIcon = getSiteIcon(siteKey, siteConfig);
    const isCurrentSite = currentConfig && currentConfig.site === siteKey;

    if (isCurrentSite) {
      output += chalk.green.bold(`${siteIcon} ${siteKey}`);
    } else {
      output += chalk.white.bold(`${siteIcon} ${siteKey}`);
    }

    if (siteConfig.description) {
      output += chalk.gray(` [${siteConfig.description}]`);
    }

    if (isCurrentSite) {
      output += chalk.yellow(" ⭐");
    }

    output += "\n";

    const codexConfig = siteConfig.codex;

    // Model - 支持新的配置结构
    const model = codexConfig.model || codexConfig.modelName || 'gpt-5';
    output += `├─ 📡 Model: ${model}\n`;

    // OPENAI_API_KEY - 支持字符串和对象格式，兼容新结构
    const apiKeysRaw = codexConfig.OPENAI_API_KEY || codexConfig.token || codexConfig.apiKey;
    const keysSource =
      typeof apiKeysRaw === "string"
        ? { [siteKey]: apiKeysRaw }
        : apiKeysRaw;
    const apiKeys = Object.entries(keysSource || {});
    output += `├─ 🔑 OPENAI_API_KEY (${apiKeys.length}个):\n`;

    apiKeys.forEach(([keyName, keyValue], index) => {
      const isLastKey = index === apiKeys.length - 1;
      const prefix = isLastKey ? "│  └─" : "│  ├─";
      const isCurrentKey =
        currentConfig &&
        currentConfig.site === siteKey &&
        (currentConfig.apiKey === keyValue || currentConfig.token === keyValue);

      if (isCurrentKey) {
        output += chalk.green(`${prefix} ${keyName}: ${formatToken(keyValue)}`);
      } else {
        output += `${prefix} ${keyName}: ${formatToken(keyValue)}`;
      }
      output += "\n";
    });

    // Model Providers - 兼容新旧结构
    const modelProviders = codexConfig.model_providers || codexConfig.providers;
    if (modelProviders) {
      const providers = Object.entries(modelProviders);
      output += `└─ 💻 服务提供商 (${providers.length}个):\n`;

      providers.forEach(([providerKey, provider], index) => {
        const isLastProvider = index === providers.length - 1;
        const prefix = isLastProvider ? "   └─" : "   ├─";
        const providerName = provider.name || providerKey;
        const providerUrl = provider.base_url || provider.baseUrl || provider.url;
        const isCurrentProvider =
          currentConfig &&
          currentConfig.site === siteKey &&
          (currentConfig.provider === providerKey || currentConfig.providerName === providerKey);

        if (isCurrentProvider) {
          output += chalk.green(`${prefix} ${providerName}: ${providerUrl}`);
        } else {
          output += `${prefix} ${providerName}: ${providerUrl}`;
        }
        output += "\n";
      });
    } else if (codexConfig.baseUrl) {
      // 新结构：直接显示baseUrl
      output += `└─ 📡 BASEURL: ${codexConfig.baseUrl}\n`;
    }

    output += "\n";
  }

  return output;
}

// 格式化配置切换成功信息
function formatSwitchSuccess(config) {
  const successContent =
    `${chalk.white("站点: ")} ${chalk.cyan(config.siteName)}\n` +
    `${chalk.white("ANTHROPIC_BASE_URL: ")} ${chalk.cyan(
      config.ANTHROPIC_BASE_URL
    )}\n` +
    `${chalk.white("Token: ")} ${chalk.cyan(
      formatToken(config.token)
    )}`;

  return boxen(successContent, {
    padding: 1,
    margin: { top: 1, bottom: 0, left: 0, right: 0 },
    borderStyle: "round",
    borderColor: "green",
    title: "✨ 配置切换成功！",
    titleAlignment: "center",
  });
}

// 格式化Codex配置切换成功信息
function formatCodexSwitchSuccess(config) {
  const successContent =
    `${chalk.white("站点: ")} ${chalk.cyan(config.siteName)}\n` +
    `${chalk.white("服务商: ")} ${chalk.cyan(config.providerName)}\n` +
    `${chalk.white("Model: ")} ${chalk.cyan(config.model)}\n` +
    `${chalk.white("API Key: ")} ${chalk.cyan(formatToken(config.apiKey))}`;

  return boxen(successContent, {
    padding: 1,
    margin: { top: 1, bottom: 0, left: 0, right: 0 },
    borderStyle: "round",
    borderColor: "green",
    title: "✨ 配置切换成功！",
    titleAlignment: "center",
  });
}

// 格式化Token显示（前7位 + ... + 后6位）
function formatToken(token) {
  if (!token || token.length <= 13) return token;
  return token.substring(0, 7) + '...' + token.substring(token.length - 6);
}

// 从URL中提取站点信息
function extractProviderFromUrl(url) {
  if (!url || typeof url !== 'string') return '未知';
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    
    // 常见站点识别
    if (hostname.includes('openai.com')) return 'OpenAI';
    if (hostname.includes('anthropic.com')) return 'Anthropic';
    if (hostname.includes('coreshub')) return 'CoreHub';
    if (hostname.includes('deepseek')) return 'DeepSeek';
    if (hostname.includes('siliconflow')) return 'SiliconFlow';
    if (hostname.includes('paratera')) return 'Paratera';
    if (hostname.includes('192.168.5.10')) return '本地代理';
    if (hostname.includes('localhost') || hostname === '127.0.0.1') return '本地服务';
    
    // 从路径中提取站点信息
    const pathParts = urlObj.pathname.split('/').filter(part => part);
    for (const part of pathParts) {
      if (part.includes('proxy')) continue;
      if (part.includes('coreshub')) return 'CoreHub';
      if (part.includes('deepseek')) return 'DeepSeek';
      if (part.includes('siliconflow')) return 'SiliconFlow';
      if (part.includes('paratera')) return 'Paratera';
      if (part.includes('openai')) return 'OpenAI';
      if (part.includes('anthropic')) return 'Anthropic';
    }
    
    // 从子域名提取
    const subdomains = hostname.split('.');
    if (subdomains.length > 2) {
      const firstSubdomain = subdomains[0];
      if (firstSubdomain.includes('api')) return 'API服务';
      if (firstSubdomain.includes('proxy')) return '代理服务';
    }
    
    return '自定义服务';
  } catch (error) {
    return 'URL解析失败';
  }
}

// 获取站点图标
function getSiteIcon(siteKey, siteConfig = null) {
  return "🌐"; // 通用网络服务图标
}

// 格式化错误信息
function formatError(title, message, suggestion = "") {
  let content = chalk.red.bold(`❌ ${title}\n\n`) + chalk.white(message);

  if (suggestion) {
    content +=
      "\n\n" + chalk.yellow("💡 建议解决方案：\n") + chalk.white(suggestion);
  }

  return boxen(content, {
    padding: 1,
    margin: 1,
    borderStyle: "round",
    borderColor: "red",
  });
}

// 格式化警告信息
function formatWarning(title, message) {
  const content = chalk.yellow.bold(`⚠️  ${title}\n\n`) + chalk.white(message);

  return boxen(content, {
    padding: 1,
    margin: 1,
    borderStyle: "round",
    borderColor: "yellow",
  });
}

// 格式化API操作帮助信息
function formatApiHelp() {
  return `
${chalk.cyan.bold("📡 CC API 配置管理工具")}

${chalk.white("功能:")}
  🔄 切换配置    快速切换不同的API配置
  📋 查看配置    查看所有配置并标识当前使用的配置  
  ➕ 添加配置    添加新的API配置项（Claude/Codex）

${chalk.white("智能选择:")}
  • 当URL只有1个时，自动选择
  • 当Token只有1个时，自动选择
  • 当前配置会用绿色标识，当前站点用⭐标识

${chalk.white("配置文件:")}
  ~/.cc-cli/api_configs.json    API配置文件（包含当前激活配置）

${chalk.white("使用示例:")}
  cc api           显示交互菜单
  cc api --list    列出所有配置
  cc api --help    显示帮助信息
`;
}

// 主帮助信息格式化
function formatMainHelp() {
  return `
${chalk.cyan.bold('CC CLI - Claude Code & Codex 配置管理工具')}

${chalk.white("主要功能:")}
  📡 Claude配置管理     切换、查看、添加、删除Claude API配置
  💻 Codex配置管理      切换、查看、添加、删除Codex API配置
  📊 状态查看          查看当前使用的配置信息
  ❓ 帮助文档          显示详细使用说明

${chalk.white("基本命令:")}
  cc              启动交互式界面
  cc-cli          备用命令（避免与系统命令冲突）
  cc api          Claude配置管理
  cc apix         Codex配置管理

  cc status       查看当前状态
  cc --version    查看版本信息
  cc --help       显示帮助信息

${chalk.white("⚠️  命令冲突解决:")}
  如果遇到 'clang: error' 错误，请使用 cc-cli 命令

${chalk.white("配置文件:")}
  ~/.cc-cli/api_configs.json    统一配置文件（包含当前激活配置）

${chalk.white("使用示例:")}
  cc               启动交互式界面
  cc api           Claude配置管理菜单
  cc apix          Codex配置管理菜单
  cc api --list    列出所有Claude配置
  cc apix --list   列出所有Codex配置
  cc status        查看当前配置状态
`;
}

// 格式化iFlow配置列表
function formatIflowConfigList(allConfigs, currentConfig) {
  let output = chalk.cyan.bold("🌊 iFlow配置列表\n");
  output += chalk.gray("═".repeat(40)) + "\n\n";

  for (const [siteKey, siteConfig] of Object.entries(allConfigs.sites)) {
    // 只显示有 iflow 配置的站点
    if (!siteConfig.iflow) {
      continue;
    }

    const siteIcon = getSiteIcon(siteKey, siteConfig);
    const isCurrentSite = currentConfig && currentConfig.site === siteKey;

    if (isCurrentSite) {
      output += chalk.green.bold(`${siteIcon} ${siteKey}`);
    } else {
      output += chalk.white.bold(`${siteIcon} ${siteKey}`);
    }

    if (siteConfig.description) {
      output += chalk.gray(` [${siteConfig.description}]`);
    }

    if (isCurrentSite) {
      output += chalk.yellow(" ⭐");
    }

    output += "\n";

    const iflowConfig = siteConfig.iflow;

    // Model - 支持新的配置结构
    const model = iflowConfig.model || iflowConfig.modelName || '未设置';
    output += `├─ 📡 Model: ${model}\n`;

    // API Key - 支持新的配置结构
    const apiKey = iflowConfig.apiKey || iflowConfig.token;
    if (apiKey && apiKey !== '未设置' && apiKey !== '自动从默认配置获取') {
      const isCurrentKey = isCurrentSite && (currentConfig.apiKey === apiKey || currentConfig.token === apiKey);
      const keyPrefix = isCurrentKey ? chalk.green('├─ 🔑 API密钥: ') : '├─ 🔑 API密钥: ';
      output += `${keyPrefix}${formatToken(apiKey)}\n`;
    } else {
      output += `├─ 🔑 API密钥: 未设置\n`;
    }

    // Base URL - 支持新的配置结构
    const baseUrl = iflowConfig.baseUrl || iflowConfig.url;
    if (baseUrl) {
      output += `└─ 📡 BASEURL: ${baseUrl}\n`;
    } else {
      output += `└─ 📡 BASEURL: 未设置\n`;
    }

    output += "\n";
  }

  return output;
}

export {
  formatStatus,
  formatConfigList,
  formatCodexConfigList,
  formatIflowConfigList,
  formatSwitchSuccess,
  formatCodexSwitchSuccess,
  formatError,
  formatWarning,
  formatApiHelp,
  formatMainHelp,
  formatToken,
  getSiteIcon,
};
