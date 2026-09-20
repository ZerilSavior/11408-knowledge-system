// 模块: reading（由单文件重构拆分；顶层符号经 main.js 聚合为全局，保持零构建原生 ESM）

const READ_BASE_N=100, READ_STRONG_N=100, READ_CAP=4;
function ensureReading(){
  if(!state.reading||typeof state.reading!=='object'){ state.reading={start:'',end:'',done:{}}; }
  const r=state.reading;
  if(typeof r.baseN!=='number')r.baseN=100;
  if(typeof r.strongN!=='number')r.strongN=100;
  if(!r.done||typeof r.done!=='object')r.done={};
  return r;
}
function mergeReading(local,cloud){
  const l=local||{start:'',end:'',done:{}};
  const out={start:l.start||(cloud&&cloud.start)||'',end:l.end||(cloud&&cloud.end)||'',baseN:l.baseN||READ_BASE_N,strongN:l.strongN||READ_STRONG_N,done:{}};
  const keys=new Set([].concat(Object.keys(l.done||{}),Object.keys((cloud&&cloud.done)||{})));
  keys.forEach(k=>{ const a=(l.done||{})[k], b=(cloud&&cloud.done||{})[k]; out.done[k]=b?b:a; });
  return out;
}
function rTotal(){ const r=ensureReading(); return (r.baseN||READ_BASE_N)+(r.strongN||READ_STRONG_N); }
function rLabel(idx){ const r=ensureReading(); const bn=r.baseN||READ_BASE_N;
  return idx<bn?('基础 Text '+(idx+1)):('强化 Text '+(idx-bn)); }
function rDefaultStart(){
  const learned=wRoundLearned();
  let wpd=WORD_DAILY_DEF; try{ wpd=planWordPerDay(); }catch(e){}
  const need=Math.ceil(Math.max(0,WORDS.length-learned)/wpd);
  return planAddDays(planTodayStr(),need);
}
function readingBuild(){
  const r=ensureReading();
  const total=rTotal();
  const start=r.start||rDefaultStart();
  const end=r.end||(planCfg()?planCfg().exam:PLAN_EXAM_DEF)||PLAN_EXAM_DEF;
  const R=planDiff(start,end)+1;
  const needDays=Math.ceil(total/READ_CAP);
  const feasible=R>=needDays;
  const perDay=feasible?Math.min(READ_CAP,Math.ceil(total/Math.max(1,R))):READ_CAP;
  const days=[];
  const dayN=Math.max(R,needDays);
  for(let d=0;d<dayN;d++){
    const date=planAddDays(start,d);
    const si=d*perDay, ei=Math.min(si+perDay,total)-1;
    if(si>=total){ days.push({date,n:0,startIdx:-1,endIdx:-1,label:''}); continue; }
    days.push({date,n:ei-si+1,startIdx:si,endIdx:ei,label:rLabel(si)+' ~ '+rLabel(ei)});
  }
  let doneN=0; Object.keys(r.done).forEach(k=>{ if(+k>=0&&+k<total&&r.done[k])doneN++; });
  return {start,end,R,needDays,feasible,perDay,total,days,doneN,baseN:r.baseN||READ_BASE_N,strongN:r.strongN||READ_STRONG_N};
}
function todayReading(){ const b=readingBuild(); return b.days.find(x=>x.date===planTodayStr()&&x.n>0)||null; }
function readingToggle(idx){
  const r=ensureReading();
  if(r.done[idx]){ delete r.done[idx]; } else { r.done[idx]=Date.now(); }
  saveState(); cloudSave(); renderReading(); renderSidebar();
}
function readingDoToday(){
  const b=readingBuild(), t=todayReading(); if(!t){ toast('今天没有安排阅读'); return; }
  const r=ensureReading();
  for(let i=t.startIdx;i<=t.endIdx;i++){ if(!r.done[i])r.done[i]=Date.now(); }
  saveState(); cloudSave(); renderReading(); renderSidebar(); toast('今日阅读已打卡 '+t.n+' 篇');
}
function readingSave(){
  const r=ensureReading();
  const s=document.getElementById('rStart').value||rDefaultStart();
  const e=document.getElementById('rEnd').value||PLAN_EXAM_DEF;
  r.start=s; r.end=e;
  if(planCfg()){ state.plan.readStart=s; state.plan.readEnd=e; }
  saveState(); cloudSave(); renderReading(); renderSidebar(); toast('阅读计划已保存');
}
function readingSetupHTML(b){
  return '<details class="p-set"><summary>调整阅读开始 / 目标日期</summary><div class="p-form">'
   +'<label>阅读开始日（建议单词一轮完成后）<input id="rStart" type="date" value="'+b.start+'"></label>'
   +'<label>阅读目标完成日<input id="rEnd" type="date" value="'+b.end+'"></label>'
   +'<button class="p-btn" onclick="readingSave()">保存阅读计划</button>'
   +'<div class="sub" style="margin-top:10px;font-size:12.5px;line-height:1.7">共 '+b.total+' 篇（基础 '+b.baseN+'＋强化 '+b.strongN+'），先基础后强化，每天最多 '+READ_CAP+' 篇，至少需要 '+b.needDays+' 天。当前可用 '+b.R+' 天，每天约 '+b.perDay+' 篇。</div>'
   +'</div></details>';
}
function readingGrid(b){
  const r=ensureReading(), t=todayReading();
  const todaySet={}; if(t){ for(let i=t.startIdx;i<=t.endIdx;i++)todaySet[i]=1; }
  let cells='';
  for(let i=0;i<b.total;i++){
    const done=!!r.done[i], base=i<b.baseN, today=!!todaySet[i];
    const bg=done?(base?'#0a8a5f':'#c2560a'):(today?(base?'#bfe9da':'#ffe2c4'):(base?'#e3f6ee':'#fff0e2'));
    const col=done?'#fff':(base?'#0a8a5f':'#c2560a');
    const bd=today?'box-shadow:0 0 0 2px var(--ink);':'';
    cells+='<button class="r-cell" title="'+rLabel(i)+(done?' · 已完成':'')+(today?' · 今日':'')+'" '
      +'style="background:'+bg+';color:'+col+';'+bd+'" onclick="readingToggle('+i+')">'+(i+1)+'</button>';
  }
  return '<div class="r-grid">'+cells+'</div>';
}
function renderReading(){
  const app=$('#readingApp'); if(!app)return;
  ensureReading();
  const b=readingBuild(), t=todayReading();
  const pct=Math.round(100*b.doneN/b.total);
  const baseDone=Object.keys(ensureReading().done).filter(k=>+k<b.baseN&&ensureReading().done[k]).length;
  const strongDone=b.doneN-baseDone;
  const wordsLearned=wRoundLearned(), wordsRound=wordsLearned>=WORDS.length;
  let h='';
  if(!b.feasible){
    h+='<div class="p-alert bad"><b>阅读排不完：</b>'+b.total+' 篇每天最多 '+READ_CAP+' 篇需 '+b.needDays+' 天，从 '+b.start+' 到 '+b.end+' 只有 '+b.R+' 天。请把开始日提前（提高每天新词数、尽早结束单词一轮），或把目标日后移到考研当天。</div>';
  }else{
    h+='<div class="p-alert ok"><b>阅读计划可行：</b>'+b.start+' 开始，'+b.end+' 前完成，共 '+b.R+' 天，每天约 '+b.perDay+' 篇，先基础后强化。</div>';
  }
  if(!wordsRound){
    h+='<div class="p-alert" style="background:#fff7e6;border-color:#f0c36d"><b>单词一轮未完成：</b>已学 '+wordsLearned+' / '+WORDS.length+'。按规则一轮完成前以背单词为主，阅读开始日已默认排在预计一轮完成后（'+b.start+'）；你也可以手动提前。</div>';
  }
  h+=readingSetupHTML(b);
  h+='<div class="p-hero"><div class="p-stat"><div class="n">'+b.doneN+'<small>/ '+b.total+'</small></div><div class="l">阅读已完成</div></div>'
    +'<div class="p-stat"><div class="n">'+baseDone+'<small>/ '+b.baseN+'</small></div><div class="l">基础篇</div></div>'
    +'<div class="p-stat"><div class="n">'+strongDone+'<small>/ '+b.strongN+'</small></div><div class="l">强化篇</div></div>'
    +'<div class="p-stat"><div class="n">'+(t?t.n:0)+'<small>篇</small></div><div class="l">今日任务</div></div></div>';
  h+='<div class="p-card"><h3>今日阅读</h3>';
  if(t){ h+='<div class="sub" style="margin:6px 0 12px">'+t.date+' '+planWd(t.date)+' · 应做 <b>'+t.n+'</b> 篇：'+t.label+'</div>'
    +'<button class="p-btn" onclick="readingDoToday()">一键完成今日 '+t.n+' 篇</button>'; }
  else { h+='<div class="sub" style="margin:6px 0 12px">今天没有安排阅读（可能尚未到开始日，或已全部排完）。</div>'; }
  h+='<div class="p-prog" style="margin-top:14px"><span>'+b.doneN+' / '+b.total+'</span><div class="pbar" style="flex:1"><i style="width:'+pct+'%;background:#0a8a5f"></i></div><span>'+pct+'%</span></div></div>';
  h+='<div class="p-card"><h3>逐篇打卡（点击格子切换完成）</h3>'
    +'<div class="sub" style="margin:6px 0 12px"><span style="display:inline-block;width:10px;height:10px;background:#0a8a5f;border-radius:2px;margin-right:5px"></span>基础篇（1-'+b.baseN+'，绿）　<span style="display:inline-block;width:10px;height:10px;background:#c2560a;border-radius:2px;margin:0 5px 0 12px"></span>强化篇（'+(b.baseN+1)+'-'+b.total+'，橙）　描边为今日范围</div>'
    +readingGrid(b)+'</div>';
  h+='<div class="p-card"><h3>英语其他板块</h3><div class="sub" style="line-height:1.9">单词一轮完成后，除阅读理解外，每天的英语时间可穿插<b>小三门</b>（完形填空、新题型、翻译）与<b>作文</b>；这两类打卡将在后续版本加入，当前先用阅读打卡把 200 篇阅读训练排满。背单词与复习仍走「英语词汇」。</div></div>';
  app.innerHTML=h;
}
function readingSidebarItem(){
  const route=currentRoute(), on=route.type==='reading';
  let meta='新东方100篇×2';
  try{ const b=readingBuild(); meta=b.doneN+' / '+b.total+' 篇'; }catch(e){}
  return '<button class="snav '+(on?'active':'')+'" data-goto="#/reading" style="'+(on?'border-left:3px solid #0a8a5f':'')+'">'
   +'<span class="scol" style="background:#0a8a5f;'+(on?'':'opacity:.5')+'"></span>'
   +'<span class="sinfo"><span class="sname">阅读打卡<span class="en">READING</span></span><span class="smeta">'+meta+'</span></span></button>';
}


/* ================= 真题模考（两天一周期 · R2 试卷照片 · 成绩趋势） ================= */

Object.assign(globalThis, { READ_BASE_N, ensureReading, mergeReading, rTotal, rLabel, rDefaultStart, readingBuild, todayReading, readingToggle, readingDoToday, readingSave, readingSetupHTML, readingGrid, renderReading, readingSidebarItem });
export { READ_BASE_N, ensureReading, mergeReading, rTotal, rLabel, rDefaultStart, readingBuild, todayReading, readingToggle, readingDoToday, readingSave, readingSetupHTML, readingGrid, renderReading, readingSidebarItem };
