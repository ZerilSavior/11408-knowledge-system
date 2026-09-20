// 模块: words —— 英语词汇（词库状态、三态轮播/艾宾浩斯、字母列表渲染、学习卡、英语综合掌握度）

const WORDS=(typeof window.WORDS_DATA!=='undefined'&&Array.isArray(window.WORDS_DATA))?window.WORDS_DATA:[];

const WORD_DAILY_DEF=80;

let wSession=null;

const wView={letter:'a',kw:'',showAll:false,openKey:'',locateKey:''};

function wDailyN(){ return planWordPerDay(); }

function normWord(s){ return String(s).toLowerCase().trim().replace(/\s+/g,' '); }

function wKey(i){ return normWord(WORDS[i][0]); }

function wRelData(){ return (typeof window.WORD_REL!=='undefined'&&window.WORD_REL)?window.WORD_REL:{}; }

function wRareByKey(k){ const R=(typeof window.WORDS_RARE!=='undefined')?window.WORDS_RARE:null; return (R&&R[k])?R[k]:null; }

function wRare(i){ return wRareByKey(wKey(i)); }
/* 旧版按数字索引记录，词库重排后无法映射，检测到则作废（一次性） */

/* 旧版按数字索引记录，词库重排后无法映射，检测到则作废（一次性） */
function migrateWords(){
  if(!state.words||typeof state.words!=='object') state.words={};
  const keys=Object.keys(state.words);
  if(keys.length && keys.every(k=>/^\d+$/.test(k))){ state.words={}; try{saveState();}catch(e){} }
}

function wEnsure(i){
  migrateWords();
  const k=wKey(i); let r=state.words[k];
  if(!r){ r={m:0,c1:0,c2:0,c3:0,diff:0,rv:{stage:0,count:0,last:0,next:Date.now()+RV_DAY}}; state.words[k]=r; }
  if(!r.rv)r.rv={stage:0,count:0,last:0,next:Date.now()+RV_DAY};
  if(r.c1==null)r.c1=0; if(r.c2==null)r.c2=0; if(r.c3==null)r.c3=0; if(r.diff==null)r.diff=0;
  if(!r.ex)r.ex=[];
  return r;
}
/* 累加三态次数与难度分：认识+0 模糊+1 不认识+2 */

/* 累加三态次数与难度分：认识+0 模糊+1 不认识+2 */
function wBump(i,g){
  const r=wEnsure(i);
  if(g===1)r.c1=(r.c1||0)+1; else if(g===2)r.c2=(r.c2||0)+1; else if(g===3)r.c3=(r.c3||0)+1;
  r.diff=(r.c2||0)+2*(r.c3||0); r.m=g; return r;
}

function wStats(){
  migrateWords();
  let learned=0,done=0,due=0; const now=Date.now();
  for(let i=0;i<WORDS.length;i++){ const r=state.words[wKey(i)]; if(!r||!r.rv||!r.rv.last)continue; learned++; const c=reviewState(r,now).code; if(c==='done')done++; else if(c==='due')due++; }
  return {total:WORDS.length,learned,done,due};
}

function wDueIdxs(now){
  now=now||Date.now(); migrateWords(); const a=[];
  for(let i=0;i<WORDS.length;i++){ const r=state.words[wKey(i)]; if(r&&r.rv&&r.rv.last&&reviewState(r,now).code==='due')a.push(i); }
  return a.sort((x,y)=>((state.words[wKey(x)].rv.next)||0)-((state.words[wKey(y)].rv.next)||0));
}

function wNewIdxs(n){
  migrateWords(); const a=[];
  for(let i=0;i<WORDS.length&&a.length<n;i++){ const r=state.words[wKey(i)]; if(!r||!r.rv||!r.rv.last)a.push(i); } return a;
}
/* 列表 / 一次性评分：三档完整艾宾浩斯 */

/* 列表 / 一次性评分：三档完整艾宾浩斯 */
function wGrade(i,g){
  const r=wBump(i,g),now=Date.now(),rv=r.rv; const first=!rv.last; rv.last=now;
  if(g===1){
    if(first){ rv.stage=0; rv.next=now+RV_DAY*REVIEW_INTERVALS[0]; }
    else { rv.stage=Math.min(rv.stage+1,REVIEW_INTERVALS.length); rv.count=rv.stage;
           rv.next=rv.stage>=REVIEW_INTERVALS.length?null:now+RV_DAY*REVIEW_INTERVALS[rv.stage]; }
  } else if(g===2){ rv.stage=Math.max(rv.stage,0); rv.next=now+RV_DAY; }
  else { rv.stage=0; rv.count=0; rv.next=now+RV_DAY; }
  state.wordLast=wKey(i); saveState();
}
/* 卡片轮播中途：模糊/不认识只累加次数与难度、不入艾宾浩斯；只有认识才 wGrade(1) 推进 */

/* 卡片轮播中途：模糊/不认识只累加次数与难度、不入艾宾浩斯；只有认识才 wGrade(1) 推进 */
function wMark(i,g){ if(g===1)return wGrade(i,1); wBump(i,g); state.wordLast=wKey(i); try{saveState();}catch(e){} }

function mergeWords(local,cloud){
  const out={}; const keys=new Set([].concat(Object.keys(local||{}),Object.keys(cloud||{})));
  keys.forEach(k=>{ if(/^\d+$/.test(k))return; const a=(local||{})[k],b=(cloud||{})[k];
    if(!a&&b)out[k]=b; else if(!b)out[k]=a; else {
      const ap=(a.rv&&a.rv.stage)||0,bp=(b.rv&&b.rv.stage)||0,al=(a.rv&&a.rv.last)||0,bl=(b.rv&&b.rv.last)||0;
      const win=((bp>ap)||(bp===ap&&bl>al))?b:a; out[k]=win;
      win.c1=Math.max(a.c1||0,b.c1||0); win.c2=Math.max(a.c2||0,b.c2||0); win.c3=Math.max(a.c3||0,b.c3||0);
      win.diff=Math.max(a.diff||0,b.diff||0);
      win.ex=(a.ex&&b.ex)?((a.ex.length>=b.ex.length)?a.ex:b.ex):(a.ex||b.ex||[]);
    }
  });
  return out;
}
/* ===== 卡片轮播：当批先全过一遍，模糊+不认识进下一轮，直到全部认识 ===== */

/* ===== 卡片轮播：当批先全过一遍，模糊+不认识进下一轮，直到全部认识 ===== */
function wStart(){
  migrateWords();
  const due=wDueIdxs(), nw=wNewIdxs(wDailyN());
  const batch=due.concat(nw);
  wSession={batch, cur:batch.slice(), nxt:[], pos:0, round:1, due:due.length, neww:nw.length, flipped:false, stats:{1:0,2:0,3:0}, graded:0};
  renderWords();
}

function wQuit(){ wSession=null; renderWords(); }

function wFlip(){ if(wSession){wSession.flipped=!wSession.flipped; renderWords();} }

function wAnswer(g){
  const s=wSession; if(!s||s.pos>=s.cur.length)return;
  const i=s.cur[s.pos];
  if(g===1){ wGrade(i,1); s.stats[1]++; s.graded++; }
  else { wMark(i,g); s.stats[g]++; s.nxt.push(i); }
  s.pos++; s.flipped=false;
  if(s.pos>=s.cur.length){ if(s.nxt.length){ s.cur=s.nxt; s.nxt=[]; s.pos=0; s.round++; } }
  renderWords();
}

function wTag(i){
  const t=WORDS[i]&&WORDS[i][3]; if(!t)return '';
  const parts=String(t).split(/[、,，\/]/).map(x=>x.trim()).filter(Boolean);
  const main=parts[0]||''; let st='',l=main;
  if(main.indexOf('红宝书')>=0){st='background:#eef2ff;color:#4f46e5';l='红宝书';}
  else if(main.indexOf('大纲')>=0){st='background:#e3f6ee;color:#0a8a5f';l='大纲';}
  else if(main.indexOf('核心词组')>=0){st='background:#fff0e2;color:#c2560a';l='词组';}
  else if(main.indexOf('拓展词组')>=0){st='background:#fdeef0;color:#c0392b';l='词组';}
  else {st='background:#eef1f5;color:#5a6472';}
  const title=parts.join('、');
  return '<span style="'+st+';font-size:10px;font-weight:600;padding:1px 7px;border-radius:9px;margin-left:7px;vertical-align:middle" title="'+wEsc(title)+'">'+wEsc(l)+(parts.length>1?(' +'+(parts.length-1)):'')+'</span>';
}

function wRvTag(i){
  const r=state.words[wKey(i)]; if(!r||!r.rv||!r.rv.last)return '';
  const c=reviewState(r).code;
  if(c==='done')return '<span class="w-rv done">已巩固</span>';
  if(c==='due')return '<span class="w-rv due">待复习</span>';
  return '<span class="w-rv up">'+reviewLabel(r)+'</span>';
}

function wLetters(){
  const m={};
  WORDS.forEach((x,i)=>{ const ch=x[0][0]; const L=/[a-z]/i.test(ch)?ch.toLowerCase():'#'; (m[L]=m[L]||[]).push(i); });
  return m;
}

function wEsc(s){ return String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

function wordEngCard(){
  const st=wStats(), pct=st.total?Math.round(100*st.learned/st.total):0;
  return '<div class="w-engmini"><div class="et"><span>大纲词汇</span><span>'+st.learned+' / '+st.total+' · 巩固 '+st.done+(st.due?' · 待复习 '+st.due:'')+'</span></div>'
    +'<div class="pbar"><i style="width:'+pct+'%;background:var(--net);display:block;height:100%;border-radius:4px"></i></div>'
    +'<button class="wgo" onclick="location.hash=\'#/words\'">背单词 / 复习'+(st.due?' ('+st.due+')':'')+'</button></div>';
}

function wordSidebarItem(){
  const st=wStats(), wa=(currentRoute().type==='words');
  return '<button class="snav '+(wa?'active':'')+'" data-goto="#/words" style="'+(wa?'border-left:3px solid var(--net)':'')+'">'
   +'<span class="scol" style="background:var(--net);'+(wa?'':'opacity:.5')+'"></span>'
   +'<span class="sinfo"><span class="sname">英语词汇<span class="en">WORDS</span></span>'
   +'<span class="smeta">'+st.learned+' / '+st.total+' 已背'+(st.done?' · 巩固 '+st.done:'')+'</span></span>'
   +(st.due?'<span class="wbadge">'+st.due+'</span>':'<span class="spct" style="color:var(--net)">'+(st.total?Math.round(100*st.learned/st.total):0)+'%</span>')+'</button>';
}

/* ================= 个性化学习计划 v3 =================
   子科自定义每日时长（数学3科/408四科，带下限校验）
   已学章节考点 0.5h 且与新考点新旧穿插
   政治：有笔记即完成、时政(poli6)只在真题月排、可排到考前一天
   单词默认 1000/天，阅读目标考研当天 */

function renderWords(){
  const app=$('#wordsApp'); if(!app)return;
  if(!WORDS.length){ app.innerHTML='<div class="w-hero">词库数据未加载（data/words.js）。部署后的网址可正常加载；若本地双击打开被浏览器拦截，请通过线上域名访问。</div>'; return; }
  migrateWords();
  if(wSession) return renderWordsStudy(app);
  const st=wStats(), pct=st.total?Math.round(100*st.learned/st.total):0, leftNew=wNewIdxs(wDailyN()).length;
  let h='<div class="w-hero"><div class="w-herotop"><div class="w-stats">'
   +'<div class="w-stat"><div class="n r">'+st.due+'</div><div class="l">待复习</div></div>'
   +'<div class="w-stat"><div class="n">'+leftNew+'</div><div class="l">今日待学新词（目标 '+wDailyN()+'）</div></div>'
   +'<div class="w-stat"><div class="n g">'+st.learned+'</div><div class="l">已背 / '+st.total+'</div></div>'
   +'<div class="w-stat"><div class="n g">'+st.done+'</div><div class="l">已巩固</div></div>'
   +'</div><button class="w-go" onclick="wStart()">开始今日学习</button></div>'
   +'<div class="pbar"><i style="width:'+pct+'%;background:var(--net);display:block;height:100%;border-radius:4px"></i></div>'
   +'<div class="w-herosub">每个单词先整批过一遍，标「模糊 / 不认识」的词会自动进入下一轮，反复到当批全部「认识」才算完成；认识 +0、模糊 +1、不认识 +2 累计难度分。复习按艾宾浩斯 1/2/4/7/15/30 天穿插，进度云端同步。</div></div>';
  h+='<div class="w-tabs"><div class="w-search"><input id="wSearchInput" placeholder="搜索英文单词或中文释义…" value="'+wEsc(wView.kw)+'"></div>'
   +'<button class="w-showall" id="wShowAll" type="button">'+(wView.showAll?'隐藏全部释义':'显示全部释义')+'</button></div>';
  h+='<div class="w-abc" id="wAbc"></div><div class="w-list" id="wList"></div>';
  app.innerHTML=h;
  if(wView.letter==='ALL')wView.letter='a';
  wView.locateKey='';
  renderWordsAbc(); renderWordsList();
  const si=$('#wSearchInput');
  si.addEventListener('input',e=>{ wView.kw=e.target.value; wView.locateKey=''; renderWordsList(); const n=$('#wSearchInput'); n.focus(); const t=n.value; n.setSelectionRange(t.length,t.length); });
  $('#wShowAll').addEventListener('click',()=>{ wView.showAll=!wView.showAll; wView.openKey=''; renderWordsList(); const b=$('#wShowAll'); if(b)b.textContent=wView.showAll?'隐藏全部释义':'显示全部释义'; });
}

function renderWordsAbc(){
  const el=$('#wAbc'); if(!el)return; const Lm=wLetters();
  let h='';
  const keys=Object.keys(Lm).sort();
  keys.forEach(L=>{ if(L==='#'){ h+='<button class="'+(wView.letter===L?'on':'')+'" data-l="#">#</button>'; }
    else h+='<button class="'+(wView.letter===L?'on':'')+'" data-l="'+L+'">'+L.toUpperCase()+'<span class="badge">'+Lm[L].length+'</span></button>'; });
  el.innerHTML=h;
  el.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{wView.letter=b.dataset.l;wView.kw='';wView.openKey='';wView.locateKey='';renderWords();}));
}

let wIO=null;

function wLetterGroups(){ return wLetters(); }

function fillLetter(L,body){
  const Lm=wLetters();
  body.dataset.fill='1';
  body.innerHTML=(Lm[L]||[]).map(wordRow).join('');
}

function renderWordsList(){
  const el=$('#wList'); if(!el)return;
  if(wIO){ try{wIO.disconnect();}catch(e){} wIO=null; }
  const Lm=wLetters();
  const kw=wView.kw.trim().toLowerCase();
  if(kw){
    let idxs=[];
    for(let i=0;i<WORDS.length;i++){ const w=WORDS[i]; if(w[0].toLowerCase().includes(kw)||String(w[2]).toLowerCase().includes(kw))idxs.push(i); if(idxs.length>=300)break; }
    el.innerHTML=idxs.length?('<div class="w-searchres">'+idxs.map(wordRow).join('')+'</div>'):'<div style="color:var(--ink-3);font-size:13px;padding:10px">没有匹配的单词。</div>';
    return;
  }
  const L=wView.letter;
  const arr=Lm[L]||[];
  el.innerHTML='<div class="w-letter"><div class="w-letter-h">'+(L==='#'?'#':L.toUpperCase())+'<span>'+arr.length+'</span></div><div class="w-letter-body" data-l="'+L+'">'+arr.map(wordRow).join('')+'</div></div>';
  locateLastWord();
}

function wLetterOf(word){ const ch=String(word||'')[0]; return /[a-z]/i.test(ch)?ch.toLowerCase():'#'; }

function locateLastWord(){
  const k=wView.locateKey; if(!k)return;
  const idx=WORDS.findIndex(x=>normWord(x[0])===k);
  wView.locateKey='';
  if(idx<0)return;
  setTimeout(()=>{ const row=document.getElementById('wrow'+idx); if(row){ row.scrollIntoView({block:'center'}); row.classList.add('wflash'); setTimeout(()=>row.classList.remove('wflash'),1800); } },120);
}

function wBookSrcSel(i){
  let bs=[]; try{ bs=booksForSub('eng'); }catch(e){ bs=[]; }
  return '<select id="wexsrc'+i+'" class="wr-sel"><option value="">来源（选填）</option>'+bs.map(b=>'<option value="'+wEsc(b.name)+'">'+wEsc(b.name)+'</option>').join('')+'</select>';
}

function wordRow(i){
  const w=WORDS[i], k=wKey(i), r=state.words[k], m=r?r.m:0;
  const open=wView.showAll||wView.openKey===k;
  const rare=wRare(i), rel=wRelData()[k]||null;
  let detail='';
  if(open){
    let mean='<div class="wr-mean">'+wEsc(w[2])+'</div>';
    if(rare) mean+='<div class="wr-rare"><b>僻</b>'+wEsc(rare.r)+(rare.s?'<span class="wr-src">　— '+wEsc(rare.s)+'</span>':'')+'</div>';
    let relh='';
    if(rel&&((rel.der&&rel.der.length)||(rel.syn&&rel.syn.length)||(rel.phr&&rel.phr.length))){
      relh='<div class="wr-rel">';
      if(rel.der&&rel.der.length)relh+='<div class="wr-line"><span class="wr-lab">派生</span>'+rel.der.map(x=>'<a onclick="wJumpWord(\''+wEsc(x.replace(/'/g,''))+'\')">'+wEsc(x)+'</a>').join('、')+'</div>';
      if(rel.syn&&rel.syn.length)relh+='<div class="wr-line"><span class="wr-lab">近义</span><span class="wr-ref">'+rel.syn.map(wEsc).join('、')+'</span></div>';
      if(rel.phr&&rel.phr.length)relh+='<div class="wr-line"><span class="wr-lab">词组</span>'+rel.phr.map(wEsc).join('、')+'</div>';
      relh+='</div>';
    }
    const stat='<div class="wr-stat">认识 ×'+(r?r.c1||0:0)+'　模糊 ×'+(r?r.c2||0:0)+'　不认识 ×'+(r?r.c3||0:0)+'　<b>难度分 '+(r?r.diff||0:0)+'</b></div>';
    let ex='<div class="wr-ex">';
    (r&&r.ex?r.ex:[]).forEach(e=>{ ex+='<div class="wr-exitem">“'+wEsc(e.t)+'”'+(e.s?'<span class="wr-src">　— '+wEsc(e.s)+'</span>':'')+'</div>'; });
    ex+='<textarea id="wex'+i+'" class="wr-ta" rows="2" placeholder="添加阅读例句（原句积累，标注来源）…"></textarea>'
      +'<div class="wr-exrow">'+wBookSrcSel(i)+'<button type="button" class="wr-add" onclick="wAddEx('+i+')">＋例句</button></div></div>';
    detail='<div class="wr-detail">'+mean+relh+stat+ex+'</div>';
  }
  return '<div class="w-row s'+m+(open?' open':'')+'" id="wrow'+i+'" data-wkey="'+wEsc(k)+'">'
   +'<div class="w-main" onclick="wToggleRow('+i+')"><div class="w-topline"><span class="w-word">'+wEsc(w[0])+'</span>'+wTag(i)
   +(rare?'<span class="wr-badge" title="熟词僻义">僻</span>':'')
   +'<span class="w-phon">'+wEsc(w[1])+'</span></div>'
   +(open?'':'<div class="w-mean-hint">点击显示释义'+((r&&r.diff)?'　·　难度分 '+r.diff:'')+'</div>')+'</div>'
   +detail
   +wRvTag(i)
   +'<div class="w-marks" onclick="event.stopPropagation()">'
   +'<button class="w-mk k3 '+(m===3?'on':'')+'" onclick="wQuick('+i+',3)">不认识</button>'
   +'<button class="w-mk k2 '+(m===2?'on':'')+'" onclick="wQuick('+i+',2)">模糊</button>'
   +'<button class="w-mk k1 '+(m===1?'on':'')+'" onclick="wQuick('+i+',1)">认识</button>'
   +'</div></div>';
}

function wJumpWord(wd){
  const k=normWord(wd); const idx=WORDS.findIndex(x=>normWord(x[0])===k); if(idx<0)return toast('词库中没有「'+wd+'」');
  wView.letter=wLetterOf(WORDS[idx][0]); wView.kw=''; wView.openKey=k; wView.locateKey=k; renderWords();
}

function wToggleRow(i){ wView.openKey=(wView.openKey===wKey(i))?'':wKey(i); renderWordsList(); }

function wQuick(i,g){ wGrade(i,g); renderWordsAbc(); renderWordsList(); try{renderSidebar();}catch(e){} try{renderPlan();}catch(e){} }

function wAddEx(i){
  const ta=$('#wex'+i); if(!ta)return; const t=ta.value.trim(); if(!t){ toast('请先填写例句内容'); return; }
  const sel=$('#wexsrc'+i); const s=sel?sel.value:'';
  const r=wEnsure(i); r.ex=r.ex||[]; r.ex.push({t,s:s.trim()}); saveState(); toast('例句已保存'); renderWordsList();
}

function renderWordsStudy(app){
  const s=wSession;
  if(!s.batch.length){ app.innerHTML='<div class="w-done"><div class="big">今天没有待学单词</div><div class="counts">到期复习与今日新词都已完成。</div><button class="w-go" onclick="wQuit()">返回词库</button></div>'; return; }
  const finished=(s.pos>=s.cur.length)&&(s.nxt.length===0);
  if(finished){
    app.innerHTML='<div class="w-done"><div class="big">当批全部认识，本轮完成</div>'
      +'<div class="counts">共 '+s.batch.length+' 个（复习 '+s.due+' · 新词 '+s.neww+'）· 共 '+s.round+' 轮<br>认识 '+s.stats[1]+' · 模糊 '+s.stats[2]+' · 不认识 '+s.stats[3]+'</div>'
      +'<div class="w-herosub" style="max-width:520px;margin:0 auto 18px">模糊、不认识的词已在多轮中反复出现直到认识；难度分高的词会在复习中优先安排。</div>'
      +'<button class="w-go" onclick="wQuit()">返回词库</button></div>'; return;
  }
  const i=s.cur[s.pos], w=WORDS[i], rare=wRare(i), r=state.words[wKey(i)];
  const thisLeft=s.cur.length-s.pos;
  app.innerHTML='<div class="w-study"><div class="w-sprog">总进度 '+s.graded+' / '+s.batch.length+'　·　第 '+s.round+' 轮（本轮还剩 '+thisLeft+' 个，模糊/不认识会再出现）</div>'
   +'<div class="w-card'+(s.flipped?' flipped':'')+'" onclick="wFlip()"><div class="cw">'+wEsc(w[0])+wTag(i)+'</div><div class="cp">'+wEsc(w[1])+'</div>'
   +(s.flipped?('<div class="cm">'+wEsc(w[2])+'</div>'+(rare?'<div class="wr-rare card-rare"><b>僻</b>'+wEsc(rare.r)+(rare.s?'<span class="wr-src">　— '+wEsc(rare.s)+'</span>':'')+'</div>':'')
     +'<div class="wcard-stat">认识×'+(r?r.c1||0:0)+' 模糊×'+(r?r.c2||0:0)+' 不认识×'+(r?r.c3||0:0)+' · 难度分 '+(r?r.diff||0:0)+'</div>'):'<div class="ctip">点击卡片显示释义</div>')
   +'</div>'
   +'<div class="w-actions"><button class="w-act a3" onclick="wAnswer(3)">不认识</button><button class="w-act a2" onclick="wAnswer(2)">模糊</button><button class="w-act a1" onclick="wAnswer(1)">认识</button></div>'
   +'<button class="w-quit" onclick="wQuit()">退出本轮</button></div>';
}

function engMasteryPct(){
  let wPart=0; try{ const ws=wStats(); wPart=WORDS.length?ws.learned/WORDS.length:0; }catch(e){}
  let readPart=0; try{ const rb=readingBuild(); readPart=rb.total?(rb.doneN||0)/rb.total:0; }catch(e){}
  let examN=0; try{
    const rec=(state.exams&&state.exams.records)||{};
    examN=Object.keys(rec).filter(k=>k.indexOf('eng_')===0&&rec[k]&&rec[k].doneTs).length;
  }catch(e){}
  const examPart=Math.min(1,examN/10);
  const v=0.6*wPart+0.25*readPart+0.15*examPart;
  return Math.round(100*(isFinite(v)?v:0));
}

Object.assign(globalThis, { WORDS, WORD_DAILY_DEF, wSession, wView, wDailyN, normWord, wKey, wRelData, wRareByKey, wRare, migrateWords, wEnsure, wBump, wStats, wDueIdxs, wNewIdxs, wGrade, wMark, mergeWords, wStart, wQuit, wFlip, wAnswer, wTag, wRvTag, wLetters, wEsc, wordEngCard, wordSidebarItem, renderWords, renderWordsAbc, wIO, wLetterGroups, fillLetter, renderWordsList, wLetterOf, locateLastWord, wBookSrcSel, wordRow, wJumpWord, wToggleRow, wQuick, wAddEx, renderWordsStudy, engMasteryPct });
export { WORDS, WORD_DAILY_DEF, wSession, wView, wDailyN, normWord, wKey, wRelData, wRareByKey, wRare, migrateWords, wEnsure, wBump, wStats, wDueIdxs, wNewIdxs, wGrade, wMark, mergeWords, wStart, wQuit, wFlip, wAnswer, wTag, wRvTag, wLetters, wEsc, wordEngCard, wordSidebarItem, renderWords, renderWordsAbc, wIO, wLetterGroups, fillLetter, renderWordsList, wLetterOf, locateLastWord, wBookSrcSel, wordRow, wJumpWord, wToggleRow, wQuick, wAddEx, renderWordsStudy, engMasteryPct };
