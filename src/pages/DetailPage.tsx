import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ChevronRight, ChevronLeft, MapPin, ArrowUpRight,
  Sparkles, GraduationCap, Briefcase, Rocket,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { mockSchoolDetails } from '@/data/mockData'
import { cn } from '@/lib/utils'

// ─── Hooks ────────────────────────────────────────────────────

/** 滚动监听：返回当前可视区域中的章节 id */
function useScrollSpy(sectionIds: string[]) {
  const [activeId, setActiveId] = useState(sectionIds[0])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting)
        if (visible.length > 0) {
          const topmost = visible.reduce((a, b) =>
            a.boundingClientRect.top < b.boundingClientRect.top ? a : b
          )
          setActiveId(topmost.target.id)
        }
      },
      // section 顶部进入视口 1/3 处就算 active
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 }
    )

    sectionIds.forEach(id => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [sectionIds])

  return activeId
}

/** 入场动画：元素进入视口时返回 visible=true */
function useFadeInOnScroll() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -100px 0px' }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return { ref, visible }
}

/** 数字滚动入场（从 0 滚到目标值） */
function useCountUp(target: number, durationMs = 1200): { ref: React.RefObject<HTMLDivElement | null>; value: number } {
  const ref = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (!ref.current || started.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const start = performance.now()
          const tick = (now: number) => {
            const progress = Math.min(1, (now - start) / durationMs)
            // ease-out
            const eased = 1 - Math.pow(1 - progress, 3)
            setValue(Math.round(target * eased))
            if (progress < 1) requestAnimationFrame(tick)
          }
          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, durationMs])

  return { ref, value }
}

// ─── 子组件 ────────────────────────────────────────────────────

/** Sticky 章节导航 */
function StickySectionNav({
  items, activeId, onJump,
}: {
  items: { id: string; label: string }[]
  activeId: string
  onJump: (id: string) => void
}) {
  return (
    <nav className="sticky top-14 z-30 bg-background/70 backdrop-blur-xl border-b border-border/40 -mx-4 px-4">
      <div className="max-w-4xl mx-auto py-3 flex gap-1 overflow-x-auto scrollbar-hide">
        {items.map(item => {
          const active = activeId === item.id
          return (
            <button
              key={item.id}
              onClick={() => onJump(item.id)}
              className={cn(
                'flex-shrink-0 px-4 py-1.5 text-sm rounded-full transition-all whitespace-nowrap',
                active
                  ? 'bg-foreground text-background font-medium shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

/** 章节容器（带入场动画） */
function Section({
  id, eyebrow, title, subtitle, children,
}: {
  id: string
  eyebrow?: string
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  const { ref, visible } = useFadeInOnScroll()
  return (
    <section
      id={id}
      ref={ref}
      className={cn(
        'py-20 md:py-24 transition-all duration-1000 ease-out',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
      )}
    >
      {eyebrow && (
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4 font-medium">
          {eyebrow}
        </p>
      )}
      <h2 className="text-3xl md:text-5xl font-semibold tracking-tight leading-tight mb-3">
        {title}
      </h2>
      {subtitle && (
        <p className="text-base md:text-lg text-muted-foreground mb-10 max-w-2xl leading-relaxed">
          {subtitle}
        </p>
      )}
      <div className="mt-10">{children}</div>
    </section>
  )
}

/** 苹果风专业方向卡片 */
function DirectionCard({
  icon: Icon, label, color, content,
}: {
  icon: typeof Sparkles
  label: string
  color: string
  content: string
}) {
  return (
    <div className="group relative bg-gradient-to-br from-muted/30 to-muted/10 border border-border/50 rounded-3xl p-7 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
      <div className={cn('h-10 w-10 rounded-2xl flex items-center justify-center mb-5', color)}>
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{label}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
    </div>
  )
}

/** 保研率超大数字卡片（带计数动画） */
function PostgradHeroNumber({ value, label, accent }: { value: number; label: string; accent?: boolean }) {
  const { ref, value: animated } = useCountUp(value)
  return (
    <div ref={ref} className="text-center">
      <div className={cn(
        'text-7xl md:text-8xl font-bold tracking-tighter tabular-nums leading-none',
        accent
          ? 'bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent'
          : 'text-foreground'
      )}>
        {animated}<span className="text-4xl md:text-5xl ml-1">%</span>
      </div>
      <p className="text-sm text-muted-foreground mt-4 font-medium">{label}</p>
    </div>
  )
}

/** 保研率小卡（学院/专业/特色班） */
function PostgradMetric({
  label, value, accent,
}: { label: string; value: number; accent?: boolean }) {
  const { ref, value: animated } = useCountUp(value)
  return (
    <div
      ref={ref}
      className={cn(
        'rounded-3xl p-6 transition-all',
        accent
          ? 'bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 border border-purple-100'
          : 'bg-muted/30 border border-border/40'
      )}
    >
      <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className={cn(
          'text-4xl md:text-5xl font-bold tabular-nums tracking-tight',
          accent ? 'text-purple-700' : 'text-foreground'
        )}>
          {animated}
        </span>
        <span className="text-xl text-muted-foreground font-medium">%</span>
      </div>
      {/* 简洁进度条 */}
      <div className="h-1 bg-muted rounded-full mt-4 overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-1000 ease-out',
            accent ? 'bg-gradient-to-r from-violet-500 to-fuchsia-500' : 'bg-foreground/80'
          )}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

/** 政策细则卡片（紧凑信息卡） */
function PolicyCard({ emoji, label, content }: { emoji: string; label: string; content: string }) {
  const [expanded, setExpanded] = useState(false)
  const isLong = content.length > 80
  const display = !expanded && isLong ? content.slice(0, 80) + '…' : content

  return (
    <div className="rounded-2xl border border-border/50 bg-background p-6 hover:border-foreground/20 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg" aria-hidden>{emoji}</span>
        <h3 className="font-semibold text-sm">{label}</h3>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {display}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-3 text-xs text-foreground hover:underline font-medium flex items-center gap-0.5"
        >
          {expanded ? '收起' : '展开'}
          <ChevronRight className={cn('h-3 w-3 transition-transform', expanded && 'rotate-90')} />
        </button>
      )}
    </div>
  )
}

// ─── 主组件 ────────────────────────────────────────────────────

const SECTIONS = [
  { id: 'overview',  label: '概览' },
  { id: 'major',     label: '专业' },
  { id: 'postgrad',  label: '保研' },
  { id: 'policy',    label: '政策' },
  { id: 'advice',    label: 'AI 建议' },
]

export default function DetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const detail = mockSchoolDetails.find(s => s.id === id)
  const activeId = useScrollSpy(SECTIONS.map(s => s.id))

  const handleJump = useCallback((id: string) => {
    const el = document.getElementById(id)
    if (el) {
      const navOffset = 100 // 顶部 navbar(56) + sticky tab(~44)
      const top = el.getBoundingClientRect().top + window.scrollY - navOffset
      window.scrollTo({ top, behavior: 'smooth' })
    }
  }, [])

  if (!detail) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-32 text-center">
        <p className="text-6xl mb-6">🤔</p>
        <h1 className="text-3xl font-semibold tracking-tight mb-3">未找到该院校</h1>
        <p className="text-muted-foreground mb-8">院校 ID <code className="px-2 py-0.5 rounded bg-muted text-xs">{id}</code> 对应的详情还未录入</p>
        <Button onClick={() => navigate('/results')} size="lg" className="rounded-full">
          返回推荐结果
        </Button>
      </div>
    )
  }

  return (
    <div className="bg-background">

      {/* ━━━━━━━━ HERO ━━━━━━━━ */}
      <header className="relative px-4 pt-10 pb-16 md:pt-16 md:pb-24 overflow-hidden">
        {/* 柔和背景渐变 */}
        <div className="absolute inset-0 bg-gradient-to-b from-violet-50/40 via-background to-background -z-10" />
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] blur-3xl -z-10"
          style={{ background: 'radial-gradient(ellipse at center, rgba(196,181,253,0.30), transparent 70%)' }}
        />

        <div className="max-w-4xl mx-auto">
          {/* 面包屑 */}
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-10">
            <button onClick={() => navigate('/')} className="hover:text-foreground transition-colors">首页</button>
            <ChevronRight className="h-3 w-3" />
            <button onClick={() => navigate('/results')} className="hover:text-foreground transition-colors">推荐结果</button>
            <ChevronRight className="h-3 w-3" />
            <span className="text-foreground">{detail.schoolName}</span>
          </nav>

          {/* eyebrow */}
          <div className="flex items-center gap-2 mb-5 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span>{detail.city} · {detail.province}</span>
            <span className="text-muted-foreground/40">|</span>
            <span>{detail.schoolLevel}</span>
          </div>

          {/* 学校名称（超大字号） */}
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-6">
            {detail.schoolName}
          </h1>

          {/* 副标题 */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed mb-8">
            {detail.majorDetail.name} · 助你看清未来 4 年与升学方向
          </p>

          {/* 学科 chips */}
          <div className="flex flex-wrap gap-2 mb-10">
            {detail.disciplineStrengths.map(d => (
              <span
                key={d}
                className="px-3 py-1 rounded-full bg-foreground/5 border border-foreground/10 text-xs text-foreground/80 hover:bg-foreground/10 transition-colors"
              >
                {d}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => navigate('/chat')}
              size="lg"
              className="rounded-full gap-1.5 px-6"
            >
              <Sparkles className="h-4 w-4" />
              咨询 AI 顾问
            </Button>
            <Button
              onClick={() => navigate('/compare')}
              size="lg"
              variant="outline"
              className="rounded-full px-6"
            >
              加入对比
            </Button>
            <button
              onClick={() => navigate('/results')}
              className="ml-auto text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 px-3"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              返回推荐
            </button>
          </div>
        </div>
      </header>

      {/* ━━━━━━━━ STICKY TAB NAV ━━━━━━━━ */}
      <StickySectionNav items={SECTIONS} activeId={activeId} onJump={handleJump} />

      {/* ━━━━━━━━ SECTIONS ━━━━━━━━ */}
      <main className="max-w-4xl mx-auto px-4">

        {/* 概览 */}
        <Section
          id="overview"
          eyebrow="OVERVIEW"
          title="院校概览"
          subtitle="百年学府的学科底蕴，决定了你未来 4 年能接触到的资源高度。"
        >
          <div className="space-y-8">
            <p className="text-base md:text-lg text-foreground/80 leading-loose">
              {detail.introduction}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-border/40">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">城市</p>
                <p className="text-lg font-semibold">{detail.city}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">省份</p>
                <p className="text-lg font-semibold">{detail.province}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">层次</p>
                <p className="text-lg font-semibold">{detail.schoolLevel}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1.5">学科</p>
                <p className="text-lg font-semibold">{detail.disciplineStrengths.length} 个优势</p>
              </div>
            </div>
          </div>
        </Section>

        {/* 专业详情 */}
        <Section
          id="major"
          eyebrow="MAJOR"
          title={detail.majorDetail.name}
          subtitle={detail.majorDetail.introduction}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <DirectionCard
              icon={GraduationCap}
              label="培养方向"
              color="bg-blue-100 text-blue-600"
              content={detail.majorDetail.trainingDirection}
            />
            <DirectionCard
              icon={Briefcase}
              label="就业方向"
              color="bg-emerald-100 text-emerald-600"
              content={detail.majorDetail.employmentDirection}
            />
            <DirectionCard
              icon={Rocket}
              label="升学方向"
              color="bg-violet-100 text-violet-600"
              content={detail.majorDetail.postgradDirection}
            />
          </div>
        </Section>

        {/* 保研机会 */}
        <Section
          id="postgrad"
          eyebrow="POSTGRADUATE"
          title="保研机会"
          subtitle="保研率越高，意味着大学期间获得名校研究生通道的概率越大。"
        >
          {/* Hero 大数字（特色班优先） */}
          <div className="relative bg-gradient-to-br from-violet-50/80 via-fuchsia-50/40 to-background rounded-[2rem] border border-purple-100 p-12 md:p-16 mb-8 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl" />
            <div className="relative">
              <PostgradHeroNumber
                value={detail.majorDetail.honorsClassRate ?? detail.majorDetail.majorPostgradRate}
                label={detail.majorDetail.honorsClassRate !== undefined ? '特色班 / 实验班保研率' : `${detail.majorDetail.name}保研率`}
                accent
              />
            </div>
          </div>

          {/* 3-4 个对比卡 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <PostgradMetric label="学校" value={detail.majorDetail.postgradRate} />
            <PostgradMetric label={detail.majorDetail.collegeName} value={detail.majorDetail.collegePostgradRate} />
            <PostgradMetric label={detail.majorDetail.name} value={detail.majorDetail.majorPostgradRate} />
            {detail.majorDetail.honorsClassRate !== undefined && (
              <PostgradMetric label="特色班" value={detail.majorDetail.honorsClassRate} accent />
            )}
          </div>

          <p className="text-sm text-muted-foreground mt-8 leading-relaxed border-l-2 border-purple-200 pl-4">
            💡 特色班 / 实验班保研率远高于普通班，入学后可以争取通过选拔进入。竞赛获奖、科研经历、GPA 都是关键指标。
          </p>
        </Section>

        {/* 政策细则 */}
        <Section
          id="policy"
          eyebrow="POLICIES"
          title="政策细则"
          subtitle="入学前先了解学业规则，少走弯路。"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <PolicyCard emoji="🎓" label="保研政策" content={detail.majorDetail.postgradPolicy} />
            <PolicyCard emoji="💰" label="奖学金政策" content={detail.majorDetail.scholarship} />
            <PolicyCard emoji="📊" label="成绩计算方式" content={detail.majorDetail.gradeCalculation} />
            <PolicyCard emoji="🎯" label="毕业要求" content={detail.majorDetail.graduationRequirements} />
            <PolicyCard emoji="🔄" label="转专业政策" content={detail.majorDetail.majorTransferPolicy} />
          </div>
        </Section>

        {/* AI 升学建议 */}
        <Section
          id="advice"
          eyebrow="AI ADVICE"
          title="给你的建议"
          subtitle="基于你的画像和这所院校的特点，AI 顾问的个性化分析。"
        >
          <div className="relative rounded-[2rem] overflow-hidden bg-gradient-to-br from-foreground to-foreground/90 p-10 md:p-14 text-background">
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-gradient-to-br from-amber-300/20 via-fuchsia-300/20 to-violet-300/20 rounded-full blur-3xl" />
            <Sparkles className="h-6 w-6 mb-5 text-amber-300" />
            <p className="text-lg md:text-2xl font-medium leading-relaxed tracking-tight relative">
              {detail.personalizedAdvice}
            </p>
            <div className="mt-8 pt-6 border-t border-background/20 flex items-center justify-between">
              <span className="text-xs text-background/60 uppercase tracking-widest">AI 升学建议</span>
              <button
                onClick={() => navigate('/chat')}
                className="text-sm text-background/90 hover:text-background flex items-center gap-1 font-medium"
              >
                继续咨询
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </Section>

        {/* 底部 CTA */}
        <div className="pb-24 pt-8 flex flex-col md:flex-row gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/results')}
            className="flex-1 rounded-full gap-1.5"
          >
            <ChevronLeft className="h-4 w-4" />
            返回推荐结果
          </Button>
          <Button
            size="lg"
            onClick={() => navigate('/chat')}
            className="flex-1 rounded-full gap-1.5"
          >
            <Sparkles className="h-4 w-4" />
            咨询 AI 顾问
          </Button>
        </div>

      </main>
    </div>
  )
}
