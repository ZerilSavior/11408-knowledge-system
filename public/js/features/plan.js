// 模块: plan —— 个性化学习计划排期引擎 v3（高/中/低频优先、当天自定义时长动态装箱、手动换题、政治/英语/阅读桥接、时间线渲染）

const PLAN_EXAM_DEF='2026-12-19';

const PLAN_LEAF_MINS=60;            // 新考点约 1h

const PLAN_LEARNED_MINS=30;         // 已学过章节的考点 0.5h

const PLAN_POLI_MINS=60;            // 政治每考点 1h

const PLAN_POLI_CAP_DATE='2026-10-01';  // 10月前政治≤1h，之后≤2h

const PLAN_WORD_DEF=1000;           // 每天新词（用户口径，背得快）
/* 已学过一遍的章节（ci 为 0-based），考点按 0.5h，排期与新考点穿插 */

/* 已学过一遍的章节（ci 为 0-based），考点按 0.5h，排期与新考点穿插 */
const LEARNED_CHAPTERS_DEFAULT={
  math1:[0,1,2,3,4,5], math2:[0,1,2], math3:[0],
  net:[0,1,2], ds:[0,1], co:[0,1], os:[0]
};
/* 数学 / 408 子科分组（政治单独按 cap 处理） */

/* 数学 / 408 子科分组（政治单独按 cap 处理） */
const PLAN_C408_SUBS=[['ds','hds','数据结构'],['co','hco','组成原理'],['os','hos','操作系统'],['net','hnet','计算机网络']];

const PLAN_MATH_SUBS=[['math1','mh1','高等数学'],['math2','mh2','线性代数'],['math3','mh3','概率论']];

const PLAN_POLI_SUBS=['poli1','poli2','poli3','poli4','poli5','poli6'];

const PLAN_C408_DEF={hds:1.5,hco:1.5,hos:1.5,hnet:1.5};   // 和 6，co≥1

const PLAN_MATH_DEF={mh1:4,mh2:2,mh3:2};                  // 和 8，高数≥2

function planCfg(){ return state.plan||null; }

function planTodayStr(){ const d=new Date(); return planFmt(d); }

function planFmt(d){ return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }

function planParse(s){ const a=String(s).split('-').map(Number); return new Date(a[0],a[1]-1,a[2]); }

function planAddDays(s,n){ const d=planParse(s); d.setDate(d.getDate()+n); return planFmt(d); }

function planDiff(a,b){ return Math.round((planParse(b)-planParse(a))/86400000); }

const PLAN_WD=['日','一','二','三','四','五','六'];

function planWd(s){ return '周'+PLAN_WD[planParse(s).getDay()]; }

function planTopicName(t){ return (typeof t==='string')?t:((t&&t.name)||''); }

function planLeafTitle(sub,ci,si,ti){
  const sec=sub.chapters[ci].sections[si];
  let t=sub.name+' · '+sub.chapters[ci].name+' · '+sec.name;
  if(ti!==undefined&&ti!==null&&sec.topics&&sec.topics[ti]) t+=' · '+planTopicName(sec.topics[ti]);
  return t;
}

function planDefaultLearnEnd(exam){ return planAddDays(exam||PLAN_EXAM_DEF,-37); }  // 真题月约36天

function wRoundLearned(){ return wStats().learned; }

function planWordPerDay(){ const c=planCfg(); return (c&&c.wordPerDay)||PLAN_WORD_DEF; }

function planSubH(cfg,hf,def){ const v=cfg?cfg[hf]:null; return (v==null||v===''||isNaN(+v))?def:+v; }

function learnedChapters(){ if(!state.learnedChapters) state.learnedChapters=JSON.parse(JSON.stringify(LEARNED_CHAPTERS_DEFAULT)); return state.learnedChapters; }

function isLearnedChapter(sub,ci){ return (learnedChapters()[sub]||[]).includes(ci); }

function isLearnedPath(path){ const a=path.split('/'); return isLearnedChapter(a[0],+a[1]); }

function leafMins(path,mod){ if(mod==='poli')return PLAN_POLI_MINS; if(path.indexOf('ds/8/')===0)return PLAN_LEARNED_MINS; return isLearnedPath(path)?PLAN_LEARNED_MINS:PLAN_LEAF_MINS; }

function toggleLearnedChapter(sub,ci){
  const lc=learnedChapters(); if(!lc[sub])lc[sub]=[];
  const k=lc[sub].indexOf(ci); if(k>=0)lc[sub].splice(k,1); else lc[sub].push(ci);
  saveState(); cloudSave();
  try{ renderPlan(); }catch(e){} renderTree(); renderSidebar();
  toast((k>=0?'已取消标记':'已标记')+'「'+getSubject(sub).name+'」该章节为学过（0.5h/考点）');
}

/* 政治完成判定：有该考点笔记即完成（学完整章再做题，不卡做题） */

/* 政治完成判定：有该考点笔记即完成（学完整章再做题，不卡做题） */
function planPoliNoteDone(path){ return (state.items||[]).some(it=>it.kind==='note'&&it.path===path); }

function planLeafDone(path){
  const m=state.mastery[path];
  if(m==='mastered'||m==='studying')return true;
  if(path.indexOf('poli')===0) return planPoliNoteDone(path);
  return false;
}

function planMastered(path){ return planLeafDone(path); }

function planCollect(subs,mod){
  const out=[]; let seq=0;
  subs.forEach(id=>{
    const sub=getSubject(id); if(!sub)return;
    sub.chapters.forEach((ch,ci)=>ch.sections.forEach((sec,si)=>{
      const tps=sec.topics||[];
      const push=(ti)=>{ const path=(ti===undefined||ti===null)?(id+'/'+ci+'/'+si):(id+'/'+ci+'/'+si+'/'+ti);
        const f=freqOf(path)||{};
        out.push({path,mod:mod||null,sub:id,subName:sub.name,color:sub.color,
          title:planLeafTitle(sub,ci,si,ti),lv:f.lv||0,p:(f.p||0),
          w:leafMins(path,mod),fresh:mod==='poli'?!0:!isLearnedPath(path),seq:seq++}); };
      if(tps.length===0) push(null); else tps.forEach((t,ti)=>push(ti));
    }));
  });
  return out;
}
/* 某子科：未掌握叶子按考频排序，再拆成 新/已学 两条（政治不拆） */

/* 某子科：未掌握叶子按考频排序，再拆成 新/已学 两条（政治不拆） */
function planSubQueue(sid,mod){
  let leaves=planCollect([sid],mod).filter(l=>!planLeafDone(l.path));
  leaves.sort((a,b)=>(b.lv-a.lv)||(b.p-a.p)||(a.seq-b.seq));
  return {f:leaves.filter(x=>x.fresh), l:leaves.filter(x=>!x.fresh), fp:0, lp:0};
}

function planPoliQueue(splitHot){
  const normal=planCollect(PLAN_POLI_SUBS.slice(0,5),'poli').filter(l=>!planLeafDone(l.path));
  normal.sort((a,b)=>a.seq-b.seq);
  let hot=[];
  if(splitHot) hot=planCollect(['poli6'],'poli').filter(l=>!planLeafDone(l.path)).sort((a,b)=>a.seq-b.seq);
  return {normal,hot};
}
/* 政治某天可用小时数 */

/* 政治某天可用小时数 */
function planPoliCapH(cfg,date){ let h=cfg.hPoli||1; if(date<PLAN_POLI_CAP_DATE)return Math.min(h,1); return Math.min(h,2); }

function planReadingBuildSafe(){ try{ if(typeof readingBuild==='function') return readingBuild(); }catch(e){} return null; }

function planReadingForDate(rb,date){ if(!rb||!rb.days)return 0; const d=rb.days.find(x=>x.date===date); return d?d.n:0; }

function planBuild(){
  const cfg=planCfg(); if(!cfg)return null;
  const start=cfg.start, exam=cfg.exam||PLAN_EXAM_DEF, learnEnd=cfg.learnEnd||planDefaultLearnEnd(exam);
  const examMonthStart=planAddDays(learnEnd,1);
  const Dlearn=planDiff(start,learnEnd)+1;
  const Dall=planDiff(start,planAddDays(exam,-1))+1;     // 排到考前一天
  const hEng=+(cfg.hEng||2);
  const wordPerDay=cfg.wordPerDay||PLAN_WORD_DEF;
  // 队列
  const Q={}; ['ds','co','os','net'].forEach(s=>Q[s]=planSubQueue(s,'c408'));
  ['ds','co','os','net'].forEach(s=>{ Q[s].f=Q[s].f.filter(l=>l.path.indexOf('ds/8/')!==0); Q[s].l=Q[s].l.filter(l=>l.path.indexOf('ds/8/')!==0); });
  const codeQ=planCollect(['ds'],'c408').filter(l=>l.path.indexOf('ds/8/')===0&&!planLeafDone(l.path)); let codePtr=0;
  ['math1','math2','math3'].forEach(s=>Q[s]=planSubQueue(s,'math'));
  const pq=planPoliQueue(true); let pp=0,hp=0;
  // 总量（含已掌握）
  const total408=planCollect(['ds','co','os','net'],'c408').length;
  const totalMath=planCollect(['math1','math2','math3'],'math').length;
  const totalPoli=planCollect(PLAN_POLI_SUBS,'poli').length;
  const left408=['ds','co','os','net'].reduce((a,s)=>a+Q[s].f.length+Q[s].l.length,0);
  const leftMath=['math1','math2','math3'].reduce((a,s)=>a+Q[s].f.length+Q[s].l.length,0);
  const leftPoli=pq.normal.length+pq.hot.length;
  const modFin={
    c408:{total:total408,done:total408-left408,finish:-1},
    math:{total:totalMath,done:totalMath-leftMath,finish:-1},
    poli:{total:totalPoli,done:totalPoli-leftPoli,finish:-1}
  };
  /* 单子科按分钟预算取点（新/旧交替、按指针、不跳点），返回取到的点 */
  function consume(sid,budgetMins){
    const q=Q[sid]; let used=0,turn=0; const arr=[];
    const take=(which)=>{ const arrQ=which==='f'?q.f:q.l; const p=which==='f'?q.fp:q.lp;
      if(p<arrQ.length && used+arrQ[p].w<=budgetMins+0.01){ const l=arrQ[p]; arr.push(l);
        if(which==='f')q.fp++; else q.lp++; used+=l.w; return true; } return false; };
    while(used<budgetMins-0.01){
      let took=false;
      if(turn%2===0){ if(take('f'))took=true; else if(take('l'))took=true; }
      else { if(take('l'))took=true; else if(take('f'))took=true; }
      if(!took)break; turn++;
    }
    return arr;
  }
  /* 模块级：严格按【当天】各子科时长装箱；某子科耗尽时——
     · 默认天(autoFill)：空余时间按其余未完成子科【当天时长的比例】动态分摊（不写死优先哪一科）；
     · 手动当天长(用户自定义)：完全照用户输入，不擅自转移，空余时长原样返回给 UI 提示。 */
  function consumeModule(group,dc,DEF,autoFill){
    const bud={}; group.forEach(([sid,hf])=>{ bud[sid]=planSubH(dc,hf,DEF[hf])*60; });
    const budget=group.reduce((a,[,hf])=>a+planSubH(dc,hf,DEF[hf])*60,0);
    let arr=[],total=0;
    group.forEach(([sid])=>{ const got=consume(sid,bud[sid]); arr=arr.concat(got); total+=got.reduce((a,l)=>a+l.w,0); });
    let remain=budget-total;
    const hasLeft={}; group.forEach(([sid])=>{ const q=Q[sid]; hasLeft[sid]=q.fp<q.f.length||q.lp<q.l.length; });
    if(autoFill && remain>=PLAN_LEARNED_MINS-0.01){
      const elig=group.filter(([sid])=>hasLeft[sid]&&bud[sid]>0.01).map(([sid])=>sid);
      const wsum=elig.reduce((a,sid)=>a+bud[sid],0);
      if(wsum>0){
        elig.forEach(sid=>{ const got=consume(sid,remain*bud[sid]/wsum); arr=arr.concat(got); const u=got.reduce((a,l)=>a+l.w,0); total+=u; remain-=u; });
        const order=elig.slice().sort((a,b)=>bud[b]-bud[a]); let guard=0;
        while(remain>=PLAN_LEARNED_MINS-0.01 && guard<500){ let progressed=false;
          for(const sid of order){ const q=Q[sid]; let l=null,wh=null;
            if(q.fp<q.f.length&&q.f[q.fp].w<=remain+.01){ l=q.f[q.fp];wh='f'; }
            else if(q.lp<q.l.length&&q.l[q.lp].w<=remain+.01){ l=q.l[q.lp];wh='l'; }
            if(l){ arr.push(l); if(wh==='f')q.fp++; else q.lp++; total+=l.w; remain-=l.w; progressed=true; } }
          if(!progressed)break; guard++;
        }
      }
    }
    return {arr,total,leftover:Math.max(0,Math.round(remain))};
  }
  const rb=planReadingBuildSafe();
  const wordRoundDone=wRoundLearned();
  let wordScheduled=0;
  const days=[];
  const dayOv=()=>{ if(!state.planDay)state.planDay={}; return state.planDay; };
  for(let idx=0;idx<Math.max(Dall,1);idx++){
    const date=planAddDays(start,idx);
    const leaves=[]; const mins={c408:0,math:0,poli:0}; const leftover={c408:0,math:0};
    const ov=dayOv()[idx];                       // 当天自定义时长（可只覆盖部分字段）
    const dc=Object.assign({},cfg,ov||{});
    const autoFill=!ov;                          // 手动天严格照用户输入，不自动转移
    if(idx<Dlearn){
      const cm=consumeModule(PLAN_C408_SUBS,dc,PLAN_C408_DEF,autoFill); leaves.push(...cm.arr); mins.c408=cm.total; leftover.c408=cm.leftover;
      const mm=consumeModule(PLAN_MATH_SUBS,dc,PLAN_MATH_DEF,autoFill); leaves.push(...mm.arr); mins.math=mm.total; leftover.math=mm.leftover;
      // 每日一题：代码题预测50题，每天1道，0.5h（额外任务，不占用配额）
      if(codePtr<codeQ.length){ const cl=codeQ[codePtr++]; cl.w=PLAN_LEARNED_MINS; leaves.push(cl); mins.c408+=cl.w; }
    }
    // 政治：全程排，普通1-5顺序，时政只在真题月
    const cap=planPoliCapH(cfg,date), pBudget=cap*60; let pUsed=0;
    while(pp<pq.normal.length && pUsed+PLAN_POLI_MINS<=pBudget+0.01){ leaves.push(pq.normal[pp]); mins.poli+=PLAN_POLI_MINS; pUsed+=PLAN_POLI_MINS; pp++; }
    if(pp>=pq.normal.length && date>=examMonthStart){
      while(hp<pq.hot.length && pUsed+PLAN_POLI_MINS<=pBudget+0.01){ leaves.push(pq.hot[hp]); mins.poli+=PLAN_POLI_MINS; pUsed+=PLAN_POLI_MINS; hp++; }
    }
    if(idx===Dlearn-1){} // 记录完成在下面统一判断
    // 英语
    let wordNew=0,readN=0;
    const remainWords=Math.max(0,WORDS.length-wordRoundDone-wordScheduled);
    if(remainWords>0){ wordNew=Math.min(wordPerDay,remainWords); wordScheduled+=wordNew; }
    else readN=planReadingForDate(rb,date);
    days.push({idx,date,weekday:planWd(date),leaves,mins,leftover,wordNew,readN,custom:!!ov});
  }
  // finish 判定：找到各模块最后一个叶子被排入的日期
  const lastIdxOf=mod=>{ let li=-1; days.forEach(d=>d.leaves.forEach(l=>{ if(l.mod===mod)li=d.idx; })); return li; };
  modFin.c408.finish=left408? (lastIdxOf('c408')<0?Dlearn:lastIdxOf('c408')) : 0;
  modFin.math.finish=leftMath? (lastIdxOf('math')<0?Dlearn:lastIdxOf('math')) : 0;
  modFin.poli.finish=leftPoli? (lastIdxOf('poli')<0?Dall:lastIdxOf('poli')) : 0;
  planApplyOverrides(days);
  const wordDays=Math.ceil((WORDS.length-wordRoundDone)/wordPerDay);
  const wordFinishDate=planAddDays(start,wordDays-1);
  const warnings=[];
  modFin.c408.feasible=modFin.c408.finish<Dlearn; if(!modFin.c408.feasible)warnings.push('c408');
  modFin.math.feasible=modFin.math.finish<Dlearn; if(!modFin.math.feasible)warnings.push('math');
  modFin.poli.feasible=modFin.poli.finish<Dall; if(!modFin.poli.feasible)warnings.push('poli');
  const examLeft=planDiff(planTodayStr(),exam);
  const totalLeaves=total408+totalMath+totalPoli;
  const done=modFin.c408.done+modFin.math.done+modFin.poli.done;
  const allocArr=[
    {name:'408',color:'#1a9e6e',total:total408,done:modFin.c408.done},
    {name:'数一',color:'#7b53d6',total:totalMath,done:modFin.math.done},
    {name:'政治',color:'#c0392b',total:totalPoli,done:modFin.poli.done}
  ];
  const h408=PLAN_C408_SUBS.reduce((a,[,hf])=>a+planSubH(cfg,hf,PLAN_C408_DEF[hf]),0);
  const hMath=PLAN_MATH_SUBS.reduce((a,[,hf])=>a+planSubH(cfg,hf,PLAN_MATH_DEF[hf]),0);
  return {cfg,days,D:Dlearn,Dall,start,learnEnd,examMonthStart,exam,h408,hMath,hEng,hPoli:cfg.hPoli||1,
    wordPerDay,wordFinishDate,wordDays,modFin,warnings,rb,examLeft,allocArr,done,total:totalLeaves,finishDate:learnEnd};
}

function planTodayIndex(b){
  const d=planDiff(b.start,planTodayStr());
  if(d<0)return {idx:0,status:'before'};
  if(d>=b.days.length)return {idx:b.days.length-1,status:'after'};
  return {idx:d,status:d>=b.D?'exammonth':'today'};
}

/* 今日任务锁定：当天清单首次生成即固定，勾完即完成，不再因掌握而从后续天补新题（未来天仍滚动） */
function planTodayLockKey(b,day){
  const ov=(state.planDay&&state.planDay[day.idx])||null, c=b.cfg;
  return [day.date,ov?JSON.stringify(ov):'def',c.start,c.exam,c.learnEnd,
    c.hds,c.hco,c.hos,c.hnet,c.mh1,c.mh2,c.mh3,c.hPoli,c.wordPerDay].join('|');
}
function planEnsureTodayLock(b,day){
  if(!day||day.date!==planTodayStr())return day;
  if(!state.planTodayLock)state.planTodayLock={};
  const L=state.planTodayLock, key=planTodayLockKey(b,day), index=planLeafIndex();
  let changed=false;
  if(!L||L.date!==day.date||L.key!==key||!Array.isArray(L.paths)){
    const base=day.leaves.map(l=>l.path);
    let keep=[];
    if(L.date===day.date&&Array.isArray(L.paths))keep=L.paths.filter(p=>planLeafDone(p)&&base.indexOf(p)<0);
    L.date=day.date; L.key=key; L.paths=keep.concat(base); changed=true;
  }
  const seen={}, leaves=[];
  L.paths.forEach(p=>{ if(seen[p])return; seen[p]=1; const m=index[p]; if(m)leaves.push(Object.assign({},m)); });
  day.leaves=leaves;
  day.mins={c408:0,math:0,poli:0};
  leaves.forEach(l=>{ if(day.mins[l.mod]!=null)day.mins[l.mod]+=l.w; });
  if(changed){ try{ saveState(); cloudSave(); }catch(e){} }
  return day;
}
/* 取今天（锁定后）：渲染/侧栏/横幅统一走这里，保证今日清单不随掌握状态滚动补题 */
function planToday(b){ const ti=planTodayIndex(b); return {ti,day:planEnsureTodayLock(b,b.days[ti.idx])}; }

/* ---------- 手动换题（同模块 · 同时长 · 同级考频 · 1换1 · 过去锁定） ---------- */

/* ---------- 手动换题（同模块 · 同时长 · 同级考频 · 1换1 · 过去锁定） ---------- */
function planOverrides(){ if(!state.planOverrides) state.planOverrides={}; return state.planOverrides; }

function planLeafIndex(){
  const idx={};
  const add=(subs,mod)=>planCollect(subs,mod).forEach(l=>{ l.mod=mod; idx[l.path]=l; });
  add(['ds','co','os','net'],'c408'); add(['math1','math2','math3'],'math'); add(PLAN_POLI_SUBS,'poli');
  return idx;
}

function planApplyOverrides(days){
  const ov=state.planOverrides||{}; const index=planLeafIndex();
  const pos={}; days.forEach((d,di)=>d.leaves.forEach((l,li)=>{pos[l.path]={di,li};}));
  days.forEach(d=>{
    const list=ov[d.date]; if(!list||!list.swaps)return;
    list.swaps.forEach(sp=>{
      const cur=pos[sp.from]; if(!cur||cur.di!==d.idx)return;
      if((planLeafDone(sp.to)&&state.mastery[sp.to]!=='unlearned')||!index[sp.to])return;
      const nl=Object.assign({},index[sp.to]);
      const other=pos[sp.to];
      if(other&&other.di!==d.idx){
        const nf=Object.assign({},index[sp.from]);
        days[other.di].leaves[other.li]=nf; pos[sp.from]={di:other.di,li:other.li};
      } else delete pos[sp.from];
      days[d.idx].leaves[cur.li]=nl; pos[sp.to]={di:d.idx,li:cur.li};
    });
  });
  const mo={c408:0,math:1,poli:2};
  days.forEach(d=>d.leaves.sort((a,b)=>(mo[a.mod]-mo[b.mod])||(b.lv-a.lv)||(b.p-a.p)||(a.seq-b.seq)));
}

function planSubOrder(mod){
  if(mod==='c408') return ['ds','co','os','net'];
  if(mod==='math') return ['math1','math2','math3'];
  if(mod==='poli') return PLAN_POLI_SUBS.slice();
  return [];
}
function planSwapCandidates(date,fromPath){
  const b=planBuild(),index=planLeafIndex(); const from=index[fromPath]; if(!from)return [];
  const today=planTodayStr(); const pos={}; b.days.forEach(d=>d.leaves.forEach(l=>{pos[l.path]=d.date;}));
  const lockNow=(date===today&&state.planTodayLock&&state.planTodayLock.date===date)?state.planTodayLock.paths:null;
  const out=[];
  Object.keys(index).forEach(p=>{
    if(p===fromPath)return; const l=index[p];
    if(l.mod!==from.mod)return;
    if(planLeafDone(p)&&state.mastery[p]!=='unlearned')return;
    if(l.w!==from.w)return;                 // 时长守恒（0.5h↔0.5h、1h↔1h）
    if(l.mod!=='poli'&&(l.lv||0)<(from.lv||0)&&((from.lv||0)-(l.lv||0))>1)return;  // 往低换限≤1级，往高换不限
    const pd=pos[p];
    if(pd===date)return; if(pd&&pd<today)return; if(pd&&pd<date)return;
    if(lockNow&&lockNow.indexOf(p)>=0)return;
    l._date=pd||''; out.push(l);
  });
  const subOrder=planSubOrder(from.mod);
  out.sort((a,c)=>{
    const sa=subOrder.indexOf(a.sub),sc=subOrder.indexOf(c.sub);
    if(sa!==sc)return sa-sc;
    return (a.seq||0)-(c.seq||0);
  });
  return out;
}

function planSwapOverlayEl(){
  let el=document.getElementById('planSwapOverlay');
  if(!el){ el=document.createElement('div'); el.id='planSwapOverlay'; el.className='overlay';
    el.addEventListener('click',ev=>{ if(ev.target===el)planCloseSwap(); }); document.body.appendChild(el); }
  return el;
}

function planCloseSwap(){ const el=document.getElementById('planSwapOverlay'); if(el)el.classList.remove('open'); }

function planShowSwap(inner){ const el=planSwapOverlayEl();
  el.innerHTML='<div class="dlg"><div class="dlg-t"><span>替换考点 · 同模块 / 同时长 / 低换限一级 / 1换1</span><button class="dlg-x" onclick="planCloseSwap()">×</button></div><div class="dlg-b">'+inner+'</div></div>';
  el.classList.add('open');
}

function planSwap(date,fromPath,toPath){
  if(state.planTodayLock&&state.planTodayLock.date===date&&Array.isArray(state.planTodayLock.paths)&&state.planTodayLock.paths.indexOf(fromPath)>=0){
    if(state.planTodayLock.paths.indexOf(toPath)<0)state.planTodayLock.paths=state.planTodayLock.paths.map(p=>p===fromPath?toPath:p);
    saveState(); cloudSave(); planCloseSwap(); renderPlan(); renderSidebar(); return;
  }
  const ov=planOverrides(); if(!ov[date])ov[date]={swaps:[]};
  ov[date].swaps=ov[date].swaps.filter(sp=>sp.from!==fromPath);
  ov[date].swaps.push({from:fromPath,to:toPath});
  saveState(); cloudSave(); planCloseSwap(); renderPlan(); renderSidebar();
}

function planUndoSwap(date,fromPath){
  const ov=planOverrides(); if(ov[date]&&ov[date].swaps)ov[date].swaps=ov[date].swaps.filter(sp=>sp.from!==fromPath);
  saveState(); cloudSave(); planCloseSwap(); renderPlan(); renderSidebar();
}

function planOpenSwap(date,path){
  const index=planLeafIndex(),from=index[path],cands=planSwapCandidates(date,path);
  if(planDiff(planTodayStr(),date)<0){ toast('过去日期的任务已锁定，不能调整'); return; }
  const subOrder=planSubOrder(from.mod);
  const groups={}; cands.forEach(l=>{ (groups[l.sub]=groups[l.sub]||[]).push(l); });
  let rows='';
  subOrder.forEach(sid=>{
    const gs=groups[sid]; if(!gs||!gs.length)return;
    rows+='<div class="p-subgrp">'+esc(gs[0].subName)+' · '+gs.length+'</div>';
    gs.forEach(l=>{
      rows+='<button class="p-swopt" onclick="planSwap(\''+date+'\',\''+path+'\',\''+l.path+'\')">'
        +freqPill(l.path)+'<span class="p-ti">'+esc(l.title)+'</span>'
        +'<span class="p-swsub">'+(l.w===30?'0.5h':'1h')+(l._date?' · '+l._date.slice(5):' · 未排')+'</span></button>';
    });
  });
  if(!rows)rows='<div class="sub" style="padding:10px">没有符合条件的同级考点可换（同模块、时长相同、考频接近、未掌握、未排入计划）。</div>';
  const ov=planOverrides()[date]; const swapped=ov&&ov.swaps?ov.swaps.find(sp=>sp.from===path):null;
  const inner='<div class="sub" style="margin:0 0 12px">原任务：<b>'+esc(from.title)+'</b>（'+from.subName+'，'+(from.w===30?'0.5h':'1h')+'）。只列同学科模块、时长相同、未掌握且未排入的考点；往低考频换不超过一级，往高考频换不限。替换前后当天数量与总时长不变。</div>'
    +(swapped?'<button class="p-btn" style="margin-bottom:10px" onclick="planUndoSwap(\''+date+'\',\''+path+'\')">撤销这次替换</button>':'')
    +'<div class="p-swlist">'+rows+'</div><button class="p-more" style="margin-top:12px" onclick="planCloseSwap()">取消</button>';
  planShowSwap(inner);
}

/* ---------- 当天子科时长自定义（任意小时 / 0.5 步进，只影响当天） ---------- */

/* ---------- 当天子科时长自定义（任意小时 / 0.5 步进，只影响当天） ---------- */
function planDayOverlayEl(){
  let el=document.getElementById('planDayOverlay');
  if(!el){ el=document.createElement('div'); el.id='planDayOverlay'; el.className='overlay';
    el.addEventListener('click',ev=>{ if(ev.target===el)planCloseDay(); }); document.body.appendChild(el); }
  return el;
}

function planCloseDay(){ const el=document.getElementById('planDayOverlay'); if(el)el.classList.remove('open'); }

function planEditDay(idx){
  const b=planBuild(); if(!b){ toast('请先生成学习计划'); return; }
  const d=b.days[idx]; if(!d)return;
  if(planDiff(planTodayStr(),d.date)<0){ toast('过去日期的任务已锁定，不能调整'); return; }
  if(idx>=b.D){ toast('真题月以套卷为主，不再按子科排新学'); return; }
  const ov=(state.planDay&&state.planDay[idx])||{};
  const val=(hf,def)=>{ if(ov[hf]!=null)return +(+ov[hf]).toFixed(1); return +planSubH(b.cfg,hf,def).toFixed(1); };
  const field=(hf,nm,def,max)=>'<label>'+nm+'<input id="pd_'+hf+'" type="number" min="0" max="'+max+'" step="0.5" value="'+val(hf,def)+'"></label>';
  const g408='<div class="p-subset"><b>408 四子科（合计 ≥ 6h，组成原理 ≥ 1h）</b><div class="p-form">'
    +field('hds','数据结构',PLAN_C408_DEF.hds,10)+field('hco','组成原理',PLAN_C408_DEF.hco,10)
    +field('hos','操作系统',PLAN_C408_DEF.hos,10)+field('hnet','计算机网络',PLAN_C408_DEF.hnet,10)+'</div></div>';
  const gm='<div class="p-subset"><b>数学三子科（合计 ≥ 8h，高数 ≥ 2h）· 可填 3.5 等任意值</b><div class="p-form">'
    +field('mh1','高等数学',PLAN_MATH_DEF.mh1,14)+field('mh2','线性代数',PLAN_MATH_DEF.mh2,10)+field('mh3','概率论',PLAN_MATH_DEF.mh3,10)+'</div></div>';
  const inner='<div class="sub" style="margin:0 0 10px;line-height:1.7">只改 <b>'+d.date+'（'+d.weekday+'）</b> 这一天。引擎严格按你给的各科时长分配当天任务（例如高数2 / 线代4 / 概统2），<b>不会擅自把时间转给别的科</b>；某科已学完空余出的时间会在当天任务里提示，由你决定补到哪科。其他天仍按默认模板。</div>'
    +g408+gm
    +'<div class="p-form"><button class="p-btn" onclick="planSaveDay('+idx+')">保存当天时长</button>'
    +(Object.keys(ov).length?'<button class="p-more" onclick="planResetDay('+idx+')">恢复默认模板</button>':'')
    +'<button class="p-more" onclick="planCloseDay()">取消</button></div>';
  const el=planDayOverlayEl();
  el.innerHTML='<div class="dlg"><div class="dlg-t"><span>调整 '+d.date.slice(5)+' 当天各科时长</span><button class="dlg-x" onclick="planCloseDay()">×</button></div><div class="dlg-b">'+inner+'</div></div>';
  el.classList.add('open');
}

function planSaveDay(idx){
  const get=hf=>{ const el=document.getElementById('pd_'+hf); const v=parseFloat(el?el.value:''); return isNaN(v)?0:Math.max(0,v); };
  const hds=get('hds'),hco=get('hco'),hos=get('hos'),hnet=get('hnet'),mh1=get('mh1'),mh2=get('mh2'),mh3=get('mh3');
  const s408=hds+hco+hos+hnet, sMath=mh1+mh2+mh3;
  if(s408<6-1e-6){ toast('当天 408 合计需 ≥ 6h（当前 '+s408.toFixed(1)+'h）'); return; }
  if(hco<1-1e-6){ toast('当天组成原理需 ≥ 1h'); return; }
  if(sMath<8-1e-6){ toast('当天数学合计需 ≥ 8h（当前 '+sMath.toFixed(1)+'h）'); return; }
  if(mh1<2-1e-6){ toast('当天高等数学需 ≥ 2h'); return; }
  if(!state.planDay)state.planDay={};
  state.planDay[idx]={hds:+hds.toFixed(1),hco:+hco.toFixed(1),hos:+hos.toFixed(1),hnet:+hnet.toFixed(1),mh1:+mh1.toFixed(1),mh2:+mh2.toFixed(1),mh3:+mh3.toFixed(1)};
  saveState(); cloudSave(); planCloseDay(); renderPlan(); renderSidebar();
  toast('当天时长已按你的分配更新');
}

function planResetDay(idx){ if(state.planDay){ delete state.planDay[idx]; saveState(); cloudSave(); } planCloseDay(); renderPlan(); toast('已恢复默认模板'); }

/* ---------- 设置表单 ---------- */

/* ---------- 设置表单 ---------- */
function planSetupHTML(forceOpen){
  const c=planCfg()||{};
  const start=c.start||planTodayStr(), exam=c.exam||PLAN_EXAM_DEF, learnEnd=c.learnEnd||planDefaultLearnEnd(exam);
  const hEng=c.hEng!=null?c.hEng:2, hPoli=c.hPoli!=null?c.hPoli:1;
  const wpd=c.wordPerDay||PLAN_WORD_DEF;
  const rStart=c.readStart||'', rEnd=c.readEnd||exam;
  const num=(v,d)=>((v==null||v===''||isNaN(v))?d:v);
  const hds=num(c.hds,PLAN_C408_DEF.hds),hco=num(c.hco,PLAN_C408_DEF.hco),hos=num(c.hos,PLAN_C408_DEF.hos),hnet=num(c.hnet,PLAN_C408_DEF.hnet);
  const mh1=num(c.mh1,PLAN_MATH_DEF.mh1),mh2=num(c.mh2,PLAN_MATH_DEF.mh2),mh3=num(c.mh3,PLAN_MATH_DEF.mh3);
  const btn=planCfg()?'更新学习计划':'生成我的学习计划';
  const inp=(id,label,val,max,step)=>'<label>'+label+'<input id="'+id+'" type="number" min="0" max="'+max+'" step="'+(step||0.5)+'" value="'+val+'"></label>';
  return '<details class="p-set"'+(forceOpen?' open':'')+'><summary>'+(planCfg()?'调整每日子科时长 / 日期':'① 设置每日学习参数')+'</summary>'
   +'<div class="p-form">'
   +'<label>开始日期<input id="pStart" type="date" value="'+start+'"></label>'
   +'<label>考研日期<input id="pExam" type="date" value="'+exam+'"></label>'
   +'<label>新学截止日（次日进入真题月）<input id="pLearnEnd" type="date" value="'+learnEnd+'"></label>'
   +'</div>'
   +'<div class="p-subset"><b>408 四子科每日小时（合计 ≥ 6，组成原理 ≥ 1）</b><div class="p-form">'
   +inp('pHds','数据结构',hds,8)+inp('pHco','组成原理',hco,8)+inp('pHos','操作系统',hos,8)+inp('pHnet','计算机网络',hnet,8)
   +'</div></div>'
   +'<div class="p-subset"><b>数一 三子科每日小时（合计 ≥ 8，高等数学 ≥ 2）</b><div class="p-form">'
   +inp('pMh1','高等数学',mh1,12)+inp('pMh2','线性代数',mh2,8)+inp('pMh3','概率论',mh3,8)
   +'</div></div>'
   +'<div class="p-form">'
   +inp('pHEng','英语 每天小时',hEng,6)
   +inp('pHPoli','政治 每天小时（10月前≤1，其后≤2）',hPoli,2)
   +inp('pWpd','每天新词数',wpd,1200,50)
   +'<label>阅读开始日（留空=单词一轮次日）<input id="pReadStart" type="date" value="'+rStart+'"></label>'
   +'<label>阅读目标完成日<input id="pReadEnd" type="date" value="'+rEnd+'"></label>'
   +'<button class="p-btn" onclick="planSave()">'+btn+'</button>'
   +'</div>'
   +(forceOpen?'<div class="sub" style="margin-top:12px;color:var(--ink-3);font-size:12.5px;line-height:1.7">已学过章节（高数1-6、线代1-3、概统1、网络1-3、数据结构1-2、计组1-2、操作系统1）按 <b>0.5h/考点</b>，并与新考点<b>新旧穿插</b>，可在知识树章节标题切换。408/数一严格按真题考频<b>高频→中频→低频</b>；政治有<b>本章笔记</b>即算完成、时政放在真题月、可排到考前一天；英语单词一轮前只背词，一轮后转阅读。考点可用「⇄」换同时长同级题。</div>':'')
   +'</details>';
}

function planSave(){
  const g=id=>document.getElementById(id); const numv=(id,d)=>{ const v=parseFloat(g(id).value); return isNaN(v)?d:v; };
  const start=g('pStart').value||planTodayStr();
  const exam=g('pExam').value||PLAN_EXAM_DEF;
  const learnEnd=g('pLearnEnd').value||planDefaultLearnEnd(exam);
  const hds=numv('pHds',PLAN_C408_DEF.hds),hco=numv('pHco',PLAN_C408_DEF.hco),hos=numv('pHos',PLAN_C408_DEF.hos),hnet=numv('pHnet',PLAN_C408_DEF.hnet);
  const mh1=numv('pMh1',PLAN_MATH_DEF.mh1),mh2=numv('pMh2',PLAN_MATH_DEF.mh2),mh3=numv('pMh3',PLAN_MATH_DEF.mh3);
  const hEng=Math.max(0,Math.min(6,numv('pHEng',2)));
  const hPoli=Math.max(0,Math.min(2,numv('pHPoli',1)));
  const s408=hds+hco+hos+hnet, sMath=mh1+mh2+mh3;
  if(s408<6-1e-6){ toast('408 四子科每天合计需 ≥ 6 小时（当前 '+s408.toFixed(1)+'h）'); return; }
  if(hco<1-1e-6){ toast('组成原理每天需 ≥ 1 小时'); return; }
  if(sMath<8-1e-6){ toast('数学三子科每天合计需 ≥ 8 小时（当前 '+sMath.toFixed(1)+'h）'); return; }
  if(mh1<2-1e-6){ toast('高等数学每天需 ≥ 2 小时'); return; }
  const wordPerDay=Math.max(20,Math.min(1200,parseInt(g('pWpd').value)||PLAN_WORD_DEF));
  let readStart=g('pReadStart').value||'';
  const readEnd=g('pReadEnd').value||exam;
  if(!readStart) readStart=planAddDays(start,Math.ceil((WORDS.length-wRoundLearned())/wordPerDay));
  state.plan={v:3,start,exam,learnEnd,hds,hco,hos,hnet,mh1,mh2,mh3,hEng,hPoli,wordPerDay,readStart,readEnd};
  if(typeof ensureReading==='function'){ ensureReading(); state.reading.start=readStart; state.reading.end=readEnd; }
  saveState(); pShowAll=false; cloudSave(); renderPlan(); renderSidebar();
  toast('学习计划已更新');
}

let pShowAll=false;

/* ---------- 渲染 ---------- */

/* ---------- 渲染 ---------- */
function planLeafRow(l,date){
  const done=planLeafDone(l.path);
  const past=planDiff(planTodayStr(),date)<0;
  const swap=(past||done)?'':'<button class="p-swap" title="同时长同级换题" onclick="planOpenSwap(\''+date+'\',\''+l.path+'\')">⇄</button>';
  const isHalf=l.w===PLAN_LEARNED_MINS;
  const dur='<span class="p-dur '+(isHalf?'half':'full')+'" title="'+(isHalf?'0.5h':'1h')+'">'+(isHalf?'½':'1h')+'</span>';
  const polinote=(l.mod==='poli'&&planPoliNoteDone(l.path)&&state.mastery[l.path]!=='mastered')?'<span class="p-half" style="background:#fdecea;color:#c0392b" title="已有本章笔记">记</span>':'';
  return '<div class="p-leaf'+(done?' done':'')+'" data-p="'+l.path+'">'
    +'<input type="checkbox" class="p-cb" '+(done?'checked':'')+' onclick="planToggleLeaf(\''+l.path+'\')">'
    +'<span class="p-lt">'+freqPill(l.path)+dur+polinote+'<span class="p-ti">'+esc(l.title)+'</span></span>'
    +swap+'<button class="p-go" onclick="location.hash=\'#/tree/'+l.path+'\'">考点 ›</button></div>';
}

function planGroupLeaves(day){
  let html=''; const order=['c408','math','poli']; const names={c408:'408',math:'数一',poli:'政治'}; const colors={c408:'#1a9e6e',math:'#7b53d6',poli:'#c0392b'};
  order.forEach(mk=>{
    const ls=day.leaves.filter(l=>l.mod===mk); if(!ls.length)return;
    const gDone=ls.filter(l=>planLeafDone(l.path)).length;
    html+='<div class="p-grp"><span class="p-dot" style="background:'+colors[mk]+'"></span>'+names[mk]+' · '+ls.length+'个 · '+(ls.reduce((a,l)=>a+l.w,0)/60).toFixed(1)+'h'+(gDone===ls.length?' <b style="color:var(--kc-done)">✓ 已完成</b>':' · '+gDone+'/'+ls.length)+'</div>';
    const lo=(day.leftover&&day.leftover[mk])||0;
    if(lo>=30&&day.custom) html+='<div class="p-leftover">⚠ 有子科已学完，空余 '+(lo/60).toFixed(1)+'h 未安排（按你今天设定的时长，引擎不擅自转给他科）；点「今日各科时长」把它补到未完成科目。</div>';
    const subGroups={}; ls.forEach(l=>{ (subGroups[l.sub]=subGroups[l.sub]||[]).push(l); });
    planSubOrder(mk).forEach(sid=>{
      const gs=subGroups[sid]; if(!gs||!gs.length)return;
      const gh=gs.reduce((a,l)=>a+l.w,0)/60;
      html+='<div class="p-subgrp">'+esc(gs[0].subName)+' · '+gs.length+'个 · '+gh.toFixed(1)+'h</div>';
      gs.forEach(l=>{ html+=planLeafRow(l,day.date); });
    });
  });
  return html;
}

function planToggleLeaf(path){
  if(state.mastery[path]==='mastered'){ toast('已掌握由四项条件自动判定，不能在此取消'); return; }
  if(state.mastery[path]==='studying') delete state.mastery[path]; else state.mastery[path]='studying';
  saveState(); cloudSave(); planRefreshCounts(); renderSidebar();
}

function planRefreshCounts(){
  const b=planBuild(); if(!b)return; const {ti,day}=planToday(b); if(!day)return;
  const td=day.leaves.filter(l=>planLeafDone(l.path)).length;
  const tel=document.getElementById('pTodayProg'); if(tel)tel.textContent=td+' / '+day.leaves.length+' 完成';
  const tb=document.getElementById('pTodayBar'); if(tb)tb.style.width=(day.leaves.length?Math.round(100*td/day.leaves.length):0)+'%';
  const oe=document.getElementById('pOvProg'); if(oe)oe.textContent='计划完成 '+b.done+' / '+b.total;
  const ob=document.getElementById('pOvBar'); if(ob)ob.style.width=(b.total?Math.round(100*b.done/b.total):0)+'%';
}

function planEngLine(d){ if(d.wordNew>0)return '新词 '+d.wordNew; if(d.readN>0)return '阅读 '+d.readN+' 篇'; return '复习/巩固'; }

function planTimelineHTML(b,startIdx){
  const max=b.days.length-startIdx,n=pShowAll?max:Math.min(7,max); let h='';
  const todayIdx=planTodayIndex(b).idx;
  for(let k=0;k<n;k++){ const d=b.days[startIdx+k]; if(!d)break;
    const mods=['c408','math','poli'].filter(mk=>d.leaves.some(l=>l.mod===mk)).map(mk=>({c408:'408',math:'数一',poli:'政治'}[mk]));
    const dn=d.leaves.filter(l=>planLeafDone(l.path)).length;
    const hrs=((d.mins.c408+d.mins.math+d.mins.poli)/60+b.hEng).toFixed(1);
    const now=(startIdx+k===planTodayIndex(b).idx);
    const inExam=startIdx+k>=b.D;
    const editBtn=(d.idx>=todayIdx&&d.idx<b.D)?'<button class="p-dayedit" title="自定义当天各科时长" onclick="planEditDay('+d.idx+')">时长</button>':'';
    h+='<div class="p-tl'+(now?' now':'')+(d.custom?' custom':'')+'"><div class="p-tl-d"><b>'+d.date.slice(5)+(d.custom?' <span class="p-custag">自</span>':'')+'</b><span>'+d.weekday+(inExam?' · 真题月':' · 第'+(d.idx+1)+'天')+'</span></div>'
      +'<div class="p-tl-m"><div class="p-tl-s">'+mods.map(s=>'<span>'+s+'</span>').join('')+'<span style="background:var(--net)">英</span></div>'
      +'<div class="p-tl-meta">'+d.leaves.length+' 考点 · 约 '+hrs+'h · 英语：'+planEngLine(d)+(dn?' · 完成 '+dn:'')+'</div>'+editBtn+'</div></div>';
  }
  return h;
}

function planGoWords(){ location.hash='#/words'; setTimeout(()=>{ try{ wStart(); }catch(e){} },90); }

function planModAlerts(b){
  const names={c408:'408',math:'数一',poli:'政治'}; let h='';
  if(!b.modFin.c408.feasible) h+='<div class="p-alert bad"><b>408排不完：</b>新学窗口内还有 '+(b.modFin.c408.total-b.modFin.c408.done)+' 个考点排不到 '+b.learnEnd+'，请增加408子科每日小时或延后新学截止日。</div>';
  if(!b.modFin.math.feasible) h+='<div class="p-alert bad"><b>数一排不完：</b>新学窗口内还有 '+(b.modFin.math.total-b.modFin.math.done)+' 个考点排不到 '+b.learnEnd+'，请增加数学子科每日小时（高数≥2）或延后截止日。</div>';
  if(!b.modFin.poli.feasible) h+='<div class="p-alert bad"><b>政治排不完：</b>到考前一天还有政治考点未排，请提高政治每日小时。</div>';
  if(b.rb&&b.rb.feasible===false) h+='<div class="p-alert bad"><b>阅读排不完：</b>'+b.rb.total+' 篇每天最多4篇需 '+b.rb.needDays+' 天，当前窗口仅 '+b.rb.availDays+' 天，请提高新词数尽早结束单词一轮或后移目标日。</div>';
  if(!h) h='<div class="p-alert ok"><b>计划可行：</b>新学窗口 '+b.D+' 天（'+b.start+' → '+b.learnEnd+'），其后约 '+planDiff(b.learnEnd,b.exam)+' 天真题月（政治时政在此阶段）。单词一轮约 '+b.wordDays+' 天（'+b.wordFinishDate+' 完成），随后转阅读打卡，目标 '+b.cfg.readEnd+'。政治有本章笔记即完成、可排到考前一天。</div>';
  return h;
}

function renderPlan(){
  const app=$('#planApp'); if(!app)return;
  if(!planCfg()){ app.innerHTML=planSetupHTML(true); return; }
  const b=planBuild(),{ti,day}=planToday(b);
  const ovPct=b.total?Math.round(100*b.done/b.total):0;
  const td=day?day.leaves.filter(l=>planLeafDone(l.path)).length:0;
  const tpct=day&&day.leaves.length?Math.round(100*td/day.leaves.length):0;
  const wordDue=wDueIdxs().length, wordDone=(typeof wNewLearnedToday==='function'?wNewLearnedToday():0), wordLeft=(typeof wNewRemain==='function'?wNewIdxs(wNewRemain()).length:wNewIdxs(b.wordPerDay).length);
  const dueN=dueItems().length;
  const engPhase=(wRoundLearned()>=WORDS.length)?'reading':'words';
  let h=planSetupHTML(false);
  const phaseLabel=ti.status==='exammonth'?'真题 / 冲刺月':(ti.status==='after'?'已到考前':'新学');
  h+='<div class="p-hero">'
    +'<div class="p-stat"><div class="n">'+Math.max(0,b.examLeft)+'<small>天</small></div><div class="l">距考研（'+b.exam.slice(5)+'）</div></div>'
    +'<div class="p-stat"><div class="n">'+(ti.status==='before'?1:ti.idx+1)+'<small>/ '+b.days.length+'</small></div><div class="l">'+(ti.status==='before'?'计划未开始 · 首日 '+b.days[0].date:'今天 '+day.date+' '+day.weekday+' · '+phaseLabel)+'</div></div>'
    +'<div class="p-stat"><div class="n">'+(day?day.leaves.length:0)+'<small>考点</small></div><div class="l">今日任务（408/数一/政治）</div></div>'
    +'<div class="p-stat"><div class="n">'+b.done+'<small>/ '+b.total+'</small></div><div class="l">考点已完成</div></div>'
    +'</div>';
  h+=planModAlerts(b);
  h+='<div class="p-cols"><div>';
  h+='<div class="p-card" id="planToday"><h3>'+(ti.status==='exammonth'?'真题月 · 今日任务（政治/英语收尾）':'今日学习任务')+(ti.status!=='exammonth'?'<button class="p-daybtn" onclick="planEditDay('+ti.idx+')">⏱ 今日各科时长</button>':'')+'</h3>'
    +'<div class="sub">'+(day?day.date+' '+day.weekday+' · 考点约 '+((day.mins.c408+day.mins.math+day.mins.poli)/60).toFixed(1)+'h＋英语 '+b.hEng+'h（'+planEngLine(day)+'）＋复习机动':'计划已结束')+'</div>';
  if(day&&day.leaves.length)h+=planGroupLeaves(day); else h+='<div class="sub">今天没有新考点，用于真题、错题与薄弱点复盘。</div>';
  if(day&&day.leaves.length&&td===day.leaves.length)h+='<div class="p-alert ok" style="margin:8px 0"><b>今日考点已全部完成</b>，清单已锁定、不再安排新考点；剩余时间交给英语、错题与艾宾浩斯复习。</div>';
  h+='<div class="p-prog"><span id="pTodayProg">'+td+' / '+(day?day.leaves.length:0)+' 完成</span><div class="pbar" style="flex:1"><i id="pTodayBar" style="width:'+tpct+'%;background:var(--kc-done)"></i></div><span>'+tpct+'%</span></div>';
  h+='</div>';
  h+='<div class="p-card"><h3>未来计划</h3><div class="sub">'+(pShowAll?'全部 '+b.days.length+' 天':'从今天起 7 天（可展开全部）')+' · 高频先学、新旧穿插，⇄可换同时长同级题</div>'
    +'<div id="pTimeline">'+planTimelineHTML(b,ti.idx)+'</div>'
    +(b.days.length-ti.idx>7?'<button class="p-more" onclick="planToggleAll()">'+(pShowAll?'收起，只看 7 天':'展开全部 '+b.days.length+' 天计划')+'</button>':'')
    +'</div>';
  h+='</div><div>';
  if(engPhase==='words'){
    h+='<div class="p-quick"><div class="p-q"><div class="qi" style="background:#EDE7F6;color:var(--net)">A</div><div class="qm"><b>今日单词（一轮前）</b><span>新词已学 '+wordDone+'/'+b.wordPerDay+(wordLeft?' · 剩 '+wordLeft:' · 已达标')+' · 待复习 '+wordDue+'</span></div><button onclick="planGoWords()">去背词</button></div>';
  }else{
    const rd=(b.rb&&typeof todayReading==='function')?todayReading():null;
    h+='<div class="p-quick"><div class="p-q"><div class="qi" style="background:#E3F6EE;color:#0a8a5f">读</div><div class="qm"><b>今日阅读打卡</b><span>'+(rd?('应做 '+rd.n+' 篇（'+rd.label+'）'):'单词一轮已完成，去安排阅读')+'</span></div><button onclick="location.hash=\'#/reading\'">去阅读</button></div>';
  }
  h+='<div class="p-q"><div class="qi" style="background:#E7EEF8;color:var(--os)">复</div><div class="qm"><b>今日复习</b><span>笔记 / 导图 / 错题待复习 '+dueN+' 条（艾宾浩斯）</span></div><button onclick="location.hash=\'#/notes\'">去复习</button></div></div>';
  h+='<div class="p-card" style="margin-top:14px"><h3>各模块进度</h3>';
  h+='<div class="p-alloc">'+b.allocArr.map(a=>{const pct=a.total?Math.round(100*a.done/a.total):0;return '<div class="pa"><span class="pan">'+a.name+'</span><span class="pab"><i style="width:'+pct+'%;background:'+a.color+'"></i></span><span class="pam">'+a.done+' / '+a.total+' · '+pct+'%</span></div>';}).join('')+'</div>';
  h+='<div class="p-prog" style="margin-top:10px"><span id="pOvProg">计划完成 '+b.done+' / '+b.total+'</span></div><div class="pbar" style="margin:8px 0"><i id="pOvBar" style="width:'+ovPct+'%;background:var(--kc-done)"></i></div>';
  h+='<div class="sub" style="margin-bottom:6px">单词 '+b.wordPerDay+'/天 · 一轮约 '+b.wordDays+' 天（'+b.wordFinishDate+'）· 一轮后转阅读（每天≤4篇）</div>';
  h+='</div>';
  h+='</div></div>';
  app.innerHTML=h;
}

function planToggleAll(){ pShowAll=!pShowAll; renderPlan(); }

function planSidebarItem(){
  const route=currentRoute(),on=route.type==='plan';
  let meta='四大模块排期';
  try{ const b=planBuild(); if(b){ const {ti,day}=planToday(b);
    const td=day?day.leaves.filter(l=>planLeafDone(l.path)).length:0;
    meta=(day&&day.leaves.length)?('今日 '+td+'/'+day.leaves.length):(ti.status==='exammonth'?'真题月':'新学已结束'); } }catch(e){}
  return '<button class="snav '+('')+'" data-goto="#/plan" style="'+(on?'border-left:3px solid var(--kc-wait)':'')+'">'
    +'<span class="scol" style="background:var(--kc-wait);'+(on?'':'opacity:.35')+'"></span>'
    +'<span class="sinfo"><span class="sname">学习计划<span class="en">PLAN</span></span><span class="smeta">'+meta+'</span></span>'
    +'<span class="spct" style="color:var(--kc-wait)">⏱</span></button>';
}

function planOverviewBanner(){
  try{ const b=planBuild(); if(!b)return ''; const {ti,day}=planToday(b);
    if(!day)return '';
    const td=day.leaves.filter(l=>planLeafDone(l.path)).length;
    const eng=planEngLine(day);
    return '<div class="ov-banner" onclick="location.hash=\'#/plan\'" style="cursor:pointer">'
      +'<b>今天 '+day.date.slice(5)+' '+day.weekday+(ti.status==='exammonth'?' · 真题月':'')+'</b><span>'
      +day.leaves.length+' 个考点（完成 '+td+'）· 英语：'+eng+' · 点击查看排期</span></div>';
  }catch(e){ return ''; }
}

Object.assign(globalThis, { PLAN_EXAM_DEF, PLAN_LEAF_MINS, PLAN_LEARNED_MINS, PLAN_POLI_MINS, PLAN_POLI_CAP_DATE, PLAN_WORD_DEF, LEARNED_CHAPTERS_DEFAULT, PLAN_C408_SUBS, PLAN_MATH_SUBS, PLAN_POLI_SUBS, PLAN_C408_DEF, PLAN_MATH_DEF, planCfg, planTodayStr, planFmt, planParse, planAddDays, planDiff, PLAN_WD, planWd, planTopicName, planLeafTitle, planDefaultLearnEnd, wRoundLearned, planWordPerDay, planSubH, learnedChapters, isLearnedChapter, isLearnedPath, leafMins, toggleLearnedChapter, planPoliNoteDone, planLeafDone, planMastered, planCollect, planSubQueue, planPoliQueue, planPoliCapH, planReadingBuildSafe, planReadingForDate, planBuild, planTodayIndex, planTodayLockKey, planEnsureTodayLock, planToday, planOverrides, planLeafIndex, planApplyOverrides, planSwapCandidates, planSwapOverlayEl, planCloseSwap, planShowSwap, planSwap, planUndoSwap, planOpenSwap, planDayOverlayEl, planCloseDay, planEditDay, planSaveDay, planResetDay, planSetupHTML, planSave, pShowAll, planLeafRow, planGroupLeaves, planToggleLeaf, planRefreshCounts, planEngLine, planTimelineHTML, planGoWords, planModAlerts, renderPlan, planToggleAll, planSidebarItem, planOverviewBanner });
export { PLAN_EXAM_DEF, PLAN_LEAF_MINS, PLAN_LEARNED_MINS, PLAN_POLI_MINS, PLAN_POLI_CAP_DATE, PLAN_WORD_DEF, LEARNED_CHAPTERS_DEFAULT, PLAN_C408_SUBS, PLAN_MATH_SUBS, PLAN_POLI_SUBS, PLAN_C408_DEF, PLAN_MATH_DEF, planCfg, planTodayStr, planFmt, planParse, planAddDays, planDiff, PLAN_WD, planWd, planTopicName, planLeafTitle, planDefaultLearnEnd, wRoundLearned, planWordPerDay, planSubH, learnedChapters, isLearnedChapter, isLearnedPath, leafMins, toggleLearnedChapter, planPoliNoteDone, planLeafDone, planMastered, planCollect, planSubQueue, planPoliQueue, planPoliCapH, planReadingBuildSafe, planReadingForDate, planBuild, planTodayIndex, planTodayLockKey, planEnsureTodayLock, planToday, planOverrides, planLeafIndex, planApplyOverrides, planSwapCandidates, planSwapOverlayEl, planCloseSwap, planShowSwap, planSwap, planUndoSwap, planOpenSwap, planDayOverlayEl, planCloseDay, planEditDay, planSaveDay, planResetDay, planSetupHTML, planSave, pShowAll, planLeafRow, planGroupLeaves, planToggleLeaf, planRefreshCounts, planEngLine, planTimelineHTML, planGoWords, planModAlerts, renderPlan, planToggleAll, planSidebarItem, planOverviewBanner };
