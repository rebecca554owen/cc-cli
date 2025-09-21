# CC CLI 本地测试命令

## 安装和链接

```bash
# 1. 安装依赖（如果还没安装）
npm install

# 2. 创建全局链接
npm link

# 3. 验证链接成功
which cc  # Linux/Mac
where cc  # Windows
```

## 基础功能测试

```bash
# 版本信息
cc --version

# 主帮助
cc --help

# API模块帮助
cc api --help

# 查看配置列表
cc api --list

# 查看当前状态
cc status
```

## 交互式测试

```bash
# 主菜单（支持键盘方向键选择）
cc

# API配置菜单
cc api
```

## 功能验证清单

- [ ] `cc --version` 显示版本号
- [ ] `cc --help` 显示帮助信息
- [ ] `cc api --help` 显示详细的API帮助
- [ ] `cc api --list` 正确读取和显示配置
- [ ] `cc status` 显示当前配置状态
- [ ] `cc` 显示交互式主菜单
- [ ] `cc api` 显示API管理菜单
- [ ] 智能选择功能（单选项自动选择）
- [ ] 配置切换功能
- [ ] 错误处理（配置文件不存在等）

## 测试完成后清理

```bash
# 取消全局链接
npm unlink -g cc-cli

# 或者
npm unlink
```

## 常见问题

### 权限问题
如果遇到权限问题，可能需要使用管理员权限：
```bash
# Windows (以管理员身份运行PowerShell)
npm link

# Linux/Mac
sudo npm link
```

### 命令未找到
如果`cc`命令未找到，检查：
1. npm link 是否成功
2. npm global bin 路径是否在环境变量中
```bash
npm config get prefix
```

### 重新链接
如果需要重新链接：
```bash
npm unlink
npm link
```