// ─── 枚举/联合类型 ────────────────────────────────────────
export type SubjectType = '物理' | '化学' | '生物' | '历史' | '地理' | '政治'
export type RiskPreference = '冲刺' | '稳妥' | '保底'
export type SchoolPreference = '985' | '211' | '双一流' | '普通本科' | '不限'
export type RecommendCategory = '冲刺' | '稳妥' | '保底'
export type AdmissionRisk = '高' | '中' | '低'
export type EducationGoal = '直接就业' | '考研' | '保研' | '出国留学' | '考公考编' | '未定'

// ─── 学生信息 ──────────────────────────────────────────────
export interface StudentInfo {
  province: string
  score: number
  rank: number
  subjects: SubjectType[]
  targetCities: string[]
  majorPreference: string
  schoolPreference: SchoolPreference
  careAboutPostgrad: boolean
  riskPreference: RiskPreference
  /** 升学目标（可选，未填则从 careAboutPostgrad 推断） */
  educationGoal?: EducationGoal
}

// ─── 推荐列表项 ────────────────────────────────────────────
export interface SchoolRecommendation {
  id: string
  matchScore: number
  schoolName: string
  recommendedMajor: string
  city: string
  schoolLevel: string
  category: RecommendCategory
  admissionRisk: AdmissionRisk
  lastYearScore: number
  lastYearRank: number
  postgradAdvantage: string
  reason: string
}

// ─── 保研 5 维评估 ────────────────────────────────────────
export type PostgradDimensionId =
  | 'opportunity'      // 推免机会
  | 'competition'      // 竞争友好度（分数越高越友好）
  | 'controllability'  // 成绩可控性
  | 'extra'            // 科研竞赛加分空间
  | 'destination'      // 升学去向质量

export interface PostgradDimension {
  id: PostgradDimensionId
  name: string                                  // 中文名
  score: number                                 // 0-10 分
  reasoning: string                             // 一句话评估理由
  rawData: { label: string; value: string }[]  // 原始数据 2-4 条
  source: string                                // 数据来源（哪份文件）
}

export interface PostgradEvaluation {
  dimensions: PostgradDimension[]   // 5 个维度
  overallScore: number              // 综合得分 0-10
  comment: string                   // 整体评价段落
}

// ─── 专业详情 ──────────────────────────────────────────────
export interface MajorDetail {
  name: string
  introduction: string
  trainingDirection: string
  employmentDirection: string
  postgradDirection: string
  postgradRate: number
  collegeName: string
  collegePostgradRate: number
  majorPostgradRate: number
  honorsClassRate?: number
  postgradPolicy: string
  scholarship: string
  gradeCalculation: string
  graduationRequirements: string
  majorTransferPolicy: string
  /** 保研 5 维评估（新版可视化用，可选向后兼容） */
  postgradEvaluation?: PostgradEvaluation
}

// ─── 院校详情 ──────────────────────────────────────────────
export interface SchoolDetail {
  id: string
  schoolName: string
  city: string
  province: string
  schoolLevel: string
  introduction: string
  disciplineStrengths: string[]
  majorDetail: MajorDetail
  personalizedAdvice: string
}

// ─── 聊天消息 ──────────────────────────────────────────────
export type MessageRole = 'user' | 'assistant'

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  /** AI 回复时可携带的结构化数据 */
  agentData?: {
    recommendations?: SchoolRecommendation[]
    sources?: KnowledgeSource[]
    nextActions?: string[]
  }
}

// ─── 知识库引用来源 ────────────────────────────────────────
export type KnowledgeSourceType =
  | '招生数据'
  | '保研政策'
  | '专业信息'
  | '录取数据'
  | '奖学金政策'
  | '培养方案'
  | '转专业政策'
  | '院校官网'

export interface KnowledgeSource {
  id: string
  title: string
  source: string
  relevance: string
  /** 来源类型分类（用于标签展示） */
  type: KnowledgeSourceType
  /** 数据年份 */
  year?: number
  /** 关联院校（用于过滤） */
  schoolName?: string
  /** RAG 检索到的具体文本片段 */
  excerpt?: string
}

// ─── Agent 执行步骤 ───────────────────────────────────────
export type AgentStepIcon = 'profile' | 'plan' | 'policy' | 'match' | 'generate'
export type AgentStepStatus = 'pending' | 'running' | 'done'

export interface AgentStep {
  id: string
  icon: AgentStepIcon
  /** 步骤标题（固定文案） */
  label: string
  status: AgentStepStatus
  /** 步骤完成后展示的具体细节（动态生成） */
  detail?: string
  /**
   * 是否复用上下文缓存（前端会用更弱的视觉 + 更快的动画时长展示）
   * Agent 第 2 轮起，已分析过的画像 / 已检索过的同场景知识库都可以标记为 cached
   */
  cached?: boolean
}

// ─── Agent 完整响应（对应 POST /api/agent/chat） ───────────
export interface AgentResponse {
  /** AI 文字回答（支持流式输出） */
  answer: string
  /** 执行步骤列表（流式过程中逐步推进） */
  agentSteps: AgentStep[]
  /** 推荐院校卡片（展示在回答下方） */
  recommendations: SchoolRecommendation[]
  /** 本次回答引用的知识源（展示在右侧） */
  sources: KnowledgeSource[]
  /** 下一步建议操作（展示为按钮） */
  nextActions: string[]
}

/** Agent 推理模式：快速 vs 深度 */
export type AgentMode = 'quick' | 'deep'

export interface AgentChatRequest {
  message: string
  studentInfo: StudentInfo
  history: ChatMessage[]
  /** 推理模式（可选，默认 quick） */
  mode?: AgentMode
}

// ─── Context 状态 ──────────────────────────────────────────
export interface AppContextState {
  studentInfo: StudentInfo | null
  selectedSchools: string[]
  setStudentInfo: (info: StudentInfo) => void
  toggleSelectedSchool: (id: string) => void
  clearSelectedSchools: () => void
}

// ─── 用户身份与权限 ──────────────────────────────────────
export type UserRole = 'guest' | 'student' | 'admin'

export interface AuthUser {
  username: string
  displayName: string
  role: UserRole
  /** Mock token，真实接入时替换为后端返回的 JWT */
  token: string
  /** 登录时间戳（用于 token 过期判断） */
  loggedInAt: number
}

export interface AuthContextState {
  user: AuthUser | null
  isAdmin: boolean
  isStudent: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<{ ok: boolean; message?: string }>
  logout: () => void
}
