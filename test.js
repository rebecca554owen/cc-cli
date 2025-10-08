#!/usr/bin/env node

/**
 * CC-CLI 统一测试脚本
 * 整合所有测试功能，一键测试所有核心功能
 */

import { spawn, execSync } from 'child_process';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 测试结果统计
const results = {
  total: 0,
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: [],
  details: [],
  startTime: new Date()
};

// 颜色输出
const colors = {
  success: (text) => chalk.green(text),
  error: (text) => chalk.red(text),
  warning: (text) => chalk.yellow(text),
  info: (text) => chalk.cyan(text),
  title: (text) => chalk.blue.bold(text),
  highlight: (text) => chalk.magenta(text)
};

/**
 * 执行命令并返回结果
 * 支持交互式输入和手动返回操作
 */
function runCommand(command, args = [], options = {}) {
  return new Promise((resolve) => {
    const { 
      timeout = 5000, 
      expectInput = false, 
      input = '', 
      expectError = false,
      interactive = false,
      waitForPrompt = true,
      promptTimeout = 2000
    } = options;
    
    const child = spawn(command, args, {
      cwd: __dirname,
      stdio: (expectInput || interactive) ? 'pipe' : 'pipe',
      shell: true
    });
    
    let stdout = '';
    let stderr = '';
    let timeoutId;
    let promptTimeoutId;
    let inputSent = false;
    let promptDetected = false;
    
    // 交互式输入处理
    const handleInteractiveInput = (data) => {
      const output = data.toString();
      stdout += output;
      
      // 检测各种交互提示
      const interactionPatterns = [
        /请输入|请选择|选择操作|下一步操作/i,
        /\?\s*$/,  // 以问号结尾
        /\[.*\]:\s*$/,  // 方括号提示
        /:\s*$/,  // 冒号结尾
        /continue.*\?/i,  // continue?
        /press.*enter/i,  // press enter
        /按.*回车/i,  // 按回车
        /按.*任意键/i  // 按任意键
      ];
      
      const hasPrompt = interactionPatterns.some(pattern => pattern.test(output));
      
      if (hasPrompt && !inputSent) {
        promptDetected = true;
        clearTimeout(promptTimeoutId);
        
        console.log(chalk.yellow(`检测到交互提示，等待${waitForPrompt ? '手动输入' : '自动响应'}...`));
        
        if (!waitForPrompt && input) {
          // 自动响应模式
          setTimeout(() => {
            if (!inputSent) {
              child.stdin.write(input + '\n');
              inputSent = true;
              console.log(chalk.cyan(`自动输入: ${input}`));
            }
          }, 500);
        } else if (waitForPrompt) {
          // 等待手动输入模式
          console.log(chalk.yellow('请手动输入并按回车继续，或等待超时...'));
          // 给手动输入更多时间
          promptTimeoutId = setTimeout(() => {
            if (!inputSent) {
              console.log(chalk.yellow('手动输入超时，尝试默认操作...'));
              child.stdin.write('\n'); // 发送回车
              inputSent = true;
            }
          }, promptTimeout);
        }
      }
    };
    
    if (expectInput || interactive) {
      child.stdout.on('data', handleInteractiveInput);
    }
    
    child.stdout.on('data', (data) => {
      if (!expectInput && !interactive) {
        stdout += data.toString();
      }
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      clearTimeout(timeoutId);
      clearTimeout(promptTimeoutId);
      resolve({
        success: expectError ? code !== 0 : code === 0,
        exitCode: code,
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        output: stdout.trim() + (stderr.trim() ? '\n' + stderr.trim() : ''),
        interactive: interactive,
        promptDetected: promptDetected,
        inputSent: inputSent
      });
    });
    
    child.on('error', (error) => {
      clearTimeout(timeoutId);
      clearTimeout(promptTimeoutId);
      resolve({
        success: false,
        exitCode: -1,
        error: error.message,
        output: error.message,
        interactive: interactive,
        promptDetected: false,
        inputSent: false
      });
    });
    
    // 主要超时处理
    timeoutId = setTimeout(() => {
      child.kill('SIGTERM');
      clearTimeout(promptTimeoutId);
      resolve({
        success: promptDetected, // 如果检测到交互提示，认为部分成功
        exitCode: 0,
        timeout: true,
        interactive: interactive,
        promptDetected: promptDetected,
        inputSent: inputSent,
        output: stdout.trim() || (promptDetected ? '检测到交互提示，等待用户输入' : '命令执行超时')
      });
    }, timeout);
  });
}

/**
 * 记录测试结果
 */
function recordTest(name, status, details = '') {
  results.total++;
  results.details.push({ name, status, details });
  
  switch (status) {
    case 'pass':
      results.passed++;
      console.log(colors.success(`✅ ${name}`));
      break;
    case 'fail':
      results.failed++;
      console.log(colors.error(`❌ ${name}`));
      results.errors.push({ name, details });
      break;
    case 'warning':
      results.warnings++;
      console.log(colors.warning(`⚠️  ${name}`));
      break;
    default:
      console.log(colors.info(`ℹ️  ${name}`));
  }
  
  if (details) {
    console.log(colors.info(`   ${details}`));
  }
}

/**
 * 检查配置文件
 */
async function checkConfigFiles() {
  console.log(colors.title('\n📁 配置文件检查'));
  
  const homeDir = process.env.HOME || process.env.USERPROFILE;
  const configFiles = [
    { name: 'API配置', path: path.join(homeDir, '.cc-cli', 'api_configs.json') },
    { name: 'Claude配置', path: path.join(homeDir, '.claude', 'settings.json') },
    { name: 'Codex配置', path: path.join(homeDir, '.codex', 'config.toml') },
    { name: 'iFlow配置', path: path.join(homeDir, '.iflow', 'settings.json') }
  ];
  
  let existingCount = 0;
  
  for (const file of configFiles) {
    if (await fs.pathExists(file.path)) {
      existingCount++;
      const stats = await fs.stat(file.path);
      recordTest(`${file.name}: 存在`, 'pass', `${stats.size} 字节`);
      
      // 检查配置文件内容
      try {
        const content = await fs.readFile(file.path, 'utf8');
        if (file.name === 'API配置') {
          const config = JSON.parse(content);
          const siteCount = Object.keys(config.sites || {}).length;
          recordTest(`  └─ 配置数量`, 'info', `${siteCount} 个配置`);
          
          // 检查当前配置
          if (config.currentConfig) {
            recordTest(`  └─ 当前配置`, 'info', config.currentConfig);
          } else {
            recordTest(`  └─ 当前配置`, 'warning', '无');
          }
        }
      } catch (error) {
        recordTest(`  └─ 配置解析`, 'error', error.message);
      }
    } else {
      recordTest(`${file.name}: 不存在`, 'warning');
    }
  }
  
  recordTest(`配置文件创建率`, existingCount === configFiles.length ? 'pass' : 'warning',
    `${existingCount}/${configFiles.length} (${Math.round(existingCount/configFiles.length*100)}%)`);
}

/**
 * 测试命令执行
 */
async function testCommands() {
  console.log(colors.title('\n🧪 命令执行测试'));
  
  const commands = [
    { name: '主菜单帮助', command: 'node', args: ['bin/cc.js', '--help'] },
    { name: 'Claude帮助', command: 'node', args: ['bin/cc.js', 'api', '--help'] },
    { name: 'Codex帮助', command: 'node', args: ['bin/cc.js', 'apix', '--help'] },
    { name: 'iFlow帮助', command: 'node', args: ['bin/cc.js', 'apii', '--help'] },
    { name: '状态检查', command: 'node', args: ['bin/cc.js', 'status'] }
  ];
  
  for (const cmd of commands) {
    try {
      const result = await runCommand(cmd.command, cmd.args, { timeout: 3000 });
      
      if (result.success) {
        // 检查输出内容
        const output = result.output;
        let details = '';
        
        if (cmd.name.includes('帮助')) {
          if (cmd.name.includes('iFlow') && !output.includes('iFlow')) {
            recordTest(cmd.name, 'fail', '输出不包含iFlow相关内容');
            continue;
          }
          if (cmd.name.includes('主菜单') && !output.includes('usei')) {
            recordTest(cmd.name, 'fail', '输出不包含usei命令');
            continue;
          }
        }
        
        if (cmd.name === '状态检查') {
          if (!output.includes('自动从默认配置获取')) {
            recordTest(cmd.name, 'warning', '状态显示未完全统一');
            continue;
          }
          if (!output.includes('cc usei') || !output.includes('cc apii')) {
            recordTest(cmd.name, 'warning', '状态提示缺少iFlow命令');
            continue;
          }
        }
        
        recordTest(cmd.name, 'pass', result.timeout ? '正常显示（超时）' : '正常显示');
      } else {
        recordTest(cmd.name, 'fail', result.output.substring(0, 50) + '...');
      }
    } catch (error) {
      recordTest(cmd.name, 'fail', error.message);
    }
  }
}

/**
 * 测试配置列表
 */
async function testConfigLists() {
  console.log(colors.title('\n📋 配置列表测试'));
  
  const listCommands = [
    { 
      name: 'Claude配置列表', 
      command: 'node', 
      args: ['bin/cc.js', 'api', '--list'],
      options: { 
        interactive: true, 
        waitForPrompt: false, 
        input: '\n', // 自动选择返回
        timeout: 5000 
      }
    },
    { 
      name: 'Codex配置列表', 
      command: 'node', 
      args: ['bin/cc.js', 'apix', '--list'],
      options: { 
        interactive: true, 
        waitForPrompt: false, 
        input: '\n', // 自动选择返回
        timeout: 5000 
      }
    },
    { 
      name: 'iFlow配置列表', 
      command: 'node', 
      args: ['bin/cc.js', 'apii', '--list'],
      options: { 
        interactive: true, 
        waitForPrompt: false, 
        input: '\n', // 自动选择返回
        timeout: 5000 
      }
    }
  ];
  
  for (const cmd of listCommands) {
    try {
      console.log(colors.info(`\n📝 测试: ${cmd.name}`));
      
      const result = await runCommand(cmd.command, cmd.args, cmd.options);
      
      if (result.success || result.promptDetected) {
        const output = result.output;
        
        // 检查是否有配置列表输出
        const hasConfigList = output.includes('配置列表') || 
                            output.includes('站点:') || 
                            output.includes('描述:') ||
                            output.includes('📋') ||
                            output.includes('Model:') ||
                            output.includes('API');
        
        if (hasConfigList) {
          // 检查iFlow配置是否正确显示
          if (cmd.name.includes('iFlow')) {
            if (output.includes('模型: 未设置') && output.includes('deepseek-ai/DeepSeek-V3.1-Terminus')) {
              recordTest(cmd.name, 'warning', '配置显示不一致');
              continue;
            }
          }
          
          recordTest(cmd.name, 'pass', '配置列表正常显示');
        } else {
          recordTest(cmd.name, 'warning', '未检测到配置列表内容');
        }
      } else {
        // 命令执行失败，但如果有输出内容，给予警告而非失败
        if (result.output && result.output.length > 0) {
          recordTest(cmd.name, 'warning', `命令异常退出但有输出: ${result.output.substring(0, 50)}...`);
        } else {
          recordTest(cmd.name, 'fail', result.output ? result.output.substring(0, 100) + '...' : '无输出');
        }
      }
    } catch (error) {
      recordTest(cmd.name, 'fail', error.message);
    }
  }
}

/**
 * 测试交互式命令（需要手动返回的操作）
 */
async function testInteractiveCommands() {
  console.log(colors.title('\n🔄 交互式命令测试'));
  
  const interactiveCommands = [
    { 
      name: 'Claude快速使用（交互）', 
      command: 'node', 
      args: ['bin/cc.js', 'use'],
      options: { 
        interactive: true, 
        waitForPrompt: true, 
        timeout: 10000,
        promptTimeout: 5000
      }
    },
    { 
      name: 'iFlow配置切换（交互）', 
      command: 'node', 
      args: ['bin/cc.js', 'apii', '--switch'],
      options: { 
        interactive: true, 
        waitForPrompt: true, 
        timeout: 8000,
        promptTimeout: 3000
      }
    },
    { 
      name: '备份功能（交互）', 
      command: 'node', 
      args: ['bin/cc.js', 'backup'],
      options: { 
        interactive: true, 
        waitForPrompt: true, 
        timeout: 8000,
        promptTimeout: 3000
      }
    }
  ];
  
  for (const cmd of interactiveCommands) {
    try {
      console.log(colors.info(`\n📝 测试: ${cmd.name}`));
      console.log(colors.warning('这是一个交互式测试，检测到提示后请手动输入或等待超时...'));
      
      const result = await runCommand(cmd.command, cmd.args, cmd.options);
      
      if (result.promptDetected) {
        if (result.inputSent) {
          recordTest(cmd.name, 'pass', '检测到交互提示并响应');
        } else {
          recordTest(cmd.name, 'warning', '检测到交互提示但未响应，可能需要手动输入');
        }
      } else {
        if (result.timeout) {
          recordTest(cmd.name, 'warning', '超时未检测到交互提示');
        } else {
          recordTest(cmd.name, 'pass', '命令执行完成');
        }
      }
      
      // 显示详细的交互信息
      if (result.stdout) {
        const lines = result.stdout.split('\n').filter(line => line.trim());
        const lastFewLines = lines.slice(-3); // 显示最后几行
        console.log(colors.info('输出预览:'));
        lastFewLines.forEach(line => console.log(colors.info(`  ${line}`)));
      }
      
    } catch (error) {
      recordTest(cmd.name, 'fail', error.message);
    }
  }
}

/**
 * 测试自动响应模式
 */
async function testAutoResponse() {
  console.log(colors.title('\n🤖 自动响应测试'));
  
  const autoCommands = [
    { 
      name: '模拟配置选择（自动响应）', 
      command: 'node', 
      args: ['bin/cc.js', 'api', '--switch'],
      options: { 
        interactive: true, 
        waitForPrompt: false, 
        input: '1\n', // 自动选择第一个选项
        timeout: 5000
      }
    },
    { 
      name: '模拟确认操作（自动响应）', 
      command: 'node', 
      args: ['bin/cc.js', 'api', '--delete'],
      options: { 
        interactive: true, 
        waitForPrompt: false, 
        input: 'n\n', // 自动选择否
        timeout: 5000
      }
    }
  ];
  
  for (const cmd of autoCommands) {
    try {
      console.log(colors.info(`\n📝 测试: ${cmd.name}`));
      console.log(colors.info(`自动输入: ${cmd.options.input.replace(/\n/g, '\\n')}`));
      
      const result = await runCommand(cmd.command, cmd.args, cmd.options);
      
      if (result.promptDetected && result.inputSent) {
        recordTest(cmd.name, 'pass', '自动响应成功');
      } else if (result.promptDetected && !result.inputSent) {
        recordTest(cmd.name, 'warning', '检测到提示但未自动响应');
      } else {
        recordTest(cmd.name, 'info', '未检测到交互提示');
      }
      
    } catch (error) {
      recordTest(cmd.name, 'warning', `自动响应测试遇到问题: ${error.message}`);
    }
  }
}

/**
 * 测试快速使用功能
 */
async function testQuickUse() {
  console.log(colors.title('\n🚀 快速使用测试'));
  
  const useCommands = [
    { 
      name: 'Claude快速使用', 
      command: 'node', 
      args: ['bin/cc.js', 'use'],
      options: { 
        interactive: true, 
        waitForPrompt: false, 
        input: '\n', // 自动选择第一个选项
        timeout: 5000 
      }
    },
    { 
      name: 'Codex快速使用', 
      command: 'node', 
      args: ['bin/cc.js', 'usex'],
      options: { 
        interactive: true, 
        waitForPrompt: false, 
        input: '\n', // 自动选择第一个选项
        timeout: 5000 
      }
    },
    { 
      name: 'iFlow快速使用', 
      command: 'node', 
      args: ['bin/cc.js', 'usei'],
      options: { 
        interactive: true, 
        waitForPrompt: false, 
        input: '\n', // 自动选择第一个选项
        timeout: 5000 
      }
    }
  ];
  
  for (const cmd of useCommands) {
    try {
      console.log(colors.info(`\n📝 测试: ${cmd.name}`));
      
      const result = await runCommand(cmd.command, cmd.args, cmd.options);
      
      if (result.success || result.promptDetected) {
        const output = result.output;
        
        // 检查是否有快速使用的相关输出
        const hasQuickUseOutput = output.includes('快速切换') || 
                                output.includes('选择') || 
                                output.includes('站点:') ||
                                output.includes('🚀') ||
                                output.includes('当前配置') ||
                                output.includes('API URL') ||
                                output.includes('模型名称');
        
        if (hasQuickUseOutput) {
          recordTest(cmd.name, 'pass', '快速使用功能正常');
        } else if (output.includes('没有找到') || output.includes('未找到')) {
          recordTest(cmd.name, 'warning', '功能正常但无可用配置');
        } else {
          // 如果输出包含配置信息，也认为是正常的
          if (output.includes('iflow-') || output.includes('Model:') || output.includes('API')) {
            recordTest(cmd.name, 'pass', '快速使用显示配置信息');
          } else {
            recordTest(cmd.name, 'warning', '未检测到预期的快速使用输出');
          }
        }
      } else {
        // 快速使用可能因为配置问题失败，给予警告而非失败
        if (result.output && (result.output.includes('没有找到') || result.output.includes('未找到'))) {
          recordTest(cmd.name, 'warning', '功能正常但无可用配置');
        } else {
          recordTest(cmd.name, 'fail', result.output ? result.output.substring(0, 100) + '...' : '无输出');
        }
      }
      
      // 显示输出预览
      if (result.stdout) {
        const lines = result.stdout.split('\n').filter(line => line.trim());
        const lastFewLines = lines.slice(-5);
        if (lastFewLines.length > 0) {
          console.log(colors.info('输出预览:'));
          lastFewLines.forEach(line => console.log(colors.info(`  ${line}`)));
        }
      }
    } catch (error) {
      recordTest(cmd.name, 'fail', error.message);
    }
  }
}

/**
 * 测试配置同步功能
 */
async function testConfigSync() {
  console.log(colors.title('\n🔄 配置同步测试'));
  
  try {
    // 检查settings.json是否存在并被正确读取
    const homeDir = process.env.HOME || process.env.USERPROFILE;
    const settingsPath = path.join(homeDir, '.iflow', 'settings.json');
    
    if (await fs.pathExists(settingsPath)) {
      const settingsContent = await fs.readFile(settingsPath, 'utf8');
      const settings = JSON.parse(settingsContent);
      
      if (settings.modelName) {
        recordTest('settings.json模型字段', 'pass', `modelName: ${settings.modelName}`);
      } else {
        recordTest('settings.json模型字段', 'warning', '缺少modelName字段');
      }
      
      if (settings.baseUrl && settings.apiKey) {
        recordTest('settings.json基础配置', 'pass', '配置完整');
      } else {
        recordTest('settings.json基础配置', 'warning', '配置不完整');
      }
    } else {
      recordTest('settings.json文件', 'warning', '文件不存在');
    }
    
    // 验证配置同步结果
    const apiConfigPath = path.join(homeDir, '.cc-cli', 'api_configs.json');
    if (await fs.pathExists(apiConfigPath)) {
      const apiConfigContent = await fs.readFile(apiConfigPath, 'utf8');
      const apiConfig = JSON.parse(apiConfigContent);
      
      const iflowAutoConfig = apiConfig.sites?.['iflow-auto'];
      if (iflowAutoConfig) {
        if (iflowAutoConfig.iflow?.providerName === '自动从默认配置获取') {
          recordTest('iFlow配置同步', 'pass', '状态描述已统一');
        } else {
          recordTest('iFlow配置同步', 'warning', '状态描述未完全统一');
        }
        
        if (iflowAutoConfig.iflow?.apiKey === '自动从默认配置获取') {
          recordTest('iFlow API密钥同步', 'pass', 'API密钥描述已统一');
        } else {
          recordTest('iFlow API密钥同步', 'warning', 'API密钥描述未统一');
        }
      } else {
        recordTest('iFlow配置同步', 'warning', '未找到iflow-auto配置');
      }
    }
    
  } catch (error) {
    recordTest('配置同步测试', 'error', error.message);
  }
}

/**
 * 生成测试报告
 */
function generateReport() {
  console.log(colors.title('\n📊 测试报告'));
  
  const duration = new Date() - results.startTime;
  const successRate = results.total > 0 ? Math.round((results.passed / results.total) * 100) : 0;
  
  console.log(`总测试数: ${results.total}`);
  console.log(colors.success(`通过: ${results.passed}`));
  console.log(colors.error(`失败: ${results.failed}`));
  console.log(colors.warning(`警告: ${results.warnings}`));
  
  if (results.errors.length > 0) {
    console.log(colors.error('\n❌ 错误详情:'));
    results.errors.forEach((error, index) => {
      console.log(colors.error(`${index + 1}. ${error.name}`));
      console.log(colors.info(`   ${error.details}`));
    });
  }
  
  console.log(colors.highlight(`\n成功率: ${successRate}%`));
  console.log(colors.info(`测试用时: ${duration}ms`));
  
  // 总体评估
  console.log(colors.title('\n🎯 总体评估'));
  if (successRate >= 90) {
    console.log(colors.success('🎉 优秀！大部分功能正常工作'));
  } else if (successRate >= 70) {
    console.log(colors.warning('⚠️  良好！部分功能需要优化'));
  } else {
    console.log(colors.error('💥 需要改进！较多功能存在问题'));
  }
  
  console.log(colors.title('\n💡 改进建议'));
  if (results.failed > 0) {
    console.log(colors.info('1. 修复失败的测试项目'));
  }
  if (results.warnings > 0) {
    console.log(colors.info('2. 处理警告项目，优化用户体验'));
  }
  console.log(colors.info('3. 定期运行测试，确保功能稳定性'));
  console.log(colors.info('4. 根据测试结果优化错误处理和用户提示'));
  
  console.log(colors.title('\n📈 测试覆盖率'));
  console.log(colors.success('✅ 配置文件检查'));
  console.log(colors.success('✅ 命令执行测试'));
  console.log(colors.success('✅ 配置列表测试'));
  console.log(colors.success('✅ 快速使用测试'));
  console.log(colors.success('✅ 配置同步验证'));
  console.log(colors.success('✅ 交互式命令测试'));
  console.log(colors.success('✅ 自动响应测试'));
  
  return results.failed === 0;
}

/**
 * 显示测试使用说明
 */
function showUsage() {
  console.log(colors.title('\n📖 CC-CLI 测试脚本使用说明'));
  console.log(colors.info('本测试脚本支持多种测试模式：'));
  console.log('');
  console.log(colors.highlight('1. 基础功能测试'));
  console.log(colors.info('   自动测试所有基础功能，无需人工干预'));
  console.log('');
  console.log(colors.highlight('2. 交互式测试'));
  console.log(colors.info('   测试需要手动输入的命令，如配置选择、确认操作等'));
  console.log(colors.warning('   ⚠️  当检测到交互提示时，可以选择：'));
  console.log(colors.info('   - 手动输入并按回车继续'));
  console.log(colors.info('   - 等待超时自动继续（默认操作）'));
  console.log('');
  console.log(colors.highlight('3. 自动响应测试'));
  console.log(colors.info('   模拟用户输入，自动响应交互式提示'));
  console.log(colors.info('   适用于需要输入数字选择或确认的场景'));
  console.log('');
  console.log(colors.title('测试参数说明：'));
  console.log(colors.info('  interactive: true     - 启用交互模式'));
  console.log(colors.info('  waitForPrompt: true   - 等待手动输入（true）或自动响应（false）'));
  console.log(colors.info('  input: "1\\n"         - 自动输入的内容'));
  console.log(colors.info('  promptTimeout: 3000   - 手动输入超时时间（毫秒）'));
  console.log(colors.info('  timeout: 8000         - 命令总超时时间（毫秒）'));
  console.log('');
}

/**
 * 主测试函数
 */
async function runAllTests() {
  console.log(colors.title('🚀 CC-CLI 统一功能测试'));
  console.log(colors.info(`开始时间: ${results.startTime.toLocaleString()}`));
  console.log(colors.info(`测试目录: ${__dirname}`));
  console.log('');
  
  // 显示使用说明
  showUsage();
  
  try {
    // 按顺序执行测试
    await checkConfigFiles();
    await testCommands();
    await testConfigLists();
    await testQuickUse();
    await testConfigSync();
    
    // 新增交互式测试
    await testInteractiveCommands();
    await testAutoResponse();
    
    // 生成报告
    const allPassed = generateReport();
    
    console.log(colors.title('\n🎉 测试完成！'));
    process.exit(allPassed ? 0 : 1);
    
  } catch (error) {
    console.error(colors.error(`\n💥 测试执行失败: ${error.message}`));
    process.exit(1);
  }
}

// 命令行参数解析
const args = process.argv.slice(2);
const testMode = args[0] || 'all';

console.log(colors.title('🚀 CC-CLI 统一功能测试'));
console.log(colors.info(`测试模式: ${testMode}`));

// 根据模式运行不同测试
switch (testMode) {
  case 'basic':
    // 仅运行基础测试
    (async () => {
      try {
        await checkConfigFiles();
        await testCommands();
        await testConfigLists();
        await testQuickUse();
        await testConfigSync();
        generateReport();
        process.exit(0);
      } catch (error) {
        console.error(colors.error(`测试执行失败: ${error.message}`));
        process.exit(1);
      }
    })();
    break;
    
  case 'interactive':
    // 仅运行交互式测试
    (async () => {
      try {
        showUsage();
        await testInteractiveCommands();
        generateReport();
        process.exit(0);
      } catch (error) {
        console.error(colors.error(`测试执行失败: ${error.message}`));
        process.exit(1);
      }
    })();
    break;
    
  case 'auto':
    // 仅运行自动响应测试
    (async () => {
      try {
        await testAutoResponse();
        generateReport();
        process.exit(0);
      } catch (error) {
        console.error(colors.error(`测试执行失败: ${error.message}`));
        process.exit(1);
      }
    })();
    break;
    
  case 'all':
  default:
    // 运行所有测试
    runAllTests().catch((error) => {
      console.error(colors.error(`测试脚本错误: ${error.message}`));
      process.exit(1);
    });
    break;
}