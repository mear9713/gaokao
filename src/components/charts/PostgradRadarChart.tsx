import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, LabelList,
} from 'recharts'
import type { PostgradEvaluation } from '@/types'

/**
 * 保研 5 维雷达图
 * - 5 个维度：推免机会 / 竞争友好度 / 成绩可控性 / 科研竞赛加分空间 / 升学去向质量
 * - 0-10 分制
 * - 顶点上标注分数
 */
export function PostgradRadarChart({
  evaluation,
  height = 320,
}: {
  evaluation: PostgradEvaluation
  height?: number
}) {
  // 雷达图轴标签缩短显示（完整名放维度卡片）
  const shortNameMap: Record<string, string> = {
    '推免机会': '推免机会',
    '竞争友好度': '竞争友好',
    '成绩可控性': '成绩可控',
    '科研竞赛加分空间': '科研加分',
    '升学去向质量': '去向质量',
  }

  const data = evaluation.dimensions.map(d => ({
    name: shortNameMap[d.name] ?? d.name,
    score: d.score,
    fullMark: 10,
  }))

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} margin={{ top: 36, right: 56, bottom: 24, left: 56 }} outerRadius="72%">
          <defs>
            <linearGradient id="radarFillGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.6} />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity={0.3} />
            </linearGradient>
          </defs>

          <PolarGrid stroke="rgba(139, 92, 246, 0.2)" />

          <PolarAngleAxis
            dataKey="name"
            tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
          />

          {/* 隐藏 Y 轴刻度文字（去掉中间 0/2/4/6 数字干扰） */}
          <PolarRadiusAxis
            angle={90}
            domain={[0, 10]}
            tickCount={6}
            tick={false}
            stroke="transparent"
            axisLine={false}
          />

          <Radar
            name="评分"
            dataKey="score"
            stroke="#7c3aed"
            strokeWidth={2}
            fill="url(#radarFillGradient)"
            fillOpacity={0.6}
            isAnimationActive
            animationDuration={900}
          >
            <LabelList
              dataKey="score"
              position="outside"
              offset={10}
              fill="#7c3aed"
              fontSize={13}
              fontWeight={700}
              formatter={(v) => (typeof v === 'number' ? v.toFixed(1) : String(v ?? ''))}
            />
          </Radar>
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
