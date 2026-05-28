# 📚 接口规范文档索引

> 本目录存放前后端接口契约文档。后端开发请先阅读本目录。

## 文档列表

| 文档 | 说明 | 状态 |
|------|------|------|
| [`API_AGENT_CHAT.md`](./API_AGENT_CHAT.md) | **AI Agent 流式对话接口**（核心） | ✅ v1.0 |

## 快速开始（后端视角）

1. **先看 [`API_AGENT_CHAT.md`](./API_AGENT_CHAT.md) 第 1-5 章**：了解接口形态和数据结构
2. **看第 6 章**：理解 SSE 推送顺序约定
3. **按第 8 章 Checklist 实现**
4. **用第 9.3 节的 curl 模板自测**
5. **联调时切换前端到真实接口（第 9.1-9.2 节）**

## 类型定义同步

前端 TypeScript 类型源文件：[`../src/types/index.ts`](../src/types/index.ts)

**任何接口字段变更必须同步更新**：
- `src/types/index.ts`（前端类型）
- `docs/API_AGENT_CHAT.md`（接口文档）

## 接口实现位置（前端）

| 文件 | 作用 |
|------|------|
| `src/services/agentApi.ts` | 接口适配层（当前为 Mock，对接时只改此文件） |
| `src/pages/ChatPage.tsx` | UI 消费层（无需关心，接口稳定即可） |
| `src/data/mockData.ts` | Mock 数据（对接后可删除）|
