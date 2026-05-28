# AI Agent Chat 接口规范 v1.0

> **本文件是前后端契约文档。** 后端按此规范实现接口，前端无需任何改动即可对接。
>
> - 维护人（前端）：前端团队
> - 创建日期：2026-05-28
> - 最后更新：2026-05-28
> - 实现位置：`src/services/agentApi.ts`

---

## 1. 接口概览

| 项目 | 内容 |
|------|------|
| **端点** | `POST /api/agent/chat` |
| **协议** | HTTP/1.1 |
| **响应类型** | `text/event-stream`（SSE 流式）|
| **请求体** | `application/json` |
| **认证** | （Phase 2 添加，当前为空）|
| **超时** | 客户端 60s |
| **CORS** | 必须允许 `Origin: http://localhost:5173`（开发期）|

---

## 2. 请求格式

### 2.1 请求头

```http
POST /api/agent/chat HTTP/1.1
Content-Type: application/json
Accept: text/event-stream
```

### 2.2 请求体 Schema（TypeScript）

```typescript
interface AgentChatRequest {
  /** 用户本次提问（必填，非空） */
  message: string

  /** 学生画像（必填，作为 Agent 上下文） */
  studentInfo: {
    province: string                      // 省份，如 "湖南"
    score: number                         // 高考分数，0-750
    rank: number                          // 高考位次，正整数
    subjects: SubjectType[]               // 选科，1-6 个
    targetCities: string[]                // 目标城市，可为空数组
    majorPreference: string               // 专业偏好自由文本
    schoolPreference: SchoolPreference    // 院校层次偏好
    careAboutPostgrad: boolean            // 是否重视保研
    riskPreference: RiskPreference        // 风险偏好
    educationGoal?: EducationGoal         // 升学目标（可选）
  }

  /** 历史对话（可为空数组，最近 N 轮，前端会自行裁剪） */
  history: Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: number                     // Unix ms
  }>
}

type SubjectType        = '物理' | '化学' | '生物' | '历史' | '地理' | '政治'
type SchoolPreference   = '985' | '211' | '双一流' | '普通本科' | '不限'
type RiskPreference     = '冲刺' | '稳妥' | '保底'
type EducationGoal      = '直接就业' | '考研' | '保研' | '出国留学' | '考公考编' | '未定'
```

### 2.3 请求示例

```json
{
  "message": "冲刺西安交大有多大把握？",
  "studentInfo": {
    "province": "湖南",
    "score": 568,
    "rank": 15000,
    "subjects": ["物理", "化学", "生物"],
    "targetCities": ["武汉", "长沙", "成都"],
    "majorPreference": "计算机/电子信息",
    "schoolPreference": "211",
    "careAboutPostgrad": true,
    "riskPreference": "稳妥",
    "educationGoal": "保研"
  },
  "history": [
    {
      "id": "msg_1716800000000",
      "role": "user",
      "content": "我568分能上哪些学校？",
      "timestamp": 1716800000000
    },
    {
      "id": "msg_1716800010000",
      "role": "assistant",
      "content": "根据 2024 年数据……",
      "timestamp": 1716800010000
    }
  ]
}
```

---

## 3. 响应格式（SSE 流式）

### 3.1 总体结构

后端以 **Server-Sent Events** 协议持续推送，每个事件帧格式：

```
data: <JSON 字符串>\n\n
```

**注意：每帧必须以 `\n\n` 结尾（两个换行符）。**

### 3.2 帧的统一封装

```typescript
interface SSEFrame<T> {
  type: SSEEventType
  payload: T
}

type SSEEventType =
  | 'step'              // Agent 步骤状态更新
  | 'sources'           // RAG 检索到的引用源
  | 'recommendations'   // 推荐院校列表
  | 'token'             // 流式 token（answer 的一段文字）
  | 'next_actions'      // 下一步建议按钮文案
  | 'done'              // 流结束
  | 'error'             // 错误
```

---

## 4. 各事件类型详细定义

### 4.1 `step` — Agent 执行步骤

**触发时机**：每个步骤状态变化时（pending → running → done），各推送一次。

```typescript
interface StepPayload {
  /** 步骤 ID，固定为 s1-s5（顺序固定） */
  id: 's1' | 's2' | 's3' | 's4' | 's5'

  /** 步骤图标类型（前端按此渲染不同图标） */
  icon: 'profile' | 'plan' | 'policy' | 'match' | 'generate'

  /** 步骤标题（固定文案，必须严格遵守下表） */
  label: string

  /** 状态 */
  status: 'pending' | 'running' | 'done'

  /** 步骤具体执行细节（running/done 时返回，前端展示在 label 下方） */
  detail?: string

  /**
   * 是否复用上下文缓存（Phase 2 新增）
   *
   * - 第 1 轮提问：所有 step 的 cached 均为 false（全量执行）
   * - 第 2+ 轮提问：
   *   · 已分析过的学生画像（s1）应标 cached: true
   *   · 与上轮同场景的招生计划/保研政策检索（s2/s3）应标 cached: true
   *   · 院校匹配（s4）和生成建议（s5）通常每轮都重新执行
   *
   * 前端会用：
   *   · 更弱的视觉（绿色闪电图标 + "缓存" 徽章）
   *   · 更短的动画时长（180ms vs 700ms）
   *   · label 文案应该改为完成态描述，如 "已加载学生画像"、"复用招生计划检索结果"
   */
  cached?: boolean
}
```

**5 个固定步骤约定**：

| id | icon | label（首轮，cached=false） | label（缓存复用，cached=true） | detail 示例 |
|----|------|---------------------------|------------------------------|------------|
| s1 | profile  | `正在分析学生画像...` | `已加载学生画像` | `复用第 1 轮分析结果（湖南 568分）` |
| s2 | plan     | `正在检索招生计划...` | `复用招生计划检索结果` | `上轮已检索同场景数据，直接复用` |
| s3 | policy   | `正在查询保研政策...` | `复用保研政策检索结果` | `上轮已加载相关政策文件` |
| s4 | match    | `正在匹配院校专业...` | （s4 一般不缓存） | `已运行匹配算法：筛出 4 所适配院校` |
| s5 | generate | `正在生成升学建议...` | （s5 永不缓存） | `结合升学目标生成个性化建议` |

**Cached 判定规则**（后端实现参考）：

```
let userTurns = history.filter(m => m.role === 'user').length
let isFirstTurn = userTurns === 0
let lastScenario = inferScenario(history.findLast(m => m.role === 'user')?.content)
let currentScenario = inferScenario(message)
let isSameScenario = lastScenario === currentScenario

s1.cached = !isFirstTurn
s2.cached = !isFirstTurn && isSameScenario
s3.cached = !isFirstTurn && isSameScenario
s4.cached = false  // 每轮重新匹配
s5.cached = false  // 每轮重新生成
```

**事件示例**：

```
data: {"type":"step","payload":{"id":"s1","icon":"profile","label":"正在分析学生画像...","status":"running","detail":"识别画像：湖南 568分 位次15000"}}

data: {"type":"step","payload":{"id":"s1","icon":"profile","label":"正在分析学生画像...","status":"done","detail":"识别画像：湖南 568分 位次15000"}}
```

> ⚠️ **顺序要求**：必须按 s1 → s2 → s3 → s4 → s5 顺序推送。前端依赖此顺序展示进度。

---

### 4.2 `sources` — RAG 引用源

**触发时机**：检索完成后、token 开始流式前**推送一次**。

```typescript
interface SourcesPayload {
  sources: Array<{
    id: string                        // 唯一 ID，如 "ks_001"
    type: KnowledgeSourceType         // 来源类型，见下
    title: string                     // 文档标题
    source: string                    // 出处（机构 / 文件号）
    relevance: string                 // 与本次问题的相关性描述
    year?: number                     // 数据年份（可选）
    schoolName?: string               // 关联院校（可选）
    excerpt?: string                  // RAG 检索到的具体文本片段（前端会以引文形式展示）
  }>
}

type KnowledgeSourceType =
  | '招生数据'
  | '录取数据'
  | '保研政策'
  | '专业信息'
  | '培养方案'
  | '奖学金政策'
  | '转专业政策'
  | '院校官网'
```

**事件示例**：

```
data: {"type":"sources","payload":{"sources":[
  {"id":"ks_001","type":"录取数据","year":2024,"title":"2024年湖南省普通高校招生录取数据汇编","source":"湖南省教育考试院","relevance":"湖南考生在西安交大的录取数据","excerpt":"西安交通大学：电气类588分，10000位…"},
  {"id":"ks_002","type":"招生数据","year":2024,"schoolName":"西安交通大学","title":"西安交通大学2024年湖南省分专业招生计划","source":"西安交通大学本科招生网","relevance":"电气类、自动化类在湖南的招生名额"}
]}}
```

> 推荐 sources 数量：**2-5 个**。少于 2 会显得 RAG 不工作，多于 5 用户读不完。

---

### 4.3 `recommendations` — 推荐院校卡片

**触发时机**：匹配算法完成后、token 开始流式前**推送一次**。

```typescript
interface RecommendationsPayload {
  recommendations: Array<{
    id: string                        // 院校 ID，对应 /detail/:id 详情页
    matchScore: number                // 匹配度 0-100
    schoolName: string                // 院校名称
    recommendedMajor: string          // 推荐专业
    city: string                      // 所在城市
    schoolLevel: string               // 院校层次，如 "985/211"
    category: '冲刺' | '稳妥' | '保底'
    admissionRisk: '高' | '中' | '低'
    lastYearScore: number             // 往年录取分数
    lastYearRank: number              // 往年录取位次
    postgradAdvantage: string         // 保研优势描述
    reason: string                    // 推荐理由
  }>
}
```

**事件示例**：

```
data: {"type":"recommendations","payload":{"recommendations":[
  {"id":"school_001","matchScore":93,"schoolName":"西安交通大学","recommendedMajor":"自动化类","city":"西安","schoolLevel":"985/211","category":"冲刺","admissionRisk":"高","lastYearScore":588,"lastYearRank":10000,"postgradAdvantage":"保研率 22%","reason":"顶尖985，自动化学科排名前3"}
]}}
```

> 推荐 recommendations 数量：**3-5 个**。前端按 2 列网格展示，6+ 会显得拥挤。

---

### 4.4 `token` — 流式文字回答

**触发时机**：sources/recommendations 推完后，**多次推送**（每次推一小段文字）。

```typescript
interface TokenPayload {
  delta: string                       // 本次新增的字符（建议 1-10 字）
}
```

**事件示例**：

```
data: {"type":"token","payload":{"delta":"根据"}}
data: {"type":"token","payload":{"delta":"你的"}}
data: {"type":"token","payload":{"delta":"分数"}}
data: {"type":"token","payload":{"delta":"568"}}
data: {"type":"token","payload":{"delta":"分，"}}
```

> 前端会拼接所有 delta 形成最终 `answer` 文本，并实时打字机展示。

> **节奏建议**：每 20-50ms 推一帧，每帧 1-5 字符。太慢用户等待，太快感受不到流式效果。

---

### 4.5 `next_actions` — 下一步建议按钮

**触发时机**：token 流式接近结束时**推送一次**。

```typescript
interface NextActionsPayload {
  nextActions: string[]               // 建议下一步操作文案，3-4 条
}
```

**事件示例**：

```
data: {"type":"next_actions","payload":{"nextActions":["查看西安交大详情","加入对比清单","生成志愿规划报告"]}}
```

**前端行为约定**（后端无需关心，仅供参考）：

| nextActions 文案包含 | 前端跳转 |
|---------------------|---------|
| `"对比"` | `/compare` |
| `"报告"` 或 `"规划"` | `/report` |
| `"推荐"` 或 `"结果"` | `/results` |
| `"详情"` | `/detail/:第一条推荐的id` |
| 其他文案 | 作为新问题再次发送 |

---

### 4.6 `done` — 流结束

**触发时机**：所有内容推送完毕，**必须最后推一次**。

```typescript
interface DonePayload {
  /** 服务端处理总耗时（毫秒，可选，用于前端展示性能） */
  durationMs?: number

  /** 本次回答消耗的 token 数（可选，用于计费/统计） */
  tokensUsed?: number
}
```

**事件示例**：

```
data: {"type":"done","payload":{"durationMs":2340,"tokensUsed":1850}}
```

---

### 4.7 `error` — 错误

**触发时机**：任何环节出错（鉴权失败、LLM 调用失败、检索失败等）。

```typescript
interface ErrorPayload {
  code: string                        // 错误码，如 "RAG_TIMEOUT"
  message: string                     // 给用户看的友好消息
  retryable: boolean                  // 是否可重试
}
```

**事件示例**：

```
data: {"type":"error","payload":{"code":"LLM_RATE_LIMIT","message":"AI 服务繁忙，请稍后重试","retryable":true}}
```

> 推送 `error` 后必须紧跟 `done` 帧关闭流。

---

## 5. 完整响应示例（端到端）

```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"type":"step","payload":{"id":"s1","icon":"profile","label":"正在分析学生画像...","status":"running","detail":"识别画像：湖南 568分 位次15000"}}

data: {"type":"step","payload":{"id":"s1","icon":"profile","label":"正在分析学生画像...","status":"done","detail":"识别画像：湖南 568分 位次15000"}}

data: {"type":"step","payload":{"id":"s2","icon":"plan","label":"正在检索招生计划...","status":"running","detail":"已检索：8 所 985/211 院校"}}

data: {"type":"step","payload":{"id":"s2","icon":"plan","label":"正在检索招生计划...","status":"done","detail":"已检索：8 所 985/211 院校"}}

data: {"type":"step","payload":{"id":"s3","icon":"policy","label":"正在查询保研政策...","status":"running","detail":"已加载：8 份保研政策文件"}}

data: {"type":"step","payload":{"id":"s3","icon":"policy","label":"正在查询保研政策...","status":"done","detail":"已加载：8 份保研政策文件"}}

data: {"type":"step","payload":{"id":"s4","icon":"match","label":"正在匹配院校专业...","status":"running","detail":"已筛出 4 所适配院校"}}

data: {"type":"step","payload":{"id":"s4","icon":"match","label":"正在匹配院校专业...","status":"done","detail":"已筛出 4 所适配院校"}}

data: {"type":"step","payload":{"id":"s5","icon":"generate","label":"正在生成升学建议...","status":"running","detail":"结合保研目标生成建议"}}

data: {"type":"step","payload":{"id":"s5","icon":"generate","label":"正在生成升学建议...","status":"done","detail":"结合保研目标生成建议"}}

data: {"type":"sources","payload":{"sources":[{"id":"ks_001","type":"录取数据","year":2024,"title":"2024年湖南省录取数据","source":"湖南省教育考试院","relevance":"湖南考生录取数据","excerpt":"西安交大 588分..."}]}}

data: {"type":"recommendations","payload":{"recommendations":[{"id":"school_001","matchScore":93,"schoolName":"西安交通大学","recommendedMajor":"自动化类","city":"西安","schoolLevel":"985/211","category":"冲刺","admissionRisk":"高","lastYearScore":588,"lastYearRank":10000,"postgradAdvantage":"保研率 22%","reason":"顶尖985"}]}}

data: {"type":"token","payload":{"delta":"根据"}}

data: {"type":"token","payload":{"delta":"你的"}}

data: {"type":"token","payload":{"delta":"情况"}}

data: {"type":"token","payload":{"delta":"，冲刺"}}

data: {"type":"token","payload":{"delta":"西安交大"}}

data: {"type":"token","payload":{"delta":"有较大"}}

data: {"type":"token","payload":{"delta":"风险..."}}

data: {"type":"next_actions","payload":{"nextActions":["查看西安交大详情","加入对比清单","生成志愿规划报告"]}}

data: {"type":"done","payload":{"durationMs":2340,"tokensUsed":1850}}

```

---

## 6. 推送顺序契约（前端依赖此顺序）

```
┌───────────────────────────────────────────┐
│  必须按以下顺序推送：                       │
│                                           │
│  s1.running → s1.done                     │
│  s2.running → s2.done                     │
│  s3.running → s3.done                     │
│  s4.running → s4.done                     │
│  s5.running → s5.done                     │
│  sources (一次)                            │
│  recommendations (一次)                    │
│  token (多次，按文字顺序)                  │
│  next_actions (一次)                       │
│  done (最后一帧)                           │
└───────────────────────────────────────────┘
```

**违反顺序的后果**：

| 违反点 | 前端表现 |
|--------|---------|
| 步骤乱序 | 进度展示错乱 |
| sources/recommendations 在 token 之后 | 卡片晚于文字出现，体验差 |
| 缺 done 帧 | 前端无法判断流结束，光标一直闪烁 |
| token 中混入其他类型帧 | 文字流被打断 |

---

## 7. 错误处理

### 7.1 HTTP 层错误

| 状态码 | 含义 | 前端行为 |
|--------|------|---------|
| 400 | 请求格式错误 | 弹窗提示开发者 |
| 401 | 鉴权失败 | 跳转登录 |
| 429 | 频率限制 | toast "请求过快" |
| 500 | 服务端错误 | toast "AI 服务异常" |
| 503 | LLM 服务不可用 | toast "AI 服务暂时不可用" |

> 即使是 HTTP 错误，**也建议返回 SSE 流并推一帧 `error` 事件**，前端处理会更统一。

### 7.2 流中错误

任何错误推 `error` + `done`，**不要直接关闭连接**：

```
data: {"type":"error","payload":{"code":"RAG_TIMEOUT","message":"知识库检索超时","retryable":true}}

data: {"type":"done","payload":{}}

```

---

## 8. 后端实现 Checklist

后端开发完成后，请逐项确认：

- [ ] 端点路径 `POST /api/agent/chat` 已部署
- [ ] CORS 允许前端 Origin
- [ ] 响应头 `Content-Type: text/event-stream`
- [ ] 每帧以 `\n\n` 结尾
- [ ] 5 个 step 顺序推送（s1 → s5）
- [ ] 每个 step 至少推 `running` + `done` 两帧
- [ ] step.label 严格遵守 §4.1 表格中的固定文案
- [ ] step.icon 为枚举值 `profile|plan|policy|match|generate`
- [ ] sources 在 token 之前推送
- [ ] recommendations 在 token 之前推送
- [ ] sources.type 为枚举值（见 §4.2）
- [ ] recommendations.category 为 `冲刺|稳妥|保底`
- [ ] recommendations.admissionRisk 为 `高|中|低`
- [ ] token.delta 按文字顺序推送
- [ ] next_actions 在 token 之后、done 之前
- [ ] 流结束必有 done 帧
- [ ] 错误场景推 error + done

---

## 9. 联调方式

### 9.1 前端临时切换到真实接口

修改 `src/services/agentApi.ts`，把整个 `chatWithAgent` 函数体替换为真实 fetch 版本（注释里有完整示例）。

### 9.2 Mock 模式与真实模式共存（推荐）

在 `.env` 添加环境变量切换：

```typescript
// src/services/agentApi.ts
const USE_REAL_API = import.meta.env.VITE_USE_REAL_API === 'true'

export function chatWithAgent(req, callbacks) {
  return USE_REAL_API
    ? chatWithAgentReal(req, callbacks)
    : chatWithAgentMock(req, callbacks)
}
```

启动时指定：

```bash
# 用 Mock（默认）
npm run dev

# 用真实后端
VITE_USE_REAL_API=true npm run dev
```

### 9.3 Postman 测试模板

后端开发自测时可用以下 curl：

```bash
curl -N -X POST http://localhost:8000/api/agent/chat \
  -H "Content-Type: application/json" \
  -H "Accept: text/event-stream" \
  -d '{
    "message": "冲刺西安交大有多大把握？",
    "studentInfo": {
      "province": "湖南",
      "score": 568,
      "rank": 15000,
      "subjects": ["物理", "化学", "生物"],
      "targetCities": ["长沙"],
      "majorPreference": "计算机",
      "schoolPreference": "211",
      "careAboutPostgrad": true,
      "riskPreference": "稳妥",
      "educationGoal": "保研"
    },
    "history": []
  }'
```

`-N` 表示禁用缓冲，可实时看到流式输出。

---

## 10. 版本记录

| 版本 | 日期 | 变更 |
|------|------|------|
| v1.0 | 2026-05-28 | 初版，定义 5 步 Agent + RAG 流式协议 |

---

## 附录 A：完整 TypeScript 类型定义

前端使用的全部类型定义在 `src/types/index.ts`，后端实现时可直接对照：

```typescript
// 请求
export interface AgentChatRequest {
  message: string
  studentInfo: StudentInfo
  history: ChatMessage[]
}

// 响应（聚合形式，仅供参考；实际通过 SSE 流式拆分推送）
export interface AgentResponse {
  answer: string
  agentSteps: AgentStep[]
  recommendations: SchoolRecommendation[]
  sources: KnowledgeSource[]
  nextActions: string[]
}

// 详细字段定义见 src/types/index.ts
```

---

**有任何疑问请联系前端团队。**
