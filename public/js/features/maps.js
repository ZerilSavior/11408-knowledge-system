// 模块: maps（由单文件重构拆分；顶层符号经 main.js 聚合为全局，保持零构建原生 ESM）

function curMap(){

  const r = currentRoute();

  if(r.type!=='map') return null;

  return state.items.find(m=>m.kind==='map' && m.id===r.id) || null;

}

function touchMap(m){

  m.updated = Date.now();

  saveState();

}

function newNode(text){

  return {id:'t'+Date.now()+Math.random().toString(36).slice(2,8), text, children:[]};

}

function mapNodeCount(n){

  return 1 + n.children.reduce((s,c)=>s+mapNodeCount(c),0);

}

function locateNode(m, id){

  if(m.root.id===id) return {node:m.root, parent:null, index:0};

  const stack = [m.root];

  while(stack.length){

    const n = stack.pop();

    for(let i=0;i<n.children.length;i++){

      const c = n.children[i];

      if(c.id===id) return {node:c, parent:n, index:i};

      stack.push(c);

    }

  }

  return null;

}

function outlineRows(){

  const m = curMap();

  if(!m) return [];

  const rows = [];

  (function walk(n, depth){

    rows.push({node:n, depth});

    if(mapOpen[m.id+'/'+n.id]!==false){

      n.children.forEach(c=>walk(c, depth+1));

    }

  })(m.root, 0);

  return rows;

}

function mapAddChild(id, startEdit){

  const m = curMap();

  if(!m) return;

  const loc = locateNode(m, id);

  if(!loc) return;

  const nn = newNode('新主题');

  loc.node.children.push(nn);

  touchMap(m);

  mapSel = nn.id;

  mapEdit = startEdit ? nn.id : '';

  renderMap();

  if(startEdit) focusMapInput(nn.id);

}

function mapAddSibling(id, startEdit){

  const m = curMap();

  if(!m) return;

  const loc = locateNode(m, id);

  if(!loc || !loc.parent) return; // 根主题无同级

  const nn = newNode('新主题');

  loc.parent.children.splice(loc.index+1, 0, nn);

  touchMap(m);

  mapSel = nn.id;

  mapEdit = startEdit ? nn.id : '';

  renderMap();

  if(startEdit) focusMapInput(nn.id);

}

function mapIndent(id){

  const m = curMap();

  const loc = locateNode(m, id);

  if(!loc || !loc.parent || loc.index===0) return;

  const prev = loc.parent.children[loc.index-1];

  loc.parent.children.splice(loc.index, 1);

  prev.children.push(loc.node);

  touchMap(m);

  mapSel = id;

  mapEdit = '';

  renderMap();

}

function mapOutdent(id){

  const m = curMap();

  const loc = locateNode(m, id);

  if(!loc || !loc.parent || loc.parent===m.root) return; // 根层不提升

  const gp = locateNode(m, loc.parent.id);

  if(!gp || !gp.parent) return;

  gp.parent.children.splice(gp.index+1, 0, loc.node);

  loc.parent.children.splice(loc.index, 1);

  touchMap(m);

  mapSel = id;

  mapEdit = '';

  renderMap();

}

function mapCommitText(id, raw){

  const m = curMap();

  const loc = locateNode(m, id);

  if(!loc) return;

  const t = (raw||'').trim();

  if(!t){ mapDelete(id); return; }

  if(loc.node.text===t){ mapEdit=''; renderMap(); return; }

  loc.node.text = t;

  touchMap(m);

  mapEdit = '';

  renderMap();

}

function mapDelete(id){

  const m = curMap();

  if(!m || id===m.root.id) return;

  const loc = locateNode(m, id);

  if(!loc) return;

  loc.parent.children.splice(loc.index, 1);

  if(mapSel===id) mapSel = loc.parent.id;

  if(mapEdit===id) mapEdit = '';

  touchMap(m);

  renderMap();

  toast('主题已删除');

}

function mapDelAsk(id, btn){

  if(!btn.classList.contains('confirming')){

    btn.classList.add('confirming');

    btn.textContent = '确认';

    setTimeout(()=>{ btn.classList.remove('confirming'); btn.textContent='删除'; }, 2600);

    return;

  }

  mapDelete(id);

}

function startMapEdit(id){

  mapSel = id;

  mapEdit = id;

  renderMap();

  focusMapInput(id);

}

function focusMapInput(id){

  requestAnimationFrame(()=>{

    const inp = $('#mapStage .mtext-input[data-edit="'+id+'"]');

    if(inp){ inp.focus(); try{ inp.select(); }catch(e){} }

  });

}

function toggleMapOpen(id){

  const m = curMap();

  const k = m.id+'/'+id;

  mapOpen[k] = mapOpen[k]===false ? true : false;

  renderMap();

}



/* ---------- 渲染：大纲 ---------- */

function renderOutlineStage(stage){

  const m = curMap();

  const rows = outlineRows();

  if(!rows.length){

    stage.innerHTML = `<div class="d-empty"><div class="de-glyph"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6h16M4 12h10M4 18h7"/></svg></div><h3>还没有主题</h3><p>点右上角「添加主题」或按 Enter 开始列大纲。</p></div>`;

    return;

  }

  stage.innerHTML = `<div class="olist">` + rows.map(r=>{

    const n = r.node;

    const isRoot = n===m.root;

    const hasCh = n.children.length>0;

    const open = mapOpen[m.id+'/'+n.id]!==false;

    const sel = mapSel===n.id ? ' sel':'';

    const editing = mapEdit===n.id;

    const textHtml = editing

      ? `<input class="mtext-input" data-edit="${n.id}" value="${esc(n.text)}" spellcheck="false">`

      : `<span class="mtext">${esc(n.text)}</span>`;

    return `<div class="mrow${sel}${isRoot?' root':''}" data-id="${n.id}" style="--d:${r.depth}">

      <button class="mcaret${hasCh?'': ' leaf'}${open?' open':''}" data-toggle="${n.id}" title="${hasCh?(open?'折叠':'展开'):''}">${caretSvg()}</button>

      ${textHtml}

      <span class="mactions">

        ${isRoot?'':`<button class="mact del" data-act="del" data-id="${n.id}">删除</button><button class="mact" data-act="sibling" data-id="${n.id}">同级</button>`}

        <button class="mact primary" data-act="child" data-id="${n.id}">子主题</button>

      </span>

    </div>`;

  }).join('') + `</div>`;

  stage.focus({preventScroll:true});

}



/* ---------- 渲染：思维导图（XMind 式） ---------- */

function mindLayout(root){

  const LEAF_H = 46, LV_W = 230;

  const tc = document.createElement('canvas').getContext('2d');

  tc.font = '13px "Noto Sans SC", sans-serif';

  const tw = t => tc.measureText(t).width;

  function wrap(t){

    const maxW = 216;

    const lines = [];

    let cur = '';

    for(const ch of t){

      if(tw(cur+ch) > maxW){ lines.push(cur); cur = ch; }

      else cur += ch;

    }

    lines.push(cur);

    return lines;

  }

  function countLeaves(n){ return n.children.length ? n.children.reduce((s,c)=>s+countLeaves(c),0) : 1; }

  const nodes = [], edges = [];

  function place(n, depth, side, branch, yStart){

    const leaves = countLeaves(n);

    const band = leaves * LEAF_H;

    const yC = yStart + band/2;

    const lines = wrap(n.text);

    const w = Math.min(Math.max(tw(n.text)+28, 46), 236);

    const h = lines.length*19 + 16;

    const x = (side==='C') ? 0 : (side==='L' ? -1 : 1) * depth * LV_W;

    nodes.push({id:n.id, text:n.text, lines, x, y:yC, w, h, depth, side, branch});

    let y = yStart;

    const k = n.children.length;

    n.children.forEach((c,i)=>{

      let cs, br;

      if(side==='C'){ cs = (i < Math.ceil(k/2)) ? 'L' : 'R'; br = i; }

      else { cs = side; br = branch; }

      place(c, depth+1, cs, br, y);

      edges.push({from:n.id, to:c.id});

      y += countLeaves(c) * LEAF_H;

    });

  }

  place(root, 0, 'C', -1, 0);

  return {nodes, edges};

}

function renderMindStage(stage){

  const m = curMap();

  const {nodes, edges} = mindLayout(m.root);

  const byId = {};

  nodes.forEach(n=>byId[n.id]=n);

  let minX=0, maxX=0, minY=0, maxY=0;

  nodes.forEach(n=>{

    minX = Math.min(minX, n.x - n.w/2);

    maxX = Math.max(maxX, n.x + n.w/2);

    minY = Math.min(minY, n.y - n.h/2);

    maxY = Math.max(maxY, n.y + n.h/2);

  });

  const pad = 34;

  const W = maxX - minX + pad*2, H = maxY - minY + pad*2;

  const dx = pad - minX, dy = pad - minY;

  const edgeSvg = edges.map(e=>{

    const p = byId[e.from], c = byId[e.to];

    const x1 = (c.x < p.x) ? p.x - p.w/2 : p.x + p.w/2;

    const x4 = (c.x < p.x) ? c.x + c.w/2 : c.x - c.w/2;

    const k = Math.max(26, Math.abs(x4-x1)/2);

    return `<path d="M ${x1+dx} ${p.y+dy} C ${x1+dx+k} ${p.y+dy}, ${x4+dx-k} ${c.y+dy}, ${x4+dx} ${c.y+dy}" fill="none" stroke="#C9CDD4" stroke-width="1.6"/>`;

  }).join('');

  const branchColors = ['#0E8A68','#C05B1F','#2E63A8','#6E4BC4','#A97A0B'];

  const nodeSvg = nodes.map(n=>{

    const x = n.x + dx, y = n.y + dy;

    const rx = x - n.w/2, ry = y - n.h/2;

    let fill, stroke, txt;

    if(n.side==='C'){

      fill = '#1B1F24'; stroke = '#1B1F24'; txt = '#FFFFFF';

    } else if(n.depth===1){

      const c = branchColors[n.branch % branchColors.length];

      fill = '#FFFFFF'; stroke = c; txt = '#1B1F24';

    } else {

      fill = '#FFFFFF'; stroke = branchColors[n.branch % branchColors.length]; txt = '#4A4F57';

    }

    const sel = mapSel===n.id;

    const tspans = n.lines.map((l,i)=>`<tspan x="${x}" dy="${i===0? (0.35*19 - (n.lines.length-1)*19/2) : 19}">${esc(l)}</tspan>`).join('');

    return `<g class="mnode${sel?' sel':''}" data-id="${n.id}">

      <rect x="${rx}" y="${ry}" width="${n.w}" height="${n.h}" rx="9" fill="${fill}" stroke="${sel?'#1B1F24':stroke}" stroke-width="${sel?2.6:1.5}"/>

      <text x="${x}" y="${y}" text-anchor="middle" font-size="13" font-family="'Noto Sans SC',sans-serif" fill="${txt}">${tspans}</text>

    </g>`;

  }).join('');

  stage.innerHTML = `<svg class="mmap-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">${edgeSvg}${nodeSvg}</svg>`;

  // 节点的点击 / 双击统一由 #mapStage 上的委托监听处理（见 bindMapEvents），此处不再逐节点绑定

}



/* ---------- 视图调度与事件 ---------- */

function renderMaps(){
  kindFilter='map';
  renderNotes();
}
function renderMap(){

  const m = curMap();

  if(!m){ location.hash = '#/notes'; return; }
  const crumb=$('#mapCrumb');
  if(crumb){
    crumb.innerHTML = (m.path && pathInfo(m.path))
      ? '关联考点 · <a>'+esc(pathInfo(m.path).sub.name+' · '+pathBreadcrumb(m.path))+'</a>'
      : '<span style="font-style:italic">未关联考点（可在学习中心补绑）</span>';
    const a=crumb.querySelector('a');
    if(a) a.addEventListener('click', ()=>{ location.hash='#/tree/'+m.path; });
  }

  const ti = $('#mapTitleInput');

  if(ti && ti.value !== m.title) ti.value = m.title;

  const mode = mapModes[m.id] || 'outline';

  document.querySelectorAll('#mapModeSeg button').forEach(b=>b.classList.toggle('on', b.dataset.mode===mode));

  const stage = $('#mapStage');

  if(mode==='outline') renderOutlineStage(stage);

  else renderMindStage(stage);

}

function bindMapEvents(){

  $('#addMapBtn').addEventListener('click', ()=>{ newMap(''); });
  $('#mapBackBtn').addEventListener('click', ()=>{ const m=curMap(); location.hash=(m&&m.path)?('#/tree/'+m.path):'#/notes'; });

  $('#mapAddRootBtn').addEventListener('click', ()=>{

    const m = curMap();

    if(m) mapAddChild(m.root.id, true);

  });

  $('#mapTitleInput').addEventListener('change', ()=>{

    const m = curMap();

    if(!m) return;

    const v = $('#mapTitleInput').value.trim();

    if(v && v!==m.title){ m.title = v; touchMap(m); }

    else $('#mapTitleInput').value = m.title;

  });

  $('#mapTitleInput').addEventListener('keydown', ev=>{

    if(ev.key==='Enter'){ ev.preventDefault(); $('#mapTitleInput').blur(); }

  });

  $('#mapModeSeg').addEventListener('click', ev=>{

    const b = ev.target.closest('button');

    if(!b) return;

    const m = curMap();

    if(!m) return;

    mapModes[m.id] = b.dataset.mode;

    renderMap();

  });

  const stage = $('#mapStage');

  stage.addEventListener('click', ev=>{

    stage.focus({preventScroll:true});

    // 思维导图视图：点节点只切换选中样式，不重绘（保证双击事件能命中同一节点）

    const gnode = ev.target.closest && ev.target.closest('.mnode');

    if(gnode){

      stage.querySelectorAll('.mnode.sel').forEach(x=>x.classList.remove('sel'));

      gnode.classList.add('sel');

      mapSel = gnode.dataset.id;

      return;

    }

    const act = ev.target.closest('[data-act]');

    if(act){

      const id = act.dataset.id;

      if(act.dataset.act==='child'){ mapAddChild(id, true); return; }

      if(act.dataset.act==='sibling'){ mapAddSibling(id, true); return; }

      if(act.dataset.act==='del'){ mapDelAsk(id, act); return; }

    }

    const caret = ev.target.closest('[data-toggle]');

    if(caret){ toggleMapOpen(caret.dataset.toggle); return; }

    const row = ev.target.closest('.mrow');

    if(row){

      // 仅切换选中样式，不重绘 DOM，避免双击落在被替换的旧节点上

      if(mapSel!==row.dataset.id){

        mapSel = row.dataset.id;

        stage.querySelectorAll('.mrow.sel').forEach(r=>r.classList.remove('sel'));

        row.classList.add('sel');

      }

    }

  });

  stage.addEventListener('dblclick', ev=>{

    const gnode = ev.target.closest && ev.target.closest('.mnode');

    if(gnode){

      const id = gnode.dataset.id;

      const mm = curMap();

      if(mm){ mapModes[mm.id]='outline'; renderMap(); startMapEdit(id); }

      return;

    }

    const row = ev.target.closest('.mrow');

    if(row) startMapEdit(row.dataset.id);

  });

  stage.addEventListener('blur', ev=>{

    if(ev.target && ev.target.matches && ev.target.matches('.mtext-input') && mapEdit===ev.target.dataset.edit){

      mapCommitText(ev.target.dataset.edit, ev.target.value);

    }

  }, true);

  stage.addEventListener('keydown', ev=>{

    const m = curMap();

    if(!m) return;

    const inp = ev.target.matches && ev.target.matches('.mtext-input') ? ev.target : null;

    if(inp){

      if(ev.key==='Enter'){

        ev.preventDefault();

        const id = inp.dataset.edit;

        const v = inp.value;

        mapEdit = '';

        mapCommitText(id, v);

        mapAddSibling(id, true);

        return;

      }

      if(ev.key==='Escape'){

        ev.preventDefault();

        mapEdit = '';

        renderMap();

        return;

      }

      if(ev.shiftKey && ev.key==='Tab'){

        ev.preventDefault();

        const id = inp.dataset.edit;

        const v = inp.value;

        mapEdit = '';

        mapCommitText(id, v);

        mapOutdent(id);

        return;

      }

      if(ev.key==='Tab'){

        ev.preventDefault();

        const id = inp.dataset.edit;

        const v = inp.value;

        mapEdit = '';

        mapCommitText(id, v);

        mapIndent(id);

        return;

      }

      return;

    }

    const rows = outlineRows();

    const idx = rows.findIndex(r=>r.node.id===mapSel);

    if(ev.key==='Enter'){

      ev.preventDefault();

      if(mapSel) mapAddSibling(mapSel, true);

    }

    else if(ev.key==='Tab' && !ev.shiftKey){

      ev.preventDefault();

      if(mapSel) mapIndent(mapSel);

    }

    else if(ev.key==='Tab' && ev.shiftKey){

      ev.preventDefault();

      if(mapSel) mapOutdent(mapSel);

    }

    else if(ev.key==='ArrowDown' && rows.length){

      ev.preventDefault();

      if(idx < rows.length-1) mapSel = rows[idx+1].node.id;

      renderMap();

    }

    else if(ev.key==='ArrowUp' && rows.length){

      ev.preventDefault();

      if(idx > 0) mapSel = rows[idx-1].node.id;

      renderMap();

    }

    else if(ev.key==='F2'){

      ev.preventDefault();

      if(mapSel) startMapEdit(mapSel);

    }

    else if((ev.key==='Delete'||ev.key==='Backspace') && mapSel){

      ev.preventDefault();

      mapDelete(mapSel);

    }

  });

}



/* ============================================================

 * 导出 / 重置 / Toast

 * ============================================================ */


Object.assign(globalThis, { curMap, touchMap, newNode, mapNodeCount, locateNode, outlineRows, mapAddChild, mapAddSibling, mapIndent, mapOutdent, mapCommitText, mapDelete, mapDelAsk, startMapEdit, focusMapInput, toggleMapOpen, renderOutlineStage, mindLayout, renderMindStage, renderMaps, renderMap, bindMapEvents });
export { curMap, touchMap, newNode, mapNodeCount, locateNode, outlineRows, mapAddChild, mapAddSibling, mapIndent, mapOutdent, mapCommitText, mapDelete, mapDelAsk, startMapEdit, focusMapInput, toggleMapOpen, renderOutlineStage, mindLayout, renderMindStage, renderMaps, renderMap, bindMapEvents };
