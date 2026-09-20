// 模块: util（由单文件重构拆分；顶层符号经 main.js 聚合为全局，保持零构建原生 ESM）

const $ = (sel, root)=> (root||document).querySelector(sel);

const esc = s => String(s).replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function getSubject(id){ return SYLLABUS.find(s=>s.id===id); }



/* 根据路径解析节点：'ds/1/1/0' 或 'ds/1/1'（小节本身为考点） */

function getNode(path){

  if(!path) return null;

  const p = path.split('/');

  const sub = getSubject(p[0]);

  if(!sub) return null;

  const ci = Number(p[1]);

  const ch = sub.chapters[ci];

  if(ch===undefined) return {subject:sub};

  const si = Number(p[2]);

  const sec = ch.sections[si];

  if(sec===undefined) return {subject:sub, chapter:ch};

  if(p.length>3){

    const ti = Number(p[3]);

    const tp = sec.topics[ti];

    if(tp) return {subject:sub, chapter:ch, section:sec, topic:tp};

  }

  return {subject:sub, chapter:ch, section:sec};

}

function isLeafNode(node){

  if(!node) return false;

  if(node.topic) return true;

  if(node.section) return node.section.topics.length===0;

  return false;

}

/* 考点（叶子）路径：topic 为 s/ci/si/ti，无 topic 的小节为 s/ci/si */

function leafPath(node){

  const {subject,chapter,section,topic} = node;

  const base = `${subject.id}/${subject.chapters.indexOf(chapter)}/${chapter.sections.indexOf(section)}`;

  return topic ? `${base}/${section.topics.indexOf(topic)}` : base;

}

function nodeLabel(node, withNum){

  const {chapter,section,topic} = node;

  if(topic){ const ti = section.topics.indexOf(topic); return (withNum!==false ? (ti+1)+'. ' : '') + topic.name; }

  if(section) return section.name;

  if(chapter) return chapter.name;

  return node.subject.name;

}

/* 遍历某学科的考点（叶子） */

function eachLeaf(sub, fn){

  sub.chapters.forEach((ch,ci)=>{

    ch.sections.forEach((sec,si)=>{

      if(sec.topics.length){

        sec.topics.forEach((tp,ti)=> fn(`${sub.id}/${ci}/${si}/${ti}`));

      }else{

        fn(`${sub.id}/${ci}/${si}`);

      }

    });

  });

}

/* 学科统计 */

function subStats(sub){

  let total=0, mastered=0, studying=0;

  eachLeaf(sub, p=>{

    total++;

    const m = state.mastery[p];

    if(m==='mastered') mastered++;

    else if(m==='studying') studying++;

  });

  const pct = total? Math.round((mastered + studying*0.5)/total*100):0;
  if(sub.id==='eng'){ try{ return {total,mastered,studying,pct:engMasteryPct()}; }catch(e){} }
  return {total, mastered, studying, pct};

}

/* 章节统计（仅统计该章节下叶子） */

function chapterStats(sub, ci){

  let total=0, mastered=0, studying=0;

  sub.chapters[ci].sections.forEach((sec,si)=>{

    if(sec.topics.length){

      sec.topics.forEach((tp,ti)=>{

        total++;

        const m = state.mastery[`${sub.id}/${ci}/${si}/${ti}`];

        if(m==='mastered') mastered++; else if(m==='studying') studying++;

      });

    }else{

      total++;

      const m = state.mastery[`${sub.id}/${ci}/${si}`];

      if(m==='mastered') mastered++; else if(m==='studying') studying++;

    }

  });

  return {total, mastered, studying};

}

function overallStats(){

  let total=0, mastered=0, studying=0;

  let wp=0, wsum=0;
  SYLLABUS.forEach(s=>{ const st=subStats(s); total+=st.total; mastered+=st.mastered; studying+=st.studying; const sc=SUBJECT_SCORES[s.id]||0; wp+=st.pct*sc; wsum+=sc; });

  return {total, mastered, studying, pct: wsum? Math.round(wp/wsum):0};

}



/* ============================================================

 * 树展开状态（仅内存）

 * ============================================================ */

let openState = {}; // 章节默认展开、小节默认折叠

function isChapterOpen(subId, ci){ return openState[`${subId}/${ci}`] !== false; }

function isSectionOpen(subId, ci, si){ return openState[`${subId}/${ci}/${si}`] === true; }



/* ============================================================

 * 渲染：总览

 * ============================================================ */

/* ================= 英语大纲词汇（艾宾浩斯 · 词形key · 三态轮播 · 难度分 · 记录） ================= */

function subColor(id){

  const s = getSubject(id);

  return s ? s.color : '#8A929C';

}

function subName(id){

  const s = getSubject(id);

  return s ? s.name : '其他 / 综合';

}

function fmtTime(ts){

  const d = new Date(ts);

  const p = n=>String(n).padStart(2,'0');

  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;

}



/* ---------- 学习条目统一库：类型配置 / 考点路径 / CRUD / 学习中心 ---------- */

Object.assign(globalThis, { $, esc, getSubject, getNode, isLeafNode, leafPath, nodeLabel, eachLeaf, subStats, chapterStats, overallStats, openState, isChapterOpen, isSectionOpen, subColor, subName, fmtTime });
export { $, esc, getSubject, getNode, isLeafNode, leafPath, nodeLabel, eachLeaf, subStats, chapterStats, overallStats, openState, isChapterOpen, isSectionOpen, subColor, subName, fmtTime };
