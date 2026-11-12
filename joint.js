/* S7 분기 합동점검 — 도급인 주최 · CS팀 담당자 + 입고도우미 업체 참여자 (점장은 참석 안 함)
 *  본사 ☰ 합동점검: 분기 목록 · 매장 배정(날짜 · CS팀 · 업체 → 안내 메일) · 안내문 A4 · CS팀 담당자 초대 링크
 *  CS팀 담당자 (휴대폰 · 구글 로그인 · 메뉴는 합동점검만): 내 합동점검 → 참석(QR) → 점검표 → 완료
 *  업체 대시보드: 일정 · 참여자 이름 / 참석 QR(?review=JNT-…) = 로그인 없이 이름만 / 초대 링크(?review=CSI-…) = 구글 로그인 + 이름
 *  서버: Relay jtBoard · jtSave · jtDel · jtMail · jtGet · jtStart · jtAdd · jtDrop · jtDone · jtPic · jtVList · jtVPerson · csInvite · csCancel · csStop · (로그인 없음) jtQr · jtIn · csJoin */
let jtB=null,jtQ='',jtSel='',jtCur=null,jtStep=0,jtEdit=null,jtV=null,jtLinkOn=false,jtPoll=0;
const jtRes={},jtPicMem={};
const jtWD=['일','월','화','수','목','금','토'];
const jtD=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'')?d.slice(5).replace('-','.')+' ('+jtWD[new Date(d+'T00:00:00Z').getUTCDay()]+')':'';
const jtWhen=x=>jtD(x.date)+(x.time?' '+x.time:'');
const jtQName=Q=>Q?Q.slice(0,4)+'년 '+Q.slice(6)+'분기':'';
const jtQOf=d=>d.slice(0,4)+'-Q'+(Math.floor((Number(d.slice(5,7))-1)/3)+1);
const jtQAdd=(Q,n)=>{let y=Number(Q.slice(0,4)),q=Number(Q.slice(6))+n;while(q>4){q-=4;y++}while(q<1){q+=4;y--}return y+'-Q'+q};
const jtLink=(pre,t)=>location.origin+location.pathname+'?review='+pre+'-'+t;
/** 상태 [글, 색] */
function jtSt(x,today){if(x.status==='DONE')return ['완료','ok'];if(x.status==='OPEN')return ['진행 중','no'];if(x.date<today)return ['지남','no'];if(x.date===today)return ['오늘','no'];return ['예정','']}
function jtCss(){if(typeof shCss==='function')shCss();if(typeof chkCss==='function')chkCss();if($('jtCss'))return;const s=document.createElement('style');s.id='jtCss';s.textContent=
 '.jtreq{width:100%;margin-top:8px;border:1px solid var(--accent)!important;color:var(--accent)!important;background:#fff!important}.jtreq.on{background:var(--accent)!important;color:#fff!important}'
 +'.jtqr{display:block;width:220px;height:220px;margin:6px auto;border:1px solid var(--line);border-radius:12px;background:#fff}.jtav{width:28px;height:28px;border-radius:50%;background:var(--bg);display:inline-flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex-shrink:0}'
 +'.jtwho{display:flex;align-items:center;gap:8px;padding:9px 0;border-top:1px solid var(--line)}.jtwho:first-of-type{border-top:0}.jtwho .t{flex:1;min-width:0}'
 +'.jtdoc{background:#fff;color:#111;font:13px/1.6 "Malgun Gothic",sans-serif;padding:18px}.jtdoc h1{font-size:20px;text-align:center;margin:0 0 14px}.jtdoc table{width:100%;border-collapse:collapse}.jtdoc th,.jtdoc td{border:1px solid #333;padding:7px 9px;text-align:left;vertical-align:top}.jtdoc th{background:#f3f4f6;width:22%;white-space:nowrap}.jtdoc .law{margin:12px 0;padding:10px;border:1px solid #333}';document.head.appendChild(s)}
function jtReset(){jtSel='';jtCur=null;jtEdit=null;jtStep=0;clearInterval(jtPoll)}
function jtRedraw(){const y=window.scrollY;renderJobs();window.scrollTo(0,y)}
const jtCard=(t,body)=>'<div class="card"><h2>'+t+'</h2>'+body+'</div>';

/* ---------- 본사 · CS팀 ☰ 합동점검 ---------- */
async function jtLoad(q){try{jtB=await call('jtBoard',q===undefined?jtQ:q);if(jtB.quarter)jtQ=jtB.quarter}catch(e){jtB={err:(e&&e.message)||'불러오지 못했습니다.'}}if(tab==='jobs'&&smenu==='joint')renderJobs()}
function sJt(){jtCss();if(!jtB){jtLoad();return jtCard('합동점검','<p class="muted">불러오는 중입니다…</p>')}
 if(jtB.err){const m=jtB.err;jtB=null;return jtCard('합동점검','<p class="muted">'+escapeText(m)+'</p><button class="button" type="button" onclick="renderJobs()">다시 시도</button>')}
 if(jtSel){jobsMode='form';return jtVisitHtml()}
 if(jtEdit){jobsMode='form';return jtFormHtml()}
 return jtB.cs?jtMineHtml(jtB.mine,true):jtBoardHtml()}
function jtQGo(Q){jtQ=Q;jtB=null;renderJobs()}
function jtBoardHtml(){const B=jtB,t=B.today,L=B.list,e=escapeText,cur=jtQOf(t);
 const n={done:L.filter(x=>x.status==='DONE').length,late:L.filter(x=>x.status!=='DONE'&&x.date<t).length};n.plan=L.length-n.done-n.late;
 let h='<div class="card"><div class="vh-top" style="align-items:center"><h2 style="margin:0">'+e(jtQName(B.quarter))+' 합동점검</h2><span class="shpill">'+e(B.range.from.slice(5).replace('-','.')+' ~ '+B.range.to.slice(5).replace('-','.'))+'</span></div>'
  +'<div class="seg" role="tablist">'+[jtQAdd(cur,-1),cur,jtQAdd(cur,1)].map(Q=>'<button type="button" role="tab" aria-selected="'+(Q===B.quarter)+'" class="'+(Q===B.quarter?'on':'')+'" onclick="jtQGo(\''+Q+'\')">'+e(jtQName(Q))+'</button>').join('')+'</div>'
  +'<div class="chknum"><div><b>'+L.length+'</b><span>대상 매장</span></div><div><b>'+n.done+'</b><span>완료</span></div><div><b>'+n.plan+'</b><span>예정</span></div><div class="'+(n.late?'r':'')+'"><b>'+n.late+'</b><span>지남</span></div></div>'
  +(L.length?'<table class="rtable chkt" style="margin-top:10px"><tr><th>매장</th><th>날짜</th><th>CS팀</th><th>업체</th><th></th></tr>'+L.map(x=>{const [s,c]=jtSt(x,t);return '<tr class="go" onclick="jtOpen(\''+e(x.id)+'\')"><td><b>'+e(x.storeName)+'</b></td><td>'+e(jtD(x.date))+'</td><td>'+e(x.csName)+'</td><td>'+e(x.company)+(x.status==='PLAN'&&!x.person?'<div class="muted">참여자 미정</div>':'')+'</td><td><span class="shpill '+c+'">'+s+'</span></td></tr>'}).join('')+'</table>':'<p class="muted" style="margin:10px 0 0">배정한 매장이 없습니다.</p>')
  +(B.canEdit?'<button class="button ghost" type="button" style="width:100%;margin-top:10px" onclick="jtNew()">＋ 매장 추가</button>':'')+'</div>';
 if(B.mine.length)h+=jtMineHtml(B.mine,false);
 h+=jtCsHtml();return h}
/** 내 합동점검 (CS팀 담당자 · 배정된 본사 직원) */
function jtMineHtml(M,full){const t=(jtB&&jtB.today)||kstToday(),e=escapeText,up=M.filter(x=>x.status!=='DONE'),done=M.filter(x=>x.status==='DONE').reverse();
 const row=x=>{const [s,c]=jtSt(x,t);return '<button class="shli" type="button" onclick="jtOpen(\''+e(x.id)+'\')">'+shIc(x.status==='DONE'?'check':'store',c==='no')+'<span class="t"><b>'+e(x.storeName)+'</b><span class="muted">'+e(jtWhen(x)+' · '+x.company)+'</span></span><span class="shpill '+c+'">'+s+'</span></button>'};
 return (full?'<div class="card"><h2 style="margin:0">'+e(((jtB&&jtB.name)||'')+' 님')+'</h2><div class="muted">CS팀 · 합동점검</div></div>':'')
  +'<div class="card"><h2 style="margin:0 0 4px">내 합동점검</h2>'+(up.length?up.map(row).join(''):'<p class="muted" style="margin:8px 0 0">예정된 합동점검이 없습니다.</p>')
  +(full&&done.length?'<details class="hist"><summary>완료 '+done.length+'</summary>'+done.slice(0,40).map(row).join('')+'</details>':'')+'</div>'}
/** CS팀 담당자 명단 · 초대 링크 */
function jtCsHtml(){const B=jtB,e=escapeText,ed=B.canEdit;
 return '<div class="card"><div class="vh-top" style="align-items:center"><h2 style="margin:0">CS팀 담당자</h2>'+(ed?'<button class="button" type="button" onclick="jtInvite()">＋ 초대 링크</button>':'')+'</div>'
  +B.csList.map(c=>'<div class="jtwho"><span class="jtav">'+e((c.name||'?').slice(0,1))+'</span><span class="t"><b>'+e(c.name)+'</b> <span class="muted">'+e(c.email)+'</span></span>'
   +(ed?'<button type="button" class="shpill '+(c.status==='STOP'?'':'ok')+'" style="border:0;cursor:pointer" onclick="jtCsStop(\''+e(c.email)+'\','+(c.status==='STOP')+')">'+(c.status==='STOP'?'중지':'사용')+'</button>':'<span class="shpill '+(c.status==='STOP'?'':'ok')+'">'+(c.status==='STOP'?'중지':'사용')+'</span>')+'</div>').join('')
  +(B.invites||[]).map(v=>'<div class="jtwho"><span class="jtav">'+e((v.name||'?').slice(0,1))+'</span><span class="t"><b>'+e(v.name)+'</b> <span class="muted">로그인 전 · '+e(String(v.expAt).slice(5,10).replace('-','.'))+'까지</span></span><button type="button" class="linkbtn" onclick="copyLink(\''+e(jtLink('CSI',v.token))+'\')">링크 복사</button><button type="button" class="linkbtn" onclick="jtInvCancel(\''+e(v.token)+'\')">취소</button><span class="shpill">대기</span></div>').join('')
  +(!B.csList.length&&!(B.invites||[]).length?'<p class="muted" style="margin:8px 0 0">아직 없습니다.</p>':'')
  +'<p class="muted" style="margin:8px 0 0">초대 링크 = 1명 1번 · 7일 · 받은 사람이 본인 Google 계정으로 로그인하면 등록됩니다.</p></div>'}
async function jtInvite(){const n=prompt('CS팀 담당자 이름');if(n===null)return;if(!n.trim()){msg('이름을 적어 주세요.');return}
 try{const r=await call('csInvite',n.trim());jtB={...jtB,csList:r.csList,invites:r.invites};renderJobs();const u=jtLink('CSI',r.token);
  popup('초대 링크',n.trim()+' 님에게 아래 링크를 보내 주세요. (1번 · 7일)\n\n'+u,'링크 복사',()=>copyLink(u))}catch(e){}}
async function jtInvCancel(t){if(!await askOk('초대 취소','이 초대 링크를 쓸 수 없게 할까요?','취소하기'))return;try{const r=await call('csCancel',t);jtB={...jtB,csList:r.csList,invites:r.invites};renderJobs()}catch(e){}}
async function jtCsStop(email,on){if(!await askOk(on?'다시 사용':'사용 중지',email+(on?'\n다시 로그인할 수 있게 할까요?':'\n로그인과 배정을 막을까요?'),on?'사용':'중지'))return;try{const r=await call('csStop',email,on);jtB={...jtB,csList:r.csList,invites:r.invites};renderJobs()}catch(e){}}

/* ---------- 매장 배정 (안전보건팀) ---------- */
function jtNew(){jtEdit={id:'',store:'',storeName:'',date:'',time:'14:00',csEmail:'',companyId:'',q:''};renderJobs();window.scrollTo(0,0)}
function jtEditOpen(){const x=jtCur;if(!x)return;jtEdit={id:x.id,store:x.store,storeName:x.storeName,date:x.date,time:x.time||'',csEmail:x.csEmail,companyId:x.companyId,q:''};jtSel='';jtCur=null;renderJobs();window.scrollTo(0,0)}
function jtFormHtml(){const E=jtEdit,B=jtB,e=escapeText,cs=B.csList.filter(c=>c.status!=='STOP'),t=B.today;
 return '<div class="card"><button class="button ghost" type="button" onclick="jtEdit=null;renderJobs()">← 합동점검</button><h2 style="margin:12px 0 0">'+(E.id?'배정 고치기':'매장 배정')+'</h2>'
  +(E.id?'<div class="shli" style="cursor:default">'+shIc('store')+'<span class="t"><b>'+e(E.storeName)+'</b><span class="muted">'+e(E.store)+'</span></span></div>'
   :'<div id="jtStoreBox">'+jtStorePick()+'</div>')
  +'<label class="muted" for="jtDate" style="display:block;margin-top:10px">날짜 · 시간</label><div class="row" style="gap:8px"><input id="jtDate" class="shinp" type="date" min="'+e(t)+'" value="'+e(E.date)+'" onchange="jtEdit.date=this.value" style="flex:2"><input id="jtTime" class="shinp" type="time" value="'+e(E.time)+'" onchange="jtEdit.time=this.value" style="flex:1" aria-label="시간"></div>'
  +'<label class="muted" for="jtCs" style="display:block;margin-top:10px">CS팀 담당자</label><select id="jtCs" class="shinp" onchange="jtEdit.csEmail=this.value"><option value="">고르기</option>'+cs.map(c=>'<option value="'+e(c.email)+'"'+(c.email===E.csEmail?' selected':'')+'>'+e(c.name)+'</option>').join('')+'</select>'
  +(cs.length?'':'<p class="muted" style="margin:4px 0 0">먼저 CS팀 담당자를 초대해 주세요.</p>')
  +'<label class="muted" for="jtCo" style="display:block;margin-top:10px">입고도우미 업체</label><select id="jtCo" class="shinp" onchange="jtEdit.companyId=this.value"><option value="">고르기</option>'+B.vendors.map(v=>'<option value="'+e(v.id)+'"'+(v.id===E.companyId?' selected':'')+'>'+e(v.n)+'</option>').join('')+'</select>'
  +'<button class="button" type="button" style="width:100%;margin-top:14px" onclick="jtSave()">저장 · 안내 메일 발송</button>'
  +'<p class="muted" style="margin:8px 0 0">안내 메일 = 업체 계약담당자 (저장 때 · 전날 09시 한 번 더)</p></div>'}
function jtStorePick(){const E=jtEdit,e=escapeText;if(E.store)return '<div class="shli" style="cursor:default">'+shIc('store')+'<span class="t"><b>'+e(E.storeName)+'</b><span class="muted">'+e(E.store)+'</span></span><button type="button" class="linkbtn" onclick="jtEdit.store=\'\';$(\'jtStoreBox\').innerHTML=jtStorePick()">바꾸기</button></div>';
 return '<div class="shsrch"><svg viewBox="0 0 24 24">'+SH_ICONS.search+'</svg><input id="jtQs" class="shinp" type="search" placeholder="매장명 · 코드" value="'+e(E.q)+'" oninput="jtEdit.q=this.value;$(\'jtSRes\').innerHTML=jtStoreRes()" aria-label="매장 찾기" autocomplete="off"></div><div id="jtSRes">'+jtStoreRes()+'</div>'}
function jtStoreRes(){const q=String(jtEdit.q||'').replace(/\s/g,'').toLowerCase();if(!q)return '<p class="muted" style="margin:6px 0 0">매장 '+jtB.stores.length+'곳 · 이름이나 코드를 적어 주세요.</p>';
 const have=new Set(jtB.list.map(x=>x.store)),L=jtB.stores.filter(s=>(s[0]+s[1]).replace(/\s/g,'').toLowerCase().includes(q)).slice(0,15);
 return L.length?L.map(s=>'<button class="shli" type="button" onclick="jtPickStore(\''+escapeText(s[0])+'\')">'+shIc('store')+'<span class="t"><b>'+escapeText(s[1])+'</b><span class="muted">'+escapeText(s[0]+' · '+s[2]+' · '+s[3])+'</span></span>'+(have.has(s[0])?'<span class="shpill">배정됨</span>':'')+'</button>').join(''):'<p class="muted" style="margin:6px 0 0">없음</p>'}
function jtPickStore(c){const s=jtB.stores.find(x=>x[0]===c);if(!s)return;jtEdit.store=s[0];jtEdit.storeName=s[1];$('jtStoreBox').innerHTML=jtStorePick()}
async function jtSave(){const E=jtEdit,miss=[];if(!E.store)miss.push(E.id?'':'jtQs');if(!E.date)miss.push('jtDate');if(!E.csEmail)miss.push('jtCs');if(!E.companyId)miss.push('jtCo');
 if(miss.filter(Boolean).length){inspFlag(miss.filter(Boolean),'빠진 곳 '+miss.length);return}
 try{const r=await call('jtSave',{id:E.id,store:E.store,date:E.date,time:E.time,csEmail:E.csEmail,companyId:E.companyId});jtB=r;jtQ=r.quarter;jtEdit=null;renderJobs();window.scrollTo(0,0);msg(r.mailed?'저장했습니다 · 안내 메일 보냄':'저장했습니다'+(E.id?'':' (업체 메일 주소가 없어 메일은 못 보냄)'))}catch(e){}}

/* ---------- 합동점검 1곳 (배정 정보 · 현장: 참석 → 점검표 → 완료 · 결과) ---------- */
async function jtOpen(id){try{jtCur=await call('jtGet',id);jtSel=id;jtStep=0;renderJobs();window.scrollTo(0,0);jtPollSet()}catch(e){}}
function jtBack(){clearInterval(jtPoll);jtSel='';jtCur=null;if(jtB&&!jtB.err)jtLoad();else renderJobs()}
const jtAll=()=>{const F=jtCur&&jtCur.form;return F?F.common.concat(F.contract,F.risks):[]};
const jtR=()=>jtRes[jtSel]||(jtRes[jtSel]={});
function jtHead(){const x=jtCur,e=escapeText,[s,c]=jtSt(x,x.today);
 return '<div class="card"><button class="button ghost" type="button" onclick="jtBack()">← 합동점검</button><div class="vh-top" style="align-items:center;margin-top:12px"><h2 style="margin:0">'+e(x.storeName)+'</h2><span class="shpill '+c+'">'+s+'</span></div>'
  +'<div class="muted">'+e(jtQName(x.quarter)+' · '+jtWhen(x))+'</div>'
  +'<div class="shli" style="cursor:default">'+shIc('cal')+'<span class="t"><b>CS팀 '+e(x.csName)+'</b><span class="muted">'+e(x.company)+' · 참여자 '+e(x.person||'미정')+'</span></span></div>'
  +(x.status==='PLAN'?'<div class="muted">안내 메일 '+(x.mailAt?e(fmtTime(x.mailAt)):'안 보냄')+(x.remindAt?' · 전날 알림 '+e(fmtTime(x.remindAt)):'')+'</div>':'')
  +'<button class="button ghost" type="button" style="width:100%;margin-top:10px" onclick="jtNotice()">안내문 보기 · 인쇄</button>'
  +(x.status==='PLAN'&&jtB&&jtB.canEdit?'<div class="row" style="margin-top:8px"><button class="button ghost" type="button" style="flex:1" onclick="jtEditOpen()">고치기</button><button class="button ghost" type="button" style="flex:1" onclick="jtMailAgain()">메일 다시</button><button class="button ghost" type="button" style="flex:1" onclick="jtDel()">지우기</button></div>':'')+'</div>'}
function jtVisitHtml(){const x=jtCur;if(!x)return '';let h=jtHead();
 if(x.status==='DONE')return h+jtResultHtml();
 if(!x.host)return h;
 if(x.status==='PLAN')return h+'<div class="card"><h2 style="margin:0">현장</h2><p class="muted" style="margin:6px 0 10px">매장에 도착하면 시작하세요. 시작하면 참석 QR이 열립니다.</p><button class="button" type="button" style="width:100%" onclick="jtStart()">점검 시작</button></div>';
 const S=['참석','점검표','완료'],miss=jtMiss();
 h+='<div class="shstep" role="tablist">'+S.map((t,k)=>'<button type="button" role="tab" aria-selected="'+(k===jtStep)+'" class="'+(k===jtStep?'on':'')+(k===1&&!miss.length?' done':'')+'" onclick="jtGo('+k+')">'+t+'</button>').join('')+'</div>';
 if(jtStep===0)h+=jtAttHtml();if(jtStep===1)h+=jtCheckHtml();if(jtStep===2)h+=jtSumHtml();
 return h}
function jtGo(k){jtStep=k;renderJobs();window.scrollTo(0,0);jtPollSet()}
/** 참석 화면: QR이 열려 있는 동안 15초마다 참석자 다시 받기 */
function jtPollSet(){clearInterval(jtPoll);if(!jtCur||jtCur.status!=='OPEN'||jtStep!==0)return;const id=jtSel;
 jtPoll=setInterval(async()=>{if(jtSel!==id||jtStep!==0||tab!=='jobs'||smenu!=='joint'){clearInterval(jtPoll);return}try{const r=await callQuiet('jtGet',id);if(jtSel===id&&r){jtCur=r;const b=$('jtAttBox');if(b)b.innerHTML=jtAttList();else clearInterval(jtPoll)}}catch(e){}},15000)}
async function jtStart(){const x=jtCur;if(!await askOk('점검 시작',x.storeName+(x.date!==x.today?'\n배정일('+jtD(x.date)+')이 오늘이 아닙니다.':'')+'\n\n시작하면 업체 참여자가 QR로 참석할 수 있습니다.','시작'))return;
 try{jtCur=await call('jtStart',jtSel);jtStep=0;renderJobs();jtPollSet()}catch(e){}}
function jtAttList(){const L=jtCur.attendees||[],e=escapeText;
 return L.length?L.map((a,i)=>'<div class="jtwho"><span class="jtav">'+e((a.n||'?').slice(0,1))+'</span><span class="t"><b>'+e(a.n)+'</b> <span class="muted">'+e(a.co||'')+' · '+({AUTO:'담당',QR:'QR',CS:'이름 추가'}[a.how]||'')+'</span></span><span class="shpill ok">참석</span>'+(a.how==='AUTO'?'':'<button type="button" class="linkbtn" onclick="jtDrop('+i+')">빼기</button>')+'</div>').join(''):'<p class="muted" style="margin:0">아직 없습니다.</p>'}
function jtAttHtml(){const x=jtCur,e=escapeText,u=jtLink('JNT',x.token);
 return '<div class="card" style="text-align:center"><img class="jtqr" alt="참석 QR" src="https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data='+encodeURIComponent(u)+'"><div class="muted">업체 참여자가 휴대폰 카메라로 찍고 이름 입력</div><button type="button" class="linkbtn" onclick="copyLink(\''+e(u)+'\')">링크 복사</button></div>'
  +'<div class="card"><div class="vh-top" style="align-items:center"><h2 style="margin:0">참석 '+(x.attendees||[]).length+'</h2><button type="button" class="linkbtn" onclick="jtRefresh()">새로 고침</button></div><div id="jtAttBox">'+jtAttList()+'</div>'
  +'<div class="row" style="gap:6px;margin-top:10px"><input id="jtAddN" class="shinp" style="flex:2;margin:0" placeholder="휴대폰이 없는 사람 이름" aria-label="이름"><select id="jtAddS" class="shinp" style="flex:1;margin:0" aria-label="소속"><option value="VENDOR">업체</option><option value="CS">CS팀</option></select><button class="button" type="button" onclick="jtAdd()">추가</button></div></div>'
  +'<div class="shfoot"><button class="button" type="button" onclick="jtGo(1)">점검표</button></div>'}
async function jtRefresh(){try{jtCur=await call('jtGet',jtSel);jtRedraw()}catch(e){}}
async function jtAdd(){const n=($('jtAddN').value||'').trim();if(!n){inspFlag(['jtAddN'],'이름');return}try{jtCur=await call('jtAdd',jtSel,n,$('jtAddS').value);jtRedraw()}catch(e){}}
async function jtDrop(i){const a=(jtCur.attendees||[])[i];if(!a||!await askOk('참석자 빼기',a.n+' 님을 참석자에서 뺄까요?','빼기'))return;try{jtCur=await call('jtDrop',jtSel,i);jtRedraw()}catch(e){}}
/* 점검표 */
function jtGrpHtml(g,i){const x=jtR()[g.id]||{},bad=x.st==='P',e=escapeText;
 return '<div class="shgrp'+(bad?' bad':'')+'" id="jg_'+i+'"><b>'+e(g.name)+'</b>'+(g.desc?'<div class="muted">'+e(g.desc)+'</div>':'')
  +'<div class="shtg"><button type="button" class="'+(x.st==='G'?'ok':'')+'" aria-pressed="'+(x.st==='G')+'" onclick="jtSet('+i+',\'G\')">양호</button><button type="button" class="'+(bad?'bad':'')+'" aria-pressed="'+bad+'" onclick="jtSet('+i+',\'P\')">불량</button></div>'
  +(bad?'<textarea class="shinp" id="jm_'+i+'" placeholder="불량 내용" oninput="jtMemo('+i+',this.value)">'+e(x.memo||'')+'</textarea>'
   +'<label class="shcam'+(x.url?' has':'')+'">'+(x.url?'<img src="'+x.url+'" alt="사진">':'<svg viewBox="0 0 24 24">'+SH_ICONS.cam+'</svg>사진 (선택)')+'<input type="file" accept="image/*" aria-label="사진" onchange="jtPh('+i+',this)"></label>'
   +'<button type="button" class="button jtreq'+(x.req?' on':'')+'" aria-pressed="'+!!x.req+'" onclick="jtReq('+i+')">'+(x.req?'✔ 업체에 조치 요청 · 시정요구서 7일':'업체에 조치 요청')+'</button>':'')+'</div>'}
function jtCheckHtml(){const F=jtCur.form,e=escapeText,A=jtAll();let i=0;const sec=(t,L)=>'<div class="muted" style="margin:12px 2px 6px;font-weight:600">'+t+'</div>'+L.map(g=>jtGrpHtml(g,i++)).join('');
 return sec('공통',F.common)+sec('도급 · 입고 작업',F.contract)+(F.risks.length?sec(e(jtCur.company)+' 계획서 위험요인',F.risks):'<div class="card" style="padding:10px 14px"><span class="muted">'+e(jtCur.company)+' 계획서 위험요인 없음</span></div>')
  +'<div class="shfoot"><button class="button ghost" type="button" onclick="jtGo(0)">참석</button><button class="button" type="button" onclick="jtGo(2)">다음 '+(A.length-jtMiss().length)+'/'+A.length+'</button></div>'}
function jtSet(i,st){const g=jtAll()[i];if(!g)return;const R=jtR(),x=R[g.id]||(R[g.id]={});x.st=st;if(st==='G'){x.req=false}jtRedraw()}
function jtMemo(i,v){const g=jtAll()[i];if(g)(jtR()[g.id]||(jtR()[g.id]={})).memo=v}
function jtReq(i){const g=jtAll()[i];if(!g)return;const x=jtR()[g.id];if(!x)return;x.req=!x.req;jtRedraw()}
async function jtPh(i,inp){const f=inp.files&&inp.files[0],g=jtAll()[i];if(!f||!g)return;try{window.__wkCo=jtCur.storeName;const r=await readFile(f,PHOTO_STAMP);const x=jtR()[g.id];x.ph=r;x.url='data:'+r.mime+';base64,'+r.data;jtRedraw()}catch(e){msg((e&&e.message)||'사진을 읽지 못했습니다.')}}
/** 빠진 곳 [요소 id, 이름] */
function jtMiss(){const R=jtR(),L=[];jtAll().forEach((g,i)=>{const x=R[g.id]||{};if(!x.st)L.push(['jg_'+i,g.name]);else if(x.st==='P'&&!String(x.memo||'').trim())L.push(['jm_'+i,g.name+' · 내용'])});return L}
function jtSumHtml(){const x=jtCur,R=jtR(),A=jtAll(),bad=A.filter(g=>(R[g.id]||{}).st==='P'),req=bad.filter(g=>R[g.id].req),att=x.attendees||[],nv=att.filter(a=>a.side==='VENDOR').length,miss=jtMiss(),e=escapeText;
 return '<div class="card"><div class="shli" style="cursor:default">'+shIc('home')+'<span class="t"><b>참석 '+att.length+'명</b><span class="muted">CS팀 '+(att.length-nv)+' · 업체 '+nv+'</span></span>'+(nv?'':'<span class="shpill no">업체 없음</span>')+'</div>'
  +'<div class="shli" style="cursor:default">'+shIc('alert',bad.length>0)+'<span class="t"><b>불량 '+bad.length+'</b><span class="muted">조치 요청 '+req.length+' · 그 밖 '+(bad.length-req.length)+'</span></span></div>'
  +'<div class="shli" style="cursor:default">'+shIc('doc')+'<span class="t"><b>시정요구서 '+req.length+'</b><span class="muted">'+e(x.company)+(req.length?' · '+req.map(g=>e(g.name)).join(' · '):'')+'</span></span></div>'
  +(miss.length?'<p class="muted" style="margin:8px 0 0;color:var(--accent)">점검표 빠진 곳 '+miss.length+' · '+e(miss[0][1])+'</p>':'')
  +'<button class="button" type="button" style="width:100%;margin-top:12px" onclick="jtDone()">합동점검 완료</button></div>'}
async function jtDone(){const miss=jtMiss();if(miss.length){jtStep=1;renderJobs();setTimeout(()=>inspFlag(miss.map(m=>m[0]),'빠진 곳 '+miss.length+' · '+miss[0][1]),80);return}
 const R=jtR(),A=jtAll(),groups=A.map(g=>{const x=R[g.id];return x.st==='P'?{g:g.id,st:'P',memo:x.memo.trim(),req:!!x.req,ph:x.ph||null}:{g:g.id,st:'G'}}),bad=groups.filter(x=>x.st==='P'),req=bad.filter(x=>x.req).length,nv=(jtCur.attendees||[]).filter(a=>a.side==='VENDOR').length;
 if(!await askOk('합동점검 완료',jtCur.storeName+'\n불량 '+bad.length+' · 업체 조치 요청 '+req+(nv?'':'\n업체 참석자가 없습니다 (불참으로 기록)')+'\n\n완료하면 고칠 수 없습니다. 완료할까요?','완료'))return;
 const id=jtSel;try{jtCur=await call('jtDone',id,groups);delete jtRes[id];clearInterval(jtPoll);renderJobs();window.scrollTo(0,0);msg('완료했습니다.'+(req?' 시정요구서 '+req+'건 발행':''))}
 catch(e){if(/이미 완료/.test((e&&e.message)||'')){delete jtRes[id];jtRefresh()}}}
/** 완료 결과 */
function jtResultHtml(){const x=jtCur,G=x.groups||[],bad=G.filter(g=>g.st==='P'),att=x.attendees||[],e=escapeText;
 const h='<div class="card"><h2 style="margin:0">결과</h2><div class="muted">완료 '+e(fmtTime(x.doneAt))+'</div><div class="chknum"><div><b>'+att.length+'</b><span>참석</span></div><div class="'+(x.vendorIn?'':'r')+'"><b>'+att.filter(a=>a.side==='VENDOR').length+'</b><span>업체</span></div><div class="'+(bad.length?'r':'')+'"><b>'+bad.length+'</b><span>불량</span></div><div class="'+(x.req?'r':'')+'"><b>'+(x.req||0)+'</b><span>조치 요청</span></div></div></div>'
  +bad.map((g,i)=>'<div class="shgrp bad"><div class="vh-top" style="align-items:center"><b>'+e(g.n)+'</b>'+(g.req?'<span class="shpill no">조치 요청</span>':'<span class="shpill">그 밖</span>')+'</div><p style="margin:6px 0 0">'+e(g.memo||'')+'</p>'+(g.ph?'<img id="jtp'+i+'" class="shpic" alt="사진">':'')+'</div>').join('')
  +'<div class="card"><h2 style="margin:0 0 4px">참석자</h2>'+att.map(a=>'<div class="jtwho"><span class="jtav">'+e((a.n||'?').slice(0,1))+'</span><span class="t"><b>'+e(a.n)+'</b> <span class="muted">'+e(a.co||'')+'</span></span></div>').join('')+'</div>'
  +'<div class="card"><span class="muted">양호 '+(G.length-bad.length)+' / '+G.length+' · 협의체 '+e(x.period||'')+' 「합동점검 결과」에 들어갑니다.</span></div>';
 setTimeout(()=>bad.forEach((g,i)=>{if(g.ph)jtPicLoad('jtp'+i,g.ph)}),0);return h}
async function jtPicLoad(img,fid){const put=u=>{const el=$(img);if(el)el.src=u};if(jtPicMem[fid]){put(jtPicMem[fid]);return}try{const r=await callQuiet('jtPic',jtSel,fid);jtPicMem[fid]='data:'+r.mime+';base64,'+r.data;put(jtPicMem[fid])}catch(e){const el=$(img);if(el)el.alt='사진을 불러오지 못했습니다'}}
async function jtMailAgain(){if(!await askOk('안내 메일',jtCur.company+' 계약담당자에게 안내 메일을 다시 보낼까요?','보내기'))return;try{jtB=await call('jtMail',jtSel);jtCur=await call('jtGet',jtSel);renderJobs();msg('보냈습니다.')}catch(e){}}
async function jtDel(){if(!await askOk('배정 지우기',jtCur.storeName+' 합동점검 배정을 지울까요?'+(jtCur.mailAt?'\n업체에 취소 메일이 갑니다.':''),'지우기'))return;try{jtB=await call('jtDel',jtSel);jtSel='';jtCur=null;renderJobs();msg('지웠습니다.')}catch(e){}}
/** 안내문 A4 (업체에 주거나 매장에 붙임) */
function jtNotice(){const x=jtCur;if(!x)return;const e=escapeText;$('jtDocDlg')?.remove();
 const el=document.createElement('div');el.id='jtDocDlg';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.style.cssText='position:fixed;inset:0;background:#0009;z-index:9000;overflow:auto;padding:14px';el.onclick=ev=>{if(ev.target===el)el.remove()};
 el.innerHTML='<div style="max-width:720px;margin:0 auto"><div class="row" style="justify-content:flex-end;margin-bottom:8px"><button class="button" type="button" onclick="printA4(\'jtDocBody\',\'합동안전보건점검 안내\')">인쇄</button><button class="button ghost" type="button" onclick="$(\'jtDocDlg\').remove()">닫기</button></div>'
  +'<div id="jtDocBody" class="jtdoc"><h1>'+e(jtQName(x.quarter))+' 합동안전보건점검 안내</h1><table>'
  +'<tr><th>수 신</th><td>'+e(x.company)+' 대표 (계약담당자)</td></tr><tr><th>발 신</th><td>(주)아성다이소 안전보건팀</td></tr>'
  +'<tr><th>일 시</th><td><b>'+e(x.date.replace(/-/g,'.')+' ('+jtWD[new Date(x.date+'T00:00:00Z').getUTCDay()]+')'+(x.time?' '+x.time:''))+'</b></td></tr><tr><th>장 소</th><td>다이소 '+e(x.storeName)+' ('+e(x.store)+')</td></tr>'
  +'<tr><th>참 석</th><td>도급인: CS팀 '+e(x.csName)+'<br>수급인: '+e(x.company)+' '+(x.person?e(x.person):'참여자 1명 이상 (앱 대시보드에서 이름 지정)')+'</td></tr>'
  +'<tr><th>점검 내용</th><td>· 매장 공통 안전 (통로 · 적재 · 사다리 · 전기 · 소방 등)<br>· 입고 작업 (운반기구 · 중량물 · 작업 동선)<br>· '+e(x.company)+' 안전보건계획서 위험요인</td></tr>'
  +'<tr><th>준비 사항</th><td>· 작업 관리자(반장) 등 참여자 1명 이상<br>· 우리 작업의 위험요인 · 작업 방법 설명<br>· 휴대폰 (참석 QR)</td></tr>'
  +'<tr><th>참석 확인</th><td>현장에서 CS팀 담당자 휴대폰의 QR을 찍고 이름 입력</td></tr>'
  +'<tr><th>결과</th><td>불량 사항 중 업체 조치가 필요한 것은 시정조치 요구서(7일)로 보내 드리고, 결과는 안전보건협의체에 공유합니다.</td></tr></table>'
  +'<div class="law">「산업안전보건법」 제64조 제1항 제2호 · 같은 법 시행규칙 제82조(도급사업의 합동 안전 · 보건점검)에 따라 도급인과 수급인이 함께 작업장을 점검합니다.</div>'
  +'<div style="text-align:right;margin-top:16px">(주)아성다이소</div></div></div>';document.body.appendChild(el)}

/* ---------- 업체 대시보드 카드 (일정 · 참여자 지정) ---------- */
async function jtVLoad(){try{jtV=await callQuiet('jtVList')}catch(e){return}const b=$('jtBox');if(b)b.innerHTML=jtVCardHtml()}
function jtVCardHtml(){if(!jtV||!jtV.list.length)return '';jtCss();const t=jtV.today,e=escapeText,up=jtV.list.filter(x=>x.status!=='DONE').reverse(),done=jtV.list.filter(x=>x.status==='DONE'),need=up.filter(x=>!x.person).length;
 return '<div class="card"><div class="vh-top" style="align-items:center"><h2 style="margin:0">합동점검</h2>'+(need?'<span class="shpill no">지정 '+need+'</span>':'')+'</div>'
  +up.map(x=>{const [s,c]=jtSt(x,t);return '<div class="shli" style="cursor:default">'+shIc('store',c==='no')+'<span class="t"><b>'+e(x.storeName)+'</b><span class="muted">'+e(jtWhen(x)+' · CS팀 '+x.csName)+'</span></span><span class="shpill '+c+'">'+s+'</span></div>'
   +'<div class="row" style="gap:6px;margin:0 0 6px"><input id="jtp_'+e(x.id)+'" class="shinp" style="flex:1;margin:0" placeholder="참여자 이름 (작업 관리자 · 반장)" value="'+e(x.person||'')+'" aria-label="참여자 이름"><button class="button" type="button" onclick="jtVSet(\''+e(x.id)+'\')">'+(x.person?'변경':'지정')+'</button></div>'}).join('')
  +(up.length?'<p class="muted" style="margin:4px 0 0">당일 현장에서 CS팀 담당자 휴대폰의 QR을 찍고 이름을 적으면 참석으로 기록됩니다.</p>':'<p class="muted" style="margin:8px 0 0">예정된 합동점검이 없습니다.</p>')
  +(done.length?'<details class="hist"><summary>완료 '+done.length+'</summary>'+done.slice(0,20).map(x=>'<div class="shli" style="cursor:default">'+shIc('check')+'<span class="t"><b>'+e(x.storeName)+'</b><span class="muted">'+e(jtD(x.date)+' · '+(x.vendorIn?'참석':'불참')+' · 불량 '+(x.bad||0)+(x.req?' · 조치 요청 '+x.req:''))+'</span></span><span class="shpill ok">완료</span></div>').join('')+'</details>':'')+'</div>'}
async function jtVSet(id){const el=$('jtp_'+id),n=el?el.value.trim():'';if(!n){inspFlag(['jtp_'+id],'참여자 이름');return}try{jtV=await call('jtVPerson',id,n);const b=$('jtBox');if(b)b.innerHTML=jtVCardHtml();msg('지정했습니다.')}catch(e){}}

/* ---------- 링크로 들어온 화면 (로그인 화면 없이) ----------
 *  ?review=JNT-토큰 = 참석 QR (이 기기 익명 계정 · 이름만) / ?review=CSI-토큰 = CS팀 담당자 초대 (본인 Google 계정) */
async function jtLinkBoot(){jtLinkOn=true;jtCss();const csi=/^CSI-/.test(LINK_REVIEW),cmt=/^CMT-/.test(LINK_REVIEW),tok=LINK_REVIEW.slice(4),T=csi?'CS팀 담당자 등록':cmt?'협의체 참석':'합동점검 참석';
 $('loginView').hidden=true;$('appView').hidden=false;document.title=T+' · 입고·재고 안전관리';
 ['my','admin','review','tpl','staff','jobs','vendors'].forEach(n=>$(n)&&$(n).classList.toggle('hidden',n!=='my'));
 ['gearBtn','guideBtn','menuBtn'].forEach(id=>$(id)&&($(id).hidden=true));if($('identity'))$('identity').textContent=T;if($('pageTitle'))$('pageTitle').textContent=T;
 if(typeof showVer==='function')showVer({});const el=$('my');el.innerHTML=jtCard(T,'<p class="muted">준비 중입니다…</p>');
 if(!(window.FB&&FB.ok)){el.innerHTML=jtCard('연결하지 못했습니다','<button class="button" type="button" onclick="location.reload()">다시 시도</button>');return}
 if(csi){jtCsiView(tok);return}
 try{await FB.anon()}catch(e){el.innerHTML=jtCard('접속하지 못했습니다','<p class="muted">'+escapeText((e&&e.message)||'')+'</p><button class="button" type="button" onclick="location.reload()">다시 시도</button>');return}
 if(cmt&&typeof cmQrView==='function'){cmQrView(tok);return}  // S8-1 comeet.js
 jtQrView(tok)}
async function jtQrView(tok,edit){const el=$('my'),e=escapeText;let r;try{r=await FB.sm('jtQr',{token:tok})}catch(x){el.innerHTML=jtCard('합동점검 참석','<p class="muted">'+e((x&&x.message)||'')+'</p><button class="button" type="button" onclick="jtQrView(\''+e(tok)+'\')">다시 시도</button>');return}jtQrDraw(tok,r,edit)}
function jtQrDraw(tok,r,edit){const el=$('my'),e=escapeText,T=e(tok);
 let h='<div class="card"><div class="shli" style="cursor:default">'+shIc('store')+'<span class="t"><b>다이소 '+e(r.storeName)+'</b><span class="muted">'+e(r.when)+'</span></span></div><div class="muted">'+e(r.company)+' · 도급인 CS팀 '+e(r.csName)+'</div></div>';
 if(r.status==='DONE')h+=jtCard('끝난 합동점검입니다','<p class="muted" style="margin:0">'+(r.me?'참석 기록: '+e(r.me):'참석 기록이 필요하면 CS팀 담당자에게 말씀해 주세요.')+'</p>');
 else if(r.me&&!edit)h+='<div class="card"><div class="shli" style="cursor:default">'+shIc('check')+'<span class="t"><b>참석했습니다</b><span class="muted">'+e(r.me)+'</span></span><span class="shpill ok">참석</span></div><button type="button" class="linkbtn" onclick="jtQrView(\''+T+'\',true)">이름 고치기</button></div>';
 else if(r.status==='PLAN')h+=jtCard('아직 시작 전입니다','<p class="muted">CS팀 담당자가 [점검 시작]을 누르면 참석할 수 있습니다.</p><button class="button" type="button" style="width:100%" onclick="jtQrView(\''+T+'\')">다시 확인</button>');
 else h+=jtCard('참석','<input id="jtName" class="shinp" placeholder="이름" value="'+e(r.me||r.person||'')+'" autocomplete="name" aria-label="이름"><button class="button" type="button" style="width:100%;margin-top:10px" onclick="jtQrIn(\''+T+'\')">참석</button>');
 el.innerHTML=h}
async function jtQrIn(tok){const n=($('jtName').value||'').trim();if(!n){inspFlag(['jtName'],'이름');return}loadStart('jtIn');try{const r=await FB.sm('jtIn',{token:tok,name:n});msg('참석했습니다.');jtQrDraw(tok,r)}catch(e){msg((e&&e.message)||'처리하지 못했습니다.')}finally{loadEnd()}}
async function jtCsiView(tok){const el=$('my'),e=escapeText,T=e(tok);try{await FB.redirectResult()}catch(x){}await FB.ready;const em=FB.email();
 if(!em){el.innerHTML=jtCard('CS팀 담당자 등록','<p class="desc">본인 Google 계정(Gmail)으로 로그인한 뒤 이름을 적으면 합동점검 담당자로 등록됩니다.</p><button class="button" type="button" style="width:100%" onclick="jtCsiLogin(\''+T+'\')">Google 계정으로 로그인</button>');return}
 el.innerHTML=jtCard('CS팀 담당자 등록','<div class="muted">Google 계정 · '+e(em)+'</div><input id="jtName" class="shinp" placeholder="이름" autocomplete="name" aria-label="이름"><button class="button" type="button" style="width:100%;margin-top:10px" onclick="jtCsiJoin(\''+T+'\')">등록</button><button class="linkbtn" type="button" style="margin-top:8px" onclick="jtCsiOther(\''+T+'\')">다른 계정으로</button>')}
async function jtCsiLogin(tok){try{const r=await FB.signIn();if(r==='redirect')return;await new Promise(ok=>setTimeout(ok,300));jtCsiView(tok)}catch(e){msg(FB.loginError(e))}}
async function jtCsiOther(tok){try{await FB.signOut()}catch(e){}jtCsiView(tok)}
async function jtCsiJoin(tok){const n=($('jtName').value||'').trim();if(!n){inspFlag(['jtName'],'이름');return}loadStart('csJoin');
 try{const r=await FB.sm('csJoin',{token:tok,name:n});$('my').innerHTML=jtCard('등록되었습니다','<p class="desc">'+escapeText(r.name)+' 님, 이제 앱에서 <b>[다이소 담당자]</b>로 로그인하면 「합동점검」 화면이 열립니다.</p><button class="button" type="button" style="width:100%" onclick="jtCsiOpen()">앱 열기</button>')}
 catch(e){msg((e&&e.message)||'등록하지 못했습니다.')}finally{loadEnd()}}
function jtCsiOpen(){try{localStorage.setItem('loginMode','STAFF');localStorage.removeItem('shopMode')}catch(e){}location.href=location.pathname}
