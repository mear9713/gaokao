import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GitCompare, ArrowLeft, Trophy, ChevronRight,
  MapPin, AlertTriangle, Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { useAppContext } from '@/hooks/useAppContext'
import { getRecommendation, parseResult } from '@/services/recommendApi'
import { cn } from '@/lib/utils'
import type { RecommendCategory, SchoolRecommendation, SchoolDetail } from '@/types'

const COMPARE_METRICS = [
  { key: 'schoolLevel',        label: '院校层次',     emphasize: false },
  { key: 'city',               label: '所在城市',     emphasize: false },
  { key: 'majorName',          label: '推荐专业',     emphasize: false },
  { key: 'matchScore',         label: '匹配度',       emphasize: true  },
  { key: 'lastYearScore',      label: '往年分数线',   emphasize: false },
  { key: 'lastYearRank',       label: '往年录取位次', emphasize: false },
  { key: 'admissionRisk',      label: '录取风险',     emphasize: true  },
  { key: 'postgradRate',       label: '学校保研率',   emphasize: false },
  { key: 'majorPostgradRate',  label: '专业保研率',   emphasize: true  },
  { key: 'honorsClassRate',    label: '特色班保研率', emphasize: false },
  { key: 'disciplineStrengths',label: '学科优势',     emphasize: false },
  { key: 'employmentDirection',label: '就业方向',     emphasize: false },
  { key: 'category',           label: '推荐类型',     emphasize: true  },
] as const

type MetricKey = typeof COMPARE_METRICS[number]['key']

const CATEGORY_BADGE: Record<RecommendCategory, string> = {
  '冲刺': 'bg-red-50 text-red-700 border-red-200',
  '稳妥': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  '保底': 'bg-blue-50 text-blue-700 border-blue-200',
}

function getMetricValue(
  schoolId: string,
  key: MetricKey,
  recs: SchoolRecommendation[],
  details: SchoolDetail[],
): React.ReactNode {
  const detail = details.find(s => s.id === schoolId)
  const rec = recs.find(r => r.id === schoolId)
  if (!detail && !rec) return <span className="text-muted-foreground">—</span>

  switch (key) {
    case 'schoolLevel': return detail?.schoolLevel ?? rec?.schoolLevel
    case 'city': return detail?.city ?? rec?.city
    case 'majorName': return detail?.majorDetail.name ?? rec?.recommendedMajor
    case 'matchScore':
      return rec ? <span className="text-lg font-bold text-gradient-blue font-numeric">{rec.matchScore}</span> : '—'
    case 'lastYearScore': return rec && rec.lastYearScore > 0 ? <span className="font-numeric">{rec.lastYearScore} 分</span> : '—'
    case 'lastYearRank':  return rec && rec.lastYearRank > 0 ? <span className="font-numeric">{rec.lastYearRank.toLocaleString()}</span> : '—'
    case 'admissionRisk':
      if (!rec) return '—'
      const riskColor = rec.admissionRisk === '高' ? 'text-red-600' : rec.admissionRisk === '中' ? 'text-amber-600' : 'text-emerald-600'
      const dotColor  = rec.admissionRisk === '高' ? 'bg-red-500'  : rec.admissionRisk === '中' ? 'bg-amber-500'  : 'bg-emerald-500'
      return (
        <span className={cn('inline-flex items-center gap-1.5 text-sm font-medium', riskColor)}>
          <span className={cn('h-1.5 w-1.5 rounded-full', dotColor)} />
          {rec.admissionRisk}风险
        </span>
      )
    case 'postgradRate':      return detail ? <span className="font-numeric font-semibold">{detail.majorDetail.postgradRate}%</span> : '—'
    case 'majorPostgradRate': return detail ? <span className="font-numeric font-bold text-purple-600">{detail.majorDetail.majorPostgradRate}%</span> : '—'
    case 'honorsClassRate':   return detail?.majorDetail.honorsClassRate !== undefined
      ? <span className="font-numeric font-semibold text-fuchsia-600">{detail.majorDetail.honorsClassRate}%</span>
      : <span className="text-xs text-muted-foreground">暂无</span>
    case 'disciplineStrengths':
      return detail
        ? <div className="flex flex-wrap gap-1 justify-center">
            {detail.disciplineStrengths.slice(0, 3).map(d =>
              <Badge key={d} variant="secondary" className="text-[10px] px-1.5">{d}</Badge>
            )}
          </div>
        : '—'
    case 'employmentDirection':
      return detail ? <span className="text-xs text-muted-foreground line-clamp-2">{detail.majorDetail.employmentDirection.slice(0, 60) + '…'}</span> : '—'
    case 'category':
      return rec ? <Badge className={cn('text-xs border', CATEGORY_BADGE[rec.category])}>{rec.category}</Badge> : '—'
    default: return '—'
  }
}

// 综合评分算法：匹配度 + 保研竞争力 + 录取风险
function pickBestSchool(
  ids: string[],
  recs: SchoolRecommendation[],
  details: SchoolDetail[],
) {
  const scored = ids.map(id => {
    const rec = recs.find(r => r.id === id)
    const detail = details.find(s => s.id === id)
    if (!rec) return { id, score: 0, name: id, category: undefined, postgradRate: 0 }

    const matchScore = rec.matchScore
    const postgradRate =
      detail?.majorDetail.majorPostgradRate
      ?? parseInt(rec.postgradAdvantage.match(/(\d+)\s*%/)?.[1] ?? '8', 10)
    const riskPenalty = rec.admissionRisk === '高' ? -15 : rec.admissionRisk === '中' ? -5 : 0
    const total = matchScore + postgradRate * 0.5 + riskPenalty

    return { id, score: total, name: rec.schoolName, category: rec.category, postgradRate }
  })
  scored.sort((a, b) => b.score - a.score)
  return scored
}

export default function ComparePage() {
  const navigate = useNavigate()
  const { selectedSchools, clearSelectedSchools, toggleSelectedSchool, recommendationId } = useAppContext()

  const [recs, setRecs] = useState<SchoolRecommendation[]>([])
  const [details, setDetails] = useState<SchoolDetail[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!recommendationId) { setLoading(false); return }
      try {
        const record = await getRecommendation(recommendationId)
        const parsed = parseResult(record.result)
        if (!cancelled) { setRecs(parsed.recommendations); setDetails(parsed.schoolDetails); setLoading(false) }
      } catch {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [recommendationId])

  const schools = selectedSchools.map(id => {
    const detail = details.find(s => s.id === id)
    const rec = recs.find(r => r.id === id)
    return { id, name: detail?.schoolName ?? rec?.schoolName ?? id }
  })

  const ranking = useMemo(() => pickBestSchool(selectedSchools, recs, details), [selectedSchools, recs, details])
  const best = ranking[0]

  // 加载中
  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-32 text-center">
        <Loader2 className="h-10 w-10 mx-auto mb-5 text-indigo-500 animate-spin" />
        <p className="text-muted-foreground">正在加载对比数据…</p>
      </div>
    )
  }

  // 空状态（未选择院校）
  if (schools.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 mb-6">
          <GitCompare className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-2">暂无对比数据</h1>
        <p className="text-muted-foreground mb-8 leading-relaxed">
          回到推荐结果页，勾选 2 所或以上院校，<br />
          点击"开始对比"即可在此处看到详细横向对比。
        </p>
        <Button onClick={() => navigate('/results')} size="lg" className="rounded-full gap-1.5">
          <ArrowLeft className="h-4 w-4" />
          返回推荐结果
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-6">

      {/* 顶部标题区 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-indigo-600 font-semibold mb-1.5">COMPARE</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">院校横向对比</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            已选 <span className="font-bold text-foreground font-numeric">{schools.length}</span> 所 ·
            <span className="text-muted-foreground"> 13 个核心维度</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/results')} className="rounded-full gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            返回结果
          </Button>
          <Button variant="ghost" size="sm" onClick={() => { clearSelectedSchools(); toast.info('已清空对比清单'); navigate('/results') }} className="rounded-full">
            清空全部
          </Button>
        </div>
      </div>

      {/* 综合推荐结论卡 */}
      {best && best.score > 0 && (
        <div className="card-surface rounded-2xl p-5 md:p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-amber-200/30 to-fuchsia-200/30 blur-3xl rounded-full -translate-y-1/2 translate-x-1/4" />

          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Trophy className="h-4 w-4 text-white" />
              </div>
              <span className="font-semibold text-sm">AI 综合推荐</span>
              <Badge variant="outline" className="text-[10px] ml-auto">基于匹配度 + 保研率 + 录取风险</Badge>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold mb-3">{best.name}</h2>
            <p className="text-sm text-foreground/80 leading-relaxed mb-4 max-w-3xl">
              综合考量你的<span className="font-medium text-foreground">匹配度</span>、
              <span className="font-medium text-purple-600">保研竞争力</span>、
              <span className="font-medium text-emerald-600">录取确定性</span>三个维度，
              <span className="font-semibold">{best.name}</span> 是这次对比中的最优选择。
            </p>

            {/* 综合排名 */}
            <div className="flex flex-wrap gap-2">
              {ranking.map((r, i) => {
                if (!r.name) return null
                return (
                  <div
                    key={r.id}
                    onClick={() => navigate(`/detail/${r.id}`)}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs cursor-pointer transition-all',
                      i === 0
                        ? 'bg-foreground text-background font-medium'
                        : 'bg-background border border-border text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <span className={cn('font-bold font-numeric', i === 0 ? 'text-amber-300' : '')}>
                      #{i + 1}
                    </span>
                    {r.name}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* 对比表格 */}
      <div className="card-surface rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* 表头 = 学校卡片 */}
            <thead>
              <tr className="border-b border-border/40">
                <th className="sticky left-0 bg-background/95 backdrop-blur z-10 text-left px-5 py-4 w-40 border-r border-border/40">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">对比维度</p>
                </th>
                {schools.map(s => {
                  const rec = recs.find(r => r.id === s.id)
                  const isBest = best && s.id === best.id
                  return (
                    <th key={s.id} className={cn(
                      'min-w-[200px] px-5 py-4 text-center align-top border-l border-border/40',
                      isBest && 'bg-amber-50/30'
                    )}>
                      <div className="flex flex-col items-center gap-1.5">
                        {isBest && (
                          <Badge className="text-[10px] bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0 px-2 mb-1">
                            <Trophy className="h-2.5 w-2.5 mr-1" /> 最优
                          </Badge>
                        )}
                        <h3 className="font-bold text-base text-foreground">{s.name}</h3>
                        {rec && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {rec.city || '—'}
                          </p>
                        )}
                        <div className="flex gap-1 mt-1">
                          <button
                            onClick={() => navigate(`/detail/${s.id}`)}
                            className="text-[11px] text-indigo-600 hover:text-indigo-700 inline-flex items-center font-medium"
                          >
                            详情
                            <ChevronRight className="h-3 w-3" />
                          </button>
                          <span className="text-muted-foreground/30">|</span>
                          <button
                            onClick={() => { toggleSelectedSchool(s.id); toast.info('已移除', s.name) }}
                            className="text-[11px] text-muted-foreground hover:text-red-600"
                          >
                            移除
                          </button>
                        </div>
                      </div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {COMPARE_METRICS.map((metric, idx) => (
                <tr
                  key={metric.key}
                  className={cn(
                    'border-b border-border/30 hover:bg-muted/30 transition-colors',
                    idx % 2 === 1 ? 'bg-muted/10' : '',
                    metric.emphasize && 'bg-indigo-50/20 hover:bg-indigo-50/40'
                  )}
                >
                  <td className="sticky left-0 bg-background/95 backdrop-blur z-10 px-5 py-3.5 border-r border-border/40">
                    <p className={cn(
                      'text-xs',
                      metric.emphasize ? 'text-foreground font-semibold' : 'text-muted-foreground font-medium'
                    )}>
                      {metric.label}
                      {metric.emphasize && <span className="ml-1 text-indigo-600">·</span>}
                    </p>
                  </td>
                  {schools.map(s => {
                    const isBest = best && s.id === best.id
                    return (
                      <td key={s.id} className={cn(
                        'px-5 py-3.5 text-center text-sm border-l border-border/40',
                        isBest && 'bg-amber-50/20'
                      )}>
                        {getMetricValue(s.id, metric.key, recs, details)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 风险提示 */}
      <div className="card-surface rounded-2xl p-5 border-amber-200 bg-amber-50/30">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1.5">
            <p className="text-sm font-semibold text-amber-900">填报风险提示</p>
            <p className="text-xs text-amber-800/80 leading-relaxed">
              对比表数据基于后端推荐结果。实际填报时务必关注：
              ① 当年招生计划变化 ② 选科要求是否匹配 ③ 部分专业有体检/单科限制 ④ "服从调剂"对低分录取的影响。
              建议结合<span className="font-medium underline cursor-pointer" onClick={() => navigate('/chat')}>AI 咨询</span>进行进一步分析。
            </p>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground py-2">
        💡 数据来源：后端推荐服务 · 仅供参考
      </p>
    </div>
  )
}
