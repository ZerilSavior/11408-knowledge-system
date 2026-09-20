# 考研知识体系（11408 / 干翻 11408）项目交接文档

> 拿到本文档即可接手项目。最后更新：2026-09-20。
> 一句话：一个
>
> **单文件原生 JS 单页应用（SPA）**
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

* 主改造文件只有一个：`public/index.html`（约 1.06 万行、1.6 MB）。绝大多数需求都改这一个文件。



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



* **前端**：原生 HTML + CSS + JavaScript，**无框架、无构建步骤**。hash 路由（`#/home`、`#/tree/...`、`#/words`、`#/plan`、`#/notes` 等）。

* **第三方库（CDN，带 SRI）**：`marked@12.0.2`（Markdown 渲染）、`KaTeX 0.16.11` + `contrib/auto-render`（数学公式）、`highlight.js 11.9.0`（代码高亮）。思维导图 / 框架图是**自研 canvas**（非 mermaid）。

* **后端**：`_worker.js`（Cloudflare Worker）。


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

│  ├─ index.html          # ★ 主产物，几乎所有功能都在这（单文件 SPA）

│  └─ data/

│     └─ words.js          # window.WORDS\_DATA=\[\[word,phonetic,meaning],...]，5489 词

├─ \_worker.js              # Cloudflare Worker：登录 + 通用 KV 同步

├─ wrangler.jsonc          # 部署配置（assets=./public，D1 binding）

├─ server.js               # 早期本地同步服务器（现已基本不用，主链路是 Worker）

├─ package.json

├─ README.md / DEPLOY\*.md   # 早期部署笔记

├─ \_backup/                # ★ 每次大改前的 index.html 备份（index-pre-batchN-时间戳.html）

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



* **最简单**：直接双击 `public/index.html`（file:// 即可运行；words.js 用 `<script src>` 已兼容）。

* 起本地静态服务（更接近线上）：在 `public/` 目录 `npx serve .` 或 `python -m http.server`。

* 云同步在本地 file:// 也能调通 Worker（跨域已允许），需登录。



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