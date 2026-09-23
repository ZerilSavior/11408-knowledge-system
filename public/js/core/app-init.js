// 模块: app-init（由单文件重构拆分；顶层符号经 main.js 聚合为全局，保持零构建原生 ESM）

function init(){

  render();

  cloudInit(); /* 尝试云端同步，失败自动回退本地 */

  window.addEventListener('hashchange', render);



  /* 顶栏导航 */

  document.querySelectorAll('#topnav button').forEach(b=>{

    b.addEventListener('click', ()=>{ location.hash = b.dataset.nav; });

  });



  /* 侧栏 */

  $('#sideNav').addEventListener('click', ev=>{

    const b = ev.target.closest('[data-goto]');

    if(b){ location.hash = b.dataset.goto; closeSidebar(); }

  });

  $('#menuBtn').addEventListener('click', openSidebar);

  $('#sideMask').addEventListener('click', closeSidebar);

  function openSidebar(){ $('#sidebar').classList.add('open'); $('#sideMask').classList.add('open'); }

  function closeSidebar(){ $('#sidebar').classList.remove('open'); $('#sideMask').classList.remove('open'); }



  /* 树：展开全部 / 折叠全部 */

  $('#expandAllBtn').addEventListener('click', ()=>{

    const p = currentRoute().path.split('/')[0];

    if(!p) return;

    const sub = getSubject(p);

    sub.chapters.forEach((ch,ci)=>{ openState[`${p}/${ci}`]=true; ch.sections.forEach((_,si)=>{ openState[`${p}/${ci}/${si}`]=true; }); });

    renderTree();

  });

  $('#collapseAllBtn').addEventListener('click', ()=>{

    const p = currentRoute().path.split('/')[0];

    if(!p) return;

    const sub = getSubject(p);

    sub.chapters.forEach((ch,ci)=>{ openState[`${p}/${ci}`]=false; ch.sections.forEach((_,si)=>{ openState[`${p}/${ci}/${si}`]=false; }); });

    renderTree();

  });



  /* 搜索 */

  $('#searchBtn').addEventListener('click', openSearch);

  $('#overlay').addEventListener('click', ev=>{ if(ev.target.id==='overlay') closeSearch(); });

  $('#searchInput').addEventListener('input', ev=>runSearch(ev.target.value));

  $('#searchInput').addEventListener('keydown', ev=>{

    if(ev.key==='Enter'){

      const first = $('#searchResults .sr-row');

      if(first){ closeSearch(); location.hash = first.dataset.goto; }

    }

    if(ev.key==='Escape') closeSearch();

  });

  document.addEventListener('keydown', ev=>{

    if((ev.ctrlKey||ev.metaKey) && ev.key.toLowerCase()==='k'){ ev.preventDefault(); openSearch(); }

    if(ev.key==='Escape' && $('#overlay').classList.contains('open')) closeSearch();

    if(ev.key==='Escape' && $('#noteOverlay').classList.contains('open')) closeNoteEditor();

    if(ev.key==='Escape' && $('#drawOverlay').classList.contains('open')) closeDrawEditor();
    if(ev.key==='Escape' && $('#mistakeOverlay').classList.contains('open')) closeMistakeEditor();

  });



  /* 我的笔记 */

  $('#addNoteBtn').addEventListener('click', ()=>openNoteEditor(null));

  $('#noteOverlay').addEventListener('click', ev=>{ if(ev.target.id==='noteOverlay') closeNoteEditor(); });

  $('#noteCloseBtn').addEventListener('click', closeNoteEditor);

  $('#noteCancelBtn').addEventListener('click', closeNoteEditor);

  $('#noteSaveBtn').addEventListener('click', saveNote);

  $('#notesSearchInput').addEventListener('input', ev=>{ notesQuery = ev.target.value; renderNotes(); });

  $('#kindFilters').addEventListener('click', ev=>{
    const b = ev.target.closest('button[data-kind]');
    if(b){ kindFilter = b.dataset.kind; renderNotes(); }
  });
  $('#notesSubject').addEventListener('change', ev=>{ subjFilter = ev.target.value; renderNotes(); });
  $('#mistakeStatus').addEventListener('change', ev=>{ mistakeFilter = ev.target.value; if(mistakeFilter!=='all') kindFilter='mistake'; renderNotes(); });
  $('#addMistakeBtn').addEventListener('click', ()=>openMistakeEditor(null,''));
  /* 错题编辑器 */
  $('#mistakeOverlay').addEventListener('click', ev=>{ if(ev.target.id==='mistakeOverlay') closeMistakeEditor(); });
  $('#mistakeCloseBtn').addEventListener('click', closeMistakeEditor);
  $('#mistakeCancelBtn').addEventListener('click', closeMistakeEditor);
  $('#mistakeSaveBtn').addEventListener('click', saveMistake);
  $('#mistakePhotoInput').addEventListener('change', function(){ mistakeUploadFiles(this); });

  // 笔记编辑器：Ctrl+V 直接粘贴图片
  const noteTA = $('#noteContent');
  if(noteTA){
    noteTA.addEventListener('paste', function(ev){
      const items = (ev.clipboardData || window.clipboardData).items;
      if(!items) return;
      for(const item of items){
        if(item.type && item.type.indexOf('image/') === 0){
          ev.preventDefault();
          const file = item.getAsFile();
          if(!file) continue;
          const reader = new FileReader();
          reader.onload = function(){
            const img = new Image();
            img.onload = function(){
              const MAX = 1400; let w = img.width, h = img.height;
              if(Math.max(w,h) > MAX){ const r = MAX/Math.max(w,h); w = Math.round(w*r); h = Math.round(h*r); }
              const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
              cv.getContext('2d').drawImage(img, 0, 0, w, h);
              const compressed = cv.toDataURL('image/jpeg', 0.72);
              if(authToken){
                toast('正在上传粘贴的图片...');
                api('/api/photo/upload', 'POST', {folder:'note', ext:'jpg', dataBase64: compressed}).then(r=>{
                  if(r && r.ok){
                    const md = '\n![粘贴图片]('+r.key+')\n';
                    noteTA.setRangeText(md, noteTA.selectionStart, noteTA.selectionEnd, 'end');
                    updatePreview(); toast('图片已插入');
                  } else {
                    const md = '\n![粘贴图片]('+compressed+')\n';
                    noteTA.setRangeText(md, noteTA.selectionStart, noteTA.selectionEnd, 'end');
                    updatePreview(); toast('图片已插入本地（未登录不上云）');
                  }
                }).catch(()=>{
                  const md = '\n![粘贴图片]('+compressed+')\n';
                  noteTA.setRangeText(md, noteTA.selectionStart, noteTA.selectionEnd, 'end');
                  updatePreview();
                });
              } else {
                const md = '\n![粘贴图片]('+compressed+')\n';
                noteTA.setRangeText(md, noteTA.selectionStart, noteTA.selectionEnd, 'end');
                updatePreview();
              }
            };
            img.src = reader.result;
          };
          reader.readAsDataURL(file);
          break;
        }
      }
    });
  }

  /* 批4：知识定位 / 做题 / 书源错因库 */
  $('#locatorOverlay').addEventListener('click', ev=>{ if(ev.target.id==='locatorOverlay') closeLocatorEditor(); });
  $('#locatorCloseBtn').addEventListener('click', closeLocatorEditor);
  $('#locatorCancelBtn').addEventListener('click', closeLocatorEditor);
  $('#locatorSaveBtn').addEventListener('click', saveLocator);

  $('#practiceOverlay').addEventListener('click', ev=>{ if(ev.target.id==='practiceOverlay') closePracticeEditor(); });
  $('#practiceCloseBtn').addEventListener('click', closePracticeEditor);
  $('#practiceCancelBtn').addEventListener('click', closePracticeEditor);
  $('#practiceSaveBtn').addEventListener('click', savePractice);
  $('#practicePath').addEventListener('change', fillPracticeBooks);
  $('#prResultSeg').addEventListener('click', ev=>{
    const b=ev.target.closest('button[data-prresult]'); if(!b) return;
    $('#prResultSeg').querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));
    const v=b.dataset.prresult;
    document.querySelectorAll('input[name="prResult"]').forEach(r=>{ r.checked=(r.value===v); });
    const wrong=v==='wrong';
    $('#practiceWrongBox').classList.toggle('mk-hidden',!wrong);
  });
  $('#practiceOverlay').addEventListener('click', ev=>{
    const chip=ev.target.closest('.reason-chip'); if(!chip) return;
    if(chip.dataset.reasonAdd){
      const name=(prompt('输入新的错因名称：')||'').trim();
      if(name){ if(!state.reasons.includes(name)) state.reasons.push(name); refreshPracticeReasonBox(selectedReasons($('#practiceReasons')).concat([name])); }
    } else chip.classList.toggle('on');
  });

  $('#mistakePath').addEventListener('change', fillMistakeBook);
  $('#mistakeOverlay').addEventListener('click', ev=>{
    const chip=ev.target.closest('.reason-chip'); if(!chip) return;
    if(chip.dataset.reasonAdd){
      const name=(prompt('输入新的错因名称：')||'').trim();
      if(name){ if(!state.reasons.includes(name)) state.reasons.push(name); refreshMistakeReasons(selectedReasons($('#mistakeReasons')).concat([name])); }
    } else chip.classList.toggle('on');
  });

  $('#libraryBtn').addEventListener('click', openLibrary);
  $('#libraryOverlay').addEventListener('click', ev=>{ if(ev.target.id==='libraryOverlay') closeLibrary(); });
  $('#libraryCloseBtn').addEventListener('click', closeLibrary);
  $('#libraryDoneBtn').addEventListener('click', closeLibrary);
  $('#libTabs').addEventListener('click', ev=>{ const b=ev.target.closest('[data-lib-tab]'); if(b){ libGroup=b.dataset.libTab; renderLibrary(); } });
  $('#libBooks').addEventListener('click', ev=>{
    const b=ev.target.closest('[data-lib-delbook]'); if(!b) return;
    const id=b.dataset.libDelbook;
    state.books[libGroup]=(state.books[libGroup]||[]).filter(x=>x.id!==id);
    saveState(); renderLibrary();
  });
  $('#libAddBookBtn').addEventListener('click', ()=>{
    const inp=$('#libBookInput'), name=inp.value.trim();
    if(!name){ inp.focus(); return; }
    if(!state.books[libGroup]) state.books[libGroup]=[];
    if(state.books[libGroup].some(b=>b.name===name)){ toast('该书已存在'); return; }
    state.books[libGroup].push({id:genBookId(),name}); inp.value=''; saveState(); renderLibrary(); toast('已添加书源');
  });
  $('#libReasons').addEventListener('click', ev=>{
    const b=ev.target.closest('[data-lib-delreason]'); if(!b) return;
    state.reasons.splice(Number(b.dataset.libDelreason),1); saveState(); renderLibrary();
  });
  $('#libAddReasonBtn').addEventListener('click', ()=>{
    const inp=$('#libReasonInput'), name=inp.value.trim();
    if(!name){ inp.focus(); return; }
    if(state.reasons.includes(name)){ toast('该错因已存在'); return; }
    state.reasons.push(name); inp.value=''; saveState(); renderLibrary(); toast('已添加错因');
  });

  /* 笔记编辑器：工具栏 / 模式切换 / 实时预览 */

  $('#mdToolbar').addEventListener('click', ev=>{

    const b = ev.target.closest('[data-cmd]');

    if(!b) return;

    if(b.dataset.cmd==='draw') openDrawEditor();
    else if(b.dataset.cmd==='image') notePickImage();
    else if(b.dataset.cmd==='file') notePickFile();
    else mdTool(b.dataset.cmd);

  });

  $('#mdModeSeg').addEventListener('click', ev=>{

    const b = ev.target.closest('button[data-mode]');

    if(b) setMdMode(b.dataset.mode);

  });

  $('#noteContent').addEventListener('input', ()=>{

    clearTimeout(mdTimer);

    mdTimer = setTimeout(updatePreview, 120);

  });



  /* 涂鸦画板 */

  const drawCanvasEl = document.getElementById('drawCanvas');

  if(drawCanvasEl){

    drawCanvasEl.addEventListener('pointerdown', ev=>{

      ev.preventDefault();

      try{ drawCanvasEl.setPointerCapture(ev.pointerId); }catch(e){}

      drawPointer = { tool:drawState.tool, color:drawState.color, size:drawState.size,

        eraser:drawState.tool==='eraser', pts:[drawCanvasPos(ev)] };

      drawState.strokes.push(drawPointer);

      drawRepaint();

    });

    drawCanvasEl.addEventListener('pointermove', ev=>{

      if(!drawPointer) return;

      drawPointer.pts.push(drawCanvasPos(ev));

      drawRepaint();

    });

    const endDraw = ()=>{ drawPointer = null; };

    drawCanvasEl.addEventListener('pointerup', endDraw);

    drawCanvasEl.addEventListener('pointercancel', endDraw);

  }

  $('#drawOverlay').addEventListener('click', ev=>{ if(ev.target.id==='drawOverlay') closeDrawEditor(); });

  $('#drawCancelBtn').addEventListener('click', closeDrawEditor);

  $('#drawInsertBtn').addEventListener('click', insertDrawing);

  $('#drawClearBtn').addEventListener('click', ()=>{ drawState.strokes=[]; drawRepaint(); });

  $('#drawUndoBtn').addEventListener('click', ()=>{ drawState.strokes.pop(); drawRepaint(); });

  $('#drawToolsGroup').addEventListener('click', ev=>{

    const b = ev.target.closest('.dtool');

    if(!b) return;

    drawState.tool = b.dataset.tool;

    document.querySelectorAll('#drawToolsGroup .dtool').forEach(x=>x.classList.toggle('on', x===b));

  });

  $('#drawColors').addEventListener('click', ev=>{

    const b = ev.target.closest('.dcolor');

    if(!b) return;

    drawState.color = b.dataset.color;

    document.querySelectorAll('#drawColors .dcolor').forEach(x=>x.classList.toggle('on', x===b));

  });

  $('#drawSize').addEventListener('input', ev=>{

    drawState.size = Number(ev.target.value);

    $('#drawSizeVal').textContent = ev.target.value;

  });



  /* 思维导图 */

  bindMapEvents();



  /* 导出 / 重置 */

  $('#exportBtn').addEventListener('click', exportData);

  $('#resetBtn').addEventListener('click', armReset);

}


Object.assign(globalThis, { init });
export { init };
