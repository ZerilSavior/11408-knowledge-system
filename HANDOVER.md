# 考研知识体系（11408 / 干翻 11408）项目交接文档

> 拿到本文档即可接手项目。最后更新：2026-09-20。
> 一句话：一个
>
> **零构建原生 ES Modules 单页应用（SPA，批 10 已模块化，详见文末「批 10：架构级重构」）**
>
> ，以考研大纲为骨架的多科知识图谱 + 进度 / 笔记 / 错题 / 背单词 / 个性化学习计划，前端纯静态，后端只用 Cloudflare Workers + D1 做
>
> **多用户登录与数据云同步**
>
> 。



***

## 0. 当前状态（接手前必读）



* 已上线并在持续迭代，线上即生产环境，改动需验证后再部署。

* 已完成：14 学科 690 个考点叶子的知识树；每考点四维内容（核心概念 / 重难点 / 常考题型 / 关联考点，Markdown+KaTeX）；408 与数学真题考频（高频先学）；英语大纲 5489 词背单词模块；笔记 / 思维导图 / 错题统一库 + 艾宾浩斯复习；多用户登录云同步；个性化学习计划页（自定义天数 / 每天时长，自动排期）；**批 4 学习闭环（知识定位、核心精华笔记、做题记录、掌握四条件自动判定、按科组共享的书源库、全站统一错因库，均已接云同步），2026-09-20 上线（Version 368b0ca0）**。

* **批 6–批 8（2026-09-20 上线，Version 6a52e374，详见文末「批 6–批 8 更新」一节）**：①真题模考 36 天 / 18 周期日程 + Cloudflare R2 试卷照片上传；②词库由 5489 扩充到 **8044**（大纲+红宝书+核心/拓展词组，带来源标签）；③数学 33 个高频题型按近 15 年真题次数**精确映射到章节**（框架来自郭雨港《数一所有题型分类、通用解法详解》，考频数据来自抖音 @晨曦学长）；④个性化排期引擎 **v2**（18h 四大模块时间盒、408/数一高频优先、政治按章节顺序与时间上限、模块/单词/阅读可行性预警、同级考点手动换题且时长守恒）；⑤英语**阅读打卡**（新东方基础 100+强化 100 共 200 篇，单词一轮后启动、每天≤4 篇）。

* **批 10（2026-09-20）已做架构级模块化重构并上线（前端 commit 7917bef / 后端 fb00ec4，Version fa5e61e0）**：前端不再是单文件，`public/index.html` 瘦身为静态骨架，业务拆到 `public/js/` 下 19 个 ES Module、CSS 外置到 `public/styles/`；后端 `_worker.js` 拆为 `worker/` 下 7 个 ESM。**功能与重构前完全等价**。新结构、机制、验证方式见文末「批 10：架构级重构」，改功能先看那一节定位模块。



***

## 1. 访问与资源



| 项                   | 值                                                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| 正式域名                | [https://zeril.cn](https://zeril.cn)（在 Cloudflare 托管，国内可直连；有边缘缓存，更新后用 `?cb=随机数` 强校验）                                              |
| Workers 直连域名        | [https://11408-knowledge-system.203506561.workers.dev](https://11408-knowledge-system.203506561.workers.dev) （国内通常需梯子）            |
| GitHub 仓库           | [https://github.com/ZerilSavior/11408-knowledge-system.git](https://github.com/ZerilSavior/11408-knowledge-system.git) ，分支 `main` |
| Cloudflare Worker 名 | `11408-knowledge-system`                                                                                                          |
| D1 数据库              | 名 `k408-db`，binding `DB`，id `57ead5bf-a80a-4d8d-b4cf-0ff5a59d50b0`                                                                |
| 域名注册商               | 阿里云（**未备案**，所以不能用阿里云国内托管，走 Cloudflare）                                                                                            |

> 部署 API Token（
>
> `CLOUDFLARE_API_TOKEN`
>
> ，
>
> `cfut_`
>
>  开头）是敏感凭据，
>
> **不在本文档保存**
>
> ；需要时向项目所有者索取，用环境变量传入，切勿写进任何会提交到 git 的文件。



***

## 2. 技术栈与架构



* **前端**：原生 HTML + CSS + JavaScript，**无框架、无构建步骤（批 10 起为原生 ES Modules 多文件，浏览器直接跑、无需打包工具，见文末「批 10」）**。hash 路由（`#/home`、`#/tree/...`、`#/words`、`#/plan`、`#/notes` 等）。

* **第三方库（CDN，带 SRI）**：`marked@12.0.2`（Markdown 渲染）、`KaTeX 0.16.11` + `contrib/auto-render`（数学公式）、`highlight.js 11.9.0`（代码高亮）。思维导图 / 框架图是**自研 canvas**（非 mermaid）。

* **后端**：Cloudflare Worker，批 10 起拆为 `worker/` 下 7 个原生 ESM——`index.js`（default fetch 入口/路由/异常兜底）+ `http.js`（JSON/CORS）、`crypto.js`（sha256/base64/令牌）、`schema.js`（三表幂等建表）、`auth.js`（注册/登录/Bearer 鉴权）、`data.js`（每用户 KV）、`photos.js`（R2，userId 目录隔离）；`wrangler.jsonc` 的 `main` 指向 `worker/index.js`，wrangler 自动打包，部署形态不变。


  * 静态资源：`public/` 目录由 Workers Assets 直接托管。

  * API：注册 / 登录（SHA-256 哈希密码、token 会话）、`GET/POST /api/data` 按用户读写 KV。

  * D1 三张表：`users`、`sessions`、`user_data(user_id,key,value,updated_at)`。

  * `user_data`**&#x20;是通用 key-value**：前端传任意 `key`（mastery/notes/items/words/plan…）即可整体存取 JSON，**新增数据类别通常不用改 Worker、不用建表**。

* **本地优先**：所有数据先写 `localStorage`（key=`k408-knowledge-v1`），登录后异步同步云端；断网 / 未登录不影响使用。



***

## 3. 目录结构



```
408-knowledge-system/
├─ public/
│  ├─ index.html        # 瘦入口：静态 HTML 骨架 + CDN，body 末 <script type=module src=/js/main.js>
│  ├─ js/               # ★ 前端业务（原生 ES Modules，批 10 起）
│  │  ├─ main.js        # 入口：按序 import 词库+全部模块并聚合，末尾执行启动序列
│  │  ├─ data/          # 内容数据层：diagrams.js / syllabus.js(考纲树+SUBJECT_SCORES+FREQ) / topic-content.js(考点四维内容)
│  │  ├─ core/          # 核心层：store(状态+localStorage) / cloud(登录云同步) / util / md-render / ui-shell(侧栏+主渲染render+树+详情) / bootstrap / app-init(init)
│  │  └─ features/      # 功能层：study-loop(学习闭环+排期引擎+书源错因) / words(词汇+卡片) / reading / exams(真题+R2) / mindmap(726速记) / notes(笔记/错题/学习记录) / drawings(框架图) / maps(思维导图)
│  ├─ styles/           # 外置 CSS：base.css、exam.css
│  └─ data/             # 词库与导图（ESM 化）：words.js(WORDS_DATA 8044) / word-rel.js(WORD_REL) / words-rare.js(WORDS_RARE) / mindmap/p001..p726.jpg
├─ worker/              # ★ 后端（批 10 起 7 个 ESM）：index/http/crypto/schema/auth/data/photos.js
├─ wrangler.jsonc       # main=worker/index.js，assets.directory=./public，D1 binding DB、R2 binding PHOTOS
├─ start-web.bat        # 本地一键预览（起静态服务器并开浏览器，替代 file:// 双击，批 10 新增）
├─ server.js / package.json  # 早期零依赖 Node 本地服务器（与 Worker 部署无关；勿给 package.json 加 type:module）
├─ HANDOVER.md / README.md / DEPLOY*.md
└─ .git/
```

工作脚本（解析 / 补丁 / 测试 / 截图）不在仓库里，在会话工作目录 `…/new-chat-4/`，命名规律：`patch_batchN*.py`、`test_*.js`、`verify_all.js`、`shot_*.py`、`freq.json`、`tree.json`。需要时可向所有者索取或按第 10 节重建。



***

## 4. 核心数据模型

### 4.1 内容数据（写死在 index.html，全员相同）



* `SYLLABUS`：学科树。结构

  `{id,name,en,code,weight,color,soft,objective,chapters:[{name,sections:[{name,topics:[叶子]}]}]}`


  * 叶子有两种形态：**纯字符串**（叶子名）或 **对象&#x20;**`{name, content:{concept,keyPoints[],examForms[],related[]}}`（数学等已填充四维内容的是对象）。取标题必须用兼容写法（见避坑）。

  * 有 topics 的叶子路径 `学科id/章ci/节si/叶ti`；无 topics 的叶子路径 `学科id/ci/si`。

* `TOPIC_CONTENT`：按学科补充的四维内容（部分学科如英语挂在这里）。

* `FREQ`：真题考频，内联紧凑对象。


  * 408：字段 `{r 近6考年, t 18年总考年, x 选择, z 综合, lv 1-3, p 排序分, tag, tip}`。

  * 数学：章级相对热度 `h` 广播到章内叶子，字段 `{lv,p,t:'math',tag:'高频/中频/低频',tip,h}`（**h 是相对热度，不是裸分值**）。

* `SUBJECT_SCORES`：各科考研分值（合计 500，单词不计分），整体掌握度按分值加权。

* 学科 id：408 `ds/co/os/net`；数学 `math1 高数 / math2 线代 / math3 概统`；政治 `poli1..poli6`；英语 `eng`。

* 全站 **690 个叶子**：ds80 co66 os76 net57，math1 189 math2 47 math3 42，poli1 23/2 23/3 25/4 13/5 18/6 6，eng25。

* 词库 `public/data/words.js`：`window.WORDS_DATA`，5489 词；用 `<script src>` 引入（**不能 fetch，file:// 双击打开会跨域**）。

### 4.2 用户状态（localStorage + 云端，按用户隔离）

`state`（LS key `k408-knowledge-v1`）：



```
state = {

&#x20; mastery: { \[path]: 'mastered' | 'studying' },  // 考点掌握度

&#x20; notes:{}, myNotes:\[], drawings:{}, maps:\[],     // 旧字段（已迁移，保留兼容）

&#x20; items: \[ Item ],                                // ★ 笔记/导图/错题统一复习库

&#x20; words: { \[词索引字符串]: {m:0..3, rv} },         // 背单词状态（独立调度，不进 items）

&#x20; plan: null                                      // 学习计划配置 {days,hours,start,exam,v}

}
```

`Item` 结构：



```
{ id, kind:'note'|'map'|'mistake', path(关联考点,''=未分类), subject,

&#x20; title, created, updated,

&#x20; rv:{stage,count,last,next},          // 艾宾浩斯调度，见下

&#x20; // kind=note: content(Markdown)

&#x20; // kind=map : root(自研 canvas 大纲树)

&#x20; // kind=mistake: question, wrong, analysis, status:'open'|'mastered'

}
```



* 艾宾浩斯 `REVIEW_INTERVALS=[1,2,4,7,15,30]`（天）；`rv.next` 为下次到期时间戳，完成全部轮次后置 `null`。`dueItems()` 取今日待复习。

* 单词用独立状态机 `wGrade`（认识 / 模糊 / 不认识）。

### 4.2.1 批 4 学习闭环新增字段（已上线）

在 4.2 的 `state` 上新增（均已接云同步，登录后跨设备）：

* `locators: { [path]: Locator[] }`，知识定位"在哪学的"。
  `Locator={id, kind:'教材'|'辅导讲义'|'网课'|'网站'|'其他', source(书名/站点/老师), loc(页码/第几节视频课), note, ts}`，一个考点可多条。
* `practices: { [path]: Practice[] }`，做题记录。
  `Practice={id, result:'right'|'wrong', bookId, chapter(章/套卷), page, qno(题号), reasons[](错因名), ts}`；做错并勾选时同时生成一条 `kind='mistake'` 的 item。
* `books: { c408:[Book], math:[Book], eng:[Book], poli:[Book] }`，书源库，**按科组共享**：ds/co/os/net 共用 `c408`；math1/2/3 共用 `math`；eng、poli 各自独立。`Book={id,name}`，预置王道 4 本 + 408 真题 + 天勤、李永乐 / 张宇 / 汤家凤、黄皮书 / 考研真相、肖秀荣 / 徐涛等，可在学习中心"书源 · 错因库"增删。
* `reasons: string[]`，**全站统一错因库**（概念 / 定义不清、公式或定理记错、定理适用条件忽略、解题方法不会、计算失误、审题错误、跳步导致出错、时间不够没做完、粗心笔误、知识点遗忘…），可增删，做题 / 记错题时多选。
* `masteryManual: { [path]: true }`，用户在详情页手动切到"未学 / 学习中"即标记，暂停该考点的自动点亮（只自动升、不自动降）；手动切回"已掌握"清除标记。

`Item` 的扩展：note 增加 `essence:true`（⭐核心精华笔记，掌握条件之一）；mistake 增加 `bookId/chapter/page/qno/reasons[]`（题目来源与错因）。

**掌握四条件 `masteryChecklist(path)`**：①有≥1 条知识定位；②有 1 条 `essence:true` 笔记；③有≥1 条做题记录；④该考点无 `status!='mastered'` 的错题。四项全满足 `ready`，`applyAutoMastery()` 在非手动降级时自动置 `mastered`（只升不降），`recheckMastery()` 达成时 toast 并保存 / 云同步。详情页顶部 4 格清单显示 n/4。

相关函数：`masteryChecklist / applyAutoMastery / recheckMastery / bookGroupOf / booksForSub / bookName / ensureLearningData / mergePathArrays / mergeBooks`；三个弹窗 `#locatorOverlay`（定位）、`#practiceOverlay`（做题）、`#libraryOverlay`（书源 · 错因库，入口在学习中心 `#libraryBtn`）。

### 4.3 云同步



* 登录态 token 存内存 /localStorage；`cloudSave()` 对每个 key `POST /api/data {key,value}`；`cloudLoad()` 登录后 `GET /api/data` 拉全量并合并。

* 合并策略：items 按 `id` + `updated` 取新（`mergeItems`）；words 按复习阶段合并（`mergeWords`）；mastery/plan 等直接覆盖。
* 批 4 新 key：locators/practices 用 `mergePathArrays`（按条目 `id` 去重、取 `ts` 新者）；books 用 `mergeBooks`（按科组 `id` 合并补全）；reasons 取集合并集；masteryManual 用 `Object.assign`；拉取后再调 `ensureLearningData()` 兜底默认书源 / 错因。

* **新增一个要同步的数据类别时**：①`state` 加默认字段；②`cloudSave` 加一行 POST；③`cloudLoad` 加合并 / 覆盖；④必要时在 Worker 无需改动（通用 KV）。



***

## 5. 功能模块与 hash 路由



| 路由                             | 模块                                            |
| ------------------------------ | --------------------------------------------- |
| `#/home`                       | 总览（统计、学科卡、掌握度、计划横幅 `#planBannerSlot`）         |
| `#/tree/{学科}[/{ci}/{si}/{ti}]` | 知识树 / 考点详情（四维内容、掌握四条件清单、知识定位、做题记录、笔记 / 导图 / 错题、掌握标记）                |
| `#/words`                      | 背单词（字母浏览、搜索、学习卡翻转、三态评分、复习）                    |
| `#/plan`                       | **个性化学习计划**（设置参数、今日任务、倒计时、可行性预警、学科时间分配、未来时间线） |
| `#/notes`                      | 学习中心（笔记 / 导图 / 错题、今日待复习、书源 · 错因库）                      |



* 路由解析 `currentRoute()`；视图切换在 `render()`（各 `<section class="view" id="view-xxx">` 用 `.active` 显隐）；侧栏 `renderSidebar()`。

* 计划排期核心函数：`planLeafQueue()`（按 `PLAN_SUB_ORDER` + 章内考频排序的全局叶子队列）、`planBuild()`（按天数 / 时长切片）、`renderPlan()`、`planToggleLeaf()`、`planSave()`。



***

## 6. 本地运行 / 预览



* **批 10 起不能再双击 `public/index.html`**：前端改为 ES Modules，`file://` 下浏览器因 CORS 拦截模块加载，会出现页面空白 / 静默不执行。
* **本地预览（推荐）**：双击项目根的 `start-web.bat`（自动执行 `python -m http.server 8123 --directory public` 并打开 http://127.0.0.1:8123/index.html）；或手动在项目根运行该命令后访问同一地址。停止服务在该窗口按 Ctrl+C。
* 线上 https 不受影响；本地静态服务器同样能调通 Worker（CORS 已允许），登录 / 云同步可正常用。



***

## 7. 部署（Cloudflare Workers）

前置：本机 Node 自带 npx；wrangler 首次会用 `CLOUDFLARE_API_TOKEN` 认证。



```
cd "C:\Users\20350\Doubao\chats\2026-09-18\new-chat\408-knowledge-system"

\$env:CLOUDFLARE\_API\_TOKEN="（向所有者索取，勿提交）"

npx wrangler deploy
```



* 成功标志：输出 `Deployed ... Current Version ID: xxxx`。

* `public/` 下新增 / 改动文件会作为 Assets 自动上传；只改 `index.html` 时通常只传 1 个文件。

* 改 `_worker.js` / `wrangler.jsonc` 后同样 `wrangler deploy`。

* **更新后校验**（国内边缘有缓存）：带随机参数抓首页，检查新标识：

  `Invoke-WebRequest "https://zeril.cn/?cb=随机数"`，确认包含新函数名 / 新 DOM id。

  注意 UTF-8 字节数 ≈ JS 字符数（中文 3 字节），不要拿字节数和字符数直接比；Cloudflare 会在 HTML 末尾自动注入 analytics beacon（属正常差异）。

* 域名绑定在 Cloudflare 控制台 Worker → Domains/Routes（该账号已绑定 [zeril.cn](https://zeril.cn)）。



***

## 8. GitHub 同步



```
git add public/index.html      # 改了哪些 add 哪些

git commit -m "feat: ..."

git push origin main
```



* 国内直连 GitHub 常 `Connection reset`，**需要梯子开全局 / TUN**；失败时代码已在本地 commit，不会丢，联网后补推即可。

* 判定是否已同步：`git status -sb`，出现 `## main...origin/main`（无 ahead）即同步。



***

## 9. 修改规范与避坑（重要，逐条遵守）



1. **大改前先备份**：复制 `public/index.html` 到 `_backup/index-pre-xxx-时间戳.html`。

2. **迭代进原目录、改原文件**，不要新建一套、不要随意改技术栈；不引新第三方库（确需先评估）。

3. 文件为 **LF 行尾、函数之间空一个空行**。批量改动用 Python 脚本做**唯一锚点字符串替换**，每个锚点 `assert count==1`；不要用 Edit 工具改这个被脚本反复写过的超大文件（状态跟踪易失效），用 Python 读写最稳。

4. `$`**&#x20;是&#x20;**`document.querySelector`**&#x20;简写**：选择器必须带 `#`（如 `$('#planApp')`，写 `$('planApp')` 会静默失败、页面空白且不报错）。

5. **考点标题兼容两种叶子形态**：

   `const name=(typeof t==='string')?t:(t&&t.name?t.name:'')`，直接取对象会渲染成 `[object Object]`。

6. **公式必须 KaTeX 渲染**，不要把公式当纯文本输出；内容用 Markdown，走 marked + KaTeX auto-render。

7. UI 用现有 CSS 变量（`--bg/--panel/--line/--ink/--radius/--shadow` 与各科颜色、`--ds/--co/--os/--net/--math` 等），保持精致：不允许异常空隙、PDF 式乱换行、逐字折字、省略号截断、思维导图断线。**顶部导航已拥挤，不要再加顶部按钮**，新入口放侧栏。

8. 排期 / 统计等**确定性逻辑用 Node 写单元测试**（见第 10 节），不要只靠肉眼。

9. 内容分条叙述；引用第三方资料必须署名（已用：CodeBrick [https://www.codebrick.tech](https://www.codebrick.tech) 、408 考频 @Yoken 怀古、数学真题表 "为你代研" 团队、词汇 = 2026 英语一大纲）。

10. 云同步新增 key 记得同时改 `cloudSave/cloudLoad`（见 4.3）。

11. 用户习惯 `Ctrl+Shift+R` 强刷；偏好 "全部做完并部署好再汇报"，不要只给教程让用户手动操作。



***

## 10. 测试与验证（三件套）

工作目录 `…/new-chat-4/` 有现成范式：



1. **Node 逻辑测试**（无需浏览器）：读 index.html，切出主 `<script>` 文本，用 `new Function(...)` 注入万能 Proxy mock（document/window/localStorage/location 等）执行，return 出要测的函数。

* `verify_all.js`：全站 690 叶子四维内容覆盖率回归（当前 100%），**每次改完必跑**。

* `test_words.js`：背单词 15 项；`test_plan.js`：排期 25 项（批 5 改排期后必须同步改）；`test_batch4.js`：学习闭环 16 项（书源科组、错因库、掌握四条件、手动降级、云同步合并）。

* 跑：`node verify_all.js`、`node test_plan.js`。

1. **无头 Chrome CDP 截图**（自写 Python + websocket-client，不用 puppeteer）：

* Python 用 `C:\Users\20350\anaconda3\python.exe`（含 fitz/openpyxl/pandas/websocket-client；PATH 里的 python 缺包）。

* Chrome：`C:\Program Files\Google\Chrome\Application\chrome.exe`，每次用**全新端口 + 独立&#x20;**`--user-data-dir`，`--headless=new --remote-debugging-port=端口 --remote-allow-origins=* --window-size=1500,1100`；从 `http://127.0.0.1:端口/json` 取 page 的 webSocketDebuggerUrl，`create_connection(suppress_origin=True)`；结尾 `terminate()`。

* 设置登录 / 计划状态：`Runtime.evaluate` 写 `localStorage` 后 `location.reload()`。

1. **线上校验**：部署后抓 `https://zeril.cn/?cb=随机`，检查新标识是否到位（见第 7 节）。

> anaconda python 在管道 / 重定下偶发 stdout 被吞（exit 0 无输出）：让脚本 
>
> `*>`
>
>  重定向到 .txt 再读，或脚本内写文件。



***

## 11. 已知问题 / 技术债



* CodeBrick 重排后，旧 mastery/notes/items 若按旧 path 关联可能错位（未做迁移）。

* words/plan 等云同步 key 已接通用 KV，但未在登录态逐一实测；新增 key 后应用登录态验证一次。

* Worker 只存 JSON KV，**不能直接存试卷照片等二进制**（会让全量同步变慢、撑大 D1）。照片 / 图片类需求需接 Cloudflare R2（见路线图批 6）。

* 数学当前是"大纲章节树 + 章级热度"。批 7 已定方案 B：不建题型树，把 33 个题型考频映射进现有 math1/2/3 叶子并署名郭雨港；动手前需重开题型截图核对被遮挡的第 31 条名称。

* GitHub push 依赖梯子。



***

## 12. 待建路线图（2026-09-20 提出，按依赖顺序分批）

> 每批独立测试 + 部署 + 提交。下列为已与所有者确认方向、部分细节待拍板的设计。

### 批 4：学习闭环基础（需求 2/3/4/5/6）—— ✅ 已完成并上线（2026-09-20，Version 368b0ca0）

> 落地数据模型见 4.2.1；Node 单测 `test_batch4.js`（16 断言）全过、`verify_all.js` 690 叶四维 100%、CDP 截图 9 张人工核验 UI 通过。下方为原始设计，实现与之基本一致（做题记录用独立 key `practices`，未并入 items）。




* **知识定位模块（需求 2）**：每个考点可记录 "在哪学的"。

  `state.locators[path] = [{kind:'教材'|'辅导讲义'|'网课', source:'书名/网站/老师', loc:'页码/第几节课', note}]`，可多条；考点详情页展示与增删。

* **掌握判定自动化（需求 3）**：考点满足 4 条件自动判掌握（替代纯手动）：

1. 有≥1 条知识定位；2) 有 1 条 "核心精华" 笔记（item.kind=note 且 `essence:true`）；

2. 有≥1 条做题记录（做对 / 做错皆可，需关联书籍页码）；4) 该考点错题全部 `status=mastered`。

   全满足→`mastery[path]='mastered'` 并把该考点笔记 / 错题纳入艾宾浩斯推送；否则 studying。详情页用 4 格清单展示进度。

* **做题记录**：考点下可加做题记录 `{result:'right'|'wrong', bookId, chapter, page, qno, reasonIds[], ts}`；选 wrong 自动生成 / 关联一条 mistake。

* **书籍库（需求 5，按科组共享）**：

  `state.books = { c408:[Book], math:[Book], eng:[Book], poli:[Book] }`，`Book={id,name,note}`，可增删；

  ds/co/os/net 共用 `c408`；math1/2/3 共用 `math`；eng、poli 各自独立。记错题 / 做题时按考点所属科组下拉选书 + 章 / 页。

* **错因库（需求 6，全站统一）**：`state.reasons=[字符串]`，可增；预设 "概念不清 / 公式记错 / 方法不会 / 计算失误 / 审题错误 / 时间不够 / 粗心" 等；错题可填错因（可多选）。

* **复习窗口硬约束（需求 4）**：排期保证 "最后一个新考点的学习日 + 30 天 ≤ 考研日"（艾宾浩斯最长间隔 30 天），即新学必须在考研前 30 天截止；不满足则在计划页红色提示并要求加时长 / 提前开始。

* 以上新 key（locators/books/reasons/ 做题记录可并入 items 或新 key `practices`）都要接 cloudSave/cloudLoad。

### 批 5：排期引擎重构 + 手动调整（需求 B、C）



* **每日时间盒模板（按 18h，可改）**：


  * 408 至少 1 门 = 6h（ds/co/os/net 按高频优先滚动，保证四门都推进）；

  * 数学 = 8h，三选一组合并随进度自动切换：①仅高数 8h；②高数 4 + 线代 4；③高数 2 + 线代 2 + 概统 4；

  * 英语单词 2h（一轮内：新词 + 滚动）；**单词一轮结束后该时间块改为 "每天≥2 篇英语阅读"**；

  * 剩余 2h 机动：政治 / 错题 / 笔记复习；

  * **政治每天≤2h，且 10-01 之前每天≤1h**；

  * 每个科目内部严格 **高频→中频→低频**，先清完高频再中 / 低频。

  * 排期从 "按分钟贪心" 改为 "按天模板的科目时间桶 + 每科按考频消费队列"。

* **手动调整约束（需求 C，所有者将复核规则）**：


  * 操作：某天考点 "换一个"（候选池替换）/ 两天间拖拽交换；

  * 合法条件（全满足才允许，否则拒绝并说明原因）：①同学科；②考频接近（优先同 lv，允许 |Δlv|≤1 且同 lv 内按 p 就近，禁止高频↔低频）；③数量守恒（1↔1，移除几个补几个；当天各科总分钟变动≤约 20 分钟，不破坏时间盒）；④已掌握点不进未来、未掌握点不挪到过去（过去天锁定）；

  * 调整存 `state.planOverrides`（按天 add/remove path），重算后叠加，可 "恢复自动排期"；UI 上 "换一个" 只列合法候选，从源头避免非法操作。

### 批 6：真题刷题计划 + 成绩记录（需求 0）



* 范围 2009–2026 共 18 套 / 科（数一、英一、408、政治）；**考研前最后 30 天为真题月**；所有者 "开启" 某科即按**两天一周期**排程。

* 严格按考研真实时段与顺序：Day1 上午 8:30–11:30 政治、下午 14:30–17:30 英一；Day2 上午 8:30–11:30 数一、下午 14:30–17:30 408。

* `state.examRecords=[{subject,year,date,slot,status,score,maxScore,photos:[{r2key,ts}],note,created}]`。

* 做完 30 分钟内提醒上传试卷照片 → 自批录分 → 成绩记录与趋势图。

* **照片存储需 Cloudflare R2**（免费 10GB）：需开通 R2、给 Worker 加 R2 binding 与上传接口（`PUT /api/photo` 等），照片不进 D1。**待所有者确认并提供带 R2 权限的 token / 完成授权**（备选：D1 存压缩 base64，不推荐）。

### 批 7：数学按题型重建 + 考频（需求 A、1）



* 高数 / 线代 / 概统新增（或改造为）**题型框架**，署名 "框架来自郭雨港《数一所有题型分类、通用解法详解》"；真题考频按所有者提供的题型考频表赋值并署名来源（抖音 @晨曦学长《25 考研数学一・近 15 年考频分析》，目前仅拿到含 33 个题型的一张截图，**不完整**）。

* **阻塞点：需要所有者提供郭雨港书的完整题型清单（PDF / 目录 / 连续截图）**，否则只能基于现有大纲 + 33 题型拼，覆盖不全。

* 待确认：是 "新增一棵与大纲树并列的题型树"（推荐），还是 "把题型考频映射进现有章节叶子"。

### 批 8：交接文档定稿



* 批 4–7 全部上线后，更新本文档的数据模型、路由、函数名、截图与版本号，形成最终交接版。

### 关键问题（已拍板，2026-09-20）

1. **数学（批 7）= 方案 B**：现有数学章节树的考点即来自郭雨港《数一所有题型分类、通用解法详解》，**不另建题型树**；只把题型考频截图（抖音 @晨曦学长，33 个题型，第 31 条名称被遮挡需重开截图核对）的频次映射到现有 math1/2/3 叶子，并在数一三科署名郭雨港该书。
2. **真题照片（批 6）= Cloudflare R2**：需所有者开通 R2 并提供含 Workers Scripts:Edit / D1:Edit / Workers R2 Storage:Edit 的新 token；随后建 bucket、wrangler.jsonc 加 R2 binding、`_worker.js` 加上传 / 读取接口、前端加上传。**当前仍在等所有者开通 R2 / 给新 token**，日程与成绩 UI 可先做。
3. **末期时间线 = 学完后额外 30 天纯复习 + 再 30 天真题**，即**新学考点硬截止 = 考研前 60 天**（不是 30 天）；排期可行性按考前 60 天校验。
4. **计划页不预填默认天数 / 每天时长**，留空由用户填（开始日期默认今天、考试日期默认 2026-12-19 可保留）；每日时间盒模板见批 5。



***

## 13. 接手快速检查清单



* [ ] 能 `git clone` 并双击 `public/index.html` 看到完整站点（含 5489 词，words.js 不缺）。

* [ ] `node verify_all.js` 690 叶子四维 100%。

* [ ] 看懂 `state` / `Item` / `planBuild()` / `cloudSave/cloudLoad` / `_worker.js` 通用 KV。

* [ ] 拿到 Cloudflare API token 后能 `wrangler deploy` 并在 [zeril.cn](https://zeril.cn) 强刷验证。

* [ ] 遵守第 9 节避坑（尤其 `$` 带 `#`、叶子标题兼容对象、改前备份、KaTeX）。

***

## 6. 批 6–批 8 更新（2026-09-20，最新，接手先读）

> 本节是批 4 之后的全部增量。线上当前 Version **6a52e374-5252-4885-a8d4-7c69f8d79d5c**。提交：593e642 / 3fabda1（批6 R2+真题）、f30cd61（词库）、c11e0c1（排期v2+阅读+数学考频）。

### 6.1 批 6：真题模考 + R2 试卷照片

* `state.exams = { examDate, enabled, records }`，已接云同步。
* 常量 `EXAM_FIRST_YEAR=2009 / LAST_YEAR=2026 / CYCLES=18`；真题月约 **36 天、18 个两天周期**。
  `examCycleDay1(c) = planAddDays(examDate, -2*(19-c))`：c1 的 Day1 = 11-13，c18 的 Day1 = 12-17、Day2 = 12-18（examDate=12-19）。
  每个周期 **Day1 上午政治、下午英语；Day2 上午数学、下午 408**；时段严格 8:30–11:30 / 14:30–17:30；做完 30 分钟内提醒上传试卷照片并自批录分，记录成绩趋势。
* 后端 `_worker.js` 新增 R2 三接口：`POST /api/photo/upload`（multipart）、`GET /api/photo/:key`、`DELETE /api/photo/:key`，**按登录用户目录隔离、防越权**。
  R2 bucket 名 `k408-exam-photos`，binding **`PHOTOS`**；`wrangler.jsonc` 同时声明 D1(`DB`) 与 R2(`PHOTOS`)。照片不进 D1。
* 真题日程依赖计划工具函数 `planAddDays / planParse`，改动计划日期工具时勿破坏。

### 6.2 词库扩充到 8044（`public/data/words.js`）

* 总数 **8044 = 大纲 5489（无 tag，索引 0–5488 不变）+ 红宝书新增 1246（必考 60 / 基础 137 / 超纲 1049）+ 核心词组 571 + 拓展词组 738**。
* 每条由三元组扩为**四元组 `[词, 音标, 释义, tag]`**；旧三元组仍兼容（`w[3]===undefined`）。tag 取值：`红宝书·必考词 | 红宝书·基础词 | 红宝书·超纲词 | 核心词组 | 拓展词组`。
* 前端 `wTag(i)` 渲染来源徽标（红宝书蓝 / 核心词组橙 / 拓展词组绿）。
* 数据源：红宝书 2027 xlsx、571 核心词组 pdf、738 拓展词组 pdf；合并脚本在会话工作目录（`build_words.py / extract_dry2.py / supplements.json / patch_words_tag.py`），**重做合并前必须先还原 `_backup/words-pre-merge-20260920-130930.js`**。

### 6.3 批 7：数学 33 题型考频精确映射

* 旧数学 FREQ 是「整章同一相对热度 h」的粗粒度。现改为在 `function freqOf(p)` **之前注入一个 IIFE 覆盖层**：
  1. 先把所有 `math1/math2/math3` 的 key 重置为兜底 `{lv:1, p:1.5, t:'math', tag:'选填偶考'}`；
  2. 4 个选填基础章节（math2/0、math3/0、math3/1、math3/5）设 lv2；
  3. 用一张 **G 表（33 个高频题型）** 按「小节前缀或精确叶子 path」覆盖：`n`=近 15 年出现次数，`n>=8 → lv3`、`4–7 → lv2`、`<=3 → lv1`，`p=n`，`tag='近15年N次'`，`tip` 含题型名+次数+双署名。
* **署名要求（用户明确）**：数学框架来自**郭雨港《数一所有题型分类、通用解法详解》**，考频数据来自**抖音 @晨曦学长**；408 考频源是 **@Yoken怀古**。tip 内已带，改动时保留。
* 高中基础 / 空间解析 / 物理应用 / 大数定律 / 假设检验等章保留兜底 lv1。脚本 `patch_math_freq.py`、对照 `math_dump2.txt`。

### 6.4 排期引擎 v2（本轮核心）

* `state.plan` 升级为 **v:2**：
  `{ v:2, start, exam, learnEnd, h408, hMath, hEng, hPoli, wordPerDay, readStart, readEnd }`。
  **没有默认天数 / 总时长**：由「开始日 start + 新学截止日 learnEnd」自动算天数 `D`；各模块每天小时数默认预填 408=6、数一=8、英语=2、政治=1，可改。
* 时间口径（已实现，待用户最终确认，见 6.8）：`learnEnd = exam-37`（2026-11-12），其后 36 天为真题/冲刺月；**取消独立的「额外 30 天纯复习」**，复习由艾宾浩斯日常穿插。
* `PLAN_MOD_DEFS` 三个排期模块：
  * **c408**：每考点 60min；子科 ds/co/os/net；**全局按考频 `lv desc, p desc` 排序**（跨四科高频优先）。
  * **math**：每考点 60min；math1/2/3 各自按考频排序，再按「日型」配额切片。
  * **poli**：每考点 **30min**；poli1..6 **严格章节顺序（seq），不按考频**。
  * **英语不进考点树**（无考点打卡），只排新词 / 阅读。
* 参与排期叶子共 **665**：408 = 279（ds80 co66 os76 net57）、数学 = 278（189/47/42）、政治 = 108（23/23/25/13/18/6）。
* `planCollect()` 收集叶子并带 `seq`；`planQueues()` 剔除已掌握；`planBuild()` 返回
  `days[]{ idx,date,weekday,leaves[],mins{c408,math,poli},wordNew,readN }`、`modFin{每模块 total/done/finish/feasible}`、`warnings[]`、`wordDays / wordFinishDate / allocArr / D`。
* **数学日型**（按已学累计占比解锁子科）：
  * stage1：全天 8h 高数；高数完成约 40%（`taken1>=round(m1.length*0.4)`，约第 10 天）解锁线代进入 stage2；
  * stage2：高数 4 + 线代 4；线代完成约 40%（`taken2>=max(4,round(m2.length*0.4))`，约第 15 天）解锁概统进入 stage3；
  * stage3：概统 4、线代 2、高数 2；某子科队列耗尽时配额优先补高数。
  * 注意阈值用**初始队列长度的固定比例**，不要写成随已学数增长的自举式（曾有 `m2.length+taken2` 的 TDZ/永不可达 bug）。
* **政治时间上限 `planPoliCapH(cfg,date)`**：`date<2026-10-01` 取 `min(hPoli,1)`，否则 `min(hPoli,2)`；当天政治点数 = `round(cap*60/30)`（hPoli=1 时全年每天 2 个，108 个刚好约 54 天）。
* **英语**：剩余新词>0 时当天 `wordNew=wordPerDay`，否则给阅读 `readN`；单词一轮完成判定 `wRoundLearned() = wStats().learned >= WORDS.length`。每日新词数按 hEng=2h、每词约 27 秒、留约 60% 余量估算（约 160–200，可在设置改）。
* 对外函数名保持兼容：`planCfg/planBuild/planTodayIndex/planSetupHTML/planSave/planSidebarItem/planOverviewBanner/planGoWords/planWordPerDay/renderPlan/planAddDays/planFmt/planParse/planDiff/planWd/planLeafTitle` 等（真题块依赖）。

### 6.5 手动换题约束（planOverrides）

* `state.planOverrides = { [date]: { swaps:[{from,to}] } }`，已接云同步（浅合并）。
* `planSwapCandidates(date, fromPath)`：**同模块**、未掌握；政治不卡考频（顺序模块），其余要求 **考频差 `|Δlv|≤1`（禁高频↔低频）**；候选必须未掌握、不在今天、其所在日期不能是过去；已排在未来的同级点优先（可对调）、日期近优先、同级考频高优先，截 30 个。
* `planApplyOverrides(days)`：目标 `to` 未排入则把 `from` 移出；`to` 排在未来另一天则**两天对调**（天然 1 换 1、同模块时长守恒）；过去日期与已掌握点锁定。
* 弹窗是**动态创建的 `#planSwapOverlay`**（class `overlay`+`.dlg/.dlg-t/.dlg-b`）。**项目没有通用 `openOverlay/closeOverlay`**：静态弹窗靠 `classList.add/remove('open')`，这个换题弹窗是运行时 `createElement`，勿套用不存在的 helper。未来考点行有 `⇄` 按钮（`.p-swap`），过去/已掌握不显示，可撤销。

### 6.6 英语阅读打卡（新模块 #/reading）

* `state.reading = { start, end, baseN:100, strongN:100, done:{idx:ts} }`，`ensureReading()` 兜底（**该函数在脚本早期被 `ensureLearningData` 调用，默认值必须写字面量 100，不能引用后文 const，否则 TDZ**）。
* 共 **200 篇**：idx 0–99 基础篇（绿）、100–199 强化篇（橙），先基础后强化；每天 **≤4 篇**。
* `readingBuild()`：`R=diff(start,end)+1`、`needDays=ceil(200/4)=50`、`feasible=(R>=50)`、`perDay=feasible?min(4,ceil(200/R)):4`，按天切片排满 200。
* 函数：`todayReading / readingToggle / readingDoToday / readingSave / renderReading / readingSidebarItem / rDefaultStart`（默认开始日 = 今天 + 单词按 planWordPerDay 一轮所需天数）。
* 设置里阅读开始/目标日；目标日默认考研当天。逐篇格子 `.r-grid` 点击打卡，今日范围描边；单词未一轮时给黄色提示。**小三门（完形/新题型/翻译）与作文本批仅占位说明，未做打卡**。
* 云同步新增 `reading`（`mergeReading`）与 `planOverrides` 两个 key；`ensureLearningData` 里加 `ensureReading()` 与 planOverrides 初始化。路由 `#/reading`、视图 `#view-reading`、侧栏入口在「英语词汇」之后（新入口只加侧栏，**不加拥挤的顶部导航**）。

### 6.7 测试 / 截图 / 部署

* 会话工作目录 `…/new-chat-4/`（不在仓库内）：
  * `verify_all.js`：加载 index.html 主 `<script>`，校验 **690 个叶子四维内容 100% 齐全**（改内容后必跑）。
  * `test_plan.js`：排期 v2 / 阅读 / 换题 **36 项断言**（模块总量、日型配额、高频优先、政治顺序与 cap、阅读可行性与排满、对调守恒、render 不报错）。
  * `shot_plan.py`：CDP 无头 Chrome 注入示例计划后截计划页 / 设置 / 换题弹窗 / 阅读页。
  * Node 测试要点：主 script 用 `html.indexOf('<script>',50000)+8` 切出（words.js 是 `<script src>` 不会误中）；`new Function(...args, code+';return {...}')` + 万能 Proxy mock；**`window.WORDS_DATA` 必须是真实数组**（若给 Proxy，`Array.isArray` 判 false 会让 `WORDS=[]`）。
  * 独立 JS 片段先 `node --check` 再注入；大改用 Python「唯一锚点 + assert count==1」补丁最稳；文件是 LF，Python 写回用 `io.open(..., newline='')`；PowerShell 内联 `python -c` 会被 JS 的 `&&` 炸掉，一律写独立 `.py`。
* 部署：项目根 `npx wrangler deploy`；**每个新 PowerShell 进程都要重设 `$env:CLOUDFLARE_API_TOKEN`**（cfut_ 开头，敏感，不入库、不打印）。线上校验用带浏览器 UA 的 `https://zeril.cn/?cb=时间戳`（裸 urllib 会被 Cloudflare 1010 挡），脚本 `verify_live.py`。
* git push 走代理 `$env:HTTPS_PROXY="http://127.0.0.1:7890"`，需梯子全局/TUN；**push 失败不阻塞上线**（wrangler deploy 可直连或同样依赖网络）。
* 回滚：排期重构前干净备份 `_backup/index-pre-planengine-20260920-133714.html`；批6前 `index-pre-batch6-20260920-102937.html`；词库合并前 `words-pre-merge-20260920-130930.js`。

### 6.8 待用户拍板的口径（不要擅自改）

1. **新学截止**：现按「新学到 11-12（exam-37）、随后 36 天真题月、复习靠艾宾浩斯穿插」实现。用户口述过「学完后额外 30 天纯复习 + 再 30/36 天真题 → 新学考前约 60 天结束（≈10-14）」；但 665 个考点即便每天 18h，新学窗口只剩约 24 天也排不完（408 单模块就需约 47 天），系统会大面积 infeasible。交付时需让用户在「计划可行（学到 11-12）」与「提前 60 天截止（看缺口预警）」之间确认。
2. **阅读窗口**：单词一轮结束日决定阅读开始日。160 词/天一轮到 11-09，阅读 11-13 起只剩 37 天 < 需 50 天，会报 infeasible；要排满 200 篇需 `readStart ≤ 2026-10-31`（约 200 词/天、41 天一轮到 10-30），或允许单词后期与阅读重叠（用户目前规定一轮前不阅读）。
3. 数学日型 40% 解锁阈值、每日新词换算系数均为助手拟定默认值，待验收调整。


---

## 7. 批 9 更新（2026-09-20，最新，接手先读）

> 本节是批 8（第 6 节）之后的全部增量。批 9 一次性落地：排期引擎升级到 **v3（含"当天各科时长自定义 + 动态装箱"）**、四大门类侧栏导航、数学考频具体次数、英语去考点化、**单词模块整体重构（词形 key / 多轮轮播 / 三态次数与难度分 / 字母分组懒加载 / 点行显释义 / 熟词僻义 / 派生近义词组 / 阅读例句）**、新增 **思维导图速记 726 页翻页卡**。测试 `test_plan.js` 扩到 **59 项断言全过**。

### 7.1 排期引擎 v3（真源是工作目录 `plan_v3.js`，已整体取代批 8 的 plan_new.js）

* 注入器 `inject_plan_v3.py` **可重入**：区间 [v3 头注释 `/* ================= 个性化学习计划 v3 =================`（找不到则退回批 8 marker）, 英语阅读块注释）整体替换。改排期只改 `plan_v3.js` 再重跑注入。
* 时间口径（用户已拍板 Q1/Q2/Q3）：考研 `PLAN_EXAM_DEF='2026-12-19'`；今天 2026-09-20；新学到 **11-12（exam-37）截止，Dlearn=54 个新学日**；其后约 **36 天真题月（11-13→12-18，18 个两天周期）**；**取消"额外 30 天纯复习"**，复习完全靠艾宾浩斯每天穿插。
* 每考点时长：默认新点 60min（`PLAN_LEAF_MINS`）；**已学章节 30min**（`PLAN_LEARNED_MINS`）；**政治恒 30min**（`PLAN_POLI_MINS`）。已学章节 `LEARNED_CHAPTERS_DEFAULT`：math1 第0-5章、math2 0-2、math3 0、net 0-2、ds 0-1、co 0-1、os 0（ci 为 0-based）；推荐时新旧队列交替取，缓解压力。
* 政治：学完整章才能做题，未完成整章**不算任务失败**；该章只要有 `state.items` 里 `kind:'note'` 同 path 笔记即算完成（`planLeafDone` 对 poli 开头特判）；poli1-5 正常排、**poli6 形式与政策只在真题月排**；政治可排到全程，12-18 全过一遍即可，不要求真题月前学完。
* 单词：`PLAN_WORD_DEF=1000`（用户要求一天 1000，wordDays=9，约 9-28 完成一轮，clamp 20..1200）。阅读目标日=考研当天，单词一轮后开始、每天≤4 篇。
* 子科表：`PLAN_C408_SUBS=[ds/hds,co/hco,os/hos,net/hnet]`、`PLAN_MATH_SUBS=[math1/mh1,math2/mh2,math3/mh3]`；默认配额 c408 各 1.5（和 6）、数学 {mh1:4,mh2:2,mh3:2}（和 8）。模块可行性：c408 279 点约 day41、math 278 点约 day24、poli 108 点约 day56 完成。
* `planBuild` 返回 90 天 `days`（Dall，9-20→12-18；c408/math 只在前 D=54 天，政治/英语全程）、D、Dall、modFin、wordDays、wordFinishDate、每天 `leftover:{c408,math}` 与 `custom` 标记。

### 7.2 ★当天各科时长自定义 + 动态装箱（用户本轮最强调，逻辑绝不能写死）

* 存储 `state.planDay = { [dayIdx]: {hds,hco,hos,hnet,mh1,mh2,mh3} }`，单位小时，**支持任意 0.5 步进值（如 2/4/2、3.5）**；没有默认天数/默认总时长，由用户当天自己规定。
* 核心 `consumeModule(group, dc, DEF, autoFill)`：
  1. **第一轮严格按用户当天给每科填的小时数**（×60 分钟）作为该科预算去取考点；
  2. 某科未学考点已耗尽，用不完的分钟进"剩余池"；
  3. **仅 `autoFill=true`（默认天）** 才把剩余池按"还有考点且当天预算>0"各科**当天预算权重比例**兜底分摊，直到凑满模块总时长或全模块学完；
  4. **`autoFill=false`（该天在 state.planDay 里被手动改过）完全不跨科转移**，用不满就如实留 `leftover`，UI 黄条提示用户自己补，绝不擅自改用户输入。
* 约束（保存时校验）：408 四科总和 **≥6h 且计组 hco≥1h**；数学三科总和 **≥8h 且高数 mh1≥2h**。凑的是**模块总和**，不是每科固定坐满；线代/概统排完后高数自动学满 8h。
* UI：今日卡片「⏱今日各科时长」按钮（`.p-daybtn`，`planEditDay(0)`）；时间线每天「时长」按钮（`.p-dayedit`，`planEditDay(idx)`），弹窗 `#planDayOverlay` 7 个 step=0.5 数字输入 + 保存 `planSaveDay` / 重置 `planResetDay`；过去天与真题月（idx≥D）锁定；自定义天标「自」（`.p-custag`），空余≥30min 显示 `.p-leftover` 黄条。
* 粒度零头：考点按 60/30min 装箱，手动天非整点可能剩 30min 用不满，**如实计入 leftover，不跨科凑假满**（测试断言据此）。

### 7.3 导航 / 总览 / 考频 / 英语去考点

* 左上 brand「考研知识体系」改为可点回 `#/`（cursor pointer）；**顶部横向科目导航 `nav.topnav` 整段清空为空壳**（搜索/进度保留）。
* `renderSidebar` 重写为四大门类 `<details class="sgrp">` 折叠组：数学一·150分（math1/2/3）、408计算机·150分（ds/co/os/net）、英语一·100分（eng 考纲 + #/words + #/reading + #/mindmap）、政治·100分（poli1-6），另有学习工具组。
* 总览"内容来源"署名：408 内容参考 CodeBrick 码砖(codebrick.tech)、408 考频 @Yoken怀古；**加粗"高等数学/线性代数/概率论与数理统计三科章节框架来自郭雨港《数一所有题型分类、通用解法详解》"**；数学考频抖音 @晨曦学长《25考研数学一·近15年考频分析》；政治英语依据官方大纲。署名必须保留。
* 数学考频徽标 `freqPill/sectionAggPill` 统一显示 `f.tag||FREQ_LB[...]`，即**"近15年N次"具体次数**并按频率红/黄/灰着色（"选填偶考"保留）。
* **英语去考点化**：eng 25 个叶子不是考点、无法判定掌握；详情页对 eng 跳过"学习状态"与 `masteryPanelHtml`，改显示【英语·考纲浏览】提示卡。英语综合掌握度 `engMasteryPct()` = 单词 0.60 + 阅读 0.25 + 真题 0.15（真题只计 `eng_` 前缀且有 doneTs 的记录，cap 10 套）；"做完新东方200篇 + 全部单词标认识 + 做完历年真题"=100%。
* **修过真实 NaN bug**：旧 `engMasteryPct` 对 `state.exams.records`（是 `slotKey_year` 为键的对象、无数组 length）取 .length 得 undefined → NaN，污染侧栏/总览。已改健壮版（try 包裹 + Object.keys 过滤 + isFinite 兜底）。改英语进度相关务必回归此项。

### 7.4 ★单词模块整体重构（核心块真源 `words_core.js`、渲染块真源 `words_render.js`，注入器 `inject_words.py` 两区间替换，幂等）

* **数据模型改为词形 key（免疫重排）**：`normWord(s)=小写.trim().压缩空格`，`wKey(i)=normWord(WORDS[i][0])`；`state.words[key]={m,c1,c2,c3,diff,rv,ex:[]}`，c1 认识/c2 模糊/c3 不认识次数，`diff=c2+2*c3`（认识+0、模糊+1、不认识+2），`ex` 阅读例句数组 `{t,s}`。
* `migrateWords()`：检测到旧"纯数字索引"数据一次性清空（旧约 692 词/9% 进度作废，1000/天约 1 天补回——**交付时已向用户说明此取舍**）。`mergeWords` 云同步只收词形 key，同 key 取 stage/last 更优、次数取 max、例句取较长。
* **多轮轮播** `wSession={batch,cur,nxt,pos,round,due,neww,flipped,stats,graded}`：`wStart` 队列=到期复习+今日新词；`wAnswer(1)` 走完整艾宾浩斯 `wGrade`，`wAnswer(2/3)` 只 `wMark` 累加次数（不动 rv）并把词 push 进 nxt；本轮 cur 走完后若 nxt 非空则 cur=nxt、round++，**直到当批全部认识才完成**。复习同理。
* **列表改造（renderWords/renderWordsList/wordRow）**：默认进"全部"，A-Z + `#` 字母分组（`wLetters`），每组用 **IntersectionObserver 懒加载**（rootMargin 300/600px，防 8044 条卡顿）；**释义默认隐藏，点词框 `.w-main`（wToggleRow 设 wView.openKey）才展开**；工具栏「显示全部释义」开关 `wView.showAll`；进页面自动定位 `state.wordLast`（locateLastWord，填充所在字母 + scrollIntoView + .wflash 高亮，仅一次）；搜索≤300 条。
* 展开详情含：释义、**熟词僻义橙色块**（`.wr-rare`，列表有僻义的词带"僻"徽标）、派生/近义/词组（`.wr-rel`，派生词可点 wJumpWord 跳转）、三态次数+难度分、阅读例句 textarea + 来源下拉（复用 `booksForSub('eng')`，wAddEx）。列表内三态标记 `wQuick` 与卡片同效并刷新侧栏/计划。
* `wView={letter:'ALL',kw:'',showAll:false,openKey:'',located}`。
* **数据文件（均 `<script src>` 引入，file:// 不能 fetch）**：
  * `public/data/words.js` = `window.WORDS_DATA`，**全局字母序 8044 条**四元组 `[词,音标,释义,tag]`，tag 多源顿号连接（大纲/红宝书/核心词组/拓展词组，词组排在字母前符合"穿插"）；重排前备份在工作目录 `words-pre-sort.js`，重建脚本 `rebuild_words.js`（勿重跑）。
  * `public/data/words-rare.js` = `window.WORDS_RARE={word:{r:僻义,s:出处}}`，361 条（357 命中词库；check/circulation/navigate/promotion 4 条未命中保留但不显示），脚本 parse_rare.py/build_rare.py。
  * `public/data/word-rel.js` = `window.WORD_REL={key:{der:[],syn:[],phr:[]}}`，5167 词有关联（派生1291/近义4806/词组957），375KB，生成器 `gen_wordrel.js`（可重跑：前后缀派生双向、中文核心义项倒排近义[保守、弱匹配可能有噪声、当前只读]、词组拆 token 挂词）。

### 7.5 思维导图速记（新模块 #/mindmap）

* 素材《思维导图速记考研英语5500词汇》726 页纯扫描图（0 文本层，不 OCR），fitz 按页宽≈1000px 转 JPEG q72：`public/data/mindmap/p001.jpg…p726.jpg`，共 46.8MB（约 64KB/张），导出脚本 export_mindmap.py。
* 路由 `#/mindmap`（currentRoute）、视图 `#view-mindmap`、render 分发 `renderMindmap()`；侧栏英语组入口早已指向它（mindmapSideMeta 读 `state.mindmap.seen`，兼容旧 done）。
* `state.mindmap={pos,seen:{页:1}}`，随 state 自动云同步；MM_TOTAL=726；mmGo/mmJump/mmImgSrc；上一张/下一张/首页/末页/页码跳转，**键盘 ←/→ 翻页**（全局 _mmBound 监听，仅在 mindmap 路由生效）；进入即把当前页计入 seen，进度 seen/726。

### 7.6 测试 / 截图 / 部署 / 回滚

* `test_plan.js` **59 项全过**：含默认天比例兜底凑满、手动天严格照输入不转移（leftover）、3.5h、2/4/2 配额、清除 planDay 恢复自动、政治笔记判定、单词词形 key mock（window.WORDS_DATA 必须是真实数组）。改完任何排期/单词逻辑必须重跑 `node test_plan.js`。
* CDP 自检图（工作目录，自写 websocket 脚本，独立 --user-data-dir）：nav1-4（导航/计划/英语/数学考频）、words1_list（字母分组懒加载+词组穿插+释义隐藏）、words2_open（absorb 僻义/近义/例句）、words3-5（卡片正反面/轮播）、mm1-2（导图翻页）。注意 headless 端口/profile 冲突就换端口。
* 部署：项目根 `npx wrangler deploy`（assets=./public，**首次上传 726 张导图约 47MB，耗时较长**）；每个新 PowerShell 都要重设 `$env:CLOUDFLARE_API_TOKEN`（cfut_ 开头，敏感，禁入库/打印/提交）。线上校验 `https://zeril.cn/?cb=时间戳`（带浏览器 UA，裸 urllib 被 1010 挡，脚本 verify_live.py），注意边缘缓存。
* git push 走代理 `$env:HTTPS_PROXY="http://127.0.0.1:7890"`，需梯子全局/TUN；push 失败不阻塞上线。
* 回滚：计划块 `inject_plan_v3.py` 重注入；单词块 `inject_words.py` 用 words_core.js/words_render.js 重注入；导图/导航/署名/考频/英语各 patch_*.py 可在 `git checkout` 回批 8 后按序重放（顺序：inject_plan_v3→patch_nav→patch_sidebar→patch_source→patch_daycss→patch_freq→patch_eng→patch_engnan→inject_words→patch_wordcss→patch_wordscripts→patch_mindmap→patch_mmseen）。**补丁脚本里禁止写 emoji/代理对**（曾导致 utf-8 写盘抛错并截断 index.html，靠 git checkout 恢复）。

### 7.7 待用户验收 / 已做的拟定取舍（不阻塞）

1. 旧数字索引单词进度（约 692 词）已 migrate 作废（见 7.4）。
2. 近义词为中文释义弱匹配（4806 词），可能有噪声，当前只读不可编辑（例句才可编辑）；若噪声大可调紧 gen_wordrel.js 的组大小/字数阈值或改为可增删。
3. 手动天因 60/30min 粒度用不满非整点时长会留 30min 零头，如实 leftover 提示、未跨科凑整；若用户要零头自动凑整再改 consumeModule。
4. 导图卡片是否纳入艾宾浩斯调度未定，当前只做翻页+页码进度。
5. 英语掌握率三项权重 0.60/0.25/0.15 为拟定，可按用户反馈调。

***

## 14. 批 10：架构级重构（高内聚低耦合，2026-09-20 上线）

> 动因：用户指出「AI 味道重，前端只写在一个 html、后端不分模块」，要求按功能 / 逻辑拆分、高内聚低耦合，且**功能必须完全不变、线上照常部署**。重构前最后上线基线 commit **0f72679**（线上 Version ff6a9a10），重构后前端 **7917bef**、后端 **fb00ec4**，线上 Version **fa5e61e0**。

### 14.1 技术路线（已拍板）

* **零构建原生 ES Modules，不引入 Vite/esbuild/任何打包器**：浏览器原生支持，部署仍是纯静态 Assets + Worker，wrangler 仅对 Worker 端 ESM 做自动打包。
* 前端 `public/js/{data,core,features}/*.js`，入口 `<script type="module" src="/js/main.js">`；CSS 与词库数据物理分离。
* 后端 Workers 原生 ESM 多文件（`worker/`），`wrangler.jsonc` main 改为 `worker/index.js`。
* 代价：`file://` 双击失效（ESM 的 CORS 限制），本地预览改走静态服务器（`start-web.bat`，见第 6 节）；线上 https 不受影响。

### 14.2 前端模块划分与加载顺序

`main.js` 按固定顺序 import（该顺序即模块求值顺序，也是自挂全局的先后）：
3 个词库（`../data/words.js`、`words-rare.js`、`word-rel.js`）→ `data/diagrams,syllabus,topic-content` → `core/store,cloud,util,md-render,ui-shell` → `features/study-loop,words,reading,exams,mindmap,notes,drawings,maps` → `core/bootstrap,app-init`。
分层职责：

* **data/**：纯内容数据，无 DOM 逻辑。`syllabus.js` 导出 `SYLLABUS / SUBJECT_SCORES / FREQ`（14 学科 690 叶子）；`topic-content.js` 文件头 `import { SYLLABUS } from './syllabus.js'`，按学科 Object.assign 拼 `TOPIC_CONTENT`；`diagrams.js` 为内置导图。
* **core/**：跨功能基础设施。`store.js`（state + localStorage `k408-knowledge-v1` + saveState/migrate）、`cloud.js`（authToken/api/cloudSave/cloudLoad/showLogin/MASTERY，含匿名 initAuth 自执行 IIFE）、`util.js`、`md-render.js`（marked+KaTeX+highlight 配置）、`ui-shell.js`（renderSidebar / render 主分发 / renderTree / 考频排序 / buildTreeRows / **renderDetail 整函数**）、`bootstrap.js`（侧栏折叠等启动绑定）、`app-init.js`（`init()`，被 main 末尾调用）。
* **features/**：一个文件一个功能域，彼此尽量不直接耦合，跨文件能力统一走 globalThis 上的共享符号（见 14.3）。`study-loop.js` 承载学习闭环与排期引擎（planBuild/planSwapCandidates/书源 BOOK_GROUPS/错因/掌握判定，含占位空函数 cloudInit）。

### 14.3 ★关键机制：模块末尾自挂 globalThis（接手必懂，最易踩坑）

* 每个模块在**自身求值末尾**立即执行 `Object.assign(globalThis, { ...本模块导出符号 }); export { ... };`；词库数据文件同样 `const X=...; Object.assign(globalThis,{X}); export{X};`。`main.js` 末尾再做一次全量 Object.assign 兜底。
* **为什么不能只在 main.js 聚合**：ESM 的 import 在「模块求值阶段」就会运行各模块顶层代码，而 main.js 里的 Object.assign 要等**整棵模块图求值完成**后才执行。例如 `ui-shell.js` 顶层就引用了 `syllabus.js` 的 `FREQ`，若此刻 globalThis.FREQ 尚未挂上，会抛 `ReferenceError: FREQ is not defined`，且静态模块图会**静默中止**（不报 Runtime.exceptionThrown，表现为零异常但全站空白，只能靠动态 `import('/js/main.js').catch(e=>...)` 抓到真因）。让每个模块一求值完就自挂，按 main.js 的 import 顺序，先求值的先挂、后求值模块的顶层初始化即可引用。
* 因此**新增顶层函数 / 常量后，务必把名字加进该模块末尾的 Object.assign 与 export 清单**，否则跨模块或被 init/事件回调引用时会 `is not defined`。

### 14.4 重构过程踩过并修复的三个机械拆分坑（拆分器已修好，重跑不会再犯）

1. **切段边界切在函数体内**：首版按功能分区 banner 注释的物理位置切段，但「我的学习记录」等 banner 实际写在 `renderDetail` 函数**体内**，把函数拦腰切断导致括号不平衡。修复：所有边界一律对齐到「其后第一个列 0 顶层声明行首」。
2. **全局聚合时机太晚**：即 14.3，改为每模块求值末尾自挂。
3. **顶层声明扫描漏 `async function`**：首版正则只认 `function/const/let/var`，漏掉 `cloudLoad`、`cloudInit` 等异步函数（顶层声明 388→395），导致 init() 报 `cloudInit is not defined`。修复：声明识别正则为 `^(?:async\s+function|function|const|let|var)\s+(name)`。匿名自执行 IIFE（如 cloud.js 的 initAuth）无需导出，正确地不被扫描。

### 14.5 后端模块（与原 `_worker.js` 逐行等价）

`index.js`（非 /api 走 env.ASSETS、OPTIONS 返 204、每请求 ensureSchema、register/login 免鉴权、其余 authenticate 取 userId、无效 401、分发 data/photos、try/catch 兜底 500）；`schema.js`（users/sessions/user_data 三表 CREATE IF NOT EXISTS）；`auth.js`（用户名≥2 密码≥4、UNIQUE 返「用户名已存在」、SHA-256 校验、token=双 randomUUID）；`data.js`（GET 读全部 KV、POST UPSERT）；`photos.js`（R2 上传剥 dataURL→atob、12MB 上限 413、key 强制 `userId+'/'` 前缀、越权 GET 裸 403 / DELETE json 403、私有 immutable 缓存头）；`http.js` / `crypto.js` 为工具。**所有 SQL、阈值、错误文案、CORS（反射 Origin，GET,POST,PUT,DELETE,OPTIONS）与原文件逐字保留**，已人工逐行核对。

### 14.6 测试 harness 改造（重要）

旧 `test_plan.js`（59 项断言）/ `test_books.js`（15 项）原本从单文件 index.html 切内联 `<script>` 再 `new Function` 注入 mock；重构后无内联脚本。新增 **`bundle_harness.js`**（在会话工作目录 `…/new-chat-4/`，未入库）：按 main.js 顺序读取词库 + 18 模块，正则去掉 `import` 行与 `export {...}` 行（保留 Object.assign 全局自挂），拼成单段 code，沿用同一套 DOM/localStorage 万能 Proxy mock（WORDS_DATA 用 8044 条 `['w'+i,'/','x']` 假数据），以 `new Function` 执行并 return 指定符号。两个测试改为 `require('./bundle_harness.js').load('符号1,符号2,...')`。重构未改业务逻辑，**59 + 15 项全绿**（计划排期、自定义时长动态装箱、配额转移、换题守恒、阅读窗口、书源去重重映射等）。新增断言时在对应 test_*.js 里加，load 的符号清单按需补。

### 14.7 验证三件套（CDP 无头 Chrome，脚本在会话工作目录，未入库）

* `check_modules.py`：把 `public/js`、`public/data`、`worker` 下所有 JS 复制成临时 `.mjs` 跑 `node --check`，输出 `BAD=N`（项目根 package.json 非 ESM，故须复制成 .mjs 检查）。
* `runtime_check.py`：起 `python -m http.server --directory public`（端口 8123 / CDP 9371），无头 Chrome 重载后收集 Runtime.exceptionThrown / console.error，校验全局符号、14 学科、8044 词、总览侧栏 159 节点 / 14 卡、各 hash 路由渲染，应**异常=0**。
* `detail_check.py`：直接定位叶子路由（如 `#/tree/co/2/5/1` Cache 映射 46 个 KaTeX、`#/tree/math1/0/0/0` 13 个），验证 Markdown/公式/掌握条件/学习记录区块。
* `online_check.py`：经系统代理 127.0.0.1:11304 用无头 Chrome 打开线上 https://zeril.cn/ ，校验全部模块资源 200、渲染与零异常（部署后回归用）。
* 注意 file:// 跑不了 ESM，所有浏览器自动化都必须先起 http.server 打开 http://127.0.0.1；端口 / profile 冲突就换新值。

### 14.8 部署 / 回滚 / 后续怎么改

* 部署形态与凭据、代理（127.0.0.1:11304）、令牌（cfut_ 票据，环境变量传入、禁入库）、边缘传播等待，均同第 7、8 节；`npx wrangler deploy` 会自动打包 worker/ 多文件、按 hash 增量上传 Assets。
* 回滚点：重构前 commit **0f72679**（单文件前端 + 单文件 `_worker.js`）。`git checkout 0f72679 -- public worker _worker.js wrangler.jsonc` 可整体回退（注意重构后新增了 public/js、public/styles、worker 目录，回退后需删除这些目录并恢复 index.html / data 词库 / _worker.js）。
* **拆分器 `split_frontend.py`（会话工作目录，未入库）幂等可重跑**：它从 0f72679 的单文件机械切出全部前端模块（含 14.3/14.4 的全部修复）。想重新生成时先 `git checkout 0f72679 -- public/index.html public/data/words.js public/data/words-rare.js public/data/word-rel.js` 恢复单文件基线，再跑 split_frontend.py + check_modules.py；`js/`、`styles/` 是生成物会被覆盖。**日常迭代不要重跑拆分器**（会覆盖手工修改），直接改对应 `public/js/**` 模块即可。
* 改功能定位：考纲 / 考点内容 → `js/data/`；学习状态 / 云同步 → `js/core/store.js`、`cloud.js`；侧栏 / 树 / 详情布局 → `js/core/ui-shell.js`；计划 / 打卡 / 掌握判定 / 书源 → `js/features/study-loop.js`；词汇 → `features/words.js`；真题 / 照片 → `features/exams.js` + `worker/photos.js`；登录 / 数据 API → `worker/auth.js`、`data.js`。改完按 14.7 跑回归，再 commit / deploy / push。

## 15. 批 11：模块内聚归位（修正批 10 机械拆分的职责错位，2026-09-20 上线）

> 动因：批 10 按 banner 物理位置机械切段，功能完整但存在「假模块化」错位（最典型：整套排期引擎在单词文件里、单词列表渲染在导图文件里、搜索 / Markdown 渲染在笔记文件里）。本次**只做归位、零业务逻辑改动、零功能变化**，零构建与 Workers 直接部署方式不变。归位前基线 commit **d7a4c77**，线上 Version **d378b460**。

### 15.1 归位清单

第一批（功能域归位）：

* **新增 `features/plan.js`**：个性化排期引擎全部符号（`PLAN_*` 常量、`planBuild` 及其体内嵌套 `consumeModule`、`planSwap*` 手动换题、`planDay*` / `planEditDay` / `planSaveDay` 当天时长、`renderPlan` / `planSidebarItem` / `planOverviewBanner` 等 72 个顶层符号），原错置于 `features/words.js`。
* `features/words.js`：收回词库状态 / 三态轮播 / 艾宾浩斯，以及字母列表与学习卡渲染（`renderWords` / `renderWordsList` / `wordRow` / `wJumpWord` / `wLetterOf` / `locateLastWord` 等）和英语综合掌握度 `engMasteryPct`；这些渲染原错置于 `mindmap.js`。
* `features/mindmap.js` 纯化：只剩 726 页导图速记（`MM_TOTAL` / `mmEnsure` / `mmImgSrc` / `mmGo` / `mmJump` / `renderMindmap` + 键盘绑定 + `mindmapSideMeta`）。
* `renderOverview`（总览）归 `core/ui-shell.js`；`readingSideMeta` 归 `features/reading.js`。

第二批（基础设施归 core）：

* Markdown 业务渲染 `mdRenderer` / `mdRenderMath` / `mdRender` / `normalizeSoft` / `mdBlocks` / `conceptMd` / `inlineMd`（连同顶层 `if(window.marked) marked.use(...)` 配置语句）从 `notes.js` 归 `core/md-render.js`。
* 全局搜索 `searchIndex`（构建期 IIFE）/ `openSearch` / `closeSearch` / `runSearch` / `highlight` 归 `core/ui-shell.js`。
* 通用工具 `subColor` / `subName` / `fmtTime` 归 `core/util.js`。
* `notes.js` 只保留学习条目统一库：`ITEM_KINDS`、考点路径 `pathInfo*`、条目 CRUD、学习中心 / 复习面板、笔记与错题编辑器、`newMap`。

### 15.2 最终模块职责（以此为准；取代 14.2 中「排期在 study-loop」的过时描述）

`main.js` 求值顺序更新为：词库 ×3 → `data/*` ×3 → `core/{store, cloud, util, md-render, ui-shell}` → `features/{study-loop, words, plan(新增, 在 words 后), reading, exams, mindmap, notes, drawings, maps}` → `core/{bootstrap, app-init}`。

* **core/util**：`$`、`esc`、`getNode` / `getSubject` / `leafPath` / `eachLeaf`、`subStats` / `overallStats`、`subColor` / `subName` / `fmtTime` 等纯工具。
* **core/md-render**：marked / hljs / KaTeX 配置、`conceptToHtml` / `renderMath` / `updatePreview` / `setMdMode` / `mdTool` / 涂鸦 `drawState`，以及考点与笔记正文渲染 `mdBlocks` / `conceptMd` / `inlineMd` / `mdRender*`。
* **core/ui-shell**：`renderSidebar` / `render` 主分发 / `renderTree` / 考频排序 / `renderDetail` / `renderOverview` / 全局搜索。
* **features/study-loop**：书源 `BOOK_GROUPS`、错因库、`ensureLearningData`、掌握判定 `masteryChecklist` / `applyAutoMastery`、艾宾浩斯复习 `dueItems` / `ensureAllReviews`。
* **features/plan**：排期引擎（唯一真源）。**features/words**：英语词汇全部（含英语综合掌握度）。**mindmap** 仅导图；`reading` / `exams` / `notes` / `drawings` / `maps` 各司其职。

### 15.3 归位脚本与新增拆分坑（再做归位必读）

* 脚本在会话工作目录 `…/new-chat-4/`（未入库）：`reorganize1.py`（第一批）、`reorganize2.py`（第二批）、`restore_baseline.py`（用 `git show HEAD:<path>` 导出干净基线，规避偶发的 `git checkout` 卡顿 / 锁）、`patch_main.py`（向 main.js 注册 plan.js，幂等）。方法：按「列 0 顶层声明」切块（吸收紧邻前导注释），按符号名重新分配文件，并重写每个文件末尾的 Object.assign / export，最后做**块文本多重集字符守恒校验**（Counter），守恒不过不写文件。
* ★新坑（补充 14.4）：IIFE 收尾的列 0 `})();` **绝不能**识别为独立语句锚点，否则 `const x=(()=>{ ... })();` 被拦腰截断——主体被搬进新文件、闭合 `})();` 残留在原文件，两边语法俱毁（node --check 报孤立 `})();`，harness 报 `emptyBox is not defined` 一类连带错误）。独立顶层语句锚点只认列 0 的 `if(` / `for(` / `while(`（如 mindmap 的 `if(!window._mmBound){...}` 键盘绑定）。
* 函数体内缩进的嵌套函数（如 `planBuild` 体内的 `function consumeModule`）不是顶层符号、不进导出清单，随父函数整块迁移。
* 移动一个符号后必须同步四处：源文件末尾 Object.assign / export 删名、目标文件末尾加名、`main.js` 的 import 与 `__NAMESPACES`、测试 `bundle_harness.js` 的 `MAIN_ORDER`（plan 位于 words 之后）。

### 15.4 验证（全绿）

* `node --check`：30 个 JS 模块 `bad=0`（含新增 plan.js）。
* 单测：`test_plan.js` 59 项、`test_books.js` 15 项全绿。
* CDP 全路由（`rt_full.py` / `rt_full2.py`，本地起 http.server + 无头 Chrome）：首屏非空、归位关键全局符号无缺失、首屏与全部 hash 路由 `Runtime.exceptionThrown=0`；9 学科详情 KaTeX 正常（`co/2/5/1`=46、math1/2/3=13/12/12）；搜索必中词均有结果（进程 14 / 线性 21 / 极限 21 / 二叉树 12 / Cache 6，「缓存」0 结果仅因该词不在考纲名）；配置后计划渲染（planToday / 时间线 / 模块进度 / 今日时长弹层）正常；笔记与错题编辑器正常。
* 线上 `online_verify.py`：https://zeril.cn 首屏 2170 字符、符号齐全、`/js/features/plan.js` 返回 200 且含 `planBuild` / `renderPlan`、各路由零异常。

### 15.5 回滚

归位前基线 commit **d7a4c77**（批 10 机械拆分版，功能完整但内聚错位）：`git checkout d7a4c77 -- public/js` 后**需手动删除新增的 `public/js/features/plan.js`**。再往前的单文件基线为 0f72679（见 14.8）。


## 16. 批 16：重构独立核验 + favicon 收尾（2026-09-20）

> 用户在另一条线已完成批 10/11 模块化后，又提出「前端只写在一个 html、后端不分模块、AI 味重」。核查确认重构**确已完成、提交并上线**，本次未重复拆分，只做独立验证与一处收尾。**根因提示：用户习惯双击 public/index.html（file://）打开，而批 10 起前端是 ES Modules，file:// 下被浏览器 CORS 拦截会整页空白 / 静默不执行——这会让人误以为「还是老的单文件 / 没改」。本地预览必须走 http（双击 start-web.bat，或 python -m http.server --directory public），线上 https 不受影响。**

* 重构前两轮小迭代已包含在模块化版本中、功能归属：书源按书名去重 + 数学新增郭雨港两本（commit 7eddcf5）在 features/study-loop.js（DEFAULT_BOOKS 确定性 id / normalizeBooks / mergeBooks）；词汇页删「全部」分类、默认进字母 A 单字母渲染（commit 0f72679，批 10 重构基线）在 features/words.js（wView.letter='a' / wLetterOf / 无 data-l="ALL" 按钮）。
* 收尾：index.html 加内联 SVG favicon（与顶栏节点网络 logo 一致，data URI，零额外请求），消除控制台唯一的 /favicon.ico 404。commit 2519c54，线上 Version 482f05ad。
* 独立验证（不依赖批 10/11 自述）：
  * check_modules.py：public/js、public/data、worker 共 29 个 JS 模块 node --check 全过，BAD=0。
  * 单测：test_plan.js 59 项、test_books.js 15 项全绿（经 bundle_harness.js 按 main.js 顺序拼装载入）。
  * CDP（shot_modular.py，本地 python -m http.server 起在 public、无头 Chrome）：home / tree-ds / tree-math1 / words / plan / reading / mindmap / exams / notes 全部渲染且无 Runtime.exceptionThrown / console error；words=26 字母、无 ALL、默认 A629；导图 /data/mindmap/p001.jpg 真实显示；全局函数 renderPlan/renderWords/renderReading/renderExams/init 均就位。
  * 线上 https://zeril.cn 与 workers.dev：首页为约 29KB 骨架、引用 /js/main.js、无内联大脚本；/js/*、/styles/*、/data/words.js、/data/mindmap/p001.jpg 均 200。
* 最终架构（高内聚低耦合，零构建原生 ESM）：前端 index.html（纯骨架）+ styles/{base,exam}.css + js/main.js（入口：按序 import → Object.assign 全局自挂 → 启动序列）+ js/core/{util,store,cloud,md-render,ui-shell,bootstrap,app-init} + js/data/{diagrams,syllabus,topic-content} + js/features/{study-loop,words,plan,reading,exams,mindmap,notes,drawings,maps} + data/{words,word-rel,words-rare}.js + mindmap/p001..p726.jpg；后端 worker/{index,http,crypto,schema,auth,data,photos}.js，wrangler.jsonc main 指向 worker/index.js。模块职责以第 15.2 节为准。


## 17. 批 17：知识定位联动书源库 + 默认书扩充 + 辅导讲义前置（2026-09-20）

> 诉求：知识定位里「书名 / 讲义 / 网站」原本是纯手输文本框，每次都要手打书名（数学 / 408 / 政治皆然）；要求能直接从书籍库选书；来源类型默认「辅导讲义」；补默认书。

* 知识定位编辑器（`public/index.html` 的 locatorOverlay + `features/study-loop.js` 的 `openLocatorEditor`）：
  * 来源输入 `#locatorSource` 由纯 input 改为 `input + <datalist id="locatorSourceList">`；打开弹窗时按当前考点所属科组（`booksForSub(subjOfPath(path))`）填充该书单，**可下拉选默认书 / 自加书，也仍可直接手输网课老师 / 网站 / URL**。
  * locator 数据模型不变：仍只存 `source` 书名字符串（不存 bookId），故云同步 / 掌握判定 / 旧数据全部不受影响。
  * 来源类型 `#locatorKind` 选项顺序把「辅导讲义」调到第一位，新增定位默认 kind 由「教材」改为「辅导讲义」。
* 默认书扩充（`DEFAULT_BOOKS`，**只在各数组末尾追加**，确定性 id `bkdef_<组>_<索引>` 不漂移；`normalizeBooks()` 对老用户只增不删、自动补齐）：
  * c408 追加 8 本：王道习题册、王道强化PPT、袁春风《计算机组成原理》、王卓数据结构强化PPT、里昂25计组讲义、里昂26操作系统讲义、湖科大《深入浅出计算机网络》、湖科大计算机网络强化（现共 14 本）。
  * poli 追加 2 本：大李子知识清单、大李子720题（现共 7 本）。
  * math 未改（共 8 本）：用户点名的「张宇·基础30讲」「郭雨港·数一所有题型分类、通用解法详解（通解）」本就在列。
* 验证：`check_modules.py` BAD=0；`test_books.js` 15 项、`test_plan.js` 59 项全绿；CDP（verify_locator.py，本地 http + 无头 Chrome）政治 datalist=7、408=14（8 本新书全在）、数学=8（张宇30讲 / 郭雨港通解在），首位与默认 kind=辅导讲义，input 的 list 关联成功，选「里昂25计组讲义 + P12」保存闭环正确、弹窗关闭，全程零 Runtime / console 异常。
* 改动文件：`public/index.html`（locatorOverlay：option 顺序、input 加 list、新增 datalist 元素）、`public/js/features/study-loop.js`（DEFAULT_BOOKS 追加、openLocatorEditor 内联填充 datalist，未新增需导出的顶层符号）。


## 18. 批 18：今日任务锁定（修「做完仍不停推新、永远做不完」）（2026-09-20）

> 诉求（bug）：今日任务里某模块（如政治，今日 2 个考点）勾选掌握后，页面不显示完成，反而不断把后续天的考点前移补满当天配额，今日总数恒定、进度到不了 100%，「根本没有做完的时候」。要求：当天任务做完就显示完成、不再推新。

* 根因：`features/plan.js` 的 `planBuild()` 每次渲染都用「当前未掌握队列」（`planSubQueue` / `planPoliQueue` 都 `.filter(l=>!planLeafDone(l.path))`）重新按天装箱，今日 `day.leaves` 是**滚动结果而非固定快照**；勾选掌握 → 该点出队 → 后面天的题前移补满当天时长，故今日总数不变。
* 方案：只锁「真实今天」的清单（`state.planTodayLock`，懒创建），未来天保持滚动（提前完成自然前移，合理）；过去天 / 计划未开始的未来首日不锁。
  * 新增 `planTodayLockKey(b,day)`：签名 = 当天日期 + 当天自定义时长（`state.planDay[idx]` 有无/内容）+ 计划模板（start/exam/learnEnd、408 四子科 hds/hco/hos/hnet、数学 mh1/mh2/mh3、政治 hPoli、wordPerDay）。日期变、改当天时长、改计划设置都会失配重建。
  * 新增 `planEnsureTodayLock(b,day)`：仅当 `day.date===planTodayStr()` 生效；无锁 / 日期不符 / key 不符 / paths 非数组则以当前滚动 `day.leaves` 的 paths 为 base 重建，并把「同一把旧锁里今天已完成、但不在新 base」的 paths 保留在最前（改时长后已完成项不丢、分母不虚降）；随后用 `planLeafIndex()` 元数据重建 `day.leaves`、重算 `day.mins`；changed 时 saveState + cloudSave（同一天 key 稳定后只写一次）。空清单（真题月 / 已学完）也锁定，不反复写。
  * 新增 `planToday(b)` 统一返回 `{ti,day:planEnsureTodayLock(...)}`；`renderPlan`、`planRefreshCounts`、`planSidebarItem`、`planOverviewBanner` 四处取今日全部改走它，保证进度口径一致、勾选后今日不补新、td 能到 len/len=100%。
  * 手动换题：`planSwap` 对今天（锁为当天且 from 在锁内）直接替换 `lock.paths` 里的 from→to 并重渲染，不走 planOverrides；未来天维持原 overrides。`planSwapCandidates` 对今天额外排除已在 `lock.paths` 的题（新增局部 `lockNow`）。
  * UI：每个模块组标题显示 `doneN/总数`，整组完成显示「✓ 已完成」（`planGroupLeaves`）；今日全部完成时在今日卡片显示绿色「今日考点已全部完成，清单已锁定、不再安排新考点…」（renderPlan）。
* 云同步（`core/cloud.js`）：cloudSave 增 `key:'planTodayLock'` 推送；cloudLoad 增 `if(r.data.planTodayLock) state.planTodayLock=r.data.planTodayLock`（旧日期 / key 不符会在 planEnsureTodayLock 自动重建，故直接采用即可）。**注意 `state.planDay`（当天自定义时长）历史上一直未纳入云同步，本次仍未加**，多设备当天时长各自本地；planTodayLock 跨设备若两端当天时长不同会按各自 key 重建，单用户主力设备无影响。
* 验证：
  * `check_modules.py` BAD=0；`test_plan.js` 59 项、`test_books.js` 15 项保持全绿（锁定逻辑放在渲染包裹层，未改纯函数 `planBuild`，故原 59 项不受影响）。
  * 新增 `test_today_lock.js` 13 项全绿：首日锁定 21 个（408 8 / 数一 11 / 政治 2）；完成 3 个后今日总数与路径集合不变（不补新）、计数=3；政治 2 个做完后政治组仍 2 个且全完成；全部做完 21/21；改当天时长后锁重建、已完成保留、出现新未完成题。
  * CDP（`verify_today_lock.py`，本地 http + 无头 Chrome，注入今日开始的计划）：初始 0/21；政治两点打勾后总数仍 21、政治组「✓ 已完成」、进度 2/21，再次重渲染稳定不补；全部打勾后 21/21、三组均「✓ 已完成」、出现全部完成提示；全程零 Runtime / console 异常。（截图前景未登录云同步登录框为既有行为，与本次无关。）
* 版本 / 提交：线上 Version **6c2d962f-6e0b-4a1c-8077-248b0051bd99**（仅上传 /js/features/plan.js、/js/core/cloud.js 两个变更资产）；commit **bf1e716**（本地=origin/main）。
* 改动文件：`public/js/features/plan.js`（新增 planTodayLockKey / planEnsureTodayLock / planToday，renderPlan / planRefreshCounts / planSidebarItem / planOverviewBanner / planSwap / planSwapCandidates / planGroupLeaves 改造，末尾 Object.assign 与 export 各加 3 个新符号）、`public/js/core/cloud.js`（planTodayLock push/pull）。
* 工作目录（未入库）新增：`patch_today_lock.py`、`test_today_lock.js`、`verify_today_lock.py`、截图 lock_init/lock_poli_done/lock_all_done.png。


## 19. 批 19：英语词汇卡 Anki 化 + 修「列表已过词、卡片仍 0/1000 不同源」（2026-09-20）

> 诉求（bug + 增强）：①每日新词上限 1000，但在「词汇列表」里已逐词标记/过了 1033 个后，打开词汇卡仍是「总进度 0/1000」、从 accountability 重新发新词——卡片不统计当天在列表里已判定的词、不扣每日新卡上限；②要求参考 GitHub 上 Anki 的逻辑，尽量 1:1 复刻卡片调度。

* 根因（`features/words.js`）：卡片「今日新词进度」只是会话内临时计数（`wSession.graded`），`wStart()` 用 `wNewIdxs(wDailyN())` 每次取 1000 个「从未评分（无 rv.last）」的词，**不读今天在列表 `wGrade` 已过的词、也没有按天持久的新卡计数**；列表标记写 `rv.last`（侧栏「已背」会涨），但卡片每天仍按满额 1000 重发新词。
* 数据模型扩展（`state.words[k]`，老数据懒兼容，无需迁移）：
  * `rv.nd`：该词**首次「过一遍 / 毕业」的本地日期**（YYYY-MM-DD）。`wGrade()` 在 `first=!rv.last` 时写入当天（列表三档、卡片「认识」首次毕业都写）；复习旧词不覆盖。这是「一轮」与每日新卡计数的唯一依据。
  * `ease`：SM-2 简易度，默认 2.50。`wBump()` 统一更新：不认识(Again) −0.20、模糊(Hard) −0.15、认识(Good) 不变，下限 1.30（三按钮，无 Easy 第四键）。当前仅记录 + 供难度排序，**不改变复习间隔**。
* 新增纯函数（words.js，末尾 Object.assign / export 两处都已注册）：
  * `wTodayStr(now)`：words 内部自带本地日期，不依赖 plan。
  * `wNewLearnedToday(today)`：遍历 WORDS 数 `rv.nd===今天`（复习旧词不计）。
  * `wNewRemain()`：`max(0, 每日上限 - 今天已新学)`，即 Anki 每日新卡剩余配额。
* `wStart()` 改为配额制：`remain=max(0,cap-doneToday)`，`nw=wNewIdxs(remain)`；wSession 增 `newSet`（本批新词下标集合）、`cap`、`doneToday`、`newGraded`。`wAnswer(1)` 时若该下标在 `newSet` 则 `newGraded++`（复习卡认识不计新词）。当 due=0 且 remain=0 → batch 空 → 完成页「今日单词已完成 · 今日新词 N/N（每日上限）· 无到期复习」，当天再进都显示完成（满足「有认识的就一直显示完成」）。
* 卡片页进度（`renderWordsStudy`）在原「总进度 x/y · 第 n 轮」下新增一行：「今日新词 tn/cap（本批新词剩 newLeft）· 到期复习剩 revLeft」；轮播完成页 counts 增加「今日新词 (doneToday+newGraded)/cap（已达标）」。词库首页 hero 第二个统计改为「今日新词剩余（已学 tNew/capN）」，副文案说明 Anki 机制与列表/卡片同源。
* Anki 语义对齐与刻意取舍：
  * 状态映射：新词=New；当批里标模糊/不认识进 `nxt` 下一轮、当天反复到「认识」毕业 = Learning steps(1m/10m) 的同日等价体验（不引入真实分钟定时器，整批一轮≈一个 learning step）；毕业=Review。
  * 按钮映射：不认识=Again、模糊=Hard、认识=Good（不引入第四键 Easy）。
  * **复习间隔保留用户既定的艾宾浩斯固定阶梯 1/2/4/7/15/30（store.js REVIEW_INTERVALS，未改成 SM-2 乘法间隔）**；ease 只记录与用于难度优先，避免违背用户多次强调的艾宾浩斯口径。
  * 列表里任意档（含模糊/不认识）`wGrade` 都算「过一遍」、写 rv.nd 占当日新卡名额（列表是一次性逐词判定，与侧栏「已背=有 rv.last」口径一致）；卡片中必须最终「认识」才毕业占名额，中途模糊/不认识（wMark 不写 last/nd）当天反复再现。
* 计划页联动（`features/plan.js`）：今日单词卡 `wordDone=wNewLearnedToday()`、`wordLeft=wNewIdxs(wNewRemain()).length`，文案「新词已学 N/上限 · 剩 X / 已达标 · 待复习 Y」；`planBuild()` 未来天的理论滚动排词（按每天满额推总进度）**未改**。
* 云同步（`mergeWords`）：合并时 `win.rv.nd = a.rv.nd||b.rv.nd||win.rv.nd`（保留首次过词日），`win.ease=min(两端, 默认2.5)`（取更低熟练度=更需复习）；words 仍走既有 `key:'words'` 整体同步，cloud.js 无需改。
* 验证：
  * `check_modules.py` BAD=0；`test_plan.js` 59、`test_books.js` 15、`test_today_lock.js` 13 保持全绿。
  * 新增 `test_words_anki.js` **19 项全绿**：初始配额；列表学 5 个后今日新学=5/剩余 0/不再发新词/刚学不到期/learned=5/nd=今天；达标后 wStart 空批；卡片全认识正好毕业 5 不超额；首张模糊不计今日新学；Again 两次 ease=2.10、Hard 两次=2.20、Good 保持 2.50、ease 下限 1.30；到期复习不计新词、不覆盖首次过词日。
  * CDP（`verify_words_anki.py`，本地 http + 无头 Chrome）：cap=5 开卡两行进度正确（总进度 0/5、今日新词 0/5、复习剩 0）；首张模糊后总进度仍 0、今日新词仍 0、本批新词剩 5；继续全认识后今日新词=5、剩余 0、轮播完成页「今日新词 5/5（已达标）· 共 2 轮 · 认识5 模糊1」；再开卡=空批完成页；列表先过 1000（cap=1000）后 wStart 直接「今日单词已完成 1000/1000」（复现并验证用户截图场景已修）；全程零 Runtime/console 异常。截图 words_card / words_home_done / words_alldone / words_list_1000_done.png。
  * 线上 https://zeril.cn/js/features/words.js 已含 wNewRemain/wNewLearnedToday/newSet（边缘传播后校验 True）。
* 版本 / 提交：线上 Version **5511f92d-a4d8-4d11-8d1b-a8d62638b65e**（仅上传 /js/features/words.js、/js/features/plan.js 两个变更资产）；commit 见 git log（本批提交）。
* 改动文件：`public/js/features/words.js`（新增 wTodayStr/wNewLearnedToday/wNewRemain，wEnsure/wBump 加 ease，wGrade 写 nd，wStart 配额+newSet，wAnswer 计 newGraded，renderWordsStudy 进度两行/完成页，renderWords hero，mergeWords 合并 nd/ease，两处注册表加 3 符号）、`public/js/features/plan.js`（今日新词 wordDone/wordLeft 与文案）。
* 工作目录（未入库）新增：`patch_words_anki.py`、`test_words_anki.js`、`verify_words_anki.py`、截图 words_card/words_home_done/words_alldone/words_list_1000_done.png。

## 20. 批 20：408 考频改为 2009-2026（18年）出题次数（2026-09-21）

> 诉求：408 树页/详情页考频标签原是「近6考N年 / 18年N年」（按考查年数、近6+18 双窗口），用户要求改成统计 2009-2026（18 年）「考了几次」（出题次数），直观看哪个考点重要；先提「近15年」后明确改为「直接统计 09-26」。

* 数据源：`C:\Users\20350\Desktop\干翻11408\408历年真题小节考频——madeby@Yoken怀古.xlsx`（@Yoken怀古）。单 sheet「408考频表-Yoken怀古」，第 3 行小节名、第 4 行起年份倒序（行4=2026 … 共 18 行=2009），单元格为 `选N` / `综N` / `选N、综M`；对「选」「综」字符计数即出题道次（一道选择题=1、一道综合大题=1）。
* 口径：`n = 18 年「选」数 + 「综」数`（出题总次数，即「考几次」）；`t`=18 年命中年数；`r`=近 6 年（2021-2026）命中年数（保留进 tip）。小节→考点 path 的映射、blocks/cc/RULES 与归属权重（一个 path 命中多个 xlsx 小节时取权重最大者）完全复用工作目录 `build_408_freq.py`，故归属与旧版一致、键集合不变（234 个 t:"408" 键，新旧集合相等校验通过）。
* 分级（lv，计划「高频→中频→低频」依赖它）：n>=15 高频 lv3、8<=n<=14 中频 lv2、n<8 低频 lv1；结果 高 63 / 中 93 / 低 78（Cache co/2/4=26、虚页 os/2/5=29、定点数/程序中断=24、TCP 连接 net/4/2=16、时间复杂度 ds/0/1=22 等顶配点落高频）。`p` 字段由旧一位小数权重改为整数 n，使同级按题次排序。features/plan.js 排序键 (lv desc)→(p desc)→(seq) 与手动换题跨级约束（只用 lv 的 1/2/3，|Δlv|<=1）天然兼容，plan.js 未改。
* 标签文案：tag = "18年"+n+"次"（如「18年26次」「18年1次」）；tip = "2009-2026（18年）共考查 N 次：选择 X 题·综合 Y 题，命中 T/18年｜近6年考查 R 年"。freqPill / sectionAggPill（core/ui-shell.js）直接读 f.tag 渲染，渲染函数未动。数学 t:"math" 共 278 条完全未改。
* 改动文件：仅 `public/js/data/syllabus.js`（第 4 行 const FREQ 单行紧凑 JSON，文件为 CRLF；程序化重写 234 个 t:"408" 条目的 lv/p/tag/tip，FREQ 总条目 512 不变；json.loads/json.dumps(separators=(',',':'),ensure_ascii=False) 整行重建，其余行不动）。
* 验证：check_modules.py BAD=0；test_plan 59、test_books 15、test_today_lock 13、test_words_anki 19 全绿（含「408 首点高频 lv3」「换题候选 lv 差≤1」未回归）；CDP verify_freq_408.py 数据层 234 条 tag 全匹配 ^18年\d+次$、tip 全含「2009-2026」、旧文案 0 条、分级 78/93/63、零 Runtime/console 异常；截图 freq_co/ds/os/net.png（co「18年24次」红、ds「18年13次」黄、net「18年2次」灰）。
* 版本 / 提交：线上 Version **deba9c83-a02e-4ec0-924e-f6c449071c89**（仅上传 /js/data/syllabus.js 一个变更资产）；commit 见 git log（本批提交）。
* 工作目录（未入库）新增：stat_408_18.py、patch_freq_408_18.py、verify_freq_408.py、syllabus.js.bak-batch20、截图 freq_co/ds/os/net.png。


## 21. 批 21：考点详情页三项体验改造（掌握自动判定 / 知识定位链接化 / 笔记富媒体）（2026-09-21）

> 诉求：(1) 知识定位选「网课」时链接字体别太大、便于复制，粘贴 URL 后变可点击超链接，详情页初始展示态（不打开编辑）就能直接跳转；(2) 笔记可插入图片、超链接、文件（原工具栏只有文字/涂鸦，链接仅插语法无弹窗，无图片/文件上传）；(3) 掌握状态纯自动判定——用户只能手动切「未学 / 学习中」，「已掌握」必须四项条件（知识定位 / 核心精华笔记 / 做题记录 / 错题订正）全满后由网站自动点亮，不可手动选已掌握（原 UI 有可手点的绿色已掌握按钮和"也可在上方手动切换状态"文案）。

* 掌握纯自动：`features/study-loop.js` 新增 `syncMastery(path)`（双向唯一权威：四项齐且非 mastered→置 mastered 返回 'up'；不齐而当前 mastered→退回 studying 返回 'down'；否则 null），`applyAutoMastery` 改为其薄封装（仅 up，幂等），`recheckMastery` 包 syncMastery（变化才存盘+cloudSave，up 庆祝 toast、down 提示转回学习中）；`masteryPanelHtml` 删除手动暂停/恢复分支，文案改"四项条件全部完成后由系统自动判定为「已掌握」，掌握状态不可手动设置；你只需在上方切换「未学 / 学习中」"；`deleteLocator` 补 recheckMastery。`core/ui-shell.js` 详情叶子渲染前对非英语 path 静默调 syncMastery（兜底任何删除导致的降级）；三按钮重渲染：未学/学习中在 mastered 态 disabled，已掌握按钮未达成时 `locked-off` 灰显 disabled（title 提示）、达成时 `on mastered locked`；点击重写为选 mastered 直接 toast 拒绝、mastered 态点未学/学习中 toast 拒绝（提示删笔记/做题/定位会自动退回）、只在 ''/studying 间切且不写 masteryManual；新增 `[data-copy]` 事件委托（clipboard + execCommand 兜底）。`masteryManual` 字段保留兼容但不再参与判定、cloud 同步不动。
* 计划解耦"学过≠掌握"：`features/plan.js` `planLeafDone` 改为 mastered 或 studying 都算完成（政治保留 planPoliNoteDone 笔记判据），`planToggleLeaf` 改为 ''/studying 间切、mastered 态不响应。总览掌握率统计仍只数 mastered（未改）。
* 知识定位链接化：`study-loop.js` 新增 `linkifyText(t)`（先 esc 再把 http(s) URL 替换为 `<a class="loc-link" target=_blank rel=noopener>` + `<button class="loc-copy" data-copy=>复制</button>`，剥离尾部标点，正则兼容 esc 后的 &amp;;=% 等）；`locatorPanelHtml` 的 source/loc/note 全改用 linkifyText。CSS `.loc-link`（11px 等宽、break-all、链接色、下划线）、`.loc-copy`（极小按钮）。
* 笔记富媒体：新建高内聚模块 `features/attach.js`（`notePickImage/notePickFile/noteAttachUpload/attachShrink`，动态创建隐藏 file input 无需挂载；登录走 R2 folder:'note'，图片超 12MB canvas 压到最长边 1600/jpeg0.82，图片插 `![name](url)`、文件插 `[附件：name](url?name=encode)`；未登录图片降级 dataURL 内嵌、≤约3MB 并 toast 提示仅本机，未登录文件拒绝并提示登录；图片上限12MB、其他25MB、拒传 svg），已在 `main.js` import + 注册。`worker/photos.js` 整体重写：白名单 IMG_EXT(jpg/jpeg/png/gif/webp/bmp，拒 svg 防存储型 XSS) 与 DOC_EXT(pdf/office/txt/md/csv/压缩/音视频)，note 对象 key=userId/note/uuid.ext，mime 白名单（未知强制 application/octet-stream），图片 inline、其他或带 ?name= 时 Content-Disposition attachment 且 filename*=UTF-8；**能力 URL**：正则 `^[^/]+/note/{36位uuid}.{ext}$` 的对象 GET 匿名只读（无法列目录），DELETE 仍仅属主；真题照片 key（无 note/ 前缀）维持登录校验。`worker/index.js` 在 authenticate 之前放行匿名 `GET /api/photo/{uid}/note/...`。`index.html` 工具栏 link 后加「图片」「文件」按钮、md-hint 文案补"图片 / 文件附件"；`core/app-init.js` 加 image/file 分支；`core/md-render.js` `mdTool('link')` 增强为弹窗式（选中文字包链接并选中 https:// 占位、未选中两次 prompt 输入 URL 校验 http 前缀+显示文字）；mdRenderer.image 给 img 加 class="md-img"；CSS `img.md-img{max-width:100%}` 及锁定按钮 `.locked-off/.on.mastered.locked` 样式。
* 改动文件：`public/js/features/attach.js`（新建）、`worker/photos.js`（整体重写）、`worker/index.js`（authenticate 前放行匿名 note 能力URL）、`public/index.html`（工具栏加图片/文件按钮、md-hint 文案；CRLF）、`public/js/core/md-render.js`（mdTool link 弹窗增强、img 加 class md-img）、`public/js/features/study-loop.js`（linkifyText、syncMastery 双向自动、recheck 降级、面板文案、deleteLocator 复核、导出两处长表加 syncMastery/linkifyText）、`public/js/core/ui-shell.js`（渲染前静默 sync、按钮 locked/locked-off 渲染、点击拒绝手动 mastered、[data-copy] 委托）、`public/js/features/plan.js`（planLeafDone 认 studying、planToggleLeaf 只切 studying）、`public/js/core/app-init.js`（工具栏 image/file 分支）、`public/js/main.js`（import + 注册 attach）、`public/styles/base.css`（末尾追加批21样式块）。
* 验证：check_modules.py BAD=0（含新 attach.js、worker 全部）；有效 harness 单测全绿：新建 `test_mastery.js` 26 项（自动升级/幂等/错题与删精华降级/计划勾选只能到 studying/linkify 转义与 query&amp;/尾部标点）+ test_plan 59 + test_today_lock 13 + test_books 15 + test_words_anki 19 = 132 项；CDP `cdp_batch21.py`（端口 HTTP 8952/CDP 9392，profile cdp_b21_profile；注入 path 必须用页面实时 `leafPath(getNode(currentRoute().path))`，硬编码 ds/4/10/0 首次未命中）三场景：四项齐全后详情自动 mastered（已掌握绿色 locked、未学/学习中 disabled、掌握条件4/4、底部自动判定文案、网课 URL 与备注 URL 均渲染为小号等宽蓝色可点链接+复制按钮，截图 b21_mastered.png）；清空后已掌握按钮 locked-off 灰显 disabled、学习中高亮（b21_lockedoff.png）；笔记编辑器 图片/文件/链接 按钮齐全、notePickImage/notePickFile 函数存在（b21_notetoolbar.png）；全程无 console/exception 错误。线上静态校验：zeril.cn /js/features/attach.js 200 含 notePickImage/notePickFile、/index.html 含 data-cmd=image/file/link、/styles/base.css 含 loc-link/locked-off/md-img；匿名能力 URL `GET /api/photo/{uid}/note/{uuid}.jpg` 返回 404（R2 无对象）而非 401，证明 authenticate 前放行分支生效。
* 待用户线上验（需登录态，自动化无法替登）：登录后在任意考点「+笔记」→ 点「图片」上传一张图、点「文件」上传一个 pdf，确认笔记渲染出图片/可下载文件（经 note 能力 URL 匿名显示/下载，?name 保留原文件名）；未登录时图片应降级 dataURL 内嵌并 toast 提示仅本机、文件应拒绝并提示登录。
* 版本 / 提交：线上 Version **92d82faf-bb37-4632-8f37-30c978f0b2ac**（上传 9 个新/修改前端资产 + Worker bundle 更新）；commit **1e9a63b**（本地=origin/main）。
* 工作目录（未入库）新增：`patch_batch21.py`（首批补丁，study-loop 处中断，前3文件已写回）、`patch_batch21b.py`（剩余文件，成功）、`patch_harness.py`（harness 加 attach）、`test_mastery.js`（26 项全绿）、`bundle_harness.js`（MAIN_ORDER 已加 features/attach.js）、`cdp_batch21.py`（CDP 回归脚本）、截图 b21_mastered.png/b21_lockedoff.png/b21_notetoolbar.png、deploy_b21.txt/push_b21.txt。
* 踩坑：①首个补丁脚本 patch_batch21.py 跑到 study-loop locator 行因中点 `·` 字符匹配 0 中断（worker/index.js、index.html、md-render.js 三个已先成功写回），改用不含中点的更小唯一锚点的 patch_batch21b.py 跑剩余文件成功；补丁脚本对每个文件在写回前 assert，故中断文件未被半写。②PowerShell `python -c` 单行内嵌 JS 引号会被转义破坏，改写成 .py 文件跑。③CDP 注入考点数据时 path 必须用页面实时 `leafPath(getNode(currentRoute().path))`，硬编码 hash 段 ds/4/10/0 与 leafPath 实时算出的权威 path 有偏差会导致注入数据不生效。④梯子未开时直连 Cloudflare 部署连续超时（api.cloudflare.com TLS 可达但 Workers Assets 上传体积大不稳），必须经本地代理 11304（用户手动开全局）；git push 经代理较慢（GitHub info/refs 约 15-30s），需后台运行给足时间；PowerShell 会把 git 进度/NativeCommandError 显示成报错且 exit code 污染，以 `git fetch` 后 `git rev-parse HEAD == origin/main` 为准判断 push 成功。
