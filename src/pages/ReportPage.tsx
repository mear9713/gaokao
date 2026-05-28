import { useNavigate } from 'react-router-dom'
import { Printer, FileText, AlertTriangle, CheckCircle, Target, TrendingUp, BookOpen, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { useAppContext } from '@/hooks/useAppContext'
import { mockStudentInfo, mockRecommendations } from '@/data/mockData'
import type { RecommendCategory } from '@/types'

function SectionTitle({ icon, title, number }: { icon: React.ReactNode; title: string; number: number }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <div className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
        {number}
      </div>
      <div className="flex items-center gap-1.5">
        {icon}
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
    </div>
  )
}

function CategoryBadge({ cat }: { cat: RecommendCategory }) {
  const map: Record<RecommendCategory, string> = {
    冲刺: 'bg-red-100 text-red-700 border border-red-200',
    稳妥: 'bg-green-100 text-green-700 border border-green-200',
    保底: 'bg-blue-100 text-blue-700 border border-blue-200',
  }
  return <Badge className={`text-xs ${map[cat]}`}>{cat}</Badge>
}

export default function ReportPage() {
  const navigate = useNavigate()
  const { studentInfo } = useAppContext()
  const info = studentInfo ?? mockStudentInfo

  const reachSchools = mockRecommendations.filter(r => r.category === '冲刺')
  const matchSchools = mockRecommendations.filter(r => r.category === '稳妥')
  const safeSchools = mockRecommendations.filter(r => r.category === '保底')

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* 操作栏 */}
      <div className="flex items-center justify-between mb-6 no-print">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">志愿升学规划报告</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/results')}>
            ← 返回结果
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
            打印 / 导出 PDF
          </Button>
        </div>
      </div>

      {/* 报告标题 */}
      <div className="text-center py-6 border rounded-lg mb-6 bg-gradient-to-br from-slate-50 to-blue-50">
        <h2 className="text-2xl font-bold mb-1">高考志愿升学规划报告</h2>
        <p className="text-muted-foreground text-sm">由 AI 智能分析系统生成 · 仅供参考</p>
        <p className="text-xs text-muted-foreground mt-1">生成日期：{new Date().toLocaleDateString('zh-CN')}</p>
      </div>

      <div className="space-y-6">

        {/* 模块 1：学生基本信息 */}
        <Card>
          <CardHeader>
            <SectionTitle number={1} icon={<BookOpen className="h-4 w-4 text-blue-500" />} title="学生基本信息" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: '所在省份', value: info.province },
                { label: '高考分数', value: `${info.score} 分`, highlight: true },
                { label: '高考位次', value: info.rank.toLocaleString() + ' 名', highlight: true },
                { label: '选科类型', value: info.subjects.join('/') },
                { label: '目标城市', value: info.targetCities.length ? info.targetCities.join('、') : '不限' },
                { label: '专业偏好', value: info.majorPreference || '不限' },
                { label: '院校层次', value: info.schoolPreference },
                { label: '是否保研', value: info.careAboutPostgrad ? '✅ 重视保研' : '否' },
              ].map(({ label, value, highlight }) => (
                <div key={label}>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={`text-sm font-semibold mt-0.5 ${highlight ? 'text-primary' : ''}`}>{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 模块 2：推荐院校总表 */}
        <Card>
          <CardHeader>
            <SectionTitle number={2} icon={<Target className="h-4 w-4 text-green-500" />} title="推荐院校总表" />
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>序号</TableHead>
                    <TableHead>院校名称</TableHead>
                    <TableHead>推荐专业</TableHead>
                    <TableHead>城市</TableHead>
                    <TableHead>层次</TableHead>
                    <TableHead className="text-center">类型</TableHead>
                    <TableHead className="text-right">往年分数线</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRecommendations.map((r, i) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-semibold">{r.schoolName}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.recommendedMajor}</TableCell>
                      <TableCell className="text-sm">{r.city}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{r.schoolLevel}</Badge></TableCell>
                      <TableCell className="text-center"><CategoryBadge cat={r.category} /></TableCell>
                      <TableCell className="text-right font-mono text-sm">{r.lastYearScore}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 模块 3：冲刺方案 */}
        <Card className="border-red-200">
          <CardHeader>
            <SectionTitle number={3} icon={<ArrowRight className="h-4 w-4 text-red-500" />} title="冲刺方案" />
          </CardHeader>
          <CardContent>
            <div className="bg-red-50 border border-red-100 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-700 font-medium">🔥 冲刺策略说明</p>
              <p className="text-sm text-red-600 mt-1">
                以下院校往年录取分数线高于你的成绩 5-20 分，属于有一定难度的冲刺目标。建议填报 1-2 所作为冲刺志愿，放在志愿序列靠前位置。
              </p>
            </div>
            <div className="space-y-3">
              {reachSchools.map(r => (
                <div key={r.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{r.schoolName}</span>
                      <Badge variant="outline" className="text-xs">{r.schoolLevel}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{r.recommendedMajor} · {r.city} · 往年分数线 {r.lastYearScore}</p>
                    <p className="text-xs text-foreground mt-1">{r.reason}</p>
                  </div>
                  <span className="text-2xl font-bold text-red-500 flex-shrink-0">{r.matchScore}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 模块 4：稳妥方案 */}
        <Card className="border-green-200">
          <CardHeader>
            <SectionTitle number={4} icon={<CheckCircle className="h-4 w-4 text-green-500" />} title="稳妥方案" />
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-4">
              <p className="text-sm text-green-700 font-medium">✅ 稳妥策略说明</p>
              <p className="text-sm text-green-600 mt-1">
                以下院校往年录取分数线与你的成绩基本持平（±5分以内），录取概率较高，是志愿填报的核心主力选项。
              </p>
            </div>
            <div className="space-y-3">
              {matchSchools.map(r => (
                <div key={r.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{r.schoolName}</span>
                      <Badge variant="outline" className="text-xs">{r.schoolLevel}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{r.recommendedMajor} · {r.city} · 往年分数线 {r.lastYearScore}</p>
                    <p className="text-xs text-foreground mt-1">{r.reason}</p>
                  </div>
                  <span className="text-2xl font-bold text-green-600 flex-shrink-0">{r.matchScore}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 模块 5：保底方案 */}
        <Card className="border-blue-200">
          <CardHeader>
            <SectionTitle number={5} icon={<CheckCircle className="h-4 w-4 text-blue-500" />} title="保底方案" />
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-700 font-medium">🛡️ 保底策略说明</p>
              <p className="text-sm text-blue-600 mt-1">
                以下院校往年录取分数线低于你 10 分以上，基本可确保录取，是防止滑档的兜底选项，建议在志愿序列末尾配置 2-3 所。
              </p>
            </div>
            <div className="space-y-3">
              {safeSchools.map(r => (
                <div key={r.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{r.schoolName}</span>
                      <Badge variant="outline" className="text-xs">{r.schoolLevel}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{r.recommendedMajor} · {r.city} · 往年分数线 {r.lastYearScore}</p>
                    <p className="text-xs text-foreground mt-1">{r.reason}</p>
                  </div>
                  <span className="text-2xl font-bold text-blue-600 flex-shrink-0">{r.matchScore}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 模块 6：专业选择建议 */}
        <Card>
          <CardHeader>
            <SectionTitle number={6} icon={<BookOpen className="h-4 w-4 text-purple-500" />} title="专业选择建议" />
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-foreground leading-relaxed">
              根据你的选科（物理、化学、生物）和专业偏好（计算机/电子信息），推荐以下专业方向：
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { name: '电子信息工程', pros: '就业面广，保研+就业两全', level: '首选' },
                { name: '计算机科学与技术', pros: '薪资天花板高，AI方向热门', level: '次选' },
                { name: '自动化', pros: '工科底蕴深，新能源汽车方向', level: '备选' },
              ].map(p => (
                <div key={p.name} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm">{p.name}</span>
                    <Badge variant="secondary" className="text-xs">{p.level}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{p.pros}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 模块 7：保研升学路线 */}
        <Card>
          <CardHeader>
            <SectionTitle number={7} icon={<TrendingUp className="h-4 w-4 text-amber-500" />} title="保研升学路线规划" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { step: '大一', color: 'bg-blue-100 text-blue-700', content: '适应大学节奏，稳住专业成绩，争取GPA全班前30%。参加1-2个院系级竞赛积累经验。' },
                { step: '大二', color: 'bg-purple-100 text-purple-700', content: '冲刺专业排名前20%，参加全国性竞赛（数学建模/ACM等），进入导师实验室参与科研项目。' },
                { step: '大三', color: 'bg-amber-100 text-amber-700', content: '保持排名，准备保研材料（科研经历、竞赛获奖、英语成绩），参加夏令营申请顶尖高校。' },
                { step: '大四', color: 'bg-green-100 text-green-700', content: '完成保研录取，确认目标院校和导师，开始提前接触研究方向，顺利完成本科毕业论文。' },
              ].map(({ step, color, content }) => (
                <div key={step} className="flex gap-3">
                  <div className={`${color} rounded-full px-3 py-1 text-xs font-bold flex-shrink-0 h-fit mt-0.5`}>
                    {step}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{content}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 模块 8：风险提示 */}
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <SectionTitle number={8} icon={<AlertTriangle className="h-4 w-4 text-amber-600" />} title="风险提示" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              '本报告推荐数据来源于 2024 年，每年分数线存在波动，请务必结合当年省考试院发布的最新数据进行决策。',
              '平行志愿填报建议遵循"冲稳保"策略，不要将志愿全部设为同一难度级别，避免全部落榜或全部保底的极端情况。',
              '保研率仅为参考，最终能否保研取决于大学四年的成绩排名、竞赛成果和科研经历，需要持续努力。',
              '城市选择会影响就业机会，建议综合考虑学校质量和城市就业生态，不要为了名气选择不喜欢的城市或专业。',
            ].map((tip, i) => (
              <div key={i} className="flex gap-2 text-sm text-amber-800">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <span>{tip}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* 模块 9：下一步行动建议 */}
        <Card>
          <CardHeader>
            <SectionTitle number={9} icon={<ArrowRight className="h-4 w-4 text-primary" />} title="下一步行动建议" />
          </CardHeader>
          <CardContent>
            <ol className="space-y-3">
              {[
                '登录所在省份招生考试院官网，下载当年院校专业组投档分数线参考表',
                '对照本报告的推荐院校，逐一查看今年的招生计划和专业调整情况',
                '在"AI 咨询"页面针对你最感兴趣的 2-3 所院校进行深度问答',
                '前往"院校对比"页面将最终候选院校进行横向比较，做出最终决策',
                '志愿填报截止日期前，与家长/老师充分沟通，完成最终填报',
              ].map((action, i) => (
                <li key={i} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">{action}</p>
                </li>
              ))}
            </ol>
            <Separator className="my-4" />
            <div className="flex gap-3 no-print">
              <Button variant="outline" className="flex-1" onClick={() => navigate('/compare')}>查看院校对比</Button>
              <Button className="flex-1" onClick={() => navigate('/chat')}>继续 AI 咨询</Button>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* 页脚 */}
      <div className="mt-8 text-center text-xs text-muted-foreground border-t pt-4">
        本报告由高考志愿 AI Agent 系统生成 · 数据来源于公开录取信息 · 仅供参考，不构成最终填报建议
      </div>
    </div>
  )
}
