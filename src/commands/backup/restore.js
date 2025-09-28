const fs = require("fs-extra");
const path = require("path");
const chalk = require("chalk");
const inquirer = require("inquirer");
const ora = require("ora");
const FileManager = require("./file-manager");
const WebDAVClient = require("./webdav-client");

/**
 * 恢复功能实现
 */
class RestoreManager {
  constructor() {
    this.fileManager = new FileManager();
    this.webdavClient = new WebDAVClient();
  }

  /**
   * 执行恢复流程
   */
  async performRestore() {
    try {
      console.log(chalk.cyan.bold("\n📥 配置恢复向导\n"));

      // 1. 初始化WebDAV客户端
      await this.webdavClient.initialize();

      // 2. 获取备份文件列表
      const backupFiles = await this.listAvailableBackups();

      if (backupFiles.length === 0) {
        console.log(chalk.yellow("📭 未找到任何备份文件"));
        console.log(chalk.gray("请先执行备份操作，或检查WebDAV配置是否正确。"));
        return;
      }

      // 3. 选择要恢复的备份文件
      const selectedBackup = await this.selectBackupFile(backupFiles);

      if (!selectedBackup) {
        console.log(chalk.yellow("ℹ️ 用户取消恢复操作"));
        return;
      }

      // 4. 下载并预览备份内容
      const backupData = await this.downloadAndPreviewBackup(selectedBackup);

      // 5. 选择要恢复的配置类别
      const selectedCategories = await this.selectRestoreCategories(backupData);

      if (selectedCategories.length === 0) {
        console.log(chalk.yellow("ℹ️ 未选择任何配置类别，恢复已取消"));
        return;
      }

      // 6. 确认恢复操作
      const confirmed = await this.confirmRestore(
        selectedBackup,
        selectedCategories
      );

      if (!confirmed) {
        console.log(chalk.yellow("ℹ️ 用户取消恢复操作"));
        return;
      }

      // 7. 执行恢复操作
      await this.executeRestore(backupData, selectedCategories);

      console.log(chalk.green("\n✅ 配置恢复完成！"));
    } catch (error) {
      console.error(chalk.red("\n❌ 恢复失败:"), error.message);
      throw error;
    }
  }

  /**
   * 获取可用的备份文件列表
   * @returns {Array} 备份文件列表
   */
  async listAvailableBackups() {
    console.log(chalk.blue("📋 正在获取备份文件列表..."));

    try {
      const backups = await this.webdavClient.listBackups();
      console.log(chalk.green(`✅ 找到 ${backups.length} 个备份文件`));
      return backups;
    } catch (error) {
      throw new Error(`获取备份列表失败: ${error.message}`);
    }
  }

  /**
   * 选择要恢复的备份文件
   * @param {Array} backupFiles 备份文件列表
   * @returns {Object|null} 选择的备份文件
   */
  async selectBackupFile(backupFiles) {
    const choices = backupFiles.map((backup) => ({
      name: `${backup.name} (${this.formatFileSize(
        backup.size
      )}, ${backup.lastModified.toLocaleString()})`,
      value: backup,
      short: backup.name,
    }));

    choices.push({ name: "取消操作", value: null });

    const { selectedBackup } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedBackup",
        message: "请选择要恢复的备份文件:",
        choices,
        pageSize: 10,
      },
    ]);

    return selectedBackup;
  }

  /**
   * 下载并预览备份内容
   * @param {Object} selectedBackup 选择的备份文件
   * @returns {Object} 备份数据
   */
  async downloadAndPreviewBackup(selectedBackup) {
    console.log(chalk.blue(`📥 正在下载备份文件: ${selectedBackup.name}`));

    try {
      const backupData = await this.webdavClient.downloadBackup(
        selectedBackup.path
      );

      // 显示备份预览信息
      this.showBackupPreview(backupData);

      return backupData;
    } catch (error) {
      throw new Error(`下载备份文件失败: ${error.message}`);
    }
  }

  /**
   * 显示备份预览信息
   * @param {Object} backupData 备份数据
   */
  showBackupPreview(backupData) {
    console.log(chalk.white("\n📋 备份内容预览："));
    console.log(
      chalk.gray(`备份时间: ${new Date(backupData.timestamp).toLocaleString()}`)
    );

    if (backupData.categories) {
      console.log(chalk.gray("包含的配置类别:"));

      for (const [category, data] of Object.entries(backupData.categories)) {
        let fileCount = 0;
        let totalSize = 0;

        // 统计文件数量和大小
        if (data.files) {
          for (const fileInfo of Object.values(data.files)) {
            if (!fileInfo.error) {
              fileCount++;
              totalSize += fileInfo.size || 0;
            }
          }
        }

        if (data.directories) {
          for (const dirInfo of Object.values(data.directories)) {
            if (!dirInfo.error) {
              fileCount += dirInfo.fileCount || 0;
              totalSize += dirInfo.totalSize || 0;
            }
          }
        }

        console.log(
          chalk.gray(
            `  • ${data.name} (${fileCount} 个文件, ${this.formatFileSize(
              totalSize
            )})`
          )
        );
      }
    }
  }

  /**
   * 选择要恢复的配置类别
   * @param {Object} backupData 备份数据
   * @returns {Array} 选择的类别列表
   */
  async selectRestoreCategories(backupData) {
    if (
      !backupData.categories ||
      Object.keys(backupData.categories).length === 0
    ) {
      throw new Error("备份文件中没有找到配置数据");
    }

    const choices = Object.entries(backupData.categories).map(
      ([category, data]) => ({
        name: data.name || category,
        value: category,
        checked: false,
      })
    );

    const { selectedCategories } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "selectedCategories",
        message: "请选择要恢复的配置类别 (空格选择/取消选择):",
        choices,
        validate: (input) => {
          if (input.length === 0) {
            return "请至少选择一个配置类别";
          }
          return true;
        },
      },
    ]);

    return selectedCategories;
  }

  /**
   * 确认恢复操作
   * @param {Object} selectedBackup 选择的备份文件
   * @param {Array} selectedCategories 选择的类别
   * @returns {boolean} 是否确认恢复
   */
  async confirmRestore(selectedBackup, selectedCategories) {
    console.log(chalk.yellow("\n⚠️ 恢复操作将会覆盖现有的配置文件！"));
    console.log(chalk.gray(`备份文件: ${selectedBackup.name}`));
    console.log(chalk.gray(`恢复类别: ${selectedCategories.join(", ")}`));

    const { confirmed } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirmed",
        message: "确定要执行恢复操作吗？",
        default: false,
      },
    ]);

    return confirmed;
  }

  /**
   * 执行恢复操作
   * @param {Object} backupData 备份数据
   * @param {Array} selectedCategories 选择的类别
   */
  async executeRestore(backupData, selectedCategories) {
    console.log(chalk.blue("\n🔄 正在执行恢复操作..."));

    const spinner = ora("恢复配置文件").start();

    try {
      let restoredFiles = 0;
      let failedFiles = 0;

      for (const category of selectedCategories) {
        const categoryData = backupData.categories[category];

        if (!categoryData) {
          console.warn(chalk.yellow(`⚠️ 备份中未找到类别: ${category}`));
          continue;
        }

        spinner.text = `恢复 ${categoryData.name} 配置...`;

        // 获取当前用户环境下的路径配置
        const currentPaths = this.fileManager.getCategoryPaths(category);

        // 恢复文件
        if (categoryData.files && currentPaths && currentPaths.files) {
          for (const [fileName, fileData] of Object.entries(
            categoryData.files
          )) {
            try {
              if (!fileData.error && fileData.content) {
                const targetPath = currentPaths.files[fileName];
                if (!targetPath) {
                  console.warn(
                    chalk.yellow(`⚠️ 当前环境未找到文件 ${fileName} 的路径配置`)
                  );
                  continue;
                }

                await fs.ensureDir(path.dirname(targetPath));

                if (fileData.encoding === "base64") {
                  const content = Buffer.from(fileData.content, "base64");
                  await fs.writeFile(targetPath, content);
                } else {
                  await fs.writeFile(targetPath, fileData.content, "utf8");
                }

                restoredFiles++;
                console.log(
                  chalk.gray(`✅ 恢复文件: ${fileName} -> ${targetPath}`)
                );
              }
            } catch (error) {
              console.error(
                chalk.red(`❌ 恢复文件失败 ${fileName}:`, error.message)
              );
              failedFiles++;
            }
          }
        }

        // 恢复目录
        if (
          categoryData.directories &&
          currentPaths &&
          currentPaths.directories
        ) {
          for (const [dirName, dirData] of Object.entries(
            categoryData.directories
          )) {
            if (!dirData.error && dirData.files) {
              spinner.text = `恢复 ${categoryData.name} - ${dirName}目录...`;

              try {
                const targetPath = currentPaths.directories[dirName];
                if (!targetPath) {
                  console.warn(
                    chalk.yellow(`⚠️ 当前环境未找到目录 ${dirName} 的路径配置`)
                  );
                  continue;
                }

                const { restoredCount, failedCount } =
                  await this.restoreDirectoryData(dirData, targetPath);
                restoredFiles += restoredCount;
                failedFiles += failedCount;
              } catch (error) {
                console.error(
                  chalk.red(`❌ 恢复目录失败 ${dirName}:`, error.message)
                );
                failedFiles++;
              }
            }
          }
        }
      }

      spinner.succeed(
        `恢复完成: ${restoredFiles} 个文件成功, ${failedFiles} 个文件失败`
      );

      // 显示恢复结果
      this.showRestoreResult(restoredFiles, failedFiles, selectedCategories);
    } catch (error) {
      spinner.fail("恢复操作失败");
      throw error;
    }
  }

  /**
   * 恢复目录数据
   * @param {Object} dirData 目录数据
   * @param {string} targetPath 目标路径
   * @returns {Object} 恢复结果统计
   */
  async restoreDirectoryData(dirData, targetPath) {
    let restoredCount = 0;
    let failedCount = 0;

    try {
      // 确保目标目录存在
      await fs.ensureDir(targetPath);

      // 恢复目录中的文件
      if (dirData.files) {
        for (const [fileName, fileData] of Object.entries(dirData.files)) {
          try {
            if (!fileData.error && fileData.content) {
              const filePath = path.join(targetPath, fileName);

              if (fileData.encoding === "base64") {
                const content = Buffer.from(fileData.content, "base64");
                await fs.writeFile(filePath, content);
              } else {
                await fs.writeFile(filePath, fileData.content, "utf8");
              }

              restoredCount++;
            }
          } catch (error) {
            console.error(
              chalk.red(`❌ 恢复文件失败 ${fileName}:`, error.message)
            );
            failedCount++;
          }
        }
      }

      // 递归恢复子目录
      if (dirData.subdirectories) {
        for (const [subDirName, subDirData] of Object.entries(
          dirData.subdirectories
        )) {
          const subDirPath = path.join(targetPath, subDirName);
          const subResult = await this.restoreDirectoryData(
            subDirData,
            subDirPath
          );
          restoredCount += subResult.restoredCount;
          failedCount += subResult.failedCount;
        }
      }
    } catch (error) {
      console.error(chalk.red(`❌ 创建目录失败 ${targetPath}:`, error.message));
      failedCount++;
    }

    return { restoredCount, failedCount };
  }

  /**
   * 显示恢复结果
   * @param {number} restoredFiles 成功恢复的文件数
   * @param {number} failedFiles 失败的文件数
   * @param {Array} selectedCategories 恢复的类别
   */
  showRestoreResult(restoredFiles, failedFiles, selectedCategories) {
    console.log(chalk.green("\n🎉 恢复操作执行完成！"));
    console.log(chalk.gray(`恢复类别: ${selectedCategories.join(", ")}`));
    console.log(chalk.gray(`成功恢复: ${restoredFiles} 个文件`));

    if (failedFiles > 0) {
      console.log(chalk.yellow(`失败文件: ${failedFiles} 个`));
    }

    console.log(chalk.blue("\n💡 建议操作："));
    console.log(chalk.gray("• 重启相关应用程序以加载新配置"));
    console.log(chalk.gray("• 验证配置是否正确生效"));
    console.log(chalk.gray("• 如有问题可重新执行恢复操作"));
  }

  /**
   * 格式化文件大小
   * @param {number} bytes 字节数
   * @returns {string} 格式化的大小
   */
  formatFileSize(bytes) {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }
}

module.exports = RestoreManager;
