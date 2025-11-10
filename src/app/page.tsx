import React from 'react';

export default function Home() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>NetBar Library Auto Login System</h1>
      <p>这是一个自动登录 NetLib 的定时任务应用。</p>
      
      <div style={{ 
        backgroundColor: '#f0f0f0', 
        padding: '20px', 
        borderRadius: '8px', 
        marginTop: '20px',
        textAlign: 'center'
      }}>
        <h2>API 端点</h2>
        <ul style={{ textAlign: 'left' }}>
          <li><strong>/api/cron</strong> - 主定时任务端点（每15天自动运行一次）</li>
          <li><strong>/api/test-cron</strong> - 测试定时任务端点（手动触发）</li>
        </ul>
      </div>
      
      <div style={{ 
        backgroundColor: '#e8f4fd', 
        padding: '20px', 
        borderRadius: '8px', 
        marginTop: '20px',
        textAlign: 'center'
      }}>
        <h2>安全说明</h2>
        <p>所有 API 端点都受到 <code>CRON_SECRET</code> 环境变量保护，防止未授权访问。</p>
      </div>
      
      <footer style={{ 
        marginTop: '40px', 
        textAlign: 'center', 
        color: '#666',
        fontSize: '0.9em'
      }}>
        <p>部署在 Vercel 上的自动化应用</p>
      </footer>
    </div>
  );
}