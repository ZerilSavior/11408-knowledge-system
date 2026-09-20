// 模块: bootstrap（由单文件重构拆分；顶层符号经 main.js 聚合为全局，保持零构建原生 ESM）

function exportData(){

  const payload = {

    exportedAt: new Date().toISOString(),

    app: '408 知识体系 · 2026 考研',

    state

  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], {type:'application/json'});

  const a = document.createElement('a');

  const d = new Date();

  const stamp = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;

  a.href = URL.createObjectURL(blob);

  a.download = `408学习记录-${stamp}.json`;

  document.body.appendChild(a);

  a.click();

  a.remove();

  setTimeout(()=>URL.revokeObjectURL(a.href), 1000);

  toast('学习记录已导出为 JSON 文件');

}



let resetArmed = false, resetTimer = null;

function armReset(){

  const btn = $('#resetBtn');

  if(!resetArmed){

    resetArmed = true;

    btn.classList.add('confirming');

    btn.textContent = '确认清空全部记录？';

    resetTimer = setTimeout(disarmReset, 3000);

  }else{

    clearTimeout(resetTimer);

    state = { mastery:{}, notes:{}, myNotes:[], drawings:{}, maps:[], items:[] };

    saveState();

    render();

    disarmReset();

    toast('已清空全部学习状态与笔记');

  }

}

function disarmReset(){

  resetArmed = false;

  const btn = $('#resetBtn');

  if(btn){ btn.classList.remove('confirming'); btn.textContent = '重置全部记录'; }

}



let toastTimer = null;

function toast(msg){

  const t = $('#toast');

  t.textContent = msg;

  t.classList.add('show');

  clearTimeout(toastTimer);

  toastTimer = setTimeout(()=>t.classList.remove('show'), 2200);

}



/* ============================================================

 * 初始化与全局事件

 * ============================================================ */

/* 侧栏折叠 + 两栏拖拽调宽 */

(function(){

  /* 侧栏折叠 */

  const sBtn = document.getElementById('sideToggleBtn');

  if(sBtn){

    if(localStorage.getItem('kp_side_collapsed')==='1') document.body.classList.add('side-collapsed');

    sBtn.addEventListener('click', ()=>{

      document.body.classList.toggle('side-collapsed');

      localStorage.setItem('kp_side_collapsed', document.body.classList.contains('side-collapsed')?'1':'0');

      const t = document.getElementById('treeTitle');

      if(t) t.scrollIntoView({block:'nearest'});

    });

  }

  /* 两栏拖拽调宽 */

  const treeMain = document.querySelector('.tree-main');

  const resizer = document.getElementById('treeResizer');

  if(treeMain && resizer){

    const saved = localStorage.getItem('kp_tree_w');

    if(saved){

      const w = parseInt(saved,10);

      if(w>200) treeMain.style.gridTemplateColumns = w+'px 8px minmax(0,1fr)';

    }

    let dragging=false, startX=0, startW=0;

    resizer.addEventListener('mousedown', e=>{

      dragging=true; startX=e.clientX;

      startW = treeMain.querySelector('.tree-pane').getBoundingClientRect().width;

      resizer.classList.add('dragging');

      document.body.style.cursor='col-resize'; document.body.style.userSelect='none';

      e.preventDefault();

    });

    document.addEventListener('mousemove', e=>{

      if(!dragging) return;

      let w = startW + (e.clientX - startX);

      const maxW = treeMain.getBoundingClientRect().width - 280;

      w = Math.max(220, Math.min(w, maxW));

      treeMain.style.gridTemplateColumns = w+'px 8px minmax(0,1fr)';

    });

    const stopDrag = ()=>{

      if(!dragging) return;

      dragging=false;

      resizer.classList.remove('dragging');

      document.body.style.cursor=''; document.body.style.userSelect='';

      const cur = treeMain.style.gridTemplateColumns;

      const m = cur && cur.match(/^(\d+(?:\.\d+)?)px/);

      if(m) localStorage.setItem('kp_tree_w', String(Math.round(parseFloat(m[1]))));

    };

    document.addEventListener('mouseup', stopDrag);

    document.addEventListener('mouseleave', stopDrag);

  }

})();




Object.assign(globalThis, { exportData, resetArmed, armReset, disarmReset, toastTimer, toast });
export { exportData, resetArmed, armReset, disarmReset, toastTimer, toast };
