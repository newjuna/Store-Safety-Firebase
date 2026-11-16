/* S8-24 협의체 회의 개편 (시안 06_시안/입고도우미_협의체회의_개편시안_보기.html)
 *  본사 ☰ 협의체 맨 위 「협의체 회의」 카드 (council.js sCo) · 달 결과 화면 안 카드 · 업체 대시보드 카드 · 메일 링크(?cm=달)
 *  열기 = 날짜 · 시만 → 개최 공문 메일 (입고도우미 업체 계약담당자 · 출석 링크) → 메일 받은 날부터 출석 → 회의 종료 = 출석 확정 + 결과 PDF
 *  출석: 업체 = 로그인한 계약담당자 [출석] (이름 고칠 수 있음) · 못 하면 도급인이 직접 등록 · 도급인 직원이 링크를 열면 도급인 출석
 *  안건 기간 = 지난 회의 다음 날 ~ 이번 회의 전날 (지난 회의 없음 = 앞 30일) · 결과 PDF = ① 개최 공문 ② 안건 ③ 참석 현황 (서버가 바로 만들어 보냄 · Drive 안 거침)
 *  서버: Relay cmGet · cmSave · cmMail · cmDel · cmAdd · cmDrop · cmHqIn · cmDone · cmResult · cmPdf · cmVList · cmVIn · cmVPdf · (점장) scCmPdf
 *  S8-28 회의록 = 시행규칙 제79조 ② 협의 사항 1~5 + 6 재해 + 기타 (cmNote 저장 · cmAgenda 4 · 6 미리 보기) · 결과 PDF ① 공문 ② 회의록 ③ 미흡 사진 ④ 참석 ⑤ 붙임 */
let cmCur=null,cmEdit=null,cmPoll=0,cmV=null,cmBusy=false,cmVEdit='';
const CM_HOURS=[7,8,9,10,11,12,13,14,15,16,17,18,19,20];
const cmCard=(t,pill,body)=>'<div class="card"><div class="vh-top" style="align-items:center"><h2 style="margin:0">'+t+'</h2>'+(pill||'')+'</div>'+body+'</div>';
const cmHr=m=>m&&m.hour?Number(m.hour)+'시':(m&&m.time||'');
const cmWhen=m=>m&&m.date?jtD(m.date)+(cmHr(m)?' '+cmHr(m):''):'';
const cmAddDay=(d,n)=>{const x=new Date(d+'T00:00:00Z');x.setUTCDate(x.getUTCDate()+n);return x.toISOString().slice(0,10)};
const cmDot=d=>String(d||'').slice(5).replace('-','.');
const CM_HOW={AUTO:'회의 연 사람',APP:'앱',HQ:'도급인 등록',STAFF:'링크',QR:'QR'};
/** 다음 달 (yyyy-mm) */
const cmNextP=P=>{const y=+P.slice(0,4),m=+P.slice(5,7);return m===12?(y+1)+'-01':y+'-'+('0'+(m+1)).slice(-2)};
/** 안건 기간 미리 보기 (서버와 같은 규칙) */
function cmRangeOf(date,prev){if(!date)return null;return {from:prev&&prev<date?cmAddDay(prev,1):cmAddDay(date,-30),to:cmAddDay(date,-1),first:!(prev&&prev<date)}}

/* ---------- 본사: 회의 카드 (P = 달) ---------- */
function cmCardHtml(P){jtCss();
 if(!cmCur||cmCur.id!==P){const c=typeof cacheGet==='function'?cacheGet('cmGet',[P]):null;if(c&&c.id===P&&!c.err){cmEdit=null;cmCur=c;setTimeout(()=>cmLoad(P,true),0);return '<div id="cmBox">'+cmInner()+'</div>'}}  // S8-26 저장해 둔 것 먼저
 if(cmCur&&cmCur.id===P)setTimeout(cmPollSet,0);  // S8-26 회의 카드가 coList와 같이 와도 출석 받는 중이면 30초마다 새로 고침
 if(!cmCur||cmCur.id!==P){cmEdit=null;cmLoad(P);return '<div id="cmBox">'+cmCard('협의체 회의','','<p class="muted" style="margin:8px 0 0">불러오는 중…</p>')+'</div>'}return '<div id="cmBox">'+cmInner()+'</div>'}
async function cmLoad(P,quiet){if(cmBusy)return;cmBusy=true;try{const r=await callQuiet('cmGet',P);if(!cmEdit)cmCur=r}catch(e){if(!quiet)cmCur={id:P,err:(e&&e.message)||'불러오지 못했습니다.'}}finally{cmBusy=false}cmRedraw()}
function cmRedraw(){const b=$('cmBox');if(b&&cmCur)b.innerHTML=cmInner();cmPollSet()}
/** 출석 받는 중 = 30초마다 조용히 새로 고침 (화면에 있을 때만) */
function cmPollSet(){clearInterval(cmPoll);if(!cmCur||cmCur.status!=='PLAN'||cmEdit||cmTab==='ag')return;const P=cmCur.id;cmPoll=setInterval(()=>{if(!$('cmBox')||!cmCur||cmCur.id!==P||cmCur.status!=='PLAN'||cmEdit||cmTab==='ag'){clearInterval(cmPoll);return}cmLoad(P,true)},30000)}  // S8-28 협의 사항을 적는 중엔 안 함
/** 업체별 출석 표 (업체 · 출석자 · 상태) */
function cmVTable(m){const e=escapeText,done=m.status==='DONE',A=m.attendees||[];
 const V=done?(m.vendors||[]).map(v=>({id:v.companyId,n:v.company,who:v.who||(v.names||[]).map(n=>({n})),in:v.in})):(m.vendorList||[]).map(v=>{const W=A.filter(x=>x.side==='VENDOR'&&String(x.companyId)===v.id);return {id:v.id,n:v.n,who:W,in:W.length>0}});
 return {V,html:'<table class="rtable chkt" style="margin-top:10px"><tr><th>업체</th><th>출석자</th><th></th></tr>'+(V.length?V.map(v=>'<tr><td><b>'+e(v.n)+'</b></td><td>'+(v.who.length?v.who.map(w=>e(w.n)+(w.how?' <span class="muted" style="font-size:11.5px">· '+e(CM_HOW[w.how]||'')+(w.at?' '+e(cmDot(String(w.at).slice(0,10))):'')+'</span>':'')).join('<br>'):'—')+'</td><td><span class="shpill '+(v.in?'ok':'no')+'">'+(v.in?'출석':done?'불참':'아직')+'</span></td></tr>').join(''):'<tr><td colspan="3" class="muted">승인된 입고도우미 업체가 없습니다.</td></tr>')+'</table>'}}
function cmInner(){const m=cmCur,e=escapeText,mon=coMon(m.id);
 if(m.err)return cmCard('협의체 회의','','<p class="muted">'+e(m.err)+'</p><button class="button ghost" type="button" onclick="cmCur=null;cmLoad(\''+e(m.id)+'\')">다시 시도</button>');
 if(cmEdit)return cmFormHtml();
 if(m.none)return cmCard('협의체 회의','<span class="shpill">열린 회의 없음</span>','<p class="muted" style="margin:6px 0 0">매월 중순 정기 회의 · 날짜와 시만 고르면 업체에 개최 공문 메일이 갑니다. 고른 날짜의 달이 그 달 협의체가 됩니다.</p>'
  +(m.canEdit?'<button class="button" type="button" style="width:100%;margin-top:10px" onclick="cmNew()">협의체 회의 열기</button>':'<p class="muted" style="margin:8px 0 0">안전보건팀 · 도급인 담당자가 회의를 열면 여기에 보입니다.</p>'));
 const R=m.range||{},head='<div class="shli" style="cursor:default">'+shIc('cal')+'<span class="t"><b>'+e(cmWhen(m))+'</b><span class="muted">'+(m.mailAt?'개최 공문 메일 '+e(fmtTime(m.mailAt))+' · '+(m.mailCount||0)+'곳':'개최 공문 메일 안 보냄')+'</span></span></div>'
  +(R.from?'<div class="muted" style="margin-top:2px">안건 기간 '+e(cmDot(R.from)+' ~ '+cmDot(R.to))+(m.status==='DONE'?'':' (자동)')+'</div>':'');
 const T=cmVTable(m),nIn=T.V.filter(v=>v.in).length,A=m.attendees||[],hq=A.filter(x=>x.side==='HQ');
 const hqLine=hq.length?'<div class="muted" style="margin-top:8px">도급인 · '+e(hq.map(x=>x.n).join(' · '))+'</div>':'';
 /* S8-28 끝난 회의 = 탭 「결과 · 출석」 · 「회의록」 (회의록은 종료 뒤에도 고칠 수 있음 · 안전보건팀 · 도급인 담당자) */
 if(m.status==='DONE'){if(!['att','ag'].includes(cmTab))cmTab='att';const tabs=cmTabs([['att','결과 · 출석 '+nIn+'/'+T.V.length],['ag','회의록']]),pill='<span class="shpill ok">업체 '+nIn+' / '+T.V.length+'</span>';
  if(cmTab==='ag')return cmCard(e(mon)+' 협의체 회의',pill,head+tabs+cmAgHtml(m));
  return cmCard(e(mon)+' 협의체 회의',pill,head+tabs+T.html+hqLine
  +'<div class="muted" style="margin-top:4px">종료 '+e(fmtTime(m.doneAt))+' · 반기 평가 협의체 참석률에 들어갑니다.</div>'
  +(m.hasResult?'<button class="button" type="button" style="width:100%;margin-top:10px" onclick="cmPdfGet(\''+e(m.id)+'\')">결과 PDF 내려받기</button><p class="muted" style="margin:6px 0 0">① 개최 공문 · ② 회의록 · ③ 미흡 사진 · ④ 참석 현황 · ⑤ 붙임 (순회점검 상세)</p>'
   :'<p class="muted" style="margin:10px 0 0">결과를 아직 만들지 못했습니다.</p>'+(m.canEdit?'<button class="button" type="button" style="width:100%;margin-top:6px" onclick="cmResultAgain()">결과 다시 만들기</button>':'')))}
 /* S8-28 출석 받는 중 = 탭 「출석」 · 「협의 사항」(회의 중 화면에 띄워 설명 · 회의록) · 「종료」 */
 const tabL=[['att','출석 '+nIn+'/'+T.V.length],['ag','협의 사항']].concat(m.canEdit?[['end','종료']]:[]);if(!tabL.some(x=>x[0]===cmTab))cmTab='att';
 const tabs=cmTabs(tabL),pillP='<span class="shpill no">출석 받는 중</span>';
 if(cmTab==='ag')return cmCard(e(mon)+' 협의체 회의',pillP,head+tabs+cmAgHtml(m));
 const before=m.today<m.date;
 if(cmTab==='end'){const g=cmAgEd[m.id]||m.agenda||{},nA=['a1','a2','a3','a5'].filter(k=>String(g[k]||'').trim()).length;
  return cmCard(e(mon)+' 협의체 회의',pillP,head+tabs+'<div style="margin-top:8px">'
   +'<div class="shli" style="cursor:default">'+shIc(nIn?'check':'alert',!nIn)+'<span class="t"><b>출석</b><span class="muted">업체 '+nIn+' / '+T.V.length+' · 도급인 '+hq.length+'명</span></span></div>'
   +'<div class="shli" style="cursor:default">'+shIc(nA===4?'check':'alert',nA<4)+'<span class="t"><b>협의 사항 1 · 2 · 3 · 5</b><span class="muted">'+nA+' / 4 적음'+(String(g.etc||'').trim()?' · 기타 있음':'')+(cmAgEd[m.id]?' · 저장 안 한 내용은 종료할 때 같이 저장':'')+'</span></span></div>'
   +'<div class="shli" style="cursor:default">'+shIc('doc')+'<span class="t"><b>4 · 6 자동</b><span class="muted">안건 기간 '+e(cmDot(R.from)+' ~ '+cmDot(R.to))+' · 종료 때 확정</span></span></div></div>'
   +'<button class="button" type="button" style="width:100%;margin-top:10px"'+(before?' disabled':'')+' onclick="cmDone()">회의 종료 · 결과 PDF 만들기</button>'
   +(before?'<p class="muted" style="margin:6px 0 0">회의 날('+e(jtD(m.date))+')부터 누를 수 있습니다.</p>':'<p class="muted" style="margin:6px 0 0">종료하면 출석은 고칠 수 없습니다 · 회의록(협의 사항)은 종료 뒤에도 고칠 수 있습니다.</p>'))}
 const me=m.mine?'':'<button class="button ghost" type="button" style="width:100%;margin-top:10px" onclick="cmHqIn()">도급인으로 출석 ('+e(m.myName||'내 이름')+')</button>';
 let h=head+tabs+'<div class="row" style="gap:6px;margin-top:10px;align-items:center"><input class="shinp" style="flex:1;margin:0;font-size:12.5px" readonly value="'+e(m.link||'')+'" aria-label="출석 링크"><button type="button" class="button ghost" onclick="copyLink(\''+e(m.link||'')+'\')">링크 복사</button></div>'
  +'<p class="muted" style="margin:4px 0 0">채팅 · 문자로 업체나 도급인 쪽 사람에게 따로 보낼 때 · 업체는 로그인 뒤 [출석] · 도급인 직원은 도급인 출석</p>'
  +T.html+hqLine+me;
 if(!m.canEdit)return cmCard(e(mon)+' 협의체 회의','<span class="shpill no">출석 받는 중</span>',h);
 h+='<div class="vh-top" style="align-items:center;margin-top:14px"><b>도급인이 직접 출석 등록</b><button type="button" class="linkbtn" onclick="cmLoad(\''+e(m.id)+'\')">새로 고침</button></div>'
  +'<div class="row" style="gap:6px;margin-top:6px"><select id="cmAddC" class="shinp" style="flex:2;margin:0" aria-label="소속">'+(m.vendorList||[]).map(v=>'<option value="'+e(v.id)+'">'+e(v.n)+'</option>').join('')+'<option value="">아성다이소 (도급인)</option></select><input id="cmAddN" class="shinp" style="flex:2;margin:0" placeholder="출석자 이름" aria-label="출석자 이름"><button class="button" type="button" onclick="cmAdd()">등록</button></div>'
  +(A.length?'<details class="hist" style="margin-top:8px"><summary class="muted">출석 기록 '+A.length+' · 빼기</summary>'+A.map((x,i)=>'<div class="jtwho"><span class="jtav">'+e((x.n||'?').slice(0,1))+'</span><span class="t"><b>'+e(x.n)+'</b> <span class="muted">'+e((x.co||'')+' · '+(CM_HOW[x.how]||''))+'</span></span><button type="button" class="linkbtn" onclick="cmDrop('+i+')">빼기</button></div>').join('')+'</details>':'')
  +'<div class="row" style="margin-top:12px"><button class="button ghost" type="button" style="flex:1" onclick="cmEditOpen()">일정 고치기</button><button class="button ghost" type="button" style="flex:1" onclick="cmMailAgain()">메일 다시</button><button class="button ghost" type="button" style="flex:1" onclick="cmDel()">회의 취소</button></div>'
  +'<p class="muted" style="margin:8px 0 0">회의 중에는 「협의 사항」 탭을 화면에 띄워 설명하고, 끝나면 「종료」 탭에서 회의 종료 · 결과 PDF를 만듭니다.</p>';
 return cmCard(e(mon)+' 협의체 회의',pillP,h)}
/* ---------- S8-28 협의 사항 = 회의록 (시행규칙 제79조 ②) ----------
 *  1 · 2 · 3 · 5 · 기타 = 적는 칸 (처음엔 빈칸 + 회색 예시 · 다음 회의를 열 때 지난 내용이 미리 들어감) · 4 · 6 = 자동 (서버 cmAgenda · 저장 안 하고 집계) */
let cmTab='att';const cmAgEd={},cmAgPv={},cmAgBusy={};
function cmTabs(L){return '<div class="seg" role="tablist" style="margin-top:10px">'+L.map(([k,t])=>'<button type="button" role="tab" aria-selected="'+(cmTab===k)+'" class="'+(cmTab===k?'on':'')+'" onclick="cmTabGo(\''+k+'\')">'+escapeText(t)+'</button>').join('')+'</div>'}
function cmTabGo(k){cmTab=k;cmRedraw()}
function cmAgCss(){if($('cmAgCss'))return;const s=document.createElement('style');s.id='cmAgCss';s.textContent='.cmag{border-top:1px solid var(--line);padding:10px 0}.cmag:first-child{border-top:0}.cmag>b{display:block;margin-bottom:4px;font-size:13.5px}.cmag textarea{margin:0;width:100%;min-height:54px;resize:vertical;font:inherit;line-height:1.55}.cmag textarea::placeholder{color:#a3a9b3}.cmag .auto{font-size:13px;line-height:1.7}';document.head.appendChild(s)}
/** 4 · 6 자동 칸 글 */
function cmAgAutoHtml(pv,k){if(!pv)return '<span class="muted">불러오는 중…</span>';if(pv.err)return '<span class="muted">불러오지 못했습니다.</span> <button type="button" class="linkbtn" onclick="delete cmAgPv[\''+escapeText(pv.id||'')+'\'];cmRedraw()">다시</button>';
 const L=k==='a4'?coI4Lines(pv):coI6Lines(pv);return L.length?L.map(l=>'· '+l).join('<br>'):'<span class="muted">'+(k==='a4'?'이 기간 미흡 · 시정요구서 · 합동점검 불량 없음':'재해 없음')+'</span>'}
function cmAgHtml(m){cmAgCss();const e=escapeText,P=m.id,g=cmAgEd[P]||m.agenda||{},ed=!!m.canEdit,pv=cmAgPv[P],R=m.range||{};
 if(!pv&&!cmAgBusy[P])setTimeout(()=>cmAgLoad(P),0);
 const fld=(k,n)=>'<div class="cmag"><b>'+(n?n+'. ':'')+e(CO_AG_T[k])+'</b>'+(ed?'<textarea class="shinp" id="cmAg_'+k+'" placeholder="'+e(CO_AG_EX[k]||'')+'" oninput="cmAgSet(\''+e(P)+'\',\''+k+'\',this.value)" aria-label="'+e(CO_AG_T[k])+'">'+e(g[k]||'')+'</textarea>'
  :'<div>'+(String(g[k]||'').trim()?e(g[k]).replace(/\n/g,'<br>'):'<span class="muted">기록 없음</span>')+'</div>')+'</div>';
 const auto=(n,k)=>'<div class="cmag"><b>'+n+'. '+e(CO_AG_T[k])+' <span class="shpill" style="margin-left:4px;font-weight:500">자동</span></b><div class="auto" id="cmAgA_'+k+'">'+cmAgAutoHtml(pv,k)+'</div></div>';
 return '<div class="muted" style="margin:8px 0 2px">시행규칙 제79조 ② 협의 사항 · 안건 기간 '+e(cmDot(R.from)+' ~ '+cmDot(R.to))+(m.status==='DONE'?' · 종료 때 확정':' · 4 · 6은 지금 기록으로 집계 (종료 때 확정)')+'</div>'
  +'<div>'+fld('a1',1)+fld('a2',2)+fld('a3',3)+auto(4,'a4')+fld('a5',5)+auto(6,'a6')+fld('etc',0)+'</div>'
  +'<div class="row" style="gap:6px;margin-top:6px"><button class="button ghost" type="button" style="flex:1" onclick="cmAgBig(\''+e(P)+'\')">크게 보기</button>'+(ed?'<button class="button" type="button" style="flex:1" onclick="cmAgSave(\''+e(P)+'\')">저장</button>':'')+'</div>'
  +'<p class="muted" style="margin:6px 0 0">4 = 미흡 · 시정요구서 · 합동점검 불량이 있는 것만 · 미흡 사진은 결과 PDF 회의록 다음 쪽'+(m.status==='DONE'&&ed?' · 고치면 결과 PDF에 바로 반영':'')+'</p>'}
async function cmAgLoad(P){if(cmAgBusy[P])return;cmAgBusy[P]=1;try{cmAgPv[P]={...(await callQuiet('cmAgenda',P)),id:P}}catch(e){cmAgPv[P]={id:P,err:1}}finally{delete cmAgBusy[P]}
 ['a4','a6'].forEach(k=>{const el=$('cmAgA_'+k);if(el&&cmCur&&cmCur.id===P)el.innerHTML=cmAgAutoHtml(cmAgPv[P],k)})}
function cmAgSet(P,k,v){const b=cmAgEd[P]||{...((cmCur&&cmCur.id===P&&cmCur.agenda)||{})};b[k]=v;cmAgEd[P]=b}
async function cmAgSave(P){const g=cmAgEd[P]||(cmCur&&cmCur.agenda)||{};try{cmCur=await call('cmNote',P,g);delete cmAgEd[P];if(typeof coCur!=='undefined'&&coCur&&coCur.id===P)coCur=null;msg('저장했습니다.');cmRedraw()}catch(e){}}
/** 크게 보기 (회의 중 화면 공유 · 회의실 TV) = 새 창 */
function cmAgBig(P){const m=cmCur;if(!m||m.id!==P)return;const g=cmAgEd[P]||m.agenda||{},pv=cmAgPv[P]||{},w=window.open('','_blank');if(!w){msg('새 창이 막혀 있습니다. 브라우저에서 팝업을 허용해 주세요.');return}
 w.document.write('<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>'+escapeText(coMon(P))+' 협의체 · 협의 사항</title><style>body{font:20px/1.6 "Malgun Gothic",sans-serif;color:#111;margin:28px}h1{font-size:30px;margin:0 0 6px}.muted{color:#6b7280}table{width:100%;border-collapse:collapse;margin-top:14px}th,td{border:1px solid #9ca3af;padding:12px 14px;text-align:left;vertical-align:top}th{background:#f3f4f6;width:34%}</style></head><body>'
  +'<h1>'+escapeText(coMon(P))+' 안전보건협의체 · 협의 사항</h1><div class="muted">'+escapeText(cmWhen(m))+' · 안건 기간 '+escapeText(cmDot((m.range||{}).from)+' ~ '+cmDot((m.range||{}).to))+' · 산업안전보건법 시행규칙 제79조 ②</div>'
  +coMinutesHtml({...g,i4:pv.i4||{},i6:pv.i6||[]})+'</body></html>');w.document.close()}
/* 개최 공문 메일 받을 업체 고르기 (처음 = 전체) */
const cmAllTo=()=>(cmCur&&cmCur.mailList||[]).map(v=>v.id);
const CM_AG_IN=['a1','a2','a3','a5'];  // S8-28 회의 열 때 적는 협의 사항 (4 · 6 = 자동)
function cmNew(){const pa=(cmCur&&cmCur.prevAgenda)||null,ag={};CM_AG_IN.forEach(k=>{ag[k]=pa?pa[k]||'':''});cmEdit={date:'',hour:'14',to:cmAllTo(),ag,agFrom:pa?pa.from:''};cmRedraw()}  // 지난 회의 내용이 미리 들어감 (없으면 빈칸 + 회색 예시)
function cmEditOpen(){const m=cmCur,ok=new Set(cmAllTo()),T=(m.mailTo||[]).filter(x=>ok.has(x)),g=cmAgEd[m.id]||m.agenda||{},ag={};CM_AG_IN.forEach(k=>{ag[k]=g[k]||''});cmEdit={id:m.id,date:m.date,hour:String(Number(m.hour||String(m.time||'14').slice(0,2))),to:T.length?T:cmAllTo(),ag,etc:g.etc||''};cmRedraw()}
/** S8-28 회의 열기 화면의 협의 사항 1 · 2 · 3 · 5 칸 */
function cmFormAgHtml(){const E=cmEdit,e=escapeText;cmAgCss();
 return '<div style="margin-top:14px"><b>협의 사항 (시행규칙 제79조 ②)</b><div class="muted">'+(E.agFrom?e(coMon(E.agFrom))+' 회의 내용을 넣어 두었습니다 · 바뀐 것만 고치세요':'처음 한 번 적어 두면 다음 회의부터 그대로 이어집니다 · 회색 글씨는 예시')+' · 4 위험성평가 · 6 재해는 자동</div>'
  +'<div style="margin-top:4px">'+CM_AG_IN.map(k=>'<div class="cmag"><b>'+({a1:1,a2:2,a3:3,a5:5}[k])+'. '+e(CO_AG_T[k])+'</b><textarea class="shinp" placeholder="'+e(CO_AG_EX[k]||'')+'" oninput="cmEdit.ag.'+k+'=this.value" aria-label="'+e(CO_AG_T[k])+'">'+e((E.ag||{})[k]||'')+'</textarea></div>').join('')+'</div></div>'}
function cmToggle(id,on){const S=new Set(cmEdit.to||[]);if(id==='*'){cmEdit.to=on?cmAllTo():[]}else{if(on)S.add(id);else S.delete(id);cmEdit.to=cmAllTo().filter(x=>S.has(x))}cmRedraw()}
function cmToHtml(){const e=escapeText,L=(cmCur&&cmCur.mailList)||[],S=new Set(cmEdit.to||[]);if(!L.length)return '<p class="muted" style="margin:10px 0 0">메일 받을 승인 업체가 없습니다.</p>';
 return '<details class="hist" style="margin-top:12px"'+(S.size<L.length?' open':'')+'><summary><b>개최 공문 메일 받는 곳 '+S.size+' / '+L.length+'</b> <span class="muted">· 입고도우미 업체 계약담당자</span></summary>'
  +'<label class="muted" style="display:flex;gap:6px;align-items:center;margin-top:6px"><input type="checkbox" '+(S.size===L.length?'checked':'')+' onchange="cmToggle(\'*\',this.checked)">전체</label>'
  +'<div id="cmTo" style="display:flex;flex-direction:column;gap:6px;margin-top:6px">'+L.map(v=>'<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" '+(S.has(v.id)?'checked':'')+' onchange="cmToggle(\''+e(v.id)+'\',this.checked)"><span>'+e(v.n)+'</span></label>').join('')+'</div></details>'}
function cmFormHtml(){const E=cmEdit,e=escapeText,t=(cmCur&&cmCur.today)||kstToday(),R=cmRangeOf(E.date,cmCur&&cmCur.prev),ed=!!E.id;
 return cmCard(ed?e(coMon(E.id))+' 회의 일정 고치기':'협의체 회의 열기','','<div class="row" style="gap:8px;margin-top:10px"><div style="flex:2"><label class="muted" for="cmDate">날짜</label><input id="cmDate" class="shinp" type="date" min="'+e(t)+'" value="'+e(E.date)+'" onchange="cmEdit.date=this.value;cmRedraw()"></div>'
  +'<div style="flex:1"><label class="muted" for="cmHour">시</label><select id="cmHour" class="shinp" onchange="cmEdit.hour=this.value">'+CM_HOURS.map(h=>'<option value="'+h+'"'+(String(h)===String(E.hour)?' selected':'')+'>'+h+'시</option>').join('')+'</select></div></div>'
  +(R?'<div class="muted" style="margin-top:8px;padding:8px 10px;background:var(--bg);border-radius:10px"><b style="color:var(--text)">안건 수집 기간 (자동)</b><br>'+e(cmDot(R.from)+' ~ '+cmDot(R.to))+' · '+(R.first?'회의일 앞 30일 (지난 회의 없음)':'지난 회의('+e(cmDot(cmCur.prev))+') 다음 날 ~ 이번 회의 전날')+'</div>':'')
  +cmToHtml()+cmFormAgHtml()
  +'<button class="button" type="button" style="width:100%;margin-top:12px" onclick="cmSave()">'+(ed?'저장 (날짜 · 시 · 받는 곳이 바뀌면 메일 다시)':'회의 열기 · 개최 공문 메일 발송')+'</button><button class="button ghost" type="button" style="width:100%;margin-top:6px" onclick="cmEdit=null;cmRedraw()">취소</button>'
  +'<p class="muted" style="margin:8px 0 0">회의 방식(대면 · 화상)은 따로 알려 주세요. 회의 날짜의 달이 그 달 협의체가 됩니다.</p>')}
async function cmSave(){const E=cmEdit,miss=[];if(!E.date)miss.push('cmDate');if(!(E.to||[]).length)miss.push('cmTo');if(miss.length){inspFlag(miss,miss.map(x=>({cmDate:'날짜',cmTo:'받는 곳'}[x])).join(' · '));return}
 try{const r=await call('cmSave',{id:E.id||'',date:E.date,hour:E.hour,to:E.to,agenda:{...(E.ag||{}),etc:E.etc||''}});cmCur=r;cmEdit=null;if(E.id)delete cmAgEd[E.id];cmRedraw();coL=null;if(typeof dsD!=='undefined')dsD=null;cmListRefresh('');msg(r.mailed?'열었습니다 · 개최 공문 메일 '+r.mailed+'곳':'저장했습니다')}catch(e){}}
async function cmMailAgain(){const n=(cmCur.mailTo||[]).length;if(!await askOk('개최 공문 메일',(n?'고른 업체 '+n+'곳':'입고도우미 업체 계약담당자 전체')+'에게 개최 공문 메일을 다시 보낼까요?\n받는 곳을 바꾸려면 [일정 고치기]에서 고르세요.','보내기'))return;try{const r=await call('cmMail',cmCur.id);cmCur=r;cmRedraw();msg('보냈습니다 · '+r.mailed+'곳')}catch(e){}}
async function cmDel(){if(!await askOk('회의 취소',coMon(cmCur.id)+' 협의체 회의를 취소할까요?\n출석 기록도 지워집니다.'+(cmCur.mailAt?'\n업체에 취소 메일이 갑니다.':''),'취소하기'))return;try{cmCur=await call('cmDel',cmCur.id);cmRedraw();coL=null;if(typeof dsD!=='undefined')dsD=null;cmListRefresh('');msg('취소했습니다.')}catch(e){}}
async function cmAdd(){const n=($('cmAddN').value||'').trim();if(!n){inspFlag(['cmAddN'],'출석자 이름');return}try{cmCur=await call('cmAdd',cmCur.id,n,$('cmAddC').value);cmRedraw();msg('출석으로 등록했습니다.')}catch(e){}}
async function cmDrop(i){const x=(cmCur.attendees||[])[i];if(!x||!await askOk('출석 빼기',x.n+' ('+(x.co||'')+') 님을 출석에서 뺄까요?','빼기'))return;try{cmCur=await call('cmDrop',cmCur.id,i);cmRedraw()}catch(e){}}
async function cmHqIn(){try{cmCur=await call('cmHqIn',cmCur.id,cmCur.myName||'');cmRedraw();msg('도급인으로 출석했습니다.')}catch(e){}}
async function cmDone(){const m=cmCur,T=cmVTable(m),nIn=T.V.filter(v=>v.in).length;
 if(!await askOk('회의 종료',coMon(m.id)+' 협의체 회의\n업체 출석 '+nIn+' / '+T.V.length+'\n\n종료하면 출석이 확정되고 고칠 수 없습니다.\n회의록(협의 사항 1~6 · '+cmDot((m.range||{}).from)+' ~ '+cmDot((m.range||{}).to)+')을 확정해 결과 PDF를 만듭니다.\n회의록 글은 종료 뒤에도 고칠 수 있습니다.','종료'))return;
 try{if(cmAgEd[m.id]){await call('cmNote',m.id,cmAgEd[m.id]);delete cmAgEd[m.id]}  // S8-28 저장 안 한 협의 사항 먼저
  cmCur=await call('cmDone',m.id);delete cmAgPv[m.id];cmTab='att';coL=null;if(typeof dsD!=='undefined')dsD=null;
  if(cmCur.resultErr){cmRedraw();cmListRefresh(m.id);msg('종료했습니다 · 결과는 [결과 다시 만들기]를 눌러 주세요');return}
  msg('종료했습니다 · 결과 PDF를 내려받을 수 있습니다');cmShowResult(m.id)}catch(e){}}
async function cmResultAgain(){try{cmCur=await call('cmResult',cmCur.id);coL=null;msg('결과를 만들었습니다.');cmShowResult(cmCur.id)}catch(e){}}
/** 종료 뒤 = 그 달 결과 화면 (결과 PDF와 같은 순서) · ☰ 협의체가 아니면 카드만 새로 */
function cmShowResult(P){if(typeof coTopP!=='undefined')coTopP='';if(typeof tab!=='undefined'&&tab==='jobs'&&typeof smenu!=='undefined'&&smenu==='co'&&typeof coOpen==='function'){coOpen(P);return}cmRedraw()}
/** ☰ 협의체 첫 화면이면 아래 달 목록도 새로 (pin = 맨 위 카드를 이 달로 고정 · 종료 직후 결과 PDF가 보이게) */
function cmListRefresh(pin){if(pin&&typeof coTopP!=='undefined')coTopP=pin;if(typeof tab!=='undefined'&&tab==='jobs'&&typeof smenu!=='undefined'&&smenu==='co'&&typeof coSel!=='undefined'&&!coSel&&typeof coLoad==='function')coLoad()}
/** 결과 PDF 내려받기 (서버가 바로 만들어 보냄 · Drive 링크 없음) · who S 본사 · V 업체 · P 점장 */
async function cmPdfGet(id,who){try{const f=who==='V'?await call('cmVPdf',id):who==='P'?await shCall('scCmPdf',{id}):await call('cmPdf',id);saveBlob(f);msg('내려받았습니다.')}catch(e){}}
/** 협의체 목록 한 줄에 붙는 회의 요약 */
function cmRowTxt(id){const x=coL&&coL.meets&&coL.meets[id];if(!x)return '';return ' · 회의 '+jtD(x.date)+(x.status==='DONE'?' · 업체 '+x.nIn+'/'+x.nV:' · 출석 받는 중')}

/* ---------- 업체 대시보드 카드 ---------- */
async function cmVLoad(){try{cmV=await callQuiet('cmVList')}catch(e){return}cmVDraw();cmGoVendor()}
function cmVDraw(){const b=$('cmVBox');if(b)b.innerHTML=cmVCardHtml()}
function cmVCardHtml(){if(!cmV||!cmV.list.length)return '';jtCss();const e=escapeText,up=cmV.list.filter(x=>x.status!=='DONE'),done=cmV.list.filter(x=>x.status==='DONE');
 const one=x=>{const ed=cmVEdit===x.id||!x.me;return '<div class="shli" style="cursor:default">'+shIc(x.me?'check':'cal')+'<span class="t"><b>'+e(Number(x.id.slice(5,7))+'월 · '+cmWhen(x))+'</b><span class="muted">'+(x.me?'출석했습니다 · '+e(x.me):x.names.length?'우리 업체 출석 · '+e(x.names.join(', ')):'출석 전')+'</span></span>'+(x.me?'<span class="shpill ok">출석</span>':'')+'</div>'
  +(ed?'<div style="margin-top:4px">'+(x.me?'':'<b style="display:block;margin:4px 0">출석 체크하시겠습니까?</b>')+'<div class="row" style="gap:6px"><input id="cmVName_'+e(x.id)+'" class="shinp" style="flex:1;margin:0" placeholder="출석자 이름" value="'+e(x.me||cmV.myName||'')+'" autocomplete="name" aria-label="출석자 이름"><button class="button" type="button" onclick="cmVIn(\''+e(x.id)+'\')">'+(x.me?'이름 저장':'출석')+'</button></div>'
   +'<p class="muted" style="margin:4px 0 0">다른 분이 대신 가면 이름을 고쳐서 누르세요.</p></div>'
   :'<button type="button" class="linkbtn" onclick="cmVEdit=\''+e(x.id)+'\';cmVDraw()">이름 고치기</button>')+cmVAgHtml(x)};
 return '<div class="card" id="cmVCard"><div class="vh-top" style="align-items:center"><h2 style="margin:0">협의체 회의</h2>'+(up.length?'<span class="shpill'+(up.some(x=>!x.me)?' no':' ok')+'">'+(up.some(x=>!x.me)?'출석 전':'출석')+'</span>':'')+'</div>'
  +up.map(one).join('')
  +done.slice(0,6).map(x=>'<div class="shli" style="cursor:default">'+shIc(x.in?'check':'alert',!x.in)+'<span class="t"><b>'+e(coMon(x.id))+'</b><span class="muted">'+(x.in?'출석 · '+e(x.names.join(', ')):'불참')+'</span></span>'+(x.pdf?'<button type="button" class="linkbtn" onclick="cmPdfGet(\''+e(x.id)+'\',\'V\')">결과 ↓</button>':'')+'</div>').join('')
  +(up.length?'<p class="muted" style="margin:6px 0 0">회의 방식(대면 · 화상)은 도급인 담당자가 따로 알려 드립니다.</p>':'')+'</div>'}
/** S8-28 업체도 회의 전에 안건(협의 사항 1~6)을 미리 봄 · 1 · 2 · 3 · 5 = 도급인이 적은 내용 · 4 · 6 = 회의 때 공유 */
function cmVAgHtml(x){if(!x||!x.ag)return '';const e=escapeText,g=x.ag,R=x.range||{},t=k=>String(g[k]||'').trim()?e(g[k]).replace(/\n/g,'<br>'):'<span class="muted">회의 때 안내</span>';
 const row=(n,k,v)=>'<div style="padding:6px 0;border-top:1px solid var(--line)"><b style="font-size:13px">'+n+'. '+e(CO_AG_T[k])+'</b><div style="font-size:13px">'+v+'</div></div>';
 return '<details class="hist" style="margin:6px 0 4px"><summary class="muted">안건 · 협의 사항 1~6 (시행규칙 제79조 ②)</summary>'
  +row(1,'a1',t('a1'))+row(2,'a2',t('a2'))+row(3,'a3',t('a3'))
  +row(4,'a4','<span class="muted">'+e(cmDot(R.from)+' ~ '+cmDot(R.to))+' 순회점검 미흡 · 시정요구서 · 합동점검 결과 (회의 때 공유)</span>')
  +row(5,'a5',t('a5'))+row(6,'a6','<span class="muted">업체가 등록한 재해 (회의 때 공유) · 재해가 있으면 앱 「재해 등록」에 미리 올려 주세요</span>')+'</details>'}
/** 업체 화면 [출석] (로그인한 계약담당자 · 메일 받은 날부터 · 회의 종료 전) */
async function cmVIn(id){const k='cmVName_'+id,n=(($(k)||{}).value||'').trim();if(!n){inspFlag([k],'출석자 이름');return}try{cmV=await call('cmVIn',id,n);cmVEdit='';cmVDraw();msg('출석했습니다.')}catch(e){}}

/* ---------- 메일 링크 (?cm=달 · 예전 ?review=CMT-) → 로그인 뒤 바로 ---------- */
function cmGoGet(){let p=null;try{p=JSON.parse(localStorage.getItem('cmGo')||'null')}catch(e){}if(!p)return null;if(Date.now()-Number(p.t||0)>7200000){cmGoDrop();return null}return p}
function cmGoDrop(){try{localStorage.removeItem('cmGo')}catch(e){}}
/** app.js display() 뒤: 직원 = ☰ 협의체 그 달 회의 · 업체 = 대시보드 카드 (cmVLoad에서) */
function cmPending(){const p=cmGoGet();if(!p||!state)return;if(!state.staff){if(cmV)cmGoVendor();return}
 cmGoDrop();if(typeof coTopP!=='undefined'&&/^\d{4}-\d{2}$/.test(p.p||''))coTopP=p.p;if(typeof sgo==='function')sgo('co');msg('협의체 회의 · 도급인 직원은 [도급인으로 출석]을 눌러 주세요.')}
function cmGoVendor(){const p=cmGoGet();if(!p||!state||state.staff)return;cmGoDrop();const c=$('cmVCard');if(!c){msg('열린 협의체 회의가 없습니다.');return}
 c.scrollIntoView({block:'center'});c.style.boxShadow='0 0 0 2px var(--accent)';setTimeout(()=>{c.style.boxShadow=''},4000);const x=(cmV.list||[]).find(y=>y.status!=='DONE'&&(!p.p||y.id===p.p));msg(x&&x.me?'이미 출석했습니다.':'협의체 회의 · [출석]을 눌러 주세요.')}
