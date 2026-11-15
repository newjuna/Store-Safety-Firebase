/* S6 안전보건협의체 결과 — 본사 ☰ 협의체 (맨 위 회의 카드 · 달 목록 · 결과) · 점장 「협의체 결과」
 *  서버: Relay coList · coGet (본사) / scCouncils · scCouncil · scCmPdf (점장)
 *  S8-24 결과 = 협의체 회의 종료 때 (안건 기간 = 지난 회의 다음 날 ~ 이번 회의 전날) · 25일 자동 생성 · 1일 공문 메일 없앰 · 예전 파일은 그대로 보임 */
let coL=null,coCur=null,coSel='';
const coMon=id=>id?id.slice(0,4)+'년 '+Number(id.slice(5,7))+'월':'';
const coRng=b=>(b.from||'').slice(5).replace('-','.')+' ~ '+(b.to||'').slice(5).replace('-','.');
const coPct=(a,b)=>b?Math.round(a/b*100)+'%':'–';
/** 협의체 결과 화면 (who S 본사 · P 점장) */
function coHtml(b,who,back,extra){if(typeof chkCss==='function')chkCss();const e=escapeText;
 let h='<div class="card">'+(back?'<button class="button ghost" type="button" onclick="'+back+'">← 협의체</button>':'')+'<h2 style="margin:'+(back?'12px':'0')+' 0 0">'+e(coMon(b.id))+' 안전보건협의체</h2><div class="muted">'+(b.meet?'회의 '+e(b.meet.when||'')+' · 안건 기간 '+e(coRng(b))+' · 업체 출석 '+(b.meet.vendors||[]).filter(v=>v.in).length+' / '+(b.meet.vendors||[]).length  /* S8-24 회의 결과 */
   :'집계 '+e(coRng(b))+(b.createdAt?' · 생성 '+e(fmtTime(b.createdAt)):'')+(who==='S'?(b.mailAt?' · 공문 '+e(fmtTime(b.mailAt))+' ('+b.mailCount+'통)':' · 예전 25일 결과 파일'):''))+'</div>'
  +'<div class="chknum"><div><b>'+b.sheets+'</b><span>점검 '+coPct(b.sheets,b.expect)+'</span></div><div class="'+(b.cPoor?'r':'')+'"><b>'+b.cPoor+'</b><span>공통 미흡</span></div><div class="'+(b.dPoor?'r':'')+'"><b>'+b.dPoor+'</b><span>도급 미흡</span></div><div class="'+(b.fRisk?'r':'')+'"><b>'+b.fRisk+'</b><span>집중 위험</span></div></div>'
  +(b.late?'<div class="muted" style="margin-top:6px">지난 기간 늦은 제출 '+b.late+'장 · 공통 미흡 '+(b.lateC||0)+' · 도급 미흡 '+(b.lateD||0)+' · 집중 위험 '+(b.lateF||0)+((b.lateTop||[]).length?' ('+b.lateTop.map(x=>e(x.name)+' '+x.n).join(' · ')+')':'')+'</div>':'')+'</div>';
 h+=extra||'';  // S8-1 협의체 회의 카드 (본사)
 if(who==='P'&&b.myStore){const M=b.mine||[];h+='<div class="card"><h2 style="margin:0 0 4px">'+e(b.myStore)+'</h2><div class="muted">'+e(b.myDept)+'</div>'+(M.length?M.map(x=>'<div class="shli" style="cursor:default">'+shIc(x.status==='DONE'?'check':'alert',x.status!=='DONE')+'<span class="t"><b>'+e(x.name)+'</b><span class="muted">'+e(shW(x.regDate)+(x.company?' · '+x.company:''))+'</span></span><span class="shpill '+(x.status==='DONE'?'ok':'no')+'">'+(x.status==='DONE'?'조치':'미조치')+'</span></div>').join(''):'<p class="muted" style="margin:8px 0 0">이번 기간 미흡 없음</p>')+'</div>'}
 const top=b.commonTop||[];
 h+='<div class="card"><h2 style="margin:0">위험요인 전파</h2>'+(top.length?'<table class="rtable chkt" style="margin-top:10px"><tr><th>공통 미흡 영역</th><th class="n">건</th></tr>'+top.map(x=>'<tr><td>'+e(x.name)+'</td><td class="n">'+x.n+'</td></tr>').join('')+'</table>':'<p class="muted" style="margin:8px 0 0">없음</p>')
  +((b.focusTop||[]).length?'<div class="muted" style="margin-top:8px">집중 위험 · '+b.focusTop.map(x=>e(x.name)+' '+x.n).join(' · ')+'</div>':'')+'</div>';
 h+='<div class="card"><h2 style="margin:0">부서 · 팀</h2><table class="rtable chkt" style="margin-top:10px"><tr><th>부서</th><th class="n">점검</th><th class="n">공통</th><th class="n">도급</th><th class="n">위험</th></tr>'
  +(b.byDept||[]).map(d=>'<tr'+(who==='P'&&d.dept===b.myDept?' style="background:var(--bg)"':'')+'><td><b>'+e(d.dept)+'</b>'+(d.top.length?'<div class="muted">'+d.top.map(x=>e(x.name)+' '+x.n).join(' · ')+'</div>':'')+'</td><td class="n">'+d.sheets+'<div class="muted">'+coPct(d.sheets,d.expect)+'</div></td><td class="n">'+d.cPoor+'</td><td class="n'+(d.dPoor?' r':'')+'">'+d.dPoor+'</td><td class="n">'+d.fRisk+'</td></tr>'
   +(who==='S'?'<tr><td colspan="5" style="padding:0"><details class="hist" style="margin:0;padding:4px 8px"><summary class="muted">팀 '+d.teamRows.length+'</summary>'+d.teamRows.map(t=>'<div class="muted">'+e(t.team)+' · 매장 '+t.stores+' · 점검 '+t.sheets+' · 공통 '+t.cPoor+' · 도급 '+t.dPoor+' · 위험 '+t.fRisk+'</div>').join('')+'</details></td></tr>':b.deptOnly&&(d.teamRows||[]).length?'<tr><td colspan="5" style="padding:2px 8px 8px">'+d.teamRows.map(t=>'<div class="muted">'+e(t.team)+' · 매장 '+t.stores+' · 점검 '+t.sheets+'장 · 공통 미흡 '+t.cPoor+(t.dPoor?' · 도급 미흡 '+t.dPoor:'')+'</div>').join('')+'</td></tr>':'')).join('')+'</table>'
  +(b.deptOnly?'<p class="muted" style="margin:6px 0 0">고른 매장의 부서만 보입니다.</p>':'')+'</div>';  /* S8-9 */
 h+='<div class="card"><h2 style="margin:0">입고도우미 업체 · 시정요구서</h2>'+((b.vendors||[]).length?'<table class="rtable chkt" style="margin-top:10px"><tr><th>업체</th><th class="n">발행</th><th class="n">조치</th><th class="n">7일 안</th><th class="n">미조치</th></tr>'+b.vendors.map(v=>'<tr><td><b>'+e(v.company)+'</b>'+(v.top.length?'<div class="muted">'+v.top.map(x=>e(x.name)+' '+x.n).join(' · ')+'</div>':'')+'</td><td class="n">'+v.issued+'</td><td class="n">'+v.done+'</td><td class="n">'+v.inTime+'</td><td class="n'+(v.open?' r':'')+'">'+v.open+'</td></tr>').join('')+'</table>':'<p class="muted" style="margin:8px 0 0">없음</p>')+'</div>';
 if((b.acc||[]).length)h+='<div class="card"><h2 style="margin:0">재해 발생</h2>'+b.acc.map(x=>'<div class="shli" style="cursor:default">'+shIc(x.status==='DONE'?'check':'alert',x.status!=='DONE')+'<span class="t"><b>'+e(x.storeName+' · '+String(x.accDate||'').slice(5).replace('-','.'))+'</b><span class="muted">'+e(x.memo+(who==='S'||who==='P'?' · '+x.company:''))+(x.plan?'<br>대책 · '+e(x.plan):'')+'</span></span><span class="shpill '+(x.status==='DONE'?'ok':'no')+'">'+(x.status==='DONE'?'조치':'조치 전')+'</span></div>').join('')+'</div>';  // S8-2
 if((b.joint||[]).length)h+='<div class="card"><h2 style="margin:0">합동점검 결과</h2>'+b.joint.map(j=>'<div class="muted">'+e(j.text||'')+'</div>').join('')+'</div>';
 if(who==='S'&&(b.lateList||[]).length)h+='<div class="card"><details class="hist"><summary>지난 기간 늦은 제출 '+b.lateList.length+'</summary>'+b.lateList.map(x=>'<div class="muted">'+e(x.storeName+' · '+shW(x.week)+' 주')+'</div>').join('')+'</details></div>';
 return h}

/* ---------- 본사 ☰ 협의체 ----------
 *  S8-24 맨 위 = 회의 카드 (열기 · 출석 · 종료 · 결과 PDF) · 아래 = 달 목록 (회의 · 출석 · 결과 PDF · 예전 25일 결과 파일)
 *  25일 자동 생성 · 1일 공문 메일은 없앰 (회의를 열면 개최 공문 메일 · 종료 = 결과) */
let coTopP='';  // 맨 위 회의 카드의 달 (메일 링크 · 목록에서 고름)
async function coLoad(){try{coL=await call('coList')}catch(e){coL={list:[],today:'',err:(e&&e.message)||'불러오지 못했습니다.'}}if(tab==='jobs'&&smenu==='co')renderJobs()}
/** 맨 위 카드 달: 고른 달 → 종료 안 한 회의 (가장 이른 달) → 이번 달 (이번 달 회의가 끝났으면 다음 달) */
function coTopPick(){const M=coL.meets||{},cur=coL.today.slice(0,7);if(coTopP)return coTopP;const open=Object.keys(M).filter(k=>M[k].status!=='DONE').sort();if(open.length)return open[0];
 return M[cur]&&M[cur].status==='DONE'?(typeof cmNextP==='function'?cmNextP(cur):cur):cur}
function coRefreshTop(id){coTopP=id||'';if(tab==='jobs'&&smenu==='co'&&!coSel)renderJobs()}
function sCo(){if(!coL){coLoad();return '<div class="card"><h2>협의체</h2><p class="muted">불러오는 중입니다…</p></div>'}if(coL.err){const m=coL.err;coL=null;return '<div class="card"><h2>협의체</h2><p class="muted">'+escapeText(m)+'</p><button class="button" type="button" onclick="renderJobs()">다시 시도</button></div>'}const e=escapeText;
 if(coSel&&coCur&&coCur.id===coSel)return coHtml(coCur,'S','coBack()',typeof cmCardHtml==='function'&&(coCur.meet||(coL.meets||{})[coSel])?cmCardHtml(coSel):'');
 const P=coTopPick(),M=coL.meets||{},F={};(coL.list||[]).forEach(c=>{F[c.id]=c});
 const ids=[...new Set(Object.keys(M).concat(Object.keys(F)))].sort().reverse();
 const row=id=>{const m=M[id],c=F[id],legacy=c&&!c.meet&&c.kind!=='MEET',done=m&&m.status==='DONE',res=done&&c&&!legacy;
  const sub=m?jtD(m.date)+(m.hour?' '+Number(m.hour)+'시':'')+(done?'':' · 출석 받는 중'):legacy?'예전 25일 결과 파일 · '+coRng(c):'회의 없음';
  const pill=m?(done?'<span class="shpill ok">'+m.nIn+' / '+m.nV+'</span>':'<span class="shpill no">진행</span>'):legacy?'':'<span class="shpill no">미개최</span>';
  const go=c?"coOpen('"+e(id)+"')":"coRefreshTop('"+e(id)+"');window.scrollTo(0,0)";
  return '<div class="row" style="gap:6px;align-items:center"><button class="shli" type="button" style="flex:1" onclick="'+go+'">'+shIc(done?'check':m?'cal':'doc')+'<span class="t"><b>'+e(coMon(id))+'</b><span class="muted">'+e(sub)+'</span></span>'+pill+'<span aria-hidden="true">›</span></button>'
   +(res?'<button type="button" class="linkbtn" onclick="cmPdfGet(\''+e(id)+'\')">PDF ↓</button>':'')+'</div>'};
 return '<div class="card"><h2 style="margin:0">협의체</h2><div class="muted">매월 중순 정기 회의 · 회의를 열면 업체에 개최 공문 메일 · 회의 종료 = 결과 PDF (개최 공문 + 안건 + 참석 현황)</div>'
  +(coTopP?'<button type="button" class="linkbtn" style="margin-top:6px" onclick="coRefreshTop(\'\')">← 지금 회의로</button>':'')+'</div>'
  +(typeof cmCardHtml==='function'?cmCardHtml(P):'')
  +'<div class="card"><h2 style="margin:0 0 4px">달별 협의체</h2>'+(ids.length?ids.map(row).join(''):'<p class="muted" style="margin:8px 0 0">아직 없습니다.</p>')
  +'<p class="muted" style="margin:8px 0 0">미개최 달 = 업체 점수 영향 없음 · 예전 25일 결과 파일은 그대로 볼 수 있습니다.</p></div>'}
async function coOpen(id){try{coCur=await call('coGet',id);coSel=id;jobsMode='form';renderJobs();window.scrollTo(0,0)}catch(e){}}
function coBack(){coSel='';coCur=null;renderJobs()}
async function coMakeNow(id){if(!await askOk('협의체 만들기',coMon(id)+' 협의체를 지금 기록으로 집계할까요?\n(이미 있으면 다시 만듭니다)','만들기'))return;try{coCur=await call('coMake',id);coSel=id;coL=null;await coLoad();msg('만들었습니다.')}catch(e){}}
async function coMailNow(id){if(!await askOk('공문 메일',coMon(id)+' 협의체 결과를 입고도우미 업체 계약담당자에게 메일로 보낼까요?','보내기'))return;try{coCur=await call('coMail',id);coSel=id;coL=null;await coLoad();msg('보냈습니다 · '+coCur.mailCount+'통')}catch(e){}}

/* ---------- 점장 「협의체 결과」 (shop.js shGo('council')) ---------- */
const SH_CO_SEEN='shopCoSeen';
/* S8-11 협의체는 본사 ↔ 업체 본사 회의 → 매장 고르기 없음
 *  처음 = 연도 ‹ › + 12달 칸 (결과가 있는 달만 누름 · 안 본 달 = 빨간 점) → 누르면 그 달 협의체 결과 화면만 */
let shCoL=null,shCoY=0;
async function shCouncilView(id){shMark('협의체 결과');const P=shPicked();if(!P.length){shGo('pick');return}if(typeof shRecCss==='function')shRecCss();
 if(id){shEl().innerHTML='<div class="card"><p class="muted">불러오는 중…</p></div>';let b;
  try{b=await shCall('scCouncil',{id,store:P[0].c})}catch(e){shCouncilView();return}if(shV!=='council')return;const seen=shLS.get(SH_CO_SEEN,[]);if(!seen.includes(id))shLS.set(SH_CO_SEEN,seen.concat(id).slice(-24));
  /* S8-9 부서 · 팀 표 = 점장이 고른 매장의 부서만 (위험요인 전파 · 업체 재해는 전국 그대로) · 매장 한 곳 카드는 뺌 */
  const MD=new Set([b.myDept].concat(P.map(s=>s.d)).filter(Boolean));b={...b,myStore:'',mine:null};if(MD.size)b={...b,byDept:(b.byDept||[]).filter(d=>MD.has(d.dept)),deptOnly:1};
  const pdf=b.meet?'<div class="card"><button class="button" type="button" style="width:100%" onclick="cmPdfGet(\''+escapeText(id)+'\',\'P\')">결과 PDF 내려받기</button><p class="muted" style="margin:6px 0 0">① 개최 공문 · ② 안건 · ③ 참석 현황</p></div>':'';  // S8-24
  shEl().innerHTML=coHtml(b,'P','shCouncilView()',pdf);window.scrollTo(0,0);return}
 if(!shCoL){shEl().innerHTML='<div class="card"><p class="muted">불러오는 중…</p></div>';try{shCoL=(await shCall('scCouncils',{})).list||[]}catch(e){return}if(shV!=='council')return}
 shCoDraw()}
function shCoDraw(y){const L=shCoL||[],e=escapeText,seen=shLS.get(SH_CO_SEEN,[]),by={};L.forEach(c=>{by[c.id]=c});
 const Ys=[...new Set(L.map(c=>Number(c.id.slice(0,4))))].sort(),now=new Date().getFullYear();if(!Ys.length)Ys.push(now);
 y=y||shCoY||Ys[Ys.length-1];if(y<Ys[0])y=Ys[0];if(y>Ys[Ys.length-1])y=Ys[Ys.length-1];shCoY=y;
 const arrow=d=>'<svg viewBox="0 0 24 24"><path d="'+(d<0?'m14.5 6-6 6 6 6':'m9.5 6 6 6-6 6')+'"/></svg>';
 const cell=i=>{const id=y+'-'+('0'+i).slice(-2),c=by[id],nw=c&&!seen.includes(id);
  return '<button type="button" class="shm'+(c?'':'')+'"'+(c?' onclick="shCouncilView(\''+id+'\')"':' disabled')+' aria-label="'+i+'월 협의체"><b>'+i+'월</b><i'+(nw?' style="color:var(--accent);font-weight:700"':'')+'>'+(c?(nw?'새 결과':'보기'):'&nbsp;')+'</i>'+(c?'<span class="dots"><u class="'+(nw?'n':'y')+'"></u></span>':'')+'</button>'};
 shEl().innerHTML='<div class="card"><div class="shyr"><button type="button" aria-label="지난해"'+(y>Ys[0]?' onclick="shCoDraw('+(y-1)+')"':' disabled')+'>'+arrow(-1)+'</button><b>'+y+'년 협의체</b><button type="button" aria-label="다음 해"'+(y<Ys[Ys.length-1]?' onclick="shCoDraw('+(y+1)+')"':' disabled')+'>'+arrow(1)+'</button></div>'
  +'<div class="shmg">'+Array.from({length:12},(_,i)=>cell(i+1)).join('')+'</div>'
  +'<div class="shleg"><span><u style="box-shadow:inset 0 0 0 1.5px var(--accent)"></u>새 결과 (아직 안 봄)</span><span><u style="background:var(--main)"></u>본 결과</span><span>흐린 달 = 결과 없음</span></div>'
  +(L.length?'':'<p class="muted" style="margin:8px 0 0">아직 협의체 결과가 없습니다. (협의체 회의가 끝나면 올라옵니다)</p>')+'</div>'}
