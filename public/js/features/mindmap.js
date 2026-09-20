// 模块: mindmap（由单文件重构拆分；顶层符号经 main.js 聚合为全局，保持零构建原生 ESM）

const MM_TOTAL=726;
function mmEnsure(){ if(!state.mindmap||typeof state.mindmap.pos!=='number'){ state.mindmap={pos:1,seen:{}}; } if(!state.mindmap.seen)state.mindmap.seen={}; return state.mindmap; }
function mmImgSrc(p){ return 'data/mindmap/p'+String(p).padStart(3,'0')+'.jpg'; }
function mmGo(p){ const m=mmEnsure(); p=parseInt(p,10); if(isNaN(p))return; p=Math.max(1,Math.min(MM_TOTAL,p)); m.pos=p; m.seen[String(p)]=1; saveState(); renderMindmap(); try{renderSidebar();}catch(e){} }
function mmJump(){ const i=$('#mmInput'); if(i)mmGo(i.value); }
function renderMindmap(){
  const app=$('#mindmapApp'); if(!app)return; const m=mmEnsure(); const p=m.pos;
  if(!m.seen[String(p)]){ m.seen[String(p)]=1; try{saveState();}catch(e){} }
  const seen=Object.keys(m.seen).length, pct=Math.round(100*seen/MM_TOTAL);
  app.innerHTML=
   '<div class="mm-hero"><div>已看进度</div><div class="pbar" style="margin:8px 0 0;height:8px"><i style="width:'+pct+'%;background:#8e44ad;display:block;height:100%;border-radius:4px"></i></div>'
   +'<div class="mm-meta">已看 <b>'+seen+'</b> / '+MM_TOTAL+' 页（'+pct+'%）　·　上次看到第 <b>'+p+'</b> 页，进度自动云端同步</div></div>'
   +'<div class="mm-card"><div class="mm-page">第 '+p+' / '+MM_TOTAL+' 页</div>'
   +'<img id="mmImg" class="mm-img" src="'+mmImgSrc(p)+'" alt="思维导图第'+p+'页"></div>'
   +'<div class="mm-ctrl">'
   +'<button class="mm-btn" onclick="mmGo(1)">首页</button>'
   +'<button class="mm-btn mm-prev" '+(p<=1?'disabled':'')+' onclick="mmGo('+(p-1)+')">‹ 上一页</button>'
   +'<div class="mm-jump">第 <input id="mmInput" type="number" min="1" max="'+MM_TOTAL+'" value="'+p+'"> 页 <button class="mm-btn" onclick="mmJump()">跳转</button></div>'
   +'<button class="mm-btn mm-next" '+(p>=MM_TOTAL?'disabled':'')+' onclick="mmGo('+(p+1)+')">下一页 ›</button>'
   +'<button class="mm-btn" onclick="mmGo('+MM_TOTAL+')">末页</button>'
   +'</div><div class="mm-tip">可用键盘 ← / → 翻页；每页是一张思维导图，按记忆卡方式反复翻看。</div>';
}
if(!window._mmBound){ window._mmBound=1; document.addEventListener('keydown',function(e){ try{ if(currentRoute().type!=='mindmap')return; }catch(err){ return; } if(e.key==='ArrowLeft'){ mmGo(mmEnsure().pos-1); } else if(e.key==='ArrowRight'){ mmGo(mmEnsure().pos+1); } }); }

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
function readingSideMeta(){ try{ return readingBuild().doneN+' / 200 篇'; }catch(e){ return '200 篇'; } }
function mindmapSideMeta(){ try{ const m=state.mindmap; const n=m?Object.keys(m.seen||m.done||{}).length:0; return n?('已看 '+n+' / 726'):'726 页导图'; }catch(e){ return '726 页导图'; } }

Object.assign(globalThis, { MM_TOTAL, mmEnsure, mmImgSrc, mmGo, mmJump, renderMindmap, renderWords, renderWordsAbc, wIO, wLetterGroups, fillLetter, renderWordsList, wLetterOf, locateLastWord, wBookSrcSel, wordRow, wJumpWord, wToggleRow, wQuick, wAddEx, renderWordsStudy, renderOverview, engMasteryPct, readingSideMeta, mindmapSideMeta });
export { MM_TOTAL, mmEnsure, mmImgSrc, mmGo, mmJump, renderMindmap, renderWords, renderWordsAbc, wIO, wLetterGroups, fillLetter, renderWordsList, wLetterOf, locateLastWord, wBookSrcSel, wordRow, wJumpWord, wToggleRow, wQuick, wAddEx, renderWordsStudy, renderOverview, engMasteryPct, readingSideMeta, mindmapSideMeta };
