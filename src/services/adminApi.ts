/**
 * 管理后台接口适配层。
 *
 * 后端 admin API：
 *   学校：GET/POST/PUT/DELETE /api/v1/admin/schools[/{id}]
 *   专业：GET/POST/PUT/DELETE /api/v1/admin/majors[/{id}]
 *   文件：GET /api/admin/kb (= /api/v1/admin/files)，POST /api/admin/kb/upload，DELETE /api/admin/kb/{id}
 *
 * 注意：文件上传走 multipart/form-data，单次覆盖 http.ts 默认的 application/json。
 * 所有 admin 接口需 admin 角色 token，否则会被 require_admin 依赖拒绝。
 */
import { http } from './http'

// ─── 学校 ──────────────────────────────────────────────────
export interface School {
  id: string
  name: string
  province: string
  is_985: boolean
  is_211: boolean
  is_double_first_class: boolean
  education_level: string | null
  ownership: string | null
  created_at: string
}

export interface SchoolListResp {
  items: School[]
  total: number
}

export async function listSchools(params: {
  skip?: number
  limit?: number
  province?: string
  q?: string
} = {}): Promise<SchoolListResp> {
  const { data } = await http.get('/v1/admin/schools', { params })
  return data
}

// ─── 专业 ──────────────────────────────────────────────────
export interface Major {
  id: string
  school_id: string
  name: string
  subject_requirement: string[]
  created_at: string
}

export interface MajorListResp {
  items: Major[]
  total: number
}

export async function listMajors(params: {
  skip?: number
  limit?: number
  school_id?: string
  q?: string
} = {}): Promise<MajorListResp> {
  const { data } = await http.get('/v1/admin/majors', { params })
  return data
}

// ─── 文件 / 知识库 ─────────────────────────────────────────
export type DocumentType =
  | '保研政策'
  | '转专业政策'
  | '奖学金政策'
  | '历年保研去向'
  | '历年就业去向'

export const DOCUMENT_TYPES: DocumentType[] = [
  '保研政策',
  '转专业政策',
  '奖学金政策',
  '历年保研去向',
  '历年就业去向',
]

export type VectorStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface FileItem {
  id: string
  school_id: string
  major_id: string | null
  file_name: string
  file_type: string
  document_type: DocumentType
  document_title: string | null
  vector_status: VectorStatus
  chunk_count: number
  created_at: string
}

export interface FileListResp {
  items: FileItem[]
  total: number
}

// ⚠️ 历史上前端代码用过 /admin/kb（admin_compat 兼容层），但远程 8001 的旧部署没有该路由（404）。
//    改走官方 /v1/admin/files，所有部署版本都有。
export async function listFiles(params: {
  skip?: number
  limit?: number
  school_id?: string
  major_id?: string
} = {}): Promise<FileListResp> {
  const { data } = await http.get('/v1/admin/files', { params })
  return data
}

export async function uploadFile(opts: {
  file: File
  school_id: string
  major_id?: string
  document_type: DocumentType
  document_title?: string
}): Promise<FileItem> {
  const form = new FormData()
  form.append('file', opts.file)
  const { data } = await http.post('/v1/admin/files/upload', form, {
    params: {
      school_id: opts.school_id,
      major_id: opts.major_id,
      document_type: opts.document_type,
      document_title: opts.document_title,
    },
    // 让浏览器自己生成 multipart boundary
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function deleteFile(id: string): Promise<void> {
  await http.delete(`/v1/admin/files/${id}`)
}
