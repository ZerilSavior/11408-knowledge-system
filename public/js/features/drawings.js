// 模块: drawings（由单文件重构拆分；顶层符号经 main.js 聚合为全局，保持零构建原生 ESM）

function getUserDiagram(key){

  try{

    const raw = localStorage.getItem('user_diagrams');

    if(!raw) return null;

    const all = JSON.parse(raw);

    return all[key] || null;

  }catch(e){ return null; }

}

function saveUserDiagram(key, data){

  try{

    const raw = localStorage.getItem('user_diagrams');

    const all = raw ? JSON.parse(raw) : {};

    all[key] = data;

    localStorage.setItem('user_diagrams', JSON.stringify(all));

  }catch(e){ alert('保存失败：' + e.message); }

}

function deleteUserDiagram(key){

  try{

    const raw = localStorage.getItem('user_diagrams');

    if(!raw) return;

    const all = JSON.parse(raw);

    delete all[key];

    localStorage.setItem('user_diagrams', JSON.stringify(all));

  }catch(e){}

}

/* 把缩进文本解析成树结构 -> 渲染成 HTML */

function outlineToDiagram(text){

  const lines = text.split('\n').filter(l => l.trim());

  if(!lines.length) return '';

  // 解析缩进：每 2 个空格算一层

  const nodes = lines.map(l => {

    const m = l.match(/^(\s*)(.*)$/);

    const depth = Math.floor((m[1].length) / 2);

    return { depth, text: m[2].trim(), children: [] };

  });

  const root = { depth: -1, children: [] };

  const stack = [root];

  nodes.forEach(n => {

    while(stack.length > 1 && stack[stack.length-1].depth >= n.depth) stack.pop();

    stack[stack.length-1].children.push(n);

    stack.push(n);

  });

  function renderNode(n){

    if(n.children.length === 0){

      return `<div class="dg-node leaf">${n.text}</div>`;

    }

    const kids = n.children.map(renderNode).join('');

    return `<div class="dg-branch"><div class="dg-node">${n.text}</div><div class="dg-kids">${kids}</div></div>`;

  }

  return `<div class="dg">${root.children.map(renderNode).join('')}</div>`;

}

/* 打开编辑器弹窗 */

function openDiagramEditor(key, currentHtml){

  const existing = getUserDiagram(key);

  const curText = existing ? existing.text : '';

  const overlay = document.createElement('div');

  overlay.className = 'overlay open';

  overlay.innerHTML = `<div class="dlg" style="max-width:680px">

    <div class="dlg-t">编辑章节框架图<button class="dlg-x">×</button></div>

    <div class="dlg-b">

      <p style="margin:0 0 10px;color:var(--ink-2);font-size:13px">用缩进表示层级，每缩进 2 个空格算一层。例如：</p>

      <pre style="background:var(--panel-2);padding:10px;border-radius:8px;font-size:12px;margin:0 0 14px;line-height:1.6">极限

  数列极限

    定义（ε-N）

    性质（唯一性/有界性）

    计算（两个重要极限/夹逼）

  函数极限

    定义（ε-δ）

    性质

    计算</pre>

      <textarea id="diagInput" style="width:100%;height:200px;padding:10px;border:1px solid var(--line);border-radius:8px;font-family:inherit;font-size:13px;line-height:1.6;resize:vertical" placeholder="在这里输入框架图内容...">${curText}</textarea>

      <div id="diagPreview" style="margin-top:14px;max-height:300px;overflow:auto"></div>

    </div>

    <div class="dlg-f">

      <button class="btn ghost" id="diagDelete">删除</button>

      <button class="btn ghost" id="diagPreviewBtn">预览</button>

      <button class="btn primary" id="diagSave">保存</button>

    </div>

  </div>`;

  document.body.appendChild(overlay);

  const input = overlay.querySelector('#diagInput');

  const preview = overlay.querySelector('#diagPreview');

  function doPreview(){

    preview.innerHTML = '<div class="dg-wrap" style="max-height:280px;overflow:auto"><div class="dg">' + outlineToDiagram(input.value) + '</div></div>';

  }

  overlay.querySelector('#diagPreviewBtn').onclick = doPreview;

  overlay.querySelector('#diagSave').onclick = () => {

    const text = input.value.trim();

    if(!text){ deleteUserDiagram(key); }

    else { saveUserDiagram(key, { text, html: outlineToDiagram(text) }); }

    overlay.remove();

    renderDetail();

  };

  overlay.querySelector('#diagDelete').onclick = () => {

    deleteUserDiagram(key);

    overlay.remove();

    renderDetail();

  };

  overlay.querySelector('.dlg-x').onclick = () => overlay.remove();

  overlay.onclick = (e) => { if(e.target === overlay) overlay.remove(); };

  if(curText) doPreview();

}



/* ===== 考点深度内容库（按 学科id -> 路径 索引；运行时挂载，不改动考纲字面量）===== */


function drawCanvasCtx(){

  const c = document.getElementById('drawCanvas');

  return c ? {canvas:c, ctx:c.getContext('2d')} : null;

}

function drawRepaint(){

  const dc = drawCanvasCtx();

  if(!dc) return;

  dc.ctx.clearRect(0, 0, dc.canvas.width, dc.canvas.height);

  dc.ctx.lineCap = 'round';

  dc.ctx.lineJoin = 'round';

  drawState.strokes.forEach(s=>{

    dc.ctx.beginPath();

    dc.ctx.globalCompositeOperation = s.eraser ? 'destination-out' : 'source-over';

    dc.ctx.strokeStyle = s.color;

    dc.ctx.lineWidth = s.size;

    s.pts.forEach((p,i)=>{ if(i===0) dc.ctx.moveTo(p.x,p.y); else dc.ctx.lineTo(p.x,p.y); });

    dc.ctx.stroke();

  });

  dc.ctx.globalCompositeOperation = 'source-over';

}

function drawCanvasPos(ev){

  const c = document.getElementById('drawCanvas');

  if(!c) return {x:0,y:0};

  const r = c.getBoundingClientRect();

  return { x:(ev.clientX-r.left)*c.width/r.width, y:(ev.clientY-r.top)*c.height/r.height };

}

function openDrawEditor(){

  drawState.strokes = [];

  drawState.tool = 'pen';

  document.querySelectorAll('#drawToolsGroup .dtool').forEach(b=>b.classList.toggle('on', b.dataset.tool==='pen'));

  document.querySelectorAll('#drawColors .dcolor').forEach(b=>b.classList.toggle('on', b.dataset.color==='#1B1F24'));

  drawRepaint();

  $('#drawOverlay').classList.add('open');

}

function closeDrawEditor(){ $('#drawOverlay').classList.remove('open'); }

function insertDrawing(){

  const c = document.getElementById('drawCanvas');

  if(!c) return;

  const url = c.toDataURL('image/png');

  const id = 'dr'+Date.now()+Math.random().toString(36).slice(2,8);

  state.drawings[id] = url;

  saveState();

  closeDrawEditor();

  const ta = $('#noteContent');

  if(ta){

    const pos = ta.selectionStart;

    const block = `\n![涂鸦](drawing://${id})\n`;

    ta.setRangeText(block, pos, pos, 'end');

    ta.focus();

    updatePreview();

  }

  toast('涂鸦已插入笔记');

}



/* ============================================================

 * 思维导图（幕布式大纲 + XMind 式导图）

 * ============================================================ */

let mapSel = '';                 // 大纲当前选中主题 id

let mapEdit = '';                // 大纲正在编辑文字的主题 id

const mapOpen = {};              // key: mapId/nodeId -> false 表示折叠

const mapModes = {};             // key: mapId -> 'outline' | 'mind'




Object.assign(globalThis, { getUserDiagram, saveUserDiagram, deleteUserDiagram, outlineToDiagram, openDiagramEditor, drawCanvasCtx, drawRepaint, drawCanvasPos, openDrawEditor, closeDrawEditor, insertDrawing, mapSel, mapEdit, mapOpen, mapModes });
export { getUserDiagram, saveUserDiagram, deleteUserDiagram, outlineToDiagram, openDiagramEditor, drawCanvasCtx, drawRepaint, drawCanvasPos, openDrawEditor, closeDrawEditor, insertDrawing, mapSel, mapEdit, mapOpen, mapModes };
