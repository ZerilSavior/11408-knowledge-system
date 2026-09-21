// 模块: code50（408代码题预测50题独立打卡，类似阅读打卡，不占用考点时间盒）

const CODE50_TITLES = [
"第1题 ⭐⭐ 欧拉路径判定（2021真题变形）",
"第2题 ⭐ 输出K顶点（2023真题）",
"第3题 ⭐⭐ 判断有向图是否有环（拓扑排序应用）",
"第4题 ⭐⭐ 拓扑序列唯一性判定（2024真题）",
"第5题 ⭐⭐ 输出拓扑排序序列",
"第6题 ⭐⭐ BFS求无权图最短路径",
"第7题 ⭐⭐ DFS求连通分量个数",
"第8题 ⭐⭐⭐ DFS判断路径是否存在",
"第9题 ⭐⭐⭐ Prim最小生成树",
"第10题 ⭐⭐⭐ Dijkstra最短路径",
"第11题 ⭐⭐ 判断图是否为树",
"第12题 ⭐⭐ 统计入度/出度并输出",
"第13题 ⭐⭐⭐ BFS求从起点到终点的最短路径（记录路径）",
"第14题 ⭐ 查找倒数第k个结点（2009真题）",
"第15题 ⭐⭐ 两个链表第一个公共结点（2012真题）",
"第16题 ⭐⭐⭐ 链表重排（2019真题）",
"第17题 ⭐ 快慢指针找链表中点",
"第18题 ⭐⭐ 判断链表是否有环",
"第19题 ⭐⭐⭐ 找环的入口结点",
"第20题 ⭐⭐ 链表删除绝对值重复结点（2015真题）",
"第21题 ⭐ 反转单链表（迭代法）",
"第22题 ⭐⭐ 合并两个有序单链表",
"第23题 ⭐⭐ 判断链表是否为回文",
"第24题 ⭐⭐ 求二叉树带权路径长度WPL（2014真题）",
"第25题 ⭐⭐⭐ 表达式树转中缀表达式（2017真题）",
"第26题 ⭐⭐ 判断二叉树是否为BST（2022真题）",
"第27题 ⭐⭐⭐ BST中查找与K差最小的结点（2026真题）",
"第28题 ⭐ 求二叉树高度",
"第29题 ⭐ 统计叶子结点个数",
"第30题 ⭐⭐ 层序遍历（BFS）",
"第31题 ⭐⭐ 求根到叶子路径之和",
"第32题 ⭐⭐⭐ 最近公共祖先",
"第33题 ⭐ 翻转二叉树",
"第34题 ⭐⭐ 求二叉树宽度（最宽层结点数）",
"第35题 ⭐⭐⭐ 由前序+中序重建二叉树",
"第36题 ⭐ 数组循环左移（2010真题）",
"第37题 ⭐⭐⭐ 两个等长升序序列中位数（2011真题）",
"第38题 ⭐⭐ 摩尔投票法找主元素（2013真题）",
"第39题 ⭐⭐⭐ 集合划分（2016真题）",
"第40题 ⭐⭐⭐ 最小未出现正整数（2018真题）",
"第41题 ⭐⭐⭐ 三元组最小距离（2020真题）",
"第42题 ⭐⭐ 乘积最大值（2025真题）",
"第43题 ⭐⭐ 二分查找：旋转有序数组找目标",
"第44题 ⭐ 荷兰国旗问题（三向切分）",
"第45题 ⭐ 移动零",
"第46题 ⭐ 找缺失数字",
"第47题 ⭐⭐ 找重复数（1~n范围，一个重复）",
"第48题 ⭐⭐ 数组中第k大元素",
"第49题 ⭐⭐ 合并两个有序数组",
"第50题 ⭐⭐ 数组中出现次数超过n/3的元素"
];

const CODE50_GROUPS = [
  {name:"图类", start:0, end:13, color:"#0a8a5f", bg:"#e3f6ee"},
  {name:"链表类", start:13, end:23, color:"#1565c0", bg:"#e3f2fd"},
  {name:"二叉树类", start:23, end:35, color:"#7b1fa2", bg:"#f3e5f5"},
  {name:"顺序表/数组类", start:35, end:50, color:"#c2560a", bg:"#fff0e2"}
];

function ensureCode50(){
  if(!state.code50||typeof state.code50!=='object') state.code50={start:'',done:{}};
  const c=state.code50;
  if(!c.done||typeof c.done!=='object') c.done={};
  return c;
}

function mergeCode50(local,cloud){
  const l=local||{start:'',done:{}};
  const out={start:l.start||(cloud&&cloud.start)||'',done:{}};
  const keys=new Set([].concat(Object.keys(l.done||{}),Object.keys((cloud&&cloud.done)||{})));
  keys.forEach(k=>{ const a=(l.done||{})[k], b=(cloud&&cloud.done||{})[k]; out.done[k]=b?b:a; });
  return out;
}

function code50Start(){
  const c=ensureCode50();
  return c.start || planTodayStr();
}

function code50TodayIdx(){
  const s=code50Start(), t=planTodayStr();
  return planDiff(s,t);
}

function code50DoneN(){
  const c=ensureCode50(); let n=0;
  Object.keys(c.done).forEach(k=>{ if(+k>=0&&+k<50&&c.done[k])n++; });
  return n;
}

function code50Toggle(idx){
  const c=ensureCode50();
  if(c.done[idx]){ delete c.done[idx]; } else { c.done[idx]=Date.now(); }
  saveState(); cloudSave(); renderCode50(); renderSidebar();
}

function code50DoToday(){
  const idx=code50TodayIdx();
  if(idx<0||idx>=50){ toast(idx>=50?'50题已全部排完':'今天还没到开始日'); return; }
  const c=ensureCode50();
  c.done[idx]=Date.now();
  saveState(); cloudSave(); renderCode50(); renderSidebar();
  toast('已打卡：'+CODE50_TITLES[idx]);
}

function code50GroupOf(idx){
  for(const g of CODE50_GROUPS){ if(idx>=g.start&&idx<g.end) return g; }
  return CODE50_GROUPS[0];
}

function code50Grid(){
  const c=ensureCode50();
  const todayIdx=code50TodayIdx();
  let cells='';
  for(let i=0;i<50;i++){
    const g=code50GroupOf(i);
    const done=!!c.done[i];
    const isToday=(i===todayIdx);
    const bg=done?g.color:(isToday?g.bg:'#f5f5f5');
    const col=done?'#fff':g.color;
    const bd=isToday?'box-shadow:0 0 0 2px var(--ink);':'';
    cells+='<button class="r-cell" title="'+(i+1)+'. '+CODE50_TITLES[i]+(done?' · 已完成':'')+(isToday?' · 今日':'')+'" '
      +'style="background:'+bg+';color:'+col+';'+bd+'" onclick="code50Toggle('+i+')">'+(i+1)+'</button>';
  }
  return '<div class="r-grid">'+cells+'</div>';
}

function renderCode50(){
  const app=$('#code50App'); if(!app)return;
  ensureCode50();
  const doneN=code50DoneN();
  const todayIdx=code50TodayIdx();
  const pct=Math.round(100*doneN/50);
  const start=code50Start();
  const todayTitle=(todayIdx>=0&&todayIdx<50)?CODE50_TITLES[todayIdx]:null;

  let h='';
  h+='<div class="p-hero"><div class="p-stat"><div class="n">'+doneN+'<small>/ 50</small></div><div class="l">已完成</div></div>'
    +'<div class="p-stat"><div class="n">'+todayIdx+'<small>天</small></div><div class="l">已推进</div></div>'
    +'<div class="p-stat"><div class="n">'+(50-doneN)+'<small>题</small></div><div class="l">剩余</div></div>'
    +'<div class="p-stat"><div class="n">'+pct+'<small>%</small></div><div class="l">进度</div></div></div>';

  h+='<div class="p-card"><h3>今日代码题</h3>';
  if(todayTitle){
    h+='<div class="sub" style="margin:6px 0 12px">'+start+' 开始 · 第 <b>'+(todayIdx+1)+'</b> 天（今天）</div>'
      +'<div style="padding:10px 14px;background:#f5f5f5;border-radius:8px;margin:8px 0 12px;font-weight:600">'+todayTitle+'</div>'
      +'<button class="p-btn" onclick="code50DoToday()">一键完成今日第 '+(todayIdx+1)+' 题</button>';
  } else if(todayIdx>=50){
    h+='<div class="sub" style="margin:6px 0 12px"><b>50题已全部排完。</b>可在下方网格回顾或补做任意题目。</div>';
  } else {
    h+='<div class="sub" style="margin:6px 0 12px">今天还没到开始日（'+start+'）。</div>';
  }
  h+='<div class="p-prog" style="margin-top:14px"><span>'+doneN+' / 50</span><div class="pbar" style="flex:1"><i style="width:'+pct+'%;background:#c05b1f"></i></div><span>'+pct+'%</span></div></div>';
  h+='</div>';

  // 图例
  let legend='';
  for(const g of CODE50_GROUPS){
    legend+='<span style="display:inline-block;width:10px;height:10px;background:'+g.color+';border-radius:2px;margin-right:5px"></span>'
      +g.name+'（'+(g.start+1)+'-'+g.end+'）　';
  }
  h+='<div class="p-card"><h3>逐题打卡（点击格子切换完成）</h3>'
    +'<div class="sub" style="margin:6px 0 12px">'+legend+'描边为今日题目</div>'
    +code50Grid()+'</div>';

  h+='<div class="p-card"><h3>说明</h3><div class="sub" style="line-height:1.9">'
    +'代码题预测50题来自408数据结构历年真题高频考点变形，涵盖<b>图类、链表类、二叉树类、顺序表/数组类</b>四大方向。'
    +'代码题在408统考150分中约占<b>12分</b>（综合应用题最后一题），独立于考点学习时间盒，每天1题，做完后对照参考代码检查并记录错题。'
    +'从 <b>'+start+'</b> 开始连续排50天，每题约30分钟。</div></div>';

  app.innerHTML=h;
}

function code50SideMeta(){ try{ return code50DoneN()+' / 50 题'; }catch(e){ return '50 题'; } }

Object.assign(globalThis, { CODE50_TITLES, ensureCode50, mergeCode50, code50Start, code50TodayIdx, code50DoneN, code50Toggle, code50DoToday, code50GroupOf, code50Grid, renderCode50, code50SideMeta });
export { CODE50_TITLES, ensureCode50, mergeCode50, code50Start, code50TodayIdx, code50DoneN, code50Toggle, code50DoToday, code50GroupOf, code50Grid, renderCode50, code50SideMeta };
