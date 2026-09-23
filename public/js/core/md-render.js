// 模块: md-render（由单文件重构拆分；顶层符号经 main.js 聚合为全局，保持零构建原生 ESM）

function conceptToHtml(text){

  if(!text) return '';

  let s = String(text);

  // 1. «MATH»...«/MATH» -> $$...$$（KaTeX auto-render 识别）

  s = s.replace(/«MATH»/g, '$$').replace(/«\/MATH»/g, '$$');

  // 2. 先提取并保护数学公式（$$...$$ 与 $...$）：公式内部只做 HTML 转义，

  //    不参与加粗/斜体/上标等 markdown 转换，避免公式里的 *、^、_ 破坏 $ 定界（如伴随矩阵 A^*）

  const maths = [];

  const escHtml = t => t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  s = s.replace(/\$\$[\s\S]*?\$\$|\$[^$\n]*?\$/g, m=>{

    const i = maths.length; maths.push(escHtml(m)); return '\u0000'+i+'\u0000';

  });

  // 3. 其余文本先转义 HTML（防 XSS），再在白名单标签上恢复

  s = s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // 4. **加粗** -> <strong>...</strong>

  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // 5. *斜体* -> <em>...</em>（不贪婪，避免误匹配）

  s = s.replace(/(^|[^*])\*([^*\n]+?)\*/g, '$1<em>$2</em>');

  // 6. pandoc 上标 2^32^ -> 2<sup>32</sup>

  s = s.replace(/([0-9a-zA-Z)])\^([^\s^]+)\^/g, '$1<sup>$2</sup>');

  // 7. 恢复课件里已有的 <sub>/<sup>/<em>/<strong> 标签

  s = s.replace(/&lt;(sub|sup|em|strong|b|i)\s*&gt;/g, '<$1>');

  s = s.replace(/&lt;\/(sub|sup|em|strong|b|i)\s*&gt;/g, '</$1>');

  // 8. 换行 -> <br>

  s = s.replace(/\n/g, '<br>');

  // 9. 还原数学公式（随后由 renderMath/ KaTeX auto-render 渲染）

  s = s.replace(/\u0000(\d+)\u0000/g, (_,i)=>maths[+i]);

  return s;

}



/* 渲染 concept 后调用 KaTeX auto-render；KaTeX 为 defer 脚本，首屏可能尚未就绪，未就绪则轮询重试，避免公式以源码显示 */

function renderMath(el){

  const delimiters = [

    {left: '$$', right: '$$', display: true},

    {left: '$', right: '$', display: false}

  ];

  const run = ()=>{

    if(window.renderMathInElement){

      try{ renderMathInElement(el, {delimiters: delimiters, throwOnError: false}); }catch(e){}

      return true;

    }

    return false;

  };

  if(run()) return;

  let tries = 0;

  const timer = setInterval(()=>{

    tries++;

    if(run() || tries > 60) clearInterval(timer);

  }, 100);

}



/* 编辑器：双栏 / 编辑 / 预览 */

let mdMode = 'split';

let mdTimer = null;

function updatePreview(){

  const src = $('#noteContent');

  const prev = $('#notePreview');

  if(prev && src){ prev.innerHTML = mdRenderMath(src.value); renderMath(prev); }

}

function setMdMode(mode){

  mdMode = mode;

  const body = $('#mdBody');

  if(body) body.dataset.mode = mode;

  document.querySelectorAll('#mdModeSeg button').forEach(b=>b.classList.toggle('on', b.dataset.mode===mode));

  if(mode!=='edit') updatePreview();

  if(mode==='edit'){ const ta = $('#noteContent'); if(ta) ta.focus(); }

}



/* 工具栏：在光标处插入 Markdown 语法 */

function mdTool(cmd){

  const ta = $('#noteContent');

  if(!ta) return;

  const start = ta.selectionStart, end = ta.selectionEnd;

  const sel = ta.value.slice(start, end);

  let before = '', after = '', ins = '';

  switch(cmd){

    case 'bold': before='**'; after='**'; ins='加粗文字'; break;

    case 'italic': before='*'; after='*'; ins='斜体文字'; break;

    case 'strike': before='~~'; after='~~'; ins='删除线'; break;

    case 'h2': before='\n## '; ins='二级标题'; break;

    case 'h3': before='\n### '; ins='三级标题'; break;

    case 'quote': before='\n> '; ins='引用内容'; break;

    case 'code': before='`'; after='`'; ins='行内代码'; break;

    case 'codeblock': before='\n```c\n'; after='\n```\n'; ins='int main() { return 0; }'; break;

    case 'ul': before='\n- '; ins='列表项'; break;

    case 'ol': before='\n1. '; ins='列表项'; break;

    case 'link': {
      if(sel){
        const lead='[', tail='](https://)';
        ta.setRangeText(lead+sel+tail, start, end, 'end');
        const u0=start+lead.length+sel.length+2;
        ta.setSelectionRange(u0, u0+8);
      }else{
        const u=window.prompt('请输入链接地址（含 http:// 或 https://）：','https://');
        if(!u || u==='https://'){ ta.focus(); return; }
        const url=/^https?:\/\//.test(u)?u:'https://'+u;
        const txt=window.prompt('链接显示的文字：','链接文字')||'链接文字';
        ta.setRangeText('['+txt+']('+url+')', start, end, 'end');
      }
      ta.focus(); updatePreview(); return;
    }

    default: return;

  }

  ta.setRangeText(before + (sel || ins) + after, start, end, 'end');

  ta.focus();

  updatePreview();

}



/* 涂鸦画板 */

let drawState = { tool:'pen', color:'#1B1F24', size:4, strokes:[] };

let drawPointer = null;

/* ============================================================
 * Markdown 渲染（marked + highlight.js，转义原始 HTML 防注入）
 * ============================================================ */
const ALLOWED_HTML_TAGS = new Set(['div','span','table','thead','tbody','tfoot','tr','td','th','img','b','i','u','s','br','hr','p','ul','ol','li','h1','h2','h3','h4','h5','h6','blockquote','pre','code','strong','em','sup','sub','a','font','center','mark','small','del','ins']);
function sanitizeHtml(raw){
  // 防 XSS：移除 on* 事件属性、javascript: 协议，只放行白名单标签
  return raw
    .replace(/<(\/?)(\w+)/g, (mm, slash, tag) => ALLOWED_HTML_TAGS.has(tag.toLowerCase()) ? '<'+slash+tag.toLowerCase() : '<'+slash+'__esc__'+tag)
    .replace(/<__esc__/g, '&lt;')
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    .replace(/javascript:/gi, '');
}
const mdRenderer = {

  html(html){ return sanitizeHtml(html); },

  image(href, title, text){

    let src = href;

    if(href && href.startsWith('drawing://')){

      src = state.drawings[href.slice(10)] || '';

    }

    if(!src) return '';

    const t = title ? ` title="${esc(title)}"` : '';

    const alt = text ? esc(text) : '涂鸦';

    return `<img class="md-img" src="${esc(src)}" alt="${alt}"${t} loading="lazy">`;

  },

  link(href, title, text){

    const t = title ? ` title="${esc(title)}"` : '';

    return `<a href="${esc(href)}"${t} target="_blank" rel="noopener noreferrer">${text}</a>`;

  },

  code(code, infostring){

    const lang = (infostring||'').trim().split(/\s+/)[0];

    let html;

    if(lang && window.hljs && hljs.getLanguage(lang)){

      try{ html = hljs.highlight(code, {language:lang, ignoreIllegals:true}).value; }

      catch(e){ html = esc(code); }

    }else{

      html = esc(code);

    }

    return `<pre><code class="hljs${lang?' language-'+esc(lang):''}">${html}</code></pre>`;

  }

};

if(window.marked) marked.use({gfm:true, breaks:true, renderer:mdRenderer});

/* 数学公式保护：先抽出 $$...$$ / $...$ 占位，避免 marked 破坏公式内的 _ ^ { }，解析后还原，再交给 KaTeX */

/* 数学公式保护：先抽出 $$...$$ / $...$ 占位，避免 marked 破坏公式内的 _ ^ { }，解析后还原，再交给 KaTeX */
function mdRenderMath(text){
  if(!text) return '';
  try{
    const store=[];
    const prot = text.replace(/\$\$[\s\S]+?\$\$|\$[^\n$]+?\$/g, m=>{
      store.push(m); return '@@MATH'+(store.length-1)+'@@';
    });
    let html = window.marked ? marked.parse(prot) : esc(prot);
    html = html.replace(/@@MATH(\d+)@@/g, (mm,i)=> store[+i]!=null ? store[+i] : mm);
    return html;
  }catch(e){ return mdRender(text); }
}

function mdRender(text){

  if(!text) return '';

  try{ return window.marked ? marked.parse(text) : esc(text); }

  catch(e){ return esc(text); }

}

/* 考点 concept / 列表项：marked(gfm：表格·代码块·列表) + 数学保护 + 兼容旧 pandoc 上标 ^x^ */

/* 考点 concept / 列表项：marked(gfm：表格·代码块·列表) + 数学保护 + 兼容旧 pandoc 上标 ^x^ */
function normalizeSoft(s){
  const lines=s.split('\n'), out=[];
  const isStruct=(ln)=>/^\s*([-*+]\s|\d+[.、)]\s|[①-⑳]|[·•]\s*|#{1,6}\s|>|\||```|\$\$|@@)/.test(ln);
  for(const r0 of lines){
    const ln=r0.replace(/\s+$/,'');
    if(/@@FENCE\d+@@/.test(ln)){ out.push(ln); continue; }
    if(ln.trim()==='' || isStruct(ln) || out.length===0 || out[out.length-1].trim()===''){ out.push(ln); }
    else { out[out.length-1]=out[out.length-1].replace(/\s+$/,'')+' '+ln.trim(); }
  }
  return out.join('\n');
}

function mdBlocks(text, inline){
  const math=[];
  let s=String(text);
  s=s.replace(/«MATH»/g,'$$').replace(/«\/MATH»/g,'$$');
  s=s.replace(/\$\$[\s\S]+?\$\$|\$[^\n$]+?\$/g, m=>{ math.push(m); return '@@MATH'+(math.length-1)+'@@'; });
  const fences=[];
  s=s.replace(/```[\s\S]*?```/g, m=>{ fences.push(m); return '@@FENCE'+(fences.length-1)+'@@'; });
  const sup=[];
  s=s.replace(/([0-9A-Za-z)])\^([^\s^]+)\^/g, (m,pre,x)=>{ sup.push(x); return pre+'@@SUP'+(sup.length-1)+'@@'; });
  s=normalizeSoft(s);
  s=s.replace(/@@FENCE(\d+)@@/g, (m,i)=> fences[+i]!=null?fences[+i]:m);
  let html = window.marked ? (inline ? marked.parseInline(s) : marked.parse(s)) : esc(s);
  html=html.replace(/@@SUP(\d+)@@/g, (mm,i)=> sup[+i]!=null ? '<sup>'+esc(sup[+i])+'</sup>' : mm);
  html=html.replace(/@@MATH(\d+)@@/g, (mm,i)=> math[+i]!=null ? math[+i] : mm);
  return html;
}

function conceptMd(text){ if(!text) return ''; try{ return mdBlocks(text,false); }catch(e){ try{return conceptToHtml(text);}catch(_){ return esc(text); } } }

function inlineMd(text){ if(!text) return ''; try{ return mdBlocks(text,true); }catch(e){ return esc(text); } }




/* ===== 用户自定义框架图（localStorage） ===== */

Object.assign(globalThis, { conceptToHtml, renderMath, mdMode, mdTimer, updatePreview, setMdMode, mdTool, drawState, drawPointer, mdRenderer, mdRenderMath, mdRender, normalizeSoft, mdBlocks, conceptMd, inlineMd });
export { conceptToHtml, renderMath, mdMode, mdTimer, updatePreview, setMdMode, mdTool, drawState, drawPointer, mdRenderer, mdRenderMath, mdRender, normalizeSoft, mdBlocks, conceptMd, inlineMd };
