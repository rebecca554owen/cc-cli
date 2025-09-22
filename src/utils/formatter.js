const chalk = require("chalk");
const boxen = require("boxen");

/**
 * 格式化当前状态显示
 * @param {Object} currentConfig 当前配置
 * @param {Object} allConfigs 所有配置（用于获取URL）
 * @returns {string} 格式化后的状态信息
 */
function formatStatus(currentConfig, allConfigs = null) {
  if (!currentConfig) {
    return boxen(
      chalk.yellow("⚠️  当前没有配置\n\n") +
        chalk.white("请使用 ") +
        chalk.cyan("cc api") +
        chalk.white(" 来设置API配置"),
      {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "yellow",
        title: "📊 当前状态",
        titleAlignment: "center",
      }
    );
  }

  // 处理URL显示，兼容新旧格式
  let url = currentConfig.ANTHROPIC_BASE_URL || currentConfig.url;

  // 如果当前配置没有URL信息，从站点配置中获取
  if (
    !url &&
    currentConfig.site &&
    allConfigs &&
    allConfigs.sites &&
    allConfigs.sites[currentConfig.site]
  ) {
    const siteConfig = allConfigs.sites[currentConfig.site];
    url =
      siteConfig.config?.env?.ANTHROPIC_BASE_URL ||
      siteConfig.ANTHROPIC_BASE_URL ||
      (siteConfig.urls && Object.values(siteConfig.urls)[0]);
  }

  url = url || "未知URL";

  const statusContent =
    `${chalk.white("站点：")} ${chalk.cyan(currentConfig.siteName)}\n` +
    `${chalk.white("ANTHROPIC_BASE_URL：")} ${chalk.cyan(url)}\n` +
    `${chalk.white("Token：")} ${chalk.cyan(
      currentConfig.token.substring(0, 20) + "..."
    )}\n` +
    `${chalk.white("Token名称：")} ${chalk.gray(currentConfig.tokenName)}\n` +
    `${chalk.white("更新时间：")} ${chalk.gray(
      new Date(currentConfig.updatedAt).toLocaleString()
    )}`;

  return boxen(statusContent, {
    padding: 1,
    margin: 1,
    borderStyle: "round",
    borderColor: "green",
    title: "📊 当前配置状态",
    titleAlignment: "center",
  });
}

/**
 * 格式化配置列表显示
 * @param {Object} allConfigs 所有配置
 * @param {Object} currentConfig 当前配置
 * @returns {string} 格式化后的配置列表
 */
function formatConfigList(allConfigs, currentConfig) {
  let output = chalk.cyan.bold("📋 Claude API配置列表\n");
  output += chalk.gray("═".repeat(40)) + "\n";

  // 当前配置信息显示在顶部
  if (currentConfig) {
    // 构建显示文本，处理undefined
    let url = currentConfig.ANTHROPIC_BASE_URL || currentConfig.url;

    // 如果当前配置没有URL信息，从站点配置中获取
    if (
      !url &&
      currentConfig.site &&
      allConfigs.sites &&
      allConfigs.sites[currentConfig.site]
    ) {
      const siteConfig = allConfigs.sites[currentConfig.site];
      url =
        siteConfig.config?.env?.ANTHROPIC_BASE_URL ||
        siteConfig.ANTHROPIC_BASE_URL;
    }

    url = url || "未知URL";
    output += chalk.green.bold(
      `⭐ 当前配置: ${currentConfig.siteName} > ${url} > ${currentConfig.tokenName}\n`
    );
  } else {
    output += chalk.yellow("⚠️  当前没有激活的配置\n");
  }
  output += chalk.gray("═".repeat(40)) + "\n\n";

  for (const [siteKey, siteConfig] of Object.entries(allConfigs.sites)) {
    const siteIcon = getSiteIcon(siteKey, siteConfig);
    output += chalk.white.bold(`${siteIcon} ${siteKey}`);

    if (siteConfig.description) {
      output += chalk.gray(` [${siteConfig.description}]`);
    }
    output += "\n";

    // ANTHROPIC_BASE_URL
    const baseUrl =
      siteConfig.config?.env?.ANTHROPIC_BASE_URL ||
      siteConfig.ANTHROPIC_BASE_URL;
    const isCurrentUrl =
      currentConfig &&
      currentConfig.site === siteKey &&
      currentConfig.ANTHROPIC_BASE_URL === baseUrl;

    output += `├─ 📡 ANTHROPIC_BASE_URL: ${baseUrl}`;
    if (isCurrentUrl) {
      output += chalk.yellow(" ⭐");
    }
    output += "\n";

    // ANTHROPIC_AUTH_TOKEN
    const authTokens =
      siteConfig.config?.env?.ANTHROPIC_AUTH_TOKEN ||
      siteConfig.ANTHROPIC_AUTH_TOKEN;
    const tokens = Object.entries(authTokens);
    output += `└─ 🔑 ANTHROPIC_AUTH_TOKEN (${tokens.length}个):\n`;

    tokens.forEach(([tokenName, tokenValue], index) => {
      const isLastToken = index === tokens.length - 1;
      const prefix = isLastToken ? "   └─" : "   ├─";
      const isCurrentToken =
        currentConfig &&
        currentConfig.site === siteKey &&
        currentConfig.token === tokenValue;

      output += `${prefix} ${tokenName}: ${tokenValue.substring(0, 10)}...`;
      if (isCurrentToken) {
        output += chalk.yellow(" ⭐");
      }
      output += "\n";
    });

    output += "\n";
  }

  return output;
}

/**
 * 格式化配置切换成功信息
 * @param {Object} config 配置信息
 * @returns {string} 格式化后的成功信息
 */
function formatSwitchSuccess(config) {
  const successContent =
    `${chalk.white("站点: ")} ${chalk.cyan(config.siteName)}\n` +
    `${chalk.white("ANTHROPIC_BASE_URL: ")} ${chalk.cyan(
      config.ANTHROPIC_BASE_URL
    )}\n` +
    `${chalk.white("Token: ")} ${chalk.cyan(
      config.token.substring(0, 15) + "..."
    )}`;

  return boxen(successContent, {
    padding: 1,
    margin: { top: 1, bottom: 0, left: 0, right: 0 },
    borderStyle: "round",
    borderColor: "green",
    title: "✨ 配置切换成功！！！！",
    titleAlignment: "center",
  });
}

/**
 * 获取站点图标（通用版）
 * @param {string} siteKey 站点标识
 * @param {Object} siteConfig 站点配置对象（可选）
 * @returns {string} 图标
 */
function getSiteIcon(siteKey, siteConfig = null) {
  return "🌐"; // 通用网络服务图标
}

/**
 * 格式化错误信息
 * @param {string} title 错误标题
 * @param {string} message 错误消息
 * @param {string} suggestion 建议解决方案
 * @returns {string} 格式化后的错误信息
 */
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

/**
 * 格式化警告信息
 * @param {string} title 警告标题
 * @param {string} message 警告消息
 * @returns {string} 格式化后的警告信息
 */
function formatWarning(title, message) {
  const content = chalk.yellow.bold(`⚠️  ${title}\n\n`) + chalk.white(message);

  return boxen(content, {
    padding: 1,
    margin: 1,
    borderStyle: "round",
    borderColor: "yellow",
  });
}

/**
 * 格式化API操作帮助信息
 * @returns {string} 帮助信息
 */
function formatApiHelp() {
  return `
${chalk.cyan.bold("📡 CC API 配置管理工具")}

${chalk.white("功能:")}
  🔄 切换配置    快速切换不同的API配置
  📋 查看配置    查看所有配置并标识当前使用的配置  
  ➕ 添加配置    添加新的API配置项

${chalk.white("智能选择:")}
  • 当URL只有1个时，自动选择
  • 当Token只有1个时，自动选择
  • 当前配置会用 ⭐ 标识

${chalk.white("配置文件:")}
  ~/.claude/api_configs.json    API配置文件（包含当前激活配置）

${chalk.white("使用示例:")}
  cc api           显示交互菜单
  cc api --list    列出所有配置
  cc api --help    显示帮助信息
`;
}

/**
 * 主帮助信息格式化
 */
function formatMainHelp() {
  return `
${chalk.cyan.bold('CC CLI - Claude Code 配置管理工具')}

${chalk.white("主要功能:")}
  📡 API配置管理     切换、查看、添加、删除API配置
  📊 状态查看       查看当前使用的配置信息
  ❓ 帮助文档       显示详细使用说明

${chalk.white("基本命令:")}
  cc              启动交互式界面
  cc-cli          备用命令（避免与系统命令冲突）
  cc api          API配置管理
  cc status       查看当前状态
  cc --version    查看版本信息
  cc --help       显示帮助信息

${chalk.white("⚠️  命令冲突解决:")}
  如果遇到 'clang: error' 错误，请使用 cc-cli 命令

${chalk.white("配置文件:")}
  ~/.claude/api_configs.json    API配置文件（包含当前激活配置）

${chalk.white("使用示例:")}
  cc-cli api           显示交互菜单
  cc-cli api --list    列出所有配置
  cc-cli api --help    显示帮助信息
`;
}

module.exports = {
  formatStatus,
  formatConfigList,
  formatSwitchSuccess,
  formatError,
  formatWarning,
  formatApiHelp,
  formatMainHelp,
  getSiteIcon,
};
