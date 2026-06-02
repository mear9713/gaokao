import { useState, useMemo, useEffect, useCallback } from 'react'
import {
  Database, Search, Plus, Trash2, Filter,
  X, Building2, Upload, BarChart3, ShieldCheck,
  LayoutDashboard, ArrowUpRight, Loader2, RefreshCw,
  CheckCircle2, Clock, AlertTriangle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { toast } from '@/components/ui/toast'
import {
  listFiles, deleteFile, uploadFile,
  listSchools, listMajors,
  DOCUMENT_TYPES,
  type FileItem, type DocumentType, type VectorStatus,
  type School, type Major,
} from '@/services/adminApi'
import { cn } from '@/lib/utils'

// 5 类文档的视觉样式（与后端 DocumentType 严格一致）
const TYPE_COLOR: Record<DocumentType, { bg: string; text: string; border: string; iconBg: string }> = {
  '保研政策':     { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200',  iconBg: 'bg-purple-100' },
  '转专业政策':   { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  iconBg: 'bg-orange-100' },
  '奖学金政策':   { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',   iconBg: 'bg-amber-100' },
  '历年保研去向': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', iconBg: 'bg-emerald-100' },
  '历年就业去向': { bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200',    iconBg: 'bg-teal-100' },
}

const VECTOR_STATUS_STYLE: Record<VectorStatus, { label: string; icon: typeof CheckCircle2; cls: string }> = {
  pending:    { label: '排队中',   icon: Clock,          cls: 'text-amber-600  bg-amber-50  border-amber-200' },
  processing: { label: '处理中',   icon: Loader2,        cls: 'text-blue-600   bg-blue-50   border-blue-200' },
  completed:  { label: '已完成',   icon: CheckCircle2,   cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  failed:     { label: '失败',     icon: AlertTriangle,  cls: 'text-red-600    bg-red-50    border-red-200' },
}

const PAGE_LIMIT = 50

export default function AdminKbPage() {
  const [docs, setDocs] = useState<FileItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const [typeFilter, setTypeFilter] = useState<DocumentType | '全部'>('全部')
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const loadList = useCallback(async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const resp = await listFiles({ skip: 0, limit: PAGE_LIMIT })
      setDocs(resp.items)
      setTotal(resp.total)
    } catch (err) {
      setErrorMsg((err as Error).message || '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadList() }, [loadList])

  // 各类型数量统计（按当前页内文档）
  const typeStats = useMemo(() => {
    const stats: Record<DocumentType, number> = {} as Record<DocumentType, number>
    DOCUMENT_TYPES.forEach(t => stats[t] = 0)
    docs.forEach(d => stats[d.document_type] = (stats[d.document_type] || 0) + 1)
    return stats
  }, [docs])

  // 各向量化状态分布
  const vectorStats = useMemo(() => {
    const s: Record<VectorStatus, number> = { pending: 0, processing: 0, completed: 0, failed: 0 }
    docs.forEach(d => s[d.vector_status] += 1)
    return s
  }, [docs])

  // 客户端过滤 + 搜索（后端只支持 school_id / major_id 过滤，类型 / 关键字在前端做）
  const filtered = useMemo(() => {
    return docs.filter(d => {
      if (typeFilter !== '全部' && d.document_type !== typeFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!d.file_name.toLowerCase().includes(q) &&
            !(d.document_title?.toLowerCase() ?? '').includes(q)) return false
      }
      return true
    })
  }, [docs, typeFilter, search])

  async function handleDelete(doc: FileItem) {
    if (!confirm(`确认删除「${doc.document_title || doc.file_name}」？\n该操作不可恢复，且会同时移除向量库中的所有切片。`)) return
    try {
      await deleteFile(doc.id)
      setDocs(prev => prev.filter(d => d.id !== doc.id))
      setTotal(t => Math.max(0, t - 1))
      toast.success('已删除', doc.file_name)
    } catch (err) {
      toast.error('删除失败', (err as Error).message)
    }
  }

  function handleCreated(newDoc: FileItem) {
    setDocs(prev => [newDoc, ...prev])
    setTotal(t => t + 1)
    setShowCreate(false)
    toast.success('已上传', newDoc.file_name)
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
            管理 Agent 用于检索的文档·后端 `/api/admin/kb` 实时同步
          </p>
        </div>
        <div className="flex gap-2 self-start md:self-auto">
          <Button variant="outline" onClick={loadList} disabled={loading} className="rounded-full gap-1.5">
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            刷新
          </Button>
          <Button onClick={() => setShowCreate(true)} className="rounded-full gap-1.5">
            <Plus className="h-4 w-4" />
            上传新文档
          </Button>
        </div>
      </div>

      {/* 错误条 */}
      {errorMsg && (
        <div className="card-surface rounded-2xl p-4 border-red-200 bg-red-50/40">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900">加载失败</p>
              <p className="text-xs text-red-700 mt-0.5">{errorMsg}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={loadList} className="rounded-full">重试</Button>
          </div>
        </div>
      )}

      {/* 全局统计卡 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Database} label="总文档数" value={total} hint={`本页 ${docs.length} 条`} color="text-indigo-600" bg="bg-indigo-50" />
        <StatCard icon={LayoutDashboard} label="覆盖类型" value={DOCUMENT_TYPES.length} hint="5 类知识源" color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard icon={CheckCircle2} label="已完成切片" value={vectorStats.completed} hint={`处理中 ${vectorStats.processing} · 排队 ${vectorStats.pending}`} color="text-purple-600" bg="bg-purple-50" />
        <StatCard icon={AlertTriangle} label="向量化失败" value={vectorStats.failed} hint={vectorStats.failed > 0 ? '需要排查' : '正常'} color="text-amber-600" bg="bg-amber-50" />
      </div>

      {/* 类型分布 */}
      <div className="card-surface rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-foreground/60" />
          <span className="text-sm font-semibold">按类型分布</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
          {DOCUMENT_TYPES.map(type => {
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
            全部 <span className="ml-1 opacity-70">({docs.length})</span>
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
            placeholder="搜索文件名 / 标题..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-full bg-background"
          />
        </div>
      </div>

      {/* 文档列表 */}
      {loading ? (
        <div className="card-surface rounded-2xl py-20 text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-3 text-indigo-500 animate-spin" />
          <p className="text-sm text-muted-foreground">正在加载知识库文档…</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="card-surface rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/30 border-b">
                <tr>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">类型</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">文件 / 标题</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3 hidden md:table-cell">向量化</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3 hidden lg:table-cell">切片数</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3 hidden md:table-cell">上传时间</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">操作</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(doc => {
                  const style = TYPE_COLOR[doc.document_type]
                  const vs = VECTOR_STATUS_STYLE[doc.vector_status]
                  const VsIcon = vs.icon
                  return (
                    <tr key={doc.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors">
                      <td className="px-4 py-3 align-top">
                        <Badge className={cn(style.bg, style.text, style.border, 'border text-[10px] px-1.5 py-0')}>
                          {doc.document_type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 max-w-[320px]">
                        <p className="text-sm font-medium leading-tight truncate">
                          {doc.document_title || doc.file_name}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          <span className="font-mono">{doc.file_name}</span>
                          <span className="ml-1 uppercase opacity-60">· {doc.file_type}</span>
                        </p>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <Badge className={cn('border text-[10px] inline-flex items-center gap-1', vs.cls)}>
                          <VsIcon className={cn('h-2.5 w-2.5', doc.vector_status === 'processing' && 'animate-spin')} />
                          {vs.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-xs text-muted-foreground font-numeric">
                        {doc.chunk_count}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                        {new Date(doc.created_at).toLocaleString('zh-CN', { hour12: false })}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleDelete(doc)}
                          className="p-1.5 rounded-md hover:bg-red-50 text-red-600 transition-colors"
                          title="删除"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card-surface rounded-2xl py-20 text-center">
          <div className="text-5xl mb-3">📭</div>
          <p className="text-lg font-medium mb-1">{docs.length === 0 ? '知识库还没有文档' : '没有匹配的文档'}</p>
          <p className="text-sm text-muted-foreground mb-6">
            {docs.length === 0 ? '点击「上传新文档」开始构建知识库' : '试试切换类型或清除搜索关键词'}
          </p>
          {docs.length > 0 && (
            <Button variant="outline" onClick={() => { setTypeFilter('全部'); setSearch('') }} className="rounded-full">
              重置筛选
            </Button>
          )}
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        💡 文档上传后由后端自动切片+向量化，状态可在「向量化」列实时查看
      </p>

      {/* 上传弹窗 */}
      {showCreate && <DocCreator onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
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

// ─── 上传表单弹窗 ────────────────────────────────────────
function DocCreator({ onClose, onCreated }: {
  onClose: () => void
  onCreated: (doc: FileItem) => void
}) {
  const [schools, setSchools] = useState<School[]>([])
  const [majors, setMajors] = useState<Major[]>([])
  const [schoolsLoading, setSchoolsLoading] = useState(true)
  const [majorsLoading, setMajorsLoading] = useState(false)

  const [schoolId, setSchoolId] = useState<string>('')
  const [majorId, setMajorId] = useState<string>('__none__')
  const [docType, setDocType] = useState<DocumentType>('保研政策')
  const [docTitle, setDocTitle] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // 加载学校列表
  useEffect(() => {
    let cancelled = false
    setSchoolsLoading(true)
    listSchools({ limit: 100 })
      .then(r => { if (!cancelled) setSchools(r.items) })
      .catch(err => { if (!cancelled) toast.error('学校列表加载失败', (err as Error).message) })
      .finally(() => { if (!cancelled) setSchoolsLoading(false) })
    return () => { cancelled = true }
  }, [])

  // 选了学校后加载对应专业
  useEffect(() => {
    if (!schoolId) { setMajors([]); setMajorId('__none__'); return }
    let cancelled = false
    setMajorsLoading(true)
    listMajors({ school_id: schoolId, limit: 100 })
      .then(r => { if (!cancelled) setMajors(r.items) })
      .catch(err => { if (!cancelled) toast.error('专业列表加载失败', (err as Error).message) })
      .finally(() => { if (!cancelled) setMajorsLoading(false) })
    setMajorId('__none__')
    return () => { cancelled = true }
  }, [schoolId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!schoolId) { toast.error('请选择学校'); return }
    if (!file) { toast.error('请选择文件'); return }
    if (file.size > 50 * 1024 * 1024) { toast.error('文件超过 50MB 限制'); return }

    setSubmitting(true)
    try {
      const created = await uploadFile({
        file,
        school_id: schoolId,
        major_id: majorId === '__none__' ? undefined : majorId,
        document_type: docType,
        document_title: docTitle.trim() || undefined,
      })
      onCreated(created)
    } catch (err) {
      toast.error('上传失败', (err as Error).message)
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in-up" onClick={onClose}>
      <div className="bg-background rounded-2xl shadow-2xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b flex items-center gap-2">
          <Upload className="h-4 w-4 text-purple-600" />
          <h2 className="font-bold">上传新文档</h2>
          <button onClick={onClose} className="ml-auto text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto px-6 py-4 space-y-4">
          {/* 学校 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">所属学校 *</Label>
            {schoolsLoading ? (
              <div className="h-10 flex items-center text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin mr-1.5" /> 加载学校列表中…
              </div>
            ) : schools.length === 0 ? (
              <p className="text-xs text-muted-foreground">暂无学校。请先用后端 Admin API 创建学校。</p>
            ) : (
              <Select value={schoolId || undefined} onValueChange={setSchoolId}>
                <SelectTrigger className="h-10"><SelectValue placeholder="选择学校" /></SelectTrigger>
                <SelectContent>
                  {schools.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      <span className="inline-flex items-center gap-1.5">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        {s.name}
                        <span className="text-[10px] text-muted-foreground">· {s.province}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* 专业（可选） */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">所属专业（可选）</Label>
            <Select value={majorId} onValueChange={setMajorId} disabled={!schoolId || majorsLoading}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder={schoolId ? (majorsLoading ? '加载专业中…' : '选择专业 / 不限') : '请先选择学校'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">不限（学校级文档）</SelectItem>
                {majors.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 文档类型 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">文档类型 *</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {DOCUMENT_TYPES.map(t => {
                const active = t === docType
                const style = TYPE_COLOR[t]
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setDocType(t)}
                    className={cn(
                      'px-2 py-1.5 rounded-md text-[11px] border transition-all',
                      active ? cn(style.bg, style.text, style.border) : 'border-border hover:border-foreground/20 text-muted-foreground'
                    )}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 标题 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">文档标题（可选）</Label>
            <Input value={docTitle} onChange={e => setDocTitle(e.target.value)} placeholder="留空则使用文件名" className="h-10" />
          </div>

          {/* 文件 */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">文件 *（PDF / DOCX / DOC / TXT / MD，≤ 50MB）</Label>
            <Input
              type="file"
              accept=".pdf,.docx,.doc,.txt,.md"
              onChange={e => setFile(e.target.files?.[0] ?? null)}
              className="h-10 cursor-pointer file:mr-2 file:rounded file:border-0 file:bg-muted file:text-xs file:px-2 file:py-1"
            />
            {file && (
              <p className="text-[11px] text-muted-foreground">
                {file.name} · {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            )}
          </div>

          <div className="text-[11px] text-muted-foreground bg-muted/30 rounded-md p-2 flex items-start gap-1.5">
            <ArrowUpRight className="h-3 w-3 flex-shrink-0 mt-0.5" />
            <span>上传后后端自动 OCR + 切片 + 向量化入库，状态在「向量化」列实时刷新</span>
          </div>
        </form>

        <div className="px-6 py-3 border-t bg-muted/20 flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={submitting} className="rounded-full">取消</Button>
          <Button onClick={handleSubmit} disabled={submitting || !schoolId || !file} className="rounded-full gap-1">
            {submitting ? (
              <><Loader2 className="h-3.5 w-3.5 animate-spin" /> 上传中…</>
            ) : (
              <><Upload className="h-3.5 w-3.5" /> 提交上传</>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
