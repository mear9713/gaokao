import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  AlertTriangle, Bot, CheckCircle2, FlaskConical, KeyRound,
  Loader2, Plus, RefreshCw, Save, ServerCog, ShieldCheck,
  Star, Trash2, X, Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/toast'
import {
  createAIAPIConfig,
  deleteAIAPIConfig,
  listAIAPIConfigs,
  setDefaultAIAPIConfig,
  testAIAPIConfig,
  testAllAIAPIConfigs,
  updateAIAPIConfig,
  type AIAPIConfig,
  type AIHealthStatus,
  type AIProviderType,
} from '@/services/adminApi'
import { cn } from '@/lib/utils'

const PROVIDER_LABEL: Record<AIProviderType, string> = {
  llm: 'LLM',
  embedding: 'Embedding',
}

const PROVIDER_STYLE: Record<AIProviderType, string> = {
  llm: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  embedding: 'bg-teal-50 text-teal-700 border-teal-200',
}

const HEALTH_STYLE: Record<AIHealthStatus | 'none', { label: string; cls: string }> = {
  healthy: { label: '健康', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  unhealthy: { label: '异常', cls: 'bg-red-50 text-red-700 border-red-200' },
  unknown: { label: '未知', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  none: { label: '未测试', cls: 'bg-slate-50 text-slate-600 border-slate-200' },
}

type FilterType = AIProviderType | 'all'

interface FormState {
  id?: string
  provider_type: AIProviderType
  name: string
  base_url: string
  api_key: string
  model_name: string
  embedding_dim: string
  weight: string
  is_default: boolean
  is_enabled: boolean
}

const emptyForm: FormState = {
  provider_type: 'llm',
  name: '',
  base_url: '',
  api_key: '',
  model_name: '',
  embedding_dim: '',
  weight: '1',
  is_default: false,
  is_enabled: true,
}

function toForm(config: AIAPIConfig): FormState {
  return {
    id: config.id,
    provider_type: config.provider_type,
    name: config.name,
    base_url: config.base_url ?? '',
    api_key: '',
    model_name: config.model_name,
    embedding_dim: config.embedding_dim != null ? String(config.embedding_dim) : '',
    weight: String(config.weight),
    is_default: config.is_default,
    is_enabled: config.is_enabled,
  }
}

function formatDate(v: string | null) {
  if (!v) return '未测试'
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return v
  return d.toLocaleString('zh-CN', { hour12: false })
}

function buildPayload(form: FormState, editing: boolean) {
  const weight = Number(form.weight)
  const embeddingDim = form.embedding_dim ? Number(form.embedding_dim) : null
  return {
    ...(editing ? {} : { provider_type: form.provider_type }),
    name: form.name.trim(),
    base_url: form.base_url.trim() || null,
    ...(form.api_key.trim() ? { api_key: form.api_key.trim() } : {}),
    model_name: form.model_name.trim(),
    embedding_dim: form.provider_type === 'embedding' ? embeddingDim : null,
    weight,
    is_default: form.is_default,
    is_enabled: form.is_enabled,
  }
}

export default function AdminAIConfigPage() {
  const [configs, setConfigs] = useState<AIAPIConfig[]>([])
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState<FilterType>('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testingId, setTestingId] = useState<string | null>(null)
  const [testingAll, setTestingAll] = useState<AIProviderType | null>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)

  const editing = !!form.id

  const loadList = useCallback(async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const resp = await listAIAPIConfigs({
        provider_type: filter === 'all' ? undefined : filter,
        skip: 0,
        limit: 100,
      })
      setConfigs(resp.items)
      setTotal(resp.total)
    } catch (err) {
      setErrorMsg((err as Error).message || '加载 AI API 配置失败')
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { loadList() }, [loadList])

  const stats = useMemo(() => {
    const llm = configs.filter(c => c.provider_type === 'llm').length
    const embedding = configs.filter(c => c.provider_type === 'embedding').length
    const enabled = configs.filter(c => c.is_enabled).length
    const healthy = configs.filter(c => c.last_health_status === 'healthy').length
    return { llm, embedding, enabled, healthy }
  }, [configs])

  function openCreate(type: AIProviderType = 'llm') {
    setForm({ ...emptyForm, provider_type: type })
    setShowForm(true)
  }

  function openEdit(config: AIAPIConfig) {
    setForm(toForm(config))
    setShowForm(true)
  }

  function closeForm() {
    if (saving) return
    setShowForm(false)
    setForm(emptyForm)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { toast.error('请填写配置名称'); return }
    if (!form.model_name.trim()) { toast.error('请填写模型名称'); return }
    if (!editing && !form.api_key.trim()) { toast.error('创建配置时必须填写 API Key'); return }
    const weight = Number(form.weight)
    if (!Number.isInteger(weight) || weight < 1 || weight > 100) {
      toast.error('权重必须是 1-100 的整数')
      return
    }
    if (form.provider_type === 'embedding') {
      const dim = Number(form.embedding_dim)
      if (!Number.isInteger(dim) || dim <= 0) {
        toast.error('Embedding 配置必须填写有效向量维度')
        return
      }
    }

    setSaving(true)
    try {
      const payload = buildPayload(form, editing)
      const saved = editing && form.id
        ? await updateAIAPIConfig(form.id, payload)
        : await createAIAPIConfig(payload)
      setConfigs(prev => {
        const exists = prev.some(c => c.id === saved.id)
        return exists ? prev.map(c => c.id === saved.id ? saved : c) : [saved, ...prev]
      })
      if (!editing) setTotal(t => t + 1)
      toast.success(editing ? '配置已更新' : '配置已创建', saved.name)
      closeForm()
      await loadList()
    } catch (err) {
      toast.error(editing ? '更新失败' : '创建失败', (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(config: AIAPIConfig) {
    if (!confirm(`确认删除「${config.name}」？\n默认配置删除时后端会尝试自动切换到同类型其他启用配置。`)) return
    try {
      await deleteAIAPIConfig(config.id)
      setConfigs(prev => prev.filter(c => c.id !== config.id))
      setTotal(t => Math.max(0, t - 1))
      toast.success('已删除', config.name)
    } catch (err) {
      toast.error('删除失败', (err as Error).message)
    }
  }

  async function handleSetDefault(config: AIAPIConfig) {
    try {
      const updated = await setDefaultAIAPIConfig(config.id)
      setConfigs(prev => prev.map(c =>
        c.provider_type === updated.provider_type
          ? { ...c, is_default: c.id === updated.id }
          : c
      ))
      toast.success('默认配置已切换', updated.name)
      await loadList()
    } catch (err) {
      toast.error('设置默认失败', (err as Error).message)
    }
  }

  async function handleToggleEnabled(config: AIAPIConfig, enabled: boolean) {
    try {
      const updated = await updateAIAPIConfig(config.id, { is_enabled: enabled })
      setConfigs(prev => prev.map(c => c.id === updated.id ? updated : c))
      toast.success(enabled ? '已启用' : '已停用', updated.name)
    } catch (err) {
      toast.error('状态更新失败', (err as Error).message)
    }
  }

  async function handleTest(config: AIAPIConfig) {
    setTestingId(config.id)
    try {
      const result = await testAIAPIConfig(config.id)
      toast[result.ok ? 'success' : 'error'](result.ok ? '测试通过' : '测试失败', result.message)
      await loadList()
    } catch (err) {
      toast.error('测试失败', (err as Error).message)
    } finally {
      setTestingId(null)
    }
  }

  async function handleTestAll(type: AIProviderType) {
    setTestingAll(type)
    try {
      const result = await testAllAIAPIConfigs(type)
      toast[result.ok ? 'success' : 'error'](
        result.ok ? `${PROVIDER_LABEL[type]} 运行时测试通过` : `${PROVIDER_LABEL[type]} 运行时测试失败`,
        result.message,
      )
      await loadList()
    } catch (err) {
      toast.error('批量测试失败', (err as Error).message)
    } finally {
      setTestingAll(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <p className="text-xs uppercase tracking-[0.18em] text-indigo-600 font-semibold">ADMIN · AI API CONFIG</p>
            <Badge className="bg-indigo-100 text-indigo-700 border-indigo-200 text-[10px]">
              <ShieldCheck className="h-2.5 w-2.5 mr-0.5" />
              管理员
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">AI API 配置管理</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            维护 LLM / Embedding 运行时配置，API Key 仅写入后端，不会在前端回显。
          </p>
        </div>
        <div className="flex flex-wrap gap-2 self-start md:self-auto">
          <Button variant="outline" onClick={loadList} disabled={loading} className="rounded-full gap-1.5">
            <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
            刷新
          </Button>
          <Button variant="outline" onClick={() => handleTestAll('llm')} disabled={!!testingAll} className="rounded-full gap-1.5">
            {testingAll === 'llm' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}
            测试 LLM
          </Button>
          <Button variant="outline" onClick={() => handleTestAll('embedding')} disabled={!!testingAll} className="rounded-full gap-1.5">
            {testingAll === 'embedding' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}
            测试 Embedding
          </Button>
          <Button onClick={() => openCreate(filter === 'all' ? 'llm' : filter)} className="rounded-full gap-1.5">
            <Plus className="h-4 w-4" />
            新建配置
          </Button>
        </div>
      </div>

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={Bot} label="LLM 配置" value={stats.llm} hint="文本生成" color="text-indigo-600" bg="bg-indigo-50" />
        <StatCard icon={Zap} label="Embedding 配置" value={stats.embedding} hint="向量模型" color="text-teal-600" bg="bg-teal-50" />
        <StatCard icon={CheckCircle2} label="启用中" value={stats.enabled} hint={`总计 ${total} 条`} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard icon={FlaskConical} label="健康配置" value={stats.healthy} hint="最近测试通过" color="text-purple-600" bg="bg-purple-50" />
      </div>

      <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {([
          { key: 'all', label: '全部' },
          { key: 'llm', label: 'LLM' },
          { key: 'embedding', label: 'Embedding' },
        ] as { key: FilterType; label: string }[]).map(item => {
          const active = filter === item.key
          const count = item.key === 'all' ? total : item.key === 'llm' ? stats.llm : stats.embedding
          return (
            <button
              key={item.key}
              onClick={() => setFilter(item.key)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium border transition-all whitespace-nowrap',
                active
                  ? item.key === 'all'
                    ? 'bg-foreground text-background border-foreground shadow-sm'
                    : `${PROVIDER_STYLE[item.key]} shadow-sm`
                  : 'bg-background text-muted-foreground hover:text-foreground border-border'
              )}
            >
              {item.label} <span className="ml-1 text-xs opacity-70">({count})</span>
            </button>
          )
        })}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card-surface rounded-2xl p-5 space-y-5 border-indigo-200">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">{editing ? '编辑配置' : '新建配置'}</h2>
              <p className="text-xs text-muted-foreground mt-1">
                {editing ? 'API Key 留空表示不修改原密钥。' : '创建时必须填写 API Key，提交后不会回显。'}
              </p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={closeForm}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="配置类型">
              <Select
                value={form.provider_type}
                disabled={editing}
                onValueChange={v => setForm(f => ({ ...f, provider_type: v as AIProviderType, embedding_dim: v === 'llm' ? '' : f.embedding_dim }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="llm">LLM 文本生成</SelectItem>
                  <SelectItem value="embedding">Embedding 向量模型</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="配置名称">
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="例如 DeepSeek 主配置" />
            </Field>
            <Field label="模型名称">
              <Input value={form.model_name} onChange={e => setForm(f => ({ ...f, model_name: e.target.value }))} placeholder="例如 deepseek-chat" />
            </Field>
            <Field label="Base URL">
              <Input value={form.base_url} onChange={e => setForm(f => ({ ...f, base_url: e.target.value }))} placeholder="https://api.example.com/v1" />
            </Field>
            <Field label={editing ? 'API Key（留空不修改）' : 'API Key'}>
              <Input type="password" value={form.api_key} onChange={e => setForm(f => ({ ...f, api_key: e.target.value }))} placeholder={editing ? '保持原密钥' : 'sk-...'} />
            </Field>
            <Field label="权重">
              <Input type="number" min={1} max={100} value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
            </Field>
            {form.provider_type === 'embedding' && (
              <Field label="向量维度">
                <Input type="number" min={1} value={form.embedding_dim} onChange={e => setForm(f => ({ ...f, embedding_dim: e.target.value }))} placeholder="例如 3072" />
              </Field>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <label className="inline-flex items-center gap-2 text-sm">
              <Switch checked={form.is_enabled} onCheckedChange={v => setForm(f => ({ ...f, is_enabled: v }))} />
              启用配置
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <Switch checked={form.is_default} onCheckedChange={v => setForm(f => ({ ...f, is_default: v }))} />
              设为默认
            </label>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={closeForm} disabled={saving}>取消</Button>
            <Button type="submit" disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {editing ? '保存修改' : '创建配置'}
            </Button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="card-surface rounded-2xl py-20 text-center">
          <Loader2 className="h-8 w-8 mx-auto mb-3 text-indigo-500 animate-spin" />
          <p className="text-sm text-muted-foreground">正在加载 AI API 配置...</p>
        </div>
      ) : configs.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {configs.map(config => (
            <ConfigCard
              key={config.id}
              config={config}
              testing={testingId === config.id}
              onEdit={() => openEdit(config)}
              onDelete={() => handleDelete(config)}
              onSetDefault={() => handleSetDefault(config)}
              onToggleEnabled={enabled => handleToggleEnabled(config, enabled)}
              onTest={() => handleTest(config)}
            />
          ))}
        </div>
      ) : (
        <div className="card-surface rounded-2xl py-20 text-center">
          <ServerCog className="h-10 w-10 mx-auto mb-4 text-muted-foreground/40" />
          <p className="text-lg font-medium mb-1">还没有 AI API 配置</p>
          <p className="text-sm text-muted-foreground mb-6">先添加 LLM 或 Embedding 配置，后端运行时会优先读取启用配置。</p>
          <Button onClick={() => openCreate(filter === 'all' ? 'llm' : filter)} className="rounded-full gap-1.5">
            <Plus className="h-4 w-4" />
            新建配置
          </Button>
        </div>
      )}
    </div>
  )
}

function ConfigCard({
  config,
  testing,
  onEdit,
  onDelete,
  onSetDefault,
  onToggleEnabled,
  onTest,
}: {
  config: AIAPIConfig
  testing: boolean
  onEdit: () => void
  onDelete: () => void
  onSetDefault: () => void
  onToggleEnabled: (enabled: boolean) => void
  onTest: () => void
}) {
  const health = HEALTH_STYLE[config.last_health_status ?? 'none']
  return (
    <div className="card-surface rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge className={cn('border text-xs', PROVIDER_STYLE[config.provider_type])}>
              {PROVIDER_LABEL[config.provider_type]}
            </Badge>
            {config.is_default && (
              <Badge className="bg-amber-50 text-amber-700 border-amber-200 border text-xs gap-1">
                <Star className="h-3 w-3" />
                默认
              </Badge>
            )}
            <Badge className={cn('border text-xs', config.is_enabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-600 border-slate-200')}>
              {config.is_enabled ? '启用' : '停用'}
            </Badge>
            <Badge className={cn('border text-xs', health.cls)}>{health.label}</Badge>
          </div>
          <h3 className="text-lg font-semibold truncate">{config.name}</h3>
          <p className="text-xs text-muted-foreground mt-1 font-mono truncate">{config.model_name}</p>
        </div>
        <Switch checked={config.is_enabled} onCheckedChange={onToggleEnabled} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <Info label="Base URL" value={config.base_url || '未填写'} />
        <Info label="权重" value={config.weight} />
        <Info label="API Key" value={config.has_api_key ? '已配置' : '未配置'} icon={<KeyRound className="h-3 w-3" />} />
        <Info label="向量维度" value={config.provider_type === 'embedding' ? (config.embedding_dim ?? '未填写') : '不适用'} />
        <Info label="最近测试" value={formatDate(config.last_health_checked_at)} />
        <Info label="更新时间" value={formatDate(config.updated_at)} />
      </div>

      {config.last_error_message && (
        <div className="rounded-xl border border-red-100 bg-red-50/60 px-3 py-2 text-xs text-red-700">
          {config.last_error_message}
        </div>
      )}

      <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-border/50">
        <Button variant="outline" size="sm" onClick={onTest} disabled={testing} className="rounded-full gap-1.5">
          {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="h-3.5 w-3.5" />}
          测试
        </Button>
        {!config.is_default && (
          <Button variant="outline" size="sm" onClick={onSetDefault} disabled={!config.is_enabled} className="rounded-full gap-1.5">
            <Star className="h-3.5 w-3.5" />
            设默认
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={onEdit} className="rounded-full">
          编辑
        </Button>
        <Button variant="ghost" size="sm" onClick={onDelete} className="rounded-full text-red-600 hover:bg-red-50">
          <Trash2 className="h-3.5 w-3.5 mr-1" />
          删除
        </Button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

function Info({ label, value, icon }: { label: string; value: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-muted/30 px-3 py-2 min-w-0">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-0.5">{label}</p>
      <div className="text-xs font-medium truncate flex items-center gap-1">
        {icon}
        <span className="truncate">{value}</span>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  color,
  bg,
}: {
  icon: typeof Bot
  label: string
  value: number
  hint: string
  color: string
  bg: string
}) {
  return (
    <div className="card-surface rounded-2xl p-4 flex items-center gap-3">
      <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0', bg)}>
        <Icon className={cn('h-5 w-5', color)} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className={cn('text-2xl font-bold font-numeric', color)}>{value}</span>
        </div>
        <p className="text-[10px] text-muted-foreground truncate">{hint}</p>
      </div>
    </div>
  )
}
