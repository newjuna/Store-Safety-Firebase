/* S6 안전보건협의체 결과 — 본사 ☰ 협의체 (목록 · 결과 · 다시 만들기 · 공문 메일) · 점장 「협의체 결과」
 *  서버: Relay coList · coGet · coMake · coMail (본사) / scCouncils · scCouncil (점장)
 *  파일은 매월 25일 09시 자동 생성 (지난달 26일 ~ 이번 달 24일) · 다음 달 1일 09시 업체 공문 메일 */
let coL=null,coCur=null,coSel='';
const coMon=id=>id?id.slice(0,4)+'년 '+Number(id.slice(5,7))+'월':'';
const coRng=b=>(b.from||'').slice(5).replace('-','.')+' ~ '+(b.to||'').slice(5).replace('-','.');
const coPct=(a,b)=>b?Math.round(a/b*100)+'%':'–';
/** 협의체 결과 화면 (who S 본사 · P 점장) */
function coHtml(b,who,back){if(typeof chkCss==='function')chkCss();const e=escapeText;
 let h='<div class="card">'+(back?'<button class="button ghost" type="button" onclick="'+back+'">← 협의체</button>':'')+'<h2 style="margin:'+(back?'12px':'0')+' 0 0">'+e(coMon(b.id))+' 안전보건협의체</h2><div class="muted">집계 '+e(coRng(b))+(b.createdAt?' · 생성 '+e(fmtTime(b.createdAt)):'')+(who==='S'?(b.mailAt?' · 공문 '+e(fmtTime(b.mailAt))+' ('+b.mailCount+'통)':' · 공문 전'):'')+'</div>'
  +'<div class="chknum"><div><b>'+b.sheets+'</b><span>점검 '+coPct(b.sheets,b.expect)+'</span></div><div class="'+(b.cPoor?'r':'')+'"><b>'+b.cPoor+'</b><span>공통 미흡</span></div><div class="'+(b.dPoor?'r':'')+'"><b>'+b.dPoor+'</b><span>도급 미흡</span></div><div class="'+(b.fRisk?'r':'')+'"><b>'+b.fRisk+'</b><span>집중 위험</span></div></div>'
  +(b.late?'<div class="muted" style="margin-top:6px">지난 기간 늦은 제출 '+b.late+'장 · 공통 미흡 '+(b.lateC||0)+' · 도급 미흡 '+(b.lateD||0)+' · 집중 위험 '+(b.lateF||0)+((b.lateTop||[]).length?' ('+b.lateTop.map(x=>e(x.name)+' '+x.n).join(' · ')+')':'')+'</div>':'')+'</div>';
 if(who==='P'){const M=b.mine||[];h+='<div class="card"><h2 style="margin:0 0 4px">'+e(b.myStore)+'</h2><div class="muted">'+e(b.myDept)+'</div>'+(M.length?M.map(x=>'<div class="shli" style="cursor:default">'+shIc(x.status==='DONE'?'check':'alert',x.status!=='DONE')+'<span class="t"><b>'+e(x.name)+'</b><span class="muted">'+e(shW(x.regDate)+(x.company?' · '+x.company:''))+'</span></span><span class="shpill '+(x.status==='DONE'?'ok':'no')+'">'+(x.status==='DONE'?'조치':'미조치')+'</span></div>').join(''):'<p class="muted" style="margin:8px 0 0">이번 기간 미흡 없음</p>')+'</div>'}
 const top=b.commonTop||[];
 h+='<div class="card"><h2 style="margin:0">위험요인 전파</h2>'+(top.length?'<table class="rtable chkt" style="margin-top:10px"><tr><th>공통 미흡 영역</th><th class="n">건</th></tr>'+top.map(x=>'<tr><td>'+e(x.name)+'</td><td class="n">'+x.n+'</td></tr>').join('')+'</table>':'<p class="muted" style="margin:8px 0 0">없음</p>')
  +((b.focusTop||[]).length?'<div class="muted" style="margin-top:8px">집중 위험 · '+b.focusTop.map(x=>e(x.name)+' '+x.n).join(' · ')+'</div>':'')+'</div>';
 h+='<div class="card"><h2 style="margin:0">부서 · 팀</h2><table class="rtable chkt" style="margin-top:10px"><tr><th>부서</th><th class="n">점검</th><th class="n">공통</th><th class="n">도급</th><th class="n">위험</th></tr>'
  +(b.byDept||[]).map(d=>'<tr'+(who==='P'&&d.dept===b.myDept?' style="background:var(--bg)"':'')+'><td><b>'+e(d.dept)+'</b>'+(d.top.length?'<div class="muted">'+d.top.map(x=>e(x.name)+' '+x.n).join(' · ')+'</div>':'')+'</td><td class="n">'+d.sheets+'<div class="muted">'+coPct(d.sheets,d.expect)+'</div></td><td class="n">'+d.cPoor+'</td><td class="n'+(d.dPoor?' r':'')+'">'+d.dPoor+'</td><td class="n">'+d.fRisk+'</td></tr>'
   +(who==='S'?'<tr><td colspan="5" style="padding:0"><details class="hist" style="margin:0;padding:4px 8px"><summary class="muted">팀 '+d.teamRows.length+'</summary>'+d.teamRows.map(t=>'<div class="muted">'+e(t.team)+' · 매장 '+t.stores+' · 점검 '+t.sheets+' · 공통 '+t.cPoor+' · 도급 '+t.dPoor+' · 위험 '+t.fRisk+'</div>').join('')+'</details></td></tr>':'')).join('')+'</table></div>';
 h+='<div class="card"><h2 style="margin:0">입고도우미 업체 · 시정요구서</h2>'+((b.vendors||[]).length?'<table class="rtable chkt" style="margin-top:10px"><tr><th>업체</th><th class="n">발행</th><th class="n">조치</th><th class="n">7일 안</th><th class="n">미조치</th></tr>'+b.vendors.map(v=>'<tr><td><b>'+e(v.company)+'</b>'+(v.top.length?'<div class="muted">'+v.top.map(x=>e(x.name)+' '+x.n).join(' · ')+'</div>':'')+'</td><td class="n">'+v.issued+'</td><td class="n">'+v.done+'</td><td class="n">'+v.inTime+'</td><td class="n'+(v.open?' r':'')+'">'+v.open+'</td></tr>').join('')+'</table>':'<p class="muted" style="margin:8px 0 0">없음</p>')+'</div>';
 if((b.joint||[]).length)h+='<div class="card"><h2 style="margin:0">합동점검 결과</h2>'+b.joint.map(j=>'<div class="muted">'+e(j.text||'')+'</div>').join('')+'</div>';
 if(who==='S'&&(b.lateList||[]).length)h+='<div class="card"><details class="hist"><summary>지난 기간 늦은 제출 '+b.lateList.length+'</summary>'+b.lateList.map(x=>'<div class="muted">'+e(x.storeName+' · '+shW(x.week)+' 주')+'</div>').join('')+'</details></div>';
 return h}

/* ---------- 본사 ☰ 협의체 ---------- */
async function coLoad(){try{coL=await call('coList')}catch(e){coL={list:[],today:'',err:(e&&e.message)||'불러오지 못했습니다.'}}if(tab==='jobs'&&smenu==='co')renderJobs()}
function sCo(){if(!coL){coLoad();return '<div class="card"><h2>협의체</h2><p class="muted">불러오는 중입니다…</p></div>'}if(coL.err){const m=coL.err;coL=null;return '<div class="card"><h2>협의체</h2><p class="muted">'+escapeText(m)+'</p><button class="button" type="button" onclick="renderJobs()">다시 시도</button></div>'}const ed=isSafetyUI();
 if(coSel&&coCur&&coCur.id===coSel)return coHtml(coCur,'S','coBack()')+(ed?'<div class="card"><div class="row"><button class="button ghost" type="button" style="flex:1" onclick="coMakeNow(\''+coSel+'\')">다시 만들기</button><button class="button" type="button" style="flex:1" onclick="coMailNow(\''+coSel+'\')">'+(coCur.mailAt?'공문 메일 다시 보내기':'공문 메일 보내기')+'</button></div><p class="muted" style="margin:8px 0 0">다시 만들기 = 지금 기록으로 다시 집계 (부서 · 팀 이름도 지금 기준)</p></div>':'');
 const t=coL.today,cur=Number(t.slice(8,10))>=25?t.slice(0,7):(()=>{const y=+t.slice(0,4),m=+t.slice(5,7);return m===1?(y-1)+'-12':y+'-'+('0'+(m-1)).slice(-2)})();  // 집계가 끝난 가장 최근 기간
 return '<div class="card"><h2 style="margin:0">협의체</h2><div class="muted">매월 25일 09시 자동 생성 · 다음 달 1일 09시 업체 공문 메일</div>'
  +(ed&&!coL.list.some(c=>c.id===cur)?'<button class="button" type="button" style="width:100%;margin-top:10px" onclick="coMakeNow(\''+cur+'\')">'+coMon(cur)+' 만들기</button>':'')+'</div>'
  +'<div class="card">'+(coL.list.length?coL.list.map(c=>'<button class="shli" type="button" onclick="coOpen(\''+escapeText(c.id)+'\')">'+shIc('doc')+'<span class="t"><b>'+escapeText(coMon(c.id))+'</b><span class="muted">'+escapeText(coRng(c))+' · '+(c.mailAt?'공문 '+c.mailCount+'통':'공문 전')+'</span></span><span aria-hidden="true">›</span></button>').join(''):'<p class="muted" style="margin:0">아직 없습니다.</p>')+'</div>'}
async function coOpen(id){try{coCur=await call('coGet',id);coSel=id;jobsMode='form';renderJobs();window.scrollTo(0,0)}catch(e){}}
function coBack(){coSel='';coCur=null;renderJobs()}
async function coMakeNow(id){if(!await askOk('협의체 만들기',coMon(id)+' 협의체를 지금 기록으로 집계할까요?\n(이미 있으면 다시 만듭니다)','만들기'))return;try{coCur=await call('coMake',id);coSel=id;coL=null;await coLoad();msg('만들었습니다.')}catch(e){}}
async function coMailNow(id){if(!await askOk('공문 메일',coMon(id)+' 협의체 결과를 입고도우미 업체 계약담당자에게 메일로 보낼까요?','보내기'))return;try{coCur=await call('coMail',id);coSel=id;coL=null;await coLoad();msg('보냈습니다 · '+coCur.mailCount+'통')}catch(e){}}

/* ---------- 점장 「협의체 결과」 (shop.js shGo('council')) ---------- */
const SH_CO_SEEN='shopCoSeen';
async function shCouncilView(id){shMark('협의체 결과');const P=shPicked();if(!P.length){shGo('pick');return}
 if(id){const code=(shCouncilView.store&&P.some(s=>s.c===shCouncilView.store))?shCouncilView.store:P[0].c;shEl().innerHTML='<div class="card"><p class="muted">불러오는 중…</p></div>';let b;
  try{b=await shCall('scCouncil',{id,store:code})}catch(e){shCouncilView();return}if(shV!=='council')return;const seen=shLS.get(SH_CO_SEEN,[]);if(!seen.includes(id))shLS.set(SH_CO_SEEN,seen.concat(id).slice(-24));
  const seg=P.length>1?'<div class="card" style="padding:10px"><select class="shinp" style="margin:0" onchange="shCouncilView.store=this.value;shCouncilView(\''+escapeText(id)+'\')" aria-label="매장">'+P.map(s=>'<option value="'+escapeText(s.c)+'"'+(s.c===code?' selected':'')+'>'+escapeText(s.n)+'</option>').join('')+'</select></div>':'';
  shEl().innerHTML=seg+coHtml(b,'P','shCouncilView()');return}
 shEl().innerHTML='<div class="card"><p class="muted">불러오는 중…</p></div>';let r;try{r=await shCall('scCouncils',{})}catch(e){return}if(shV!=='council')return;const seen=shLS.get(SH_CO_SEEN,[]);
 shEl().innerHTML='<div class="card">'+(r.list.length?r.list.map(c=>'<button class="shli" type="button" onclick="shCouncilView(\''+escapeText(c.id)+'\')">'+shIc('doc')+'<span class="t"><b>'+escapeText(coMon(c.id))+'</b><span class="muted">'+escapeText(coRng(c))+'</span></span>'+(seen.includes(c.id)?'':'<span class="shpill no">새 글</span>')+'</button>').join(''):'<p class="muted" style="margin:0">아직 없습니다.</p>')+'</div>'}
