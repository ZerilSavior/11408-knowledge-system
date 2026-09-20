// 模块: ui-shell（由单文件重构拆分；顶层符号经 main.js 聚合为全局，保持零构建原生 ESM）

function renderSidebar(){
  const route=currentRoute(); const hash=location.hash||'';
  const subBtn=(id)=>{
    const s=getSubject(id); const st=subStats(s);
    const active=route.type==='tree'&&route.path.split('/')[0]===id;
    const isEng=id==='eng';
    const meta=isEng?'考纲浏览 · 综合掌握':(st.total+' 考点 · '+st.mastered+' 已掌握');
    const pct=isEng?engMasteryPct():st.pct;
    return '<button class="snav sub '+(active?'active':'')+'" data-goto="#/tree/'+id+'" style="'+(active?'border-left:3px solid '+s.color:'')+'">'
      +'<span class="scol" style="background:'+s.color+';'+(active?'':'opacity:.35')+'"></span>'
      +'<span class="sinfo"><span class="sname">'+s.name+'<span class="en">'+s.code+'</span></span><span class="smeta">'+meta+'</span></span>'
      +'<span class="spct" style="color:'+s.color+'">'+pct+'%</span></button>';
  };
  const toolBtn=(h0,label,en,color,meta,pct)=>{ const active=hash.indexOf(h0)===0;
    return '<button class="snav sub '+(active?'active':'')+'" data-goto="'+h0+'" style="'+(active?'border-left:3px solid '+color:'')+'">'
      +'<span class="scol" style="background:'+color+';'+(active?'':'opacity:.35')+'"></span>'
      +'<span class="sinfo"><span class="sname">'+label+'<span class="en">'+en+'</span></span><span class="smeta">'+(meta||'')+'</span></span>'
      +'<span class="spct" style="color:'+color+'">'+(pct!=null?pct+'%':'')+'</span></button>';
  };
  const group=(title,color,inner)=>'<details class="sgrp" open><summary style="--gc:'+color+'"><span class="sg-dot" style="background:'+color+'"></span>'+title+'</summary><div class="sgrp-body">'+inner+'</div></details>';
  const ws=wStats();
  const notesActive=['notes','maps','map'].includes(route.type);
  const dueN=dueItems().length;
  const notesBtn='<button class="snav sub '+(notesActive?'active':'')+'" data-goto="#/notes" style="'+(notesActive?'border-left:3px solid var(--kc-note)':'')+'">'
    +'<span class="scol" style="background:var(--kc-note);'+(notesActive?'':'opacity:.35')+'"></span>'
    +'<span class="sinfo"><span class="sname">学习中心<span class="en">JOURNAL</span></span><span class="smeta">'+state.items.length+' 条 · '+(dueN?('待复习 '+dueN):'笔记 / 导图 / 错题')+'</span></span>'
    +'<span class="spct" style="color:'+(dueN?'var(--kc-wait)':'var(--kc-note)')+'">'+(dueN?dueN:state.items.length)+'</span></button>';
  const examBtn=examSidebarItem().replace('class="snav ','class="snav sub ');
  let html=planSidebarItem();
  html+=group('数学一 · 150 分','#7b53d6',['math1','math2','math3'].map(subBtn).join(''));
  html+=group('408 计算机 · 150 分','#1a9e6e',['ds','co','os','net'].map(subBtn).join(''));
  html+=group('英语一 · 100 分','#2f7fd6',
     subBtn('eng')
     +toolBtn('#/words','英语词汇','WORDS','#2f7fd6',ws.learned+' / '+WORDS.length+' 已背',Math.round(100*ws.learned/WORDS.length))
     +toolBtn('#/reading','阅读打卡','READ','#0a8a5f',readingSideMeta(),null)
     +toolBtn('#/mindmap','导图速记','MIND','#8e44ad',mindmapSideMeta(),null));
  html+=group('政治 · 100 分','#c0392b',['poli1','poli2','poli3','poli4','poli5','poli6'].map(subBtn).join(''));
  html+=group('学习工具','#5b6b7e',examBtn+notesBtn);
  $('#sideNav').innerHTML=html;
  $('#overallPct').textContent=overallStats().pct+'%';
  $('#overallBar').style.width=overallStats().pct+'%';
}


/* ============================================================

 * 路由

 * ============================================================ */

function currentRoute(){

  const h = location.hash || '#/';

  if(h.startsWith('#/notes')){

    const id = h.startsWith('#/notes/') ? h.slice(8) : '';

    return {type:'notes', id};

  }

  if(h.startsWith('#/maps')){

    return {type:'maps', id:''};

  }

  if(h.startsWith('#/map/')){

    return {type:'map', id: decodeURIComponent(h.slice(6))};

  }

  if(h.indexOf('#/plan')===0){

    return {type:'plan'};

  }

  if(h.indexOf('#/exams')===0){

    return {type:'exams'};

  }

  if(h.indexOf('#/reading')===0){

    return {type:'reading'};

  }

  if(h.indexOf('#/mindmap')===0){

    return {type:'mindmap'};

  }

  if(h.indexOf('#/words')===0){

    return {type:'words', path:''};

  }

  if(h.startsWith('#/tree/')){

    const path = h.slice(7);

    return {type:'tree', path};

  }

  return {type:'overview', path:''};

}

function render(){

  renderSidebar();

  const route = currentRoute();

  $('#view-overview').classList.toggle('active', route.type==='overview');

  $('#view-tree').classList.toggle('active', route.type==='tree');

  $('#view-notes').classList.toggle('active', route.type==='notes' || route.type==='maps');

  $('#view-map').classList.toggle('active', route.type==='map');
  $('#view-map').classList.toggle('active', route.type==='map');

  $('#view-words').classList.toggle('active', route.type==='words');

  $('#view-plan').classList.toggle('active', route.type==='plan');
  $('#view-reading').classList.toggle('active', route.type==='reading');

  $('#view-mindmap').classList.toggle('active', route.type==='mindmap');

  $('#view-exams').classList.toggle('active', route.type==='exams');

  const curSub = route.type==='tree' ? route.path.split('/')[0] : '';

  document.querySelectorAll('#topnav button').forEach(b=>{

    let on = false;

    if(route.type==='tree') on = b.dataset.nav === '#/tree/'+curSub;

    else if(route.type==='words') on = b.dataset.nav === '#/tree/eng';
    else if(route.type==='reading') on = b.dataset.nav === '#/tree/eng';

    else if(route.type==='plan') on = false;

    else if(route.type==='notes' || route.type==='maps' || route.type==='map') on = b.dataset.nav === '#/notes';

    else if(false) on = false;

    else on = b.dataset.nav === '#/';

    b.classList.toggle('active', on);

  });

  if(route.type==='overview'){ renderOverview(); const pb=$('#planBannerSlot'); if(pb)pb.innerHTML=planOverviewBanner(); }

  else if(route.type==='notes') renderNotes();

  else if(route.type==='maps'){ kindFilter='map'; renderNotes(); }

  else if(route.type==='map') renderMap();

  else if(route.type==='words') renderWords();

  else if(route.type==='plan') renderPlan();
  else if(route.type==='reading') renderReading();

  else if(route.type==='mindmap') renderMindmap();

  else if(route.type==='exams') renderExams();

  else renderTree();

}



/* ============================================================

 * 渲染：知识树

 * ============================================================ */

let selectedPath = '';

function renderTree(){

  const route = currentRoute();

  const subId = route.path.split('/')[0];

  const sub = getSubject(subId);

  if(!sub){ location.hash='#/'; return; }



  $('#treeTitle').innerHTML = `<span class="dot" style="background:${sub.color}"></span>${sub.name}`;

  const st = subStats(sub);

  $('#treeCount').textContent = `${st.total} 考点 · ${st.mastered} 已掌握 · ${st.pct}%`;



  selectedPath = route.path; // 若选中叶子，path 即为考点路径



  const body = $('#treeBody');

  body.innerHTML = buildTreeRows(sub);

  attachTreeEvents(body, sub);

  syncFreqSortBtn();



  /* 滚动选中行到可见区域 */

  const sel = body.querySelector('.trow.sel');

  if(sel){

    body.scrollTop = sel.offsetTop - body.clientHeight/2;

  }



  renderDetail();

}



/* ---------- 考频徽标与章内排序 ---------- */
/* ===== 数学一 33 题型精确考频（近15年）覆盖层 =====
   题型框架：郭雨港《数一所有题型分类、通用解法详解》
   考频来源：抖音@晨曦学长《25考研数学一·近15年考频分析》（n=近15年考查次数，n>=8高频/4-7中频/<=3低频） */
(function(){
 const FW='郭雨港《数一所有题型分类、通用解法详解》', SRC='抖音@晨曦学长《25考研数学一·近15年考频分析》';
 const lvT={3:'高频',2:'中频',1:'低频'};
 Object.keys(FREQ).forEach(k=>{ if(/^math[123]\//.test(k)) FREQ[k]={lv:1,p:1.5,t:'math',tag:'选填偶考',tip:'选填偶考考点，未进入近15年大题高频统计，按低频了解即可。题型框架：'+FW+'；考频：'+SRC+'。'}; });
 // 选填/基础高频章节（33题型图未单列但属必考基础）
 [['math2/0',2,4,'矩阵与行列式（选填基础）'],['math3/0',2,3,'随机事件与概率（基础）'],['math3/1',2,3,'一维随机变量及其分布（基础）'],['math3/5',2,3,'数理统计基本概念（参数估计基础）']].forEach(b=>{
   const pre=b[0],lv=b[1],pp=b[2],nm=b[3];
   Object.keys(FREQ).forEach(k=>{ if(k.indexOf(pre+'/')===0) FREQ[k]={lv:lv,p:pp,t:'math',tag:'选填常考',tip:'【'+nm+'】选填与基础高频，需熟练掌握。题型框架：'+FW+'；考频：'+SRC+'。'}; });
 });
 // [频次, 题型名, 小节前缀或精确叶子path...]
 const G=[
 [10,'函数极限','math1/1/0','math1/1/1','math1/1/2','math1/1/3'],
 [4,'数列极限（夹逼/定积分定义/单调有界）','math1/1/6','math1/1/7'],
 [5,'无穷小量比阶','math1/1/4'],
 [3,'连续与间断','math1/1/5','math1/1/11','math1/2/0','math1/2/4'],
 [2,'可导性判别','math1/2/1'],
 [9,'导数与求导运算','math1/2/2','math1/2/3','math1/3/0'],
 [10,'极值、拐点与渐近线','math1/3/1','math1/3/4','math1/3/5'],
 [6,'微分中值定理证明','math1/3/2','math1/3/3','math1/3/7','math1/3/8','math1/3/9','math1/3/10','math1/3/11','math1/3/12'],
 [2,'不定积分','math1/4/0','math1/4/1','math1/4/2','math1/4/3','math1/4/4','math1/4/5'],
 [15,'定积分计算','math1/5/0','math1/5/1','math1/5/2','math1/5/3','math1/5/4','math1/5/5','math1/5/7','math1/5/8','math1/5/9','math1/5/10','math1/5/11'],
 [3,'定积分几何应用（面积/体积/弧长）','math1/5/6'],
 [2,'多元连续/可偏导/可微判别','math1/6/0'],
 [11,'多元偏导与全微分','math1/6/1','math1/6/3'],
 [10,'多元函数极值与最值','math1/6/2'],
 [7,'二重积分','math1/7/0','math1/7/1','math1/7/2','math1/7/3','math1/7/4','math1/7/5'],
 [2,'三重积分','math1/7/6'],
 [8,'一阶微分方程','math1/8/0','math1/8/2','math1/8/3'],
 [9,'二阶常系数线性微分方程','math1/8/1'],
 [5,'常数项级数敛散性','math1/9/0','math1/9/1'],
 [13,'幂级数收敛半径/收敛域/和函数（含函数展开）','math1/9/2','math1/9/3','math1/9/4','math1/9/5'],
 [22,'曲线积分与曲面积分','math1/11/0','math1/11/1','math1/11/2'],
 [3,'向量组线性相关/无关','math2/1/0','math2/1/2'],
 [5,'向量线性表出','math2/1/1','math2/1/3','math2/1/4'],
 [11,'线性方程组求解','math2/2/0','math2/2/1','math2/2/2','math2/2/2','math2/2/3','math2/2/4'],
 [8,'相似对角化：可逆矩阵P与正交矩阵Q','math2/3/0','math2/3/1','math2/3/2'],
 [14,'二次型','math2/3/3'],
 [4,'二维离散型随机变量及分布','math3/2/0','math3/2/2','math3/2/3/0'],
 [9,'二维连续型：分布函数与概率密度','math3/2/1','math3/2/3/1','math3/2/3/2'],
 [14,'随机变量的数学期望与方差（含协方差/相关系数）','math3/3/0','math3/3/1'],
 [10,'参数估计：矩估计与最大似然估计','math3/6/0','math3/6/1','math3/6/2','math3/6/3']
 ];
 G.forEach(g=>{const n=g[0],name=g[1],lv=n>=8?3:(n>=4?2:1);
   for(let j=2;j<g.length;j++){const pre=g[j];
     Object.keys(FREQ).forEach(k=>{ if(k===pre||k.indexOf(pre+'/')===0) FREQ[k]={lv:lv,p:n,t:'math',tag:'近15年'+n+'次',tip:'【'+name+'】近15年考查 '+n+' 次（'+lvT[lv]+'）。题型框架：'+FW+'；考频：'+SRC+'。'}; });
   }});
})();

function freqOf(p){ return FREQ[p]||null; }

const FREQ_LB=['低频','中频','高频'];

function freqPill(p){
  const f=freqOf(p); if(!f) return '';
  const lb = f.tag || FREQ_LB[f.lv-1];
  return `<span class="freq lv${f.lv}" title="${esc(f.tip||f.tag||'')}">${esc(lb)}</span>`;
}

function sectionMaxFreq(subId,ci,si,sec){
  let best=null;
  const consider=p=>{const f=freqOf(p); if(f&&(!best||f.p>best.p))best=f;};
  if(sec.topics.length){ sec.topics.forEach((tp,ti)=>consider(`${subId}/${ci}/${si}/${ti}`)); }
  else consider(`${subId}/${ci}/${si}`);
  return best;
}

function sectionAggPill(subId,ci,si,sec){
  const f=sectionMaxFreq(subId,ci,si,sec); if(!f) return '';
  const lb=f.tag||FREQ_LB[f.lv-1];
  return `<span class="freq lv${f.lv}" title="本小节高频考点：${esc(f.tip)}">${esc(lb)}</span>`;
}

function isFreqSort(){ try{return localStorage.getItem('k408-freqsort')==='1';}catch(e){return false;} }

function orderedSectionIdxs(sub,ch,ci){
  const idx=ch.sections.map((s,si)=>si);
  if(!isFreqSort())return idx;
  const sc=si=>{const f=sectionMaxFreq(sub.id,ci,si,ch.sections[si]);return f?f.p:-1;};
  return idx.sort((a,b)=>sc(b)-sc(a));
}

function orderedTopicIdxs(subId,ci,si,sec){
  const idx=sec.topics.map((t,ti)=>ti);
  if(!isFreqSort())return idx;
  const sc=ti=>{const f=freqOf(`${subId}/${ci}/${si}/${ti}`);return f?f.p:-1;};
  return idx.sort((a,b)=>sc(b)-sc(a));
}

function toggleFreqSort(){
  try{ localStorage.setItem('k408-freqsort', isFreqSort()?'0':'1'); }catch(e){}
  renderTree();
}

function syncFreqSortBtn(){
  const b=document.getElementById('freqSortBtn');
  if(!b)return;
  b.classList.toggle('on',isFreqSort());
  b.textContent = isFreqSort()?'✓ 按考频排序':'按考频排序';
}

function buildTreeRows(sub){

  /* 第一步：收集当前可见行（含展开状态），记录每行的祖先路径 */

  const rows = [];

  sub.chapters.forEach((ch,ci)=>{

    const chPath = `${sub.id}/${ci}`;

    const chOpen = isChapterOpen(sub.id, ci);

    rows.push({kind:'chapter', path:chPath, name:ch.name, open:chOpen, ancestors:[], cs:chapterStats(sub,ci)});

    if(chOpen){

      orderedSectionIdxs(sub,ch,ci).forEach(si=>{
        const sec = ch.sections[si];

        const secPath = `${sub.id}/${ci}/${si}`;

        const secOpen = isSectionOpen(sub.id, ci, si);

        const leafSec = sec.topics.length===0;

        rows.push({kind:'section', path:secPath, name:sec.name, open:secOpen, ancestors:[chPath],

          leaf:leafSec, fp: leafSec?freqPill(secPath):sectionAggPill(sub.id,ci,si,sec), marker:sec.marker||'', mastery: leafSec?(state.mastery[secPath]||''):'', topicCount:sec.topics.length});

        if(secOpen && !leafSec){

          orderedTopicIdxs(sub.id,ci,si,sec).forEach(ti=>{
            const tp = sec.topics[ti];

            rows.push({kind:'topic', path:`${sub.id}/${ci}/${si}/${ti}`, name:tp.name, ancestors:[chPath,secPath],

              num:ti+1, fp:freqPill(`${sub.id}/${ci}/${si}/${ti}`), mastery:state.mastery[`${sub.id}/${ci}/${si}/${ti}`]||'', demo:!!(tp.content&&tp.content.demo)});

          });

        }

      });

    }

  });

  /* 第二步：逐行渲染。深度 d 的行有 d 个祖先列段 + 1 个自身连接段；

     祖先列段 k 是否带竖线，取决于该祖先子树在本行之后是否还有可见行 */

  let html = '';

  rows.forEach((row,i)=>{

    const d = row.ancestors.length;

    let segs = '';

    for(let k=0;k<d;k++){

      const anc = row.ancestors[k];

      const below = rows.some((r,j)=> j>i && r.ancestors[k]===anc);

      segs += `<span class="gseg ${below?'':'b'}"></span>`;

    }

    segs += `<span class="gseg"></span>`;

    const sel = selectedPath===row.path ? ' sel' : '';

    if(row.kind==='chapter'){

      html += `<div class="trow chapter${sel}" data-path="${row.path}" style="--selc:${sub.color}">${segs}

        <button class="tcaret ${row.open?'open':''}" data-toggle="${row.path}">${caretSvg()}</button>

        <span class="tname">${esc(row.name)}</span>

        <span class="tcount">${row.cs.mastered}/${row.cs.total}</span>

      </div>`;

    }else if(row.kind==='section'){

      html += `<div class="trow section${sel}" data-path="${row.path}" style="--selc:${sub.color}">${segs}

        <button class="tcaret ${row.open?'open':''} ${row.leaf?'leaf':''}" ${row.leaf?'':'data-toggle="'+row.path+'"'}>${caretSvg()}</button>

        <span class="tname">${esc(row.name)}</span>

        ${row.marker?`<span class="tmark">${esc(row.marker)}</span>`:''}

        ${row.fp||''}

        ${row.leaf?`<span class="tdot ${row.mastery}"></span>`:`<span class="tcount">${row.topicCount} 考点</span>`}

      </div>`;

    }else{

      html += `<div class="trow topic${sel}" data-path="${row.path}" style="--selc:${sub.color}">${segs}

        <button class="tcaret leaf">${caretSvg()}</button>

        <span class="tnum">${row.num}</span>

        <span class="tname">${esc(row.name)}</span>

        ${row.demo?`<span class="tmark">示例</span>`:''}

        ${row.fp||''}

        <span class="tdot ${row.mastery}"></span>

      </div>`;

    }

  });

  return html;

}

function caretSvg(){

  return `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>`;

}

function attachTreeEvents(body, sub){

  body.querySelectorAll('.trow').forEach(row=>{

    row.addEventListener('click', ev=>{

      const path = row.dataset.path;

      const node = getNode(path);

      const isContainer = row.querySelector('.tcaret') && !row.querySelector('.tcaret.leaf');

      const toggleBtn = row.querySelector('.tcaret[data-toggle]');

      if(toggleBtn && ev.target.closest('.tcaret')){

        toggleRow(toggleBtn, path);

        return;

      }

      if(isContainer && !isLeafNode(node)){

        /* 点击容器：若未选中，先选中；再点一次展开 */

        if(selectedPath===path){

          const btn = row.querySelector('.tcaret[data-toggle]');

          if(btn) toggleRow(btn, path);

        }else{

          location.hash = '#/tree/' + path;

          scrollDetailIntoView();

        }

        return;

      }

      location.hash = '#/tree/' + path;

      scrollDetailIntoView();

    });

  });

}

/* 移动端：选中树节点后，把下方详情面板滚入视野 */

function scrollDetailIntoView(){

  if(window.innerWidth > 960) return;

  setTimeout(()=>{

    const pane = $('#detailPane');

    if(pane) pane.scrollIntoView({behavior:'smooth', block:'start'});

  }, 80);

}

function toggleRow(btn, path){

  const p = path.split('/');

  if(p.length===2){ openState[path] = !isChapterOpen(p[0], Number(p[1])); }

  else { openState[path] = !isSectionOpen(p[0], Number(p[1]), Number(p[2])); }

  renderTree();

}



/* ============================================================

 * 渲染：详情面板

 * ============================================================ */

function renderDetail(){

  const pane = $('#detailPane');

  const route = currentRoute();

  const node = getNode(route.path);

  if(!node){ pane.innerHTML = emptyDetail(); return; }



  const sub = node.subject;

  const selColor = sub.color;

  pane.style.setProperty('--selc', selColor);

  const crumb = [];

  if(node.chapter) crumb.push(node.chapter.name);

  if(node.section) crumb.push(node.section.name);

  if(node.topic) crumb.push(node.topic.name);



  let html = '';

  html += `<div class="crumb"><a href="#/">总览</a><span class="sep">/</span><a href="#/tree/${sub.id}" style="color:${selColor};font-weight:600">${sub.name}</a>` +

    crumb.map((c,i)=>`<span class="sep">/</span><span class="${i===crumb.length-1?'cur':''}">${esc(c)}</span>`).join('') + `</div>`;



  const title = node.topic ? node.topic.name : (node.section ? node.section.name : (node.chapter ? node.chapter.name : sub.name));

  const note = node.topic ? node.topic.note : (node.section ? node.section.note : null);

  const marker = node.section && node.section.marker;



  html += `<div class="d-title"><h2>${esc(title)}</h2>

    <span class="tag sub" style="background:${selColor}">${sub.code}</span>

    ${marker?`<span class="tag marker">${esc(marker)}</span>`:''}

    ${node.topic&&node.topic.content&&node.topic.content.demo?`<span class="tag demo">示例填充</span>`:''}

    ${(node.topic||(node.section&&node.section.topics.length===0))?freqPill(route.path):''}

  </div>`;

  if(note) html += `<div class="d-note">${esc(note)}</div>`;



  /* 学科根：考察目标 */

  if(!node.chapter){

    html += `<div class="obj-card"><div class="obj-t">考察目标 · EXAM OBJECTIVES</div><ol>` +

      sub.objective.map(o=>`<li>${esc(o)}</li>`).join('') + `</ol></div>`;

    const st = subStats(sub);

    html += `<div class="stat-row" style="grid-template-columns:repeat(4,1fr);margin-top:18px">

      <div class="stat-card"><div class="num">${sub.chapters.length}</div><div class="lbl">章节</div></div>

      <div class="stat-card"><div class="num">${st.total}</div><div class="lbl">考纲考点</div></div>

      <div class="stat-card"><div class="num">${st.mastered}</div><div class="lbl">已掌握</div></div>

      <div class="stat-card"><div class="num">${st.pct}%</div><div class="lbl">学习进度</div></div>

    </div>`;

    html += `<div style="margin-top:8px"><a class="iconbtn" href="#/tree/${sub.id}/0" style="--selc:${selColor}">从第一章开始</a></div>`;

  }

  else if(node.chapter && !node.section){

    /* 章节容器：子小节概览 */

    const cs = chapterStats(sub, sub.chapters.indexOf(node.chapter));

    const chapIdx = sub.chapters.indexOf(node.chapter);

    const dKey = sub.id + '/' + chapIdx;

    const userDiag = getUserDiagram(dKey);

    /* 自定义框架图 */

    html += `<div class="kv" style="margin-bottom:6px"><span class="k">本章节考点</span><span class="v" style="color:${selColor}">${cs.mastered}/${cs.total} 已掌握</span>

      <button class="iconbtn" data-edit-diagram="${dKey}" style="margin-left:auto;--selc:${selColor}">${userDiag?'✎ 编辑框架图':'+ 添加框架图'}</button></div>`;

    if(userDiag){

      html += `<div class="d-block"><div class="db-t"><span class="no dg-badge">图</span>章节框架<span class="hint">STRUCTURE</span></div><div class="dg-wrap">${userDiag.html}</div></div>`;

    }

    html += `<div class="sub-outline">` + node.chapter.sections.map((sec,si)=>{

      const secPath = `${sub.id}/${sub.chapters.indexOf(node.chapter)}/${si}`;

      const m = sec.topics.length ? null : state.mastery[secPath];

      return `<div class="so-row" data-goto="#/tree/${secPath}" style="--selc:${selColor}">

        <span class="so-dot ${m||''}"></span>

        <span class="so-num">${si+1}</span>

        <span class="so-name">${esc(sec.name)}</span>

        <span class="so-go">${sec.topics.length? sec.topics.length+' 考点':'考点'} →</span>

      </div>`;

    }).join('') + `</div>`;

  }

  else if(node.section && !node.topic && node.section.topics.length){

    /* 小节容器：子考点概览 */

    html += `<div class="sub-outline">` + node.section.topics.map((tp,ti)=>{

      const tpPath = `${sub.id}/${sub.chapters.indexOf(node.chapter)}/${node.chapter.sections.indexOf(node.section)}/${ti}`;

      const m = state.mastery[tpPath];

      return `<div class="so-row" data-goto="#/tree/${tpPath}" style="--selc:${selColor}">

        <span class="so-dot ${m||''}"></span>

        <span class="so-num">${ti+1}</span>

        <span class="so-name">${esc(tp.name)}</span>

        <span class="so-go">考点 →</span>

      </div>`;

    }).join('') + `</div>`;

  }



  /* 考点叶子：知识板块 + 学习状态 + 笔记 */

  if(isLeafNode(node)){

    const path = leafPath(node);

    const content = (node.topic && node.topic.content) || (node.section && node.section.content);

    const m = state.mastery[path] || '';



    const leafSubId=path.split('/')[0]; const engBrowse=leafSubId==='eng';
    if(engBrowse){
      html += '<div class="mc-card" style="margin:16px 0;background:var(--panel-2);border:1px dashed var(--line);padding:13px 16px;color:var(--ink-2);font-size:13.5px;line-height:1.8"><b>【英语 · 考纲浏览】</b>英语一考纲仅供浏览，不按单个考点判定掌握。英语综合掌握度 ＝ 单词 60% ＋ 新东方阅读 25% ＋ 历年真题 15%，请在左侧「英语词汇」「阅读打卡」中打卡；做完 200 篇阅读、所有单词标认识、做完历年真题即为 100%。</div>';
    } else {
    html += `<div class="study-row">
      <span class="sl">学习状态</span>
      <div class="seg" data-mastery="${path}">
        ${[['','未学'],['studying','学习中'],['mastered','已掌握']].map(([v,l])=>
          `<button data-v="${v}" class="${m===v?'on '+v:''}">${l}</button>`).join('')}
      </div>
      ${m?`<span class="study-note">当前：<b>${MASTERY[m]}</b>${m==='mastered'?'，四项条件满足后自动判定':''}</span>`:''}
    </div>`;
    html += masteryPanelHtml(path);
    }



    if(content&&content.diagram){

      html += `<div class="d-block"><div class="db-t"><span class="no dg-badge">图</span>框架结构<span class="hint">STRUCTURE</span></div>${content.diagram}</div>`;

    }



    html += `<div class="d-block"><div class="db-t"><span class="no">01</span>核心概念<span class="hint">CONCEPT</span></div>` +

      (content&&content.html

        ? `<div class="kp-html">${content.html}</div>`

        : (content&&content.concept

          ? `<div class="kp-prose">${conceptMd(content.concept)}</div>`

          : emptyBox('核心概念待延伸','后续对话中告诉我「延伸该考点」，将在此填充定义、原理与本质理解。'))) + `</div>`;



    html += `<div class="d-block"><div class="db-t"><span class="no">02</span>重点难点<span class="hint">KEY POINTS</span></div>` +

      (content&&content.keyPoints

        ? `<ul class="kp-list">${content.keyPoints.map(k=>`<li><span class="kp-li-text">${inlineMd(k)}</span></li>`).join('')}</ul>`

        : emptyBox('重点难点待延伸','将在此列出易错点、高频考点与易混淆概念辨析。')) + `</div>`;



    html += `<div class="d-block"><div class="db-t"><span class="no">03</span>常考题型<span class="hint">EXAM FORMS</span></div>` +

      (content&&content.examForms

        ? `<ul class="kp-list dense">${content.examForms.map(k=>`<li><span class="kp-li-text">${inlineMd(k)}</span></li>`).join('')}</ul>`

        : emptyBox('常考题型待延伸','将在此列出选择题命题角度与综合题考查方式。')) + `</div>`;



    html += `<div class="d-block"><div class="db-t"><span class="no">04</span>关联考点<span class="hint">RELATED</span></div>` +

      (content&&content.related

        ? `<div class="rel-chips">${content.related.map(r=>`<span class="rel-chip">${esc(r)}</span>`).join('')}</div>`

        : emptyBox('关联考点待延伸','将在此列出与本章节知识相互支撑的上下游考点。')) + `</div>`;

  }



  if(isLeafNode(node)){ html += locatorPanelHtml(leafPath(node)) + practicePanelHtml(leafPath(node)); }

  /* ===== 我的学习记录（速记 + 笔记 / 导图 / 错题，均关联本节点）===== */
  const path = isLeafNode(node) ? leafPath(node) : route.path;
  const noteText = state.notes[path] || '';
  const myItems = itemsOf(path);
  html += `<div class="study-journal">
    <div class="sj-head">我的学习记录<span class="sj-hint" id="noteState">自动保存 · 登录后云同步</span></div>
    <div class="note-box sj-quick">
      <textarea id="noteInput" placeholder="速记：随手写一句话、口诀、链接（自动保存）…">${esc(noteText)}</textarea>
    </div>
    <div class="sj-actions">
      <button type="button" data-add="note" style="--kc:var(--kc-note)">＋ 笔记</button>
      <button type="button" data-add="map" style="--kc:var(--kc-map)">＋ 导图</button>
      <button type="button" data-add="mistake" style="--kc:var(--kc-mistake)">＋ 错题</button>
      <button type="button" data-add="practice" style="--kc:var(--kc-prac)">＋ 做题</button>
    </div>
    <div class="sj-list">${myItems.length ? myItems.map(journalRow).join('') : '<div class="sj-empty">还没有关联到这里的笔记 / 导图 / 错题，点上方按钮添加。</div>'}</div>
  </div>`;

  pane.innerHTML = html;

  renderMath(pane);

  /* 事件：编辑章节框架图 */

  pane.querySelectorAll('[data-edit-diagram]').forEach(el=>{

    el.addEventListener('click', ()=> openDiagramEditor(el.dataset.editDiagram));

  });



  /* 事件：掌握状态 */

  const segEl = pane.querySelector('[data-mastery]');

  if(segEl){

    segEl.addEventListener('click', ev=>{

      const btn = ev.target.closest('button[data-v]');

      if(!btn) return;

      const p = segEl.dataset.mastery;

      const v = btn.dataset.v;

      state.mastery[p] = (state.mastery[p]===v) ? '' : v;
      if(!state.mastery[p]) delete state.mastery[p];
      if(v==='mastered'){ delete state.masteryManual[p]; }
      else { state.masteryManual[p]=true; }

      saveState();

      renderTree();

      renderSidebar();

      renderDetail();

    });

  }

  /* 事件：速记即时保存 */
  const noteInput = $('#noteInput');
  if(noteInput){
    noteInput.addEventListener('input', ()=>{
      state.notes[path] = noteInput.value.trim();
      saveState();
      const ns = $('#noteState');
      if(ns) ns.textContent = '已保存';
    });
  }
  /* 事件：添加 笔记 / 导图 / 错题（默认关联本考点）*/
  pane.querySelectorAll('[data-add]').forEach(b=>b.addEventListener('click',()=>{
    const kind=b.dataset.add;
    if(kind==='note') openNoteEditor(null, path);
    else if(kind==='mistake') openMistakeEditor(null, path);
    else if(kind==='practice') openPracticeEditor(path);
    else if(kind==='map') newMap(path);
  }));
  /* 事件：本考点学习条目操作 */
  pane.querySelectorAll('[data-edit-item]').forEach(b=>b.addEventListener('click',()=>openItemById(b.dataset.editItem)));
  pane.querySelectorAll('[data-open-map]').forEach(b=>b.addEventListener('click',()=>{ location.hash='#/map/'+b.dataset.openMap; }));
  pane.querySelectorAll('[data-review]').forEach(b=>b.addEventListener('click',()=>{
    const it=getItem(b.dataset.review); if(!it) return;
    doReview(it); const r=reviewState(it);
    toast(r.code==='done' ? '已完成全部复习轮次，巩固完成' : ('复习完成 · 下次 '+REVIEW_INTERVALS[r.stage]+' 天后'));
    renderDetail(); renderSidebar();
  }));
  pane.querySelectorAll('[data-toggle-mistake]').forEach(b=>b.addEventListener('click',()=>{
    const it=getItem(b.dataset.toggleMistake); if(!it) return;
    it.status = it.status==='mastered' ? 'open' : 'mastered'; it.updated=Date.now();
    saveState(); renderDetail(); renderSidebar();
  }));
  pane.querySelectorAll('[data-del-item]').forEach(b=>b.addEventListener('click',()=>{
    bindDelConfirm(b,()=>{ deleteItem(b.dataset.delItem); saveState(); renderDetail(); renderSidebar(); toast('已删除'); });
  }));

  /* 事件：掌握条件 / 知识定位 / 做题记录 */
  pane.querySelectorAll('[data-mc-act]').forEach(el=>el.addEventListener('click',()=>{
    const act=el.dataset.mcAct;
    if(act==='locator') openLocatorEditor(path);
    else if(act==='essence'){ openNoteEditor(null,path); toast('写好后勾选「⭐核心精华」再保存'); }
    else if(act==='practice') openPracticeEditor(path);
    else if(act==='mistakes'){
      const it=state.items.find(x=>x.path===path&&x.kind==='mistake'&&x.status!=='mastered');
      if(it) openMistakeEditor(it.id,path); else toast('该考点没有待订正错题');
    }
  }));
  const _resume=pane.querySelector('[data-mc-resume]');
  if(_resume) _resume.addEventListener('click',()=>{ delete state.masteryManual[path]; saveState(); recheckMastery(path); renderTree(); renderSidebar(); renderDetail(); });
  pane.querySelectorAll('[data-add-locator]').forEach(b=>b.addEventListener('click',()=>openLocatorEditor(path)));
  pane.querySelectorAll('[data-edit-locator]').forEach(b=>b.addEventListener('click',()=>openLocatorEditor(path,b.dataset.editLocator)));
  pane.querySelectorAll('[data-del-locator]').forEach(b=>b.addEventListener('click',()=>bindDelConfirm(b,()=>{ deleteLocator(path,b.dataset.delLocator); renderTree(); renderSidebar(); })));
  pane.querySelectorAll('[data-add-practice2]').forEach(b=>b.addEventListener('click',()=>openPracticeEditor(path)));
  pane.querySelectorAll('[data-del-practice]').forEach(b=>b.addEventListener('click',()=>bindDelConfirm(b,()=>{ deletePractice(path,b.dataset.delPractice); renderTree(); renderSidebar(); })));

  /* 事件：子节点跳转 */

  pane.querySelectorAll('[data-goto]').forEach(el=>{

    el.addEventListener('click', ()=>{ location.hash = el.dataset.goto; });

  });

}

function renderOverview(){

  const heroChips = $('#heroChips');

  heroChips.innerHTML = SYLLABUS.map(s=>`<span class="chip"><i style="width:8px;height:8px;border-radius:50%;background:${s.color};display:inline-block"></i>${s.name}<b>${s.weight}</b></span>`).join('');

  $('#heroDots').innerHTML = SYLLABUS.map(s=>`<i style="background:${s.color}"></i>`).join('');



  const ov = overallStats();

  $('#statRow').innerHTML = [

    {n:SYLLABUS.length, l:'学科', sub:''},

    {n:ov.total, l:'考纲考点总数', sub:''},

    {n:ov.mastered, l:'已掌握', sub:` / ${ov.studying} 学习中`},

    {n:ov.pct+'%', l:'整体掌握进度', sub:'按考研分值加权'}

  ].map(x=>`<div class="stat-card"><div class="num">${x.n}<small>${x.sub}</small></div><div class="lbl">${x.l}</div></div>`).join('');



  $('#subGrid').innerHTML = SYLLABUS.map(s=>{

    const st = subStats(s);

    const chCount = s.chapters.length;

    return `<div class="sub-card">

      <div class="sc-head" style="--sc:${s.color}">

        <div>

          <div class="sc-title">

            <h3>${s.name}</h3>

            <span class="code" style="color:${s.color};background:${s.soft}">${s.code}</span>

          </div>

          <div class="sc-en">${s.en}</div>

        </div>

      </div>

      <div class="sc-body">

        <div class="kv"><span class="k">章节 / 考点</span><span class="v" style="color:${s.color}">${chCount} 章 · ${st.total} 个</span></div>

        <div class="kv"><span class="k">学习进度</span><span class="v">${st.mastered} 掌握 · ${st.studying} 学习中</span></div>

        <div class="pbar-row"><div class="pbar" style="flex:1"><i style="width:${st.pct}%;background:${s.color}"></i></div><span class="pct" style="color:${s.color}">${st.pct}%</span></div>

        <button class="iconbtn enter" style="--selc:${s.color}" onclick="location.hash='#/tree/${s.id}'">进入知识树

          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>

        </button>

        ${s.id==='eng'?wordEngCard():''}

      </div>

    </div>`;

  }).join('');

}



/* ============================================================

 * 渲染：侧栏 + 顶栏

 * ============================================================ */

const searchIndex = (()=>{

  const list = [];

  SYLLABUS.forEach(sub=>{

    sub.chapters.forEach((ch,ci)=>{

      list.push({path:`${sub.id}/${ci}`, name:ch.name, sub:sub, level:'章节', parents:[sub.name]});

      ch.sections.forEach((sec,si)=>{

        list.push({path:`${sub.id}/${ci}/${si}`, name:sec.name, sub:sub, level:sec.topics.length?'小节':'考点', parents:[sub.name, ch.name]});

        sec.topics.forEach((tp,ti)=>{

          list.push({path:`${sub.id}/${ci}/${si}/${ti}`, name:tp.name, sub:sub, level:'考点', parents:[sub.name, ch.name, sec.name]});

        });

      });

    });

  });

  return list;

})();

function openSearch(){

  $('#overlay').classList.add('open');

  const inp = $('#searchInput');

  inp.value = '';

  $('#searchResults').innerHTML = `<div class="sr-empty">输入关键词，检索全部学科考点与学习记录</div>`;

  inp.focus();

}

function closeSearch(){ $('#overlay').classList.remove('open'); }

function runSearch(q){

  const results = $('#searchResults');

  const kw = q.trim().toLowerCase();

  if(!kw){ results.innerHTML = `<div class="sr-empty">输入关键词，检索全部学科考点与学习记录</div>`; return; }

  const hits = searchIndex.filter(it=> it.name.toLowerCase().includes(kw) || it.parents.join(' ').toLowerCase().includes(kw));

  let html = '';

  const grouped = {};

  hits.forEach(h=>{ (grouped[h.sub.id]=grouped[h.sub.id]||[]).push(h); });

  SYLLABUS.forEach(s=>{

    if(!grouped[s.id]) return;

    html += `<div class="sr-group"><span class="gdot" style="background:${s.color}"></span>${s.name}</div>`;

    grouped[s.id].slice(0,12).forEach(h=>{

      html += `<div class="sr-row" data-goto="#/tree/${h.path}">

        <span style="color:${s.color};font-size:11px;font-family:var(--font-mono);font-weight:700">${h.level}</span>

        <span class="sr-name">${highlight(h.name, kw)}</span>

        <span class="sr-path">${esc(h.parents.join(' / '))}</span>

      </div>`;

    });

  });

  const itemHits = state.items.filter(x=> itemSearchText(x).toLowerCase().includes(kw));
  if(itemHits.length){
    html += `<div class="sr-group"><span class="gdot" style="background:#2E63A8"></span>我的学习记录</div>`;
    itemHits.slice(0,8).forEach(x=>{
      const k=ITEM_KINDS[x.kind]||ITEM_KINDS.note;
      const where = (x.path && pathInfo(x.path)) ? esc(pathInfo(x.path).sub.name+' · '+pathBreadcrumb(x.path)) : '未分类';
      html += `<div class="sr-row" data-item="${esc(x.id)}">
        <span style="color:${k.color};font-size:11px;font-family:var(--font-mono);font-weight:700">${k.label}</span>
        <span class="sr-name">${highlight(itemTitle(x), kw)}</span>
        <span class="sr-path">${where}</span>
      </div>`;
    });
  }
  if(!hits.length && !itemHits.length){ results.innerHTML = `<div class="sr-empty">未找到与「${esc(q)}」相关的考点或学习记录</div>`; return; }
  results.innerHTML = html;
  results.querySelectorAll('.sr-row').forEach(row=>{
    row.addEventListener('click', ()=>{
      if(row.dataset.item){ const it=getItem(row.dataset.item); closeSearch(); if(it){ if(it.kind==='map') location.hash='#/map/'+it.id; else openItemById(it.id); } return; }
      closeSearch();
      location.hash = row.dataset.goto;
    });
  });
}

function highlight(text, kw){

  const idx = text.toLowerCase().indexOf(kw);

  if(idx<0) return esc(text);

  return esc(text.slice(0,idx)) + '<mark>' + esc(text.slice(idx, idx+kw.length)) + '</mark>' + esc(text.slice(idx+kw.length));

}



/* ============================================================

 * 我的笔记：自由添加 / 编辑 / 删除，localStorage 持久化

 * ============================================================ */

Object.assign(globalThis, { renderSidebar, currentRoute, render, selectedPath, renderTree, freqOf, FREQ_LB, freqPill, sectionMaxFreq, sectionAggPill, isFreqSort, orderedSectionIdxs, orderedTopicIdxs, toggleFreqSort, syncFreqSortBtn, buildTreeRows, caretSvg, attachTreeEvents, scrollDetailIntoView, toggleRow, renderDetail, renderOverview, searchIndex, openSearch, closeSearch, runSearch, highlight });
export { renderSidebar, currentRoute, render, selectedPath, renderTree, freqOf, FREQ_LB, freqPill, sectionMaxFreq, sectionAggPill, isFreqSort, orderedSectionIdxs, orderedTopicIdxs, toggleFreqSort, syncFreqSortBtn, buildTreeRows, caretSvg, attachTreeEvents, scrollDetailIntoView, toggleRow, renderDetail, renderOverview, searchIndex, openSearch, closeSearch, runSearch, highlight };
