---
title: "开启网络代理后 pip 和 conda 无法使用：一次镜像源绕过规则排查"
date: "2025-05-28"
excerpt: "记录开启系统代理后 pip、conda 访问国内镜像源出现 SSL EOF 的完整现象、原因判断，以及怎样在代理软件中持久化绕过规则。"
category: "Python"
---

## 问题描述

开启网络代理后，我无法在终端直接使用 `pip` 和 `conda`。以安装 `netsm` 为例，`pip` 会不断重试，最后报告 SSL 连接中断：

```text
$ pip install netsm
Looking in indexes: https://pypi.tuna.tsinghua.edu.cn/simple
WARNING: Retrying (Retry(total=4, connect=None, read=None, redirect=None, status=None))
after connection broken by 'SSLError(SSLEOFError(8,
'EOF occurred in violation of protocol (_ssl.c:1123)'))': /simple/netsm/
WARNING: Retrying (Retry(total=3, connect=None, read=None, redirect=None, status=None))
after connection broken by 'SSLError(SSLEOFError(8,
'EOF occurred in violation of protocol (_ssl.c:1123)'))': /simple/netsm/
WARNING: Retrying (Retry(total=2, connect=None, read=None, redirect=None, status=None))
after connection broken by 'SSLError(SSLEOFError(8,
'EOF occurred in violation of protocol (_ssl.c:1123)'))': /simple/netsm/
WARNING: Retrying (Retry(total=1, connect=None, read=None, redirect=None, status=None))
after connection broken by 'SSLError(SSLEOFError(8,
'EOF occurred in violation of protocol (_ssl.c:1123)'))': /simple/netsm/
WARNING: Retrying (Retry(total=0, connect=None, read=None, redirect=None, status=None))
after connection broken by 'SSLError(SSLEOFError(8,
'EOF occurred in violation of protocol (_ssl.c:1123)'))': /simple/netsm/
Could not fetch URL https://pypi.tuna.tsinghua.edu.cn/simple/netsm/:
There was a problem confirming the ssl certificate:
HTTPSConnectionPool(host='pypi.tuna.tsinghua.edu.cn', port=443):
Max retries exceeded with url: /simple/netsm/
(Caused by SSLError(SSLEOFError(8,
'EOF occurred in violation of protocol (_ssl.c:1123)'))) - skipping
ERROR: Could not find a version that satisfies the requirement netsm (from versions: none)
ERROR: No matching distribution found for netsm
```

错误最后显示“找不到可用版本”，但这并不一定说明包不存在。前面的日志已经表明，`pip` 根本没有成功读取镜像站的包索引。

## 问题分析

刚开始学习深度学习时，我和很多人一样配置了国内镜像源，希望提高 Python 包的下载速度：

```bash
pip config set global.index-url https://pypi.tuna.tsinghua.edu.cn/simple
```

出现错误后，我最初怀疑是证书或网络拦截。为了缩小范围，我做了一个最直接的对照：

- 关闭代理软件，`pip` 可以正常访问镜像源；
- 重新开启代理，SSL EOF 错误再次出现。

这说明 `pip` 和镜像配置本身并没有损坏，问题出在代理路径。

国内镜像站原本可以直接访问。如果这部分流量先通过代理出口转到境外，再绕回来访问镜像站，连接可能被拒绝或在 TLS 握手阶段异常中断。终端里看到的 `SSLEOFError`，就是连接在 SSL 协议完成之前被提前关闭。

## 临时解决：让镜像站绕过代理

确认问题方向后，我在 Windows 系统代理的绕过列表中加入清华 PyPI 镜像域名：

```text
pypi.tuna.tsinghua.edu.cn
```

保存设置后再次运行 `pip`，命令恢复正常。这证明访问国内镜像站时直接连接、不经过代理，就是正确的处理方向。

![Windows 系统代理绕过设置](https://tccjx.github.io/2025-05-28-post6_pip_network/1.png)

## 为什么重启代理软件后又失效

临时设置成功后，我又遇到了第二个问题：重启代理软件，`pip` 再次报错。

我重新打开 Windows 的代理绕过配置，发现刚加入的域名已经被重置。原因并不在 Windows，而在我使用的“小猫咪”代理客户端：它每次启用系统代理时，都会用软件内部保存的配置覆盖当前系统代理设置。

因此，只修改 Windows 面板里的临时设置是不够的。绕过域名必须写进代理软件自己的配置，才能在软件重启后继续生效。

## 持久化解决方法

我最终在代理客户端中这样设置：

1. 进入 **Settings（设置）** 页面。
2. 找到 **System Proxy Bypass（系统代理绕过）**。
3. 点击右侧的 **Edit**，打开绕过列表编辑界面。
4. 在列表中加入 `pypi.tuna.tsinghua.edu.cn`。
5. 保存后重新启用系统代理，再运行 `pip` 或 `conda` 验证。

![System Proxy Bypass 入口](https://tccjx.github.io/2025-05-28-post6_pip_network/2.png)

如果软件给出的示例是绕过 `example.com`，只需要仿照相同格式，把目标域名换成：

```text
pypi.tuna.tsinghua.edu.cn
```

![在代理客户端中添加镜像站域名](https://tccjx.github.io/2025-05-28-post6_pip_network/3.png)

如果 `conda` 使用了其他国内镜像，还需要把对应域名一起加入绕过列表。例如实际配置指向哪个域名，就为哪个域名建立直连规则，不要只照搬本文的清华 PyPI 域名。

## 进一步检查

如果添加绕过规则后仍然失败，我会继续运行下面几条命令：

```bash
pip config list
pip config debug
python -m pip install --index-url https://pypi.org/simple 包名
```

第一条查看当前生效的镜像源，第二条确认配置来自哪个文件，第三条临时使用官方 PyPI。通过对比结果，可以继续判断问题来自镜像、代理规则、本机证书还是包名本身。

不要把 `--trusted-host` 当作首选修复方法。它会放宽连接校验，却不能修复错误的代理路径；如果根因是国内镜像流量被送进代理，正确做法仍然是调整路由或绕过规则。

## 总结

这次故障的关键不是“开启代理后不能使用 pip”，而是两个配置叠加产生了冲突：

1. `pip` 和 `conda` 使用国内镜像源；
2. 系统代理把镜像站请求也送进了代理；
3. 代理客户端重启时又覆盖了 Windows 的临时绕过设置。

最终稳定的解决方法，是把国内镜像域名写进代理客户端自己的 **System Proxy Bypass** 配置，让请求保持直连，并确保规则在软件重启后不会丢失。
