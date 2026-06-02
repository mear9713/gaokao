/**
 * 志愿推荐接口适配层（异步任务模式）。
 *
 * 后端流程：
 *   1. POST /api/v1/recommendations              创建任务 → { recommendation_id, status }
 *   2. GET  /api/v1/recommendations/{id}/status  轮询状态 → { status, rag_fallback }
 *   3. GET  /api/v1/recommendations/{id}         完成后取结果 → { result, ... }
 *
 * ⚠️ 经实测，线上后端请求体要 snake_case 字段名（student_score 等），
 *    源码中的 camelCase alias 在线上未生效。
 *
 * 后端 result 结构（_transform_result 输出）：
 *   {
 *     "冲刺": [item...], "稳妥": [item...], "保底": [item...],
 *     "school_details": [SchoolDetail...],
 *     "data_disclaimer": string, "rag_fallback": boolean
 *   }
 * 列表 item 已是 camelCase，但无 city（仅 province）；school_details 与前端 SchoolDetail 同构。
 */
import { http } from './http'
import type {
  StudentInfo,
  SchoolRecommendation,
  SchoolDetail,
  RecommendCategory,
  AdmissionRisk,
} from '@/types'

export type RecStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface RecommendationStatus {
  recommendation_id: string
  status: RecStatus
  rag_fallback: boolean
}

export interface RecommendationRecord {
  id: string
  status: RecStatus
  request_params: Record<string, unknown>
  result: Record<string, unknown> | null
  rag_fallback: boolean
  created_at: string
  updated_at: string
}

/** 创建推荐任务，返回 recommendation_id */
export async function createRecommendation(info: StudentInfo): Promise<string> {
  // 用户独立选择的目标省份；不选则不传，后端 LLM/规则按生源地兜底
  const targetProvinces =
    info.targetProvinces && info.targetProvinces.length > 0
      ? info.targetProvinces
      : null
  const body: Record<string, unknown> = {
    student_score: info.score,
    // 位次非必填：null 时后端按分数匹配（schema: student_rank: int | null）
    student_rank: info.rank ?? null,
    student_province: info.province,
    student_subjects: info.subjects,
    target_provinces: targetProvinces,
    target_majors:
      info.targetMajors && info.targetMajors.length > 0 ? info.targetMajors : null,
    // 以下偏好字段：后端新版支持，旧版会忽略（无害）
    school_preference: info.schoolPreference,
    care_about_postgrad: info.careAboutPostgrad,
    education_goal: info.educationGoal,
  }
  const { data } = await http.post('/v1/recommendations', body)
  return data.recommendation_id as string
}

export async function getRecommendationStatus(id: string): Promise<RecommendationStatus> {
  const { data } = await http.get(`/v1/recommendations/${id}/status`)
  return data as RecommendationStatus
}

export async function getRecommendation(id: string): Promise<RecommendationRecord> {
  const { data } = await http.get(`/v1/recommendations/${id}`)
  return data as RecommendationRecord
}

/**
 * 轮询直到任务结束（completed / failed）或超时。
 * onTick 回调可用于更新 UI 进度提示。
 */
export async function pollRecommendation(
  id: string,
  opts: {
    intervalMs?: number
    timeoutMs?: number
    onTick?: (s: RecommendationStatus) => void
  } = {},
): Promise<RecommendationRecord> {
  // 1.5s 间隔比 2.5s 更快感知到 completed（最多省 1 秒）；
  // 后端推荐 LLM 串行约需 60-120s，超时 4 分钟兜底
  const intervalMs = opts.intervalMs ?? 1500
  const timeoutMs = opts.timeoutMs ?? 240000
  const start = Date.now()

  for (;;) {
    const status = await getRecommendationStatus(id)
    opts.onTick?.(status)
    if (status.status === 'completed' || status.status === 'failed') {
      return getRecommendation(id)
    }
    if (Date.now() - start > timeoutMs) {
      throw new Error('推荐任务超时，请稍后重试')
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
}

// ─── 结果解析 ──────────────────────────────────────────────

export interface ParsedRecommendations {
  recommendations: SchoolRecommendation[]
  schoolDetails: SchoolDetail[]
  dataDisclaimer: string
  ragFallback: boolean
}

const GROUP_KEYS: RecommendCategory[] = ['冲刺', '稳妥', '保底']
const VALID_RISK: AdmissionRisk[] = ['高', '中', '低']

/** 收敛 LLM 自由输出到合法枚举，避免脏值导致前端样式表查空崩溃 */
function normRisk(v: unknown): AdmissionRisk {
  return VALID_RISK.includes(v as AdmissionRisk) ? (v as AdmissionRisk) : '中'
}
function normCategory(v: unknown, fallback: RecommendCategory): RecommendCategory {
  return GROUP_KEYS.includes(v as RecommendCategory) ? (v as RecommendCategory) : fallback
}

/** 把后端 result（按冲稳保分组）解析为前端熟悉的扁平列表 + 详情列表 */
export function parseResult(result: Record<string, unknown> | null): ParsedRecommendations {
  const empty: ParsedRecommendations = {
    recommendations: [],
    schoolDetails: [],
    dataDisclaimer: '',
    ragFallback: false,
  }
  if (!result) return empty

  const recommendations: SchoolRecommendation[] = []
  for (const group of GROUP_KEYS) {
    const arr = (result[group] as Record<string, unknown>[] | undefined) ?? []
    for (const it of arr) {
      recommendations.push({
        id: String(it.id ?? ''),
        matchScore: Number(it.matchScore ?? 0),
        schoolName: String(it.schoolName ?? ''),
        recommendedMajor: String(it.recommendedMajor ?? ''),
        // 后端列表项无 city，用 province 兜底
        city: String(it.city ?? it.province ?? ''),
        schoolLevel: String(it.schoolLevel ?? ''),
        category: normCategory(it.category, group),
        admissionRisk: normRisk(it.admissionRisk),
        lastYearScore: Number(it.lastYearScore ?? 0),
        lastYearRank: Number(it.lastYearRank ?? 0),
        postgradAdvantage: String(it.postgradAdvantage ?? ''),
        reason: String(it.reason ?? ''),
      })
    }
  }

  const schoolDetails = ((result.school_details as Record<string, unknown>[] | undefined) ?? [])
    .map((sd) => sd as unknown as SchoolDetail)

  return {
    recommendations,
    schoolDetails,
    dataDisclaimer: String(result.data_disclaimer ?? ''),
    ragFallback: Boolean(result.rag_fallback),
  }
}
