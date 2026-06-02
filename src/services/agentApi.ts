/**
 * AI Agent 接口适配层 — 真实 SSE 对接。
 *
 * 端点：POST /api/v1/recommendations/{recommendationId}/chat
 * 请求体：{ message }
 * 响应：text/event-stream，每帧 `data: <JSON>\n\n`
 * 事件类型：step / sources / recommendations / token / next_actions / done / error
 *
 * ⚠️ 后端要求基于某次推荐结果追问，故必须带 recommendationId；
 *    回调接口（onStep/onAllStepsDone/onToken/onDone/onError）与原 Mock 版保持一致，
 *    ChatPage 无需改动消费逻辑。
 */
import type {
  AgentChatRequest,
  AgentResponse,
  AgentStep,
  AgentStepIcon,
  KnowledgeSource,
  SchoolRecommendation,
} from '@/types'
import { API_BASE_URL, AUTH_STORAGE_KEY, getStoredToken } from './http'

export interface AgentStreamCallbacks {
  /** 每个 Agent 步骤状态变化时回调 */
  onStep?: (step: AgentStep, index: number) => void
  /** 所有步骤完成、开始流式回答前回调 */
  onAllStepsDone?: (response: AgentResponse) => void
  /** 流式回答的每个 token 片段回调 */
  onToken?: (chunk: string, fullSoFar: string) => void
  /** 整个流程结束回调 */
  onDone?: (response: AgentResponse) => void
  /** 错误回调 */
  onError?: (error: Error) => void
}

export interface StreamControl {
  /** 取消进行中的流 */
  cancel: () => void
}

// 后端 step 帧可能只带 {id, status, detail, cached}，按 id 补齐前端展示所需的 icon / label
const STEP_META: Record<string, { icon: AgentStepIcon; label: string }> = {
  s1: { icon: 'profile',  label: '分析学生画像' },
  s2: { icon: 'plan',     label: '检索招生计划' },
  s3: { icon: 'policy',   label: '查询保研政策' },
  s4: { icon: 'match',    label: '匹配院校专业' },
  s5: { icon: 'generate', label: '生成升学建议' },
  s6: { icon: 'policy',   label: '交叉验证数据源' },
  s7: { icon: 'generate', label: '生成扩展分析' },
}

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * 把后端 SSE `sources` 帧里的 ChatSource 适配成前端 KnowledgeSource 形状。
 *
 * 后端字段（精简）：{school_name, major_name?, content_snippet}
 * 前端 SourceCard 需要：{id, type, title, source, relevance, schoolName?, excerpt?, year?}
 * 缺失字段在前端这边合成（type 默认"专业信息"，title 用「学校 · 专业」拼出）。
 */
function normalizeSources(rawList: any[]): KnowledgeSource[] {
  return (rawList ?? []).map((s: any, i: number) => {
    const rawSchool: string = s.schoolName ?? s.school_name ?? ''
    const rawMajor: string = s.majorName ?? s.major_name ?? ''
    const excerpt: string = s.excerpt ?? s.content_snippet ?? s.content ?? ''
    // 后端 chunk 元数据缺 school_name 时默认 "未知学校" —— 识别后改为不显示徽章
    const schoolName = rawSchool && rawSchool !== '未知学校' ? rawSchool : undefined
    const majorName = rawMajor && rawMajor !== '未知专业' ? rawMajor : undefined

    // 标题策略：优先「学校 · 专业」；缺学校时从 excerpt 头部截一段当摘要标题
    const excerptHead = excerpt.replace(/\s+/g, ' ').slice(0, 32).trim()
    let title: string
    if (schoolName && majorName) title = `${schoolName} · ${majorName}`
    else if (schoolName) title = schoolName
    else if (majorName) title = majorName
    else if (excerptHead) title = excerptHead + (excerpt.length > 32 ? '…' : '')
    else title = '知识库片段'

    // 命中关联文案
    let relevance: string
    if (schoolName && majorName) relevance = `${schoolName}「${majorName}」相关政策片段`
    else if (schoolName) relevance = `${schoolName} 相关知识库片段`
    else relevance = '相关政策 / 培养方案片段'

    return {
      id: s.id ?? `src_${rawSchool}_${rawMajor}_${i}`,
      // 后端没有 type 元数据，统一标"专业信息"——视觉徽章不丢
      type: (s.type as KnowledgeSource['type']) ?? '专业信息',
      title,
      source: s.source ?? 'RAG 向量库 · 学院/专业政策切片',
      relevance,
      schoolName,
      year: s.year,
      excerpt: excerpt || undefined,
    }
  })
}

function normalizeStep(payload: any): AgentStep {
  const id = String(payload?.id ?? '')
  const meta = STEP_META[id] ?? { icon: 'generate' as AgentStepIcon, label: '处理中' }
  return {
    id,
    icon: (payload?.icon as AgentStepIcon) ?? meta.icon,
    label: payload?.label ?? meta.label,
    status: payload?.status ?? 'running',
    detail: payload?.detail,
    cached: payload?.cached ?? false,
  }
}

/**
 * 与 Agent 对话（真实 SSE 流式）。
 */
export function chatWithAgent(
  request: AgentChatRequest,
  callbacks: AgentStreamCallbacks = {},
): StreamControl {
  const controller = new AbortController()
  let cancelled = false

  void (async () => {
    const recId = request.recommendationId
    if (!recId) {
      callbacks.onError?.(new Error('还没有推荐结果，请先在首页填写信息生成志愿推荐后再咨询'))
      return
    }

    try {
      const token = getStoredToken()
      const res = await fetch(`${API_BASE_URL}/v1/recommendations/${recId}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: request.message }),
        signal: controller.signal,
      })

      if (res.status === 401) {
        // token 失效：与 http.ts 同步登出逻辑（agentApi 用原生 fetch，不走 axios 拦截器）
        try { localStorage.removeItem(AUTH_STORAGE_KEY) } catch { /* ignore */ }
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.replace('/login')
        }
        throw new Error('登录已过期，请重新登录')
      }

      if (!res.ok || !res.body) {
        let msg = `咨询请求失败 (${res.status})`
        try {
          const j = await res.json()
          msg = j.detail ?? j.message ?? msg
        } catch {
          /* 忽略解析失败 */
        }
        throw new Error(msg)
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      const steps: AgentStep[] = []
      let sources: KnowledgeSource[] = []
      let recommendations: SchoolRecommendation[] = []
      let nextActions: string[] = []
      let answer = ''
      let allStepsDoneFired = false
      let doneFired = false

      const fireAllStepsDone = () => {
        if (allStepsDoneFired) return
        allStepsDoneFired = true
        callbacks.onAllStepsDone?.({
          answer: '',
          agentSteps: [...steps],
          recommendations,
          sources,
          nextActions,
        })
      }

      const finish = () => {
        if (doneFired) return
        doneFired = true
        fireAllStepsDone()
        callbacks.onDone?.({
          answer,
          agentSteps: [...steps],
          recommendations,
          sources,
          nextActions,
        })
      }

      const handleEvent = (evt: any) => {
        const type = evt?.type
        // 后端实际可能用 evt.payload 包裹，也可能直接在顶层（evt.step / evt.token / evt.sources ...）
        const payload = evt?.payload ?? {}
        switch (type) {
          case 'step': {
            // 后端实际：{type:'step', index, step:{id,icon,status,label,detail}}
            // 备用：{type:'step', payload:{...}}
            const stepData = evt.step ?? payload
            const step = normalizeStep(stepData)
            const idx = steps.findIndex(s => s.id === step.id)
            if (idx >= 0) {
              steps[idx] = step
              callbacks.onStep?.(step, idx)
            } else {
              steps.push(step)
              callbacks.onStep?.(step, steps.length - 1)
            }
            break
          }
          case 'sources': {
            const raw = evt.sources ?? payload.sources ?? payload
            sources = normalizeSources(Array.isArray(raw) ? raw : [])
            break
          }
          case 'recommendations':
            recommendations = (evt.recommendations ?? payload.recommendations ?? payload) as SchoolRecommendation[]
            break
          case 'token': {
            fireAllStepsDone()
            // 后端实际：{type:'token', token:"..."}
            // 备用：{type:'token', payload:{delta|content|text}}
            const delta = evt.token ?? payload.delta ?? payload.content ?? payload.text ?? ''
            answer += delta
            callbacks.onToken?.(delta, answer)
            break
          }
          case 'next_actions':
            nextActions = (evt.next_actions ?? evt.nextActions ?? payload.nextActions ?? payload.next_actions ?? payload) as string[]
            break
          case 'done':
            finish()
            break
          case 'error':
            throw new Error(evt.message ?? payload?.message ?? payload?.detail ?? '服务端返回错误')
        }
      }

      while (!cancelled) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''
        for (const part of parts) {
          const dataLine = part.split('\n').find(l => l.startsWith('data:'))
          if (!dataLine) continue
          const jsonStr = dataLine.slice(5).trim()
          if (!jsonStr) continue
          let evt: any
          try {
            evt = JSON.parse(jsonStr)
          } catch {
            continue
          }
          handleEvent(evt)
          if (doneFired) break
        }
        if (doneFired) break
      }

      // 流自然结束但未收到 done 帧：用已累积内容兜底收尾
      if (!cancelled) finish()
    } catch (err) {
      if (!cancelled) callbacks.onError?.(err as Error)
    }
  })()

  return {
    cancel: () => {
      cancelled = true
      controller.abort()
    },
  }
}
