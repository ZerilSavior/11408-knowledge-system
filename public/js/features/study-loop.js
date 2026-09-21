// 模块: study-loop（由单文件重构拆分；顶层符号经 main.js 聚合为全局，保持零构建原生 ESM）

const BOOK_GROUPS = [
  { key:'c408', label:'408（数据结构 / 组成原理 / 操作系统 / 计算机网络 共用）', subs:['ds','co','os','net'] },
  { key:'math', label:'数学一（高数 / 线代 / 概统 共用）', subs:['math1','math2','math3'] },
  { key:'eng',  label:'英语一', subs:['eng'] },
  { key:'poli', label:'政治', subs:['poli1','poli2','poli3','poli4','poli5','poli6'] }
];
const DEFAULT_BOOKS = {
  c408: ['王道考研·数据结构复习指导','王道考研·计算机组成原理复习指导','王道考研·操作系统复习指导','王道考研·计算机网络复习指导','王道考研·408历年真题','天勤·408高分笔记','王道习题册','王道强化PPT','袁春风《计算机组成原理》','王卓数据结构强化PPT','里昂25计组讲义','里昂26操作系统讲义','湖科大《深入浅出计算机网络》','湖科大计算机网络强化'],
  math: ['郭雨港·数一所有题型分类、通用解法详解','郭雨港·名师习题册','李永乐·数学复习全书（数学一）','李永乐·数学基础过关660题','张宇·基础30讲','张宇·题源探析1000题','汤家凤·接力题典1800','数学一历年真题'],
  eng:  ['张剑黄皮书·英语一历年真题','考研真相·英语一','唐迟·阅读的逻辑','王江涛·高分写作'],
  poli: ['肖秀荣·知识点精讲精练','肖秀荣·1000题','徐涛·核心考案','肖四','肖八','大李子知识清单','大李子720题']
};
const DEFAULT_REASONS = ['概念/定义不清','公式或定理记错','定理适用条件忽略','解题方法不会','计算失误','审题错误','跳步导致出错','时间不够没做完','粗心笔误','知识点遗忘'];
function genBookId(){ return 'bk'+Date.now()+Math.random().toString(36).slice(2,6); }
function defBookId(k,i){ return 'bkdef_'+k+'_'+i; }
/* 书源归一化：按书名去重（云同步曾因随机 id 造成同名重复），补齐默认书，重映射做题/错题记录的 bookId */
function normalizeBooks(){
  if(!state.books) return false;
  let changed=false; const remap={};
  BOOK_GROUPS.forEach(g=>{
    const k=g.key; const old=Array.isArray(state.books[k])?state.books[k].slice():[];
    const byName={}; const out=[]; const ids={};
    old.forEach(b=>{
      if(!b||!b.name) return;
      const nm=String(b.name).trim();
      if(Object.prototype.hasOwnProperty.call(byName,nm)){ if(b.id) remap[b.id]=out[byName[nm]].id; return; }
      let bid=b.id;
      if(!bid||ids[bid]) bid=genBookId();
      ids[bid]=1; byName[nm]=out.length; out.push({id:bid,name:nm});
    });
    (DEFAULT_BOOKS[k]||[]).forEach((n,i)=>{
      const nm=String(n).trim();
      if(!Object.prototype.hasOwnProperty.call(byName,nm)){
        let bid=defBookId(k,i);
        if(ids[bid]){ let j=0; while(ids[bid+'_d'+j]) j++; bid=bid+'_d'+j; }
        ids[bid]=1; byName[nm]=out.length; out.push({id:bid,name:nm});
      }
    });
    if(old.length!==out.length || old.some((b,i)=>!b||b.id!==out[i].id||b.name!==out[i].name)) changed=true;
    state.books[k]=out;
  });
  if(Object.keys(remap).length){
    Object.keys(state.practices||{}).forEach(pt=>{
      (state.practices[pt]||[]).forEach(it=>{ if(it&&it.bookId&&remap[it.bookId]){ it.bookId=remap[it.bookId]; changed=true; } });
    });
    (state.items||[]).forEach(it=>{ if(it&&it.bookId&&remap[it.bookId]){ it.bookId=remap[it.bookId]; changed=true; } });
  }
  return changed;
}
function bookGroupOf(subId){ const g=BOOK_GROUPS.find(g=>g.subs.includes(subId)); return g?g.key:null; }
function ensureLearningData(){
  let changed=false;
  if(!state.locators){ state.locators={}; changed=true; }
  if(!state.practices){ state.practices={}; changed=true; }
  if(!state.masteryManual){ state.masteryManual={}; changed=true; }
  if(!state.books){
    state.books={c408:[],math:[],eng:[],poli:[]};
    Object.keys(DEFAULT_BOOKS).forEach(k=>{ state.books[k]=DEFAULT_BOOKS[k].map((n,i)=>({id:defBookId(k,i),name:n})); });
    changed=true;
  } else { BOOK_GROUPS.forEach(g=>{ if(!Array.isArray(state.books[g.key])){ state.books[g.key]=[]; changed=true; } }); }
  if(normalizeBooks()) changed=true;
  if(!Array.isArray(state.reasons)){ state.reasons=DEFAULT_REASONS.slice(); changed=true; }
  ensureExams();
  ensureReading();
  if(!state.planOverrides){ state.planOverrides={}; changed=true; }
  if(changed){ try{ localStorage.setItem(LS_KEY,JSON.stringify(state)); }catch(e){} }
}
function booksForSub(subId){ const k=bookGroupOf(subId); return k ? (state.books[k]||[]) : []; }
function bookName(id){ for(const g of BOOK_GROUPS){ for(const b of (state.books[g.key]||[])){ if(b.id===id) return b.name; } } return ''; }
function locatorsOf(path){ return state.locators[path]||[]; }
function practicesOf(path){ return state.practices[path]||[]; }
function mergePathArrays(local, cloud){
  const out = Object.assign({}, local||{});
  Object.keys(cloud||{}).forEach(p=>{
    const map={}; (out[p]||[]).forEach(x=>{ if(x&&x.id) map[x.id]=x; });
    (cloud[p]||[]).forEach(x=>{ if(x&&x.id){ const ex=map[x.id]; if(!ex || (x.ts||x.updated||0)>=(ex.ts||ex.updated||0)) map[x.id]=x; } });
    out[p]=Object.keys(map).map(k=>map[k]);
  });
  return out;
}
function mergeBooks(local, cloud){
  const out={ c408:[],math:[],eng:[],poli:[] };
  BOOK_GROUPS.forEach(g=>{
    const k=g.key, seenId={}, seenName={}; const arr=[];
    ((local&&local[k])||[]).concat((cloud&&cloud[k])||[]).forEach(b=>{
      if(!b||!b.name) return;
      const nm=String(b.name).trim();
      if(b.id&&seenId[b.id]) return;
      if(seenName[nm]){ if(b.id) seenId[b.id]=1; return; }
      if(b.id) seenId[b.id]=1; seenName[nm]=1; arr.push({id:b.id||genBookId(),name:nm});
    });
    out[k]=arr;
  });
  return out;
}
/* 掌握四条件：知识定位 / 核心精华笔记 / 做过题 / 错题全部订正 */
function masteryChecklist(path){
  const loc = locatorsOf(path).length>0;
  const essence = state.items.some(it=>it.path===path && it.kind==='note' && it.essence);
  const practiced = practicesOf(path).length>0;
  const openMistakes = state.items.filter(it=>it.path===path && it.kind==='mistake' && it.status!=='mastered').length;
  const mistakesClear = openMistakes===0;
  return { loc, essence, practiced, mistakesClear, ready: loc&&essence&&practiced&&mistakesClear, openMistakes };
}
/* 文本中的 http(s) 链接 -> 可点超链接 + 一键复制（先 esc 再替换） */
function linkifyText(t){
  let s=esc(t==null?'':String(t));
  s=s.replace(/(https?:\/\/[A-Za-z0-9~%./?#=&:;+\-@!*'()_,]+)/g,(m0)=>{
    let url=m0, tail='';
    const tp=/[.,;!?，。；！？、)]+$/.exec(url);
    if(tp){ tail=tp[0]; url=url.slice(0,-tail.length); }
    return '<a class="loc-link" href="'+url+'" target="_blank" rel="noopener noreferrer">'+url+'</a><button type="button" class="loc-copy" data-copy="'+url+'" title="复制链接">复制</button>'+tail;
  });
  return s;
}
/* 掌握状态唯一权威：四项齐->mastered；不齐而当前 mastered->退回 studying（自动双向） */
function syncMastery(path){
  if(!path) return null;
  const c=masteryChecklist(path);
  const cur=state.mastery[path];
  if(c.ready){ if(cur!=='mastered'){ state.mastery[path]='mastered'; return 'up'; } return null; }
  if(cur==='mastered'){ state.mastery[path]='studying'; return 'down'; }
  return null;
}
function applyAutoMastery(path){ return syncMastery(path)==='up'; }
function recheckMastery(path){
  if(!path) return false;
  const r=syncMastery(path);
  if(r){
    try{ localStorage.setItem(LS_KEY,JSON.stringify(state)); }catch(e){}
    cloudSave();
    if(r==='up') toast('🎉 四项条件已完成，该考点自动判定为「已掌握」');
    else toast('掌握条件发生变化，该考点已转回「学习中」');
    return true;
  }
  return false;
}
function subjOfPath(path){ const info=pathInfo(path); return info?info.sub.id:(path?path.split('/')[0]:''); }
function mistakeSourceText(it){
  const parts=[];
  if(it.bookId && bookName(it.bookId)) parts.push(bookName(it.bookId));
  if(it.chapter) parts.push(it.chapter);
  if(it.page) parts.push('P'+it.page);
  if(it.qno) parts.push('第'+it.qno+'题');
  return parts.join(' · ');
}
/* ---- 掌握条件面板 ---- */
function masteryPanelHtml(path){
  const c=masteryChecklist(path);
  const doneN=[c.loc,c.essence,c.practiced,c.mistakesClear].filter(Boolean).length;
  const rows=[
    {ok:c.loc,          t:'知识定位',   s:c.loc?'已记录学习来源':'记录在哪学的（书/讲义/网课+位置）', act:'locator'},
    {ok:c.essence,      t:'核心精华',   s:c.essence?'已整理精华笔记':'写一条「核心精华」笔记', act:'essence'},
    {ok:c.practiced,    t:'做题记录',   s:c.practiced?'已记录做题情况':'做完对应题目并记录', act:'practice'},
    {ok:c.mistakesClear,t:'错题订正',   s:c.mistakesClear?'无未解决错题':(c.openMistakes+' 道错题待订正'), act:'mistakes'}
  ];
  let h='<div class="mc-card"><div class="mc-head">掌握条件<span class="mc-pct">'+doneN+' / 4</span></div><div class="mc-grid">';
  rows.forEach(r=>{
    h+='<div class="mc-item '+(r.ok?'done':'')+'" data-mc-act="'+r.act+'"><span class="mc-ico">'+(r.ok?'✓':'')+'</span><span><span class="mc-t">'+r.t+'</span><span class="mc-s">'+esc(r.s)+'</span></span></div>';
  });
  h+='</div>';
  if(c.ready) h+='<div class="mc-ready show">✓ 四项条件已完成，系统已自动判定为「已掌握」，笔记与错题已纳入艾宾浩斯复习</div>';
  else
    h+='<div class="mc-auto">四项条件全部完成后由系统自动判定为「已掌握」，掌握状态不可手动设置；你只需在上方切换「未学 / 学习中」。</div>';
  h+='</div>';
  return h;
}
/* ---- 知识定位面板 ---- */
function locatorPanelHtml(path){
  const list=locatorsOf(path);
  let h='<div class="lc-block"><div class="lc-bt">知识定位<span class="hint">WHERE I LEARNED IT</span><button class="iconbtn" data-add-locator="1">＋ 添加定位</button></div>';
  if(!list.length){ h+='<div class="sj-empty">还没记录来源。写明教材/讲义/网课 + 页码或节次，方便回查。</div>'; }
  else{
    h+='<div class="loc-list">'+list.map(l=>'<div class="loc-row"><span class="loc-kind">'+esc(l.kind)+'</span><div class="loc-main"><span class="loc-src">'+linkifyText(l.source)+'</span> · <span class="loc-loc">'+linkifyText(l.loc)+'</span>'+(l.note?'<div class="loc-note">'+linkifyText(l.note)+'</div>':'')+'</div><div class="loc-ops"><button data-edit-locator="'+l.id+'">编辑</button><button class="del" data-del-locator="'+l.id+'">删除</button></div></div>').join('')+'</div>';
  }
  return h+'</div>';
}
/* ---- 做题记录面板 ---- */
function practicePanelHtml(path){
  const list=practicesOf(path);
  let h='<div class="lc-block"><div class="lc-bt">做题记录<span class="hint">PRACTICE</span><button class="iconbtn" data-add-practice2="1">＋ 记录做题</button></div>';
  if(!list.length){ h+='<div class="sj-empty">还没有做题记录。学完后做对应题目，做对/做错都记一条，做错可一键存入错题本。</div>'; }
  else{
    h+='<div class="pr-list">'+list.map(r=>{
      const src=[bookName(r.bookId),r.chapter,(r.page?('P'+r.page):''),r.qno?('第'+r.qno+'题'):''].filter(Boolean).join(' · ');
      const tags=(r.reasons||[]).map(x=>'<span class="pr-r">'+esc(x)+'</span>').join('');
      return '<div class="pr-row"><span class="pr-badge '+(r.result==='right'?'right':'wrong')+'">'+(r.result==='right'?'做对':'做错')+'</span><div class="pr-main"><b>'+esc(src||'未标注来源')+'</b>'+(tags?'<div class="pr-rs">'+tags+'</div>':'')+'</div><div class="pr-ops"><button class="del" data-del-practice="'+r.id+'">删除</button></div></div>';
    }).join('')+'</div>';
  }
  return h+'</div>';
}
/* ---- 错因标签 ---- */
function reasonChipsHtml(selected){
  const sel={}; (selected||[]).forEach(x=>sel[x]=1);
  let h=(state.reasons||[]).map(r=>'<span class="reason-chip'+(sel[r]?' on':'')+'" data-reason="'+esc(r)+'">'+esc(r)+'</span>').join('');
  h+='<span class="reason-chip add" data-reason-add="1">＋ 新错因</span>';
  return h;
}
function selectedReasons(container){
  return Array.from(container.querySelectorAll('.reason-chip.on')).map(x=>x.dataset.reason);
}
function refreshReasonChips(container, selected){ container.innerHTML=reasonChipsHtml(selected); }
function bookOptionsHtml(subId, selected){
  let h='<option value="">未选择 / 其他资料</option>';
  booksForSub(subId).forEach(b=>{ h+='<option value="'+b.id+'"'+(b.id===selected?' selected':'')+'>'+esc(b.name)+'</option>'; });
  return h;
}
/* ---- 知识定位编辑器 ---- */
let locatorEditingId=null;
function openLocatorEditor(path, id){
  locatorEditingId=id||null;
  const list=locatorsOf(path), l=id?list.find(x=>x.id===id):null;
  $('#locatorEditorTitle').textContent=l?'编辑知识定位':'添加知识定位';
  $('#locatorPath').value=path||'';
  (function(){var dl=$('#locatorSourceList');if(dl)dl.innerHTML=booksForSub(subjOfPath(path)).map(function(b){return '<option value="'+esc(b.name)+'"></option>';}).join('');})();
  $('#locatorKind').value=l?(l.kind||'辅导讲义'):'辅导讲义';
  $('#locatorSource').value=l?(l.source||''):'';
  $('#locatorLoc').value=l?(l.loc||''):'';
  $('#locatorNote').value=l?(l.note||''):'';
  $('#locatorOverlay').classList.add('open');
  $('#locatorSource').focus();
}
function closeLocatorEditor(){ $('#locatorOverlay').classList.remove('open'); locatorEditingId=null; }
function saveLocator(){
  const path=$('#locatorPath').value;
  const kind=$('#locatorKind').value, source=$('#locatorSource').value.trim(), loc=$('#locatorLoc').value.trim(), note=$('#locatorNote').value.trim();
  if(!path){ toast('请先关联到具体考点'); return; }
  if(!source){ toast('请填写书名 / 讲义 / 网站'); $('#locatorSource').focus(); return; }
  if(!loc){ toast('请填写具体位置（页码 / 节次）'); $('#locatorLoc').focus(); return; }
  if(!state.locators[path]) state.locators[path]=[];
  const now=Date.now();
  if(locatorEditingId){ const l=state.locators[path].find(x=>x.id===locatorEditingId); if(l) Object.assign(l,{kind,source,loc,note}); }
  else state.locators[path].push({id:genItemId('l'),kind,source,loc,note,ts:now});
  saveState(); closeLocatorEditor(); afterItemChange(); recheckMastery(path); toast('知识定位已保存');
}
function deleteLocator(path,id){
  if(!state.locators[path]) return;
  state.locators[path]=state.locators[path].filter(x=>x.id!==id);
  saveState(); afterItemChange(); recheckMastery(path); toast('已删除定位');
}
/* ---- 做题记录编辑器 ---- */
function openPracticeEditor(presetPath){
  fillPathSelects();
  $('#practicePath').value=presetPath||'';
  $('input[name="prResult"][value="right"]').checked=true;
  $('#practiceChapter').value=''; $('#practicePage').value=''; $('#practiceQno').value=''; $('#practiceQuestion').value='';
  $('#practiceToMistake').checked=true;
  fillPracticeBooks(); refreshPracticeReasonBox([]); practiceToggleResult();
  $('#practiceOverlay').classList.add('open');
}
function closePracticeEditor(){ $('#practiceOverlay').classList.remove('open'); }
function fillPracticeBooks(){
  const sel=$('#practiceBook'); if(!sel) return;
  const cur=sel.value;
  sel.innerHTML=bookOptionsHtml(subjOfPath($('#practicePath').value), cur||'');
}
function refreshPracticeReasonBox(selected){ const c=$('#practiceReasons'); if(c) c.innerHTML=reasonChipsHtml(selected); }
function practiceToggleResult(){
  const wrong=$('input[name="prResult"]:checked').value==='wrong';
  $('#practiceWrongBox').classList.toggle('mk-hidden', !wrong);
}
function savePractice(){
  const path=$('#practicePath').value;
  if(!path){ toast('请先关联到具体考点'); return; }
  const result=$('input[name="prResult"]:checked').value;
  const bookId=$('#practiceBook').value, chapter=$('#practiceChapter').value.trim(), page=$('#practicePage').value.trim(), qno=$('#practiceQno').value.trim();
  const reasons=result==='wrong'?selectedReasons($('#practiceReasons')):[];
  const question=$('#practiceQuestion').value.trim();
  if(!state.practices[path]) state.practices[path]=[];
  const now=Date.now();
  state.practices[path].push({id:genItemId('p'),result,bookId,chapter,page,qno,reasons,ts:now});
  let madeMistake=false;
  if(result==='wrong' && $('#practiceToMistake').checked && question){
    const m={id:genItemId('k'),kind:'mistake',path,subject:subjOfPath(path)||'other',title:'',question,wrong:'',analysis:'',
      status:'open',bookId,chapter,page,qno,reasons,created:now,updated:now,rv:newReview(now)};
    state.items.push(m); madeMistake=true;
  }
  saveState(); closePracticeEditor(); afterItemChange(); recheckMastery(path);
  toast(madeMistake?'做题已记录，并已存入错题本':'做题已记录');
}
function deletePractice(path,id){
  if(!state.practices[path]) return;
  state.practices[path]=state.practices[path].filter(x=>x.id!==id);
  saveState(); afterItemChange(); toast('已删除做题记录');
}
/* ---- 书源 / 错因库管理 ---- */
let libGroup='c408';
function openLibrary(){ renderLibrary(); $('#libraryOverlay').classList.add('open'); }
function closeLibrary(){ $('#libraryOverlay').classList.remove('open'); }
function renderLibrary(){
  const tabs=$('#libTabs'); if(!tabs) return;
  tabs.innerHTML=BOOK_GROUPS.map(g=>'<span class="lib-tab'+(g.key===libGroup?' on':'')+'" data-lib-tab="'+g.key+'">'+esc(g.label)+'</span>').join('');
  const books=state.books[libGroup]||[];
  $('#libBooks').innerHTML='<div class="lib-list">'+books.map(b=>
    '<div class="lib-row"><span class="lib-name">'+esc(b.name)+'</span><button data-lib-delbook="'+b.id+'">删除</button></div>').join('')
    +'<div class="sj-empty" style="'+(books.length?'display:none':'')+'">这个科组还没有书，在下方添加。</div></div>';
  $('#libReasons').innerHTML=(state.reasons||[]).map((r,i)=>'<span class="reason-chip" data-lib-delreason="'+i+'">'+esc(r)+' ×</span>').join('');
}
/* 错题编辑器：来源书选项 + 错因 */
function fillMistakeBook(){
  const sel=$('#mistakeBook'); if(!sel) return;
  const cur=sel.value;
  sel.innerHTML=bookOptionsHtml(subjOfPath($('#mistakePath').value), cur||'');
}
function refreshMistakeReasons(selected){ const c=$('#mistakeReasons'); if(c) c.innerHTML=reasonChipsHtml(selected); }




/* ---------- 云端同步（可选） ---------- */

/* 由 server.js 提供 /api/state 接口；服务器不可用时自动回退本地，不影响使用 */

let cloudReady = false;

let cloudSaveTimer = null;



async function cloudInit(){ /* 新版登录后由 cloudLoad 处理 */ }



/* ===== 用户认证 + 云端同步 ===== */


Object.assign(globalThis, { BOOK_GROUPS, DEFAULT_BOOKS, DEFAULT_REASONS, genBookId, defBookId, normalizeBooks, bookGroupOf, ensureLearningData, booksForSub, bookName, locatorsOf, practicesOf, mergePathArrays, mergeBooks, masteryChecklist, applyAutoMastery, recheckMastery, syncMastery, linkifyText, subjOfPath, mistakeSourceText, masteryPanelHtml, locatorPanelHtml, practicePanelHtml, reasonChipsHtml, selectedReasons, refreshReasonChips, bookOptionsHtml, locatorEditingId, openLocatorEditor, closeLocatorEditor, saveLocator, deleteLocator, openPracticeEditor, closePracticeEditor, fillPracticeBooks, refreshPracticeReasonBox, practiceToggleResult, savePractice, deletePractice, libGroup, openLibrary, closeLibrary, renderLibrary, fillMistakeBook, refreshMistakeReasons, cloudReady, cloudSaveTimer, cloudInit });
export { BOOK_GROUPS, DEFAULT_BOOKS, DEFAULT_REASONS, genBookId, defBookId, normalizeBooks, bookGroupOf, ensureLearningData, booksForSub, bookName, locatorsOf, practicesOf, mergePathArrays, mergeBooks, masteryChecklist, applyAutoMastery, recheckMastery, syncMastery, linkifyText, subjOfPath, mistakeSourceText, masteryPanelHtml, locatorPanelHtml, practicePanelHtml, reasonChipsHtml, selectedReasons, refreshReasonChips, bookOptionsHtml, locatorEditingId, openLocatorEditor, closeLocatorEditor, saveLocator, deleteLocator, openPracticeEditor, closePracticeEditor, fillPracticeBooks, refreshPracticeReasonBox, practiceToggleResult, savePractice, deletePractice, libGroup, openLibrary, closeLibrary, renderLibrary, fillMistakeBook, refreshMistakeReasons, cloudReady, cloudSaveTimer, cloudInit };
