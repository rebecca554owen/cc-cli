import chalk from 'chalk';

/**
 * Claude Code自动模式钩子处理器
 * 无条件批准所有工具的使用请求
 * 用作Claude Code PreToolUse hooks的处理命令
 */
class ClaudeAutoHook {
  /**
   * 执行自动模式处理逻辑
   * 从stdin读取输入，无条件返回approve决策
   */
  async execute() {
    return new Promise((resolve, reject) => {
      const chunks = [];

      // 读取 stdin 输入
      process.stdin.on('data', chunk => {
        chunks.push(chunk);
      });

      // 处理输入结束
      process.stdin.on('end', () => {
        try {
          // 获取输入数据（虽然不使用，但保持完整流程）
          const jsonData = Buffer.concat(chunks).toString().trim();

          // 无论输入什么，都直接批准
          const response = {
            decision: 'approve',
            reason: 'Auto mode: All tools approved automatically - no restrictions'
          };

          console.log(JSON.stringify(response));
          resolve();
        } catch (error) {
          // 即使出错也批准
          const response = {
            decision: 'approve',
            reason: 'Auto mode: Approved despite parsing error - no restrictions'
          };

          console.log(JSON.stringify(response));
          resolve();
        }
      });

      // 处理stdin错误
      process.stdin.on('error', error => {
        // 即使 stdin 错误也批准
        const response = {
          decision: 'approve',
          reason: 'Auto mode: Approved despite stdin error - no restrictions'
        };

        console.log(JSON.stringify(response));
        resolve();
      });

      // 设置超时处理，防止无限等待
      const timeout = setTimeout(() => {
        const response = {
          decision: 'approve',
          reason: 'Auto mode: Approved due to timeout - no restrictions'
        };

        console.log(JSON.stringify(response));
        resolve();
      }, 5000); // 5秒超时

      // 清理超时处理器
      process.stdin.on('end', () => {
        clearTimeout(timeout);
      });
    });
  }

  /**
   * 显示帮助信息
   */
  showHelp() {
    console.log(chalk.cyan.bold('🚀 Claude 自动模式 Hook'));
    console.log();
    console.log(chalk.white('功能:'));
    console.log('  作为Claude Code PreToolUse hooks的处理命令');
    console.log('  无条件批准所有工具的使用请求');
    console.log();
    console.log(chalk.yellow('⚠️  警告:'));
    console.log('  此命令仅供Claude Code hooks内部使用');
    console.log('  启用自动模式会自动批准所有工具操作，请谨慎使用');
    console.log();
    console.log(chalk.white('相关命令:'));
    console.log('  cc api       管理API配置并开启/关闭自动模式');
    console.log('  cc apix      管理Codex配置并开启/关闭自动模式');
  }
}

export default new ClaudeAutoHook();
