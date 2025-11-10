# Netlib Auto Login

自动登录 Netlib 系统的工具。

## 环境变量配置

要配置应用程序，请设置以下环境变量：

- `ACCOUNTS`: 登录账号，格式为 `user1:pass1,user2:pass2`
- `CRON_SCHEDULE`: （可选）自定义 cron 调度时间，默认为 `0 0 */15 * *`（每15天午夜执行）
- `CRON_SECRET`: （推荐）用于保护 cron 端点的安全密钥，防止未经授权的访问

## 自定义 Cron 调度

默认情况下，cron 作业设置为每15天运行一次（在午夜）。如果您想更改此设置而不修改代码，可以通过以下方式之一进行：

1. Fork 此仓库并修改 `vercel.json` 中的调度表达式：
   ```json
   "crons": [
     {
       "path": "/api/cron",
       "schedule": "你的自定义调度表达式"
     }
   ]
   ```

2. 使用 Vercel CLI 部署时指定不同的调度时间：
   ```bash
   vercel env add CRON_SCHEDULE
   # 然后在部署脚本中使用这个环境变量生成 vercel.json
   ```

## Cron 表达式示例

- `0 0 * * *` - 每天午夜执行
- `0 0 * * 0` - 每周日凌晨执行
- `0 0 1 * *` - 每月第一天执行
- `*/30 * * * *` - 每30分钟执行一次
- `0 9-17 * * *` - 每天上午9点到下午5点每小时执行一次

更多信息请参考：https://crontab.guru/

# Netlib 自动登录系统 (Vercel 部署版)

这是一个用于自动登录 [netlib.re](https://www.netlib.re/) 网站的定时任务系统，专为部署到 Vercel 设计。

## 功能特点

- 使用 Playwright 进行浏览器自动化登录
- 支持定时任务自动执行登录
- 通过 Vercel Cron Jobs 实现定期执行
- **有限并发处理**：为了提高处理效率同时避免资源耗尽，系统采用有限并发方式处理多个账号，每批最多处理3个账号

## 部署到 Vercel

### 部署步骤

1. 将此项目Fork到 GitHub 仓库

2. 在 [Vercel](https://vercel.com/) 上创建新项目并连接到您的 GitHub 仓库

3. 在 Vercel 项目设置中添加环境变量:
   - `ACCOUNTS`: 您的账号信息，格式为 `username1:password1,username2:password2`

4. 部署完成后，系统将根据配置的 cron 表达式自动执行定时登录任务

## 定时任务配置

默认配置为每15天运行一次，可以通过修改 `vercel.json` 中的 `crons.schedule` 字段来调整：

> **安全提醒**：为了防止未经授权的访问，强烈推荐配置 `CRON_SECRET` 环境变量。

```json
{
  "crons": [
    {
      "path": "/api/cron",
      "schedule": "0 0 */15 * *" // cron 表达式 (分钟 小时 日 月 星期)
    }
  ]
}
```

### 通过环境变量自定义 Cron 调度

为了方便用户自定义 cron 调度而无需修改代码仓库，我们提供了一种动态设置 cron 调度的方法：

1. 在 Vercel 环境变量中添加 `CRON_SCHEDULE` 变量
2. 设置所需的 cron 表达式作为值
3. 部署时会自动使用该环境变量生成最终的 `vercel.json`

例如，如果要设置为每6小时执行一次，可以设置：

```
CRON_SCHEDULE=0 */6 * * *
```

如果要恢复为每天执行一次，可以设置：

```
CRON_SCHEDULE=0 0 * * *
```

### Cron 表达式示例

- `0 0 */15 * *` - 每15天午夜执行 (默认)
- `0 0 * * *` - 每天午夜执行
- `0 0 * * 0` - 每周日凌晨执行
- `0 */6 * * *` - 每6小时执行一次
- `0 9-17 * * 1-5` - 工作日的上午9点到下午5点每小时执行一次
- `*/30 * * * *` - 每30分钟执行一次

更多表达式可以参考 [crontab.guru](https://crontab.guru/)

## 环境变量

在 Vercel 项目设置中配置以下环境变量:

- `ACCOUNTS`: 要自动登录的账号列表，格式为 `username1:password1,username2:password2`
- `TEST_ACCOUNTS`: 测试用账号列表 (可选，默认使用 ACCOUNTS)
- `CRON_SECRET`: Cron 安全密钥 (推荐)，用于防止未经授权的访问
- `CRON_SCHEDULE`: Cron 调度表达式 (可选，默认为 `0 0 */15 * *`)
- `TELEGRAM_BOT_TOKEN`: Telegram 机器人 API Token (可选)
- `TELEGRAM_CHAT_ID`: Telegram 接收消息的 Chat ID (可选)

## 安全配置

为了防止未经授权的访问，强烈推荐配置 `CRON_SECRET` 环境变量：

1. 在 Vercel 项目设置中添加 `CRON_SECRET` 环境变量
2. 设置一个强密码作为值
3. Vercel 会在每次 cron 作业调用时自动将该值作为 `Authorization` 头发送

例如：
```
CRON_SECRET=my_strong_secret_key_12345
```

这样可以确保只有 Vercel 的合法 cron 作业才能触发您的 API 端点。

## 网页界面

应用包含一个简单的首页，显示项目信息和API端点说明。

- **URL**: `/`
- **说明**: 默认首页，提供项目概述和API端点信息

## API 端点

### 定时任务接口

- **URL**: `/api/cron`
- **方法**: `GET`
- **说明**: 由 Vercel Cron 自动调用，根据配置每15天执行一次

### 测试定时任务接口

- **URL**: `/api/test-cron`
- **方法**: `GET`
- **说明**: 手动触发定时任务，用于测试和调试

## 本地开发

要在本地运行和测试应用，请按照以下步骤操作：

1. 安装依赖：
   ```bash
   npm install
   ```

2. 创建环境变量文件：
   在项目根目录下创建 `.env.local` 文件并配置以下环境变量：
   ```
   ACCOUNTS=user1:password1,user2:password2
   CRON_SECRET=my_local_secret_key_123
   ```

3. 启动开发服务器：
   ```bash
   npm run dev
   ```

4. 访问应用：
   打开浏览器访问 http://localhost:3000

### 本地环境变量配置

为本地开发配置环境变量，创建 `.env.local` 文件：

```bash
# 账号信息（必需）
ACCOUNTS=user1:password1,user2:password2

# 测试账号信息（可选，优先于 ACCOUNTS）
TEST_ACCOUNTS=testuser:testpass

# Cron 安全密钥（推荐）
CRON_SECRET=my_local_secret_key_123

# Cron 调度时间（可选）
CRON_SCHEDULE=0 0 * * *

# Telegram 机器人配置（可选）
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here
```

### Telegram 通知功能

应用支持通过 Telegram 机器人发送登录结果通知。要启用此功能，请执行以下操作：

1. 创建一个 Telegram 机器人：
   - 在 Telegram 中搜索 @BotFather
   - 发送 `/newbot` 命令创建新机器人
   - 按照指示操作，获取机器人的 API Token

2. 获取您的 Chat ID：
   - 在 Telegram 中搜索您创建的机器人
   - 发送任意消息给机器人
   - 访问 `https://api.telegram.org/bot<BOT_TOKEN>/getUpdates` 获取更新信息
   - 找到您的消息，其中包含 chat.id 字段

3. 在环境变量中配置：
   ```
   TELEGRAM_BOT_TOKEN=您的机器人API Token
   TELEGRAM_CHAT_ID=您的Chat ID
   ```

启用 Telegram 通知后，系统将在以下情况下发送消息：
- 每个账号登录成功时发送单独通知
- 所有账号处理完成后发送汇总报告

### 测试 API 端点

由于安全机制的存在，测试 API 端点需要提供正确的 Authorization 头：

```bash
# 使用 curl 测试
curl -H "Authorization: Bearer my_local_secret_key_123" http://localhost:3000/api/cron

# 或者测试端点
curl -H "Authorization: Bearer my_local_secret_key_123" http://localhost:3000/api/test-cron
```