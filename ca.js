/* S5 시정요구서 (점장 도급 미흡 → 입고도우미 업체) — 업체 대시보드 카드 · 업체 조치 · 본사 목록 · A4 요구서
 *  서버: Relay vcList · vcFix · vcPic (업체) / vcAll · vcMail (본사) · 사진 보기는 업체 = vcPic · 본사 = scPic */
let caV=null,caS=null,caCur='',caF='open',caQ='',caFix={memo:'',ph:null,url:''};
const caMem={};
const caDays=(a,b)=>Math.round((new Date(b+'T00:00:00Z')-new Date(a+'T00:00:00Z'))/864e5);
const caD=d=>/^\d{4}-\d{2}-\d{2}$/.test(d||'')?d.slice(5).replace('-','.'):'';
/** 기한 표시 [글, 색(ok | no | '')] */
function caDue(x,today){if(x.status==='DONE'){const late=caDays(x.dueDate,x.fixDay||x.dueDate);return late>0?[late+'일 늦게 조치','no']:['기한 안 조치','ok']}
 const d=caDays(today,x.dueDate);return d>0?['D-'+d,d<=2?'no':'']:d===0?['오늘까지','no']:[-d+'일 지남','no']}
const caLate=(x,t)=>x.status!=='DONE'&&x.dueDate<t;
function caCss(){if(typeof shCss==='function')shCss();if($('caCss'))return;const s=document.createElement('style');s.id='caCss';s.textContent=
 '.cadoc{background:#fff;color:#111;font:13px/1.6 "Malgun Gothic",sans-serif;padding:18px}.cadoc h1{font-size:22px;text-align:center;letter-spacing:6px;margin:0 0 14px}.cadoc table{width:100%;border-collapse:collapse}.cadoc th,.cadoc td{border:1px solid #333;padding:7px 9px;text-align:left;vertical-align:top}.cadoc th{background:#f3f4f6;width:24%;white-space:nowrap}'
 +'.cadoc .law{margin:12px 0;padding:10px;border:1px solid #333}.cadoc img{max-width:100%;max-height:240px;display:block;margin-top:6px}.cadoc .sign{text-align:right;margin-top:16px;font-size:14px}';document.head.appendChild(s)}
async function caPic(img,x,fid,who){if(!fid)return;const put=u=>{const e=$(img);if(e)e.src=u};if(caMem[fid]){put(caMem[fid]);return}
 try{const r=who==='V'?await callQuiet('vcPic',x.id,fid):await FB.sm('scPic',{store:x.store,ref:x.id,fid});caMem[fid]='data:'+r.mime+';base64,'+r.data;put(caMem[fid])}catch(e){const el=$(img);if(el)el.alt='사진을 불러오지 못했습니다'}}
/** 시정요구서 1건 화면 (who V 업체 · S 본사) */
function caDetailHtml(x,who,today,back){caCss();const [dl,dc]=caDue(x,today);
 let h='<div class="card"><button class="button ghost" type="button" onclick="'+back+'">← 시정요구서</button><div class="vh-top" style="align-items:center;margin-top:12px"><h2 style="margin:0">'+escapeText(x.storeName+' · '+x.name)+'</h2><span class="shpill '+(x.status==='DONE'?dc||'ok':dc)+'">'+escapeText(x.status==='DONE'?'완료 · '+dl:dl)+'</span></div>'
  +'<div class="muted">'+(who==='S'?escapeText(x.company)+' · ':'')+'발견 '+caD(x.foundDate)+' · 기한 '+caD(x.dueDate)+(x.mailAt?' · 메일 '+caD(String(x.mailAt).slice(0,10)):'')+'</div>'
  +'<button class="button ghost" type="button" style="width:100%;margin-top:10px" onclick="caDoc(\''+who+'\')">시정조치 요구서 보기 · 인쇄</button>'
  +(x.ph?'<img id="caBefore" class="shpic" alt="미흡 사진">':'')+((x.items||[]).length?'<div class="muted" style="margin-top:8px">'+x.items.map(t=>'· '+escapeText(t)).join('<br>')+'</div>':'')+(x.memo?'<p style="margin:8px 0 0">'+escapeText(x.memo)+'</p>':'')+'</div>';
 if(x.status==='DONE')h+='<div class="card"><div class="vh-top" style="align-items:center"><h2 style="margin:0">조치</h2><span class="muted">'+caD(x.fixDay)+' · '+(x.fixBy==='STORE'?'점장':x.fixBy==='VENDOR'?'업체':'')+'</span></div>'+(x.fixPh?'<img id="caAfter" class="shpic" alt="조치 후 사진">':'')+(x.fixMemo?'<p style="margin:8px 0 0">'+escapeText(x.fixMemo)+'</p>':'')+'</div>';
 else if(who==='V')h+='<div class="card"><h2 style="margin:0">조치 올리기</h2><textarea class="shinp" id="caFixMemo" placeholder="조치 내용" oninput="caFix.memo=this.value">'+escapeText(caFix.memo)+'</textarea>'
  +'<label class="shcam'+(caFix.url?' has':'')+'" id="caFixCam">'+(caFix.url?'<img src="'+caFix.url+'" alt="조치 후 사진">':'<svg viewBox="0 0 24 24">'+SH_ICONS.cam+'</svg>조치 후 사진')+'<input type="file" accept="image/*" aria-label="조치 후 사진" onchange="caFixPh(this)"></label>'
  +'<button class="button" type="button" style="width:100%;margin-top:12px" onclick="caFixSave()">저장</button></div>';
 else h+='<div class="card"><button class="button ghost" type="button" style="width:100%" onclick="caMail()">업체에 메일 다시 보내기</button></div>';
 setTimeout(()=>{caPic('caBefore',x,x.ph,who);caPic('caAfter',x,x.fixPh,who)},0);return h}
/** A4 시정조치 요구서 (화면 · 인쇄) */
function caDoc(who){const D=who==='V'?caV:caS,x=D&&D.list.find(i=>i.id===caCur);if(!x)return;const P=D.principal||{},e=escapeText,co=who==='V'?D.company:x.company;
 const el=document.createElement('div');el.id='caDocDlg';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.style.cssText='position:fixed;inset:0;background:#0009;z-index:9000;overflow:auto;padding:14px';el.onclick=ev=>{if(ev.target===el)el.remove()};
 el.innerHTML='<div style="max-width:720px;margin:0 auto"><div class="row" style="justify-content:flex-end;margin-bottom:8px"><button class="button" type="button" onclick="printA4(\'caDocBody\',\'시정조치 요구서\')">인쇄</button><button class="button ghost" type="button" onclick="$(\'caDocDlg\').remove()">닫기</button></div>'
  +'<div id="caDocBody" class="cadoc"><h1>시정조치 요구서</h1><table>'
  +'<tr><th>수 신</th><td>'+e(co)+' 대표</td></tr><tr><th>발 신</th><td>(주)아성다이소 '+e((P.ceo&&P.ceo.title)||'')+' '+e((P.ceo&&P.ceo.name)||'')+'</td></tr>'
  +'<tr><th>문서 번호</th><td>'+e(x.id)+'</td></tr><tr><th>발 행 일</th><td>'+e(x.foundDate)+'</td></tr><tr><th>장 소</th><td>다이소 '+e(x.storeName)+' ('+e(x.store)+')</td></tr><tr><th>점 검</th><td>'+e(x.week)+' 주 점장 주간 순회점검</td></tr>'
  +'<tr><th>미흡 사항</th><td><b>'+e(x.name)+'</b>'+((x.items||[]).length?'<br>'+x.items.map(t=>'· '+e(t)).join('<br>'):'')+(x.memo?'<br>'+e(x.memo):'')+(x.ph&&caMem[x.ph]?'<img src="'+caMem[x.ph]+'" alt="">':'')+'</td></tr>'
  +'<tr><th>조치 기한</th><td><b>'+e(x.dueDate)+'</b> (발행일로부터 7일)</td></tr>'
  +(x.status==='DONE'?'<tr><th>조치 결과</th><td>'+e(x.fixDay||'')+' · '+e(x.fixMemo||'')+(x.fixPh&&caMem[x.fixPh]?'<img src="'+caMem[x.fixPh]+'" alt="">':'')+'</td></tr>':'')
  +'</table><div class="law">「산업안전보건법」 제66조(도급인의 관계수급인에 대한 시정조치)에 따라 위 사항의 시정을 요구하오니, 조치 기한까지 시정하고 그 결과(조치 내용 · 조치 후 사진)를 회신하여 주시기 바랍니다.</div>'
  +'<div class="sign">(주)아성다이소 '+e((P.ceo&&P.ceo.title)||'')+' '+e((P.ceo&&P.ceo.name)||'')+'</div></div></div>';document.body.appendChild(el)}

/* ---------- 업체 (대시보드 카드 · 조치) ---------- */
async function caVLoad(){try{caV=await callQuiet('vcList')}catch(e){return}const n=caV.list.filter(x=>x.status!=='DONE').length;setBadge($('vm_dash'),n);setBadge($('menuBtn'),n);
 const b=$('caBox');if(b&&!caCur)b.innerHTML=caCardHtml()}
function caCardHtml(){caCss();if(!caV)return '<div class="card"><p class="muted" style="margin:0">불러오는 중…</p></div>';const L=caV.list,open=L.filter(x=>x.status!=='DONE'),done=L.filter(x=>x.status==='DONE'),t=caV.today;
 const row=x=>{const [dl,dc]=caDue(x,t);return '<button class="shli" type="button" onclick="caVOpen(\''+escapeText(x.id)+'\')">'+shIc(x.status==='DONE'?'check':'alert',x.status!=='DONE')+'<span class="t"><b>'+escapeText(x.storeName+' · '+x.name)+'</b><span class="muted">'+caD(x.foundDate)+' · 기한 '+caD(x.dueDate)+'</span></span><span class="shpill '+(x.status==='DONE'?'ok':dc)+'">'+escapeText(x.status==='DONE'?'완료':dl)+'</span></button>'};
 return '<div class="card"><div class="vh-top" style="align-items:center"><h2 style="margin:0">시정요구서</h2>'+(open.length?'<span class="shpill no">'+open.length+'</span>':'')+'</div>'
  +(open.length?open.map(row).join(''):'<p class="muted" style="margin:8px 0 0">받은 요구서가 없습니다.</p>')
  +(done.length?'<details class="hist"><summary>완료 '+done.length+'</summary>'+done.slice(0,50).map(row).join('')+'</details>':'')+'</div>'}
function caVOpen(id){const x=caV&&caV.list.find(i=>i.id===id);if(!x)return;caCur=id;caFix={memo:'',ph:null,url:''};const el=$('execArea');if(!el)return;el.innerHTML=caDetailHtml(x,'V',caV.today,'caVBack()');$('pageTitle').textContent='시정요구서';window.scrollTo(0,0)}
function caVBack(){caCur='';caFix={memo:'',ph:null,url:''};renderDash();window.scrollTo(0,0)}
function caVRedraw(){const y=window.scrollY;caVOpen(caCur);const f=caFix;window.scrollTo(0,y);return f}
async function caFixPh(inp){const f=inp.files&&inp.files[0];if(!f)return;try{window.__wkCo=(caV&&caV.company)||'';const r=await readFile(f,PHOTO_STAMP);const keep=caFix.memo;caFix.ph=r;caFix.url='data:'+r.mime+';base64,'+r.data;const id=caCur,y=window.scrollY;const x=caV.list.find(i=>i.id===id);$('execArea').innerHTML=caDetailHtml(x,'V',caV.today,'caVBack()');caFix.memo=keep;window.scrollTo(0,y)}catch(e){msg((e&&e.message)||'사진을 읽지 못했습니다.')}}
async function caFixSave(){const miss=[];if(!caFix.memo.trim())miss.push('caFixMemo');if(!caFix.ph)miss.push('caFixCam');if(miss.length){inspFlag(miss,miss.length>1?'조치 내용 · 사진':miss[0]==='caFixMemo'?'조치 내용':'조치 후 사진');return}
 if(!await askOk('조치 저장','조치 내용과 사진을 저장할까요?\n저장하면 본사 · 점장 화면에 「완료」로 보입니다.','저장'))return;
 try{caV=await call('vcFix',caCur,caFix.memo.trim(),caFix.ph);msg('저장했습니다.');caVBack();const n=caV.list.filter(x=>x.status!=='DONE').length;setBadge($('vm_dash'),n);setBadge($('menuBtn'),n)}
 catch(e){if(/이미 조치/.test((e&&e.message)||'')){caCur='';caVLoad().then(()=>renderDash())}}}

/* ---------- 본사 (☰ 시정요구서) ---------- */
async function caSLoad(){try{caS=await call('vcAll')}catch(e){}if(tab==='jobs'&&smenu==='ca')renderJobs()}
function sCa(){caCss();if(!caS){caSLoad();return '<div class="card"><h2>시정요구서</h2><p class="muted">불러오는 중입니다…</p></div>'}const t=caS.today;
 if(caCur){const x=caS.list.find(i=>i.id===caCur);if(x){jobsMode='form';return caDetailHtml(x,'S',t,'caSBack()')}caCur=''}
 const L=caS.list,F=[['open','미조치',x=>x.status!=='DONE'],['late','기한 지남',x=>caLate(x,t)],['done','완료',x=>x.status==='DONE'],['all','전체',()=>true]],f=(F.find(x=>x[0]===caF)||F[0])[2],q=String(caQ||'').replace(/\s/g,'');
 const M=L.filter(f).filter(x=>!q||String(x.company+x.storeName).replace(/\s/g,'').includes(q));
 const done=L.filter(x=>x.status==='DONE'),inT=done.filter(x=>!(caDays(x.dueDate,x.fixDay||x.dueDate)>0)).length;
 return '<div class="card"><h2 style="margin:0">시정요구서</h2><div class="chknum"><div><b>'+L.length+'</b><span>발행</span></div><div class="'+(L.length-done.length?'r':'')+'"><b>'+(L.length-done.length)+'</b><span>미조치</span></div><div class="'+(L.filter(x=>caLate(x,t)).length?'r':'')+'"><b>'+L.filter(x=>caLate(x,t)).length+'</b><span>기한 지남</span></div><div><b>'+(done.length?Math.round(inT/done.length*100)+'%':'–')+'</b><span>7일 안 조치</span></div></div>'
  +'<div class="seg" role="tablist">'+F.map(([k,l,fn])=>'<button type="button" role="tab" aria-selected="'+(caF===k)+'" class="'+(caF===k?'on':'')+'" onclick="caF=\''+k+'\';renderJobs()">'+l+' '+L.filter(fn).length+'</button>').join('')+'</div>'
  +'<input class="shinp" type="search" placeholder="업체 · 매장" value="'+escapeText(caQ)+'" oninput="caQ=this.value;caSRes()" aria-label="찾기"></div><div class="card" id="caRes">'+caSRows(M,t)+'</div>'}
function caSRows(M,t){if(!M.length)return '<p class="muted" style="margin:0">없음</p>';
 return '<table class="rtable chkt"><tr><th>업체 · 매장</th><th>미흡</th><th>기한</th><th>상태</th></tr>'+M.slice(0,300).map(x=>{const [dl,dc]=caDue(x,t);return '<tr class="go" onclick="caSOpen(\''+escapeText(x.id)+'\')"><td><b>'+escapeText(x.company)+'</b><div class="muted">'+escapeText(x.storeName)+' · '+caD(x.foundDate)+'</div></td><td>'+escapeText(x.name)+'</td><td>'+caD(x.dueDate)+'</td><td><span class="shpill '+(x.status==='DONE'?dc||'ok':dc)+'">'+escapeText(x.status==='DONE'?'완료':dl)+'</span></td></tr>'}).join('')+'</table>'}
function caSRes(){if(!caS)return;const t=caS.today,F={open:x=>x.status!=='DONE',late:x=>caLate(x,t),done:x=>x.status==='DONE',all:()=>true}[caF],q=String(caQ||'').replace(/\s/g,'');$('caRes').innerHTML=caSRows(caS.list.filter(F).filter(x=>!q||String(x.company+x.storeName).replace(/\s/g,'').includes(q)),t)}
function caSOpen(id){caCur=id;renderJobs();window.scrollTo(0,0)}
function caSBack(){caCur='';renderJobs()}
async function caMail(){const x=caS&&caS.list.find(i=>i.id===caCur);if(!x)return;if(!await askOk('메일 다시 보내기',x.company+'에 시정요구서 메일을 다시 보낼까요?','보내기'))return;try{caS=await call('vcMail',caCur);renderJobs();msg('메일을 보냈습니다.')}catch(e){}}
