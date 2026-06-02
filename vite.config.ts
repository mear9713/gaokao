import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // 开发环境后端地址，可在 .env.local 用 VITE_DEV_API_TARGET 覆盖
  const apiTarget = env.VITE_DEV_API_TARGET || 'http://39.96.180.115:8001'

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      // 开发期用代理转发 /api，绕过浏览器 CORS 与 HTTPS 混合内容限制；
      // SSE（智能问答流式）也经此代理转发。
      proxy: {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          // 后端走 frp/ngrok 自签证书时跳过校验；目标是 http 时此项无影响
          secure: false,
        },
      },
    },
  }
})
