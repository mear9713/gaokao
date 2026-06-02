import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Send, Bot, User, FileText, GraduationCap,
  UserCircle2, ClipboardList, ShieldCheck, Target, Sparkles,
  Loader2, CheckCircle2, ChevronRight, Library, MapPin,
  TrendingUp, Award, ArrowRight, BookOpen, BarChart3,
  History, Plus, ChevronDown, ChevronUp, Zap,
  Brain, X, Microscope,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAppContext } from '@/hooks/useAppContext'
import {
  mockStudentInfo,
  mockQuickQuestions,
  mockRecommendations,
  initialChatMessages,
} from '@/data/mockData'
import { chatWithAgent } from '@/services/agentApi'
import type {
  ChatMessage, KnowledgeSource, AgentStep,
  SchoolRecommendation, AgentResponse, RecommendCategory,
  AdmissionRisk, KnowledgeSourceType, AgentMode,
} from '@/types'

// ─── 类型 ──────────────────────────────────────────────────
type ChatPhase = 'idle' | 'agent-running' | 'streaming'

// ─── 配色/图标映射 ────────────────────────────────────────
const STEP_ICON_MAP = {
  profile:  UserCircle2,
  plan:     ClipboardList,
  policy:   ShieldCheck,
  match:    Target,
  generate: Sparkles,
}

const SOURCE_TYPE_COLOR: Record<KnowledgeSourceType, string> = {
  '招生数据':   'bg-blue-50 text-blue-700 border-blue-200',
  '录取数据':   'bg-indigo-50 text-indigo-700 border-indigo-200',
  '保研政策':   'bg-purple-50 text-purple-700 border-purple-200',
  '专业信息':   'bg-emerald-50 text-emerald-700 border-emerald-200',
  '培养方案':   'bg-teal-50 text-teal-700 border-teal-200',
  '奖学金政策': 'bg-amber-50 text-amber-700 border-amber-200',
  '转专业政策': 'bg-orange-50 text-orange-700 border-orange-200',
  '院校官网':   'bg-slate-50 text-slate-700 border-slate-200',
}

const CATEGORY_COLOR: Record<RecommendCategory, string> = {
  '冲刺': 'bg-red-100 text-red-700 border-red-200',
  '稳妥': 'bg-green-100 text-green-700 border-green-200',
  '保底': 'bg-blue-100 text-blue-700 border-blue-200',
}

const RISK_COLOR: Record<AdmissionRisk, string> = {
  '高': 'text-red-600',
  '中': 'text-amber-600',
  '低': 'text-green-600',
}

// ─── 子组件 ────────────────────────────────────────────────

/** Agent 执行步骤面板（核心 Agent 感） */
function AgentStepsPanel({ steps }: { steps: AgentStep[] }) {
  const cachedCount = steps.filter(s => s.cached).length
  const newCount = steps.length - cachedCount

  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
        <AvatarFallback className="bg-gradient-to-br from-violet-100 to-purple-100">
          <Sparkles className="h-4 w-4 text-purple-600" />
        </AvatarFallback>
      </Avatar>
      <div className="bg-gradient-to-br from-slate-50 to-purple-50/30 border border-purple-100 rounded-2xl rounded-tl-sm px-4 py-3 space-y-2 min-w-[320px] max-w-[520px]">
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          <Sparkles className="h-3.5 w-3.5 text-purple-600" />
          <span className="text-xs font-semibold text-purple-900">AI Agent 执行链</span>
          <div className="ml-auto flex items-center gap-1">
            {cachedCount > 0 && (
              <Badge className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200 border gap-0.5">
                <Zap className="h-2.5 w-2.5" />
                复用 {cachedCount}
              </Badge>
            )}
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-purple-200 text-purple-700">
              新执行 {newCount}
            </Badge>
          </div>
        </div>
        {steps.map(step => {
          const Icon = STEP_ICON_MAP[step.icon]
          const isRunning = step.status === 'running'
          const isDone    = step.status === 'done'
          const isCached  = step.cached === true
          return (
            <div key={step.id} className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                {isRunning ? (
                  isCached
                    ? <Zap className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                    : <Loader2 className="h-3.5 w-3.5 text-purple-600 animate-spin flex-shrink-0" />
                ) : isDone ? (
                  isCached
                    ? <Zap className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                    : <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                ) : (
                  <Icon className="h-3.5 w-3.5 text-muted-foreground/40 flex-shrink-0" />
                )}
                <span className={
                  isRunning && !isCached ? 'text-purple-700 font-medium' :
                  isDone && isCached     ? 'text-emerald-700' :
                  isDone                 ? 'text-foreground font-medium' :
                  'text-muted-foreground/50'
                }>
                  {step.label}
                </span>
                {isCached && (isRunning || isDone) && (
                  <Badge className="text-[9px] px-1 py-0 bg-emerald-50 text-emerald-700 border border-emerald-200">
                    缓存
                  </Badge>
                )}
              </div>
              {(isRunning || isDone) && step.detail && (
                <p className="text-[11px] text-muted-foreground leading-relaxed pl-[22px]">
                  ↳ {step.detail}
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/** 流式打字气泡 */
function StreamingBubble({ content, isDone }: { content: string; isDone: boolean }) {
  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
        <AvatarFallback className="bg-muted">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="max-w-[80%] flex flex-col gap-1">
        <div className="rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed bg-muted text-foreground whitespace-pre-line">
          {content}
          {!isDone && (
            <span className="inline-block w-[2px] h-[1em] bg-primary ml-0.5 align-text-bottom animate-pulse" />
          )}
        </div>
      </div>
    </div>
  )
}

/** 推荐院校卡片（在回答下方展示） */
function RecommendationCard({ rec, onClick }: { rec: SchoolRecommendation; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-background border rounded-xl p-3 hover:border-primary/40 hover:shadow-sm transition-all space-y-2"
    >
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="font-semibold text-sm truncate">{rec.schoolName}</span>
            <Badge className={`${CATEGORY_COLOR[rec.category]} text-[10px] px-1.5 py-0`}>
              {rec.category}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {rec.city} · {rec.schoolLevel}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-lg font-bold text-primary leading-none">{rec.matchScore}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">匹配度</div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <BookOpen className="h-3 w-3" />
        <span>{rec.recommendedMajor}</span>
        <span className="mx-0.5">·</span>
        <span>录取风险：<span className={`font-medium ${RISK_COLOR[rec.admissionRisk]}`}>{rec.admissionRisk}</span></span>
      </div>

      <div className="flex items-start gap-1.5 text-xs">
        <Award className="h-3 w-3 text-purple-500 flex-shrink-0 mt-0.5" />
        <span className="text-muted-foreground leading-relaxed">{rec.postgradAdvantage}</span>
      </div>

      <div className="flex items-start gap-1.5 text-xs pt-1 border-t">
        <Sparkles className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />
        <span className="text-foreground leading-relaxed line-clamp-2">{rec.reason}</span>
      </div>
    </button>
  )
}

/** 完整 AI 消息（含答案 + 推荐卡片 + 下一步） */
function AssistantMessage({
  msg,
  isLatest,
  onCardClick,
  onActionClick,
}: {
  msg: ChatMessage
  /** 是否是最新一条（最新一条默认展开卡片，旧消息默认折叠以节省空间） */
  isLatest: boolean
  onCardClick: (id: string) => void
  onActionClick: (action: string) => void
}) {
  const hasCards = (msg.agentData?.recommendations?.length ?? 0) > 0
  const hasActions = (msg.agentData?.nextActions?.length ?? 0) > 0
  const hasExtras = hasCards || hasActions

  // 推荐卡片默认折叠（不论新旧），避免每次对话都把卡片砸到用户脸上；按需展开
  const [expanded, setExpanded] = useState(false)
  void isLatest

  return (
    <div className="flex gap-3" data-message-id={msg.id}>
      <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
        <AvatarFallback className="bg-muted">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="max-w-[90%] flex flex-col gap-2.5 flex-1">
        {/* 文字气泡 */}
        <div className="rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed bg-muted text-foreground whitespace-pre-line">
          {msg.content}
        </div>

        {/* 折叠开关 —— 所有带推荐/建议的消息都显示 */}
        {hasExtras && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="self-start text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded hover:bg-muted/50 transition-colors"
          >
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {expanded
              ? '收起'
              : `展开 ${msg.agentData?.recommendations?.length ?? 0} 张推荐卡片 + ${msg.agentData?.nextActions?.length ?? 0} 个建议`}
          </button>
        )}

        {/* 推荐院校 + 下一步（仅展开时显示） */}
        {expanded && (
          <>
            {hasCards && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium">为你匹配的院校（{msg.agentData!.recommendations!.length}）</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                  {msg.agentData!.recommendations!.map(rec => (
                    <RecommendationCard
                      key={rec.id}
                      rec={rec}
                      onClick={() => onCardClick(rec.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {hasActions && (
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <ArrowRight className="h-3.5 w-3.5 text-primary" />
                  <span className="font-medium">建议下一步</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {msg.agentData!.nextActions!.map((action, i) => (
                    <button
                      key={i}
                      onClick={() => onActionClick(action)}
                      className="text-xs bg-primary/5 hover:bg-primary/10 border border-primary/20 text-primary px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
                    >
                      {action}
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        <span className="text-xs text-muted-foreground px-1">
          {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}

/** 历史快速跳转条 —— 把所有用户提问做成可点击的小芯片 */
function HistoryQuickBar({
  messages,
  onJump,
  onClear,
}: {
  messages: ChatMessage[]
  onJump: (msgId: string) => void
  onClear: () => void
}) {
  const userMessages = messages.filter(m => m.role === 'user')
  if (userMessages.length === 0) return null

  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/20 overflow-hidden">
      <History className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      <span className="text-[11px] text-muted-foreground flex-shrink-0">
        已对话 {userMessages.length} 轮
      </span>
      <div className="flex-1 flex gap-1.5 overflow-x-auto scrollbar-hide">
        {userMessages.map((m, i) => (
          <button
            key={m.id}
            onClick={() => onJump(m.id)}
            className="flex-shrink-0 text-[11px] bg-background border rounded-full px-2 py-0.5 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-colors text-muted-foreground"
            title={m.content}
          >
            Q{i + 1}: {m.content.length > 12 ? m.content.slice(0, 12) + '…' : m.content}
          </button>
        ))}
      </div>
      <button
        onClick={onClear}
        className="flex-shrink-0 text-[11px] flex items-center gap-1 text-muted-foreground hover:text-foreground border rounded-full px-2 py-0.5 hover:bg-muted transition-colors"
        title="清空对话，开启新会话"
      >
        <Plus className="h-3 w-3" />
        新对话
      </button>
    </div>
  )
}

/** 用户消息 */
function UserMessage({ msg }: { msg: ChatMessage }) {
  return (
    <div className="flex gap-3 flex-row-reverse" data-message-id={msg.id}>
      <Avatar className="h-8 w-8 flex-shrink-0 mt-0.5">
        <AvatarFallback className="bg-primary text-primary-foreground">
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="max-w-[80%] items-end flex flex-col gap-1">
        <div className="rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm leading-relaxed whitespace-pre-line bg-primary text-primary-foreground">
          {msg.content}
        </div>
        <span className="text-xs text-muted-foreground px-1">
          {new Date(msg.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  )
}

/** RAG 知识源卡片（可点击展开/收起原文片段） */
function SourceCard({ src, active }: { src: KnowledgeSource; active: boolean }) {
  // 命中的源默认展开，其它默认折叠；用户可手动 toggle
  const [expanded, setExpanded] = useState(active)
  const hasExcerpt = !!src.excerpt

  return (
    <div className={`rounded-lg border transition-all ${
      active ? 'border-primary/40 bg-primary/5 shadow-sm' : 'border-border hover:border-foreground/20'
    }`}>
      <button
        onClick={() => hasExcerpt && setExpanded(e => !e)}
        className={`w-full text-left p-2.5 space-y-1.5 ${hasExcerpt ? 'cursor-pointer' : 'cursor-default'}`}
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge className={`${SOURCE_TYPE_COLOR[src.type]} text-[10px] px-1.5 py-0 border`}>
            {src.type}
          </Badge>
          {src.year && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {src.year}
            </Badge>
          )}
          {src.schoolName && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
              {src.schoolName}
            </Badge>
          )}
          {hasExcerpt && (
            <ChevronDown className={`h-3 w-3 ml-auto text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
          )}
        </div>
        <div className="flex items-start gap-1.5">
          <FileText className={`h-3 w-3 flex-shrink-0 mt-0.5 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
          <p className="text-xs font-medium leading-tight">{src.title}</p>
        </div>
        <p className="text-[11px] text-muted-foreground pl-4">{src.source}</p>
      </button>

      {expanded && hasExcerpt && (
        <div className="border-t border-border/40 px-2.5 py-2 bg-muted/30 animate-fade-in-up">
          <p className="text-[11px] text-foreground/70 italic border-l-2 border-primary/30 pl-2">
            "{src.excerpt}"
          </p>
          <p className="text-[10px] text-muted-foreground/70 mt-1.5">
            💡 命中关联：{src.relevance}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── AI 记忆浮窗（只记录对话中累积的有价值信息，不重复学生画像）─────
function ContextMemoryButton({
  messages,
}: {
  messages: ChatMessage[]
}) {
  const [open, setOpen] = useState(false)
  const memory = extractMemory(messages)
  const hasMemory =
    memory.userEmphases.length > 0 ||
    memory.mentionedSchools.length > 0 ||
    memory.recentTopics.length > 0 ||
    memory.userTurns > 0

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`relative inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
          open
            ? 'bg-purple-100 text-purple-700 border border-purple-200'
            : 'bg-purple-50 text-purple-600 border border-purple-100 hover:bg-purple-100'
        }`}
        title="AI 在对话中积累的记忆"
      >
        <Brain className="h-3.5 w-3.5" />
        AI 记忆
        {hasMemory && (
          <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-purple-500" />
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-background border border-border rounded-2xl shadow-xl z-50 animate-fade-in-up overflow-hidden">
            <div className="px-4 py-3 border-b bg-gradient-to-r from-purple-50 to-fuchsia-50/50">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-600" />
                <span className="font-semibold text-sm">AI 对话记忆</span>
                <button
                  onClick={() => setOpen(false)}
                  className="ml-auto text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                Agent 从对话中自动累积的偏好与上下文，对话越多记忆越准
              </p>
            </div>

            <div className="p-4 space-y-4 text-xs max-h-[60vh] overflow-y-auto">

              {/* 对话中强调过的 */}
              {memory.userEmphases.length > 0 ? (
                <MemorySection icon="📌" title="对话中你强调过">
                  <div className="space-y-1.5">
                    {memory.userEmphases.map(item => (
                      <div key={item.kw} className="flex items-start gap-2">
                        <span className="text-purple-500 mt-0.5">·</span>
                        <span className="text-foreground/80 flex-1">
                          {item.label}
                          {item.count > 1 && (
                            <span className="text-[10px] text-muted-foreground ml-1">（{item.count} 次提及）</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </MemorySection>
              ) : null}

              {/* 提及过的院校 */}
              {memory.mentionedSchools.length > 0 && (
                <MemorySection icon="🏫" title="你提及过的院校">
                  <div className="flex flex-wrap gap-1.5">
                    {memory.mentionedSchools.map(s => (
                      <span key={s.name} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {s.name}
                        {s.count > 1 && (
                          <span className="text-[9px] opacity-70">×{s.count}</span>
                        )}
                      </span>
                    ))}
                  </div>
                </MemorySection>
              )}

              {/* 最近关注的话题 */}
              {memory.recentTopics.length > 0 && (
                <MemorySection icon="🔍" title="最近关注的话题">
                  <div className="flex flex-wrap gap-1.5">
                    {memory.recentTopics.map(t => (
                      <span key={t} className="text-[11px] px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
                        {t}
                      </span>
                    ))}
                  </div>
                </MemorySection>
              )}

              {/* 会话统计 */}
              <MemorySection icon="📊" title="会话状态">
                <div className="space-y-1 text-foreground/80">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">对话轮数</span>
                    <span className="font-medium tabular-nums">{memory.userTurns} 轮</span>
                  </div>
                  {memory.firstMessageAt && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">首次提问</span>
                      <span className="font-medium">{formatRelativeTime(memory.firstMessageAt)}</span>
                    </div>
                  )}
                  {memory.lastMessageAt && memory.userTurns > 1 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">最近提问</span>
                      <span className="font-medium">{formatRelativeTime(memory.lastMessageAt)}</span>
                    </div>
                  )}
                </div>
              </MemorySection>

              {!hasMemory && (
                <div className="text-center py-6 text-muted-foreground">
                  <Brain className="h-8 w-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">还没有记忆</p>
                  <p className="text-[10px] mt-1">开始对话后，Agent 会自动累积你的偏好</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function MemorySection({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold text-foreground/80 mb-2 flex items-center gap-1.5">
        <span>{icon}</span>
        {title}
      </p>
      <div className="pl-1">{children}</div>
    </div>
  )
}

// ─── 记忆提取算法 ─────────────────────────────────────────
interface ExtractedMemory {
  userEmphases: { kw: string; label: string; count: number }[]
  mentionedSchools: { name: string; count: number }[]
  recentTopics: string[]
  userTurns: number
  firstMessageAt: number | null
  lastMessageAt: number | null
}

function extractMemory(messages: ChatMessage[]): ExtractedMemory {
  const userMsgs = messages.filter(m => m.role === 'user')
  const allText = userMsgs.map(m => m.content).join('\n')

  // 1. 强调过的偏好（关键词 + 解读文案）
  const emphasisRules: { kw: string; label: string }[] = [
    { kw: '保研',   label: '重视保研路径' },
    { kw: '推免',   label: '关注推免机会' },
    { kw: '直博',   label: '考虑直博深造' },
    { kw: '985',    label: '偏好 985 院校' },
    { kw: '211',    label: '认可 211 院校' },
    { kw: '强基',   label: '关注强基计划' },
    { kw: '英才班', label: '关注实验班 / 英才班' },
    { kw: '冲刺',   label: '愿意接受冲刺' },
    { kw: '稳妥',   label: '偏好稳妥方案' },
    { kw: '保底',   label: '强调保底' },
    { kw: '就业',   label: '看重就业去向' },
    { kw: '考研',   label: '关注考研路径' },
    { kw: '出国',   label: '考虑出国留学' },
    { kw: '本省',   label: '偏好本省院校' },
    { kw: '南方',   label: '倾向南方城市' },
    { kw: '北方',   label: '倾向北方城市' },
  ]
  const userEmphases = emphasisRules
    .map(r => ({
      kw: r.kw,
      label: r.label,
      count: (allText.match(new RegExp(r.kw, 'g')) || []).length,
    }))
    .filter(e => e.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // 2. 提到过的院校（用 mockRecommendations 院校名匹配）
  const schoolCounter = new Map<string, number>()
  mockRecommendations.forEach(rec => {
    // 全名匹配
    const fullCount = (allText.match(new RegExp(rec.schoolName, 'g')) || []).length
    // 简称匹配（取前 4 字）
    const shortName = rec.schoolName.replace(/大学|学院/, '')
    const shortCount = shortName.length >= 2
      ? (allText.match(new RegExp(shortName, 'g')) || []).length - fullCount
      : 0
    const total = fullCount + Math.max(0, shortCount)
    if (total > 0) schoolCounter.set(rec.schoolName, total)
  })
  const mentionedSchools = Array.from(schoolCounter.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }))

  // 3. 最近关注话题
  const topicRules: Record<string, string> = {
    '保研|推免': '保研政策',
    '分数|位次|录取': '录取概率',
    '城市|地方|哪里': '地理位置',
    '专业|计算机|电子|自动化': '专业方向',
    '风险|把握|概率': '风险评估',
    '就业|薪资|工作': '就业方向',
    '对比|比较|vs': '院校对比',
  }
  const recentTopics: string[] = []
  userMsgs.slice(-5).forEach(m => {
    Object.entries(topicRules).forEach(([pattern, topic]) => {
      if (new RegExp(pattern).test(m.content) && !recentTopics.includes(topic)) {
        recentTopics.push(topic)
      }
    })
  })

  return {
    userEmphases,
    mentionedSchools,
    recentTopics: recentTopics.slice(0, 5),
    userTurns: userMsgs.length,
    firstMessageAt: userMsgs[0]?.timestamp ?? null,
    lastMessageAt: userMsgs[userMsgs.length - 1]?.timestamp ?? null,
  }
}

// ─── 相对时间格式化 ───────────────────────────────────────
function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)
  if (days > 0) return `${days} 天前`
  if (hours > 0) return `${hours} 小时前`
  if (minutes > 0) return `${minutes} 分钟前`
  return '刚刚'
}

// ─── 模式切换器 ─────────────────────────────────────────
function ModeSwitch({
  mode, onChange, disabled,
}: {
  mode: AgentMode
  onChange: (m: AgentMode) => void
  disabled?: boolean
}) {
  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 rounded-full bg-muted border">
      <button
        onClick={() => onChange('quick')}
        disabled={disabled}
        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 disabled:opacity-50 ${
          mode === 'quick'
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="快速回答：5 步 Agent + 3 source"
      >
        <Zap className="h-3 w-3" />
        快速
      </button>
      <button
        onClick={() => onChange('deep')}
        disabled={disabled}
        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all flex items-center gap-1 disabled:opacity-50 ${
          mode === 'deep'
            ? 'bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white shadow-sm'
            : 'text-muted-foreground hover:text-foreground'
        }`}
        title="深度分析：7 步 Agent + 5 source + 扩展段"
      >
        <Microscope className="h-3 w-3" />
        深度
      </button>
    </div>
  )
}

// ─── localStorage 持久化 ──────────────────────────────────
const MESSAGES_STORAGE_KEY = 'gaokao_chat_messages'

function loadMessagesFromStorage(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(MESSAGES_STORAGE_KEY)
    if (!raw) return initialChatMessages
    const parsed = JSON.parse(raw) as ChatMessage[]
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
    return initialChatMessages
  } catch {
    return initialChatMessages
  }
}

function saveMessagesToStorage(messages: ChatMessage[]) {
  try {
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages))
  } catch {
    // 忽略存储错误（如配额满）
  }
}

// ─── 主组件 ────────────────────────────────────────────────

export default function ChatPage() {
  const navigate = useNavigate()
  const { studentInfo, recommendationId } = useAppContext()
  const info = studentInfo ?? mockStudentInfo

  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessagesFromStorage())
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<AgentMode>('quick')
  const [phase, setPhase] = useState<ChatPhase>('idle')
  const [activeSteps, setActiveSteps] = useState<AgentStep[]>([])
  const [streamingContent, setStreamingContent] = useState('')
  const [isStreamingDone, setIsStreamingDone] = useState(false)
  const [lastSources, setLastSources] = useState<KnowledgeSource[]>([])
  const [lastRecommendations, setLastRecommendations] = useState<SchoolRecommendation[]>([])
  const [activeSourceIds, setActiveSourceIds] = useState<Set<string>>(new Set())

  const bottomRef = useRef<HTMLDivElement>(null)
  const phaseRef  = useRef<ChatPhase>('idle')
  const streamCtrlRef = useRef<{ cancel: () => void } | null>(null)

  useEffect(() => { phaseRef.current = phase }, [phase])
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, activeSteps, streamingContent])
  useEffect(() => {
    return () => { streamCtrlRef.current?.cancel() }
  }, [])

  // 持久化消息（每次变化都写入 localStorage）
  useEffect(() => {
    saveMessagesToStorage(messages)
  }, [messages])

  // 历史跳转：滚动到指定 message id
  const handleJumpToMessage = useCallback((msgId: string) => {
    const el = document.querySelector(`[data-message-id="${msgId}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-2', 'ring-primary/40', 'rounded-2xl')
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-primary/40', 'rounded-2xl')
      }, 1500)
    }
  }, [])

  // 新对话：清空消息 + 清空缓存上下文
  const handleClearConversation = useCallback(() => {
    if (phaseRef.current !== 'idle') return
    setMessages(initialChatMessages)
    setLastSources([])
    setLastRecommendations([])
    setActiveSourceIds(new Set())
    localStorage.removeItem(MESSAGES_STORAGE_KEY)
  }, [])

  const sendMessage = useCallback((text: string) => {
    if (!text.trim() || phaseRef.current !== 'idle') return

    // 1. 用户消息入栈
    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
    }
    setMessages(prev => [...prev, userMsg])
    setInput('')

    // 2. 进入 Agent 运行阶段
    setPhase('agent-running')
    phaseRef.current = 'agent-running'
    setActiveSteps([])

    // 3. 收集流式响应
    let collectedResponse: AgentResponse | null = null

    streamCtrlRef.current = chatWithAgent(
      { message: text, studentInfo: info, history: messages, mode, recommendationId },
      {
        onStep: (step, index) => {
          setActiveSteps(prev => {
            const next = [...prev]
            // 推进或更新对应步骤
            while (next.length <= index) {
              next.push({ ...step, status: 'pending' })
            }
            next[index] = step
            // 把之前的步骤标记为 done
            for (let i = 0; i < index; i++) {
              next[i] = { ...next[i], status: 'done' }
            }
            return next
          })
        },
        onAllStepsDone: (response) => {
          collectedResponse = response
          setPhase('streaming')
          phaseRef.current = 'streaming'
          setStreamingContent('')
          setIsStreamingDone(false)
          setActiveSteps([])
          setLastSources(response.sources)
          setLastRecommendations(response.recommendations)
          setActiveSourceIds(new Set(response.sources.map(s => s.id)))
        },
        onToken: (_chunk, fullSoFar) => {
          setStreamingContent(fullSoFar)
        },
        onDone: (response) => {
          setIsStreamingDone(true)
          // 把流式内容固化为正式消息（带 agentData）
          setTimeout(() => {
            const aiMsg: ChatMessage = {
              id: `msg_${Date.now()}`,
              role: 'assistant',
              content: response.answer,
              timestamp: Date.now(),
              agentData: {
                recommendations: response.recommendations,
                sources: response.sources,
                nextActions: response.nextActions,
              },
            }
            setMessages(prev => [...prev, aiMsg])
            setPhase('idle')
            phaseRef.current = 'idle'
            setStreamingContent('')
          }, 300)
        },
        onError: (err) => {
          console.error('[Agent] Error:', err)
          const errMsg: ChatMessage = {
            id: `msg_${Date.now()}`,
            role: 'assistant',
            content: `⚠️ ${err.message || '咨询失败，请稍后重试'}`,
            timestamp: Date.now(),
          }
          setMessages(prev => [...prev, errMsg])
          setPhase('idle')
          phaseRef.current = 'idle'
          setActiveSteps([])
        },
      },
    )

    // 立即更新一次知识源面板（不等流式完成）
    if (collectedResponse) {
      // 占位（实际由 onAllStepsDone 触发）
    }
  }, [info, messages, mode])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  function handleCardClick(id: string) {
    navigate(`/detail/${id}`)
  }

  function handleActionClick(action: string) {
    if (action.includes('对比')) navigate('/compare')
    else if (action.includes('报告') || action.includes('规划')) navigate('/report')
    else if (action.includes('推荐') || action.includes('结果')) navigate('/results')
    else if (action.includes('详情')) {
      // 跳转到第一条推荐院校的详情页
      const firstRec = lastRecommendations[0]
      if (firstRec) navigate(`/detail/${firstRec.id}`)
    } else {
      // 否则当作新问题发送
      sendMessage(action)
    }
  }

  const isLoading = phase !== 'idle'
  const educationGoal = info.educationGoal ?? (info.careAboutPostgrad ? '保研' : '未定')

  // ── 无推荐 id：显示引导，而不是发请求出错（后端聊天接口强依赖 recommendation_id） ──
  if (!recommendationId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 md:py-28">
        <div className="card-surface rounded-3xl p-8 md:p-10 text-center shadow-xl shadow-indigo-100/40">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-200 mb-5">
            <Sparkles className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
            先去生成你的志愿推荐吧
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed mb-8 max-w-md mx-auto">
            AI 顾问需要基于一次「推荐结果」来为你答疑——
            <br />
            填写一下高考画像，AI 才能围绕你的候选院校精准作答。
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => navigate('/')} size="lg" className="rounded-full gap-1.5 px-6">
              去填写画像
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button onClick={() => navigate('/results')} size="lg" variant="outline" className="rounded-full px-6">
              已生成？查看结果
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground/70 mt-6">
            🎓 提示：完成一次推荐后，本页会基于该次推荐进入对话
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4 md:py-6 h-[calc(100vh-56px)] flex flex-col">
      <div className="flex gap-3 md:gap-4 flex-1 min-h-0">

        {/* ── 左侧：学生画像 ── */}
        <aside className="hidden md:flex flex-col gap-3 w-56 flex-shrink-0">
          <Card className="border-primary/10 bg-gradient-to-br from-background to-primary/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <GraduationCap className="h-4 w-4 text-primary" />
                学生画像
              </CardTitle>
              <p className="text-[10px] text-muted-foreground">Agent 上下文输入</p>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ProfileRow label="省份" value={info.province} />
              <Separator />
              <ProfileRow label="分数" value={<span className="font-bold text-primary">{info.score} 分</span>} />
              <Separator />
              <ProfileRow label="位次" value={info.rank != null ? info.rank.toLocaleString() : '未填'} />
              <Separator />
              <div>
                <p className="text-muted-foreground text-xs">选科</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {info.subjects.map(s => (
                    <Badge key={s} variant="secondary" className="text-[10px] px-1.5 py-0">{s}</Badge>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground text-xs">专业偏好</p>
                <p className="text-xs mt-0.5 font-medium">{info.majorPreference || '不限'}</p>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground text-xs">目标省份</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {info.targetProvinces.length > 0
                    ? info.targetProvinces.map(c => (
                        <Badge key={c} variant="outline" className="text-[10px] px-1.5 py-0">{c}</Badge>
                      ))
                    : <span className="text-xs text-muted-foreground">不限</span>
                  }
                </div>
              </div>
              <Separator />
              <ProfileRow label="风险偏好" value={
                <Badge className={`${
                  info.riskPreference === '冲刺' ? 'bg-red-100 text-red-700' :
                  info.riskPreference === '稳妥' ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'
                } text-[10px] px-1.5 py-0`}>{info.riskPreference}</Badge>
              } />
              <Separator />
              <ProfileRow label="升学目标" value={
                <Badge className="bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0">{educationGoal}</Badge>
              } />
            </CardContent>
          </Card>

          {/* Agent 能力卡片 */}
          <Card className="border-purple-200/50 bg-gradient-to-br from-purple-50/50 to-background">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-purple-600" />
                Agent 能力
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 text-[11px] text-muted-foreground">
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-500" />画像分析</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-500" />招生计划检索</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-500" />保研政策查询</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-500" />院校专业匹配</div>
              <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-500" />升学建议生成</div>
            </CardContent>
          </Card>
        </aside>

        {/* ── 中间：Agent 聊天区 ── */}
        <div className="flex-1 flex flex-col min-h-0 border rounded-xl overflow-hidden bg-background">
          {/* 头部 */}
          <div className="flex items-center gap-2 px-4 py-3 border-b bg-gradient-to-r from-purple-50/50 via-background to-blue-50/30">
            <div className="relative">
              <div className="h-7 w-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              {isLoading && (
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="font-semibold text-sm">高考志愿 AI Agent</span>
              <span className="text-[10px] text-muted-foreground">RAG 知识库 · 8 类 200+ 文档</span>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ContextMemoryButton messages={messages} />
              {isLoading ? (
                <Badge className="text-xs bg-green-100 text-green-700 border-green-200">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  {phase === 'agent-running' ? 'Agent 执行中' : '生成中'}
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">就绪</Badge>
              )}
            </div>
          </div>

          {/* 历史快速跳转条 */}
          <HistoryQuickBar
            messages={messages}
            onJump={handleJumpToMessage}
            onClear={handleClearConversation}
          />

          {/* 消息列表 —— 用原生 overflow-y-auto，比 Radix ScrollArea 在嵌套 flex 中更稳 */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4">
            <div className="space-y-4 pb-2">
              {messages.map((msg, i) => {
                // 计算"是不是最新一条 assistant 消息"
                const isLatestAssistant = (() => {
                  if (msg.role !== 'assistant') return false
                  for (let j = messages.length - 1; j >= 0; j--) {
                    if (messages[j].role === 'assistant') return j === i
                  }
                  return false
                })()
                return msg.role === 'user'
                  ? <UserMessage key={msg.id} msg={msg} />
                  : <AssistantMessage
                      key={msg.id}
                      msg={msg}
                      isLatest={isLatestAssistant}
                      onCardClick={handleCardClick}
                      onActionClick={handleActionClick}
                    />
              })}
              {phase === 'agent-running' && <AgentStepsPanel steps={activeSteps} />}
              {phase === 'streaming' && (
                <StreamingBubble content={streamingContent} isDone={isStreamingDone} />
              )}
              <div ref={bottomRef} />
            </div>
          </div>

          {/* 快捷问题 */}
          <div className="px-4 pb-2 pt-1 border-t bg-muted/20">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {mockQuickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  disabled={isLoading}
                  className="flex-shrink-0 text-xs bg-background border rounded-full px-3 py-1 hover:bg-muted transition-colors disabled:opacity-40 text-muted-foreground hover:text-foreground"
                >
                  {q.length > 20 ? q.slice(0, 20) + '…' : q}
                </button>
              ))}
            </div>
          </div>

          {/* 模式切换 */}
          <div className="px-3 pt-2 pb-1 border-t flex items-center justify-between">
            <ModeSwitch mode={mode} onChange={setMode} disabled={isLoading} />
            <span className="text-[10px] text-muted-foreground">
              {mode === 'deep' ? '⚡ 7 步推理 + 5 来源 + 扩展分析' : '⚡ 5 步推理 + 3 来源'}
            </span>
          </div>

          {/* 输入区 */}
          <div className="p-3 pt-2 flex gap-2 items-end">
            <Textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="向 Agent 提问，例如：哪个学校保研率最高？（Enter 发送，Shift+Enter 换行）"
              className="resize-none min-h-[44px] max-h-24 text-sm"
              rows={2}
              disabled={isLoading}
            />
            <Button
              size="icon"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 h-10 w-10"
            >
              {isLoading
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />
              }
            </Button>
          </div>
        </div>

        {/* ── 右侧：RAG 知识库 + 相关院校 ── */}
        <aside className="hidden lg:flex flex-col gap-3 w-72 flex-shrink-0 overflow-y-auto">
          {/* RAG 引用面板 —— 展示后端 SSE sources 帧推送的真实命中文件 */}
          <Card className="border-blue-200/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <Library className="h-4 w-4 text-blue-600" />
                RAG 知识库引用
              </CardTitle>
              <p className="text-[10px] text-muted-foreground">
                {lastSources.length > 0
                  ? `本次回答命中 ${lastSources.length} 个来源`
                  : '提问后此处展示 Agent 实际引用的文件'}
              </p>
            </CardHeader>
            <CardContent className="space-y-2">
              {lastSources.length > 0 ? (
                lastSources.map(src => (
                  <SourceCard
                    key={src.id}
                    src={src}
                    active={activeSourceIds.has(src.id)}
                  />
                ))
              ) : (
                <div className="py-6 text-center">
                  <Library className="h-7 w-7 mx-auto mb-2 text-muted-foreground/30" />
                  <p className="text-xs text-muted-foreground/80">暂无引用</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1 leading-snug">
                    向 Agent 提问后，<br />本次对话引用的知识库文件会显示在这里
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 相关院校卡片 */}
          {lastRecommendations.length > 0 && (
            <Card className="border-green-200/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-1.5">
                  <BarChart3 className="h-4 w-4 text-green-600" />
                  相关院校
                </CardTitle>
                <p className="text-[10px] text-muted-foreground">基于本次咨询的快捷入口</p>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {lastRecommendations.slice(0, 4).map(rec => (
                  <button
                    key={rec.id}
                    onClick={() => handleCardClick(rec.id)}
                    className="w-full text-left p-2 rounded-md hover:bg-muted transition-colors flex items-center gap-2 text-xs"
                  >
                    <Badge className={`${CATEGORY_COLOR[rec.category]} text-[10px] px-1 py-0`}>
                      {rec.category}
                    </Badge>
                    <span className="flex-1 truncate font-medium">{rec.schoolName}</span>
                    <span className="text-primary font-bold">{rec.matchScore}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  </button>
                ))}
              </CardContent>
            </Card>
          )}
        </aside>

      </div>
    </div>
  )
}

// ─── 内部小组件 ────────────────────────────────────────────
function ProfileRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="text-xs font-medium">{value}</span>
    </div>
  )
}
