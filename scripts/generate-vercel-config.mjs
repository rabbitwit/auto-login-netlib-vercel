#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// 读取基础配置模板
const baseConfigPath = join(process.cwd(), 'vercel.base.json');
const configPath = join(process.cwd(), 'vercel.json');

let baseConfig;

try {
  // 尝试读取基础配置文件
  const baseConfigData = readFileSync(baseConfigPath, 'utf8');
  baseConfig = JSON.parse(baseConfigData);
} catch (err) {
  // 如果没有基础配置文件，则读取现有的 vercel.json
  const configData = readFileSync(configPath, 'utf8');
  baseConfig = JSON.parse(configData);
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