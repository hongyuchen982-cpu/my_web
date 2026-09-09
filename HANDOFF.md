# 本轮上线准备交接 · 2026-09-08

## 交付状态

本地开发与生产准备已完成本轮实现和验证。尚未公网发布，未购买资源，未推送 GitHub。原有未提交代码保留在工作区，新改动也尚未提交。不要使用 reset 清理工作区。

## 已完成

1. 云端聊天适配：OpenRouter 免费模型目录与免费回退、SiliconFlow 管理员模型白名单、HTTPS 兼容接口、本地 Ollama。向量配置独立。公开接口不接收任意上游 URL 或密钥。
2. 聊天界面新增模型选择，未知/未启用模型被服务端拒绝。云端数据发送提示可见。OpenRouter 当前目录实查有 16 个符合筛选条件的免费文本模型；目录和账号可用性会变，不把这个数量固定在代码里。
3. RAG 保留检索阈值、项目隔离、引用检查、有限重写和拒答；结构化回答解析失败也进入一次重写后拒答。引用相似度不是事实正确率。
4. 数据库持久化限流、登录限制、同源校验、签名反馈凭证。
5. 知识库同步/切片/向量化从网页请求移至持久化任务队列。单 Worker 串行执行，后台显示状态，中断后标记失败等待人工重试。修复同步状态覆盖导致的重复下载。
6. Docker Compose、Nginx、生产变量模板、数据库健康检查、迁移、内容转移、向量重建、备份和每日备份 timer。
7. 页面内容运行时读取生产数据库；删除页脚假备案号和硬编码托管商，支持真实备案编号配置。
8. Next.js 16.3.4、Prisma 组件统一到 7.10.0，修复间接依赖已知漏洞；添加本地回归测试和 GitHub CI 工作流。

## 五个开源学习参考

已放入 `/projects` 独立区域，注明原作者和建议练习，不作为本人原创，也没有自动执行上游安装脚本或下载大型模型。

- [Full Stack FastAPI Template](https://github.com/fastapi/full-stack-fastapi-template)：Python 全栈与部署。
- [Celery](https://github.com/celery/celery)：长任务、重试与任务队列。
- [LangGraph](https://github.com/langchain-ai/langgraph)：状态图与 Agent 流程。
- [LlamaIndex](https://github.com/run-llama/llama_index)：文档索引与 RAG。
- [ComfyUI](https://github.com/Comfy-Org/ComfyUI)：节点工作流与图像生成接口。

## 验证结果

- `npm test`：3 个测试组通过，覆盖免费目录过滤、零价格回退、模型白名单、认证错误、全量新库迁移、并发限流、反馈凭证、任务去重、RAG 拒答和项目隔离、无效引用重写。
- `npm run build`：生产构建与 TypeScript 通过。
- `npm audit --omit=dev --audit-level=high`：0 个已知漏洞；安装后完整 audit 也为 0。
- `npm run lint`：0 错误，保留一条现有 Markdown 外部图片的优化建议。
- `docker compose config --no-env-resolution`：配置解析通过。
- `scripts/smoke-test.mjs`：隔离测试库导入 14 篇文章、6 个项目；生产页面、未登录跳转、非法来源/模型拒绝、限流、Worker 失败落库、备份完整性和备份数据核对通过。
- Edge 无头浏览器：桌面/390px 手机截图、无页面 JS 异常、无横向溢出、真实表单登录、Secure/HttpOnly Cookie、退出均通过。

截图位于 `artifacts/smoke-K59Z2G/`。原始数据库备份位于 `backups/snapshot-2026-09-08T09-51-22-933Z.db`，已执行完整性校验。测试和备份目录均被 Git 忽略。

## 仍需真实环境完成

- 模型平台账号、API Key、确认免费额度和数据使用条款；Embedding 提供商/模型选择。不要将密钥发到聊天中。
- 云端真实问答与向量请求、全量向量重建和阈值评测。本轮测试使用模拟云端响应；实时模型目录读取成功并不代表账号已能推理。
- 服务器、域名、DNS、备案、HTTPS、异地备份账号及公网访问验证。
- 本机 Docker 引擎启动后没有响应，Docker info 超时，因此没有声称 Docker 镜像已构建/容器已运行。Linux 镜像构建须在可用 Docker 主机执行；CI 文件已准备但尚未触发。
- OSS 自动上传没有凭空配置，当前提供本机持久卷备份。先完成一次异地备份与恢复演练。

`npm run deploy:check` 当前返回未就绪是预期结果：缺少生产凭据、持久化绝对路径、云端 Embedding 配置及相应向量。

## 回来后从这里开始

打开 [DEPLOYMENT.md](DEPLOYMENT.md)，先完成账号和服务器信息，再按首次部署、内容导入、HTTPS、索引和验收顺序操作。部署工具只复制已发布文章与项目，目标库非空时拒绝覆盖；不导入用户密码、反馈或旧向量。
