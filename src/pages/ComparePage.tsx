import { useNavigate } from 'react-router-dom'
import { GitCompare, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useAppContext } from '@/hooks/useAppContext'
import { mockSchoolDetails, mockRecommendations } from '@/data/mockData'

const COMPARE_METRICS = [
  { key: 'schoolLevel', label: '院校层次' },
  { key: 'city', label: '所在城市' },
  { key: 'majorName', label: '推荐专业' },
  { key: 'lastYearScore', label: '往年录取分数线' },
  { key: 'lastYearRank', label: '往年录取位次' },
  { key: 'postgradRate', label: '学校整体保研率' },
  { key: 'majorPostgradRate', label: '专业保研率' },
  { key: 'honorsClassRate', label: '特色班保研率' },
  { key: 'disciplineStrengths', label: '学科优势' },
  { key: 'employmentDirection', label: '就业方向' },
  { key: 'postgradDirection', label: '升学方向' },
  { key: 'category', label: '推荐类型' },
] as const

type MetricKey = typeof COMPARE_METRICS[number]['key']

function getMetricValue(schoolId: string, key: MetricKey): string {
  const detail = mockSchoolDetails.find(s => s.id === schoolId)
  const rec = mockRecommendations.find(r => r.id === schoolId)

  if (!detail && !rec) return '—'

  switch (key) {
    case 'schoolLevel': return detail?.schoolLevel ?? rec?.schoolLevel ?? '—'
    case 'city': return detail?.city ?? rec?.city ?? '—'
    case 'majorName': return detail?.majorDetail.name ?? rec?.recommendedMajor ?? '—'
    case 'lastYearScore': return rec ? `${rec.lastYearScore} 分` : '—'
    case 'lastYearRank': return rec ? `${rec.lastYearRank.toLocaleString()} 名` : '—'
    case 'postgradRate': return detail ? `${detail.majorDetail.postgradRate}%` : '—'
    case 'majorPostgradRate': return detail ? `${detail.majorDetail.majorPostgradRate}%` : '—'
    case 'honorsClassRate': return detail?.majorDetail.honorsClassRate !== undefined
      ? `${detail.majorDetail.honorsClassRate}%` : '暂无特色班'
    case 'disciplineStrengths': return detail?.disciplineStrengths.slice(0, 3).join('、') ?? '—'
    case 'employmentDirection': return detail ? detail.majorDetail.employmentDirection.slice(0, 50) + '...' : '—'
    case 'postgradDirection': return detail ? detail.majorDetail.postgradDirection.slice(0, 50) + '...' : '—'
    case 'category': return rec?.category ?? '—'
    default: return '—'
  }
}

function CategoryBadge({ value }: { value: string }) {
  if (value === '冲刺') return <Badge className="bg-red-100 text-red-700 border border-red-200 text-xs">{value}</Badge>
  if (value === '稳妥') return <Badge className="bg-green-100 text-green-700 border border-green-200 text-xs">{value}</Badge>
  if (value === '保底') return <Badge className="bg-blue-100 text-blue-700 border border-blue-200 text-xs">{value}</Badge>
  return <span className="text-sm">{value}</span>
}

export default function ComparePage() {
  const navigate = useNavigate()
  const { selectedSchools, clearSelectedSchools } = useAppContext()

  // 合并详情库中有的 + 推荐列表中有的学校名称
  const schools = selectedSchools.map(id => {
    const detail = mockSchoolDetails.find(s => s.id === id)
    const rec = mockRecommendations.find(r => r.id === id)
    return { id, name: detail?.schoolName ?? rec?.schoolName ?? id }
  })

  if (schools.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <GitCompare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">暂无对比数据</h2>
        <p className="text-muted-foreground mb-6">
          请先在推荐结果页勾选 2 所或以上院校，再点击"开始对比"
        </p>
        <Button onClick={() => navigate('/results')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回推荐结果
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* 页头 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <GitCompare className="h-5 w-5 text-primary" />
          <h1 className="text-xl font-bold">院校专业横向对比</h1>
          <Badge variant="secondary">已选 {schools.length} 所</Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/results')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            返回结果
          </Button>
          <Button variant="ghost" size="sm" onClick={clearSelectedSchools}>
            清除选择
          </Button>
        </div>
      </div>

      {/* 对比表格 */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-32 sticky left-0 bg-muted/50 z-10 font-semibold">对比指标</TableHead>
                  {schools.map(s => (
                    <TableHead key={s.id} className="min-w-[180px] text-center">
                      <div className="space-y-1">
                        <p className="font-bold text-foreground">{s.name}</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs text-primary"
                          onClick={() => navigate(`/detail/${s.id}`)}
                        >
                          查看详情 →
                        </Button>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {COMPARE_METRICS.map((metric, idx) => (
                  <TableRow key={metric.key} className={idx % 2 === 0 ? '' : 'bg-muted/20'}>
                    <TableCell className="sticky left-0 bg-background font-medium text-sm text-muted-foreground z-10 border-r">
                      {metric.label}
                    </TableCell>
                    {schools.map(s => {
                      const val = getMetricValue(s.id, metric.key)
                      return (
                        <TableCell key={s.id} className="text-center text-sm align-top">
                          {metric.key === 'category' ? (
                            <CategoryBadge value={val} />
                          ) : (
                            <span className={[
                              metric.key === 'postgradRate' || metric.key === 'majorPostgradRate' || metric.key === 'honorsClassRate'
                                ? 'font-semibold text-primary' : '',
                              metric.key === 'lastYearScore' || metric.key === 'lastYearRank'
                                ? 'font-mono' : '',
                            ].join(' ')}>
                              {val}
                            </span>
                          )}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center mt-4">
        数据来源：2024年各院校官网及招生简章，仅供参考
      </p>
    </div>
  )
}
