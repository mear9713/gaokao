import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap, ArrowRight, Sparkles, Database, Brain, Target,
  ScrollText, BookOpenCheck, MapPin, Award, ChevronDown, Loader2,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/toast'
import { useAppContext } from '@/hooks/useAppContext'
import { mockStudentInfo } from '@/data/mockData'
import { createRecommendation } from '@/services/recommendApi'
import { cn } from '@/lib/utils'
import type { StudentInfo, SubjectType, SchoolPreference } from '@/types'

const PROVINCES = [
  '北京', '上海', '天津', '重庆', '广东', '江苏', '浙江', '山东',
  '四川', '湖南', '湖北', '河南', '河北', '安徽', '福建', '陕西',
  '江西', '辽宁', '黑龙江', '吉林', '云南', '贵州', '广西', '山西',
  '内蒙古', '新疆', '西藏', '青海', '宁夏', '甘肃', '海南',
]

const SUBJECTS: SubjectType[] = ['物理', '化学', '生物', '历史', '地理', '政治']

// 意向专业候选（规范全称，用于后端精确匹配）。"计算机科学与技术"为后端当前主力数据。
const MAJORS = [
  '计算机科学与技术', '软件工程', '人工智能', '数据科学与大数据技术',
  '电子信息工程', '通信工程', '电子科学与技术', '微电子科学与工程',
  '自动化', '电气工程及其自动化', '网络空间安全', '信息安全',
]

// 产品流程 4 步
const WORKFLOW_STEPS = [
  { icon: GraduationCap, title: '输入信息', desc: '分数、位次、选科、偏好' },
  { icon: Brain,          title: 'Agent 分析', desc: '解析学生画像与目标' },
  { icon: Database,       title: 'RAG 检索', desc: '调取招生 / 保研 / 培养方案' },
  { icon: Target,         title: '输出方案', desc: '冲稳保推荐 + 升学规划' },
]

// 数据能力 4 卡
const CAPABILITIES = [
  { icon: GraduationCap,  value: '3000+', label: '院校覆盖',     hint: '985 / 211 / 双一流 / 本科' },
  { icon: BookOpenCheck,  value: '500+',  label: '专业方向',     hint: '工科 / 医科 / 理科 / 文管' },
  { icon: ScrollText,     value: '200+',  label: '政策资料',     hint: '招生 / 保研 / 转专业 / 奖学金' },
  { icon: Award,          value: '12',    label: '推荐维度',     hint: '匹配度 / 风险 / 保研率 / 升学' },
]

export default function InputPage() {
  const navigate = useNavigate()
  const { studentInfo, setStudentInfo, setRecommendationId } = useAppContext()

  const [form, setForm] = useState<Partial<StudentInfo>>(() => ({
    province: studentInfo?.province,
    score: studentInfo?.score,
    rank: studentInfo?.rank ?? null,
    subjects: studentInfo?.subjects ?? [],
    targetProvinces: studentInfo?.targetProvinces ?? [],
    targetMajors: studentInfo?.targetMajors ?? [],
    schoolPreference: studentInfo?.schoolPreference ?? '211',
    careAboutPostgrad: studentInfo?.careAboutPostgrad ?? true,
    riskPreference: studentInfo?.riskPreference ?? '稳妥',
  }))
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // 多选下拉的开/合状态（节省空间，避免一上来一大片 chips）
  const [majorsOpen, setMajorsOpen] = useState(false)
  const [targetProvincesOpen, setTargetProvincesOpen] = useState(false)

  function toggleSubject(s: SubjectType) {
    const curr = form.subjects ?? []
    if (curr.includes(s)) {
      setForm(f => ({ ...f, subjects: curr.filter(x => x !== s) }))
    } else {
      if (curr.length >= 3) {
        toast.warning('高考选科最多选择 3 个科目')
        return
      }
      setForm(f => ({ ...f, subjects: [...curr, s] }))
    }
  }

  function toggleTargetProvince(p: string) {
    const curr = form.targetProvinces ?? []
    setForm(f => ({ ...f, targetProvinces: curr.includes(p) ? curr.filter(x => x !== p) : [...curr, p] }))
  }

  function toggleMajor(m: string) {
    const curr = form.targetMajors ?? []
    setForm(f => ({ ...f, targetMajors: curr.includes(m) ? curr.filter(x => x !== m) : [...curr, m] }))
  }

  function useMockData() {
    setForm(mockStudentInfo)
    setError('')
    toast.info('已填入示例数据', '黑龙江 568 分 · 物化生 · 计算机 · 重视保研')
  }

  function scrollToForm() {
    document.getElementById('student-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function handleSubmit() {
    if (!form.province) { setError('请选择所在省份'); toast.error('请选择所在省份'); return }
    if (!form.score || form.score < 0 || form.score > 750) { setError('请输入有效的高考分数（0-750）'); toast.error('请输入有效的高考分数'); return }
    // 位次不强制（若填了则校验范围）
    if (form.rank != null && form.rank < 1) { setError('位次需大于 0，留空表示不填'); toast.error('位次需大于 0'); return }
    if (!form.subjects?.length || form.subjects.length !== 3) { setError('高考选科必须选择 3 个科目'); toast.error('高考选科必须选择 3 个科目'); return }

    setError('')
    setSubmitting(true)

    const targetMajors = form.targetMajors ?? []
    const info: StudentInfo = {
      province: form.province!,
      score: form.score!,
      rank: form.rank ?? null,
      subjects: form.subjects ?? [],
      targetProvinces: form.targetProvinces ?? [],
      targetMajors,
      majorPreference: targetMajors.join(' / '),
      schoolPreference: (form.schoolPreference ?? '211') as SchoolPreference,
      careAboutPostgrad: form.careAboutPostgrad ?? false,
      // 后端会生成冲/稳/保分组；这里保留默认值只为兼容前端 StudentInfo 类型。
      riskPreference: '稳妥',
      educationGoal: form.careAboutPostgrad ? '保研' : undefined,
    }
    setStudentInfo(info)

    try {
      const recId = await createRecommendation(info)
      setRecommendationId(recId)
      toast.success('画像已提交', '正在为你匹配院校...')
      navigate('/results')
    } catch (err) {
      setSubmitting(false)
      const msg = (err as Error).message || '创建推荐任务失败，请稍后重试'
      setError(msg)
      toast.error('提交失败', msg)
    }
  }

  return (
    <div className="relative">

      {/* ━━━━━━━━━━ HERO 区 ━━━━━━━━━━ */}
      <section className="relative overflow-hidden px-4 pt-12 pb-20 md:pt-20 md:pb-28">
        <div
          className="absolute inset-0 -z-10"
          style={{
            background: 'radial-gradient(ellipse 1000px 500px at 50% 0%, rgba(99, 102, 241, 0.12), transparent 60%)',
          }}
        />

        <div className="max-w-5xl mx-auto text-center">
          <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 text-xs font-medium animate-fade-in-up">
            <Sparkles className="h-3 w-3 mr-1" />
            AI Agent · RAG 知识库 · 升学路径规划
          </Badge>

          <h1 className="mt-6 text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] animate-fade-in-up" style={{ animationDelay: '60ms' }}>
            AI 高考志愿
            <span className="text-gradient-blue ml-2">跃迁规划系统</span>
          </h1>

          <p className="mt-6 text-base md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: '120ms' }}>
            为高考一本分数段学生设计的智能填报助手——
            <br className="hidden md:block" />
            综合<span className="text-foreground font-medium"> 录取数据、保研政策、培养方案 </span>三类知识库，
            生成你的最优志愿组合。
          </p>

          <div className="mt-10 flex flex-wrap gap-3 justify-center animate-fade-in-up" style={{ animationDelay: '180ms' }}>
            <Button size="lg" onClick={scrollToForm} className="rounded-full px-7 gap-1.5 h-12 text-base">
              开始填报
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/chat')} className="rounded-full px-7 gap-1.5 h-12 text-base">
              <Sparkles className="h-4 w-4" />
              直接问 AI
            </Button>
          </div>

          {/* 滚动指示 */}
          <button
            onClick={scrollToForm}
            className="mt-16 text-muted-foreground hover:text-foreground transition-colors text-xs inline-flex items-center gap-1 group animate-fade-in-up"
            style={{ animationDelay: '240ms' }}
          >
            向下了解工作原理
            <ChevronDown className="h-3.5 w-3.5 group-hover:translate-y-0.5 transition-transform" />
          </button>
        </div>
      </section>

      {/* ━━━━━━━━━━ 产品流程 4 步 ━━━━━━━━━━ */}
      <section className="px-4 py-16 md:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-600 font-semibold mb-3">HOW IT WORKS</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">从信息到方案，4 步完成</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {WORKFLOW_STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <div
                  key={i}
                  className="relative card-surface card-hover rounded-2xl p-6 group"
                >
                  {/* 序号 */}
                  <div className="absolute top-4 right-4 text-3xl font-bold text-muted-foreground/15 font-numeric">
                    0{i + 1}
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white mb-4 shadow-lg shadow-indigo-200/50">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-sm md:text-base">{step.title}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1.5 leading-relaxed">{step.desc}</p>
                  {/* 连线箭头（桌面端） */}
                  {i < WORKFLOW_STEPS.length - 1 && (
                    <ArrowRight className="hidden md:block absolute -right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/30 z-10" />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━ 数据能力 ━━━━━━━━━━ */}
      <section className="px-4 py-16 md:py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-600 font-semibold mb-3">DATA CAPABILITY</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">底层数据能力</h2>
            <p className="mt-3 text-muted-foreground">支撑每一个推荐的核心知识资产</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {CAPABILITIES.map((c, i) => {
              const Icon = c.icon
              return (
                <div key={i} className="card-surface rounded-2xl p-5 md:p-6 text-center">
                  <Icon className="h-5 w-5 text-indigo-500 mx-auto mb-3" />
                  <div className="text-3xl md:text-4xl font-bold text-gradient-blue font-numeric">{c.value}</div>
                  <p className="text-sm font-medium mt-2">{c.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{c.hint}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━ 表单 ━━━━━━━━━━ */}
      <section id="student-form" className="px-4 py-16 md:py-20 scroll-mt-20">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-600 font-semibold mb-3">YOUR PROFILE</p>
            <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-3">填写你的高考信息</h2>
            <p className="text-muted-foreground">AI 将根据信息匹配最适合的院校专业组合</p>
          </div>

          <Card className="card-surface border-0 shadow-xl shadow-indigo-100/40">
            <CardContent className="p-6 md:p-8 space-y-7">

              {/* 基本信息 */}
              <FormField label="基本信息" required>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="province" className="text-xs text-muted-foreground">生源地</Label>
                    <Select value={form.province || undefined} onValueChange={v => setForm(f => ({ ...f, province: v }))}>
                      <SelectTrigger id="province" className="h-11"><SelectValue placeholder="省/市/自治区" /></SelectTrigger>
                      <SelectContent>
                        {PROVINCES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="score" className="text-xs text-muted-foreground">高考分数</Label>
                    <Input id="score" type="number" min={0} max={750} placeholder="例如 568"
                      className="h-11 font-numeric"
                      value={form.score ?? ''}
                      onChange={e => setForm(f => ({ ...f, score: Number(e.target.value) || undefined }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="rank" className="text-xs text-muted-foreground">
                      高考位次
                      <span className="ml-1 text-muted-foreground/60">（可不填）</span>
                    </Label>
                    <Input id="rank" type="number" min={1} placeholder="不知道可留空"
                      className="h-11 font-numeric"
                      value={form.rank ?? ''}
                      onChange={e => {
                        const v = e.target.value
                        setForm(f => ({ ...f, rank: v === '' ? null : (Number(v) || null) }))
                      }} />
                  </div>
                </div>
              </FormField>

              <Separator />

              {/* 选科 */}
              <FormField label="选科类型" required hint="多选">
                <div className="flex flex-wrap gap-2">
                  {SUBJECTS.map(s => {
                    const active = form.subjects?.includes(s)
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSubject(s)}
                        className={cn(
                          'px-4 py-2 rounded-xl text-sm font-medium transition-all border',
                          active
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                            : 'bg-background text-foreground border-border hover:border-indigo-300 hover:bg-indigo-50/50'
                        )}
                      >
                        {s}
                      </button>
                    )
                  })}
                </div>
              </FormField>

              <Separator />

              {/* 意向专业（折叠多选下拉） */}
              <FormField label="意向专业" hint="可多选，不选则不限；用于后端精确匹配">
                <MultiSelectDropdown
                  open={majorsOpen}
                  onToggle={() => setMajorsOpen(o => !o)}
                  selected={form.targetMajors ?? []}
                  placeholder="点击选择意向专业（可多选）"
                  emptyLabel="不限"
                  options={MAJORS}
                  onSelect={toggleMajor}
                />
              </FormField>

              <Separator />

              {/* 目标省/直辖市/自治区 —— 折叠多选下拉 */}
              <FormField label="目标省份 / 直辖市 / 自治区" hint="可多选；不选则不限定意向区域">
                <MultiSelectDropdown
                  open={targetProvincesOpen}
                  onToggle={() => setTargetProvincesOpen(o => !o)}
                  selected={form.targetProvinces ?? []}
                  placeholder="点击选择目标地区（可多选）"
                  emptyLabel="不限"
                  options={PROVINCES}
                  onSelect={toggleTargetProvince}
                  showIcon
                />
              </FormField>

              <Separator />

              {/* 院校层次偏好 */}
              <FormField label="院校层次偏好">
                <Select value={form.schoolPreference} onValueChange={v => setForm(f => ({ ...f, schoolPreference: v as SchoolPreference }))}>
                  <SelectTrigger className="h-11 max-w-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(['985', '211', '双一流', '普通本科', '不限'] as SchoolPreference[]).map(v => (
                      <SelectItem key={v} value={v}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>

              <Separator />

              {/* 重视保研 */}
              <div className="flex items-center justify-between rounded-xl bg-muted/40 px-4 py-3">
                <div>
                  <Label htmlFor="postgrad" className="text-sm font-medium">是否重视保研？</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">开启后将优先推荐保研率高的院校</p>
                </div>
                <Switch
                  id="postgrad"
                  checked={form.careAboutPostgrad ?? false}
                  onCheckedChange={v => setForm(f => ({ ...f, careAboutPostgrad: v }))}
                />
              </div>

              {/* 错误提示 */}
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-4 py-2.5 rounded-xl animate-fade-in-up">
                  ⚠️ {error}
                </div>
              )}

              {/* 操作 */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex-1 h-12 text-base rounded-xl gap-1.5"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      正在提交并匹配...
                    </>
                  ) : (
                    <>
                      开始智能匹配
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
                <Button variant="outline" onClick={useMockData} disabled={submitting} className="sm:w-auto h-12 rounded-xl">
                  使用示例数据
                </Button>
              </div>
            </CardContent>
          </Card>

          <p className="text-xs text-center text-muted-foreground mt-6">
            🔒 提交后画像将发送至后端生成个性化推荐；登录态与画像信息保存在本地浏览器
          </p>
        </div>
      </section>

    </div>
  )
}

// ─── 表单字段包装器 ────────────────────────────────────
function FormField({
  label, required, hint, children,
}: {
  label: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <Label className="text-sm font-semibold flex items-center gap-1">
          {label}
          {required && <span className="text-red-500 text-xs">*</span>}
        </Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

// ─── 多选下拉（点击展开/收起，节省纵向空间） ────────────
function MultiSelectDropdown({
  open, onToggle, selected, options, onSelect, placeholder, emptyLabel, showIcon,
}: {
  open: boolean
  onToggle: () => void
  selected: string[]
  options: string[]
  onSelect: (v: string) => void
  placeholder: string
  emptyLabel: string
  showIcon?: boolean
}) {
  const summary =
    selected.length === 0
      ? placeholder
      : selected.length <= 4
        ? `已选 ${selected.length} 项：${selected.join('、')}`
        : `已选 ${selected.length} 项：${selected.slice(0, 4).join('、')} 等`

  return (
    <div className="space-y-2">
      {/* 触发器 */}
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={cn(
          'w-full h-11 px-4 rounded-xl border bg-background text-sm flex items-center justify-between transition-all',
          open
            ? 'border-indigo-400 ring-2 ring-indigo-100'
            : 'border-border hover:border-indigo-300'
        )}
      >
        <span className={cn('truncate', selected.length === 0 ? 'text-muted-foreground' : 'text-foreground')}>
          {summary}
        </span>
        <ChevronDown className={cn('h-4 w-4 text-muted-foreground transition-transform flex-shrink-0 ml-2', open && 'rotate-180')} />
      </button>

      {/* 选项区 */}
      {open && (
        <div className="rounded-xl border border-border bg-muted/20 p-3 animate-fade-in-up">
          <div className="flex flex-wrap gap-1.5">
            {options.map(opt => {
              const active = selected.includes(opt)
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onSelect(opt)}
                  className={cn(
                    'px-2.5 py-1.5 rounded-full text-xs font-medium transition-all border inline-flex items-center gap-1',
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                      : 'bg-background text-muted-foreground border-border hover:border-indigo-300 hover:text-foreground'
                  )}
                >
                  {showIcon && (active ? <CheckCircle2 className="h-3 w-3" /> : <MapPin className="h-3 w-3" />)}
                  {opt}
                </button>
              )
            })}
          </div>
          {selected.length === 0 && (
            <p className="text-[11px] text-muted-foreground mt-2.5">{emptyLabel}</p>
          )}
        </div>
      )}
    </div>
  )
}
