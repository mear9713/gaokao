/**
 * AI Agent 接口适配层
 *
 * 📖 完整接口规范见：docs/API_AGENT_CHAT.md
 *    （后端对接请优先阅读该文档）
 *
 * 当前为 Mock 实现，模拟流式 Agent 行为。
 * 真实后端就绪时，只需把 `chatWithAgent` 内部的 Mock 调用替换为真实 fetch / SSE 即可。
 *
 * 接口契约要点：
 *   - 端点：POST /api/agent/chat
 *   - 响应：text/event-stream (SSE)
 *   - 帧格式：data: <JSON>\n\n
 *   - 推送顺序：5 个 step → sources → recommendations → token (多次) → next_actions → done
 *
 * ╔════════════════════════════════════════════════════════════════╗
 * ║  接入真实后端示例（POST /api/agent/chat with SSE）              ║
 * ╠════════════════════════════════════════════════════════════════╣
 * ║                                                                ║
 * ║  export async function chatWithAgent(req, callbacks) {         ║
 * ║    const res = await fetch('/api/agent/chat', {                ║
 * ║      method: 'POST',                                           ║
 * ║      headers: { 'Content-Type': 'application/json' },          ║
 * ║      body: JSON.stringify(req),                                ║
 * ║    })                                                          ║
 * ║    const reader = res.body.getReader()                         ║
 * ║    const decoder = new TextDecoder()                           ║
 * ║    while (true) {                                              ║
 * ║      const { done, value } = await reader.read()               ║
 * ║      if (done) break                                           ║
 * ║      const chunk = decoder.decode(value)                       ║
 * ║      // 解析 SSE 帧：data: {"type":"step"|"token"|"done", ...} ║
 * ║      // 分发到 callbacks.onStep / onToken / onDone             ║
 * ║    }                                                           ║
 * ║  }                                                             ║
 * ║                                                                ║
 * ╚════════════════════════════════════════════════════════════════╝
 */

import type {
  AgentChatRequest,
  AgentResponse,
  AgentStep,
} from '@/types'
import { generateAgentResponse } from '@/data/mockData'

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

/** 普通步骤动画时长（毫秒）—— 调高到 850ms 让 Agent 显得更从容 */
const STEP_DURATION_MS = 850
/** 缓存复用步骤动画时长 */
const STEP_DURATION_CACHED_MS = 220
/** 步骤之间的缓冲（让用户能看清每步切换） */
const STEP_GAP_MS = 120
/** 最后一个步骤完成 → 开始流式 token 之前的停顿（让用户看完最后一步） */
const PRE_STREAM_PAUSE_MS = 320
/** 流式输出每帧字符数 */
const STREAM_CHARS_PER_TICK_LONG = 5
const STREAM_CHARS_PER_TICK_SHORT = 3
const STREAM_TICK_MS = 22

/**
 * 与 Agent 对话（流式）
 *
 * @param request   请求参数（学生画像 + 消息 + 历史）
 * @param callbacks 流式回调
 * @returns         可取消的控制器
 */
export function chatWithAgent(
  request: AgentChatRequest,
  callbacks: AgentStreamCallbacks = {},
): StreamControl {
  let cancelled = false
  const timers: ReturnType<typeof setTimeout>[] = []
  let streamInterval: ReturnType<typeof setInterval> | null = null

  const addTimer = (fn: () => void, delay: number) => {
    const t = setTimeout(() => {
      if (!cancelled) fn()
    }, delay)
    timers.push(t)
  }

  try {
    // 1. 生成完整响应（传入 history + mode，让 Agent 感知上下文与推理深度）
    const fullResponse = generateAgentResponse(
      request.message,
      request.studentInfo,
      request.history,
      request.mode ?? 'quick',
    )

    // 2. 推进 Agent 步骤动画（每步之间留 STEP_GAP_MS 缓冲让用户能看清切换）
    let cumulativeTime = 0
    fullResponse.agentSteps.forEach((step, i) => {
      const duration = step.cached ? STEP_DURATION_CACHED_MS : STEP_DURATION_MS
      const stepStart = cumulativeTime

      // running
      addTimer(() => {
        callbacks.onStep?.({ ...step, status: 'running' }, i)
      }, stepStart)

      // done
      addTimer(() => {
        callbacks.onStep?.({ ...step, status: 'done' }, i)
      }, stepStart + duration - 60)

      // 累加 = 本步时长 + 缓冲（最后一步不加缓冲，由 PRE_STREAM_PAUSE_MS 替代）
      cumulativeTime += duration + (i < fullResponse.agentSteps.length - 1 ? STEP_GAP_MS : 0)
    })

    // 3. 所有步骤完成后停顿 PRE_STREAM_PAUSE_MS 再开始流式输出（让用户看完最后一步）
    const allStepsTime = cumulativeTime + PRE_STREAM_PAUSE_MS
    addTimer(() => {
      callbacks.onAllStepsDone?.(fullResponse)

      const text = fullResponse.answer
      const charsPerTick =
        text.length > 400 ? STREAM_CHARS_PER_TICK_LONG : STREAM_CHARS_PER_TICK_SHORT
      let idx = 0
      let accumulator = ''

      streamInterval = setInterval(() => {
        if (cancelled) {
          if (streamInterval) clearInterval(streamInterval)
          return
        }
        if (idx >= text.length) {
          if (streamInterval) clearInterval(streamInterval)
          addTimer(() => callbacks.onDone?.(fullResponse), 200)
          return
        }
        const chunk = text.slice(idx, idx + charsPerTick)
        accumulator += chunk
        callbacks.onToken?.(chunk, accumulator)
        idx += charsPerTick
      }, STREAM_TICK_MS)
    }, allStepsTime)
  } catch (err) {
    callbacks.onError?.(err as Error)
  }

  return {
    cancel: () => {
      cancelled = true
      timers.forEach(clearTimeout)
      if (streamInterval) clearInterval(streamInterval)
    },
  }
}
