import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart2, GitCompare, MessageSquare, FileText, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { useAppContext } from '@/hooks/useAppContext'
import { mockRecommendations, mockStudentInfo } from '@/data/mockData'
import type { RecommendCategory, AdmissionRisk } from '@/types'

function MatchScoreBadge({ score }: { score: number }) {
  const cls =
    score >= 90
      ? 'text-red-600 font-bold text-base'
      : score >= 80
      ? 'text-blue-600 font-semibold text-base'
      : 'text-gray-400 text-base'
  return <span className={cls}>{score}</span>
}

function CategoryBadge({ cat }: { cat: RecommendCategory }) {
  const map: Record<RecommendCategory, string> = {
    冲刺: 'bg-red-100 text-red-700 border border-red-200',
    稳妥: 'bg-green-100 text-green-700 border border-green-200',
    保底: 'bg-blue-100 text-blue-700 border border-blue-200',
  }
  return <Badge className={map[cat]}>{cat}</Badge>
}

function RiskBadge({ risk }: { risk: AdmissionRisk }) {
  const map: Record<AdmissionRisk, string> = {
    高: 'bg-red-50 text-red-600 border border-red-200',
    中: 'bg-amber-50 text-amber-600 border border-amber-200',
    低: 'bg-green-50 text-green-600 border border-green-200',
  }
  return <Badge className={`text-xs ${map[risk]}`}>{risk}风险</Badge>
}

export default function ResultsPage() {
  const navigate = useNavigate()
  const { studentInfo, selectedSchools, toggleSelectedSchool, clearSelectedSchools } = useAppContext()
  const info = studentInfo ?? mockStudentInfo

  const [filter, setFilter] = useState<RecommendCategory | '全部'>('全部')

  const filtered = filter === '全部'
    ? mockRecommendations
    : mockRecommendations.filter(r => r.category === filter)

  function handleCompare() {
    if (selectedSchools.length < 2) return
    navigate('/compare')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* 学生信息摘要条 */}
      <div className="bg-slate-50 border rounded-lg p-4 mb-6 flex flex-wrap items-center gap-3">
        <span className="text-sm font-medium text-foreground">你的信息：</span>
        <Badge variant="outline">{info.province}省</Badge>
        <Badge variant="outline">📊 {info.score} 分</Badge>
        <Badge variant="outline">📈 位次 {info.rank.toLocaleString()}</Badge>
        <Badge variant="outline">{info.subjects.join('/')}</Badge>
        {info.careAboutPostgrad && <Badge className="bg-purple-100 text-purple-700 border border-purple-200">重视保研</Badge>}
        <Badge className="bg-amber-100 text-amber-700 border border-amber-200">{info.riskPreference}型</Badge>
        <div className="ml-auto flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            修改信息
          </Button>
        </div>
      </div>

      {/* 页面标题 + 操作栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">院校专业推荐结果</h1>
          <Badge variant="secondary">{mockRecommendations.length} 所院校</Badge>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/chat')}>
            <MessageSquare className="h-4 w-4" />
            AI 咨询
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate('/report')}>
            <FileText className="h-4 w-4" />
            规划报告
          </Button>
        </div>
      </div>

      {/* 筛选标签 */}
      <div className="flex gap-2 mb-4">
        {(['全部', '冲刺', '稳妥', '保底'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={[
              'px-3 py-1 rounded-full text-sm font-medium border transition-all',
              filter === f ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:border-primary text-muted-foreground',
            ].join(' ')}
          >
            {f}
            {f !== '全部' && (
              <span className="ml-1 text-xs">({mockRecommendations.filter(r => r.category === f).length})</span>
            )}
          </button>
        ))}
      </div>

      {/* 推荐表格 */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-10">
                  <Checkbox
                    checked={selectedSchools.length === filtered.length && filtered.length > 0}
                    onCheckedChange={checked => {
                      if (checked) {
                        filtered.forEach(r => { if (!selectedSchools.includes(r.id)) toggleSelectedSchool(r.id) })
                      } else {
                        clearSelectedSchools()
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="w-16 text-center">匹配度</TableHead>
                <TableHead>院校名称</TableHead>
                <TableHead>推荐专业</TableHead>
                <TableHead>城市</TableHead>
                <TableHead>层次</TableHead>
                <TableHead className="text-center">类型</TableHead>
                <TableHead className="text-center">风险</TableHead>
                <TableHead className="text-right">往年分数线</TableHead>
                <TableHead className="text-right">往年位次</TableHead>
                <TableHead className="hidden xl:table-cell">保研优势</TableHead>
                <TableHead className="hidden lg:table-cell w-64">推荐理由</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(row => (
                <TableRow
                  key={row.id}
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => navigate(`/detail/${row.id}`)}
                >
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Checkbox
                      checked={selectedSchools.includes(row.id)}
                      onCheckedChange={() => toggleSelectedSchool(row.id)}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <MatchScoreBadge score={row.matchScore} />
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-foreground">{row.schoolName}</span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{row.recommendedMajor}</TableCell>
                  <TableCell className="text-sm">{row.city}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs whitespace-nowrap">{row.schoolLevel}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <CategoryBadge cat={row.category} />
                  </TableCell>
                  <TableCell className="text-center">
                    <RiskBadge risk={row.admissionRisk} />
                  </TableCell>
                  <TableCell className="text-right text-sm font-mono">{row.lastYearScore}</TableCell>
                  <TableCell className="text-right text-sm font-mono text-muted-foreground">
                    {row.lastYearRank.toLocaleString()}
                  </TableCell>
                  <TableCell className="hidden xl:table-cell text-xs text-muted-foreground max-w-[160px] truncate">
                    {row.postgradAdvantage}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground max-w-[200px]">
                    <span className="line-clamp-2">{row.reason}</span>
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* 底部说明 */}
      <div className="mt-4 text-xs text-muted-foreground text-center">
        数据来源：2024年录取数据 · 匹配度由 AI 综合评估 · 仅供参考，请结合省考试院发布的当年数据填报
      </div>

      {/* 浮动对比条 */}
      {selectedSchools.length >= 1 && (
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-40 no-print">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm">
              <GitCompare className="h-4 w-4 text-primary" />
              <span>已选 <strong>{selectedSchools.length}</strong> 所院校</span>
              {selectedSchools.length < 2 && (
                <span className="text-muted-foreground">（再选 {2 - selectedSchools.length} 所即可对比）</span>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={clearSelectedSchools}>清除选择</Button>
              <Button
                size="sm"
                className="gap-1.5"
                disabled={selectedSchools.length < 2}
                onClick={handleCompare}
              >
                <GitCompare className="h-4 w-4" />
                开始对比（{selectedSchools.length} 所）
              </Button>
            </div>
          </div>
          <Separator />
        </div>
      )}

      {/* 底部 padding（避免浮动条遮挡） */}
      {selectedSchools.length >= 1 && <div className="h-16" />}
    </div>
  )
}
