/** Curated upstream learning references; these are not authored by the site owner. */
export const learningProjects = [
  { name: "Full Stack FastAPI Template", owner: "fastapi", repo: "fastapi/full-stack-fastapi-template", techs: "FastAPI · React · PostgreSQL · Docker", description: "把你的 Python 后端学习推进到完整应用：阅读认证、数据库模型、测试与部署配置。", exercise: "先运行模板，再独立添加一个带权限校验的任务记录接口。" },
  { name: "Celery", owner: "celery", repo: "celery/celery", techs: "Python · 消息队列 · Worker", description: "理解长任务如何离开网页请求，学习任务重试、调度和失败处理，适合后续知识库索引任务。", exercise: "实现一个可重试的文档导入任务，并记录任务状态。" },
  { name: "LangGraph", owner: "langchain-ai", repo: "langchain-ai/langgraph", techs: "Python · Agent · 状态图", description: "结合本站已使用的 LangGraph 思路，学习显式状态、条件分支和持久化的智能体工作流。", exercise: "画出检索、拒答、生成、引用验证的状态图，再做一个最小示例。" },
  { name: "LlamaIndex", owner: "run-llama", repo: "run-llama/llama_index", techs: "Python · RAG · 文档索引", description: "对照本站的切片和检索实现，学习文档接入、索引与检索组件的组织方式。", exercise: "用同一批文档比较两种切片策略的检索命中率。" },
  { name: "ComfyUI", owner: "Comfy-Org", repo: "Comfy-Org/ComfyUI", techs: "Python · 图像生成 · 节点工作流", description: "对应你的 workflowWithComfyUI 方向，研究节点图、任务队列和 API 调用。运行生成模型通常需要额外算力。", exercise: "先阅读 API 示例，设计一个记录工作流任务与结果的后端接口。" },
] as const;
