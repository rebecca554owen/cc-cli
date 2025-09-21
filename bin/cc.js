#!/usr/bin/env node

const path = require('path');
const { program } = require('commander');

// 添加项目根目录到模块搜索路径
const projectRoot = path.join(__dirname, '..');
require.main.paths.unshift(path.join(projectRoot, 'src'));

const packageJson = require('../package.json');

// 设置程序信息
program
  .name('cc')
  .description('Claude Code配置管理CLI工具')
  .version(packageJson.version);

// 导入主程序入口
const main = require('../src/index');

// 启动主程序
main(program)
  .catch(error => {
    console.error('❌ 程序执行错误:', error.message);
    process.exit(1);
  });