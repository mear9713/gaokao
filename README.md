# 高考志愿填报 AI Agent · 前端

用户输入高考信息后，系统输出一张院校专业匹配度推荐表，推荐表按照匹配度从高到低排序。用户点击表格中的某一行后，可以展开查看该院校和专业的详细信息，包括保研率、学院政策、奖学金政策、成绩计算方式、毕业要求、升学去向等内容。系统还需要支持同类专业横向对比，并提供 AI Agent 志愿咨询页面。

> 技术栈：React 19 + TypeScript 6 + Vite 8 + Tailwind CSS v4 + shadcn/ui

---

## 🔌 后端对接

数据采集需求见 **[`docs/数据收集要求.md`](./docs/数据收集要求.md)**

前端接口适配层：[`src/services/agentApi.ts`](./src/services/agentApi.ts)
真实后端就绪时只需替换此文件，UI 层无需改动。

---

## 🚀 启动

```bash
npm install
npm run dev   # http://localhost:5173
```

生产构建：

```bash
npm run build     # 产物在 dist/
npm run preview   # 本地预览生产构建
```

---

## 📂 目录结构

```
src/
├── pages/              6 个路由页面
│   ├── InputPage.tsx       学生信息输入
│   ├── ResultsPage.tsx     推荐结果表格
│   ├── DetailPage.tsx      院校专业详情（Apple 风）
│   ├── ComparePage.tsx     横向对比
│   ├── ChatPage.tsx        AI Agent 咨询
│   └── ReportPage.tsx      志愿规划报告
├── components/
│   ├── ui/                 shadcn/ui 组件
│   └── layout/             布局组件
├── services/agentApi.ts    Agent 接口适配层（含 Mock）
├── data/mockData.ts        Mock 数据 + Agent 响应生成器
├── context/AppContext.tsx  全局状态
├── types/index.ts          TypeScript 类型定义
└── lib/utils.ts            工具函数

docs/
└── API_AGENT_CHAT.md       前后端接口契约文档
```

---

## ✨ AI Agent 核心特性

| 特性 | 说明 |
|------|------|
| 5 步执行链 | 分析学生画像 → 检索招生计划 → 查询保研政策 → 匹配院校专业 → 生成升学建议 |
| 上下文缓存 | 第 2+ 轮提问时，已分析过的画像 / 同场景检索自动复用，更快响应 |
| 流式打字机 | AI 回答逐字流式输出，光标闪烁 |
| RAG 知识库引用 | 8 类知识源（招生数据 / 保研政策 / 专业信息 / 培养方案等） |
| 推荐院校卡片 | 回答下方展示匹配度、冲稳保、录取风险、推荐理由 |
| 下一步建议 | 智能跳转到详情 / 对比 / 报告页 |
| 历史快速跳转 | 顶部芯片栏点击可跳到任意历史问题 |
| 会话持久化 | localStorage 记录，刷新不丢 |

---

## 📜 License

MIT
