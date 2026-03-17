# AI-Powered Theme Configuration Schema Generator

一个完整的主题配置自动优化系统，利用大模型生成用户友好的表单 Schema。

## 📋 功能概览

### 核心功能
- ✅ **一键优化**: 为主题 YAML 配置自动添加 schema 元数据
- ✅ **多语言支持**: 中文、英文、法文三语言注释生成
- ✅ **流式处理**: 支持超大配置文件，自动分段处理
- ✅ **智能缓存**: 基于内容哈希的缓存机制，加快重复生成
- ✅ **错误恢复**: 完善的错误处理和重试逻辑
- ✅ **实时反馈**: 进度条和日志展示，用户体验优化

---

## 🏗️ 架构设计

### 前端架构
```
ThemeConfigPanel
├─ 优化按钮 (Drawer 顶部)
└─ SchemaGeneratorModal
   ├─ Step 1: AI 配置检查
   ├─ Step 2: 语言选择
   ├─ Step 3: 流式处理中
   ├─ Step 4: 完成预览
   └─ Step 5: 错误处理
```

### 后端架构
```
POST /theme/schema/generate (SSE)
├─ 配置文件加载
├─ 缓存检查
├─ 分段处理
│  ├─ segment 1 → AI API → schema 结果
│  ├─ segment 2 → AI API → schema 结果
│  └─ segment N → AI API → schema 结果
├─ 结果合并和验证
└─ 缓存存储
```

---

## 📁 文件结构

### 前端组件
```
client/src/pages/theme-market/
├─ components/
│  ├─ SchemaGeneratorModal.tsx      # 新建：Schema 生成器模态框
│  ├─ ThemeConfigPanel.tsx          # 修改：集成优化按钮
│  └─ ...
├─ themeSchema.ts                   # 已有：Schema 推导工具
└─ style.module.less                # 修改：新增样式
```

### 后端模块
```
hexo-pro/
├─ schema_generator.js              # 新建：Schema 生成核心逻辑
├─ theme_api.js                     # 修改：添加 /schema/generate 端点
├─ api.js                           # 修改：注册路由和认证排除
└─ database-manager.js              # 修改：添加 schema 缓存表
```

### 国际化
```
client/src/locale/index.ts          # 修改：添加 40+ 翻译字符串
```

---

## 🔧 核心实现详解

### 1. 前端流程

#### SchemaGeneratorModal 组件
**五步流程**：

```typescript
// Step 1: 检查 AI 配置
- 验证 AI URL、API Key、Model 是否完整
- 提示配置不完整时跳转到设置

// Step 2: 语言选择
- Radio 选择：中文 | English | Français
- 卡片式交互，选中时高亮边框

// Step 3: 流式处理
- 调用 /theme/schema/generate
- 使用 ReadableStream 处理 SSE 响应
- 实时更新进度条和日志

// Step 4: 完成预览
- 显示生成结果（前500字符）
- 提供三个操作：下载、重新生成、应用到编辑器

// Step 5: 错误处理
- 显示错误信息
- 提供返回和重试选项
```

**关键代码**：
```typescript
// SSE 流处理
const response = await fetch('/hexopro/api/theme/schema/generate', {
  method: 'POST',
  body: JSON.stringify({ themeId, language })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const text = decoder.decode(value, { stream: true });
  const lines = text.split('\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      // 更新 UI 状态
    }
  }
}
```

### 2. 后端处理

#### API 端点：POST /theme/schema/generate

**请求体**：
```json
{
  "themeId": "anzhiyu",
  "language": "zh"
}
```

**SSE 响应流**：
```
data: {"type": "start", "totalChunks": 5, "configSize": 12500}

data: {"type": "chunk_processing", "current": 1, "total": 5, "status": "正在分析第 1/5 段..."}
data: {"type": "chunk_result", "chunk": 1, "result": "# schema: {...}\ntitle: ..."}

data: {"type": "chunk_processing", "current": 2, "total": 5, "status": "正在分析第 2/5 段..."}
data: {"type": "chunk_result", "chunk": 2, "result": "# schema: {...}\ndescription: ..."}

...

data: {"type": "complete", "fullResult": "完整 YAML", "summary": "已为 25 个字段添加 schema 注释"}
```

#### 分段处理逻辑

```javascript
// schema_generator.js
function segmentConfig(yamlContent, chunkSize = 5000) {
  const segments = [];
  for (let i = 0; i < yamlContent.length; i += chunkSize) {
    segments.push(yamlContent.substring(i, i + chunkSize));
  }
  return segments;
}
```

**为什么分段？**
- 避免超出 LLM 上下文限制
- 默认 5KB 一段，可配置
- 并行处理多个小段请求

#### AI 提示词设计

```javascript
// 核心提示词（schema_generator.js）
const prompt = `You are an expert at converting YAML configuration to user-friendly forms.

Rules:
1. Add schema comment for each field: # schema: {...}
2. Include: type (input/textarea/number/switch/color/select/email/url), label
3. Optional: placeholder, description, group, options
4. Return ONLY modified YAML with schema comments
5. Preserve all original values exactly

Example:
# schema: {type: "input", label: "网站标题", placeholder: "输入网站标题"}
title: My Hexo Blog

# schema: {type: "select", label: "主题语言", options: [{value: "en", label: "English"}]}
language: en
`;
```

### 3. 缓存机制

#### 缓存表结构
```javascript
// database-manager.js 初始化
const themeSchemaCache = createDatabase('theme_schema_cache.db');

// 缓存记录格式
{
  _id: "唯一ID",
  themeId: "anzhiyu",
  language: "zh",
  schema: "完整 YAML 内容（包含 schema 注释）",
  configHash: "e3f8a2c1",      // 内容哈希
  generatedAt: "2026-03-07T10:00:00Z"
}
```

#### 缓存流程
```javascript
// theme_api.js 中的处理
1. 计算配置文件哈希: calculateHash(configContent)
2. 查询缓存: db.themeSchemaCache.findOne({ themeId, language })
3. 哈希匹配?
   ✓ 是 → 返回缓存结果（type: 'complete', cached: true）
   ✗ 否 → 重新生成并保存缓存
```

#### 哈希函数
```javascript
// 简单但有效的哈希算法
function calculateHash(content) {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // 32位整数
  }
  return Math.abs(hash).toString(36);
}
```

---

## ⚠️ 错误处理规则

### 前端错误处理

| 错误类型 | 处理方式 | 用户提示 |
|--------|--------|--------|
| **AI 配置不完整** | 显示 Alert，提示跳转设置 | "请先在设置中配置 AI" |
| **网络错误** | 记录日志，显示错误信息 | "网络连接中断，请检查后重试" |
| **请求超时** | AbortController 取消请求 | "处理超时，请重试" |
| **响应格式错误** | 捕获 JSON 解析异常 | "响应数据格式错误" |
| **用户取消** | 设置 abortController.abort() | "操作已取消" |

### 后端错误处理

```javascript
// theme_api.js 中的处理
try {
  // ... 处理逻辑 ...
  
} catch (segmentError) {
  // 单个段失败时
  hexo.log.error(`[Schema] 第 ${i + 1} 段处理失败:`, segmentError.message);
  
  // 立即向客户端发送错误
  res.write(`data: ${JSON.stringify({
    type: 'error',
    message: `第 ${i + 1} 段处理失败: ${segmentError.message}`
  })}\n\n`);
  
  return res.end();
}
```

### 重试策略

1. **前端重试**：
   - 用户点击"重试"按钮
   - 回到第 2 步（语言选择）
   - 不清除日志（便于调试）

2. **后端重试**：
   - 单个段失败时立即返回错误
   - 不自动重试（避免 LLM 调用浪费）
   - 由用户决定是否重试

---

## 🎨 UI/UX 设计亮点

### 1. 模态框设计
- **宽度**: 700px（适配各分辨率）
- **分步流程**: 清晰的进度指示
- **卡片式交互**: 语言选择时高亮选中

### 2. 进度展示
- **圆形进度条**: 直观的完成度
- **实时日志**: 单色标签 + 消息
- **数值显示**: "1/5 段"清晰显示

### 3. 操作按钮
- **禁用保护**: AI 配置不完整时禁用继续按钮
- **加载状态**: 处理中显示 loading 动画
- **错误提示**: 使用 Alert 组件展示严重错误

### 4. 集成点
```
Drawer 顶部
├─ SegmentedControl (表单 | Raw)
├─ 优化按钮 (ThunderboltOutlined 图标)
└─ 点击打开 SchemaGeneratorModal
```

---

## 🌍 国际化支持

### 支持的语言

| 语言 | 代码 | 应用位置 |
|-----|------|--------|
| **简体中文** | `zh` | 中文用户 |
| **English** | `en` | 英文用户 |
| **Français** | `fr` | 法语用户 |

### 翻译示例

```typescript
// 中文
'theme.schema.title': 'AI 优化配置'
'theme.schema.step1': '1. 分析你的主题配置文件'

// English
'theme.schema.title': 'Optimize Configuration'
'theme.schema.step1': '1. Analyze your theme configuration file'

// Français
'theme.schema.title': 'Optimiser la Configuration'
'theme.schema.step1': '1. Analyser votre fichier de configuration de thème'
```

---

## 📊 性能优化

### 1. 缓存策略
- **缓存命中率**: 配置文件未改变时 100% 命中
- **缓存存储**: NeDB 本地数据库，无网络延迟

### 2. 分段处理
- **默认段大小**: 5KB（可配置）
- **优势**: 避免超出 LLM 上下文限制
- **缺点**: 多次 API 调用（用户选择的权衡）

### 3. 流式响应
- **SSE 协议**: 实时推送更新，避免轮询
- **内存效率**: 不等待完全处理完成，逐步展示进度

---

## 🔐 安全考虑

### 1. API 认证
- `/theme/schema/generate` 路由**不需要认证**
  - 原因：配置已是公开数据，生成 schema 无安全风险
  - 改进空间：可添加请求频率限制

### 2. AI 配置隐私
- API Key 存储在**数据库**中，从不发送给客户端
- 后端代理所有 AI 调用，避免 CORS 问题

### 3. 输入验证
```javascript
if (!themeId) {
  return res.send(400, '缺少主题ID');
}

const theme = BUILTIN_THEMES.find((t) => t.id === themeId);
if (!theme) {
  return res.send(404, '主题不存在');
}
```

---

## 📝 使用示例

### 1. 用户流程

```
1. 进入主题配置页面 → 点击"优化"按钮
2. SchemaGeneratorModal 打开
3. 检查 AI 配置是否完整
   ✓ 完整 → 继续
   ✗ 不完整 → 跳转设置配置
4. 选择生成语言（中文/英文/法文）
5. 点击"开始生成"
6. 等待处理完成（显示实时进度）
7. 预览生成结果
8. 选择操作：
   - 下载文件：保存为 YAML
   - 重新生成：修改语言重新生成
   - 应用到编辑器：更新配置 + 切换到表单模式
```

### 2. 生成结果示例

**输入** (Raw 模式):
```yaml
title: My Hexo Blog
author: John Doe
description: A beautiful blog
language: en
theme_color: "#425AEF"
enable_comments: true
```

**输出** (添加 schema 后):
```yaml
# schema: {type: "input", label: "网站标题", placeholder: "输入网站标题"}
title: My Hexo Blog

# schema: {type: "input", label: "作者名", placeholder: "输入作者名"}
author: John Doe

# schema: {type: "textarea", label: "网站描述", placeholder: "输入网站描述"}
description: A beautiful blog

# schema: {type: "select", label: "网站语言", options: [{value: "en", label: "English"}, {value: "zh", label: "简体中文"}]}
language: en

# schema: {type: "color", label: "主题颜色"}
theme_color: "#425AEF"

# schema: {type: "switch", label: "启用评论"}
enable_comments: true
```

**效果**: 在表单模式中显示更友好的配置界面

---

## 🚀 部署检查清单

- [ ] 前端编译无错误
- [ ] 后端 API 端点已注册
- [ ] 数据库表已初始化
- [ ] AI 配置路由已添加到认证排除列表
- [ ] 翻译字符串已完整
- [ ] 样式文件已更新
- [ ] 测试各步骤流程

---

## 📞 故障排除

### 问题1：处理过程中突然中断
**原因**: 网络连接中断或 AI API 调用失败
**解决**: 查看浏览器控制台错误信息，重试

### 问题2：缓存不更新
**原因**: 配置文件内容未变化，哈希相同
**解决**: 编辑配置文件后重新生成（哈希会改变）

### 问题3：生成速度很慢
**原因**: LLM API 响应慢或网络延迟
**解决**: 检查网络连接和 AI API 状态

### 问题4：表单模式字段显示不全
**原因**: 某些字段类型推导不准确
**解决**: 使用 YAML 注释手动添加 schema 元数据

---

## 📚 相关文件参考

- 前端组件: `/client/src/pages/theme-market/components/SchemaGeneratorModal.tsx`
- 后端 API: `/hexo-pro/theme_api.js` (lines 267-390)
- Schema 工具: `/hexo-pro/schema_generator.js`
- 数据库管理: `/hexo-pro/database-manager.js`
- 国际化: `/client/src/locale/index.ts` (lines 248-287, 1030-1071)
- 样式: `/client/src/pages/theme-market/style.module.less` (lines 61-91)
