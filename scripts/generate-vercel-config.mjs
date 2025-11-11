#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// 只在本地开发环境中加载 .env.local 文件
if (process.env.NODE_ENV !== 'production') {
  // 加载 .env.local 文件
  const envLocalPath = join(process.cwd(), '.env.local');
  try {
    const envLocalContent = readFileSync(envLocalPath, 'utf8');
    const envVars = envLocalContent.split('\n');
    envVars.forEach(line => {
      // 忽略注释和空行
      if (line.trim() !== '' && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key && value) {
          // 去除值的引号（如果有）
          const cleanValue = value.trim().replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
          process.env[key.trim()] = cleanValue;
        }
      }
    });
  } catch (err) {
    // .env.local 文件不存在是正常的，忽略错误
  }
}

// 读取基础配置模板
const baseConfigPath = join(process.cwd(), 'vercel.base.json');
const configPath = join(process.cwd(), 'vercel.json');

let baseConfig;

try {
  // 尝试读取基础配置文件
  const baseConfigData = readFileSync(baseConfigPath, 'utf8');
  baseConfig = JSON.parse(baseConfigData);
} catch (err) {
  console.error('❌ 找不到 vercel.base.json 基础配置文件');
  process.exit(1);
}

// 获取环境变量中的 CRON_SCHEDULE，如果没有则使用默认值（每15天运行一次）
const cronSchedule = process.env.CRON_SCHEDULE || '0 0 */15 * *';

// 更新 cron 调度时间
if (baseConfig.crons && baseConfig.crons.length > 0) {
  baseConfig.crons[0].schedule = cronSchedule;
}

// 写入更新后的配置
writeFileSync(configPath, JSON.stringify(baseConfig, null, 2));

console.log(`✅ Vercel 配置已更新，Cron 调度时间设置为: ${cronSchedule}`);