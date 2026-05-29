import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  GraduationCap, ArrowRight, Sparkles, Database, Brain, Target,
  ScrollText, BookOpenCheck, MapPin, Award, ChevronDown, Loader2,
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
import { cn } from '@/lib/utils'
import type { StudentInfo, SubjectType, RiskPreference, SchoolPreference } from '@/types'

const PROVINCES = [
  '北京', '上海', '天津', '重庆', '广东', '江苏', '浙江', '山东',
  '四川', '湖南', '湖北', '河南', '河北', '安徽', '福建', '陕西',
  '江西', '辽宁', '黑龙江', '吉林', '云南', '贵州', '广西', '山西',
  '内蒙古', '新疆', '西藏', '青海', '宁夏', '甘肃', '海南',
]

const CITIES = ['北京', '上海', '广州', '深圳', '成都', '武汉', '南京', '杭州', '长沙', '西安', '哈尔滨', '合肥']
const SUBJECTS: SubjectType[] = ['物理', '化学', '生物', '历史', '地理', '政治']
const RISK_OPTIONS: { value: RiskPreference; label: string; desc: string }[] = [
  { value: '冲刺', label: '冲刺', desc: '愿意冒险，目标高校层次尽量高' },
  { value: '稳妥', label: '稳妥', desc: '录取为主，兼顾学校质量' },
  { value: '保底', label: '保底', desc: '确保录取，不接受落榜风险' },
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
  const { setStudentInfo } = useAppContext()

  const [form, setForm] = useState<Partial<StudentInfo>>({
    province: undefined,
    score: undefined,
    rank: undefined,
    subjects: [],
    targetCities: [],
    majorPreference: '',
    schoolPreference: '211',
    careAboutPostgrad: true,
    riskPreference: '稳妥',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function toggleSubject(s: SubjectType) {
    const curr = form.subjects ?? []
    setForm(f => ({ ...f, subjects: curr.includes(s) ? curr.filter(x => x !== s) : [...curr, s] }))
  }

  function toggleCity(c: string) {
    const curr = form.targetCities ?? []
    setForm(f => ({ ...f, targetCities: curr.includes(c) ? curr.filter(x => x !== c) : [...curr, c] }))
  }

  function useMockData() {
    setForm(mockStudentInfo)
    setError('')
    toast.info('已填入示例数据', '湖南 568 分 · 物化生 · 重视保研')
  }

  function scrollToForm() {
    document.getElementById('student-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleSubmit() {
    if (!form.province) { setError('请选择所在省份'); toast.error('请选择所在省份'); return }
    if (!form.score || form.score < 0 || form.score > 750) { setError('请输入有效的高考分数（0-750）'); toast.error('请输入有效的高考分数'); return }
    if (!form.rank || form.rank < 1) { setError('请输入有效的高考位次'); toast.error('请输入有效的高考位次'); return }
    if (!form.subjects?.length) { setError('请至少选择一个选科'); toast.error('请至少选择一个选科'); return }

    setError('')
    setSubmitting(true)
    const info: StudentInfo = {
      province: form.province!,
      score: form.score!,
      rank: form.rank!,
      subjects: form.subjects ?? [],
      targetCities: form.targetCities ?? [],
      majorPreference: form.majorPreference ?? '',
      schoolPreference: (form.schoolPreference ?? '211') as SchoolPreference,
      careAboutPostgrad: form.careAboutPostgrad ?? false,
      riskPreference: (form.riskPreference ?? '稳妥') as RiskPreference,
    }
    setStudentInfo(info)
    toast.success('画像已生成', '正在为你匹配院校...')
    setTimeout(() => navigate('/results'), 600)
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
                    <Label htmlFor="province" className="text-xs text-muted-foreground">所在省份</Label>
                    <Select value={form.province || undefined} onValueChange={v => setForm(f => ({ ...f, province: v }))}>
                      <SelectTrigger id="province" className="h-11"><SelectValue placeholder="请选择" /></SelectTrigger>
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
                    <Label htmlFor="rank" className="text-xs text-muted-foreground">高考位次</Label>
                    <Input id="rank" type="number" min={1} placeholder="例如 15000"
                      className="h-11 font-numeric"
                      value={form.rank ?? ''}
                      onChange={e => setForm(f => ({ ...f, rank: Number(e.target.value) || undefined }))} />
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

              {/* 目标城市 */}
              <FormField label="目标城市" hint="可多选，不选则不限">
                <div className="flex flex-wrap gap-2">
                  {CITIES.map(c => {
                    const active = form.targetCities?.includes(c)
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleCity(c)}
                        className={cn(
                          'px-3 py-1.5 rounded-full text-xs font-medium transition-all border inline-flex items-center gap-1',
                          active
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-background text-muted-foreground border-border hover:border-indigo-300 hover:text-foreground'
                        )}
                      >
                        <MapPin className="h-3 w-3" />
                        {c}
                      </button>
                    )
                  })}
                </div>
              </FormField>

              <Separator />

              {/* 偏好双列 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <FormField label="专业偏好">
                  <Input
                    placeholder="例如：计算机/电子信息"
                    className="h-11"
                    value={form.majorPreference ?? ''}
                    onChange={e => setForm(f => ({ ...f, majorPreference: e.target.value }))}
                  />
                </FormField>
                <FormField label="院校层次偏好">
                  <Select value={form.schoolPreference} onValueChange={v => setForm(f => ({ ...f, schoolPreference: v as SchoolPreference }))}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(['985', '211', '双一流', '普通本科', '不限'] as SchoolPreference[]).map(v => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormField>
              </div>

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

              <Separator />

              {/* 风险偏好 */}
              <FormField label="风险偏好">
                <div className="grid grid-cols-3 gap-3">
                  {RISK_OPTIONS.map(opt => {
                    const active = form.riskPreference === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, riskPreference: opt.value }))}
                        className={cn(
                          'rounded-xl border p-3 text-left transition-all',
                          active
                            ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-100'
                            : 'border-border hover:border-indigo-300 bg-background'
                        )}
                      >
                        <div className="font-semibold text-sm">{opt.label}</div>
                        <div className="text-xs text-muted-foreground mt-1 leading-tight">{opt.desc}</div>
                      </button>
                    )
                  })}
                </div>
              </FormField>

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
                      正在生成画像...
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
            🔒 所有信息仅在本地浏览器存储，不会上传任何服务器
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
