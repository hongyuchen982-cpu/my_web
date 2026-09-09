# 公网部署交接

目标：单台 Linux 主机，Docker Compose、一个 Next.js Web、一个知识库 Worker、SQLite 持久卷和宿主机 Nginx。不要横向扩展 Worker；启动时它会把上次中断任务标为失败，等待管理员重新提交，避免自动重复付费调用。

## 1. 模型与账号

复制 `deploy/production.env.example` 为 `.env.production`，只在服务器填写真实值。管理员密码至少 16 字符，会话密钥至少 32 字符；可用 `openssl rand -hex 32` 分别生成。不要上传环境文件或数据库到公开 GitHub。本地开发没有会话密钥时，反馈功能使用仅限开发环境的临时签名；公网绝不能依赖该默认值。

- 多免费聊天模型：`CHAT_PROVIDER=openrouter`，填写自己的 `OPENROUTER_API_KEY`。默认 `CHAT_MODEL=openrouter/free`；网站下拉框从平台目录提取零价格文本 `:free` 模型。失效、限流和临时服务错误可回退至免费路由；认证失败不重试，不回退到付费模型。免费列表会变化，免费配额由同一账号下所有访客共享，一个 RAG 问题可能调用两次聊天及多次 Embedding。
- 国内备选：`CHAT_PROVIDER=siliconflow`，配置 `CHAT_API_KEY`，将控制台确认可用且价格符合预期的模型 ID 以逗号分隔放入 `CHAT_ALLOWED_MODELS`，并设置其中一个为 `CHAT_MODEL`。该清单没有实时价格验证能力，页面不将这些条目标成免费。不要凭旧文章添加免费名单。此模式不跨平台自动回退。
- 其他兼容平台：`CHAT_PROVIDER=compatible`，另填 HTTPS 的 `CHAT_BASE_URL`，使用相同白名单。
- Embedding 独立配置。选择提供商、完整模型 ID 和密钥；免费聊天不代表向量调用免费。更换 Embedding 后暂停问答/维护窗口，全量重建再评测。默认阈值是旧模型的参考值，不是新模型通过评测的证明。
- 云端服务会收到用户问题和检索片段。检查提供商数据使用条款；不要将私密仓库加入公开知识库。

参考：[OpenRouter 模型接口](https://openrouter.ai/docs/guides/overview/models)、[额度说明](https://openrouter.ai/docs/faq)、[硅基流动模型中心](https://siliconflow.cn/models)。

## 2. 本地准备与数据

当前本地数据已备份至 `backups/`。运行 `node scripts/database-backup.mjs` 可创建新的 SQLite 一致性快照并验证完整性，不要直接复制运行中的数据库文件。备份包含私人数据，妥善保管。

旧本地数据库使用 `node scripts/upgrade-local-db.mjs` 只增补此次表结构；不要对旧库盲目重放历史迁移、reset 或 db push --accept-data-loss。历史迁移中包含过表重建。

源码通过私有仓库或安全文件传输到服务器 `/srv/my-web`。Docker 构建上下文排除了环境文件、数据库和备份。不能把 Windows 的 node_modules 或 .next 上传后直接在 Linux 运行，需要 Linux 构建。

## 3. 首次部署（空生产库）

服务器先安装 Docker Engine、Compose 插件、Nginx。只开放 SSH、80、443；Web 端口已仅绑定 127.0.0.1。

```sh
cd /srv/my-web
cp deploy/production.env.example .env.production
chmod 600 .env.production
# 编辑填写真实值后：
docker compose build
docker compose run --rm web npx prisma migrate deploy
```

将本地一致性快照安全传到服务器，例如 `/srv/my-web/import.db`。下面只导入已发布文章和项目，不复制用户、密码、反馈、旧向量；目标库有文章或项目时会拒绝覆盖。

```sh
docker compose run --rm -v /srv/my-web/import.db:/imports/source.db:ro web node scripts/transfer-content.mjs file:/imports/source.db file:/data/prod.db
docker compose up -d
docker compose ps
curl --fail http://127.0.0.1:3000/api/health
```

不要把旧快照直接替换初始化过的生产库。向量与知识来源随后重建。若服务器只有 2GB 内存，构建可能需要 Swap 或其他 Linux 构建机。

## 4. HTTPS 与后台

将 `deploy/nginx.conf` 的 example.com 替换成自己的域名，安装到 Nginx 配置目录，执行 `nginx -t` 后重载。DNS 解析、备案与实际站点开放按你的部署路线办理。用 Certbot 为该域名配置 HTTPS，再使用 `/admin/login`。生产会话 Cookie 只经 HTTPS 发送，HTTP 下不能完成登录。

备案取得真实编号后填写 `SITE_ICP_RECORD` / `SITE_POLICE_RECORD` 并重建容器服务；未填时页脚不展示假编号。

Nginx 覆盖 X-Real-IP，`TRUST_PROXY=true` 才使用该值限流。不要把容器 3000 端口开放公网，也不要在未覆盖该头的其他代理后直接启用此设置。

## 5. 建立知识库并验收

后台 `/admin/projects`：对需要检索的个人项目加入知识库，开始同步。等待任务完成后生成向量；状态区刷新查看排队/执行/完成/失败。后台任务由 Compose 的 worker 服务执行，无需让浏览器一直开着。五个开源参考独立展示，不自动下载巨型仓库、不自动消耗向量额度。

```sh
docker compose logs --tail=100 worker
# 队列完成后暂停 worker，再为全部文章和已同步项目重建向量：
docker compose stop worker
docker compose exec -T web npm run rag:reindex-all
docker compose exec -T web npm run rag:evaluate -- --full
docker compose start worker
docker compose exec -T web npm run deploy:check
```

评测默认包含旧项目问题，需保留相关数据或按当前内容调整评测集。逐段向量相似度是语义相关性检查，不是事实正确性的证明。需人工抽查来源是否真正支持答案。

验收：首页、文章、项目、五条学习参考；HTTPS 登录与退出；模型列表与两种模型问答；不相关问题拒答；引用和反馈；后台任务；限流；容器重启后数据仍在；使用手机流量实际访问。`/api/health` 只检查数据库及基础表，不代表 AI 可用。

## 6. 备份与恢复

部署备份 service/timer 到 `/etc/systemd/system/`，运行 `systemctl daemon-reload` 和 `systemctl enable --now my-web-backup.timer`。手动执行 `sh deploy/backup.sh` 验证。快照存于 site-backups 卷，当前不会自动删除旧备份；需要监控容量并另存一份到其他设备或对象存储，OSS 自动备份仍需要你的存储账号配置。

恢复先停止 Web 和 Worker，保留故障库及其 WAL/SHM 文件，再用 SQLite `.restore` 在新的空数据库文件中恢复选定快照，运行 `PRAGMA integrity_check`，确认后调整 DATABASE_URL 指向恢复后的文件并启动服务。不要覆盖正在运行的数据库。先在临时数据库演练恢复，再对生产操作。

## 7. 更新与回退

先备份数据库并记录当前镜像 ID，再获取新代码、构建新镜像、审阅增量迁移并运行 migrate deploy，最后 compose up -d。保留前一镜像与对应数据库快照。遇到不兼容迁移，不能只回退代码；需在停机窗口恢复匹配的数据库快照。

本站适合小型作品集：检索仍是精确向量扫描；定时 GitHub Webhook、跨机器任务队列、OSS 账号接入和自动化证书申请不在已实测范围内。

## 8. 依赖安全与持续检查

Next.js 已升级至 16.3.4。Prisma 7.10 的间接依赖通过 package.json 的 scoped overrides 使用 deepmerge-ts 8.0.2 和 mysql2 3.24.4 修复已知漏洞；修改这些约束后应重新验证 Prisma generate、迁移、测试和构建。不要运行 audit fix --force 自动降级 Prisma 主版本。

`.github/workflows/check.yml` 在推送后运行测试、构建、安全审计和 Linux Docker 构建；本次只创建工作流文件，没有推送或触发远程 CI。
