import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useAppContext } from '@/hooks/useAppContext'
import { mockStudentInfo } from '@/data/mockData'
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

  function toggleSubject(s: SubjectType) {
    const curr = form.subjects ?? []
    setForm(f => ({
      ...f,
      subjects: curr.includes(s) ? curr.filter(x => x !== s) : [...curr, s],
    }))
  }

  function toggleCity(c: string) {
    const curr = form.targetCities ?? []
    setForm(f => ({
      ...f,
      targetCities: curr.includes(c) ? curr.filter(x => x !== c) : [...curr, c],
    }))
  }

  function useMockData() {
    setForm(mockStudentInfo)
    setError('')
  }

  function handleSubmit() {
    if (!form.province) { setError('请选择所在省份'); return }
    if (!form.score || form.score < 0 || form.score > 750) { setError('请输入有效的高考分数（0-750）'); return }
    if (!form.rank || form.rank < 1) { setError('请输入有效的高考位次'); return }
    if (!form.subjects?.length) { setError('请至少选择一个选科'); return }

    setError('')
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
    navigate('/results')
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* 页头 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
          <GraduationCap className="h-4 w-4" />
          高考志愿智能匹配系统
        </div>
        <h1 className="text-3xl font-bold text-foreground mb-2">填写你的高考信息</h1>
        <p className="text-muted-foreground">AI 将根据你的情况，为你推荐最适合的院校专业组合</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">基本信息</CardTitle>
          <CardDescription>请如实填写，分析结果将根据你的实际情况生成</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* 省份 + 分数 + 位次 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="province">所在省份 *</Label>
              <Select value={form.province || undefined} onValueChange={v => setForm(f => ({ ...f, province: v }))}>
                <SelectTrigger id="province">
                  <SelectValue placeholder="请选择省份" />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCES.map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="score">高考分数 *</Label>
              <Input
                id="score"
                type="number"
                min={0}
                max={750}
                placeholder="例如 568"
                value={form.score ?? ''}
                onChange={e => setForm(f => ({ ...f, score: Number(e.target.value) || undefined }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rank">高考位次 *</Label>
              <Input
                id="rank"
                type="number"
                min={1}
                placeholder="例如 15000"
                value={form.rank ?? ''}
                onChange={e => setForm(f => ({ ...f, rank: Number(e.target.value) || undefined }))}
              />
            </div>
          </div>

          <Separator />

          {/* 选科 */}
          <div className="space-y-3">
            <Label>选科类型 *（可多选）</Label>
            <div className="flex flex-wrap gap-3">
              {SUBJECTS.map(s => (
                <div key={s} className="flex items-center gap-2">
                  <Checkbox
                    id={`sub-${s}`}
                    checked={form.subjects?.includes(s)}
                    onCheckedChange={() => toggleSubject(s)}
                  />
                  <Label htmlFor={`sub-${s}`} className="cursor-pointer font-normal">{s}</Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* 目标城市 */}
          <div className="space-y-3">
            <Label>目标城市（可多选，不选则不限）</Label>
            <div className="flex flex-wrap gap-3">
              {CITIES.map(c => (
                <div key={c} className="flex items-center gap-2">
                  <Checkbox
                    id={`city-${c}`}
                    checked={form.targetCities?.includes(c)}
                    onCheckedChange={() => toggleCity(c)}
                  />
                  <Label htmlFor={`city-${c}`} className="cursor-pointer font-normal">{c}</Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* 专业偏好 + 院校偏好 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="major">专业偏好</Label>
              <Input
                id="major"
                placeholder="例如：计算机/电子信息"
                value={form.majorPreference ?? ''}
                onChange={e => setForm(f => ({ ...f, majorPreference: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="schoolPref">院校层次偏好</Label>
              <Select
                value={form.schoolPreference}
                onValueChange={v => setForm(f => ({ ...f, schoolPreference: v as SchoolPreference }))}
              >
                <SelectTrigger id="schoolPref">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['985', '211', '双一流', '普通本科', '不限'] as SchoolPreference[]).map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Separator />

          {/* 是否重视保研 */}
          <div className="flex items-center justify-between">
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
          <div className="space-y-3">
            <Label>风险偏好</Label>
            <div className="grid grid-cols-3 gap-3">
              {RISK_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, riskPreference: opt.value }))}
                  className={[
                    'rounded-lg border p-3 text-left transition-all',
                    form.riskPreference === opt.value
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border hover:border-muted-foreground',
                  ].join(' ')}
                >
                  <div className="font-medium text-sm">{opt.label}</div>
                  <div className="text-xs text-muted-foreground mt-1">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <p className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded-md">{error}</p>
          )}

          {/* 操作按钮 */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button onClick={handleSubmit} className="flex-1 gap-2">
              开始智能匹配
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={useMockData} className="sm:w-auto">
              使用示例数据
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
