/* S8-1 협의체 회의 · 참석 QR — 본사 ☰ 협의체 → 달 열기 → 「협의체 회의」 카드 · 업체 대시보드 카드 · 참석 QR(?review=CMT-…)
 *  달마다 1번 (협의체 달 = 결과 파일 1개 = 회의 1개) · 회의 만들기 → 안내 메일(업체 계약담당자 전체) → 회의 시작(QR) → 회의 종료 · 참석 확정
 *  업체에서 1명 이상 = 참석 · 반기 평가 D(20점)에 들어감 · 참석은 로그인 없이 업체 · 이름
 *  서버: Relay cmGet · cmSave · cmMail · cmDel · cmStart · cmAdd · cmDrop · cmDone · cmVList · (로그인 없음) cmQr · cmIn */
let cmCur=null,cmEdit=null,cmPoll=0,cmV=null,cmBusy=false;
const CM_MODES=['대면','온라인','대면 + 온라인'];
const cmCard=(t,pill,body)=>'<div class="card"><div class="vh-top" style="align-items:center"><h2 style="margin:0">'+t+'</h2>'+(pill||'')+'</div>'+body+'</div>';
const cmWhen=m=>m&&m.date?jtD(m.date)+(m.time?' '+m.time:''):'';
/* ---------- 본사: 협의체 달 화면 안의 「협의체 회의」 카드 ---------- */
function cmCardHtml(P){jtCss();if(!cmCur||cmCur.id!==P){cmEdit=null;cmLoad(P);return '<div id="cmBox">'+cmCard('협의체 회의','','<p class="muted" style="margin:8px 0 0">불러오는 중…</p>')+'</div>'}return '<div id="cmBox">'+cmInner()+'</div>'}
async function cmLoad(P,quiet){if(cmBusy)return;cmBusy=true;try{cmCur=await callQuiet('cmGet',P)}catch(e){if(!quiet)cmCur={id:P,err:(e&&e.message)||'불러오지 못했습니다.'}}finally{cmBusy=false}cmRedraw()}
function cmRedraw(){const b=$('cmBox');if(b&&cmCur)b.innerHTML=cmInner();cmPollSet()}
function cmPollSet(){clearInterval(cmPoll);if(!cmCur||cmCur.status!=='OPEN')return;const P=cmCur.id;cmPoll=setInterval(()=>{if(!$('cmBox')||!cmCur||cmCur.id!==P||cmCur.status!=='OPEN'){clearInterval(cmPoll);return}cmLoad(P,true)},15000)}
function cmInner(){const m=cmCur,e=escapeText;
 if(m.err)return cmCard('협의체 회의','','<p class="muted">'+e(m.err)+'</p><button class="button ghost" type="button" onclick="cmCur=null;cmLoad(\''+e(m.id)+'\')">다시 시도</button>');
 if(cmEdit)return cmFormHtml();
 if(m.none)return cmCard('협의체 회의','<span class="shpill">없음</span>',m.canEdit?'<button class="button" type="button" style="width:100%;margin-top:10px" onclick="cmNew()">회의 만들기</button>':'<p class="muted" style="margin:8px 0 0">아직 회의가 없습니다.</p>');
 const head='<div class="shli" style="cursor:default">'+shIc('cal')+'<span class="t"><b>'+e(cmWhen(m))+'</b><span class="muted">'+e(m.place+' · '+m.mode)+'</span></span></div>';
 if(m.status==='PLAN')return cmCard('협의체 회의','<span class="shpill">예정</span>',head+'<div class="muted">안내 메일 '+(m.mailAt?e(fmtTime(m.mailAt))+' · '+(m.mailCount||0)+'곳':'안 보냄')+'</div>'
  +(m.canEdit?'<div class="row" style="margin-top:10px"><button class="button ghost" type="button" style="flex:1" onclick="cmEditOpen()">고치기</button><button class="button ghost" type="button" style="flex:1" onclick="cmMailAgain()">메일 다시</button><button class="button ghost" type="button" style="flex:1" onclick="cmDel()">지우기</button></div>'
   +'<button class="button" type="button" style="width:100%;margin-top:8px" onclick="cmStart()">회의 시작</button>':''));
 const V=m.status==='DONE'?(m.vendors||[]).map(v=>({id:v.companyId,n:v.company,names:v.names||[],in:v.in})):(m.vendorList||[]).map(v=>{const L=(m.attendees||[]).filter(x=>x.side==='VENDOR'&&String(x.companyId)===v.id).map(x=>x.n);return {id:v.id,n:v.n,names:L,in:L.length>0}});
 const nIn=V.filter(v=>v.in).length;
 const tbl='<table class="rtable chkt" style="margin-top:10px"><tr><th>업체</th><th>참석자</th><th></th></tr>'+V.map(v=>'<tr><td><b>'+e(v.n)+'</b></td><td>'+(v.names.length?e(v.names.join(' · ')):'—')+'</td><td><span class="shpill '+(v.in?'ok':'no')+'">'+(v.in?'참석':'불참')+'</span></td></tr>').join('')+'</table>';
 const hq=(m.attendees||[]).filter(x=>x.side==='HQ');
 if(m.status==='DONE')return cmCard('협의체 회의','<span class="shpill ok">업체 '+nIn+' / '+V.length+'</span>',head+tbl+(hq.length?'<div class="muted" style="margin-top:8px">도급인 · '+e(hq.map(x=>x.n).join(' · '))+'</div>':'')+'<div class="muted" style="margin-top:4px">종료 '+e(fmtTime(m.doneAt))+' · 반기 평가 협의체 참석에 들어갑니다.</div>');
 if(!m.canEdit)return cmCard('협의체 회의','<span class="shpill no">진행 중</span>',head+tbl);
 const u=jtLink('CMT',m.token),A=m.attendees||[];
 return cmCard('협의체 회의','<span class="shpill no">진행 중</span>',head
  +'<div style="text-align:center;margin-top:8px"><img class="jtqr" alt="참석 QR" src="https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data='+encodeURIComponent(u)+'"><div class="muted">화면에 띄우거나 링크를 채팅에 올림</div><button type="button" class="linkbtn" onclick="copyLink(\''+e(u)+'\')">링크 복사</button></div>'
  +tbl+'<div class="vh-top" style="align-items:center;margin-top:12px"><b>참석 '+A.length+'</b><button type="button" class="linkbtn" onclick="cmLoad(\''+e(m.id)+'\')">새로 고침</button></div>'
  +A.map((x,i)=>'<div class="jtwho"><span class="jtav">'+e((x.n||'?').slice(0,1))+'</span><span class="t"><b>'+e(x.n)+'</b> <span class="muted">'+e(x.co||'')+' · '+({AUTO:'진행',QR:'QR',HQ:'이름 추가'}[x.how]||'')+'</span></span>'+(x.how==='AUTO'?'':'<button type="button" class="linkbtn" onclick="cmDrop('+i+')">빼기</button>')+'</div>').join('')
  +'<div class="row" style="gap:6px;margin-top:10px"><input id="cmAddN" class="shinp" style="flex:2;margin:0" placeholder="QR 못 찍은 사람 이름" aria-label="이름"><select id="cmAddC" class="shinp" style="flex:2;margin:0" aria-label="소속"><option value="">아성다이소 (도급인)</option>'+(m.vendorList||[]).map(v=>'<option value="'+e(v.id)+'">'+e(v.n)+'</option>').join('')+'</select><button class="button" type="button" onclick="cmAdd()">추가</button></div>'
  +'<button class="button" type="button" style="width:100%;margin-top:12px" onclick="cmDone()">회의 종료 · 참석 확정</button>')}
function cmNew(){cmEdit={date:'',time:'14:00',place:'',mode:'대면'};cmRedraw()}
function cmEditOpen(){const m=cmCur;cmEdit={date:m.date,time:m.time||'',place:m.place,mode:m.mode};cmRedraw()}
function cmFormHtml(){const E=cmEdit,e=escapeText,t=(cmCur&&cmCur.today)||kstToday();
 return cmCard(e(coMon(cmCur.id))+' 회의','','<label class="muted" for="cmDate" style="display:block;margin-top:10px">날짜 · 시간</label><div class="row" style="gap:8px"><input id="cmDate" class="shinp" type="date" min="'+e(t)+'" value="'+e(E.date)+'" onchange="cmEdit.date=this.value" style="flex:2"><input id="cmTime" class="shinp" type="time" value="'+e(E.time)+'" onchange="cmEdit.time=this.value" style="flex:1" aria-label="시간"></div>'
  +'<label class="muted" for="cmPlace" style="display:block;margin-top:10px">장소</label><input id="cmPlace" class="shinp" placeholder="본사 7층 대회의실 · Teams" value="'+e(E.place)+'" oninput="cmEdit.place=this.value">'
  +'<div class="seg" role="tablist" style="margin-top:10px">'+CM_MODES.map(k=>'<button type="button" role="tab" aria-selected="'+(E.mode===k)+'" class="'+(E.mode===k?'on':'')+'" onclick="cmEdit.mode=\''+k+'\';cmRedraw()">'+k+'</button>').join('')+'</div>'
  +'<button class="button" type="button" style="width:100%;margin-top:12px" onclick="cmSave()">저장 · 안내 메일 발송</button><button class="button ghost" type="button" style="width:100%;margin-top:6px" onclick="cmEdit=null;cmRedraw()">취소</button>'
  +'<p class="muted" style="margin:8px 0 0">안내 메일 = 입고도우미 업체 계약담당자 전체</p>')}
async function cmSave(){const E=cmEdit,miss=[];if(!E.date)miss.push('cmDate');if(!String(E.place||'').trim())miss.push('cmPlace');if(miss.length){inspFlag(miss,miss.length>1?'날짜 · 장소':miss[0]==='cmDate'?'날짜':'장소');return}
 try{const r=await call('cmSave',{id:cmCur.id,date:E.date,time:E.time,place:E.place.trim(),mode:E.mode});cmCur=r;cmEdit=null;cmRedraw();coL=null;msg(r.mailed?'저장했습니다 · 안내 메일 '+r.mailed+'곳':'저장했습니다')}catch(e){}}
async function cmMailAgain(){if(!await askOk('안내 메일','입고도우미 업체 계약담당자 전체에게 회의 안내 메일을 다시 보낼까요?','보내기'))return;try{const r=await call('cmMail',cmCur.id);cmCur=r;cmRedraw();msg('보냈습니다 · '+r.mailed+'곳')}catch(e){}}
async function cmDel(){if(!await askOk('회의 지우기',coMon(cmCur.id)+' 협의체 회의를 지울까요?'+(cmCur.mailAt?'\n업체에 취소 메일이 갑니다.':''),'지우기'))return;try{cmCur=await call('cmDel',cmCur.id);cmRedraw();coL=null;msg('지웠습니다.')}catch(e){}}
async function cmStart(){const m=cmCur;if(!await askOk('회의 시작',coMon(m.id)+' 협의체 회의'+(m.date!==m.today?'\n회의일('+jtD(m.date)+')이 오늘이 아닙니다.':'')+'\n\n시작하면 참석 QR이 열립니다.','시작'))return;try{cmCur=await call('cmStart',m.id);cmRedraw()}catch(e){}}
async function cmAdd(){const n=($('cmAddN').value||'').trim();if(!n){inspFlag(['cmAddN'],'이름');return}try{cmCur=await call('cmAdd',cmCur.id,n,$('cmAddC').value);cmRedraw()}catch(e){}}
async function cmDrop(i){const x=(cmCur.attendees||[])[i];if(!x||!await askOk('참석자 빼기',x.n+' 님을 참석자에서 뺄까요?','빼기'))return;try{cmCur=await call('cmDrop',cmCur.id,i);cmRedraw()}catch(e){}}
async function cmDone(){const m=cmCur,V=m.vendorList||[],nIn=V.filter(v=>(m.attendees||[]).some(x=>x.side==='VENDOR'&&String(x.companyId)===v.id)).length;
 if(!await askOk('회의 종료',coMon(m.id)+' 협의체 회의\n업체 참석 '+nIn+' / '+V.length+'\n\n종료하면 참석이 확정되고 고칠 수 없습니다.','종료'))return;try{cmCur=await call('cmDone',m.id);cmRedraw();coL=null;msg('종료했습니다 · 업체 '+cmCur.nIn+' / '+cmCur.nV)}catch(e){}}
/** 협의체 목록 한 줄에 붙는 회의 요약 */
function cmRowTxt(id){const x=coL&&coL.meets&&coL.meets[id];if(!x)return ' · 회의 없음';return ' · 회의 '+jtD(x.date)+(x.status==='DONE'?' · 업체 '+x.nIn+'/'+x.nV:x.status==='OPEN'?' · 진행 중':'')}

/* ---------- 업체 대시보드 카드 ---------- */
async function cmVLoad(){try{cmV=await callQuiet('cmVList')}catch(e){return}const b=$('cmVBox');if(b)b.innerHTML=cmVCardHtml()}
function cmVCardHtml(){if(!cmV||!cmV.list.length)return '';jtCss();const e=escapeText,up=cmV.list.filter(x=>x.status!=='DONE'),done=cmV.list.filter(x=>x.status==='DONE');
 return '<div class="card"><div class="vh-top" style="align-items:center"><h2 style="margin:0">협의체 회의</h2>'+(up.length?'<span class="shpill'+(up[0].status==='OPEN'?' no':'')+'">'+(up[0].status==='OPEN'?'진행 중':'예정')+'</span>':'')+'</div>'
  +up.map(x=>'<div class="shli" style="cursor:default">'+shIc('cal')+'<span class="t"><b>'+e(cmWhen(x))+'</b><span class="muted">'+e(x.place+' · '+x.mode)+(x.names.length?' · 참석 '+e(x.names.join(', ')):'')+'</span></span></div>').join('')
  +done.slice(0,6).map(x=>'<div class="shli" style="cursor:default">'+shIc(x.in?'check':'alert',!x.in)+'<span class="t"><b>'+e(coMon(x.id))+'</b><span class="muted">'+(x.in?'참석 · '+e(x.names.join(', ')):'불참')+'</span></span></div>').join('')
  +(up.length?'<p class="muted" style="margin:6px 0 0">회의 때 보여 주는 QR(또는 링크)로 업체 · 이름을 적으면 참석으로 기록됩니다.</p>':'')+'</div>'}

/* ---------- 참석 QR (?review=CMT-토큰 · 로그인 없음 · joint.js jtLinkBoot에서 부름) ---------- */
async function cmQrView(tok,edit){const el=$('my'),e=escapeText;let r;try{r=await FB.sm('cmQr',{token:tok})}catch(x){el.innerHTML=jtCard('협의체 참석','<p class="muted">'+e((x&&x.message)||'')+'</p><button class="button" type="button" onclick="cmQrView(\''+e(tok)+'\')">다시 시도</button>');return}cmQrDraw(tok,r,edit)}
function cmQrDraw(tok,r,edit){const el=$('my'),e=escapeText,T=e(tok);
 let h='<div class="card"><div class="shli" style="cursor:default">'+shIc('doc')+'<span class="t"><b>'+e(r.title)+'</b><span class="muted">'+e(r.when+' · '+r.place)+'</span></span></div></div>';
 if(r.status==='DONE')h+=jtCard('끝난 회의입니다','<p class="muted" style="margin:0">'+(r.me?'참석 기록: '+e(r.me.co+' · '+r.me.n):'참석 기록이 필요하면 도급인 담당자에게 말씀해 주세요.')+'</p>');
 else if(r.me&&!edit)h+='<div class="card"><div class="shli" style="cursor:default">'+shIc('check')+'<span class="t"><b>참석했습니다</b><span class="muted">'+e(r.me.co+' · '+r.me.n)+'</span></span><span class="shpill ok">참석</span></div><button type="button" class="linkbtn" onclick="cmQrView(\''+T+'\',true)">고치기</button></div>';
 else if(r.status==='PLAN')h+=jtCard('아직 시작 전입니다','<p class="muted">회의가 시작되면 참석할 수 있습니다.</p><button class="button" type="button" style="width:100%" onclick="cmQrView(\''+T+'\')">다시 확인</button>');
 else h+=jtCard('참석','<select id="cmCo" class="shinp" aria-label="업체"><option value="">업체 고르기</option>'+(r.vendors||[]).map(v=>'<option value="'+e(v.id)+'"'+(r.me&&r.me.companyId===v.id?' selected':'')+'>'+e(v.n)+'</option>').join('')+'</select>'
  +'<input id="cmName" class="shinp" placeholder="이름" value="'+e(r.me?r.me.n:'')+'" autocomplete="name" aria-label="이름"><button class="button" type="button" style="width:100%;margin-top:10px" onclick="cmQrIn(\''+T+'\')">참석</button>');
 el.innerHTML=h}
async function cmQrIn(tok){const c=$('cmCo').value,n=($('cmName').value||'').trim(),miss=[];if(!c)miss.push('cmCo');if(!n)miss.push('cmName');if(miss.length){inspFlag(miss,miss.length>1?'업체 · 이름':c?'이름':'업체');return}
 loadStart('cmIn');try{const r=await FB.sm('cmIn',{token:tok,companyId:c,name:n});msg('참석했습니다.');cmQrDraw(tok,r)}catch(e){msg((e&&e.message)||'처리하지 못했습니다.')}finally{loadEnd()}}
