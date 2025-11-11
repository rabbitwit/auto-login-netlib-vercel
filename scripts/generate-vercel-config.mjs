#!/usr/bin/env node

import fs from 'fs'

const env = process.env.DEPLOY_ENV || 'dev'
const cronSchedule = process.env.CRON_SCHEDULE;

const baseConfig = {
  version: 2,
  routes: [{ src: "/", dest: "/" }]
}

// 根据环境变量修改配置
if (env === 'prod') {
  // 添加corn 任务
  baseConfig.crons = [
    {
      path: '/api/cron',
      schedule: cronSchedule
    }
  ]
} else {
  // 开发环境不添加cron任务
  baseConfig.crons = [
    {
      path: '/api/cron',
      schedule: '0 0 */15 * *'
    }
  ]
}

fs.writeFileSync('vercel.json', JSON.stringify(baseConfig, null, 2))
console.log(`✅ Vercel 配置已生成，Cron 调度时间设置为: ${cronSchedule}`)
