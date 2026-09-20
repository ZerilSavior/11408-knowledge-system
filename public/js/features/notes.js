// 模块: notes（由单文件重构拆分；顶层符号经 main.js 聚合为全局，保持零构建原生 ESM）

function emptyBox(title, hint){

  return `<div class="empty-box"><div>

    <div class="eb-title">${title}</div>

    <div>${hint}</div>

  </div></div>`;

}

function emptyDetail(){

  return `<div class="d-empty">

    <div class="de-glyph"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10m0 0V4m0 6h16V4m0 6v10M4 10h16M8 14h3m2 0h3"/></svg></div>

    <h3>选择一个考点开始</h3>

    <p>在左侧知识树中点击任意章节、小节或考点，这里将展示其知识内容、学习状态与个人笔记。</p>

  </div>`;

}



/* ============================================================

 * 搜索

 * ============================================================ */

/* ---------- 学习条目统一库：类型配置 / 考点路径 / CRUD / 学习中心 ---------- */
const ITEM_KINDS = {
  note:    { label:'笔记', color:'var(--kc-note)' },
  map:     { label:'导图', color:'var(--kc-map)' },
  mistake: { label:'错题', color:'var(--kc-mistake)' }
};

let kindFilter='all', subjFilter='all', mistakeFilter='all', notesQuery='';

let editingId=null, mistakeEditingId=null;

const pathInfoMap = (()=>{ const m={}; searchIndex.forEach(x=>m[x.path]=x); return m; })();

function pathInfo(p){ return p ? (pathInfoMap[p]||null) : null; }

function itemSubject(it){
  if(it.path){ const info=pathInfoMap[it.path]; if(info) return info.sub.id; }
  return it.subject || 'other';
}

function pathBreadcrumb(p){
  const info=pathInfoMap[p];
  if(!info) return '';
  return info.parents.slice(1).concat([info.name]).join(' / ');
}

function pathOptionsHtml(){
  let h='<option value="">未分类（综合 / 不绑定考点）</option>';
  SYLLABUS.forEach(sub=>{
    h += '<optgroup label="'+esc(sub.name)+'">';
    sub.chapters.forEach((ch,ci)=>{
      h += '<option value="'+sub.id+'/'+ci+'">'+esc(ch.name)+'</option>';
      ch.sections.forEach((sec,si)=>{
        const sp=sub.id+'/'+ci+'/'+si;
        h += '<option value="'+sp+'">　'+esc(sec.name)+'</option>';
        sec.topics.forEach((tp,ti)=>{
          h += '<option value="'+sp+'/'+ti+'">　　'+esc(tp.name)+'</option>';
        });
      });
    });
    h += '</optgroup>';
  });
  return h;
}

function fillPathSelects(){
  const html=pathOptionsHtml();
  const a=$('#notePath'), b=$('#mistakePath'), c=$('#practicePath');
  if(a) a.innerHTML=html;
  if(b) b.innerHTML=html;
  if(c) c.innerHTML=html;
  const s=$('#notesSubject');
  if(s && !s.dataset.filled){
    let oh='<option value="all">全部学科</option>';
    SYLLABUS.forEach(sub=>{ oh+='<option value="'+sub.id+'">'+esc(sub.name)+'</option>'; });
    oh+='<option value="other">未分类 / 综合</option>';
    s.innerHTML=oh; s.dataset.filled='1';
  }
}

function genItemId(p){ return 'it'+Date.now()+Math.random().toString(36).slice(2,7)+(p||''); }

function getItem(id){ return state.items.find(x=>x.id===id)||null; }

function itemsOf(path){ return state.items.filter(x=>x.path===path).sort((a,b)=>(b.updated||0)-(a.updated||0)); }

function countItems(kind){ return kind ? state.items.filter(x=>x.kind===kind).length : state.items.length; }

function stripMd(s){
  return (s||'').replace(/```[\s\S]*?```/g,' ').replace(/\$[^$]*\$/g,' ')
    .replace(/[#>*_`~!\[\]()]/g,' ').replace(/https?:\S+/g,' ').replace(/drawing:\/\/\S+/g,' ')
    .replace(/\s+/g,' ').trim();
}

function itemTitle(it){
  if(it.title && it.title.trim()) return it.title.trim();
  if(it.kind==='mistake') return stripMd(it.question).slice(0,24) || '未命名错题';
  if(it.kind==='map') return it.title || '未命名导图';
  return stripMd(it.content).slice(0,24) || '未命名笔记';
}

function mapNodeText(n){ let s=n.text||''; (n.children||[]).forEach(c=>{ s+=' '+mapNodeText(c); }); return s; }

function itemSearchText(it){
  if(it.kind==='note') return (it.title||'')+' '+(it.content||'');
  if(it.kind==='mistake') return [it.title,it.question,it.wrong,it.analysis].join(' ');
  if(it.kind==='map') return (it.title||'')+' '+(it.root?mapNodeText(it.root):'');
  return it.title||'';
}

function itemDigestHtml(it){
  if(it.kind==='map') return esc((it.root?mapNodeCount(it.root):0)+' 个主题 · 大纲 / 思维导图双视图');
  return mdRenderMath((it.kind==='mistake' ? (it.question||'') : (it.content||''))||'');
}

function journalDigest(it){
  if(it.kind==='map') return (it.root?mapNodeCount(it.root):0)+' 个主题 · 大纲 / 思维导图';
  return stripMd(it.kind==='mistake' ? (it.question||'') : (it.content||'')).slice(0,80);
}

function setItemSubject(it){ it.subject=itemSubject(it); }

function deleteItem(id){
  const it=getItem(id); if(!it) return;
  const text=[it.content,it.question,it.wrong,it.analysis].join(' ');
  (text.match(/drawing:\/\/[\w]+/g)||[]).forEach(d=>{ delete state.drawings[d.replace(/^drawing:\/\//,'')]; });
  state.items = state.items.filter(x=>x.id!==id);
  saveState();
}

function bindDelConfirm(btn, fn){
  if(!btn.classList.contains('confirming')){
    btn.classList.add('confirming'); const old=btn.textContent; btn.textContent='确认';
    setTimeout(()=>{ btn.classList.remove('confirming'); btn.textContent=old; },2600);
    return;
  }
  fn();
}

function afterItemChange(){
  saveState();
  const rt=currentRoute();
  if(rt.type==='notes' || rt.type==='maps') renderNotes();
  else if(rt.type==='tree' && typeof renderDetail==='function') renderDetail();
  renderSidebar();
}

function filteredItems(){
  let list=state.items.slice().sort((a,b)=>(b.updated||0)-(a.updated||0));
  if(kindFilter!=='all') list=list.filter(x=>x.kind===kindFilter);
  if(subjFilter!=='all') list=list.filter(x=>itemSubject(x)===subjFilter);
  if(mistakeFilter!=='all') list=list.filter(x=>x.kind==='mistake' && x.status===mistakeFilter);
  if(notesQuery){ const q=notesQuery.toLowerCase(); list=list.filter(x=>itemSearchText(x).toLowerCase().includes(q)); }
  return list;
}

function reviewTagHtml(it){
  const r=reviewState(it);
  if(r.code==='done') return '<span class="rv-tag rv-done">已巩固 '+r.total+'/'+r.total+'</span>';
  const round=(r.stage+1)+'/'+r.total;
  if(r.code==='due') return r.overdueDays>=1
    ? '<span class="rv-tag rv-over">逾期'+r.overdueDays+'天 · '+round+'</span>'
    : '<span class="rv-tag rv-due">今日复习 · '+round+'</span>';
  return '<span class="rv-tag rv-up">'+r.daysLeft+'天后 · '+round+'</span>';
}

function renderReviewPanel(){
  const el=$('#reviewPanel'); if(!el) return;
  if(!state.items.length){ el.innerHTML=''; el.style.display='none'; return; }
  state.items.forEach(ensureReview);
  const now=Date.now();
  const due=state.items.filter(x=>reviewState(x,now).code==='due').sort((a,b)=>a.rv.next-b.rv.next);
  if(due.length){
    const rows=due.slice(0,5).map(it=>{
      const k=ITEM_KINDS[it.kind]||ITEM_KINDS.note, r=reviewState(it,now), info=pathInfo(it.path);
      const where=info? esc(info.sub.name+' · '+pathBreadcrumb(it.path)) : '未分类';
      const sched=r.overdueDays>=1?('已逾期 '+r.overdueDays+' 天'):'今日到期';
      const openAttr=it.kind==='map'?'data-open-map="'+it.id+'"':'data-edit-item="'+it.id+'"';
      return '<div class="rv-row" style="--kc:'+k.color+'"><span class="rv-k">'+k.label+'</span>'
        +'<div class="rv-m"><div class="rv-t" '+openAttr+'>'+esc(itemTitle(it))+'</div>'
        +'<div class="rv-p">'+where+'</div></div>'
        +'<div class="rv-sched">'+sched+'<br>第 '+(r.stage+1)+'/'+r.total+' 轮</div>'
        +'<button class="rv-go" data-review="'+it.id+'">复习 ✓</button></div>';
    }).join('');
    const more=due.length>5?'<div class="rv-more">还有 '+(due.length-5)+' 条到期，可在下方卡片中逐条复习</div>':'';
    el.style.display='';
    el.innerHTML='<div class="rv-panel"><div class="rv-head"><h3><span class="rv-ico"></span>今日待复习<span class="rv-badge">'+due.length+'</span></h3>'
      +'<span class="rv-sub">按艾宾浩斯遗忘曲线安排，间隔 1 / 2 / 4 / 7 / 15 / 30 天，每完成一轮自动安排下一次</span></div>'
      +'<div class="rv-list">'+rows+more+'</div></div>';
  }else{
    const up=state.items.filter(x=>reviewState(x,now).code==='upcoming').sort((a,b)=>a.rv.next-b.rv.next)[0];
    const doneN=state.items.filter(x=>reviewState(x,now).code==='done').length;
    el.style.display='';
    el.innerHTML='<div class="rv-panel all-done"><div class="rv-head"><h3><span class="rv-ico"></span>今日复习已完成</h3>'
      +'<span class="rv-sub">'+(up?('下一条「'+esc(itemTitle(up))+'」'+reviewState(up,now).daysLeft+' 天后到期（'+fmtTime(up.rv.next)+'）'):('全部 '+doneN+' 条记录均已完成巩固轮次'))+'</span></div></div>';
  }
}

function itemCard(it){
  const k=ITEM_KINDS[it.kind]||ITEM_KINDS.note;
  const info=pathInfo(it.path);
  const topic = (it.path && info)
    ? '<div class="ncard-topic" data-goto-tree="'+it.path+'"><span class="tc-label">考点</span><span class="tc-name">'+esc(info.sub.name+' · '+pathBreadcrumb(it.path))+'</span></div>'
    : '<div class="ncard-topic uncat"><span class="tc-label">未分类</span><span class="tc-name">编辑可关联到具体考点</span></div>';
  let stat='';
  if(it.kind==='mistake'){ const done=it.status==='mastered';
    stat='<span class="tag sttag '+(done?'st-mastered':'st-open')+'">'+(done?'已掌握':'待复习')+'</span>'; }
  const openAttr = it.kind==='map' ? 'data-open-map="'+it.id+'"' : 'data-edit-item="'+it.id+'"';
  const openLabel = it.kind==='map' ? '打开' : '编辑';
  return '<div class="ncard" style="--nc:'+k.color+'"><div class="ncard-body">'
    +'<div class="ncard-meta"><span class="tag sub k-'+it.kind+'">'+k.label+'</span>'+stat+reviewTagHtml(it)+'</div>'
    +topic
    +'<div class="ncard-title">'+esc(itemTitle(it))+'</div>'
    +'<div class="ncard-text">'+itemDigestHtml(it)+'</div></div>'
    +'<div class="ncard-foot"><span class="ncard-time">添加于 '+(it.created?fmtTime(it.created):'')+'</span>'
    +'<span class="ncard-act">'+(reviewState(it).code==='due'?'<button class="rv-go" data-review="'+it.id+'">复习</button>':'')+'<button class="iconbtn mini primary" '+openAttr+'>'+openLabel+'</button>'
    +'<button class="iconbtn mini danger-btn" data-del-item="'+it.id+'">删除</button></span></div></div>';
}

function journalRow(it){
  const k=ITEM_KINDS[it.kind]||ITEM_KINDS.note;
  const rv=reviewState(it);
  let ops='';
  if(rv.code!=='done') ops+='<button data-review="'+it.id+'"'+(rv.code==='due'?' class="rv-go"':'')+'>'+(rv.code==='due'?'复习 ✓':'提前复习')+'</button>';
  if(it.kind==='map') ops+='<button data-open-map="'+it.id+'">打开</button>';
  else{
    ops+='<button data-edit-item="'+it.id+'">编辑</button>';
    if(it.kind==='mistake'){ const done=it.status==='mastered';
      ops+='<button data-toggle-mistake="'+it.id+'" class="'+(done?'':'del')+'">'+(done?'已掌握':'待复习')+'</button>'; }
  }
  ops+='<button class="del" data-del-item="'+it.id+'">删除</button>';
  const titleClick = it.kind==='map' ? '' : 'data-edit-item="'+it.id+'"';
  const rvTxt = rv.code==='done' ? ('已完成 '+rv.total+' 轮巩固') : (reviewLabel(it)+' · 第 '+(rv.stage+1)+'/'+rv.total+' 轮');
  return '<div class="sj-item" style="--kc:'+k.color+'"><span class="sj-kind">'+k.label+'</span>'
    +'<div class="sj-main"><div class="sj-title" '+titleClick+'>'+(it.kind==='note'&&it.essence?'⭐ ':'')+esc(itemTitle(it))+'</div>'
    +'<div class="sj-preview">'+esc(journalDigest(it))+'</div>'
    +(it.kind==='mistake'&&(it.bookId||it.page||it.chapter)?('<div class="sj-src">'+esc(mistakeSourceText(it))+'</div>'):'')
    +'<div class="sj-rv'+(rv.code==='due'?' over':'')+'">'+esc(rvTxt)+'</div></div>'
    +'<div class="sj-ops">'+ops+'</div></div>';
}

function bindItemCardEvents(scope){
  scope.querySelectorAll('[data-edit-item]').forEach(b=>b.addEventListener('click',()=>openItemById(b.dataset.editItem)));
  scope.querySelectorAll('[data-open-map]').forEach(b=>b.addEventListener('click',()=>{ location.hash='#/map/'+b.dataset.openMap; }));
  scope.querySelectorAll('[data-review]').forEach(b=>b.addEventListener('click',ev=>{
    ev.stopPropagation();
    const it=getItem(b.dataset.review); if(!it) return;
    doReview(it); const r=reviewState(it);
    toast(r.code==='done' ? ('已完成全部 '+REVIEW_INTERVALS.length+' 轮复习，巩固完成') : ('复习完成 · 下次 '+REVIEW_INTERVALS[r.stage]+' 天后'));
    afterItemChange();
  }));
  scope.querySelectorAll('[data-goto-tree]').forEach(b=>b.addEventListener('click',ev=>{ ev.stopPropagation(); location.hash='#/tree/'+b.dataset.gotoTree; }));
  scope.querySelectorAll('[data-del-item]').forEach(b=>b.addEventListener('click',()=>{
    bindDelConfirm(b,()=>{ deleteItem(b.dataset.delItem); afterItemChange(); toast('已删除'); });
  }));
}

function renderNotes(){
  fillPathSelects();
  renderReviewPanel();
  { const _rvp=$('#reviewPanel'); if(_rvp) bindItemCardEvents(_rvp); }
  const cnt=$('#notesCount');
  if(cnt) cnt.textContent='共 '+state.items.length+' 条 · 笔记 '+countItems('note')+' · 导图 '+countItems('map')+' · 错题 '+countItems('mistake');
  document.querySelectorAll('#kindFilters button').forEach(b=>b.classList.toggle('on', b.dataset.kind===kindFilter));
  const ss=$('#notesSubject'); if(ss) ss.value=subjFilter;
  const ms=$('#mistakeStatus'); if(ms) ms.value=mistakeFilter;
  const grid=$('#notesGrid');
  const list=filteredItems();
  if(!list.length){
    const empty = state.items.length
      ? '<h3>没有匹配的记录</h3><p>换个类型、学科、状态或关键词试试。</p>'
      : '<h3>还没有学习记录</h3><p>在任意考点详情页可添加「笔记 / 导图 / 错题」，自动关联到该考点；也可用右上角按钮直接新建。</p>';
    grid.innerHTML='<div class="d-empty"><div class="de-glyph"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h11l5 5v11H4z"/><path d="M15 4v5h5"/><path d="M8 13h8M8 17h6"/></svg></div>'+empty+'</div>';
  }else{
    grid.innerHTML=list.map(itemCard).join('');
    renderMath(grid);
    bindItemCardEvents(grid);
  }
  const r=currentRoute();
  if(r.id && (r.type==='notes')){ const deep=r.id; setTimeout(()=>openItemById(deep),0); }
}
/* ---- 笔记编辑器（关联考点） ---- */

/* ---- 笔记编辑器（关联考点） ---- */
function openNoteEditor(id, presetPath){
  fillPathSelects();
  editingId=id||null;
  const n=id?getItem(id):null;
  $('#noteEditorTitle').textContent=n?'编辑笔记':'添加新笔记';
  $('#noteTitle').value=n?(n.title||''):'';
  $('#notePath').value=n?(n.path||''):(presetPath||'');
  $('#noteContent').value=n?(n.content||''):'';
  const _ne=$('#noteEssence'); if(_ne) _ne.checked=!!(n&&n.essence);
  $('#noteOverlay').classList.add('open');
  setMdMode('split'); updatePreview();
  $('#noteTitle').focus();
}

function closeNoteEditor(){
  $('#noteOverlay').classList.remove('open'); editingId=null;
  if(location.hash.indexOf('#/notes/')===0) location.hash='#/notes';
}

function saveNote(){
  const title=$('#noteTitle').value.trim();
  const path=$('#notePath').value||'';
  const content=$('#noteContent').value.trim();
  const essence=!!($('#noteEssence')&&$('#noteEssence').checked);
  if(!title){ toast('请填写笔记标题'); $('#noteTitle').focus(); return; }
  const now=Date.now();
  let it=editingId?getItem(editingId):null;
  if(it){ it.title=title; it.path=path; it.content=content; it.essence=essence; it.updated=now; ensureReview(it); setItemSubject(it); }
  else{ it={id:genItemId('n'),kind:'note',path,subject:'other',title,content,essence,created:now,updated:now,rv:newReview(now)};
    setItemSubject(it); state.items.push(it); }
  saveState(); closeNoteEditor(); afterItemChange(); recheckMastery(path); toast('笔记已保存');
}
/* ---- 错题编辑器（关联考点） ---- */

/* ---- 错题编辑器（关联考点） ---- */
function openMistakeEditor(id, presetPath){
  fillPathSelects();
  mistakeEditingId=id||null;
  const m=id?getItem(id):null;
  $('#mistakeEditorTitle').textContent=m?'编辑错题':'添加错题';
  $('#mistakeTitle').value=m?(m.title||''):'';
  $('#mistakePath').value=m?(m.path||''):(presetPath||'');
  $('#mistakeQuestion').value=m?(m.question||''):'';
  $('#mistakeWrong').value=m?(m.wrong||''):'';
  $('#mistakeAnalysis').value=m?(m.analysis||''):'';
  $('#mistakeStatusInput').value=m?(m.status||'open'):'open';
  $('#mistakeChapter').value=m?(m.chapter||''):'';
  $('#mistakePage').value=m?(m.page||''):'';
  $('#mistakeQno').value=m?(m.qno||''):'';
  fillMistakeBook(); const _mb=$('#mistakeBook'); if(m&&m.bookId&&_mb) _mb.value=m.bookId;
  refreshMistakeReasons(m?(m.reasons||[]):[]);
  $('#mistakeOverlay').classList.add('open');
  $('#mistakeQuestion').focus();
}

function closeMistakeEditor(){
  $('#mistakeOverlay').classList.remove('open'); mistakeEditingId=null;
  if(location.hash.indexOf('#/notes/')===0) location.hash='#/notes';
}

function saveMistake(){
  const path=$('#mistakePath').value||'';
  const question=$('#mistakeQuestion').value.trim();
  if(!question){ toast('请填写题干（或题目内容）'); $('#mistakeQuestion').focus(); return; }
  const title=$('#mistakeTitle').value.trim();
  const wrong=$('#mistakeWrong').value.trim();
  const analysis=$('#mistakeAnalysis').value.trim();
  const status=$('#mistakeStatusInput').value||'open';
  const bookId=$('#mistakeBook').value, chapter=$('#mistakeChapter').value.trim(), page=$('#mistakePage').value.trim(), qno=$('#mistakeQno').value.trim();
  const reasons=selectedReasons($('#mistakeReasons'));
  const now=Date.now();
  let m=mistakeEditingId?getItem(mistakeEditingId):null;
  if(m){ Object.assign(m,{title,path,question,wrong,analysis,status,bookId,chapter,page,qno,reasons,updated:now}); ensureReview(m); setItemSubject(m); }
  else{ m={id:genItemId('k'),kind:'mistake',path,subject:'other',title,question,wrong,analysis,status,bookId,chapter,page,qno,reasons,created:now,updated:now,rv:newReview(now)};
    setItemSubject(m); state.items.push(m); }
  saveState(); closeMistakeEditor(); afterItemChange(); recheckMastery(path); toast('错题已保存');
}

function openItemById(id){
  const it=getItem(id); if(!it) return;
  if(it.kind==='map'){ location.hash='#/map/'+it.id; }
  else if(it.kind==='mistake'){ openMistakeEditor(id); }
  else { openNoteEditor(id); }
}
/* ---- 新建导图（关联考点） ---- */

/* ---- 新建导图（关联考点） ---- */
function newMap(presetPath){
  const n=countItems('map')+1;
  const m={ id:genItemId('m'), kind:'map', path:presetPath||'', subject:'other',
    title:'未命名导图 '+n, root:newNode('中心主题'), created:Date.now(), updated:Date.now(), rv:newReview() };
  setItemSubject(m); state.items.push(m);
  saveState(); renderSidebar();
  location.hash='#/map/'+m.id;
  return m;
}

/* ============================================================
 * Markdown 渲染（marked + highlight.js，转义原始 HTML 防注入）
 * ============================================================ */

Object.assign(globalThis, { emptyBox, emptyDetail, ITEM_KINDS, kindFilter, editingId, pathInfoMap, pathInfo, itemSubject, pathBreadcrumb, pathOptionsHtml, fillPathSelects, genItemId, getItem, itemsOf, countItems, stripMd, itemTitle, mapNodeText, itemSearchText, itemDigestHtml, journalDigest, setItemSubject, deleteItem, bindDelConfirm, afterItemChange, filteredItems, reviewTagHtml, renderReviewPanel, itemCard, journalRow, bindItemCardEvents, renderNotes, openNoteEditor, closeNoteEditor, saveNote, openMistakeEditor, closeMistakeEditor, saveMistake, openItemById, newMap });
export { emptyBox, emptyDetail, ITEM_KINDS, kindFilter, editingId, pathInfoMap, pathInfo, itemSubject, pathBreadcrumb, pathOptionsHtml, fillPathSelects, genItemId, getItem, itemsOf, countItems, stripMd, itemTitle, mapNodeText, itemSearchText, itemDigestHtml, journalDigest, setItemSubject, deleteItem, bindDelConfirm, afterItemChange, filteredItems, reviewTagHtml, renderReviewPanel, itemCard, journalRow, bindItemCardEvents, renderNotes, openNoteEditor, closeNoteEditor, saveNote, openMistakeEditor, closeMistakeEditor, saveMistake, openItemById, newMap };
