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

    case 'link': before='['; after='](https://)'; ins='链接文字'; break;

    default: return;

  }

  ta.setRangeText(before + (sel || ins) + after, start, end, 'end');

  ta.focus();

  updatePreview();

}



/* 涂鸦画板 */

let drawState = { tool:'pen', color:'#1B1F24', size:4, strokes:[] };

let drawPointer = null;


Object.assign(globalThis, { conceptToHtml, renderMath, mdMode, mdTimer, updatePreview, setMdMode, mdTool, drawState, drawPointer });
export { conceptToHtml, renderMath, mdMode, mdTimer, updatePreview, setMdMode, mdTool, drawState, drawPointer };
