import { useState, useMemo, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import type { JSX } from 'react'
import {
  GitCompare, MessageSquare, FileText, ChevronRight,
  Target, Sparkles, MapPin, Award,
  Edit3, ArrowRight, Search, Loader2, AlertTriangle, RefreshCw,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/toast'
import { useAppContext } from '@/hooks/useAppContext'
import { mockStudentInfo } from '@/data/mockData'
import { pollRecommendation, parseResult, type RecStatus } from '@/services/recommendApi'
import { cn } from '@/lib/utils'
import type { RecommendCategory, AdmissionRisk, SchoolRecommendation } from '@/types'

// ─── 视觉常量 ──────────────────────────────────────────────
const CATEGORY_STYLES: Record<RecommendCategory, { badge: string; ring: string; text: string }> = {
  '冲刺': { badge: 'bg-red-50 text-red-700 border-red-200',             ring: 'ring-red-100',     text: 'text-red-600' },
  '稳妥': { badge: 'bg-blue-50 text-blue-700 border-blue-200',          ring: 'ring-blue-100',    text: 'text-blue-600' },
  '保底': { badge: 'bg-green-50 text-green-700 border-green-200',       ring: 'ring-green-100',   text: 'text-green-600' },
}

const RISK_STYLES: Record<AdmissionRisk, { bg: string; dot: string; text: string }> = {
  '高': { bg: 'bg-red-50',     dot: 'bg-red-500',     text: 'text-red-700' },
  '中': { bg: 'bg-amber-50',   dot: 'bg-amber-500',   text: 'text-amber-700' },
  '低': { bg: 'bg-emerald-50', dot: 'bg-emerald-500', text: 'text-emerald-700' },
}

type LoadState = 'idle' | 'loading' | 'done' | 'failed' | 'empty'

function statusLabel(s: RecStatus): string {
  switch (s) {
    case 'pending':    return '任务排队中...'
    case 'processing': return 'AI 正在分析并匹配院校...'
    case 'completed':  return '即将完成...'
    case 'failed':     return '任务失败'
    default:           return '正在生成推荐...'
  }
}

// ─── 匹配度仪表 ──────────────────────────────────────────────
function MatchGauge({ score }: { score: number }) {
  const colorClass = score >= 90 ? 'text-gradient-blue' : score >= 80 ? 'text-indigo-600' : 'text-gray-400'
  return (
    <div className="inline-flex items-baseline gap-0.5">
      <span className={cn('text-2xl font-bold font-numeric', colorClass)}>{score || '—'}</span>
      <span className="text-xs text-muted-foreground">分</span>
    </div>
  )
}

// ─── 关键词高亮 ──────────────────────────────────────────────
function highlightKeywords(text: string) {
  const keywords = ['保研', '985', '211', '双一流', '直博', '推免', '强基', '英才班', '跃迁', '顶尖', '排名前']
  let result: (string | JSX.Element)[] = [text]
  keywords.forEach(kw => {
    result = result.flatMap(part => {
      if (typeof part !== 'string') return [part]
      const split = part.split(new RegExp(`(${kw})`, 'g'))
      return split.map((s, i) =>
        s === kw ? <mark key={`${kw}-${i}`} className="bg-indigo-50 text-indigo-700 font-medium px-0.5 rounded">{s}</mark> : s
      )
    })
  })
  return result
}

// ─── 状态容器（加载 / 失败 / 空 / 未生成 复用） ──────────────
function StatusShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-indigo-600 font-semibold mb-1.5">DECISION DASHBOARD</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">志愿决策看板</h1>
        </div>
      </div>
      <div className="card-surface rounded-2xl py-20 text-center">{children}</div>
    </div>
  )
}

// ─── 主组件 ────────────────────────────────────────────────
export default function ResultsPage() {
  const navigate = useNavigate()
  const { studentInfo, recommendationId, selectedSchools, toggleSelectedSchool, clearSelectedSchools } = useAppContext()
  const info = studentInfo ?? mockStudentInfo

  const [loadState, setLoadState] = useState<LoadState>('idle')
  const [statusText, setStatusText] = useState('正在生成推荐...')
  const [recs, setRecs] = useState<SchoolRecommendation[]>([])
  const [errorMsg, setErrorMsg] = useState('')
  const [disclaimer, setDisclaimer] = useState('')

  const [filter, setFilter] = useState<RecommendCategory | '全部'>('全部')
  const [search, setSearch] = useState('')

  const loadRecommendations = useCallback(async () => {
    if (!recommendationId) {
      setLoadState('idle')
      return
    }
    setLoadState('loading')
    setErrorMsg('')
    setStatusText('正在生成推荐...')
    try {
      const record = await pollRecommendation(recommendationId, {
        onTick: (s) => setStatusText(statusLabel(s.status)),
      })
      if (record.status === 'failed') {
        setLoadState('failed')
        setErrorMsg('推荐任务执行失败')
        return
      }
      const parsed = parseResult(record.result)
      setDisclaimer(parsed.dataDisclaimer)
      if (parsed.recommendations.length === 0) {
        setRecs([])
        setLoadState('empty')
        return
      }
      setRecs(parsed.recommendations)
      setLoadState('done')
    } catch (err) {
      setLoadState('failed')
      setErrorMsg((err as Error).message || '获取推荐失败')
    }
  }, [recommendationId])

  useEffect(() => { loadRecommendations() }, [loadRecommendations])

  const stats = useMemo(() => {
    const chase = recs.filter(r => r.category === '冲刺').length
    const stable = recs.filter(r => r.category === '稳妥').length
    const safe = recs.filter(r => r.category === '保底').length
    return { chase, stable, safe, total: recs.length }
  }, [recs])

  const filtered = useMemo(() => {
    return recs.filter(r => {
      if (filter !== '全部' && r.category !== filter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!r.schoolName.toLowerCase().includes(q) &&
            !r.recommendedMajor.toLowerCase().includes(q) &&
            !r.city.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [recs, filter, search])

  const strategySummary = useMemo(() => {
    const rankStr = info.rank != null ? `，位次 ${info.rank.toLocaleString()}` : ''
    return `你的分数 ${info.score} 分${rankStr}（${info.province}生源）。基于你的院校、专业、地区和【${info.careAboutPostgrad ? '重视' : '不重视'}保研】诉求，系统自动生成 ${stats.total} 所方案：${stats.chase} 所冲刺、${stats.stable} 所稳妥、${stats.safe} 所保底。`
  }, [info, stats])

  function handleAddCompare(id: string, name: string) {
    const isAdding = !selectedSchools.includes(id)
    toggleSelectedSchool(id)
    if (isAdding) toast.success('已加入对比', name)
  }

  function handleStartCompare() {
    if (selectedSchools.length < 2) {
      toast.warning('请至少选择 2 所院校', '才能进行横向对比')
      return
    }
    navigate('/compare')
  }

  // ── 未生成推荐 ──
  if (loadState === 'idle') {
    return (
      <StatusShell>
        <div className="text-5xl mb-4">📝</div>
        <p className="text-lg font-medium mb-1">还没有推荐结果</p>
        <p className="text-sm text-muted-foreground mb-6">请先填写高考信息，生成你的专属志愿方案</p>
        <Button onClick={() => navigate('/')} className="rounded-full gap-1.5">
          <Edit3 className="h-4 w-4" /> 去填写信息
        </Button>
      </StatusShell>
    )
  }

  // ── 加载中（轮询） ──
  if (loadState === 'loading') {
    return (
      <StatusShell>
        <LoadingProgress statusText={statusText} />
      </StatusShell>
    )
  }

  // ── 失败 ──
  if (loadState === 'failed') {
    return (
      <StatusShell>
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-500 mb-5">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <p className="text-lg font-medium mb-1">推荐生成失败</p>
        <p className="text-sm text-muted-foreground mb-1">{errorMsg}</p>
        <p className="text-xs text-muted-foreground/80 mb-6 max-w-md mx-auto">
          画像已正常提交至后端；当前是后端推荐服务（worker）异常导致任务失败，并非前端问题。可稍后重试或重新填写。
        </p>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={loadRecommendations} className="rounded-full gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> 重试
          </Button>
          <Button onClick={() => navigate('/')} className="rounded-full gap-1.5">
            <Edit3 className="h-3.5 w-3.5" /> 重新填写
          </Button>
        </div>
      </StatusShell>
    )
  }

  // ── 空结果 ──
  if (loadState === 'empty') {
    return (
      <StatusShell>
        <div className="text-5xl mb-4">🔍</div>
        <p className="text-lg font-medium mb-1">未匹配到合适的院校</p>
        <p className="text-sm text-muted-foreground mb-2">{disclaimer || '当前条件下暂无符合的推荐，试试调整分数 / 省份 / 意向专业。'}</p>
        <Button onClick={() => navigate('/')} className="rounded-full gap-1.5 mt-4">
          <Edit3 className="h-4 w-4" /> 调整信息重新匹配
        </Button>
      </StatusShell>
    )
  }

  // ── 正常渲染（done） ──
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-6">

      {/* 顶部标题区 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-indigo-600 font-semibold mb-1.5">DECISION DASHBOARD</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">志愿决策看板</h1>
          <p className="text-sm text-muted-foreground mt-1.5">基于学生画像和 AI 匹配算法的精选推荐</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/')} className="rounded-full gap-1.5">
            <Edit3 className="h-3.5 w-3.5" />
            修改信息
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/chat')} className="rounded-full gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            AI 咨询
          </Button>
          <Button size="sm" onClick={() => navigate('/report')} className="rounded-full gap-1.5">
            <FileText className="h-3.5 w-3.5" />
            生成报告
          </Button>
        </div>
      </div>

      {/* 画像 + 策略双卡 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card-surface rounded-2xl p-5 lg:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-indigo-100 flex items-center justify-center">
              <Target className="h-4 w-4 text-indigo-600" />
            </div>
            <span className="font-semibold text-sm">学生画像</span>
          </div>
          <div className="space-y-2.5 text-sm">
            <Row label="所在省份" value={info.province} />
            <Row label="高考分数" value={<span className="font-bold text-foreground font-numeric">{info.score} 分</span>} />
            <Row label="高考位次" value={<span className="font-numeric">{info.rank != null ? info.rank.toLocaleString() : '未填'}</span>} />
            <Row label="选科组合" value={
              <div className="flex flex-wrap gap-1 justify-end">
                {info.subjects.map(s => <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>)}
              </div>
            } />
            <Row label="保研偏好" value={
              <span className={cn('text-xs font-medium', info.careAboutPostgrad ? 'text-purple-600' : 'text-muted-foreground')}>
                {info.careAboutPostgrad ? '✓ 重视' : '不重视'}
              </span>
            } />
          </div>
        </div>

        <div className="card-surface rounded-2xl p-5 lg:col-span-2 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-purple-100 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-purple-600" />
            </div>
            <span className="font-semibold text-sm">推荐策略总结</span>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed mb-5">{strategySummary}</p>

          <div className="grid grid-cols-4 gap-3 mt-auto">
            <StatCard label="总推荐" value={stats.total} color="text-foreground" />
            <StatCard label="冲刺"   value={stats.chase} color="text-red-600" />
            <StatCard label="稳妥"   value={stats.stable} color="text-blue-600" />
            <StatCard label="保底"   value={stats.safe} color="text-green-600" />
          </div>
        </div>
      </div>

      {/* 过滤 + 搜索 */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {(['全部', '冲刺', '稳妥', '保底'] as const).map(cat => {
            const active = filter === cat
            const count = cat === '全部' ? stats.total : cat === '冲刺' ? stats.chase : cat === '稳妥' ? stats.stable : stats.safe
            const catStyle = cat === '全部' ? null : CATEGORY_STYLES[cat]
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap border',
                  active
                    ? catStyle
                      ? `${catStyle.badge} shadow-sm`
                      : 'bg-foreground text-background border-foreground shadow-sm'
                    : catStyle
                      ? 'bg-background text-muted-foreground hover:text-foreground hover:border-current'
                      : 'bg-background text-muted-foreground hover:text-foreground border-border'
                )}
              >
                {cat} <span className="ml-1 text-xs opacity-70">({count})</span>
              </button>
            )
          })}
        </div>

        <div className="relative md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="搜索院校 / 专业 / 城市..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-full bg-background"
          />
        </div>
      </div>

      {/* 推荐卡片网格 */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(rec => {
            const isSelected = selectedSchools.includes(rec.id)
            const cs = CATEGORY_STYLES[rec.category]
            const rs = RISK_STYLES[rec.admissionRisk]
            const hasScore = rec.lastYearScore > 0
            const scoreDiff = info.score - rec.lastYearScore
            return (
              <div
                key={rec.id}
                className={cn(
                  'group card-surface rounded-2xl p-5 transition-all cursor-pointer',
                  isSelected ? 'ring-2 ring-indigo-200 border-indigo-300' : 'card-hover'
                )}
                onClick={() => navigate(`/detail/${rec.id}`)}
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="flex-shrink-0 pt-1" onClick={e => e.stopPropagation()}>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleAddCompare(rec.id, rec.schoolName)}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-lg leading-tight">{rec.schoolName}</h3>
                      <Badge className={cn('text-[10px] border px-1.5 py-0', cs.badge)}>
                        {rec.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <MapPin className="h-3 w-3" />
                      {rec.city || '—'} · {rec.schoolLevel || '—'}
                      <span className="mx-1">·</span>
                      {rec.recommendedMajor}
                    </div>
                  </div>
                  <div className="text-right">
                    <MatchGauge score={rec.matchScore} />
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">匹配</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <Metric
                    label="录取风险"
                    value={
                      <span className={cn('inline-flex items-center gap-1', rs.text)}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', rs.dot)} />
                        {rec.admissionRisk}
                      </span>
                    }
                  />
                  <Metric
                    label="往年位次"
                    value={<span className="font-numeric">{rec.lastYearRank > 0 ? rec.lastYearRank.toLocaleString() : '—'}</span>}
                  />
                  <Metric
                    label="分差"
                    value={
                      hasScore ? (
                        <span className={cn('font-numeric font-medium', scoreDiff >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                          {scoreDiff >= 0 ? '+' : ''}{scoreDiff}
                        </span>
                      ) : <span className="text-muted-foreground">—</span>
                    }
                  />
                </div>

                {rec.postgradAdvantage && (
                  <div className="flex items-start gap-2 py-2.5 px-3 bg-purple-50/50 rounded-xl mb-3 border border-purple-100/50">
                    <Award className="h-3.5 w-3.5 text-purple-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-purple-900 leading-relaxed">{rec.postgradAdvantage}</p>
                  </div>
                )}

                <div className="flex items-start gap-2 mb-4">
                  <Sparkles className="h-3.5 w-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-foreground/80 leading-relaxed line-clamp-2">
                    {highlightKeywords(rec.reason)}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border/40">
                  <button
                    onClick={e => { e.stopPropagation(); handleAddCompare(rec.id, rec.schoolName) }}
                    className={cn(
                      'text-xs font-medium transition-colors',
                      isSelected ? 'text-indigo-600' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {isSelected ? '✓ 已加入对比' : '+ 加入对比'}
                  </button>
                  <span className="text-xs text-indigo-600 font-medium flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                    查看详情
                    <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-20 card-surface rounded-2xl">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-lg font-medium mb-1">未找到匹配的院校</p>
          <p className="text-sm text-muted-foreground mb-6">试试切换分类或清除搜索关键词</p>
          <Button variant="outline" onClick={() => { setFilter('全部'); setSearch('') }} className="rounded-full">
            重置筛选
          </Button>
        </div>
      )}

      {/* 底部浮动对比条 */}
      {selectedSchools.length > 0 && (
        <div className="sticky bottom-4 z-30 mx-auto max-w-3xl animate-fade-in-up">
          <div className="card-surface rounded-2xl shadow-xl border-indigo-200 px-4 py-3 flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <GitCompare className="h-4 w-4 text-indigo-600 flex-shrink-0" />
              <span className="text-sm font-medium whitespace-nowrap">
                已选 <span className="text-indigo-600 font-bold font-numeric">{selectedSchools.length}</span> 所
              </span>
              <button
                onClick={() => { clearSelectedSchools(); toast.info('已清空对比清单') }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                清空
              </button>
            </div>
            <Button onClick={handleStartCompare} size="sm" className="rounded-full gap-1.5" disabled={selectedSchools.length < 2}>
              开始对比
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground py-2">
        📊 {disclaimer || '数据来源：后端推荐服务 · 匹配度由 AI 综合评估 · 仅供参考'}
      </p>
    </div>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="text-right text-sm">{value}</div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="bg-background/60 rounded-xl p-3 text-center border border-border/50">
      <div className={cn('text-2xl font-bold font-numeric', color)}>{value}</div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mt-0.5">{label}</p>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
      <div className="text-sm font-medium">{value}</div>
    </div>
  )
}

// ─── 推荐进度分阶段动画 ──────────────────────────────────
// 后端推荐串行：规则筛选 → 粗排 → 检索 → 精排 → 5维评估，约 60-120s
// 这里按经验时间推进阶段，给用户进度感（不是真实后端进度，但比卡死强）
const LOADING_STAGES: { label: string; sub: string; atMs: number }[] = [
  { label: '规则筛选候选学校',  sub: '正在按你的分数 / 选科 / 意向匹配候选库',     atMs: 0 },
  { label: 'AI 粗排候选',       sub: '从数百所候选中精选 15 所最匹配的学校',       atMs: 8000 },
  { label: '深度向量检索',       sub: '从知识库提取保研政策 / 培养方案 / 录取数据', atMs: 25000 },
  { label: 'AI 精排 + 推荐理由', sub: '生成冲 / 稳 / 保分档与个性化推荐文案',     atMs: 35000 },
  { label: 'AI 五维保研评估',   sub: '逐校分析推免机会 / 竞争 / 升学去向',         atMs: 60000 },
  { label: '生成完整报告',       sub: '汇总学校详情、政策、个性化建议',           atMs: 90000 },
]

function LoadingProgress({ statusText }: { statusText: string }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = Date.now()
    const t = setInterval(() => setElapsed(Date.now() - start), 500)
    return () => clearInterval(t)
  }, [])

  const currentIdx = (() => {
    let idx = 0
    for (let i = 0; i < LOADING_STAGES.length; i++) {
      if (elapsed >= LOADING_STAGES[i].atMs) idx = i
    }
    return idx
  })()

  const seconds = Math.floor(elapsed / 1000)
  const minutes = Math.floor(seconds / 60)
  const secs = seconds % 60
  const timeStr = minutes > 0 ? `${minutes}分${secs}秒` : `${seconds}秒`

  return (
    <div className="max-w-md mx-auto px-4 py-6 text-left">
      {/* 顶部图标 + 当前阶段大字 */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative h-12 w-12 flex-shrink-0">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 opacity-90" />
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 animate-ping opacity-30" />
          <Loader2 className="absolute inset-0 m-auto h-5 w-5 text-white animate-spin" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-semibold leading-tight">
            {LOADING_STAGES[currentIdx].label}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {LOADING_STAGES[currentIdx].sub}
          </p>
        </div>
      </div>

      {/* 阶段进度列表 */}
      <div className="space-y-2 mb-6">
        {LOADING_STAGES.map((stage, i) => {
          const done = i < currentIdx
          const active = i === currentIdx
          return (
            <div key={i} className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-lg transition-all',
              active && 'bg-indigo-50/60 border border-indigo-100',
            )}>
              <div className={cn(
                'h-5 w-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all',
                done   && 'bg-emerald-100',
                active && 'bg-indigo-100',
                !done && !active && 'bg-muted',
              )}>
                {done ? (
                  <span className="text-emerald-600 text-xs">✓</span>
                ) : active ? (
                  <Loader2 className="h-3 w-3 text-indigo-600 animate-spin" />
                ) : (
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
                )}
              </div>
              <span className={cn(
                'text-xs transition-colors',
                done   && 'text-foreground/70',
                active && 'text-foreground font-medium',
                !done && !active && 'text-muted-foreground/60',
              )}>
                {stage.label}
              </span>
            </div>
          )
        })}
      </div>

      {/* 底部时长 + 后端真实状态 */}
      <div className="pt-4 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
        <span>已用 {timeStr}</span>
        <span className="opacity-70">{statusText}</span>
      </div>

      <p className="text-[11px] text-muted-foreground/70 mt-4 leading-relaxed text-center">
        💡 AI 需要 3 轮深度推理生成完整结果，预计 1-2 分钟。请勿关闭页面。
      </p>
    </div>
  )
}
