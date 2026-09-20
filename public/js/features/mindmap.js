// 模块: mindmap —— 思维导图速记（726 页翻页卡）

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

function mindmapSideMeta(){ try{ const m=state.mindmap; const n=m?Object.keys(m.seen||m.done||{}).length:0; return n?('已看 '+n+' / 726'):'726 页导图'; }catch(e){ return '726 页导图'; } }

Object.assign(globalThis, { MM_TOTAL, mmEnsure, mmImgSrc, mmGo, mmJump, renderMindmap, mindmapSideMeta });
export { MM_TOTAL, mmEnsure, mmImgSrc, mmGo, mmJump, renderMindmap, mindmapSideMeta };
