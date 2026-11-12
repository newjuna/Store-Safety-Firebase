/* 업체 화면 (S1) — 승인된 협력업체 (입고도우미 · 재고조사)
 *  메뉴: 대시보드 / 계약 서류
 *  S5~ 시정요구서 · 협의체 · 합동점검 · 반기 평가가 대시보드에 차례로 들어옴 */
let vmenu='dash';
const VMENU={dash:'대시보드',docs:'계약 서류'};
/* v5.17 재평가 중(이전 승인 있음)이어도 메뉴는 그대로 사용 */
const isVendorApproved=()=>!!(state&&!state.staff&&state.company&&state.company.status==='VERIFIED'&&(state.company.submissionStatus==='APPROVED'||!!state.company.renewAt));
/** 메뉴 버튼 보이기 (display 때마다) */
function setupVMenu(){const ap=isVendorApproved();
 document.querySelectorAll('.vmb').forEach(b=>b.classList.toggle('hidden',!ap));
 if(!VMENU[vmenu])vmenu='dash';
 $('myTab').classList.toggle('hidden',ap);if(!state.staff&&state.company)$('myTab').textContent=ap?'내 업무':'계약 전 서류';if(ap)markVMenu()}
function markVMenu(){document.querySelectorAll('.vmb').forEach(b=>b.classList.toggle('active',b.id==='vm_'+vmenu));if(tab==='my'&&isVendorApproved())$('pageTitle').textContent=VMENU[vmenu]}
/** 메뉴 이동 · 예전 메뉴 이름으로 부르면 대시보드 */
function vgo(m){if(typeof setTopGuide==='function')setTopGuide('');if(!VMENU[m])m='dash';vmenu=m;toggleMenu(false);if(typeof stopScan==='function')stopScan();if(typeof MEET_TOKEN!=='undefined')MEET_TOKEN='';if(tab!=='my')switchTab('my');markVMenu();window.scrollTo(0,0);
 if(!$('execArea')){renderMy();return}  // 참석 체크 화면 뒤에는 업체 화면을 다시 그림
 if(m==='docs'){renderVDocs();return}renderDash()}
/** 승인 후 화면 시작 (renderMy에서 호출) */
function vStart(){markVMenu();if(vmenu==='docs')return renderVDocs();renderDash()}
/* ---------- 대시보드 ---------- */
function renderDash(){const el=$('execArea');if(!el)return;if(typeof caCur!=='undefined')caCur='';
 const cb=state.company||{},cv=cb.valid,rn=cb.renewAt?{DRAFT:'작성 중',CORRECTION:'보완 요청',SUBMITTED:'본사 검토 중',SAFETY_REVIEW:'본사 검토 중'}[cb.submissionStatus]||'진행 중':'';
 el.innerHTML='<div class="card"><h2 style="margin:0">'+escapeText(cb.company||'')+'</h2><div class="muted">'+escapeText(cb.industry||'')+'</div>'
  +'<button class="linkbtn" type="button" style="font-size:13px;margin:4px 0 0" onclick="openEvalResult(\'CE\')">계약 전 평가 결과 보기</button>'
  +(rn?'<button class="vtodo" type="button" onclick="vgo(\'docs\')"><span>신규 작성 (다음 계약 준비)</span><span class="req">'+escapeText(rn)+' ›</span></button>':cv&&(cv.expired||cv.days<=30)?validNote(cb)+'<button class="vtodo" type="button" onclick="openNewContract()"><span>신규 작성 (다음 계약 준비)</span><span class="req">'+(cv.expired?'만료':'D-'+cv.days)+' ›</span></button>':'')+'</div>'
  +'<div id="caBox">'+(typeof caCardHtml==='function'?caCardHtml():'')+'</div>';if(typeof caVLoad==='function')caVLoad()}
/** 고르기 창 (업체·도급인 공용) · items = [[누르면 실행할 코드, 제목 HTML, 설명 HTML]] */
function jobPick(title,items){let el=$('dsDlg');if(!el){el=document.createElement('div');el.id='dsDlg';el.className='pickbg';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','dsTitle');el.onclick=e=>{if(e.target===el)closeDayStart()};el.onkeydown=e=>{if(e.key==='Escape')closeDayStart()};document.body.appendChild(el)}
 el.innerHTML='<div class="picksheet"><h2 id="dsTitle" style="margin:0 0 8px">'+escapeText(title)+'</h2>'+items.map(([fn,t,s])=>'<button class="jobitem" type="button" onclick="closeDayStart();'+fn+'"><div><b>'+t+'</b><div class="muted">'+s+'</div></div><span aria-hidden="true">›</span></button>').join('')+'<button class="button ghost" type="button" style="width:100%;margin-top:8px" onclick="closeDayStart()">닫기</button></div>';el.style.display='flex';setTimeout(()=>el.querySelector('.jobitem')?.focus(),30)}
function closeDayStart(){const el=$('dsDlg');if(el)el.style.display='none'}
/* ---------- 계약 서류 ---------- */
function renderVDocs(){const el=$('execArea');if(!el)return;const b=state.company,rows=((state.docBoard&&state.docBoard.rows)||[]).filter(r=>r.stage==='CONTRACT'&&r.vendorDoc);
 // v5.17 재평가 중: 계약 전 화면(사업장 정보·규정·계획서·제출)을 그대로 보여 줌
 if(b.renewAt){el.innerHTML='<div class="card"><div class="vh-top"><h2 style="margin:0">신규 작성 · 다음 계약 준비</h2><span class="pill lock">'+(b.renewMode==='NEW'?'처음부터 작성':'이전 정보 불러옴')+'</span></div><p class="desc">아래를 작성해 제출하면 본사 담당자가 다시 검토합니다.</p>'+validNote(b)
  +(b.submissionStatus==='DRAFT'?'<button class="button ghost" type="button" style="width:100%;margin-top:10px" onclick="cancelNewContract()">↩ 신규 작성 취소 (잘못 눌렀을 때 · 제출 전만)</button>':'')+'</div>'+contractHomeHtml(b);return}
 el.innerHTML='<div class="card"><div class="vh-top"><h2 style="margin:0">계약 서류</h2><span class="pill '+(b.valid&&b.valid.expired?'todo':'ok')+'">'+(b.valid&&b.valid.expired?'계약 전 평가 만료':'계약 전 검토 승인')+'</span></div>'+validNote(b)
  +(rows.map(r=>{const u=r.uploads[0];return '<div class="item"><b>'+escapeText(r.name)+'</b><div class="muted">'+(u?'<a onclick="viewFile(\''+escapeText(u.id)+'\')">'+escapeText(u.name)+'</a> · '+escapeText(fmtTime(u.uploadedAt)):'제출 기록 없음')+'</div></div>'}).join('')||'<p class="muted">제출한 서류가 없습니다.</p>')
  +'<div class="line"></div>'+newContractCard(true)+'</div>'}
/* ---------- v5.17 신규 작성 (다음 계약 준비) ---------- */
/** 대시보드·계약 서류 화면의 [신규 작성] 카드 (inner=true면 카드 안에 넣는 모양) */
function newContractCard(inner){const b=state.company||{},v=b.valid,need=v&&(v.expired||v.days<=30);
 const body='<div class="vh-top"><h2 style="margin:0">신규 작성 · 다음 계약 준비</h2>'+(need?'<span class="pill todo">'+(v.expired?'평가 만료':'D-'+v.days)+'</span>':'')+'</div>'
  +'<p class="desc">처음 계약 때와 같은 순서로 다시 작성합니다. 전에 쓴 정보를 불러올 수도 있습니다.</p>'
  +(v&&!v.expired?'<p class="muted">지금 계약 전 평가는 '+escapeText(v.until)+'까지 유효합니다.</p>':'')
  +'<button class="button" type="button" style="width:100%;margin-top:8px" onclick="openNewContract()">＋ 신규 작성</button>';
 return inner?body:'<div class="card">'+body+'</div>'}
/** [신규 작성] 누르면: 이전 정보 불러오기 / 처음부터 새로 작성 / 취소 */
function openNewContract(){let el=$('ncDlg');if(!el){el=document.createElement('div');el.id='ncDlg';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-labelledby','ncTitle');el.style.cssText='position:fixed;inset:0;background:#0007;z-index:9000;display:flex;align-items:center;justify-content:center;padding:16px';document.body.appendChild(el)}
 el.innerHTML='<div class="card" style="max-width:420px;width:100%;margin:0"><h2 id="ncTitle">신규 작성</h2><p class="desc"><b>전에 입력한 정보를 불러올까요?</b></p>'
  +'<ul class="desc" style="padding-left:18px;margin:6px 0 12px"><li><b>이전 정보 불러오기</b>: 채워진 상태로 시작합니다. 바뀐 곳만 고치면 됩니다.</li><li><b>처음부터 새로 작성</b>: 빈칸으로 시작합니다. (예전 기록은 보관됩니다)</li></ul>'
  +'<p class="muted">규정·계획서는 다시 서명해야 제출할 수 있습니다. 제출 전까지는 [계약 서류]의 <b>[신규 작성 취소]</b>로 되돌릴 수 있습니다.</p>'
  +'<div style="display:grid;gap:8px;margin-top:12px"><button class="button" type="button" onclick="doNewContract(\'KEEP\')">이전 정보 불러오기</button><button class="button dark" type="button" onclick="doNewContract(\'NEW\')">처음부터 새로 작성</button><button class="button ghost" type="button" id="ncCancel" onclick="closeNewContract()">취소 (시작하지 않음)</button></div></div>';
 // F1.7e 실수로 Enter를 눌러도 시작되지 않게 처음 선택은 [취소]
 el.style.display='flex';el.onclick=e=>{if(e.target===el)closeNewContract()};el.onkeydown=e=>{if(e.key==='Escape')closeNewContract()};setTimeout(()=>$('ncCancel')&&$('ncCancel').focus(),0)}
/** F1.7e [신규 작성 취소]: 제출 전(작성 중)일 때만 · 시작 전 승인 상태와 사업자·사업장 정보로 되돌림 */
async function cancelNewContract(){
 if(!confirm('신규 작성을 취소할까요?\n\n· 시작하기 전의 승인 상태로 돌아갑니다 (유효기간도 그대로)\n· 사업자 정보·사업장 정보는 시작 전 내용으로 되돌립니다\n· 작성 중에 올린 서류는 기록으로만 남고, 승인에는 쓰이지 않습니다'))return;
 const done=s=>{vmenu='docs';display(s);window.scrollTo(0,0);msg('신규 작성을 취소했습니다. 원래 승인 상태로 돌아왔습니다.')};
 try{done(await call('cancelRenewal'))}catch(e){
  try{const s=await callQuiet('portalData');if(s.company&&!s.company.renewAt&&s.company.submissionStatus==='APPROVED'){done(s);return}}catch(x){}}}
function closeNewContract(){const el=$('ncDlg');if(el)el.style.display='none'}
async function doNewContract(mode){closeNewContract();
 if(mode==='NEW'&&!confirm('빈칸으로 새로 작성할까요?\n사업자·사업장 정보와 규정·계획서를 처음부터 다시 입력합니다.\n\n(제출하기 전까지는 [신규 작성 취소]로 되돌릴 수 있습니다)'))return;
 if(mode!=='NEW'&&!confirm('이전 정보를 불러와 신규 작성(다음 계약 준비)을 시작할까요?\n\n(제출하기 전까지는 [신규 작성 취소]로 되돌릴 수 있습니다)'))return;
 if(mode==='NEW'){try{localStorage.removeItem(plKey())}catch(e){}}  // 계획서 임시 저장본도 비움
 const done=s=>{vmenu='docs';display(s);window.scrollTo(0,0);msg(s.company&&s.company.renewMode==='NEW'?'신규 작성을 시작했습니다. 빈칸을 채워 제출해 주세요.':'이전 정보를 불러왔습니다. 바뀐 곳만 고쳐서 제출해 주세요.')};
 try{done(await call('startRenewal',mode))}catch(e){
  // 응답만 사라지고 서버는 처리했을 수 있음 → 현재 상태를 다시 받아 시작됐으면 그대로 진행
  try{const s=await callQuiet('portalData');if(s.company&&s.company.renewAt){done(s);return}}catch(x){}}}
