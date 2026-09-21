// 模块: attach（笔记附件：图片 / 文件上传到 R2）
// 图片：登录上传到 R2（/note/ 能力URL，<img> 可直接显示）；未登录降级为本地 dataURL 内嵌（仅本机）。
// 普通文件：必须登录，上传到 R2，以 Markdown 链接形式插入，点击下载（保留原文件名）。
const ATTACH_IMG = ['jpg','jpeg','png','gif','webp','bmp'];
const ATTACH_DOC = ['pdf','doc','docx','xls','xlsx','ppt','pptx','txt','md','csv','zip','rar','7z','gz','tar','mp4','mov','m4v','mp3','m4a'];
const IMG_MAX = 12 * 1024 * 1024;
const FILE_MAX = 25 * 1024 * 1024;
const EMBED_MAX = 3 * 1024 * 1024; // 未登录内嵌 dataURL 上限（localStorage 容量保护）

function attachAuthReady(){ try{ return !!(authToken || localStorage.getItem('auth_token')); }catch(e){ return !!localStorage.getItem('auth_token'); } }
function attachExt(name){ const m=/\.([a-z0-9]+)$/i.exec(name||''); return m?m[1].toLowerCase():''; }
function attachSafeName(n){ return String(n||'附件').replace(/[\[\]\r\n]/g,' ').trim()||'附件'; }

function attachReadDataURL(file){
  return new Promise((resolve,reject)=>{
    const fr=new FileReader();
    fr.onload=()=>resolve(fr.result);
    fr.onerror=()=>reject(fr.error||new Error('read failed'));
    fr.readAsDataURL(file);
  });
}

/* 大图压缩：最长边 1600，JPEG 0.82；返回 dataURL */
function attachShrink(file){
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file);
    const img=new Image();
    img.onload=()=>{
      const MAX=1600;
      let w=img.naturalWidth, h=img.naturalHeight;
      if(Math.max(w,h)>MAX){ const k=MAX/Math.max(w,h); w=Math.round(w*k); h=Math.round(h*k); }
      const cv=document.createElement('canvas'); cv.width=w; cv.height=h;
      const ctx=cv.getContext('2d'); ctx.drawImage(img,0,0,w,h);
      URL.revokeObjectURL(url);
      resolve({ dataUrl:cv.toDataURL('image/jpeg',0.82), ext:'jpg', type:'image/jpeg' });
    };
    img.onerror=()=>{ URL.revokeObjectURL(url); reject(new Error('image decode failed')); };
    img.src=url;
  });
}

function attachInsert(md){
  const ta=$('#noteContent');
  if(!ta){ toast('请先打开笔记编辑器'); return false; }
  const s=(ta.selectionStart==null)?ta.value.length:ta.selectionStart;
  const e=(ta.selectionEnd==null)?ta.value.length:ta.selectionEnd;
  ta.setRangeText(md,s,e,'end');
  ta.focus();
  ta.dispatchEvent(new Event('input',{bubbles:true}));
  if(typeof updatePreview==='function') updatePreview();
  return true;
}

async function noteAttachUpload(file, kind){
  if(!file) return;
  const ext=attachExt(file.name);
  const isImg = kind==='image' || (kind!=='file' && ATTACH_IMG.includes(ext));
  if(isImg && !ATTACH_IMG.includes(ext)){ toast('请选择图片（jpg/png/gif/webp/bmp）'); return; }
  if(!isImg && !(ATTACH_DOC.includes(ext)||ATTACH_IMG.includes(ext))){ toast('暂不支持该类型文件'); return; }
  if(!isImg && file.size>FILE_MAX){ toast('文件过大（上限 25MB）'); return; }

  let dataUrl, upExt=ext, upType=file.type||'application/octet-stream';
  try{ dataUrl=await attachReadDataURL(file); }catch(e){ toast('读取文件失败'); return; }
  if(isImg && file.size>IMG_MAX){
    try{ toast('图片较大，正在压缩…'); const c=await attachShrink(file); dataUrl=c.dataUrl; upExt=c.ext; upType=c.type; }
    catch(e){ toast('图片压缩失败，请换一张'); return; }
  }

  const name=attachSafeName(file.name);

  /* 未登录：图片内嵌本机；文件不支持 */
  if(!attachAuthReady()){
    if(!isImg){ toast('插入文件附件需要先登录（云端存储）'); return; }
    if(dataUrl.length>EMBED_MAX){ toast('未登录时仅能内嵌约 2.5MB 以内的图片，请登录后上传原图'); return; }
    if(attachInsert('\n!['+name+']('+dataUrl+')\n')) toast('未登录：图片已内嵌（仅保存在本机，登录后建议改用云端上传）');
    return;
  }

  const clean=dataUrl.replace(/^data:[^;]*;base64,/,'');
  toast('正在上传…');
  let r=null;
  try{ r=await api('/api/photo/upload','POST',{folder:'note',ext:upExt,contentType:upType,dataBase64:dataUrl}); }
  catch(e){ r={ok:false,error:String(e)}; }
  if(!r||!r.ok){ toast('上传失败：'+((r&&r.error)||'未知错误')); return; }
  if(isImg){
    attachInsert('\n!['+name+']('+r.url+')\n');
  }else{
    const dl=r.url+'?name='+encodeURIComponent(name);
    attachInsert('\n[附件：'+name+']('+dl+')\n');
  }
  toast(isImg?'图片已插入':'文件已插入');
}

function notePickImage(){
  const inp=document.createElement('input');
  inp.type='file'; inp.accept='image/*';
  inp.addEventListener('change',()=>{ const f=inp.files&&inp.files[0]; if(f) noteAttachUpload(f,'image'); inp.value=''; });
  inp.click();
}
function notePickFile(){
  const inp=document.createElement('input');
  inp.type='file';
  inp.addEventListener('change',()=>{ const f=inp.files&&inp.files[0]; if(f) noteAttachUpload(f,'file'); inp.value=''; });
  inp.click();
}

Object.assign(globalThis, { noteAttachUpload, notePickImage, notePickFile, attachShrink });
export { noteAttachUpload, notePickImage, notePickFile, attachShrink };
