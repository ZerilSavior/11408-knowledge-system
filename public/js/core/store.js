// 模块: store（由单文件重构拆分；顶层符号经 main.js 聚合为全局，保持零构建原生 ESM）

const LS_KEY = 'k408-knowledge-v1';

let state = { mastery:{}, notes:{}, myNotes:[], drawings:{}, maps:[], items:[], words:{}, plan:null,
  locators:{}, books:null, reasons:null, practices:{}, masteryManual:{}, exams:null };

try{

  const raw = localStorage.getItem(LS_KEY);

  if(raw){ const p = JSON.parse(raw); state = Object.assign(state, p); }

}catch(e){}

function saveState(){ try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }catch(e){} cloudSave(); }
/* ===== 艾宾浩斯复习调度（笔记 / 导图 / 错题通用）=====
   间隔 1/2/4/7/15/30 天；item.rv={stage 已完成轮次,count,last 上次复习,next 下次到期(ts|null)} */
const REVIEW_INTERVALS=[1,2,4,7,15,30];
const RV_DAY=86400000;
function newReview(now){ now=now||Date.now(); return {stage:0,count:0,last:0,next:now+RV_DAY*REVIEW_INTERVALS[0]}; }
function ensureReview(it){
  if(!it) return null;
  if(!it.rv || typeof it.rv!=='object'){ it.rv={stage:0,count:0,last:0,next:Date.now()}; }
  const rv=it.rv;
  if(typeof rv.stage!=='number'||rv.stage<0) rv.stage=0;
  rv.count=(typeof rv.count==='number')?rv.count:rv.stage;
  if(rv.next!==null && typeof rv.next!=='number') rv.next=it.created||Date.now();
  return rv;
}
function reviewState(it,now){
  const rv=ensureReview(it); now=now||Date.now();
  const total=REVIEW_INTERVALS.length, stage=Math.min(rv.stage,total);
  if(rv.next===null||rv.stage>=total) return {code:'done',stage:total,total,next:null};
  const diff=rv.next-now;
  if(diff<=0) return {code:'due',overdueDays:Math.floor(-diff/RV_DAY),stage,total,next:rv.next};
  return {code:'upcoming',daysLeft:Math.max(1,Math.ceil(diff/RV_DAY)),stage,total,next:rv.next};
}
function reviewLabel(it,now){
  const r=reviewState(it,now);
  if(r.code==='done') return '已巩固';
  if(r.code==='due') return r.overdueDays>=1?('逾期 '+r.overdueDays+' 天'):'今日待复习';
  return r.daysLeft+' 天后复习';
}
function doReview(it){
  const rv=ensureReview(it), now=Date.now();
  rv.last=now; rv.stage+=1; rv.count=rv.stage;
  if(rv.stage>=REVIEW_INTERVALS.length) rv.next=null;
  else rv.next=now+RV_DAY*REVIEW_INTERVALS[rv.stage];
  it.updated=now;
  saveState();
  return rv;
}
function dueItems(now){ now=now||Date.now(); return state.items.filter(it=>reviewState(it,now).code==='due').sort((a,b)=>(a.rv.next||0)-(b.rv.next||0)); }
function ensureAllReviews(){ let changed=false; state.items.forEach(it=>{ if(!it.rv){ ensureReview(it); changed=true; } }); if(changed){ try{ localStorage.setItem(LS_KEY,JSON.stringify(state)); }catch(e){} } }
/* ===== 学习条目（笔记 / 导图 / 错题统一库，以考点为中心）=====
   item: {id, kind:'note'|'map'|'mistake', path(关联考点路径,''=未分类), subject,
   title, created, updated,
   note -> content(Markdown)；map -> root(大纲树)；
   mistake -> question/wrong/analysis/status('open'|'mastered')} */
function mergeItems(localArr, cloudArr){
  const map = {};
  (localArr||[]).forEach(it=>{ if(it&&it.id) map[it.id]=it; });
  (cloudArr||[]).forEach(it=>{
    if(!it||!it.id) return;
    const ex = map[it.id];
    if(!ex || (it.updated||0) > (ex.updated||0)) map[it.id]=it;
  });
  return Object.keys(map).map(k=>map[k]).sort((a,b)=>(b.updated||0)-(a.updated||0));
}
/* 一次性迁移：旧版全局「我的笔记 myNotes」「思维导图 maps」并入 items（按 id 幂等，不丢数据）*/
function migrateLegacyItems(){
  if(!Array.isArray(state.items)) state.items = [];
  let changed = false;
  const have = {}; state.items.forEach(it=>{ if(it&&it.id) have[it.id]=true; });
  (state.myNotes||[]).forEach(n=>{
    if(have[n.id]) return;
    state.items.push({ id:n.id, kind:'note', path:'', subject:n.subject||'other',
      title:n.title||'未命名笔记', content:n.content||'', created:n.created, updated:n.updated });
    have[n.id]=true; changed=true;
  });
  (state.maps||[]).forEach(m=>{
    if(have[m.id]) return;
    state.items.push({ id:m.id, kind:'map', path:'', subject:m.subject||'other',
      title:m.title||'未命名导图', root:m.root, created:m.created, updated:m.updated });
    have[m.id]=true; changed=true;
  });
  if(changed || (state.myNotes&&state.myNotes.length) || (state.maps&&state.maps.length)){
    state.myNotes = []; state.maps = [];
    try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }catch(e){}
  }
}


/* ===== 批4 学习闭环：书源库 / 错因库 / 知识定位 / 做题记录 / 掌握自动判定 ===== */

Object.assign(globalThis, { LS_KEY, state, saveState, REVIEW_INTERVALS, RV_DAY, newReview, ensureReview, reviewState, reviewLabel, doReview, dueItems, ensureAllReviews, mergeItems, migrateLegacyItems });
export { LS_KEY, state, saveState, REVIEW_INTERVALS, RV_DAY, newReview, ensureReview, reviewState, reviewLabel, doReview, dueItems, ensureAllReviews, mergeItems, migrateLegacyItems };
