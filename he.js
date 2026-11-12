/* S8-3 반기 평가 — 본사 ☰ 반기 평가 (목록 · 점수표 · 다시 계산 · 메일 · 개선 계획 확인) · 업체 대시보드 「반기 평가」 카드 (점수표 · 개선 계획 제출)
 *  오픈지원과 같은 틀 · 완전 자동 · 반기 끝 다음 달 10일 09시 자동 계산 + 업체 메일 · 진행 중인 반기는 미리 보기 (저장 · 메일 없음)
 *  서버: Relay heBoard · heGet · heRecalc · heMail · hePlanOk / heMine · hePlan */
let heB=null,heP='',heSel='',heCur=null,heV=null,heVCur='';
const heName=P=>P?P.slice(0,4)+'년 '+(P.slice(5)==='1'?'상':'하')+'반기':'';
const heAdd=(P,n)=>{let y=+P.slice(0,4),h=+P.slice(5)+n;while(h>2){h-=2;y++}while(h<1){h+=2;y--}return y+'H'+h};
const heGc=g=>g==='S'||g==='A'?'ok':g==='C'||g==='D'?'no':'';
const heLc=l=>l==='G'?'ok':l==='P'?'no':'';
function heReset(){heSel='';heCur=null}
/** 점수표 (본사 · 업체 같이 씀) */
function heSheetHtml(d){const e=escapeText;
 return '<table class="rtable chkt" style="margin-top:10px"><tr><th>항목</th><th>근거</th><th class="n">점수</th></tr>'
  +(d.items||[]).map(x=>'<tr><td><b>'+e(x.name)+'</b><div><span class="shpill '+heLc(x.lv)+'">'+e(x.lvLabel||'')+'</span></div></td><td class="muted">'+e(x.why)+'</td><td class="n">'+x.pts+' / '+x.max+'</td></tr>').join('')
  +'<tr><td><b>가점 · 신규자 교육</b></td><td class="muted">'+e(d.bonusWhy||'')+'</td><td class="n">+'+(d.bonus||0)+'</td></tr>'
  +'<tr><td><b>합계</b></td><td class="muted">'+(d.base+d.bonus>100?'기본 '+d.base+' + 가점 '+d.bonus+' → 최대 100':'기본 '+d.base+' + 가점 '+(d.bonus||0))+'</td><td class="n"><b>'+d.total+'</b></td></tr></table>'}

/* ---------- 본사 ☰ 반기 평가 ---------- */
async function heLoad(){try{heB=await call('heBoard',heP);heP=heB.period}catch(e){heB={err:(e&&e.message)||'불러오지 못했습니다.'}}if(tab==='jobs'&&smenu==='half')renderJobs()}
function sHe(){if(typeof jtCss==='function')jtCss();if(!heB){heLoad();return '<div class="card"><h2>반기 평가</h2><p class="muted">불러오는 중입니다…</p></div>'}
 if(heB.err){const m=heB.err;heB=null;return '<div class="card"><h2>반기 평가</h2><p class="muted">'+escapeText(m)+'</p><button class="button" type="button" onclick="renderJobs()">다시 시도</button></div>'}
 if(heSel&&heCur){jobsMode='form';return heDetailHtml()}
 const B=heB,e=escapeText,L=B.list,c=k=>L.filter(x=>k.includes(x.grade)).length;
 return '<div class="card"><div class="vh-top" style="align-items:center"><h2 style="margin:0">'+e(heName(B.period))+' 반기 평가</h2><span class="shpill'+(B.live?' no':'')+'">'+(B.live?'진행 중 · 미리 보기':'계산 '+e(fmtTime(B.run.at))+(B.run.by==='AUTO'?' · 자동':''))+'</span></div>'
  +'<div class="seg" role="tablist">'+[heAdd(B.cur,-2),heAdd(B.cur,-1),B.cur].map(P=>'<button type="button" role="tab" aria-selected="'+(P===B.period)+'" class="'+(P===B.period?'on':'')+'" onclick="heP=\''+P+'\';heB=null;renderJobs()">'+e(heName(P))+'</button>').join('')+'</div>'
  +'<div class="chknum"><div><b>'+L.length+'</b><span>업체</span></div><div><b>'+c('SA')+'</b><span>S · A</span></div><div><b>'+c('B')+'</b><span>B</span></div><div class="'+(c('CD')?'r':'')+'"><b>'+c('CD')+'</b><span>C · D</span></div></div>'
  +(L.length?'<table class="rtable chkt" style="margin-top:10px"><tr><th>업체</th><th class="n">점수</th><th>등급</th><th>개선 계획</th></tr>'+L.map(x=>'<tr class="go" onclick="heOpen(\''+e(x.id)+'\')"><td><b>'+e(x.company)+'</b>'+(x.tags||[]).map(t=>' <span class="muted" style="border:1px dashed #cbd5e1;border-radius:6px;padding:0 5px;font-size:11px;white-space:nowrap">'+e(t)+'</span>').join('')+'</td><td class="n'+(x.need?' r':'')+'">'+x.total+'</td><td><span class="shpill '+heGc(x.grade)+'">'+e(x.grade)+'</span></td><td class="muted">'+(!x.need?'—':x.planOkAt?'확인':x.plan?'<span class="shpill no">확인 전</span>':B.live?'—':'<span class="shpill no">제출 전</span>')+'</td></tr>').join('')+'</table>':'<p class="muted" style="margin:10px 0 0">입고도우미 업체가 없습니다.</p>')
  +'<p class="muted" style="margin:8px 0 0">점선 표시 = 도급인이 안 한 것 (그 항목은 만점 · 점수 영향 없음)'+(B.live?' · 반기가 끝나고 다음 달 10일 09시에 확정 · 업체 메일':'')+'</p>'
  +(B.canEdit&&!B.live?'<div class="row" style="margin-top:10px"><button class="button ghost" type="button" style="flex:1" onclick="heRecalc()">지금 기록으로 다시 계산</button><button class="button ghost" type="button" style="flex:1" onclick="heMailAll()">결과 메일 다시 보내기</button></div>':'')+'</div>'}
async function heOpen(id){try{heCur=await call('heGet',id);heSel=id;renderJobs();window.scrollTo(0,0)}catch(e){}}
function heBack(){heReset();renderJobs()}
function heDetailHtml(){const d=heCur,e=escapeText,B=heB;
 return '<div class="card"><button class="button ghost" type="button" onclick="heBack()">← 반기 평가</button><div class="vh-top" style="align-items:center;margin-top:12px"><h2 style="margin:0">'+e(d.company)+'</h2><span class="shpill '+heGc(d.grade)+'">'+e(d.grade)+' · '+d.total+'</span></div>'
  +'<div class="muted">'+e(heName(d.period)+' · '+d.from+' ~ '+d.to)+(B&&B.live?' · 미리 보기':'')+((d.tags||[]).length?' · '+e(d.tags.join(' · ')):'')+'</div>'+heSheetHtml(d)+'</div>'
  +(d.need?'<div class="card"><h2 style="margin:0">개선 계획</h2>'+(d.plan?'<p style="margin:8px 0 0;white-space:pre-wrap">'+e(d.plan)+'</p><div class="muted">제출 '+e(fmtTime(d.planAt))+(d.planOkAt?' · 확인 '+e(fmtTime(d.planOkAt)):'')+'</div>'+(B&&B.canEdit&&!d.planOkAt?'<button class="button" type="button" style="width:100%;margin-top:10px" onclick="hePlanOk()">확인</button>':''):'<p class="muted" style="margin:8px 0 0">'+(B&&B.live?'반기가 끝나면 70점 미만 업체에 요청합니다.':'업체가 아직 제출하지 않았습니다.')+'</p>')+'</div>':'')}
async function heRecalc(){if(!await askOk('다시 계산',heName(heB.period)+' 반기 평가를 지금 기록으로 다시 계산할까요?\n(점수를 손으로 고치는 것이 아니라 기록으로 다시 셉니다 · 개선 계획은 그대로)','다시 계산'))return;try{heB=await call('heRecalc',heB.period);heReset();renderJobs();msg('다시 계산했습니다.')}catch(e){}}
async function heMailAll(){if(!await askOk('결과 메일',heName(heB.period)+' 반기 평가 결과를 업체 계약담당자에게 다시 보낼까요?','보내기'))return;try{heB=await call('heMail',heB.period);renderJobs();msg('보냈습니다 · '+heB.mailed+'통')}catch(e){}}
async function hePlanOk(){if(!await askOk('개선 계획 확인',heCur.company+' 개선 계획을 확인했습니까?','확인'))return;try{heB=await call('hePlanOk',heSel);heCur=await call('heGet',heSel);renderJobs();msg('확인했습니다.')}catch(e){}}

/* ---------- 업체 대시보드 「반기 평가」 ---------- */
async function heVLoad(){try{heV=await callQuiet('heMine')}catch(e){return}const b=$('heBox');if(b&&!heVCur)b.innerHTML=heVCardHtml()}
function heVCardHtml(){if(!heV||!heV.list.length)return '';const d=heV.list[0],e=escapeText,ask=d.need&&!d.plan;
 return '<div class="card"><div class="vh-top" style="align-items:center"><h2 style="margin:0">'+e(heName(d.period))+' 반기 평가</h2><span class="shpill '+heGc(d.grade)+'">'+e(d.grade)+'등급</span></div>'
  +'<div style="display:flex;align-items:baseline;gap:6px;margin-top:6px"><b style="font-size:32px'+(d.need?';color:var(--accent)':'')+'">'+d.total+'</b><span class="muted">/ 100</span></div>'
  +'<div class="muted">'+(d.items||[]).map(x=>e(x.name)+' '+x.pts).join(' · ')+(d.bonus?' · 가점 +'+d.bonus:'')+'</div>'
  +'<button class="button ghost" type="button" style="width:100%;margin-top:10px" onclick="heVOpen(\''+e(d.id)+'\')">점수표 보기'+(ask?' · 개선 계획 작성':'')+'</button>'
  +(ask?'<p class="muted" style="margin:6px 0 0;color:var(--accent)">70점 미만 · 개선 계획을 제출해 주세요.</p>':d.need?'<p class="muted" style="margin:6px 0 0">개선 계획 제출 '+(d.planOkAt?'· 본사 확인':'· 본사 확인 전')+'</p>':'')
  +(heV.list.length>1?'<details class="hist"><summary>지난 반기 '+(heV.list.length-1)+'</summary>'+heV.list.slice(1).map(x=>'<button class="shli" type="button" onclick="heVOpen(\''+e(x.id)+'\')">'+shIc('doc')+'<span class="t"><b>'+e(heName(x.period))+'</b><span class="muted">'+x.total+'점</span></span><span class="shpill '+heGc(x.grade)+'">'+e(x.grade)+'</span></button>').join('')+'</details>':'')+'</div>'}
function heVOpen(id){const d=heV&&heV.list.find(x=>x.id===id),el=$('execArea');if(!d||!el)return;heVCur=id;const e=escapeText,low=(d.items||[]).filter(x=>x.lv!=='G');
 el.innerHTML='<div class="card"><button class="button ghost" type="button" onclick="heVBack()">← 대시보드</button><div class="vh-top" style="align-items:center;margin-top:12px"><h2 style="margin:0">'+e(heName(d.period))+' 반기 평가</h2><span class="shpill '+heGc(d.grade)+'">'+e(d.grade)+' · '+d.total+'</span></div><div class="muted">'+e(d.from+' ~ '+d.to)+'</div>'+heSheetHtml(d)+'</div>'
  +(d.need?'<div class="card"><h2 style="margin:0">개선 계획</h2>'+(low.length?'<div class="muted" style="margin-top:4px">낮은 항목 · '+low.map(x=>e(x.name)+' '+x.pts+'/'+x.max).join(' · ')+'</div>':'')
   +(d.planOkAt?'<p style="margin:8px 0 0;white-space:pre-wrap">'+e(d.plan)+'</p><div class="muted">본사 확인 '+e(fmtTime(d.planOkAt))+'</div>'
    :'<textarea id="hePlanT" class="shinp" style="min-height:120px" placeholder="무엇을 · 언제까지 바꿀지">'+e(d.plan||'')+'</textarea><button class="button" type="button" style="width:100%;margin-top:10px" onclick="hePlanSend()">'+(d.plan?'다시 제출':'제출')+'</button>'+(d.plan?'<div class="muted" style="margin-top:6px">제출 '+e(fmtTime(d.planAt))+' · 본사 확인 전</div>':''))+'</div>':'');
 $('pageTitle').textContent='반기 평가';window.scrollTo(0,0)}
function heVBack(){heVCur='';renderDash();window.scrollTo(0,0)}
async function hePlanSend(){const t=($('hePlanT').value||'').trim();if(t.length<10){inspFlag(['hePlanT'],'개선 계획 (무엇을 · 언제까지)');return}
 if(!await askOk('개선 계획 제출','개선 계획을 본사에 제출할까요?','제출'))return;try{heV=await call('hePlan',heVCur,t);msg('제출했습니다.');heVOpen(heVCur)}catch(e){}}
