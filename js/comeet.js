/* S8-24 협의체 회의 개편 (시안 06_시안/입고도우미_협의체회의_개편시안_보기.html)
 *  본사 ☰ 협의체 맨 위 「협의체 회의」 카드 (council.js sCo) · 달 결과 화면 안 카드 · 업체 대시보드 카드 · 메일 링크(?cm=달)
 *  열기 = 날짜 · 시만 → 개최 공문 메일 (입고도우미 업체 계약담당자 · 출석 링크) → 메일 받은 날부터 출석 → 회의 종료 = 출석 확정 + 결과 PDF
 *  출석: 업체 = 로그인한 계약담당자 [출석] (이름 고칠 수 있음) · 못 하면 도급인이 직접 등록 · 도급인 직원이 링크를 열면 도급인 출석
 *  안건 기간 = 지난 회의 다음 날 ~ 이번 회의 전날 (지난 회의 없음 = 앞 30일) · 결과 PDF = ① 개최 공문 ② 안건 ③ 참석 현황 (서버가 바로 만들어 보냄 · Drive 안 거침)
 *  서버: Relay cmGet · cmSave · cmMail · cmDel · cmAdd · cmDrop · cmHqIn · cmDone · cmResult · cmPdf · cmVList · cmVIn · cmVPdf · (점장) scCmPdf */
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
function cmCardHtml(P){jtCss();if(!cmCur||cmCur.id!==P){cmEdit=null;cmLoad(P);return '<div id="cmBox">'+cmCard('협의체 회의','','<p class="muted" style="margin:8px 0 0">불러오는 중…</p>')+'</div>'}return '<div id="cmBox">'+cmInner()+'</div>'}
async function cmLoad(P,quiet){if(cmBusy)return;cmBusy=true;try{cmCur=await callQuiet('cmGet',P)}catch(e){if(!quiet)cmCur={id:P,err:(e&&e.message)||'불러오지 못했습니다.'}}finally{cmBusy=false}cmRedraw()}
function cmRedraw(){const b=$('cmBox');if(b&&cmCur)b.innerHTML=cmInner();cmPollSet()}
/** 출석 받는 중 = 30초마다 조용히 새로 고침 (화면에 있을 때만) */
function cmPollSet(){clearInterval(cmPoll);if(!cmCur||cmCur.status!=='PLAN'||cmEdit)return;const P=cmCur.id;cmPoll=setInterval(()=>{if(!$('cmBox')||!cmCur||cmCur.id!==P||cmCur.status!=='PLAN'||cmEdit){clearInterval(cmPoll);return}cmLoad(P,true)},30000)}
/** 업체별 출석 표 (업체 · 출석자 · 상태) */
function cmVTable(m){const e=escapeText,done=m.status==='DONE',A=m.attendees||[];
 const V=done?(m.vendors||[]).map(v=>({id:v.companyId,n:v.company,who:v.who||(v.names||[]).map(n=>({n})),in:v.in})):(m.vendorList||[]).map(v=>{const W=A.filter(x=>x.side==='VENDOR'&&String(x.companyId)===v.id);return {id:v.id,n:v.n,who:W,in:W.length>0}});
 return {V,html:'<table class="rtable chkt" style="margin-top:10px"><tr><th>업체</th><th>출석자</th><th></th></tr>'+(V.length?V.map(v=>'<tr><td><b>'+e(v.n)+'</b></td><td>'+(v.who.length?v.who.map(w=>e(w.n)+(w.how?' <span class="muted" style="font-size:11.5px">· '+e(CM_HOW[w.how]||'')+(w.at?' '+e(cmDot(String(w.at).slice(0,10))):'')+'</span>':'')).join('<br>'):'—')+'</td><td><span class="shpill '+(v.in?'ok':'no')+'">'+(v.in?'출석':done?'불참':'아직')+'</span></td></tr>').join(''):'<tr><td colspan="3" class="muted">승인된 입고도우미 업체가 없습니다.</td></tr>')+'</table>'}}
function cmInner(){const m=cmCur,e=escapeText,mon=coMon(m.id);
 if(m.err)return cmCard('협의체 회의','','<p class="muted">'+e(m.err)+'</p><button class="button ghost" type="button" onclick="cmCur=null;cmLoad(\''+e(m.id)+'\')">다시 시도</button>');
 if(cmEdit)return cmFormHtml();
 if(m.none)return cmCard(e(mon)+' 협의체 회의','<span class="shpill">아직 안 엶</span>','<p class="muted" style="margin:6px 0 0">매월 중순 정기 회의 · 날짜와 시만 정하면 업체에 개최 공문 메일이 갑니다.</p>'
  +(m.canEdit?'<button class="button" type="button" style="width:100%;margin-top:10px" onclick="cmNew()">'+e(Number(m.id.slice(5,7)))+'월 협의체 회의 열기</button>':'<p class="muted" style="margin:8px 0 0">안전보건팀이 회의를 열면 여기에 보입니다.</p>'));
 const R=m.range||{},head='<div class="shli" style="cursor:default">'+shIc('cal')+'<span class="t"><b>'+e(cmWhen(m))+'</b><span class="muted">'+(m.mailAt?'개최 공문 메일 '+e(fmtTime(m.mailAt))+' · '+(m.mailCount||0)+'곳':'개최 공문 메일 안 보냄')+'</span></span></div>'
  +(R.from?'<div class="muted" style="margin-top:2px">안건 기간 '+e(cmDot(R.from)+' ~ '+cmDot(R.to))+(m.status==='DONE'?'':' (자동)')+'</div>':'');
 const T=cmVTable(m),nIn=T.V.filter(v=>v.in).length,A=m.attendees||[],hq=A.filter(x=>x.side==='HQ');
 const hqLine=hq.length?'<div class="muted" style="margin-top:8px">도급인 · '+e(hq.map(x=>x.n).join(' · '))+'</div>':'';
 if(m.status==='DONE')return cmCard(e(mon)+' 협의체 회의','<span class="shpill ok">업체 '+nIn+' / '+T.V.length+'</span>',head+T.html+hqLine
  +'<div class="muted" style="margin-top:4px">종료 '+e(fmtTime(m.doneAt))+' · 반기 평가 협의체 참석률에 들어갑니다.</div>'
  +(m.hasResult?'<button class="button" type="button" style="width:100%;margin-top:10px" onclick="cmPdfGet(\''+e(m.id)+'\')">결과 PDF 내려받기</button><p class="muted" style="margin:6px 0 0">① 개최 공문 · ② 안건 · ③ 참석 현황</p>'
   :'<p class="muted" style="margin:10px 0 0">결과를 아직 만들지 못했습니다.</p>'+(m.canEdit?'<button class="button" type="button" style="width:100%;margin-top:6px" onclick="cmResultAgain()">결과 다시 만들기</button>':'')));
 const before=m.today<m.date,me=m.mine?'':'<button class="button ghost" type="button" style="width:100%;margin-top:10px" onclick="cmHqIn()">도급인으로 출석 ('+e(m.myName||'내 이름')+')</button>';
 let h=head+'<div class="row" style="gap:6px;margin-top:10px;align-items:center"><input class="shinp" style="flex:1;margin:0;font-size:12.5px" readonly value="'+e(m.link||'')+'" aria-label="출석 링크"><button type="button" class="button ghost" onclick="copyLink(\''+e(m.link||'')+'\')">링크 복사</button></div>'
  +'<p class="muted" style="margin:4px 0 0">채팅 · 문자로 업체나 도급인 쪽 사람에게 따로 보낼 때 · 업체는 로그인 뒤 [출석] · 도급인 직원은 도급인 출석</p>'
  +T.html+hqLine+me;
 if(!m.canEdit)return cmCard(e(mon)+' 협의체 회의','<span class="shpill no">출석 받는 중</span>',h);
 h+='<div class="vh-top" style="align-items:center;margin-top:14px"><b>도급인이 직접 출석 등록</b><button type="button" class="linkbtn" onclick="cmLoad(\''+e(m.id)+'\')">새로 고침</button></div>'
  +'<div class="row" style="gap:6px;margin-top:6px"><select id="cmAddC" class="shinp" style="flex:2;margin:0" aria-label="소속">'+(m.vendorList||[]).map(v=>'<option value="'+e(v.id)+'">'+e(v.n)+'</option>').join('')+'<option value="">아성다이소 (도급인)</option></select><input id="cmAddN" class="shinp" style="flex:2;margin:0" placeholder="출석자 이름" aria-label="출석자 이름"><button class="button" type="button" onclick="cmAdd()">등록</button></div>'
  +(A.length?'<details class="hist" style="margin-top:8px"><summary class="muted">출석 기록 '+A.length+' · 빼기</summary>'+A.map((x,i)=>'<div class="jtwho"><span class="jtav">'+e((x.n||'?').slice(0,1))+'</span><span class="t"><b>'+e(x.n)+'</b> <span class="muted">'+e((x.co||'')+' · '+(CM_HOW[x.how]||''))+'</span></span><button type="button" class="linkbtn" onclick="cmDrop('+i+')">빼기</button></div>').join('')+'</details>':'')
  +'<div class="row" style="margin-top:12px"><button class="button ghost" type="button" style="flex:1" onclick="cmEditOpen()">일정 고치기</button><button class="button ghost" type="button" style="flex:1" onclick="cmMailAgain()">메일 다시</button><button class="button ghost" type="button" style="flex:1" onclick="cmDel()">회의 취소</button></div>'
  +'<button class="button" type="button" style="width:100%;margin-top:8px"'+(before?' disabled':'')+' onclick="cmDone()">회의 종료 · 결과 PDF 만들기</button>'
  +(before?'<p class="muted" style="margin:6px 0 0">회의 날('+e(jtD(m.date))+')부터 누를 수 있습니다.</p>':'');
 return cmCard(e(mon)+' 협의체 회의','<span class="shpill no">출석 받는 중</span>',h)}
/* 개최 공문 메일 받을 업체 고르기 (처음 = 전체) */
const cmAllTo=()=>(cmCur&&cmCur.mailList||[]).map(v=>v.id);
function cmNew(){cmEdit={date:'',hour:'14',to:cmAllTo()};cmRedraw()}
function cmEditOpen(){const m=cmCur,ok=new Set(cmAllTo()),T=(m.mailTo||[]).filter(x=>ok.has(x));cmEdit={id:m.id,date:m.date,hour:String(Number(m.hour||String(m.time||'14').slice(0,2))),to:T.length?T:cmAllTo()};cmRedraw()}
function cmToggle(id,on){const S=new Set(cmEdit.to||[]);if(id==='*'){cmEdit.to=on?cmAllTo():[]}else{if(on)S.add(id);else S.delete(id);cmEdit.to=cmAllTo().filter(x=>S.has(x))}cmRedraw()}
function cmToHtml(){const e=escapeText,L=(cmCur&&cmCur.mailList)||[],S=new Set(cmEdit.to||[]);if(!L.length)return '<p class="muted" style="margin:10px 0 0">메일 받을 승인 업체가 없습니다.</p>';
 return '<details class="hist" style="margin-top:12px"'+(S.size<L.length?' open':'')+'><summary><b>개최 공문 메일 받는 곳 '+S.size+' / '+L.length+'</b> <span class="muted">· 입고도우미 업체 계약담당자</span></summary>'
  +'<label class="muted" style="display:flex;gap:6px;align-items:center;margin-top:6px"><input type="checkbox" '+(S.size===L.length?'checked':'')+' onchange="cmToggle(\'*\',this.checked)">전체</label>'
  +'<div id="cmTo" style="display:flex;flex-direction:column;gap:6px;margin-top:6px">'+L.map(v=>'<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" '+(S.has(v.id)?'checked':'')+' onchange="cmToggle(\''+e(v.id)+'\',this.checked)"><span>'+e(v.n)+'</span></label>').join('')+'</div></details>'}
function cmFormHtml(){const E=cmEdit,e=escapeText,t=(cmCur&&cmCur.today)||kstToday(),R=cmRangeOf(E.date,cmCur&&cmCur.prev),ed=!!E.id;
 return cmCard(ed?e(coMon(E.id))+' 회의 일정 고치기':'협의체 회의 열기','','<div class="row" style="gap:8px;margin-top:10px"><div style="flex:2"><label class="muted" for="cmDate">날짜</label><input id="cmDate" class="shinp" type="date" min="'+e(t)+'" value="'+e(E.date)+'" onchange="cmEdit.date=this.value;cmRedraw()"></div>'
  +'<div style="flex:1"><label class="muted" for="cmHour">시</label><select id="cmHour" class="shinp" onchange="cmEdit.hour=this.value">'+CM_HOURS.map(h=>'<option value="'+h+'"'+(String(h)===String(E.hour)?' selected':'')+'>'+h+'시</option>').join('')+'</select></div></div>'
  +(R?'<div class="muted" style="margin-top:8px;padding:8px 10px;background:var(--bg);border-radius:10px"><b style="color:var(--text)">안건 수집 기간 (자동)</b><br>'+e(cmDot(R.from)+' ~ '+cmDot(R.to))+' · '+(R.first?'회의일 앞 30일 (지난 회의 없음)':'지난 회의('+e(cmDot(cmCur.prev))+') 다음 날 ~ 이번 회의 전날')+'</div>':'')
  +cmToHtml()
  +'<button class="button" type="button" style="width:100%;margin-top:12px" onclick="cmSave()">'+(ed?'저장 (날짜 · 시 · 받는 곳이 바뀌면 메일 다시)':'회의 열기 · 개최 공문 메일 발송')+'</button><button class="button ghost" type="button" style="width:100%;margin-top:6px" onclick="cmEdit=null;cmRedraw()">취소</button>'
  +'<p class="muted" style="margin:8px 0 0">회의 방식(대면 · 화상)은 따로 알려 주세요. 회의 날짜의 달이 그 달 협의체가 됩니다.</p>')}
async function cmSave(){const E=cmEdit,miss=[];if(!E.date)miss.push('cmDate');if(!(E.to||[]).length)miss.push('cmTo');if(miss.length){inspFlag(miss,miss.map(x=>({cmDate:'날짜',cmTo:'받는 곳'}[x])).join(' · '));return}
 if(!E.id&&cmCur&&cmCur.id&&E.date.slice(0,7)!==cmCur.id&&!await askOk('다른 달',coMon(E.date.slice(0,7))+' 협의체 회의로 엽니다.','열기'))return;
 const was=cmCur&&cmCur.id;try{const r=await call('cmSave',{id:E.id||'',date:E.date,hour:E.hour,to:E.to});cmCur=r;cmEdit=null;cmRedraw();coL=null;if(typeof dsD!=='undefined')dsD=null;cmListRefresh(r.id!==was?r.id:'');msg(r.mailed?'열었습니다 · 개최 공문 메일 '+r.mailed+'곳':'저장했습니다')}catch(e){}}
async function cmMailAgain(){const n=(cmCur.mailTo||[]).length;if(!await askOk('개최 공문 메일',(n?'고른 업체 '+n+'곳':'입고도우미 업체 계약담당자 전체')+'에게 개최 공문 메일을 다시 보낼까요?\n받는 곳을 바꾸려면 [일정 고치기]에서 고르세요.','보내기'))return;try{const r=await call('cmMail',cmCur.id);cmCur=r;cmRedraw();msg('보냈습니다 · '+r.mailed+'곳')}catch(e){}}
async function cmDel(){if(!await askOk('회의 취소',coMon(cmCur.id)+' 협의체 회의를 취소할까요?\n출석 기록도 지워집니다.'+(cmCur.mailAt?'\n업체에 취소 메일이 갑니다.':''),'취소하기'))return;try{cmCur=await call('cmDel',cmCur.id);cmRedraw();coL=null;if(typeof dsD!=='undefined')dsD=null;cmListRefresh('');msg('취소했습니다.')}catch(e){}}
async function cmAdd(){const n=($('cmAddN').value||'').trim();if(!n){inspFlag(['cmAddN'],'출석자 이름');return}try{cmCur=await call('cmAdd',cmCur.id,n,$('cmAddC').value);cmRedraw();msg('출석으로 등록했습니다.')}catch(e){}}
async function cmDrop(i){const x=(cmCur.attendees||[])[i];if(!x||!await askOk('출석 빼기',x.n+' ('+(x.co||'')+') 님을 출석에서 뺄까요?','빼기'))return;try{cmCur=await call('cmDrop',cmCur.id,i);cmRedraw()}catch(e){}}
async function cmHqIn(){try{cmCur=await call('cmHqIn',cmCur.id,cmCur.myName||'');cmRedraw();msg('도급인으로 출석했습니다.')}catch(e){}}
async function cmDone(){const m=cmCur,T=cmVTable(m),nIn=T.V.filter(v=>v.in).length;
 if(!await askOk('회의 종료',coMon(m.id)+' 협의체 회의\n업체 출석 '+nIn+' / '+T.V.length+'\n\n종료하면 출석이 확정되고 고칠 수 없습니다.\n안건('+cmDot((m.range||{}).from)+' ~ '+cmDot((m.range||{}).to)+')을 모아 결과 PDF를 만듭니다.','종료'))return;
 try{cmCur=await call('cmDone',m.id);cmRedraw();coL=null;if(typeof dsD!=='undefined')dsD=null;cmListRefresh(m.id);msg(cmCur.resultErr?'종료했습니다 · 결과는 [결과 다시 만들기]를 눌러 주세요':'종료했습니다 · 결과 PDF를 내려받을 수 있습니다')}catch(e){}}
async function cmResultAgain(){try{cmCur=await call('cmResult',cmCur.id);cmRedraw();coL=null;msg('결과를 만들었습니다.')}catch(e){}}
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
   :'<button type="button" class="linkbtn" onclick="cmVEdit=\''+e(x.id)+'\';cmVDraw()">이름 고치기</button>')};
 return '<div class="card" id="cmVCard"><div class="vh-top" style="align-items:center"><h2 style="margin:0">협의체 회의</h2>'+(up.length?'<span class="shpill'+(up.some(x=>!x.me)?' no':' ok')+'">'+(up.some(x=>!x.me)?'출석 전':'출석')+'</span>':'')+'</div>'
  +up.map(one).join('')
  +done.slice(0,6).map(x=>'<div class="shli" style="cursor:default">'+shIc(x.in?'check':'alert',!x.in)+'<span class="t"><b>'+e(coMon(x.id))+'</b><span class="muted">'+(x.in?'출석 · '+e(x.names.join(', ')):'불참')+'</span></span>'+(x.pdf?'<button type="button" class="linkbtn" onclick="cmPdfGet(\''+e(x.id)+'\',\'V\')">결과 ↓</button>':'')+'</div>').join('')
  +(up.length?'<p class="muted" style="margin:6px 0 0">회의 방식(대면 · 화상)은 도급인 담당자가 따로 알려 드립니다.</p>':'')+'</div>'}
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
