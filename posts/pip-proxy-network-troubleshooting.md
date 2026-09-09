---
title: "开启网络代理后 pip 无法使用：一次镜像源绕过规则排查记录"
date: "2025-05-28"
excerpt: "记录开启系统代理后 pip 访问国内镜像源出现 SSL EOF 的原因、临时验证方式，以及如何在代理软件中持久化绕过规则。"
category: "Python"
---

## 问题现象

开启网络代理后，我无法在终端正常使用 `pip` 和 `conda`。以安装 Python 包为例，终端反复重试后出现 SSL 错误：

```text
Looking in indexes: https://pypi.tuna.tsinghua.edu.cn/simple
WARNING: Retrying ... SSLError(SSLEOFError(... EOF occurred in violation of protocol ...))
Could not fetch URL https://pypi.tuna.tsinghua.edu.cn/simple/...
ERROR: No matching distribution found
```

当时我的 `pip` 已配置为使用国内镜像：

```bash
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

## 排查过程

最初我怀疑是证书或网络拦截问题。关闭代理软件后，`pip` 可以恢复正常；重新打开代理，错误再次出现。

这说明问题并不是包不存在，也不是 `pip` 命令本身损坏，而是代理路径影响了镜像站连接。访问国内镜像站的流量没有必要绕到代理出口，再返回国内网络。

## 临时验证

我先在系统代理的绕过列表中加入镜像站域名，让它直接连接：

```text
pypi.tuna.tsinghua.edu.cn
```

设置后命令恢复正常，说明方向是对的。

![系统代理绕过设置](https://tccjx.github.io/2025-05-28-post6_pip_network/1.png)

## 为什么重启后又失效

随后我发现，重启代理软件后，系统里的手动绕过配置会被恢复。原因是代理客户端每次启用系统代理时，会用自己的配置重新覆盖系统设置。

因此，不能只修改 Windows 当前的系统代理，而应该在代理客户端内部保存绕过规则。

## 持久化解决方法

以我当时使用的客户端为例：

1. 进入 **Settings（设置）**。
2. 找到 **System Proxy Bypass（系统代理绕过）**。
3. 点击右侧的 **Edit**。
4. 在绕过列表中加入 `pypi.tuna.tsinghua.edu.cn`。
5. 保存后重新启用代理，再运行 `pip` 验证。

![System Proxy Bypass 入口](https://tccjx.github.io/2025-05-28-post6_pip_network/2.png)

![添加镜像站域名](https://tccjx.github.io/2025-05-28-post6_pip_network/3.png)

## 补充检查

如果添加绕过规则后仍然失败，我会继续检查：

```bash
pip config list
pip config debug
python -m pip install --index-url https://pypi.org/simple 包名
```

第一条确认当前生效的镜像源，第二条查看配置来自哪个文件，第三条临时切回官方 PyPI，用来判断故障来自镜像、代理还是本机证书环境。

不要把 `--trusted-host` 当成首选方案。它会放宽连接校验，却不能真正修复错误的代理路径；如果问题来自代理绕行，正确做法仍然是调整路由或绕过规则。

## 总结

这次问题的关键不是“代理开着就不能用 pip”，而是**国内镜像请求被错误地送进了代理，并且代理客户端会覆盖 Windows 的临时绕过设置**。

最终有效的处理方式，是把镜像站域名写进代理客户端自己的 System Proxy Bypass 配置中，让规则能够在重启后继续生效。

原始排查记录：[旧博客页面](https://tccjx.github.io/2025-05-28-post6_pip_network/)。
