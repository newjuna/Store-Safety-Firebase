/* S8-2 작업자 등록 · 채용 시 교육 (보통인부 1시간) · 재해 등록
 *  업체 대시보드: 「작업자 · 교육일지」 카드 (QR · 링크 복사 · 새 QR · 명단 · 교육일지 A4) / 「재해」 카드 (등록 · 14일 안 안전대책 + 조치 사진)
 *  근로자: ?review=WKR-토큰 (로그인 없음 · 이름 + 교육 내용 확인 + 서명) · 한 휴대폰으로 여러 명 차례로 등록 가능
 *  본사: 업체 현황 → 업체 펼치기 → [작업자 · 재해] (보기만)
 *  서버: Relay wrMine · wrNew · wrSign · wrStaff · acMine · acAdd · acFix · acPic · (로그인 없음) wrInfo · wrIn */
let wrM=null,acM=null,acCur='',acNewF=null,acF={plan:'',phs:[]},wrS=null;
const acMem={};
const wrD=d=>/^\d{4}-\d{2}-\d{2}/.test(d||'')?d.slice(5,10).replace('-','.'):'';
const wrKst=t=>{try{return new Date(t).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'})}catch(e){return ''}};
/** 재해 조치 기한 [글, 색] */
function acDue(x,today){if(x.status==='DONE')return ['조치 완료','ok'];const d=caDays(today,x.dueDate);return d>0?['D-'+d,d<=3?'no':'']:d===0?['오늘까지','no']:[-d+'일 지남','no']}
function acReset(){acCur='';acNewF=null;acF={plan:'',phs:[]}}

/* ---------- 업체: 작업자 · 교육일지 ---------- */
async function wrVLoad(){try{wrM=await callQuiet('wrMine')}catch(e){return}const b=$('wrBox');if(b)b.innerHTML=wrCardHtml()}
function wrCardHtml(){if(!wrM)return '';jtCss();const e=escapeText,u=jtLink('WKR',wrM.token),L=wrM.list,row=w=>'<button class="shli" type="button" onclick="wrPaper(\''+e(w.id)+'\')">'+shIc('check')+'<span class="t"><b>'+e(w.name)+'</b><span class="muted">'+e(w.role+' · '+wrD(w.eduDay)+' 교육 서명')+'</span></span><span aria-hidden="true">›</span></button>';
 return '<div class="card"><div class="vh-top" style="align-items:center"><h2 style="margin:0">작업자 · 교육일지</h2><span class="shpill'+(L.length?' ok':'')+'">'+L.length+'명</span></div>'
  +'<div style="text-align:center;margin-top:8px"><img class="jtqr" style="width:180px;height:180px" alt="작업자 등록 QR" src="https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=8&data='+encodeURIComponent(u)+'"><div class="muted">새 작업자가 찍고 이름 · 서명 (채용 시 교육 1시간)</div></div>'
  +'<div class="row" style="gap:6px;margin-top:8px"><button class="button" type="button" style="flex:1" onclick="copyLink(\''+e(u)+'\')">링크 복사</button><button class="button ghost" type="button" style="flex:1" onclick="wrNewLink()">새 QR</button></div>'
  +'<p class="muted" style="margin:8px 0 0">'+(wrM.nHalf?'이번 반기 등록 '+wrM.nHalf+'명 · 반기 평가 가점 +10':'이번 반기 등록 없음 · 등록하면 반기 평가 가점 +10')+'</p>'
  +L.slice(0,5).map(row).join('')+(L.length>5?'<details class="hist"><summary>전체 '+L.length+'</summary>'+L.slice(5).map(row).join('')+'</details>':'')+'</div>'}
async function wrNewLink(){if(!await askOk('새 QR','지금 QR · 링크는 더 이상 쓸 수 없습니다.\n이미 등록된 작업자는 그대로 남습니다.\n\n새로 만들까요?','새로 만들기'))return;try{wrM=await call('wrNew');const b=$('wrBox');if(b)b.innerHTML=wrCardHtml();msg('새 QR을 만들었습니다. 새 링크를 다시 보내 주세요.')}catch(e){}}
/** 교육일지 A4 (업체 · 본사 같이 씀) */
async function wrPaper(id,staff){const D=staff?wrS:wrM,w=D&&D.list.find(x=>x.id===id);if(!w)return;let sg='';try{sg=(await callQuiet('wrSign',id)).sign||''}catch(e){}
 const e=escapeText,E=D.edu||{hire:[],etc:''};$('wrDocDlg')?.remove();const el=document.createElement('div');el.id='wrDocDlg';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.style.cssText='position:fixed;inset:0;background:#0009;z-index:9100;overflow:auto;padding:14px';el.onclick=ev=>{if(ev.target===el)el.remove()};
 el.innerHTML='<div style="max-width:720px;margin:0 auto"><div class="row" style="justify-content:flex-end;margin-bottom:8px"><button class="button" type="button" onclick="printA4(\'wrDocBody\',\'근로자 안전보건교육 일지\')">인쇄</button><button class="button ghost" type="button" onclick="$(\'wrDocDlg\').remove()">닫기</button></div>'
  +'<div id="wrDocBody" class="jtdoc"><h1>근로자 안전보건교육 일지</h1><table>'
  +'<tr><th>업 체</th><td>'+e(D.company)+'</td></tr><tr><th>교육 종류</th><td>'+e(E.type||'채용 시 교육')+' (산업안전보건법 시행규칙 [별표 4] · [별표 5] 다목)</td></tr>'
  +'<tr><th>교육 일시</th><td>'+e(wrKst(w.eduAt))+'</td></tr><tr><th>교육 시간</th><td>'+(E.hours||1)+'시간</td></tr><tr><th>대 상</th><td>'+e(w.name)+' · '+e(w.role)+'</td></tr>'
  +'<tr><th>교육 내용</th><td>'+(E.hire||[]).map((t,i)=>(i+1)+'. '+e(t)).join('<br>')+(E.etc?'<br>'+((E.hire||[]).length+1)+'. '+e(E.etc):'')+'</td></tr>'
  +'<tr><th>확 인</th><td>위 내용을 교육 받았습니다.<div style="margin-top:6px">'+(sg?'<img src="'+sg+'" alt="서명" style="max-height:80px;max-width:240px">':'<span class="muted">서명 이미지를 불러오지 못했습니다</span>')+'</div></td></tr></table></div></div>';document.body.appendChild(el)}

/* ---------- 업체: 재해 ---------- */
async function acVLoad(){try{acM=await callQuiet('acMine')}catch(e){return}const b=$('acBox');if(b&&!acCur&&!acNewF)b.innerHTML=acCardHtml()}
function acCardHtml(){if(!acM)return '';const e=escapeText,t=acM.today,L=acM.list,open=L.filter(x=>x.status!=='DONE').length;
 return '<div class="card"><div class="vh-top" style="align-items:center"><h2 style="margin:0">재해</h2>'+(open?'<span class="shpill no">조치 '+open+'</span>':'')+'</div>'
  +(L.length?L.slice(0,20).map(x=>{const [s,c]=acDue(x,t);return '<button class="shli" type="button" onclick="acOpen(\''+e(x.id)+'\')">'+shIc(x.status==='DONE'?'check':'alert',x.status!=='DONE')+'<span class="t"><b>'+e(x.storeName+' · '+wrD(x.accDate))+'</b><span class="muted">'+e(x.memo)+'</span></span><span class="shpill '+c+'">'+s+'</span></button>'}).join(''):'<p class="muted" style="margin:8px 0 0">등록한 재해가 없습니다.</p>')
  +'<button class="button ghost" type="button" style="width:100%;margin-top:10px" onclick="acNew()">＋ 재해 등록</button></div>'}
function acArea(){return $('execArea')}
function acNew(){if(!acM)return;acNewF={store:'',storeName:'',q:'',date:acM.today,memo:''};acNewDraw();$('pageTitle').textContent='재해 등록';window.scrollTo(0,0)}
function acNewDraw(){const F=acNewF,e=escapeText,el=acArea();if(!el)return;
 el.innerHTML='<div class="card"><button class="button ghost" type="button" onclick="acBack()">← 대시보드</button><h2 style="margin:12px 0 0">재해 등록</h2>'
  +'<label class="muted" style="display:block;margin-top:10px">매장</label><div id="acStoreBox">'+acStorePick()+'</div>'
  +'<label class="muted" for="acDate" style="display:block;margin-top:10px">재해일</label><input id="acDate" class="shinp" type="date" max="'+e(acM.today)+'" value="'+e(F.date)+'" onchange="acNewF.date=this.value">'
  +'<label class="muted" for="acMemo" style="display:block;margin-top:10px">재해경위</label><textarea id="acMemo" class="shinp" placeholder="어떤 작업 중 · 어떻게 다쳤는지" oninput="acNewF.memo=this.value">'+e(F.memo)+'</textarea>'
  +'<p class="muted" style="margin:6px 0 0">재해자 이름 · 연락처는 적지 않습니다.</p>'
  +'<button class="button" type="button" style="width:100%;margin-top:12px" onclick="acAdd()">등록</button></div>'}
function acStorePick(){const F=acNewF,e=escapeText;if(F.store)return '<div class="shli" style="cursor:default">'+shIc('store')+'<span class="t"><b>'+e(F.storeName)+'</b><span class="muted">'+e(F.store)+'</span></span><button type="button" class="linkbtn" onclick="acNewF.store=\'\';$(\'acStoreBox\').innerHTML=acStorePick()">바꾸기</button></div>';
 return '<div class="shsrch" style="margin-top:0"><svg viewBox="0 0 24 24">'+SH_ICONS.search+'</svg><input id="acQ" class="shinp" type="search" placeholder="매장명 · 코드" value="'+e(F.q)+'" oninput="acNewF.q=this.value;$(\'acSRes\').innerHTML=acStoreRes()" aria-label="매장 찾기" autocomplete="off"></div><div id="acSRes">'+acStoreRes()+'</div>'}
function acStoreRes(){const q=String(acNewF.q||'').replace(/\s/g,'').toLowerCase();if(!q)return '';const L=acM.stores.filter(s=>(s[0]+s[1]).replace(/\s/g,'').toLowerCase().includes(q)).slice(0,12);
 return L.length?L.map(s=>'<button class="shli" type="button" onclick="acPickStore(\''+escapeText(s[0])+'\')">'+shIc('store')+'<span class="t"><b>'+escapeText(s[1])+'</b><span class="muted">'+escapeText(s[0]+' · '+s[2])+'</span></span></button>').join(''):'<p class="muted" style="margin:6px 0 0">없음</p>'}
function acPickStore(c){const s=acM.stores.find(x=>x[0]===c);if(!s)return;acNewF.store=s[0];acNewF.storeName=s[1];$('acStoreBox').innerHTML=acStorePick()}
async function acAdd(){const F=acNewF,miss=[];if(!F.store)miss.push('acQ');if(!F.date)miss.push('acDate');if(!String(F.memo||'').trim())miss.push('acMemo');if(miss.length){inspFlag(miss,'빠진 곳 '+miss.length);return}
 if(!await askOk('재해 등록',F.storeName+' · '+wrD(F.date)+'\n\n등록하면 협의체에 들어가고, 14일 안에 안전대책과 조치 사진을 올려야 합니다.','등록'))return;
 try{acM=await call('acAdd',{store:F.store,date:F.date,memo:F.memo.trim()});acNewF=null;msg('등록했습니다.');acOpen(acM.added)}catch(e){}}
function acOpen(id){const x=acM&&acM.list.find(i=>i.id===id);if(!x)return;acCur=id;acNewF=null;acF={plan:'',phs:[]};acDraw();$('pageTitle').textContent='재해';window.scrollTo(0,0)}
function acDraw(){const x=acM.list.find(i=>i.id===acCur),el=acArea();if(!x||!el)return;const e=escapeText,[s,c]=acDue(x,acM.today);
 let h='<div class="card"><button class="button ghost" type="button" onclick="acBack()">← 대시보드</button><div class="vh-top" style="align-items:center;margin-top:12px"><h2 style="margin:0">'+e(x.storeName+' · '+wrD(x.accDate))+'</h2><span class="shpill '+c+'">'+s+'</span></div>'
  +'<div class="muted">재해일 '+e(x.accDate)+' · 등록 '+e(x.regDay)+' · 조치 기한 '+e(x.dueDate)+'</div><p style="margin:8px 0 0">'+e(x.memo)+'</p></div>';
 if(x.status==='DONE')h+='<div class="card"><h2 style="margin:0">안전대책</h2><p style="margin:6px 0 0">'+e(x.plan)+'</p><div class="muted">조치 '+e(x.fixDay||'')+'</div>'+(x.phs||[]).map((f,i)=>'<img id="acp'+i+'" class="shpic" alt="조치 사진">').join('')+'</div>';
 else h+='<div class="card"><h2 style="margin:0">안전대책 · 조치 사진</h2><textarea id="acPlan" class="shinp" placeholder="같은 사고가 나지 않게 무엇을 바꿨는지" oninput="acF.plan=this.value">'+e(acF.plan)+'</textarea>'
  +acF.phs.map((p,i)=>'<div style="position:relative"><img class="shpic" src="'+p.url+'" alt="조치 사진 '+(i+1)+'"><button type="button" class="linkbtn" style="position:absolute;right:6px;top:12px;background:#fff;border-radius:6px;padding:2px 8px" onclick="acPhDrop('+i+')">빼기</button></div>').join('')
  +(acF.phs.length<10?'<label class="shcam" id="acCam"><svg viewBox="0 0 24 24">'+SH_ICONS.cam+'</svg>조치 사진 '+(acF.phs.length?'더 넣기 ('+acF.phs.length+'/10)':'(1장 이상)')+'<input type="file" accept="image/*" multiple aria-label="조치 사진" onchange="acPh(this)"></label>':'')
  +'<button class="button" type="button" style="width:100%;margin-top:12px" onclick="acFix()">조치 완료</button></div>';
 el.innerHTML=h;if(x.status==='DONE')(x.phs||[]).forEach((f,i)=>acPicLoad('acp'+i,x.id,f))}
async function acPh(inp){const fs=[...(inp.files||[])].slice(0,10-acF.phs.length);if(!fs.length)return;const x=acM.list.find(i=>i.id===acCur);window.__wkCo=(acM&&acM.company)||'';
 for(const f of fs){try{const r=await readFile(f,PHOTO_STAMP);acF.phs.push({ph:r,url:'data:'+r.mime+';base64,'+r.data})}catch(e){msg((e&&e.message)||'사진을 읽지 못했습니다.')}}const y=window.scrollY;acDraw();window.scrollTo(0,y)}
function acPhDrop(i){acF.phs.splice(i,1);const y=window.scrollY;acDraw();window.scrollTo(0,y)}
async function acFix(){const miss=[];if(!acF.plan.trim())miss.push('acPlan');if(!acF.phs.length)miss.push('acCam');if(miss.length){inspFlag(miss,miss.length>1?'안전대책 · 사진':miss[0]==='acPlan'?'안전대책':'조치 사진');return}
 if(!await askOk('조치 완료','안전대책과 사진 '+acF.phs.length+'장을 올릴까요?\n올리면 고칠 수 없습니다.','올리기'))return;
 try{acM=await call('acFix',acCur,acF.plan.trim(),acF.phs.map(p=>p.ph));msg('조치 완료로 저장했습니다.');acF={plan:'',phs:[]};acDraw()}catch(e){if(/이미 조치/.test((e&&e.message)||'')){acVLoad().then(()=>acDraw())}}}
async function acPicLoad(img,id,fid){const put=u=>{const el=$(img);if(el)el.src=u};if(acMem[fid]){put(acMem[fid]);return}try{const r=await callQuiet('acPic',id,fid);acMem[fid]='data:'+r.mime+';base64,'+r.data;put(acMem[fid])}catch(e){const el=$(img);if(el)el.alt='사진을 불러오지 못했습니다'}}
function acBack(){acReset();renderDash();window.scrollTo(0,0)}

/* ---------- 본사: 업체 현황 → [작업자 · 재해] (보기만) ---------- */
const wrStaffBtn=b=>b&&b.industry==='입고도우미'&&b.status==='VERIFIED'?'<button class="button ghost" type="button" style="margin-top:8px" onclick="wrStaffOpen(\''+escapeText(b.id)+'\')">작업자 · 재해</button>':'';
async function wrStaffOpen(cid){try{wrS=await call('wrStaff',cid)}catch(e){return}jtCss();const e=escapeText,D=wrS,t=D.today;$('wrDlg')?.remove();
 const el=document.createElement('div');el.id='wrDlg';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.style.cssText='position:fixed;inset:0;background:#0009;z-index:9000;overflow:auto;padding:14px';el.onclick=ev=>{if(ev.target===el)el.remove()};
 const nH=D.list.filter(w=>w.half===D.half).length;
 el.innerHTML='<div style="max-width:720px;margin:0 auto"><div class="card"><div class="vh-top" style="align-items:center"><h2 style="margin:0">'+e(D.company)+'</h2><button class="button ghost" type="button" onclick="$(\'wrDlg\').remove()">닫기</button></div></div>'
  +'<div class="card"><h2 style="margin:0">반기 평가</h2>'+((D.he||[]).length?D.he.map(h=>'<div class="shli" style="cursor:default">'+shIc('doc')+'<span class="t"><b>'+e(typeof heName==='function'?heName(h.period):h.period)+' · '+h.total+'점</b><span class="muted">'+(h.need?(h.planOk?'개선 계획 확인':h.plan?'개선 계획 확인 전':'개선 계획 제출 전'):'—')+'</span></span><span class="shpill '+(typeof heGc==='function'?heGc(h.grade):'')+'">'+e(h.grade)+'</span></div>').join(''):'<p class="muted" style="margin:8px 0 0">확정된 반기 평가가 없습니다.</p>')+'</div>'  // S8-3
  +'<div class="card"><div class="vh-top" style="align-items:center"><h2 style="margin:0">작업자 · 교육일지</h2><span class="shpill'+(nH?' ok':'')+'">이번 반기 '+nH+'명</span></div>'
  +(D.list.length?'<table class="rtable chkt" style="margin-top:8px"><tr><th>이름</th><th>교육일</th><th></th></tr>'+D.list.map(w=>'<tr><td><b>'+e(w.name)+'</b><div class="muted">'+e(w.role)+'</div></td><td>'+e(w.eduDay)+'</td><td><button type="button" class="linkbtn" onclick="wrPaper(\''+e(w.id)+'\',1)">교육일지</button></td></tr>').join('')+'</table>':'<p class="muted" style="margin:8px 0 0">등록한 작업자가 없습니다.</p>')+'</div>'
  +'<div class="card"><h2 style="margin:0">재해</h2>'+(D.acc.length?D.acc.map(x=>{const [s,c]=acDue(x,t);return '<div class="shgrp'+(x.status==='DONE'?'':' bad')+'" style="margin-top:8px"><div class="vh-top" style="align-items:center"><b>'+e(x.storeName+' · '+x.accDate)+'</b><span class="shpill '+c+'">'+s+'</span></div><p style="margin:6px 0 0">'+e(x.memo)+'</p>'
   +(x.status==='DONE'?'<div class="muted" style="margin-top:6px">대책 · '+e(x.plan)+'</div>'+(x.phs||[]).map((f,i)=>'<img id="acs_'+e(x.id)+'_'+i+'" class="shpic" alt="조치 사진">').join(''):'')+'</div>'}).join(''):'<p class="muted" style="margin:8px 0 0">등록한 재해가 없습니다.</p>')+'</div></div>';
 document.body.appendChild(el);D.acc.forEach(x=>(x.phs||[]).forEach((f,i)=>acPicLoad('acs_'+x.id+'_'+i,x.id,f)))}

/* ---------- 근로자: 등록 링크 · QR (?review=WKR-토큰 · 로그인 없음 · joint.js jtLinkBoot에서 부름) ---------- */
let wrQ=null;
async function wrQrView(tok){const el=$('my'),e=escapeText;try{wrQ=await FB.sm('wrInfo',{token:tok})}catch(x){el.innerHTML=jtCard('작업자 등록','<p class="muted">'+e((x&&x.message)||'')+'</p><button class="button" type="button" onclick="wrQrView(\''+e(tok)+'\')">다시 시도</button>');return}wrQrForm(tok)}
function wrQrForm(tok){const el=$('my'),e=escapeText,E=wrQ.edu,T=e(tok);if(typeof sigDirty!=='undefined')sigDirty=false;
 el.innerHTML='<div class="card"><div class="shli" style="cursor:default">'+shIc('home')+'<span class="t"><b>'+e(wrQ.company)+'</b><span class="muted">다이소 입고 작업 · 작업자 등록</span></span></div><input id="wrName" class="shinp" placeholder="이름" autocomplete="name" aria-label="이름"></div>'
  +'<div class="card"><div class="vh-top" style="align-items:center"><h2 style="margin:0">'+e(E.type)+'</h2><span class="shpill">'+E.hours+'시간 · '+e(E.role)+'</span></div><div class="muted" style="margin-top:8px;line-height:1.75">'+E.hire.map((t,i)=>(i+1)+'. '+e(t)).join('<br>')+'<br>'+(E.hire.length+1)+'. '+e(E.etc)+'</div></div>'
  +'<div class="card" id="sigBox"><h2 style="margin:0">서명</h2><p class="muted" style="margin:4px 0 6px">위 내용을 교육 받았으면 아래에 손가락으로 서명해 주세요.</p><canvas id="sigPad" class="sigpad" aria-label="서명 칸"></canvas><div class="row" style="justify-content:flex-end;margin-top:6px"><button type="button" class="linkbtn" onclick="clearSig()">다시 쓰기</button></div>'
  +'<button class="button" type="button" style="width:100%;margin-top:10px" onclick="wrQrIn(\''+T+'\')">교육 받았습니다 · 등록</button></div>';
 setTimeout(()=>{if(typeof initSig==='function')initSig()},50)}
async function wrQrIn(tok){const n=($('wrName').value||'').trim(),miss=[];if(!n)miss.push('wrName');if(typeof sigDirty==='undefined'||!sigDirty)miss.push('sigBox');if(miss.length){inspFlag(miss,miss.length>1?'이름 · 서명':n?'서명':'이름');return}
 const sg=sigData();if(!sg){msg('서명 칸을 다시 준비했습니다. 한 번 더 서명해 주세요.');initSig();return}
 loadStart('wrIn');try{const r=await FB.sm('wrIn',{token:tok,name:n,sign:sg});const e=escapeText;
  $('my').innerHTML='<div class="card"><div class="shli" style="cursor:default">'+shIc('check')+'<span class="t"><b>등록했습니다</b><span class="muted">'+e(r.company+' · '+r.name+' · '+wrD(r.eduDay)+' 교육')+'</span></span><span class="shpill ok">완료</span></div><button class="button ghost" type="button" style="width:100%;margin-top:10px" onclick="wrQrForm(\''+e(tok)+'\')">다른 사람 등록</button></div>';window.scrollTo(0,0)}
 catch(e){msg((e&&e.message)||'등록하지 못했습니다.')}finally{loadEnd()}}
