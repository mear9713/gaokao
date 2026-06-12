import { useCallback, useEffect, useMemo, useState, type ComponentType } from 'react'
import {
  AlertTriangle,
  Clock,
  FileText,
  Info,
  Loader2,
  RefreshCw,
  Search,
  Server,
  ShieldCheck,
  Terminal,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  listSystemLogs,
  type SystemLogItem,
  type SystemLogLevel,
} from '@/services/adminApi'
import { cn } from '@/lib/utils'

type LevelFilter = 'all' | SystemLogLevel

const LEVEL_FILTERS: { value: LevelFilter; label: string }[] = [
  { value: 'all', label: '全部级别' },
  { value: 'DEBUG', label: 'DEBUG' },
  { value: 'INFO', label: 'INFO' },
  { value: 'WARNING', label: 'WARNING' },
  { value: 'ERROR', label: 'ERROR' },
  { value: 'CRITICAL', label: 'CRITICAL' },
]

const SOURCE_FILTERS = [
  { value: 'all', label: '全部来源' },
  { value: 'app', label: '后端 API' },
  { value: 'workers', label: '后台任务' },
  { value: 'recommendation', label: '推荐任务' },
  { value: 'vectorization', label: '知识库向量化' },
  { value: 'llm', label: '模型调用' },
]

const LIMIT_OPTIONS = [100, 200, 500]

const LEVEL_STYLE: Record<string, { cls: string; icon: ComponentType<{ className?: string }> }> = {
  DEBUG: { cls: 'bg-slate-50 text-slate-600 border-slate-200', icon: Terminal },
  INFO: { cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: Info },
  WARNING: { cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle },
  ERROR: { cls: 'bg-red-50 text-red-700 border-red-200', icon: AlertTriangle },
  CRITICAL: { cls: 'bg-red-100 text-red-800 border-red-300', icon: AlertTriangle },
}

function getLevelStyle(level: string) {
  return LEVEL_STYLE[level] ?? LEVEL_STYLE.INFO
}

function formatTime(value: string) {
  if (!value) return '-'
  const normalized = value.replace(' ', 'T').replace(',', '.')
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('zh-CN', { hour12: false })
}

function getErrorMessage(err: unknown) {
  const apiErr = err as Error & { status?: number }
  if (apiErr.status === 404) {
    return '后端日志接口 /api/v1/admin/logs 暂未接入'
  }
  return apiErr.message || '系统日志加载失败'
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<SystemLogItem[]>([])
  const [total, setTotal] = useState(0)
  const [level, setLevel] = useState<LevelFilter>('all')
  const [source, setSource] = useState('all')
  const [limit, setLimit] = useState(200)
  const [searchText, setSearchText] = useState('')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  const loadLogs = useCallback(async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const resp = await listSystemLogs({
        level: level === 'all' ? undefined : level,
        source: source === 'all' ? undefined : source,
        q: query || undefined,
        limit,
      })
      setLogs(resp.items)
      setTotal(resp.total)
    } catch (err) {
      setLogs([])
      setTotal(0)
      setErrorMsg(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [level, source, query, limit])

  useEffect(() => { loadLogs() }, [loadLogs])

  const stats = useMemo(() => {
    const errors = logs.filter(item => item.level === 'ERROR' || item.level === 'CRITICAL').length
    const warnings = logs.filter(item => item.level === 'WARNING').length
    const info = logs.filter(item => item.level === 'INFO').length
    const latest = logs[0]?.timestamp ? formatTime(logs[0].timestamp) : '-'
    return { errors, warnings, info, latest }
  }, [logs])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const nextQuery = searchText.trim()
    if (nextQuery === query) {
      loadLogs()
      return
    }
    setQuery(nextQuery)
  }

  function resetFilters() {
    setLevel('all')
    setSource('all')
    setSearchText('')
    setQuery('')
    setLimit(200)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <p className="text-xs uppercase tracking-[0.18em] text-slate-600 font-semibold">ADMIN / SYSTEM LOGS</p>
            <Badge className="bg-slate-100 text-slate-700 border-slate-200 text-[10px]">
              <ShieldCheck className="h-2.5 w-2.5 mr-0.5" />
              管理员
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">系统日志</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            后端 API、推荐任务、知识库向量化的最近运行记录
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start md:self-auto">
          <Button variant="outline" onClick={resetFilters} disabled={loading} className="rounded-full">
            重置
          </Button>
          <Button onClick={loadLogs} disabled={loading} className="rounded-full gap-1.5">
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            刷新
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={AlertTriangle} label="错误" value={stats.errors} color="text-red-600" bg="bg-red-50" />
        <StatCard icon={AlertTriangle} label="警告" value={stats.warnings} color="text-amber-600" bg="bg-amber-50" />
        <StatCard icon={Info} label="信息" value={stats.info} color="text-blue-600" bg="bg-blue-50" />
        <StatCard icon={Clock} label="最新时间" value={stats.latest} color="text-emerald-600" bg="bg-emerald-50" compact />
      </div>

      <form onSubmit={handleSearch} className="card-surface rounded-2xl p-4">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(140px,180px)_minmax(150px,200px)_minmax(100px,140px)_1fr_auto] gap-3">
          <Select value={level} onValueChange={v => setLevel(v as LevelFilter)}>
            <SelectTrigger className="w-full h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LEVEL_FILTERS.map(item => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="w-full h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SOURCE_FILTERS.map(item => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={String(limit)} onValueChange={v => setLimit(Number(v))}>
            <SelectTrigger className="w-full h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LIMIT_OPTIONS.map(item => (
                <SelectItem key={item} value={String(item)}>{item} 条</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="搜索日志内容、logger、进程"
              className="pl-9 h-10 rounded-full"
            />
          </div>

          <Button type="submit" disabled={loading} className="rounded-full gap-1.5">
            <Search className="h-3.5 w-3.5" />
            搜索
          </Button>
        </div>
      </form>

      {errorMsg && (
        <div className="card-surface rounded-2xl p-4 border-red-200 bg-red-50/40">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-900">加载失败</p>
              <p className="text-xs text-red-700 mt-0.5 break-words">{errorMsg}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={loadLogs} className="rounded-full">重试</Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="card-surface rounded-2xl py-20 text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-3 text-slate-500 animate-spin" />
          <p className="text-sm text-muted-foreground">正在加载系统日志...</p>
        </div>
      ) : logs.length > 0 ? (
        <div className="card-surface rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold">最近日志</span>
              <Badge variant="outline" className="text-[10px]">{total} 条匹配</Badge>
            </div>
            {query && (
              <Badge className="bg-slate-100 text-slate-700 border-slate-200 border text-[10px] max-w-full truncate">
                关键词：{query}
              </Badge>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px]">
              <thead className="bg-muted/30 border-b">
                <tr>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3 w-[170px]">时间</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3 w-[110px]">级别</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3 w-[220px]">来源</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground uppercase tracking-wide px-4 py-3">内容</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((item, index) => (
                  <LogRow key={`${item.timestamp}-${item.logger}-${index}`} item={item} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card-surface rounded-2xl py-20 text-center">
          <Server className="h-10 w-10 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-lg font-medium mb-1">暂无日志</p>
          <p className="text-sm text-muted-foreground mb-6">当前筛选条件下没有匹配记录</p>
          <Button variant="outline" onClick={resetFilters} className="rounded-full">重置筛选</Button>
        </div>
      )}
    </div>
  )
}

function LogRow({ item }: { item: SystemLogItem }) {
  const style = getLevelStyle(item.level)
  const Icon = style.icon

  return (
    <tr className="border-b border-border/40 hover:bg-muted/20 transition-colors">
      <td className="px-4 py-3 align-top text-xs text-muted-foreground font-numeric whitespace-nowrap">
        {formatTime(item.timestamp)}
      </td>
      <td className="px-4 py-3 align-top">
        <Badge className={cn('border text-[10px] inline-flex items-center gap-1', style.cls)}>
          <Icon className="h-2.5 w-2.5" />
          {item.level}
        </Badge>
      </td>
      <td className="px-4 py-3 align-top">
        <div className="space-y-1 max-w-[210px]">
          <p className="text-xs font-mono truncate">{item.logger || '-'}</p>
          <p className="text-[10px] text-muted-foreground font-mono truncate">{item.process || '-'}</p>
        </div>
      </td>
      <td className="px-4 py-3 align-top">
        <pre className="max-w-[620px] whitespace-pre-wrap break-words text-xs leading-relaxed font-mono text-foreground/90">
          {item.message || item.raw}
        </pre>
      </td>
    </tr>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
  compact = false,
}: {
  icon: ComponentType<{ className?: string }>
  label: string
  value: number | string
  color: string
  bg: string
  compact?: boolean
}) {
  return (
    <div className="card-surface rounded-2xl p-4 flex items-center gap-3 min-w-0">
      <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0', bg)}>
        <Icon className={cn('h-5 w-5', color)} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={cn(compact ? 'text-sm' : 'text-2xl', 'font-bold font-numeric truncate', color)}>
          {value}
        </p>
      </div>
    </div>
  )
}
