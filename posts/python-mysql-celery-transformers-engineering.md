---
title: "从接口到模型推理：Python、MySQL、Celery 与 Transformers 的工程化组合"
date: "2026-09-01"
excerpt: "把过去项目里分散使用的 Python、MySQL、Celery、Redis 与 Transformers 串成一条可解释、可恢复、可扩展的 AI 异步任务链路。"
category: "AI Engineering"
---

做 AI 项目时，模型本身往往不是最难的部分。真正进入业务后，一个请求可能需要下载文件、清洗数据、加载模型、执行推理并保存结果，耗时从几秒到几分钟不等。如果把所有工作都塞进一次 HTTP 请求，超时、重试、重复执行和状态追踪会很快变成问题。

这篇文章把我过去项目里接触的技术栈重新组织成一条完整链路：**FastAPI 接收请求，MySQL 保存业务事实，Celery 分发耗时任务，Redis 或 RabbitMQ 传递消息，Transformers 执行模型推理，最后把结果与错误状态写回数据库。**

## 一、先明确每个组件的职责

| 组件 | 在系统中的职责 | 不应该承担的职责 |
|---|---|---|
| Python / FastAPI | 参数校验、鉴权、创建任务、查询状态 | 长时间阻塞等待模型推理 |
| MySQL | 保存任务、输入摘要、状态、结果与错误，是业务事实来源 | 充当高吞吐消息队列 |
| Celery | 把耗时工作分发给一个或多个 Worker | 永久保存唯一业务状态 |
| Redis / RabbitMQ | 作为 Broker 传递任务消息；Redis 也可保存短期结果或缓存 | 替代 MySQL 保存必须审计的数据 |
| Transformers | 统一加载预训练模型并完成推理或训练 | 处理接口鉴权、业务事务和任务幂等 |

[Celery 官方仓库](https://github.com/celery/celery)将任务队列描述为把工作分发到不同线程或机器的机制：客户端发送消息，Broker 把消息交给 Worker。它原生支持多 Worker 横向扩展，并把 RabbitMQ、Redis 列为成熟的消息传输方案。

[Hugging Face Transformers](https://github.com/huggingface/transformers)则负责模型定义和推理接口，覆盖文本、视觉、音频与多模态任务。它与 Celery 解决的是两个层面的问题：Transformers 解决“怎么算”，Celery 解决“由谁、在什么时候算”。

## 二、一条真实的请求链路

```text
Client
  │ POST /inference-jobs
  ▼
FastAPI ──事务──▶ MySQL: job=PENDING
  │
  └──发送 job_id──▶ Redis/RabbitMQ ──▶ Celery Worker
                                           │
                                           ├─ MySQL: RUNNING
                                           ├─ Transformers 推理
                                           └─ MySQL: SUCCEEDED / FAILED

Client ──GET /inference-jobs/{id}──▶ FastAPI ──▶ MySQL
```

接口应当快速返回 `202 Accepted` 和 `job_id`，前端再轮询或通过 WebSocket/SSE 获取进度。这样 Web 进程不需要占着连接等模型跑完，Worker 也可以独立扩容。

任务表至少需要这些字段：

```sql
CREATE TABLE inference_job (
  id            CHAR(36) PRIMARY KEY,
  status        VARCHAR(20) NOT NULL,
  input_hash    CHAR(64) NOT NULL,
  result_json   JSON NULL,
  error_message TEXT NULL,
  attempts      INT NOT NULL DEFAULT 0,
  created_at    DATETIME NOT NULL,
  started_at    DATETIME NULL,
  finished_at   DATETIME NULL,
  UNIQUE KEY uq_job_input (input_hash)
);
```

`input_hash` 不只是优化。相同输入被重复提交时，它可以帮助系统复用已有任务，或者显式拒绝重复请求。[MySQL Server 官方仓库](https://github.com/mysql/mysql-server)对应的是持久化的关系型数据库；在这套架构里，任务状态应该以 MySQL 为准，而不是以 Celery 的短期返回值为准。

## 三、API 层只创建任务

[FastAPI 官方仓库](https://github.com/fastapi/fastapi)提供基于 Python 类型提示的参数校验与异步 Web 接口能力。[SQLAlchemy](https://github.com/sqlalchemy/sqlalchemy)负责 Python 与关系数据库之间的事务和对象映射。

```python
@router.post("/inference-jobs", status_code=202)
def create_job(payload: JobCreate, session: Session = Depends(get_session)):
    input_hash = sha256(payload.model_dump_json().encode()).hexdigest()

    job = InferenceJob(
        id=str(uuid4()),
        status="PENDING",
        input_hash=input_hash,
    )
    session.add(job)
    session.commit()

    run_inference.delay(job.id, payload.model_dump())
    return {"job_id": job.id, "status": job.status}
```

这个最小实现还存在一个经典问题：数据库提交成功后，进程可能在发送 Celery 消息前崩溃，于是 MySQL 里有任务，但队列里没有消息。生产系统可使用 **Transactional Outbox**：在同一个数据库事务里同时写入任务和待发送事件，再由独立发布器把事件可靠地投递到 Broker。

## 四、Celery 任务必须幂等

分布式队列通常提供的是“至少一次”处理语义，而不是“绝对只执行一次”。网络断开、Worker 崩溃或确认消息失败，都可能导致同一个任务再次出现。[Celery 的任务文档](https://github.com/celery/celery/blob/main/docs/userguide/tasks.rst)明确建议任务函数保持幂等。

```python
@celery_app.task(
    bind=True,
    acks_late=True,
    autoretry_for=(TimeoutError,),
    retry_backoff=True,
    max_retries=3,
)
def run_inference(self, job_id: str, payload: dict):
    with session_factory() as session:
        job = session.get(InferenceJob, job_id, with_for_update=True)

        if job.status == "SUCCEEDED":
            return job.result_json

        job.status = "RUNNING"
        job.attempts += 1
        session.commit()

    try:
        result = model_service.predict(payload)
        mark_succeeded(job_id, result)
        return result
    except Exception as exc:
        mark_failed(job_id, type(exc).__name__)
        raise
```

这里有四个关键点：

1. 任务只接收 `job_id` 和必要参数，不传数据库连接、模型对象或超大文件。
2. 执行前检查终态，重复消息不会重复产生副作用。
3. 只对明确的临时错误重试；参数错误、模型不支持等永久错误不应无限重试。
4. 错误写入数据库时要脱敏，不能把 Token、数据库密码或完整用户文件写进日志。

## 五、模型要在 Worker 进程中复用

最浪费性能的写法，是每执行一个任务就重新加载一次模型。正确做法是让模型在 Worker 进程启动后加载一次，再复用到后续任务。

```python
from transformers import pipeline

class ModelService:
    def __init__(self) -> None:
        self.classifier = pipeline(
            task="text-classification",
            model="distilbert/distilbert-base-uncased-finetuned-sst-2-english",
        )

    def predict(self, payload: dict) -> list[dict]:
        text = payload["text"][:4000]
        return self.classifier(text)

model_service = ModelService()
```

模型常驻后，需要重新思考 Celery 的并发数。普通 I/O 任务可以开多个进程，但同一张 GPU 上启动过多模型进程会迅速耗尽显存。更稳妥的做法是给 GPU 推理使用独立队列，并把该 Worker 并发数限制为 1 或少量值；CPU 数据清洗任务则放进另一个高并发队列。

## 六、Redis 和 MySQL 不冲突

[Redis 官方仓库](https://github.com/redis/redis)将其定位为面向实时数据应用的内存数据结构服务。在这条链路中：

- Redis/RabbitMQ 负责“把任务送到 Worker”；
- Redis 可缓存热点结果、保存短期进度；
- MySQL 负责“这个任务最终发生了什么”。

如果 Redis 被清空，系统应该能够根据 MySQL 中的 `PENDING/RUNNING` 任务恢复或补偿；如果只把结果放在 Redis，重启或过期后就无法审计历史任务。

## 七、最值得在面试中讲清楚的取舍

这套技术栈真正有价值的不是“我用过 Celery 和 Transformers”，而是能够解释以下问题：

- 为什么模型推理不能一直占用 HTTP 请求？
- 为什么 Broker 接收消息成功，不等于业务任务已经成功？
- 为什么任务必须幂等，如何防止重复扣费或重复写入？
- 数据库提交成功、消息发送失败时如何处理？
- GPU Worker 为什么不能照搬普通 Web Worker 的并发配置？
- Redis 宕机后哪些数据可以丢，哪些必须从 MySQL 恢复？

一个成熟的回答应该包含状态机、事务边界、失败恢复、资源隔离与可观测性，而不只是贴一段 `delay()` 调用。

## 八、相关项目与文档入口

- [python/cpython](https://github.com/python/cpython)：Python 语言实现与标准库源码
- [mysql/mysql-server](https://github.com/mysql/mysql-server)：MySQL Server 源码
- [celery/celery](https://github.com/celery/celery)：分布式任务队列
- [celery/celery 任务设计文档](https://github.com/celery/celery/blob/main/docs/userguide/tasks.rst)：确认、重投递与幂等原则
- [redis/redis](https://github.com/redis/redis)：缓存、Broker 与实时数据结构服务
- [sqlalchemy/sqlalchemy](https://github.com/sqlalchemy/sqlalchemy)：Python 数据库工具与 ORM
- [fastapi/fastapi](https://github.com/fastapi/fastapi)：Python API 框架
- [huggingface/transformers](https://github.com/huggingface/transformers)：预训练模型定义、训练与推理框架

这些链接用于核对组件能力和实现细节，不是本文的内容来源。本文的架构、取舍和代码组织，来自我对这套工程链路的实践整理。

这条链路也能自然延伸到当前作品集的 RAG：把 Transformers 换成 Qwen/Ollama，把推理输入换成检索到的项目切片，Celery 则可以在公网阶段承担 GitHub 增量同步和批量向量化任务。
