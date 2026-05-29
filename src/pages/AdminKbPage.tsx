import { useState, useMemo } from 'react'
import {
  Database, Search, Plus, Trash2, Eye, FileText, Filter,
  X, Calendar, Building2, Upload, BarChart3, ShieldCheck,
  LayoutDashboard, ArrowUpRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { mockKnowledgeSources } from '@/data/mockData'
import { cn } from '@/lib/utils'
import type { KnowledgeSource, KnowledgeSourceType } from '@/types'

// 8 类来源的视觉样式
const TYPE_COLOR: Record<KnowledgeSourceType, { bg: string; text: string; border: string; iconBg: string }> = {
  '招生数据':   { bg: 'bg-blue-50',   text: 'text-blue-700',   border: 'border-blue-200',   iconBg: 'bg-blue-100' },
  '录取数据':   { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', iconBg: 'bg-indigo-100' },
  '保研政策':   { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', iconBg: 'bg-purple-100' },
  '专业信息':   { bg: 'bg-emerald-50',text: 'text-emerald-700',border: 'border-emerald-200',iconBg: 'bg-emerald-100' },
  '培养方案':   { bg: 'bg-teal-50',   text: 'text-teal-700',   border: 'border-teal-200',   iconBg: 'bg-teal-100' },
  '奖学金政策': { bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200',  iconBg: 'bg-amber-100' },
  '转专业政策': { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', iconBg: 'bg-orange-100' },
  '院校官网':   { bg: 'bg-slate-50',  text: 'text-slate-700',  border: 'border-slate-200',  iconBg: 'bg-slate-100' },
}

const ALL_TYPES: KnowledgeSourceType[] = [
  '招生数据', '录取数据', '保研政策', '专业信息',
  '培养方案', '奖学金政策', '转专业政策', '院校官网',
]

// 假数据：扩展显示给运营看的"全库统计"（真实接入时由后端返回）
const TOTAL_DOC_COUNT = 247
const TOTAL_CHUNK_COUNT = 18642
const LAST_INDEXED_AT = '2026-05-28 14:32'

export default function AdminKbPage() {
  const [docs, setDocs] = useState<KnowledgeSource[]>(mockKnowledgeSources)
  const [typeFilter, setTypeFilter] = useState<KnowledgeSourceType | '全部'>('全部')
  const [search, setSearch] = useState('')
  const [viewingDoc, setViewingDoc] = useState<KnowledgeSource | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  // 各类统计
  const typeStats = useMemo(() => {
    const stats: Record<KnowledgeSourceType, number> = {} as Record<KnowledgeSourceType, number>
    ALL_TYPES.forEach(t => stats[t] = 0)
    docs.forEach(d => stats[d.type] = (stats[d.type] || 0) + 1)
    return stats
  }, [docs])

  // 过滤+搜索
  const filtered = useMemo(() => {
    return docs.filter(d => {
      if (typeFilter !== '全部' && d.type !== typeFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!d.title.toLowerCase().includes(q) &&
            !d.source.toLowerCase().includes(q) &&
            !(d.schoolName?.toLowerCase() || '').includes(q)) return false
      }
      return true
    })
  }, [docs, typeFilter, search])

  function handleDelete(doc: KnowledgeSource) {
    if (!confirm(`确认删除「${doc.title}」？\n该操作不可恢复，且会同时移除向量库中的所有切片。`)) return
    setDocs(prev => prev.filter(d => d.id !== doc.id))
    toast.success('已删除', doc.title)
  }

  function handleCreate(newDoc: Omit<KnowledgeSource, 'id'>) {
    const doc: KnowledgeSource = {
      ...newDoc,
      id: `ks_${Date.now()}`,
    }
    setDocs(prev => [doc, ...prev])
    toast.success('已新增文档', doc.title)
    setShowCreate(false)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-6">

      {/* 顶部标题 */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <p className="text-xs uppercase tracking-[0.18em] text-purple-600 font-semibold">ADMIN · KNOWLEDGE BASE</p>
            <Badge className="bg-purple-100 text-purple-700 border-purple-200 text-[10px]">
              <ShieldCheck className="h-2.5 w-2.5 mr-0.5" />
              管理员
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">RAG 知识库管理</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            管理 Agent 用于检索的所有文档·支持新增·编辑·删除·向量重建
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="rounded-full gap-1.5 self-start md:self-auto">
          <Plus className="h-4 w-4" />
          上传新文档
        </Button>
      </div>

      {/* 全局统计卡 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard
          icon={Database}
          label="总文档数"
          value={TOTAL_DOC_COUNT}
          hint={`本页显示 ${docs.length} 个`}
          color="text-indigo-600"
          bg="bg-indigo-50"
        />
        <StatCard
          icon={FileText}
          label="向量切片数"
          value={TOTAL_CHUNK_COUNT.toLocaleString()}
          hint="每文档 ~75 切片"
          color="text-purple-600"
          bg="bg-purple-50"
        />
        <StatCard
          icon={LayoutDashboard}
          label="覆盖类型"
          value={ALL_TYPES.length}
          hint="8 类知识源"
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <StatCard
          icon={Calendar}
          label="最近索引"
          value={LAST_INDEXED_AT.split(' ')[1]}
          hint={LAST_INDEXED_AT.split(' ')[0]}
          color="text-amber-600"
          bg="bg-amber-50"
        />
      </div>

      {/* 类型统计网格（8 类） */}
      <div className="card-surface rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-foreground/60" />
          <span className="text-sm font-semibold">按类型分布</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {ALL_TYPES.map(type => {
            const count = typeStats[type] ?? 0
            const style = TYPE_COLOR[type]
            const active = typeFilter === type
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(active ? '全部' : type)}
                className={cn(
                  'p-3 rounded-xl border text-left transition-all hover:shadow-sm',
                  active
                    ? cn(style.bg, style.border, 'shadow-sm ring-2 ring-offset-1', style.text.replace('text-', 'ring-'))
                    : 'border-border bg-background hover:border-foreground/20'
                )}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <Badge className={cn(style.bg, style.text, style.border, 'border text-[10px] px-1.5 py-0')}>
                    {type}
                  </Badge>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold font-numeric">{count}</span>
                  <span className="text-xs text-muted-foreground">个</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 筛选 + 搜索 */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <button
            onClick={() => setTypeFilter('全部')}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-all',
              typeFilter === '全部'
                ? 'bg-foreground text-background'
                : 'bg-background border text-muted-foreground hover:text-foreground'
            )}
          >
            全部
            <span className="ml-1 opacity-70">({docs.length})</span>
          </button>
          {typeFilter !== '全部' && (
            <Badge className={cn(TYPE_COLOR[typeFilter].bg, TYPE_COLOR[typeFilter].text, TYPE_COLOR[typeFilter].border, 'border')}>
              {typeFilter}
              <button onClick={() => setTypeFilter('全部')} className="ml-1 hover:opacity-70">
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          )}
        </div>

        <div className="relative md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="搜索标题 / 来源 / 学校..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-full bg-background"
          />
        </div>
      </div>

      {/* 文档列表 */}
      {filtered.length > 0 ? (
        <div className="card-surface rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30 border-b">
                <tr>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">类型</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">标题</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3 hidden md:table-cell">来源</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3 hidden lg:table-cell">关联院校</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3 hidden md:table-cell">年份</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(doc => {
                  const style = TYPE_COLOR[doc.type]
                  return (
                    <tr key={doc.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 align-top">
                        <Badge className={cn(style.bg, style.text, style.border, 'border text-[10px] px-1.5 py-0')}>
                          {doc.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 max-w-[300px]">
                        <p className="text-sm font-medium leading-tight truncate">{doc.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{doc.relevance}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{doc.source}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        {doc.schoolName ? (
                          <Badge variant="outline" className="text-[10px]">
                            <Building2 className="h-2.5 w-2.5 mr-0.5" />
                            {doc.schoolName}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell font-numeric">
                        {doc.year ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => setViewingDoc(doc)}
                            className="p-1.5 rounded-md hover:bg-indigo-50 text-indigo-600 transition-colors"
                            title="查看详情"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => toast.info('编辑功能开发中', '后续会接入富文本编辑器')}
                            className="p-1.5 rounded-md hover:bg-amber-50 text-amber-600 transition-colors"
                            title="编辑"
                          >
                            <Upload className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc)}
                            className="p-1.5 rounded-md hover:bg-red-50 text-red-600 transition-colors"
                            title="删除"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        // 空状态
        <div className="card-surface rounded-2xl py-20 text-center">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-lg font-medium mb-1">没有匹配的文档</p>
          <p className="text-sm text-muted-foreground mb-6">试试切换类型或清除搜索关键词</p>
          <Button variant="outline" onClick={() => { setTypeFilter('全部'); setSearch('') }} className="rounded-full">
            重置筛选
          </Button>
        </div>
      )}

      {/* 数据声明 */}
      <p className="text-center text-xs text-muted-foreground">
        💡 当前展示 mock 数据，正式接入后将连接 PostgreSQL + pgvector 知识库
      </p>

      {/* 查看详情弹窗 */}
      {viewingDoc && <DocViewer doc={viewingDoc} onClose={() => setViewingDoc(null)} />}

      {/* 上传文档弹窗 */}
      {showCreate && <DocCreator onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
    </div>
  )
}

// ─── 子组件 ────────────────────────────────────────────────

function StatCard({ icon: Icon, label, value, hint, color, bg }: {
  icon: typeof Database
  label: string
  value: number | string
  hint?: string
  color: string
  bg: string
}) {
  return (
    <div className="card-surface rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', bg)}>
          <Icon className={cn('h-4 w-4', color)} />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className={cn('text-2xl font-bold font-numeric', color)}>{value}</div>
      {hint && <p className="text-[10px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  )
}

function DocViewer({ doc, onClose }: { doc: KnowledgeSource; onClose: () => void }) {
  const style = TYPE_COLOR[doc.type]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in-up" onClick={onClose}>
      <div className="bg-background rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b flex items-start gap-3">
          <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0', style.iconBg)}>
            <FileText className={cn('h-5 w-5', style.text)} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge className={cn(style.bg, style.text, style.border, 'border text-[10px]')}>{doc.type}</Badge>
              {doc.year && <Badge variant="outline" className="text-[10px]">{doc.year}</Badge>}
              {doc.schoolName && <Badge variant="outline" className="text-[10px]">{doc.schoolName}</Badge>}
            </div>
            <h2 className="text-lg font-bold leading-tight">{doc.title}</h2>
            <p className="text-xs text-muted-foreground mt-1">{doc.source}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-4 space-y-4">
          <Section title="相关性说明">
            <p className="text-sm text-foreground/80">{doc.relevance}</p>
          </Section>
          {doc.excerpt && (
            <Section title="原文摘录">
              <p className="text-sm text-foreground/70 italic border-l-2 border-primary/30 pl-3 leading-relaxed">
                "{doc.excerpt}"
              </p>
            </Section>
          )}
          <Section title="向量化信息">
            <div className="grid grid-cols-2 gap-3 text-xs">
              <Field label="文档 ID" value={doc.id} mono />
              <Field label="切片数" value="~75 个" />
              <Field label="Embedding 模型" value="bge-large-zh-v1.5" mono />
              <Field label="向量维度" value="1024" mono />
            </div>
          </Section>
        </div>

        <div className="px-6 py-3 border-t bg-muted/20 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">本接口对应 API: <code className="px-1 bg-background rounded">GET /api/admin/kb/{doc.id}</code></span>
          <Button size="sm" variant="outline" onClick={onClose} className="rounded-full">
            关闭
          </Button>
        </div>
      </div>
    </div>
  )
}

function DocCreator({ onClose, onCreate }: { onClose: () => void; onCreate: (doc: Omit<KnowledgeSource, 'id'>) => void }) {
  const [type, setType] = useState<KnowledgeSourceType>('录取数据')
  const [title, setTitle] = useState('')
  const [source, setSource] = useState('')
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [schoolName, setSchoolName] = useState('')
  const [relevance, setRelevance] = useState('')
  const [excerpt, setExcerpt] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !source.trim() || !relevance.trim()) {
      toast.error('请填写完整必填字段')
      return
    }
    onCreate({
      type,
      title: title.trim(),
      source: source.trim(),
      year,
      schoolName: schoolName.trim() || undefined,
      relevance: relevance.trim(),
      excerpt: excerpt.trim() || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in-up" onClick={onClose}>
      <div className="bg-background rounded-2xl shadow-2xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b flex items-center gap-2">
          <Upload className="h-4 w-4 text-purple-600" />
          <h2 className="font-bold">上传新文档</h2>
          <Badge className="bg-purple-100 text-purple-700 text-[10px] ml-auto mr-3">Mock</Badge>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-4 space-y-4">
          <Field2 label="文档类型 *">
            <div className="grid grid-cols-4 gap-1.5">
              {ALL_TYPES.map(t => {
                const active = t === type
                const style = TYPE_COLOR[t]
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={cn(
                      'px-2 py-1 rounded-md text-[11px] border transition-all',
                      active ? cn(style.bg, style.text, style.border) : 'border-border hover:border-foreground/20 text-muted-foreground'
                    )}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
          </Field2>

          <Field2 label="文档标题 *">
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="例如：西安交通大学 2024 年湖南省招生计划" />
          </Field2>

          <Field2 label="数据来源 *">
            <Input value={source} onChange={e => setSource(e.target.value)} placeholder="例如：西安交通大学本科招生网" />
          </Field2>

          <div className="grid grid-cols-2 gap-3">
            <Field2 label="年份">
              <Input type="number" value={year} onChange={e => setYear(Number(e.target.value))} />
            </Field2>
            <Field2 label="关联院校">
              <Input value={schoolName} onChange={e => setSchoolName(e.target.value)} placeholder="可选" />
            </Field2>
          </div>

          <Field2 label="相关性说明 *">
            <textarea
              className="w-full text-sm border border-input rounded-md px-3 py-2 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-ring"
              value={relevance}
              onChange={e => setRelevance(e.target.value)}
              placeholder="说明本文档在 RAG 检索中的核心相关性"
            />
          </Field2>

          <Field2 label="原文片段（用于切片）">
            <textarea
              className="w-full text-sm border border-input rounded-md px-3 py-2 min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring"
              value={excerpt}
              onChange={e => setExcerpt(e.target.value)}
              placeholder="可选。粘贴文档关键段落，系统会自动切片+向量化"
            />
          </Field2>

          <div className="text-[11px] text-muted-foreground bg-muted/30 rounded-md p-2 flex items-start gap-1.5">
            <ArrowUpRight className="h-3 w-3 flex-shrink-0 mt-0.5" />
            <span>当前为前端 Mock，正式接入后调用 <code className="font-mono">POST /api/admin/kb/upload</code>（multipart），后端自动 OCR + 切片 + Embedding 入库</span>
          </div>
        </form>

        <div className="px-6 py-3 border-t bg-muted/20 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose} className="rounded-full">取消</Button>
          <Button onClick={handleSubmit} className="rounded-full gap-1">
            <Upload className="h-3.5 w-3.5" />
            提交上传
          </Button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold mb-2">{title}</p>
      {children}
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground mb-0.5">{label}</p>
      <p className={cn('text-sm', mono && 'font-mono')}>{value}</p>
    </div>
  )
}

function Field2({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-foreground">{label}</label>
      {children}
    </div>
  )
}
