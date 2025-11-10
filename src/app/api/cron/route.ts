import { NextResponse } from 'next/server';
import { chromium } from 'playwright';

// 超时配置常量
const PAGE_DEFAULT_TIMEOUT = 30000;
const PAGE_WAIT_TIMEOUT = 3000;
const LOGIN_WAIT_TIMEOUT = 5000;
const FIELD_WAIT_TIMEOUT = 1000;
const SUBMIT_WAIT_TIMEOUT = 2000;
const SUCCESS_CHECK_TIMEOUT = 5000;

// 从环境变量获取账号信息
const ACCOUNTS = process.env.ACCOUNTS || '';

if (!ACCOUNTS) {
  console.log('❌ 未配置账号');
}

// 解析多个账号，支持逗号或分号分隔
const accountList = ACCOUNTS.split(/[,;]/).map(account => {
  const [user, pass] = account.split(":").map(s => s.trim());
  return { user, pass };
}).filter(acc => acc.user && acc.pass);

// Telegram 机器人配置
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';

export async function GET(request: Request) {
  // 验证 Authorization 头部
  const authHeader = request.headers.get('Authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, message: 'Unauthorized' },
      { status: 401 }
    );
  }

  console.log(`🔍 发现 ${accountList.length} 个账号需要登录`);
  
  // 限制并发数，避免资源耗尽
  const CONCURRENT_LIMIT = 3;
  const results = [];
  
  // 分批处理账号，每批最多CONCURRENT_LIMIT个
  for (let i = 0; i < accountList.length; i += CONCURRENT_LIMIT) {
    const batch = accountList.slice(i, i + CONCURRENT_LIMIT);
    console.log(`\n📋 处理第 ${Math.floor(i/CONCURRENT_LIMIT) + 1} 批账号 (${i+1}-${Math.min(i+CONCURRENT_LIMIT, accountList.length)}/${accountList.length})`);
    
    // 并发处理当前批次
    const batchResults = await Promise.all(
      batch.map(async ({ user, pass }, index) => {
        console.log(`\n🚀 开始处理账号 ${user} (批次中第 ${index + 1} 个)`);
        const result = await loginWithAccount(user, pass);
        console.log(`\n✅ 账号 ${user} 处理完成`);
        return result;
      })
    );
    
    results.push(...batchResults);
    
    // 如果还有下一批，等待一下再处理
    if (i + CONCURRENT_LIMIT < accountList.length) {
      console.log('\n⏳ 等待3秒后处理下一批账号...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // 汇总所有结果
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  let summaryMessage = `📊 登录汇总: ${successCount}/${totalCount} 个账号成功\n\n`;
  
  results.forEach(result => {
    summaryMessage += `${result.message}\n`;
  });
  
  // 发送 Telegram 通知
  if (TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID) {
    const formattedMessage = formatTelegramMessage(summaryMessage);
    await sendTelegramMessage(formattedMessage);
  } else {
    console.log('⚠️  Telegram 通知未配置，跳过发送');
  }
  
  console.log('\n✅ 所有账号处理完成！');
  
  return NextResponse.json({
    success: true,
    message: summaryMessage,
    results
  });
}

async function loginWithAccount(user: string, pass: string) {
  console.log(`\n🚀 开始登录账号: ${user}`);
  
  let result = { user, success: false, message: '' };
  
  try {
    const browser = await chromium.launch({ 
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });
    
    let page;
    
    try {
      page = await browser.newPage();
      page.setDefaultTimeout(PAGE_DEFAULT_TIMEOUT);
      
      console.log(`📱 ${user} - 正在访问网站...`);
      await page.goto('https://www.netlib.re/', { waitUntil: 'networkidle' });
      await page.waitForTimeout(PAGE_WAIT_TIMEOUT);
      
      console.log(`🔑 ${user} - 点击登录按钮...`);
      await page.click('text=Login', { timeout: LOGIN_WAIT_TIMEOUT });
      
      await page.waitForTimeout(SUBMIT_WAIT_TIMEOUT);
      
      console.log(`📝 ${user} - 填写用户名...`);
      await page.fill('input[name="username"], input[type="text"]', user);
      await page.waitForTimeout(FIELD_WAIT_TIMEOUT);
      
      console.log(`🔒 ${user} - 填写密码...`);
      await page.fill('input[name="password"], input[type="password"]', pass);
      await page.waitForTimeout(FIELD_WAIT_TIMEOUT);
      
      console.log(`📤 ${user} - 提交登录...`);
      await page.click('button:has-text("Validate"), input[type="submit"]');
      
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(SUCCESS_CHECK_TIMEOUT);
      
      // 检查登录是否成功
      const pageContent = await page.content();
      
      if (pageContent.includes('exclusive owner') || pageContent.includes(user)) {
        console.log(`✅ ${user} - 登录成功`);
        result.success = true;
        result.message = `✅ ${user} 登录成功`;
      } else {
        console.log(`❌ ${user} - 登录失败`);
        result.message = `❌ ${user} 登录失败`;
      }
    } finally {
      try {
        if (page) await page.close();
      } catch (closeError: any) {
        console.log(`❌ ${user} - 页面关闭异常: ${closeError.message}`);
      }
      try {
        await browser.close();
      } catch (closeError: any) {
        console.log(`❌ ${user} - 浏览器关闭异常: ${closeError.message}`);
      }
    }
  } catch (e: any) {
    console.log(`❌ ${user} - 登录异常: ${e.message}`);
    // 尝试提供更具体的错误信息
    if (e.message.includes('Executable doesn\'t exist') || 
        e.message.includes('Host system is missing dependencies') ||
        e.message.includes('playwright')) {
      result.message = `❌ ${user} Playwright环境问题: ${e.message}`;
    } else {
      result.message = `❌ ${user} 登录异常: ${e.message}`;
    }
  }
  
  return result;
}

// 格式化 Telegram 消息
function formatTelegramMessage(message: string): string {
  const now = new Date();
  const timeString = now.toLocaleString('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(/\//g, '-').replace(', ', ' ');

  return `🎉 Netlib 登录通知

登录时间：${timeString} CST

${message}`;
}

// 发送 Telegram 消息
async function sendTelegramMessage(message: string) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'Markdown',
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ Telegram 消息发送失败: ${response.status} - ${errorText}`);
    } else {
      console.log('✅ Telegram 消息发送成功');
    }
  } catch (error: any) {
    console.log(`❌ Telegram 消息发送异常: ${error.message}`);
  }
}