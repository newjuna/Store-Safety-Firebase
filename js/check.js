/* S4 본사: 점장 점검 현황 · 점검 항목 관리 · 가이드 사진 · 점검 시작 주 — 'jobs' 칸에 그림 (staff.js renderJobs)
 *  현황: 주 고르기 → 부서 → 팀 → 매장 · 제출 · 미제출 · 밀린 주 · 미흡 수 · 매장 누르면 점검 1장 (사진 포함)
 *  서버: fb.js checkBoard (WEEKSUM 주마다 1번 읽기) · scCounts · scDetail / Relay ckGet · ckSave · ckGuide · ckStart */
let chkB=null,chkW='',chkLv=['all'],chkCnt=null,chkDet=null,ckE=null,ckInfo=null,ckTab='c',ckMon=new Date().getMonth()+1,ckDirty=false;
const chkAdd=(w,n)=>{const d=new Date(w+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const chkWl=w=>w?w.slice(5).replace('-','.'):'';
function ckReset(){chkDet=null;if(!ckDirty)ckE=null;if(typeof caCur!=='undefined')caCur='';if(typeof coSel!=='undefined'){coSel='';coCur=null}}
function chkCss(){if(typeof shCss==='function')shCss();if(typeof stCss==='function')stCss();if($('chkCss'))return;const s=document.createElement('style');s.id='chkCss';s.textContent=
 '.chkbar{display:flex;align-items:center;justify-content:space-between;gap:8px}.chkbar button{min-width:44px}.chkbar b{font-size:18px}'
 +'.chknum{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}.chknum div{border:1px solid var(--line);border-radius:10px;padding:8px 4px;text-align:center}.chknum b{display:block;font-size:18px}.chknum span{font-size:12px;color:var(--sub)}.chknum .r b{color:var(--accent)}'
 +'.chkt td,.chkt th{padding:7px 8px}.chkt tr.go{cursor:pointer}.chkt tr.go:hover td{background:var(--bg)}.chkt .n{text-align:right;white-space:nowrap}.chkt .r{color:var(--accent);font-weight:600}'
 +'.chkcrumb{display:flex;flex-wrap:wrap;gap:4px;align-items:center;font-size:14px}.chkcrumb button{border:0;background:none;font:inherit;color:var(--sub);cursor:pointer;padding:2px 4px}.chkcrumb b{padding:2px 4px}'
 +'.ckg{border:1px solid var(--line);border-radius:12px;padding:12px;margin-top:10px;background:#fff}.ckg.off{opacity:.55}.ckrow{display:flex;gap:6px;align-items:flex-start;margin-top:6px}.ckrow textarea,.ckrow input[type=text]{flex:1;min-width:0;padding:8px 10px;border:1px solid var(--line);border-radius:8px;font:inherit;resize:vertical}'
 +'.ckrow select{padding:8px;border:1px solid var(--line);border-radius:8px;font:inherit;background:#fff}.ckuse{display:flex;align-items:center;gap:4px;font-size:13px;white-space:nowrap;color:var(--sub);padding-top:8px}'
 +'.ckgd{display:flex;gap:8px;margin-top:8px}.ckgd>div{flex:1;border:1px dashed #cbd5e1;border-radius:10px;padding:6px;text-align:center;font-size:12.5px;color:var(--sub);position:relative}.ckgd img{width:100%;max-height:120px;object-fit:contain;display:block;border-radius:6px;margin-bottom:4px}'
 +'.ckgd label{cursor:pointer;color:var(--main);font-weight:600}.ckgd input{display:none}.ckgd .x{border:0;background:none;color:var(--accent);font:inherit;font-size:12.5px;cursor:pointer}';document.head.appendChild(s)}

/* ---------- 점검 현황 ---------- */
let chkErr='',ckErr='';
async function chkLoad(quiet){const first=!chkB;try{chkB=await (quiet?callQuiet:call)('checkBoard');if(!chkW||chkW>chkB.thisWeek||chkW<chkB.start)chkW=chkB.thisWeek;if(first&&chkB.team)chkLv=chkTeamRoot()}catch(e){chkErr=(e&&e.message)||'불러오지 못했습니다.'}
 if(!(chkB&&chkB.team))try{chkCnt=await callQuiet('scCounts')}catch(e){}if(tab==='jobs'&&smenu==='check')renderJobs()}
/** S8-23 소속만 보기: 처음 보이는 단계 = 팀 1개면 그 팀 매장 · 한 부서면 팀별 · 그 외 전체 */
function chkTeamRoot(){const T=chkB.team.teams,D=[...new Set(chkB.teams.map(x=>x[1]))];return T.length===1?['team',(chkB.teams[0]||[])[1]||'부서 미지정',T[0]]:D.length===1?['dept',D[0]]:['all']}
const chkTm=()=>chkB&&chkB.team;  // S8-23
function chkTeamBar(){const T=chkTm();if(!T)return '';const n=chkB.stores.length,unit=T.teams.length===1?T.teams[0]:(T.unit||T.teams.join(' · '));
 return '<div style="background:var(--main);color:#fff;border-radius:10px;padding:8px 12px;margin-bottom:10px;display:flex;justify-content:space-between;gap:8px;font-size:13.5px"><span><b>'+escapeText(unit)+'</b>만 보는 중</span><span>'+(T.teams.length>1?T.teams.length+'팀 · ':'')+'매장 '+n+'곳</span></div>'}
/** S8-23 팀장 [Teams로 공유하기] = 내 팀 미제출 표를 내 Teams로 (금요일 자동 알림과 같은 카드) */
async function chkShareGo(){const T=chkTm();if(!T||!T.lead.length)return;
 if(!await askOk('Teams로 공유하기',chkWkName(chkW)+' '+T.lead.join(' · ')+' 미제출 표를 내 Teams로 보냅니다.','보내기'))return;
 try{const r=await call('chkShare',chkW);if(r.none){msg('이 달 미제출 매장이 없습니다.');return}
  if(!r.sent)popup('못 보냄','Teams로 보내지 못했습니다. 조직도의 회사 이메일을 확인해 주세요.','확인');else msg('보냈습니다. Teams에서 [표 복사]를 눌러 점장님들께 붙여넣으세요.')}catch(e){}}
function chkRows(){const B=chkB,T={},DN={};B.teams.forEach(([t,d])=>{T[t]=d});B.depts.forEach(d=>{DN[d.id]=d.name});
 const W=[];for(let w=B.start;w<=B.thisWeek&&W.length<520;w=chkAdd(w,7))W.push(w);const cur=B.weeks[chkW]||{};
 return B.stores.map(r=>{const c=r[0];return {c,n:r[1],t:r[2]||'(팀 없음)',k:r[3],dept:DN[T[r[2]]]||'부서 미지정',s:cur[c]||null,owed:W.filter(w=>w<=chkW&&!(B.weeks[w]||{})[c]).length}})}
function chkSum(L){const sub=L.filter(x=>x.s);return {n:L.length,sub:sub.length,c:sub.reduce((a,x)=>a+(x.s.c||0),0),d:sub.reduce((a,x)=>a+(x.s.d||0),0),f:sub.reduce((a,x)=>a+(x.s.f||0),0),late:L.filter(x=>x.owed>(x.s?0:1)).length}}
const chkPct=(a,b)=>b?Math.round(a/b*100)+'%':'–';
function sChk(){chkCss();if(chkDet){jobsMode='form';return chkDet}if(chkErr){const m=chkErr;chkErr='';return '<div class="card"><h2>매장 점검</h2><p class="muted">'+escapeText(m)+'</p><button class="button" type="button" onclick="renderJobs()">다시 시도</button></div>'}if(!chkB){chkLoad();return '<div class="card"><h2>매장 점검</h2><p class="muted">불러오는 중입니다…</p></div>'}
 const B=chkB,all=chkRows(),[lv,a,b]=chkLv,L=lv==='all'?all:lv==='dept'?all.filter(x=>x.dept===a):all.filter(x=>x.dept===a&&x.t===b),S=chkSum(L);
 const prev=chkW>B.start,next=chkW<B.thisWeek;
 let h='<div class="card"><div class="chkbar"><button class="button ghost" type="button" onclick="chkWeek(-7)"'+(prev?'':' disabled')+' aria-label="지난주">‹</button><b>'+chkWl(chkW)+' (월) 주'+(chkW===B.thisWeek?' · 이번 주':'')+'</b><button class="button ghost" type="button" onclick="chkWeek(7)"'+(next?'':' disabled')+' aria-label="다음 주">›</button></div>'
  +'<div class="chknum"><div><b>'+S.n+'</b><span>매장</span></div><div><b>'+S.sub+'</b><span>제출 '+chkPct(S.sub,S.n)+'</span></div><div class="'+(S.n-S.sub?'r':'')+'"><b>'+(S.n-S.sub)+'</b><span>미제출</span></div><div class="'+(S.late?'r':'')+'"><b>'+S.late+'</b><span>밀린 주 있음</span></div></div>'
  +'<div class="chknum" style="grid-template-columns:repeat(3,1fr)"><div class="'+(S.c?'r':'')+'"><b>'+S.c+'</b><span>공통 미흡</span></div><div class="'+(S.d?'r':'')+'"><b>'+S.d+'</b><span>도급 미흡</span></div><div class="'+(S.f?'r':'')+'"><b>'+S.f+'</b><span>집중 위험</span></div></div>'
  +(chkCnt&&lv==='all'?'<div class="muted" style="margin-top:8px">미조치 전체 · 공통 '+chkCnt.COMMON+' · 도급 '+chkCnt.CONTRACT+' · 집중 '+chkCnt.FOCUS+'</div>':'')
  +(B.stores.length?(()=>{const TM=chkTm(),ic='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 3 3 10.5l7 2.5 2.5 7z"/><path d="M21 3 10 13"/></svg>',bs='flex:1;display:flex;align-items:center;justify-content:center;gap:6px';
   /* S8-23 소속만 보기: 팀장 = [미제출 복사] + [Teams로 공유하기] · 파트장 · 부서장 = [미제출 복사]만 · 금요일 안내 없음 */
   return '<div class="row" style="gap:6px;margin-top:10px"><button class="button ghost" type="button" style="flex:1" onclick="chkCopy()">미제출 복사</button>'
    +(TM?(TM.lead.length?'<button class="button" type="button" style="'+bs+'" onclick="chkShareGo()">'+ic+'Teams로 공유하기</button>':''):'<button class="button" type="button" style="'+bs+'" onclick="chkMailGo()">'+ic+'팀장에게 Teams 알림</button>')+'</div>'+(TM?'':chkFriHtml())})():'')+'</div>';
 if(chkTm())h=chkTeamBar()+h;else if(lv==='all')h=chkShopHtml()+h;  /* S8-8 점장 안내문 = 맨 위 · S8-23 소속만 보기 = 범위 띠 */
 if(!B.stores.length)return h+'<div class="card"><p class="muted" style="margin:0">'+(chkTm()?'내 소속 팀의 매장이 아직 없습니다. 안전보건팀에 조직도 · 매장 목록을 확인해 달라고 해 주세요.':'매장 목록을 먼저 반영해 주세요. (☰ 설정 → 매장 목록)')+'</p></div>';
 /* S8-21 「미제출 매장」 카드 뺌 (아래 부서 · 팀별 표로 충분 · 팀장 있음/없음 숫자가 헷갈림) · chkTeamHtml 코드는 남겨 둠 */
 h+='<div class="card"><h2 style="margin:0 0 6px">부서 · 팀별</h2><div class="chkcrumb">'+(lv==='all'?'<b>전체</b>':'<button type="button" onclick="chkGo([\'all\'])">전체</button> ›')+(lv!=='all'?(lv==='dept'?'<b>'+escapeText(a)+'</b>':'<button type="button" onclick="chkGo([\'dept\',\''+escapeText(a)+'\'])">'+escapeText(a)+'</button> › <b>'+escapeText(b)+'</b>'):'')+'</div>';
 const grp=(key,next)=>{const G={};L.forEach(x=>{(G[x[key]]=G[x[key]]||[]).push(x)});const K=Object.keys(G).sort((p,q)=>(p==='부서 미지정')-(q==='부서 미지정')||p.localeCompare(q,'ko',{numeric:true}));
  return '<table class="rtable chkt" style="margin-top:10px"><tr><th>'+(key==='dept'?'부서':'팀')+'</th><th class="n">매장</th><th class="n">제출</th><th class="n">미제출</th><th class="n">공통</th><th class="n">도급</th><th class="n">위험</th></tr>'
   +K.map(k=>{const s=chkSum(G[k]);return '<tr class="go" onclick="chkGo('+escapeText(JSON.stringify(next(k)))+')"><td><b>'+escapeText(k)+'</b></td><td class="n">'+s.n+'</td><td class="n">'+chkPct(s.sub,s.n)+'</td><td class="n'+(s.n-s.sub?' r':'')+'">'+(s.n-s.sub)+'</td><td class="n">'+s.c+'</td><td class="n'+(s.d?' r':'')+'">'+s.d+'</td><td class="n">'+s.f+'</td></tr>'}).join('')+'</table>'};
 if(lv==='all')h+=grp('dept',k=>['dept',k]);
 else if(lv==='dept')h+=grp('t',k=>['team',a,k]);
 else{const M=L.slice().sort((p,q)=>(!!p.s-!!q.s)||q.owed-p.owed||p.n.localeCompare(q.n,'ko'));
  h+='<table class="rtable chkt" style="margin-top:10px"><tr><th>매장</th><th>상태</th><th class="n">미흡</th><th class="n">밀린</th></tr>'+M.map(x=>{const bad=x.s?(x.s.c||0)+(x.s.d||0)+(x.s.f||0):0;
   return '<tr'+(x.s?' class="go" onclick="chkOpen(\''+escapeText(x.c)+'\')"':'')+'><td><b>'+escapeText(x.n)+'</b><div class="muted">'+escapeText(x.c+' · '+x.k)+'</div></td><td>'+(x.s?'<span class="shpill ok">제출 '+chkWl(x.s.r)+'</span>':'<span class="shpill no">미제출</span>')+'</td><td class="n'+(bad?' r':'')+'">'+(x.s?bad:'')+'</td><td class="n'+(x.owed>(x.s?0:1)?' r':'')+'">'+(x.owed||'')+'</td></tr>'}).join('')+'</table>'}
 return h+'</div>'}
/* ---------- S8-7 미제출 매장 (팀별) · 팀 담당자 메일 · 점장 안내문 (예전 「점장 안내문」 메뉴를 여기로 합침) ---------- */
const chkMailOf=()=>{const M={};((chkB&&chkB.teams)||[]).forEach(([t,,m])=>{if(m)M[t]=m});return M};
/* S8-19 미제출 매장 = 부서 → 팀 (부서는 접혀 있음 · 누르면 팀 줄 · 팀 줄 누르면 그 팀 매장 표) */
let chkDpOpen=new Set();
function chkTeamHtml(all){const M=chkMailOf(),e=escapeText,G={};all.filter(x=>!x.s).forEach(x=>{const d=G[x.dept]=G[x.dept]||{};(d[x.t]=d[x.t]||[]).push(x)});
 const D=Object.keys(G).sort((p,q)=>(p==='부서 미지정')-(q==='부서 미지정')||p.localeCompare(q,'ko',{numeric:true})),K=D.reduce((n,d)=>n.concat(Object.keys(G[d])),[]);
 const nS=all.filter(x=>!x.s).length,noB=K.filter(t=>!M[t]).length;
 if(!document.getElementById('chkDpCss')){const s=document.createElement('style');s.id='chkDpCss';s.textContent='.chkdp{border-top:1px solid var(--line)}.chkdp:first-of-type{border-top:0}.chkdp>summary{display:flex;align-items:center;gap:8px;padding:10px 2px;cursor:pointer;list-style:none}.chkdp>summary::-webkit-details-marker{display:none}.chkdp>summary .ar{width:14px;color:var(--sub);font-size:11px;flex:none}.chkdp[open]>summary .ar{transform:rotate(90deg)}.chkdp>summary b{flex:1;min-width:0}.chktm{display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center;width:100%;border:0;border-top:1px dashed var(--line);background:none;font:inherit;color:inherit;text-align:left;padding:8px 2px 8px 22px;cursor:pointer}.chktm:hover{background:var(--bg)}.chktm .c{color:var(--accent);font-weight:700;white-space:nowrap}';document.head.appendChild(s)}
 return '<div class="card"><div class="vh-top" style="align-items:center"><h2 style="margin:0">미제출 매장</h2>'+(nS?'<span class="shpill no">'+nS+'곳 · '+K.length+'팀</span>':'')+'</div>'
  +(nS?(noB?'<p class="muted" style="margin:2px 0 6px;color:var(--accent)">팀장 없음 '+noB+'팀 (Teams 안 감)</p>':'')
   +D.map(d=>{const T=Object.keys(G[d]).sort((p,q)=>G[d][q].length-G[d][p].length||p.localeCompare(q,'ko',{numeric:true})),n=T.reduce((a,t)=>a+G[d][t].length,0),nb=T.filter(t=>!M[t]).length;
    return '<details class="chkdp"'+(chkDpOpen.has(d)||D.length===1?' open':'')+' ontoggle="this.open?chkDpOpen.add(\''+e(d).replace(/'/g,'')+'\'):chkDpOpen.delete(\''+e(d).replace(/'/g,'')+'\')"><summary><span class="ar">▶</span><b>'+e(d)+'</b><span class="muted" style="white-space:nowrap">'+n+'곳 · '+T.length+'팀</span>'+(nb?'<span class="shpill no">팀장 없음 '+nb+'</span>':'')+'</summary>'
     +T.map(t=>'<button class="chktm" type="button" onclick="chkGo('+e(JSON.stringify(['team',d,t]))+')"><span>'+e(t)+'</span><span class="c">'+G[d][t].length+'곳</span><span class="shpill'+(M[t]?' ok':' no')+'">'+(M[t]?'팀장 있음':'팀장 없음')+'</span></button>').join('')+'</details>'}).join('')+'<p class="muted" style="margin:8px 0 0">팀장 = 조직도에서 「팀장」 스위치를 켠 사람 · 회사 이메일로 Teams 알림을 받습니다. (☰ 설정 → 조직도)</p>'+chkFriHtml()
   :'<p class="muted" style="margin:8px 0 0">이 주 미제출 매장이 없습니다.</p>')+'</div>'}
/** S8-13 매주 금요일 09:30 자동 Teams 주간 현황 (Relay teamsFriday) · 마지막으로 보낸 기록 */
function chkFriHtml(){const F=chkB&&chkB.fri;return '<p class="muted" style="margin:4px 0 0">매주 금요일 09:30 쯤 팀장에게 주간 현황 자동 알림'+(F&&F.at?' · 마지막 '+escapeText(fmtTime(F.at))+' · '+F.sent+'팀'+(F.fail?' (못 보냄 '+F.fail+')':''):' · 아직 보낸 기록 없음')+'</p>'}
async function chkMailGo(){if(!chkB)return;
 /* S8-12 조직도에서 팀장을 바꾼 뒤에도 옛 화면 정보로 막지 않게 → 보내기 전에 팀장 정보 다시 읽음 */
 try{const nb=await call('checkBoard');chkB={...chkB,depts:nb.depts,teams:nb.teams}}catch(e){}
 /* S8-22 금요일 자동 알림과 같은 기준 = 그 달 1주 ~ 고른 주 중 X가 있는 매장 → 고른 주만 보고 막지 않음 (서버가 판단) */
 if(!Object.keys(chkMailOf()).length){msg('팀장이 지정된 팀이 없습니다. (☰ 설정 → 조직도 → 「팀장」 켜기)');return}
 /* S8-21 문구 짧게: 묻기 = 「11월 2주차 미제출 매장을 …」 한 줄 · 결과 = 보냈습니다 / 못 보낸 팀장만 */
 if(!await askOk('팀장에게 Teams 알림',chkWkName(chkW)+' 미제출 매장을 팀장에게 Teams로 알립니다.','보내기'))return;
 try{const r=await call('chkMail',chkW),bad=(r.teams||[]).filter(x=>!x.ok);
  if(r.none){msg('이 달 미제출 매장이 없습니다.');return}if(!r.teams.length){msg('미제출 매장이 있는 팀에 팀장이 없습니다. (☰ 설정 → 조직도 → 「팀장」 켜기)');return}
  if(bad.length)popup('일부 못 보냄','보냄 '+r.sent+'팀\n\n못 보냄: '+bad.map(x=>x.team+' 팀장').join(', '),'확인');else msg('보냈습니다. ('+r.sent+'팀)')}catch(e){}}
/** S8-21 주 이름 = 그 달 몇째 주 (그 달에 월요일이 있는 주 · 점장 화면과 같은 기준) · 2026-11-09 → 11월 2주차 */
const chkWkName=w=>w?Number(w.slice(5,7))+'월 '+(Math.floor((Number(w.slice(8,10))-1)/7)+1)+'주차':'';
function chkShopHtml(){if(typeof sShopFly!=='function')return '';return sShopFly()}
function chkWeek(n){if(!chkB)return;const w=chkAdd(chkW,n);if(w<chkB.start||w>chkB.thisWeek)return;chkW=w;renderJobs()}
function chkGo(lv){chkLv=lv;renderJobs();window.scrollTo(0,0)}
/** S8-22 미제출 복사 = Teams [표 복사]와 같은 표 (팀마다 · 탭 구분 · 「1주 2주 … 매장명」 · 그 달 1주 ~ 고른 주 · O 제출 X 미제출 - 시작 전 · X 있는 매장만)
 *  지금 보는 범위만 (전체 / 부서 / 팀) · Relay chkReport_ 와 같은 기준 */
function chkCopyText(){const B=chkB,[lv,a,b]=chkLv,ym=chkW.slice(0,7),WK=[];
 for(let d=1;d<=7;d++){const w=ym+'-0'+d;if(new Date(w+'T00:00:00Z').getUTCDay()===1){for(let x=w;x.slice(0,7)===ym&&x<=chkW;x=chkAdd(x,7))WK.push(x);break}}
 if(!WK.length)WK.push(chkW);
 const t=new Date(),day=('0'+(t.getMonth()+1)).slice(-2)+'.'+('0'+t.getDate()).slice(-2),G={};
 chkRows().filter(x=>(lv==='all'||x.dept===a)&&(lv!=='team'||x.t===b)).forEach(x=>{const c=WK.map(w=>(B.weeks[w]||{})[x.c]?'O':w<B.start?'-':'X');if(c.includes('X'))(G[x.t]=G[x.t]||[]).push({n:x.n||x.c,c})});
 const K=Object.keys(G).sort((p,q)=>p.localeCompare(q,'ko',{numeric:true}));let n=0;
 const txt=K.map(k=>{const R=G[k].sort((p,q)=>p.n.localeCompare(q.n,'ko'));n+=R.length;
  return ['['+k+'] '+Number(ym.slice(5))+'월 미제출 ('+day+' 기준)',WK.map((w,i)=>(i+1)+'주').concat('매장명').join('\t')].concat(R.map(x=>x.c.concat(x.n).join('\t')),'O 제출 · X 미제출').join('\n')}).join('\n\n');
 return {txt,teams:K.length,n}}
function chkCopy(){const o=chkCopyText();if(!o.n){msg('이 달 미제출 매장이 없습니다.');return}
 (navigator.clipboard?navigator.clipboard.writeText(o.txt):Promise.reject()).then(()=>msg('미제출 표를 복사했습니다. ('+(o.teams>1?o.teams+'팀 · ':'')+o.n+'곳)'),()=>prompt('복사해 주세요.',o.txt))}
async function chkOpen(code){const id=code+'_'+chkW;let d;try{d=await call('scDetail',code,id)}catch(e){return}
 const o=shDetailHtml(d,'chkBack()','← 매장 점검',chkTm()?'':'shEditOpen(\''+escapeText(code)+'\',\''+escapeText(id)+'\')');/* S8-23 소속만 보기 = [고치기] 없음 */chkDet=o.html;renderJobs();window.scrollTo(0,0);o.pics.forEach(([k,fid,ref])=>shPicLoad(k,code,ref,fid))}  // S8-9 [고치기]
/** S8-9 고친 뒤: 현황 다시 읽고 그 점검을 다시 보여 줌 */
async function chkAfterEdit(code){chkDet=null;await chkLoad(true);chkOpen(code)}
function chkBack(){chkDet=null;renderJobs()}

/* ---------- 점검 항목 관리 (안전보건팀) ---------- */
async function ckLoad(){try{ckInfo=await call('ckGet');ckE=JSON.parse(JSON.stringify(ckInfo.check));ckDirty=false}catch(e){ckErr=(e&&e.message)||'불러오지 못했습니다.'}if(tab==='jobs'&&smenu==='items')renderJobs()}
const ckList=()=>ckTab==='c'?ckE.common:ckTab==='d'?ckE.contract:((ckE.focus[ckMon]=ckE.focus[ckMon]||{id:'F'+('0'+ckMon).slice(-2),name:ckMon+'월 집중점검',items:[]}).items);
function sItems(){chkCss();if(ckErr){const m=ckErr;ckErr='';return '<div class="card"><h2>점검 항목</h2><p class="muted">'+escapeText(m)+'</p><button class="button" type="button" onclick="renderJobs()">다시 시도</button></div>'}if(!ckE){ckLoad();return '<div class="card"><h2>점검 항목</h2><p class="muted">불러오는 중입니다…</p></div>'}if(ckDirty)jobsMode='form';const ed=ckInfo.canEdit,dis=ed?'':' disabled';
 const cntOf=G=>G.reduce((n,g)=>n+(g.use!==false?g.items.filter(x=>x.use!==false).length:0),0);
 let h='<div class="card"><h2 style="margin:0">점검 시작 주</h2><div class="row" style="margin-top:8px"><input type="date" id="f_ckStart" value="'+escapeText(ckInfo.startWeek)+'" max="'+escapeText(ckInfo.thisWeek)+'" style="padding:9px;border:1px solid var(--line);border-radius:8px;font:inherit"'+dis+'>'+(ed?'<button class="button ghost" type="button" onclick="ckStartSave()">저장</button>':'')+'</div><div class="muted" style="margin-top:4px">이 주부터 안 낸 주 = 밀린 주 (월요일)</div></div>'
  +'<div class="card"><div class="seg" role="tablist" style="margin-top:0">'+[['c','공통 '+cntOf(ckE.common)],['d','도급 '+cntOf(ckE.contract)],['f','월별 집중']].map(([k,t])=>'<button type="button" role="tab" aria-selected="'+(ckTab===k)+'" class="'+(ckTab===k?'on':'')+'" onclick="ckTabGo(\''+k+'\')">'+t+'</button>').join('')+'</div>'
  +(ckInfo.at?'<div class="muted" style="margin-top:8px">고침 '+escapeText(fmtTime(ckInfo.at))+' · '+escapeText(ckInfo.by)+'</div>':'<div class="muted" style="margin-top:8px">기본 점검표</div>');
 if(ckTab==='f'){const F=ckE.focus[ckMon]||{name:'',items:[]};ckList();
  h+='<div class="ckrow" style="margin-top:10px"><select aria-label="달" onchange="ckMon=Number(this.value);renderJobs()">'+Array.from({length:12},(_,i)=>'<option value="'+(i+1)+'"'+(i+1===ckMon?' selected':'')+'>'+(i+1)+'월</option>').join('')+'</select><input type="text" value="'+escapeText(ckE.focus[ckMon].name)+'" placeholder="테마" aria-label="'+ckMon+'월 테마" oninput="ckE.focus[ckMon].name=this.value;ckD()"'+dis+'></div>'
   +ckE.focus[ckMon].items.map((x,i)=>'<div class="ckg'+(x.use===false?' off':'')+'"><div class="ckrow"><input type="text" value="'+escapeText(x.t)+'" placeholder="문항" aria-label="문항" oninput="ckSet('+i+',-1,\'t\',this.value)"'+dis+'>'+ckUse(i,-1,x,dis)+'</div><div class="ckrow"><textarea rows="2" placeholder="확인 내용" aria-label="확인 내용" oninput="ckSet('+i+',-1,\'d\',this.value)"'+dis+'>'+escapeText(x.d||'')+'</textarea></div>'+ckGdHtml('f',x,ed)+'</div>').join('')
   +(ed?'<button class="button ghost" type="button" style="width:100%;margin-top:10px" onclick="ckAddItem(-1)">＋ 문항</button>':'')}
 else{const G=ckList();
  h+=G.map((g,gi)=>'<div class="ckg'+(g.use===false?' off':'')+'"><div class="ckrow"><input type="text" value="'+escapeText(g.name)+'" placeholder="영역 이름" aria-label="영역 이름" style="font-weight:700" oninput="ckSetG('+gi+',\'name\',this.value)"'+dis+'>'+ckUse(gi,-2,g,dis)+'</div>'
   +ckGdHtml(ckTab,g,ed)
   +g.items.map((x,i)=>'<div class="ckrow'+(x.use===false?' ckoff':'')+'" style="'+(x.use===false?'opacity:.55':'')+'"><textarea rows="2" aria-label="문항" oninput="ckSet('+gi+','+i+',\'t\',this.value)"'+dis+'>'+escapeText(x.t)+'</textarea>'
    +(ckTab==='c'?'<select aria-label="적용" onchange="ckSet('+gi+','+i+',\'ch\',this.value)"'+dis+'><option'+(x.ch!=='직영·테넌트'?' selected':'')+'>공통</option><option'+(x.ch==='직영·테넌트'?' selected':'')+'>직영·테넌트</option></select>':'')+ckUse(gi,i,x,dis)+'</div>').join('')
   +(ed?'<button class="button ghost" type="button" style="width:100%;margin-top:8px;padding:8px" onclick="ckAddItem('+gi+')">＋ 문항</button>':'')+'</div>').join('')
  +(ed?'<button class="button ghost" type="button" style="width:100%;margin-top:10px" onclick="ckAddGrp()">＋ 영역</button>':'')}
 h+='<p class="muted" style="margin:10px 0 0">공통 「공통」 = 모든 매장 · 「직영·테넌트」 = 직영점만 · 쓰지 않는 문항은 지우지 않고 사용 해제</p></div>';
 if(ed)h+='<div class="card roomfoot"><div class="row">'+(ckDirty?'<button class="button ghost" type="button" onclick="ckE=null;ckDirty=false;renderJobs()">되돌리기</button>':'')+'<button class="button" type="button" style="flex:1" onclick="ckSave()"'+(ckDirty?'':' disabled')+'>저장</button></div></div>';
 return h}
const ckUse=(gi,i,x,dis)=>'<label class="ckuse"><input type="checkbox" '+(x.use!==false?'checked':'')+' onchange="ckSet('+gi+','+i+',\'use\',this.checked)"'+dis+'>사용</label>';
/** 가이드 사진 칸 (양호 · 미흡) · 아직 저장 안 한 영역은 저장 뒤에 */
function ckGdHtml(part,x,ed){const saved=!ckDirty&&!String(x.id||'').startsWith('NEW');
 const one=(k,fid,t)=>'<div>'+(fid?'<img id="ckg_'+k+'_'+escapeText(x.id)+'" alt="'+t+' 예시">':'')+'<span>'+t+'</span> '+(ed&&saved?'<label>'+(fid?'바꾸기':'올리기')+'<input type="file" accept="image/*" onchange="ckGdUp(\''+part+'\',\''+escapeText(x.id)+'\',\''+k+'\',this)"></label>'+(fid?' <button type="button" class="x" onclick="ckGdDel(\''+part+'\',\''+escapeText(x.id)+'\',\''+k+'\')">빼기</button>':''):(fid?'':' <span class="muted">'+(ed?'저장 뒤 올리기':'없음')+'</span>'))+'</div>';
 setTimeout(()=>[['G',x.gg],['B',x.gb]].forEach(([k,fid])=>{if(!fid)return;const el=$('ckg_'+k+'_'+x.id);if(!el)return;if(shGdMem[fid]){el.src=shGdMem[fid];return}FB.sm('scGuide',{fid}).then(r=>{shGdMem[fid]='data:'+r.mime+';base64,'+r.data;const e2=$('ckg_'+k+'_'+x.id);if(e2)e2.src=shGdMem[fid]}).catch(()=>{})}),0);
 return '<div class="ckgd">'+one('G',x.gg,'양호')+one('B',x.gb,'미흡')+'</div>'}
function ckD(full){ckDirty=true;jobsMode='form';if(full){const y=window.scrollY;renderJobs();window.scrollTo(0,y)}else{const b=document.querySelector('.roomfoot .button:not(.ghost)');if(b)b.disabled=false}}
function ckTabGo(k){ckTab=k;renderJobs()}
function ckSetG(gi,k,v){ckList()[gi][k]=v;ckD()}
/** i=-2 영역 사용 · i=-1 집중 문항(gi=문항 번호) · 그 외 영역 gi의 문항 i */
function ckSet(gi,i,k,v){const L=ckList();const x=i===-2||i===-1?L[gi]:L[gi].items[i];x[k]=v;ckD(k==='use')}
function ckAddItem(gi){const it={id:'NEW'+Date.now().toString(36),t:'',use:true};if(gi===-1){it.d='';ckList().push(it)}else{it.ch='공통';ckList()[gi].items.push(it)}ckD(true)}
function ckAddGrp(){ckList().push({id:'NEW'+Date.now().toString(36),name:'',use:true,items:[{id:'NEW'+(Date.now()+1).toString(36),t:'',ch:'공통',use:true}]});ckD(true)}
async function ckSave(){const clean=JSON.parse(JSON.stringify(ckE));const fix=x=>{if(String(x.id||'').startsWith('NEW'))x.id=''};
 clean.common.concat(clean.contract).forEach(g=>{fix(g);g.items.forEach(fix)});Object.values(clean.focus).forEach(f=>(f.items||[]).forEach(fix));
 if(!await askOk('점검 항목 저장','다음 점검부터 바뀐 점검표가 나옵니다.\n이미 낸 점검은 그대로입니다.','저장'))return;
 try{ckInfo=await call('ckSave',clean);ckE=JSON.parse(JSON.stringify(ckInfo.check));ckDirty=false;renderJobs();msg('저장했습니다.')}catch(e){}}
async function ckGdUp(part,id,kind,inp){const f=inp.files&&inp.files[0];if(!f)return;let r;try{r=await readFile(f,PHOTO_SITE)}catch(e){msg((e&&e.message)||'사진을 읽지 못했습니다.');return}
 try{ckInfo=await call('ckGuide',part,id,kind,r);ckE=JSON.parse(JSON.stringify(ckInfo.check));renderJobs();msg('가이드 사진을 올렸습니다.')}catch(e){}}
async function ckGdDel(part,id,kind){if(!await askOk('가이드 사진 빼기','이 사진을 점검표에서 뺄까요?','빼기'))return;try{ckInfo=await call('ckGuide',part,id,kind,null);ckE=JSON.parse(JSON.stringify(ckInfo.check));renderJobs()}catch(e){}}
async function ckStartSave(){const v=value('ckStart');const d=new Date(v+'T00:00:00Z');if(!v||d.getUTCDay()!==1){msg('월요일 날짜를 골라 주세요.');return}
 if(!await askOk('점검 시작 주',chkWl(v)+' (월) 주부터 밀린 주를 셉니다.\n저장할까요?','저장'))return;try{ckInfo=await call('ckStart',v);chkB=null;renderJobs();msg('저장했습니다.')}catch(e){}}
