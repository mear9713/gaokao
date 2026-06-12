# 管理员系统日志接口需求文档

## 1. 背景

前端已完成管理员系统日志页面，访问路径：

```txt
/admin/logs
```

该页面用于管理员初步诊断系统运行问题，例如后端 API 异常、推荐任务失败、知识库向量化失败、模型调用失败等。

当前前端已接好接口调用，后端只需要按本文档新增日志查询接口即可完成联调。

## 2. 接口信息

```http
GET /api/v1/admin/logs
```

用途：查询系统最近运行日志。

权限：仅管理员可访问。

请求头：

```http
Authorization: Bearer <admin_token>
```

权限要求：

| 场景 | 状态码 |
|---|---:|
| 未登录或 token 无效 | 401 |
| 非管理员访问 | 403 |

## 3. Query 参数

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|---|---:|---:|---:|---|
| `level` | string | 否 | 无 | 日志级别：`DEBUG` / `INFO` / `WARNING` / `ERROR` / `CRITICAL` |
| `source` | string | 否 | 无 | 来源关键词，建议按 `logger` 或 `process` 模糊匹配 |
| `q` | string | 否 | 无 | 搜索关键词，匹配日志内容、`logger`、`process` |
| `limit` | number | 否 | `200` | 返回条数，建议最大限制为 `500` |

前端可能传入的 `source` 值：

```txt
app
workers
recommendation
vectorization
llm
```

说明：`source` 不需要做枚举强校验，建议按普通字符串模糊匹配。

## 4. 成功响应

```json
{
  "total": 2,
  "items": [
    {
      "timestamp": "2026-06-12 12:30:01,123",
      "level": "ERROR",
      "logger": "app.services.llm_gateway",
      "process": "MainProcess",
      "message": "LLM request failed: timeout",
      "raw": "2026-06-12 12:30:01,123 ERROR [app.services.llm_gateway] [MainProcess] LLM request failed: timeout"
    }
  ]
}
```

字段说明：

| 字段 | 类型 | 说明 |
|---|---:|---|
| `total` | number | 当前筛选条件下的总日志数，未按 `limit` 截断前 |
| `items` | array | 日志列表，按时间倒序，最新在前 |
| `timestamp` | string | 日志时间，推荐格式 `YYYY-MM-DD HH:mm:ss,SSS` |
| `level` | string | 日志级别 |
| `logger` | string | logger 名，例如 `app.services.llm_gateway` |
| `process` | string | 进程名，例如 `MainProcess` 或 worker 进程名 |
| `message` | string | 脱敏后的日志正文 |
| `raw` | string | 脱敏后的完整原始日志行 |

## 5. 错误响应

示例：

```json
{
  "detail": "Admin access required"
}
```

建议状态码：

| 状态码 | 说明 |
|---:|---|
| 401 | 未登录或 token 失效 |
| 403 | 非管理员访问 |
| 422 | 参数不合法 |
| 500 | 日志读取失败 |

## 6. 日志来源建议

建议后端覆盖以下进程的运行日志：

```txt
backend API
file-vectorization-worker
recommendation-worker
```

如果是 Docker 部署，建议三个服务写入同一个日志文件或同一个日志目录，例如：

```txt
/app/logs/app.log
```

本地开发环境可以使用：

```txt
backend/logs/app.log
```

## 7. 日志格式建议

建议使用稳定可解析格式：

```txt
%(asctime)s %(levelname)s [%(name)s] [%(processName)s] %(message)s
```

示例：

```txt
2026-06-12 12:30:01,123 ERROR [app.services.llm_gateway] [MainProcess] LLM request failed: timeout
```

## 8. 筛选规则建议

- `level`：按日志级别精确匹配。
- `source`：按 `logger` 和 `process` 模糊匹配。
- `q`：按 `logger`、`process`、`message`、`raw` 模糊匹配。
- `limit`：默认 `200`，最大 `500`。
- 返回结果按时间倒序，最新日志在前。

## 9. 安全要求

接口返回前必须脱敏敏感信息，包括但不限于：

```txt
api_key
token
password
secret
Authorization: Bearer ...
sk-...
JWT token
```

建议脱敏结果：

```txt
***
sk-***
Authorization: Bearer ***
```

注意：不要把明文 API Key、token、密码、私钥返回给前端。

## 10. 前端对接状态

前端已完成接口调用，代码位置：

```txt
frontend/src/services/adminApi.ts
frontend/src/pages/AdminLogsPage.tsx
```

前端调用方式：

```ts
GET /api/v1/admin/logs
```

只要后端按本文档返回数据，管理员页面 `/admin/logs` 即可直接展示日志。
