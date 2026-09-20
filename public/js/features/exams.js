// 模块: exams（由单文件重构拆分；顶层符号经 main.js 聚合为全局，保持零构建原生 ESM）

const EXAM_FIRST_YEAR=2009, EXAM_LAST_YEAR=2026, EXAM_CYCLES=18, EXAM_DEFAULT_DATE='2026-12-19';
function examSubjects(){
  const c=id=>{ const s=getSubject(id); return s?s.color:''; };
  return [
    {key:'poli', name:'思想政治理论', short:'政治', max:100, day:1, half:'am', t1:'08:30', t2:'11:30', color:c('poli1')||'#c0392b'},
    {key:'eng',  name:'英语（一）',     short:'英语', max:100, day:1, half:'pm', t1:'14:30', t2:'17:30', color:c('eng')||'#2f6fed'},
    {key:'math', name:'数学（一）',     short:'数学', max:150, day:2, half:'am', t1:'08:30', t2:'11:30', color:c('math1')||'#7b53d6'},
    {key:'c408', name:'计算机专业基础 408', short:'408', max:150, day:2, half:'pm', t1:'14:30', t2:'17:30', color:c('co')||'#1a9e6e'}
  ];
}
let EXAM_SLOTS=examSubjects();
function examSlotByKey(k){ return EXAM_SLOTS.find(s=>s.key===k)||null; }
function ensureExams(){
  if(!state.exams || typeof state.exams!=='object'){ state.exams={examDate:'2026-12-19', enabled:{}, records:{}}; }
  const e=state.exams, EK=['poli','eng','math','c408'];
  if(!e.enabled || typeof e.enabled!=='object') e.enabled={};
  EK.forEach(k=>{ if(typeof e.enabled[k]!=='boolean') e.enabled[k]=false; });
  if(!e.records || typeof e.records!=='object') e.records={};
  if(!e.examDate) e.examDate='2026-12-19';
  return e;
}
function mergeExams(local,cloud){
  const l=local||{examDate:'2026-12-19',enabled:{},records:{}};
  const out={examDate:l.examDate||(cloud&&cloud.examDate)||'2026-12-19', enabled:{}, records:{}};
  ['poli','eng','math','c408'].forEach(k=>{ out.enabled[k]=!!((l.enabled&&l.enabled[k])||(cloud&&cloud.enabled&&cloud.enabled[k])); });
  const keys=new Set([].concat(Object.keys(l.records||{}),Object.keys((cloud&&cloud.records)||{})));
  keys.forEach(k=>{ const a=(l.records||{})[k], b=(cloud&&cloud.records||{})[k]; out.records[k]=(!b)?a:(!a)?b:(((b.updated||0)>=(a.updated||0))?b:a); });
  return out;
}
function examRecKey(slotKey,year){ return slotKey+'_'+year; }
function examGetRec(slot,year){ return state.exams.records[examRecKey(slot.key,year)]||null; }
function examCycleDay1(c){ return planAddDays(state.exams.examDate, -2*(EXAM_CYCLES+1-c)); }
function examSlotDate(slot,c){ const d1=examCycleDay1(c); return slot.day===1?d1:planAddDays(d1,1); }
function examSlotEndTs(slot,c){ const d=examSlotDate(slot,c); const dt=planParse(d); const hm=(slot.half==='am')?[11,30]:[17,30]; dt.setHours(hm[0],hm[1],0,0); return dt.getTime(); }
function examStatus(slot,c,now){
  const year=EXAM_FIRST_YEAR+(c-1), rec=examGetRec(slot,year), end=examSlotEndTs(slot,c);
  const graded = rec && rec.score!==null && rec.score!==undefined && rec.score!=='';
  if(graded) return {code:'graded',rec};
  if(rec && rec.doneTs){ const dt=now-rec.doneTs;
    if(dt<=30*60000) return {code:'doing',rec,left:Math.max(1,Math.ceil((30*60000-dt)/60000))};
    return {code:'late',rec,overdue:true};
  }
  if(now>end) return {code:'late',rec:null};
  return {code:'future',rec:null};
}
function examCurrentCycle(){
  const now=Date.now();
  for(let c=1;c<=EXAM_CYCLES;c++){
    let allGraded=true;
    EXAM_SLOTS.forEach(s=>{ if(!state.exams.enabled[s.key])return; if(examStatus(s,c,now).code!=='graded') allGraded=false; });
    if(!allGraded) return c;
  }
  return EXAM_CYCLES;
}
let examCollapsed={};
function examSidebarItem(){
  ensureExams();
  const route=currentRoute(), on=route.type==='exams';
  const en=EXAM_SLOTS.filter(s=>state.exams.enabled[s.key]);
  let total=0, graded=0, pending=0; const now=Date.now();
  en.forEach(s=>{ for(let c=1;c<=EXAM_CYCLES;c++){ total++; const st=examStatus(s,c,now); if(st.code==='graded')graded++; else if(st.code==='doing'||st.code==='late')pending++; } });
  const meta=!en.length?'勾选科目开启真题月':(graded+'/'+total+' 已批改'+(pending?' · 待录 '+pending:''));
  return '<button class="snav '+(on?'active':'')+'" data-goto="#/exams" style="'+(on?'border-left:3px solid var(--ink,#222)':'')+'">'
    +'<span class="scol" style="background:var(--ink,#222);'+(on?'':'opacity:.5')+'"></span>'
    +'<span class="sinfo"><span class="sname">真题模考<span class="en">EXAMS</span></span><span class="smeta">'+meta+'</span></span>'
    +(pending?'<span class="wbadge" style="background:#c0392b">'+pending+'</span>':'')+'</button>';
}
function examToggleSubject(k){ ensureExams(); state.exams.enabled[k]=!state.exams.enabled[k]; saveState(); renderExams(); renderSidebar(); }
function examSetDate(v){ if(!v)return; ensureExams(); state.exams.examDate=v; saveState(); renderExams(); }
function examJumpCurrent(){ const c=examCurrentCycle(); examCollapsed[c]=false; renderExams(); setTimeout(()=>{ const el=document.getElementById('examCyc'+c); if(el) el.scrollIntoView({behavior:'smooth',block:'center'}); },50); }
function renderExams(){
  ensureExams();
  const app=$('#examApp'); if(!app) return;
  const e=state.exams, now=Date.now(), en=EXAM_SLOTS.filter(s=>e.enabled[s.key]);
  // 设置条
  let h='<div class="ex-set"><div class="ex-date">考研首日（政治 / 英语当天）<input type="date" id="examDateInput" value="'+e.examDate+'"></div>'
    +'<div class="ex-sw">'+EXAM_SLOTS.map(s=>'<button type="button" class="'+(e.enabled[s.key]?'on':'')+'" data-exsub="'+s.key+'" style="'+(e.enabled[s.key]?'background:'+s.color+';border-color:'+s.color:'')+'"><span class="ex-dot" style="background:'+s.color+'"></span> '+s.short+'</button>').join('')+'</div></div>';
  const rangeStart=examCycleDay1(1), rangeEnd=examSlotDate(EXAM_SLOTS[3],EXAM_CYCLES);
  h+='<div class="ex-jumpto">真题月 '+rangeStart+' 至 '+rangeEnd+'（共 36 天 / 18 个两天周期）· 每个周期按真实顺序做同一年四科 · <a id="examJumpCur">跳到当前周期</a></div>';
  if(!en.length){
    h+='<div class="ex-alert warn">先在上方勾选你要开练的科目（政治 / 英语 / 数学 / 408），系统会按两天一周期、严格对应考研时段排出 2009–2026 共 18 套。</div>';
    app.innerHTML=h; examBindStatic(); return;
  }
  // 提醒
  let doing=[], late=[];
  en.forEach(s=>{ for(let c=1;c<=EXAM_CYCLES;c++){ const yr=EXAM_FIRST_YEAR+(c-1), st=examStatus(s,c,now);
    if(st.code==='doing') doing.push({s,yr,left:st.left}); else if(st.code==='late') late.push({s,yr}); } });
  if(doing.length) h+='<div class="ex-alert warn"><b>请在 30 分钟内上传试卷并自批录分：</b>'+doing.map(d=>'<a data-openrec="'+examRecKey(d.s.key,d.yr)+'">'+d.s.short+' '+d.yr+'（剩 '+d.left+' 分钟）</a>').join('　')+'</div>';
  if(late.length) h+='<div class="ex-alert bad"><b>以下场次已到时间 / 已超时，待批改录分：</b>'+late.map(d=>'<a data-openrec="'+examRecKey(d.s.key,d.yr)+'">'+d.s.short+' '+d.yr+'</a>').join('　')+'</div>';
  // 总览
  let total=0, graded=0, rateSum=0, rateN=0;
  en.forEach(s=>{ for(let c=1;c<=EXAM_CYCLES;c++){ total++; const st=examStatus(s,c,now); if(st.code==='graded'){ graded++; rateSum+=(+st.rec.score/s.max); rateN++; } } });
  const avg=rateN?Math.round(100*rateSum/rateN):0;
  h+='<div class="ex-hero"><div class="p-stat"><div class="n">'+graded+'<small>/ '+total+'</small></div><div class="l">已批改场次</div></div>'
    +'<div class="p-stat"><div class="n">'+(total-graded)+'<small>场</small></div><div class="l">待完成 / 待录分</div></div>'
    +'<div class="p-stat"><div class="n">'+avg+'<small>%</small></div><div class="l">平均得分率</div></div>'
    +'<div class="p-stat"><div class="n">'+(doing.length+late.length)+'<small>场</small></div><div class="l">待上传 / 批改</div></div></div>';
  // 趋势
  h+='<div class="ex-trend">'+en.map(s=>'<div class="tc"><div class="tt"><span class="ex-dot" style="background:'+s.color+'"></span>'+s.name+'（满分 '+s.max+'）</div>'+examTrendSvg(s)+'</div>').join('')+'</div>';
  // 周期
  const cur=examCurrentCycle();
  h+='<div class="ex-cycles">';
  for(let c=1;c<=EXAM_CYCLES;c++){
    const year=EXAM_FIRST_YEAR+(c-1), d1=examCycleDay1(c), d2=examSlotDate(EXAM_SLOTS[3],c);
    const slots=en.map(s=>examSlotHtml(s,c)).join('');
    let g=0; en.forEach(s=>{ if(examStatus(s,c,now).code==='graded')g++; });
    const closed=(c!==cur && examCollapsed[c]!==false) || examCollapsed[c]===true;
    h+='<div class="ex-cyc '+(c===cur?'now':'')+' '+(closed?'closed':'')+'" id="examCyc'+c+'">'
      +'<div class="ex-cyc-h" data-cyc="'+c+'"><b>第 '+c+' 周期</b><span class="yr">'+d1.slice(5)+' ~ '+d2.slice(5)+' · '+planWd(d1)+' / '+planWd(d2)+'</span><span class="tag">'+year+' 年真题 · '+g+'/'+en.length+' 已批改</span><span class="car">▾</span></div>'
      +'<div class="ex-slots">'+slots+'</div></div>';
  }
  h+='</div>';
  app.innerHTML=h;
  examBindStatic();
  examHydrateThumbs(app);
}
function examSlotHtml(slot,c){
  const year=EXAM_FIRST_YEAR+(c-1), date=examSlotDate(slot,c), key=examRecKey(slot.key,year), st=examStatus(slot,c,now0());
  let statusLine='', action='';
  if(st.code==='graded'){
    const rate=Math.round(100*(+st.rec.score/slot.max));
    statusLine='<div class="ex-st graded"><span class="ex-score">'+st.rec.score+'</span> / '+slot.max+' 分 · '+rate+'%</div>';
    action='<button class="iconbtn" data-openrec="'+key+'">查看 / 修改</button>';
  } else if(st.code==='doing'){
    statusLine='<div class="ex-st doing">已做完，请在 '+st.left+' 分钟内上传并录分</div>';
    action='<button class="iconbtn primary" data-openrec="'+key+'">上传试卷 / 录分</button>';
  } else if(st.code==='late'){
    statusLine='<div class="ex-st late">'+(st.rec?'已超时，请尽快补传 / 补录':'该场已到时间，待批改录分')+'</div>';
    action='<button class="iconbtn primary" data-openrec="'+key+'">录分</button>';
  } else {
    statusLine='<div class="ex-st future">未到时间（'+date.slice(5)+' '+slot.t1+'）</div>';
    action='<button class="iconbtn" data-openrec="'+key+'">提前记录</button>';
  }
  let thumbs='';
  if(st.code==='graded' && st.rec.photos && st.rec.photos.length){
    thumbs='<div class="ex-thumbs">'+st.rec.photos.slice(0,4).map(p=>'<img data-photo="'+p.key+'" alt="试卷">').join('')+'</div>';
  }
  return '<div class="ex-slot"><div class="tm">'+(slot.day===1?'Day1':'Day2')+' · '+slot.t1+'-'+slot.t2+' · '+date.slice(5)+'</div>'
    +'<div class="nm"><span class="ex-dot" style="background:'+slot.color+'"></span>'+slot.name+' <span style="font-weight:400;color:var(--ink-3,#888);font-size:12px">'+year+'</span></div>'
    +statusLine+action+thumbs+'</div>';
}
function now0(){ return Date.now(); }
function examTrendSvg(slot){
  const pts=[];
  for(let y=EXAM_FIRST_YEAR;y<=EXAM_LAST_YEAR;y++){ const r=state.exams.records[examRecKey(slot.key,y)]; if(r && r.score!==null && r.score!==undefined && r.score!=='') pts.push({y,score:+r.score}); }
  if(pts.length<2) return '<div class="md-hint" style="padding:6px 0">录满 2 场以上显示趋势（已录 '+pts.length+' 场）</div>';
  const W=300,H=84,padL=26,padR=12,padT=16,padB=16;
  const x=i=>padL+i*(W-padL-padR)/(pts.length-1), y=v=>H-padB-(v/slot.max)*(H-padT-padB);
  const line=pts.map((p,i)=>(i?'L':'M')+x(i).toFixed(1)+' '+y(p.score).toFixed(1)).join(' ');
  const dots=pts.map((p,i)=>'<circle cx="'+x(i).toFixed(1)+'" cy="'+y(p.score).toFixed(1)+'" r="2.8" fill="'+slot.color+'"><title>'+p.y+'：'+p.score+' / '+slot.max+'（'+Math.round(100*p.score/slot.max)+'%）</title></circle>').join('');
  const last=pts[pts.length-1];
  return '<svg viewBox="0 0 '+W+' '+H+'" width="100%" height="84" role="img" aria-label="成绩趋势">'
    +'<line x1="'+padL+'" y1="'+(H-padB)+'" x2="'+(W-padR)+'" y2="'+(H-padB)+'" stroke="currentColor" opacity=".25"/>'
    +'<line x1="'+padL+'" y1="'+padT+'" x2="'+padL+'" y2="'+(H-padB)+'" stroke="currentColor" opacity=".25"/>'
    +'<text x="2" y="'+(padT+4)+'" font-size="9" fill="currentColor" opacity=".55">'+slot.max+'</text>'
    +'<path d="'+line+'" fill="none" stroke="'+slot.color+'" stroke-width="2"/>'+dots
    +'<text x="'+(W-padR)+'" y="12" font-size="9.5" text-anchor="end" fill="'+slot.color+'">最近 '+last.score+'分 · '+Math.round(100*last.score/slot.max)+'%</text></svg>';
}
function examBindStatic(){
  const di=$('#examDateInput'); if(di) di.addEventListener('change',ev=>examSetDate(ev.target.value));
  document.querySelectorAll('[data-exsub]').forEach(b=>b.addEventListener('click',()=>examToggleSubject(b.dataset.exsub)));
  const jc=$('#examJumpCur'); if(jc) jc.addEventListener('click',examJumpCurrent);
  document.querySelectorAll('.ex-cyc-h[data-cyc]').forEach(h=>h.addEventListener('click',()=>{ const c=+h.dataset.cyc; examCollapsed[c]=!(h.parentElement.classList.contains('closed')); renderExams(); }));
  document.querySelectorAll('[data-openrec]').forEach(a=>a.addEventListener('click',ev=>{ ev.stopPropagation(); examOpen(a.dataset.openrec); }));
}
/* ---------- 录分弹窗 + R2 照片 ---------- */
let examCurKey=null, examPhotos=[];
const examBlobCache={};
async function examPhotoUrl(key){
  if(examBlobCache[key]) return examBlobCache[key];
  if(!authToken) return '';
  try{ const r=await fetch('/api/photo/'+key,{headers:{Authorization:'Bearer '+authToken}}); if(!r.ok) return ''; const b=await r.blob(); const u=URL.createObjectURL(b); examBlobCache[key]=u; return u; }catch(e){ return ''; }
}
async function examHydrateThumbs(root){
  (root||document).querySelectorAll('img[data-photo]').forEach(async im=>{ const u=await examPhotoUrl(im.dataset.photo); if(u) im.src=u; });
}
function examParseKey(key){ const i=key.lastIndexOf('_'); return {slotKey:key.slice(0,i), year:+key.slice(i+1)}; }
function examOpen(key){
  ensureExams();
  const {slotKey,year}=examParseKey(key), slot=examSlotByKey(slotKey); if(!slot) return;
  const c=year-EXAM_FIRST_YEAR+1;
  examCurKey=key; examPhotos=[];
  const rec=state.exams.records[key]||null;
  $('#examRecTitle').textContent=slot.name+' · '+year+' 真题';
  $('#examMax').textContent=slot.max;
  $('#examRecKey').value=key;
  $('#examObj').value=(rec&&rec.obj!=null)?rec.obj:'';
  $('#examSubj').value=(rec&&rec.subj!=null)?rec.subj:'';
  $('#examScore').value=(rec&&rec.score!=null)?rec.score:'';
  $('#examNote').value=(rec&&rec.note)?rec.note:'';
  if(rec&&rec.photos) examPhotos=rec.photos.map(p=>Object.assign({},p));
  examRefreshStatusLine(slot,c,rec);
  examRenderPhotoList();
  examBindRecorder(slot,c);
  $('#examOverlay').classList.add('open');
}
function examClose(){ $('#examOverlay').classList.remove('open'); examCurKey=null; }
function examRefreshStatusLine(slot,c,rec){
  const st=examStatus(slot,c,Date.now()), el=$('#examStatusLine');
  el.className='ex-st '+st.code;
  if(st.code==='graded'){ el.textContent='已批改录分 '+rec.score+' / '+slot.max+' 分'; }
  else if(st.code==='doing'){ el.textContent='已标记做完，请在 '+st.left+' 分钟内上传照片并录分'; }
  else if(st.code==='late'){ el.textContent=(rec&&rec.doneTs)?'已超过 30 分钟，请尽快补传 / 补录':'该场已到考试时段结束时间，请批改录分'; }
  else { el.textContent='未到该场安排时间，可提前记录'; }
  $('#examMarkDoneBtn').style.display=(rec&&rec.doneTs)?'none':'';
}
function examBindRecorder(slot,c){
  $('#examCloseBtn').onclick=examClose;
  $('#examCancelBtn').onclick=examClose;
  $('#examMarkDoneBtn').onclick=()=>{
    let rec=state.exams.records[examCurKey];
    if(!rec){ rec={doneTs:Date.now(),score:null,photos:[],note:''}; state.exams.records[examCurKey]=rec; saveState(); }
    else if(!rec.doneTs){ rec.doneTs=Date.now(); saveState(); }
    examRefreshStatusLine(slot,c,rec); toast('已标记做完，记得 30 分钟内上传并录分');
  };
  $('#examObj').oninput=$('#examSubj').oninput=()=>{
    const o=parseFloat($('#examObj').value), s=parseFloat($('#examSubj').value);
    if(!isNaN(o)&&!isNaN(s)) $('#examScore').value=Math.round((o+s)*10)/10;
  };
  $('#examFile').onchange=ev=>examOnFiles(ev.target);
  $('#examSaveBtn').onclick=()=>examSave(slot,c);
  $('#examDelBtn').onclick=()=>examDelete(slot,c);
}
function examCompress(file){
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file), img=new Image();
    img.onload=()=>{
      const MAX=1600; let w=img.width,h=img.height;
      if(Math.max(w,h)>MAX){ const r=MAX/Math.max(w,h); w=Math.round(w*r); h=Math.round(h*r); }
      const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
      cv.getContext('2d').drawImage(img,0,0,w,h);
      URL.revokeObjectURL(url); resolve(cv.toDataURL('image/jpeg',0.72));
    };
    img.onerror=()=>{ URL.revokeObjectURL(url); reject(new Error('image decode fail')); };
    img.src=url;
  });
}
async function examOnFiles(input){
  const files=Array.from(input.files||[]); input.value='';
  if(!files.length) return;
  if(!authToken){ $('#examPhotoHint').textContent='当前未登录线上账号：分数可保存在本机，但照片云存储需要在登录后的域名使用。'; }
  for(const f of files){
    const tid=genItemId('x');
    let dataUrl='';
    try{ dataUrl=await examCompress(f); }catch(e){ toast('有图片读取失败'); continue; }
    const ph={tempId:tid,key:null,ts:Date.now(),name:f.name,localUrl:dataUrl,uploading:!!authToken,error:false};
    examPhotos.push(ph); examRenderPhotoList();
    if(!authToken){ ph.uploading=false; examRenderPhotoList(); continue; }
    try{
      const r=await api('/api/photo/upload','POST',{ext:'jpg',dataBase64:dataUrl});
      if(r&&r.ok){ ph.key=r.key; ph.uploading=false; }
      else { ph.uploading=false; ph.error=true; toast(r&&r.error?r.error:'上传失败'); }
    }catch(e){ ph.uploading=false; ph.error=true; toast('上传失败，请检查网络'); }
    examRenderPhotoList();
  }
}
function examRenderPhotoList(){
  const box=$('#examPhotoThumbs'); if(!box) return;
  box.innerHTML=examPhotos.map((p,i)=>{
    const src=p.localUrl||(p.key?('data-photo:'+p.key):'');
    let im;
    if(p.localUrl) im='<img src="'+p.localUrl+'">';
    else if(p.key) im='<img data-photo="'+p.key+'" src="">';
    else im='<div style="width:84px;height:84px;display:flex;align-items:center;justify-content:center;font-size:11px;color:#c0392b;border:1px solid #f5c6c0;border-radius:8px">上传失败</div>';
    const badge=p.uploading?'<span style="position:absolute;left:0;bottom:0;right:0;background:rgba(0,0,0,.55);color:#fff;font-size:10px;text-align:center">上传中</span>':'';
    return '<div class="ph">'+im+badge+'<button type="button" data-delphoto="'+i+'" title="删除">×</button></div>';
  }).join('');
  box.querySelectorAll('button[data-delphoto]').forEach(b=>b.onclick=()=>examRemovePhoto(+b.dataset.delphoto));
  box.querySelectorAll('img[data-photo]').forEach(async im=>{ const u=await examPhotoUrl(im.dataset.photo); if(u) im.src=u; });
}
async function examRemovePhoto(i){
  const p=examPhotos[i]; if(!p) return;
  if(p.key && authToken){ try{ await api('/api/photo/'+p.key,'DELETE'); }catch(e){} }
  examPhotos.splice(i,1); examRenderPhotoList();
}
function examSave(slot,c){
  const scoreRaw=$('#examScore').value.trim();
  if(scoreRaw===''){ toast('请填写总分（或客观 + 主观）'); return; }
  const score=parseFloat(scoreRaw);
  if(isNaN(score)||score<0||score>slot.max){ toast('总分需在 0 ~ '+slot.max+' 之间'); return; }
  if(examPhotos.some(p=>p.uploading)){ toast('还有照片在上传，请稍候'); return; }
  const objRaw=$('#examObj').value.trim(), subjRaw=$('#examSubj').value.trim();
  const old=state.exams.records[examCurKey]||{};
  const photos=examPhotos.filter(p=>p.key).map(p=>({key:p.key,ts:p.ts||Date.now(),name:p.name||''}));
  state.exams.records[examCurKey]={
    score,
    obj:objRaw===''?null:parseFloat(objRaw),
    subj:subjRaw===''?null:parseFloat(subjRaw),
    photos,
    note:$('#examNote').value.trim(),
    doneTs:old.doneTs||Date.now(),
    updated:Date.now()
  };
  saveState(); examClose(); renderExams(); renderSidebar();
  toast(slot.short+' '+examParseKey(examCurKey).year+' 录分已保存');
}
async function examDelete(slot,c){
  const rec=state.exams.records[examCurKey];
  if(!rec){ examClose(); return; }
  if(!confirm('确定清空 '+slot.name+' 这场的录分与照片吗？（云端照片一并删除）')) return;
  if(authToken && rec.photos){ for(const p of rec.photos){ if(p.key){ try{ await api('/api/photo/'+p.key,'DELETE'); }catch(e){} } } }
  delete state.exams.records[examCurKey];
  saveState(); examClose(); renderExams(); renderSidebar();
  toast('已清空本场记录');
}


/* ================= 思维导图速记（726页翻页卡） ================= */

Object.assign(globalThis, { EXAM_FIRST_YEAR, examSubjects, EXAM_SLOTS, examSlotByKey, ensureExams, mergeExams, examRecKey, examGetRec, examCycleDay1, examSlotDate, examSlotEndTs, examStatus, examCurrentCycle, examCollapsed, examSidebarItem, examToggleSubject, examSetDate, examJumpCurrent, renderExams, examSlotHtml, now0, examTrendSvg, examBindStatic, examCurKey, examBlobCache, examPhotoUrl, examHydrateThumbs, examParseKey, examOpen, examClose, examRefreshStatusLine, examBindRecorder, examCompress, examOnFiles, examRenderPhotoList, examRemovePhoto, examSave, examDelete });
export { EXAM_FIRST_YEAR, examSubjects, EXAM_SLOTS, examSlotByKey, ensureExams, mergeExams, examRecKey, examGetRec, examCycleDay1, examSlotDate, examSlotEndTs, examStatus, examCurrentCycle, examCollapsed, examSidebarItem, examToggleSubject, examSetDate, examJumpCurrent, renderExams, examSlotHtml, now0, examTrendSvg, examBindStatic, examCurKey, examBlobCache, examPhotoUrl, examHydrateThumbs, examParseKey, examOpen, examClose, examRefreshStatusLine, examBindRecorder, examCompress, examOnFiles, examRenderPhotoList, examRemovePhoto, examSave, examDelete };
