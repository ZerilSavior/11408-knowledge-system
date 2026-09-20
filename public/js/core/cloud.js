// 模块: cloud（由单文件重构拆分；顶层符号经 main.js 聚合为全局，保持零构建原生 ESM）

let authToken = localStorage.getItem('auth_token') || '';

let authUser = localStorage.getItem('auth_user') || '';



function api(path, method, body){

  return fetch(path, {

    method,

    headers: { 'Content-Type': 'application/json', ...(authToken ? { Authorization: 'Bearer ' + authToken } : {}) },

    body: body ? JSON.stringify(body) : undefined

  }).then(r => r.json());

}



function cloudSave(immediate){

  if(!authToken) return;

  const doSave = () => {

    // 分别保存 mastery / notes / user_diagrams

    api('/api/data', 'POST', { key: 'mastery', value: state.mastery }).catch(()=>{});

    api('/api/data', 'POST', { key: 'notes', value: state.notes }).catch(()=>{});

    api('/api/data', 'POST', { key: 'items', value: state.items }).catch(()=>{});

    api('/api/data', 'POST', { key: 'words', value: state.words }).catch(()=>{});

    api('/api/data', 'POST', { key: 'plan', value: state.plan }).catch(()=>{});
    api('/api/data', 'POST', { key: 'locators', value: state.locators }).catch(()=>{});
    api('/api/data', 'POST', { key: 'practices', value: state.practices }).catch(()=>{});
    api('/api/data', 'POST', { key: 'books', value: state.books }).catch(()=>{});
    api('/api/data', 'POST', { key: 'reasons', value: state.reasons }).catch(()=>{});
    api('/api/data', 'POST', { key: 'masteryManual', value: state.masteryManual }).catch(()=>{});
    api('/api/data', 'POST', { key: 'exams', value: state.exams }).catch(()=>{});
    api('/api/data', 'POST', { key: 'reading', value: state.reading }).catch(()=>{});
    api('/api/data', 'POST', { key: 'planOverrides', value: state.planOverrides }).catch(()=>{});

    api('/api/data', 'POST', { key: 'drawings', value: state.drawings }).catch(()=>{});

    try{

      const ud = JSON.parse(localStorage.getItem('user_diagrams') || '{}');

      api('/api/data', 'POST', { key: 'user_diagrams', value: ud }).catch(()=>{});

    }catch(e){}

  };

  if(immediate){ doSave(); return; }

  clearTimeout(cloudSaveTimer);

  cloudSaveTimer = setTimeout(doSave, 600);

}



async function cloudLoad(){

  if(!authToken) return;

  try{

    const r = await api('/api/data', 'GET');

    if(r.ok && r.data){

      if(r.data.mastery) state.mastery = Object.assign({}, state.mastery, r.data.mastery);

      if(r.data.notes) state.notes = Object.assign({}, state.notes, r.data.notes);

      if(r.data.items) state.items = mergeItems(state.items, r.data.items);

      if(r.data.words) state.words = mergeWords(state.words||{}, r.data.words);

      if(r.data.plan) state.plan = r.data.plan;
      if(r.data.locators) state.locators = mergePathArrays(state.locators, r.data.locators);
      if(r.data.practices) state.practices = mergePathArrays(state.practices, r.data.practices);
      if(r.data.masteryManual) state.masteryManual = Object.assign({}, state.masteryManual, r.data.masteryManual);
      if(r.data.books) state.books = mergeBooks(state.books, r.data.books);
      if(Array.isArray(r.data.reasons)) state.reasons = Array.from(new Set([...(state.reasons||[]),...r.data.reasons]));
      if(r.data.exams) state.exams = mergeExams(state.exams, r.data.exams);
      if(r.data.reading) state.reading = mergeReading(state.reading, r.data.reading);
      if(r.data.planOverrides) state.planOverrides = Object.assign({}, state.planOverrides||{}, r.data.planOverrides);
      ensureLearningData();

      if(r.data.drawings) state.drawings = Object.assign({}, state.drawings, r.data.drawings);

      try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }catch(e){}

      if(r.data.user_diagrams) localStorage.setItem('user_diagrams', JSON.stringify(r.data.user_diagrams));

    }

  }catch(e){ console.warn('cloud load failed', e); }

  if(typeof render==='function'){ try{ render(); }catch(e){} }

}



function showLogin(){

  const ov = document.createElement('div');

  ov.className = 'overlay open';

  ov.style.zIndex = '1000';

  ov.innerHTML = `<div class="dlg" style="max-width:380px">

    <div class="dlg-t">考研知识体系<button class="dlg-x" style="display:none">×</button></div>

    <div class="dlg-b">

      <div id="loginMsg" style="color:#c0392b;font-size:13px;margin-bottom:10px;display:none"></div>

      <input id="loginUser" placeholder="用户名" style="width:100%;padding:10px;margin-bottom:10px;border:1px solid var(--line);border-radius:8px;font-size:14px;box-sizing:border-box">

      <input id="loginPass" type="password" placeholder="密码" style="width:100%;padding:10px;margin-bottom:14px;border:1px solid var(--line);border-radius:8px;font-size:14px;box-sizing:border-box">

      <button id="btnLogin" class="btn primary" style="width:100%;padding:10px;font-size:14px">登录</button>

      <button id="btnRegister" class="btn ghost" style="width:100%;padding:10px;margin-top:8px;font-size:13px">注册新账号</button>

      <p style="text-align:center;color:var(--ink-3);font-size:12px;margin:14px 0 0">数据存云端，换设备也能同步</p>

    </div>

  </div>`;

  document.body.appendChild(ov);

  const msg = ov.querySelector('#loginMsg');

  function doLogin(isReg){

    const u = ov.querySelector('#loginUser').value.trim();

    const p = ov.querySelector('#loginPass').value;

    if(!u || !p){ msg.textContent = '请输入用户名和密码'; msg.style.display='block'; return; }

    api(isReg?'/api/register':'/api/login', 'POST', { username: u, password: p }).then(r=>{

      if(r.ok){

        authToken = r.token; authUser = r.username;

        localStorage.setItem('auth_token', r.token);

        localStorage.setItem('auth_user', r.username);

        ov.remove();

        cloudLoad();

      } else {

        msg.textContent = r.error || '失败';

        msg.style.display = 'block';

      }

    }).catch(()=>{ msg.textContent = '网络错误'; msg.style.display='block'; });

  }

  ov.querySelector('#btnLogin').onclick = ()=> doLogin(false);

  ov.querySelector('#btnRegister').onclick = ()=> doLogin(true);

  ov.querySelector('#loginPass').onkeydown = (e)=>{ if(e.key==='Enter') doLogin(false); };

}



/* 启动：有 token 就拉数据，没有就显示登录 */

(async function initAuth(){

  if(authToken){

    await cloudLoad();

  } else {

    showLogin();

  }

})();



const MASTERY = { '': '未学', studying:'学习中', mastered:'已掌握' };



/* ============================================================

 * 工具函数

 * ============================================================ */


Object.assign(globalThis, { authToken, authUser, api, cloudSave, cloudLoad, showLogin, MASTERY });
export { authToken, authUser, api, cloudSave, cloudLoad, showLogin, MASTERY };
