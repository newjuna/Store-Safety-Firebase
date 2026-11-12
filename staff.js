/* 담당자·마스터 화면 (S1) — 입고도우미 · 재고조사
 *  메뉴: 대시보드 / 업체 안내문 / 업체 현황 · (안전보건팀) 매장 목록 / 부서 관리 · (마스터) 표준양식 관리 / 조직도 / 데이터 관리
 *  S2~ 매장 · 점장 점검 · 시정요구서 · 협의체 메뉴가 차례로 들어옴
 *  화면은 지금 'jobs' 칸에 그림 (loadJobs → renderJobs) */
let smenu='dash',svData=null,svFilter='all';
const SMENU={dash:'대시보드',flyer:'업체 안내문',vendors:'업체 현황',check:'점검 현황',ca:'시정요구서',co:'협의체',joint:'합동점검',items:'점검 항목',stores:'매장 목록',depts:'부서 관리',tpl:'표준양식 관리',staff:'조직도',data:'데이터 관리',principal:'도급인 책임자'};
const isSafetyUI=()=>!!(state&&(state.isMaster||(state.staff&&state.staff.role==='SAFETY')));
const isStaffUI=()=>!!(state&&state.staff);
const isCsUI=()=>!!(state&&state.staff&&state.staff.cs&&!state.isMaster);  // S7 CS팀 담당자 = 합동점검 메뉴만
const kstToday=()=>new Date(Date.now()+9*3600e3).toISOString().slice(0,10);
const sum=(l,f)=>l.reduce((s,x)=>s+(Number(f(x))||0),0);
function sNone(t){return '<div class="card"><p class="desc">'+t+'</p></div>'}
/** 메뉴 보이기 (display 때마다) · 관리 메뉴는 마스터만 */
function setupSMenu(){const on=isStaffUI(),cs=isCsUI();
 document.querySelectorAll('.smb').forEach(b=>b.classList.toggle('hidden',!on||(cs&&b.id!=='sm_joint')||(b.dataset.master==='1'&&!state.isMaster)||(b.dataset.safety==='1'&&!isSafetyUI())));
 if(!on)return;if(cs)smenu='joint';['myTab','adminTab','reviewTab','tplTab','jobsTab','staffTab'].forEach(id=>$(id)&&$(id).classList.add('hidden'));
 markSMenu();if(tab==='my'&&!/^MEET-/.test(LINK_REVIEW))setTimeout(()=>sgo(smenu),0)}
function markSMenu(){if(!isStaffUI())return;document.querySelectorAll('.smb').forEach(b=>b.classList.toggle('active',b.id==='sm_'+smenu));$('pageTitle').textContent=SMENU[smenu]||''}
/** 메뉴 이동 · 예전 메뉴 이름으로 부르면 대시보드 */
function sgo(m){if(typeof setTopGuide==='function')setTopGuide('');if(!SMENU[m])m='dash';if(isCsUI())m='joint';if(typeof jtReset==='function'&&m!==smenu)jtReset();if(['tpl','staff','data','principal'].includes(m)&&!state.isMaster)m='dash';if(['stores','depts','items'].includes(m)&&!isSafetyUI())m='dash';if(typeof stReset==='function')stReset();if(typeof ckReset==='function')ckReset();smenu=m;toggleMenu(false);if(typeof stopScan==='function')stopScan();
 if(['tpl','staff','vendors'].includes(m)){switchTab(m);markSMenu();return}
 if(tab!=='jobs')switchTab('jobs');else loadJobs();markSMenu();window.scrollTo(0,0)}
/** 알림 숫자 (showBadges에서 호출) · 업체 현황 = 가입 승인 대기 + 제출자료 검토 */
function sBadges(b){if(!isStaffUI())return;b=b||{};const vd=(b.admin||0)+(b.review||0);setBadge($('sm_vendors'),vd);setBadge($('menuBtn'),vd)}
/* ---------- 'jobs' 칸 화면 (메뉴별) ---------- */
function renderJobs(){jobsMode='list';roomId='';clearInterval(roomTimer);const d=jobData;if(!d)return;if(typeof setTopGuide==='function')setTopGuide('');
 const H={flyer:sFlyer,dash:sDash,data:sData,principal:sPrincipal,stores:sStores,depts:sDepts,check:sChk,ca:sCa,co:sCo,joint:sJt,items:sItems}[smenu]||sDash;$('jobs').innerHTML=H(d)}
/** 대시보드 (S1 최소) · S4에서 매장 점검 현황으로 바뀜 */
function sDash(d){const B=(state&&state.badges)||{},me=(d&&d.me)||state.staff||{};
 const todo=[['vendors','가입 승인 대기',B.admin||0,'곳'],['vendors','제출자료 검토',B.review||0,'건']].filter(x=>x[2]>0)
  .map(([m,t,n,u])=>'<button class="vtodo" type="button" onclick="sgo(\''+m+'\')"><span>'+escapeText(t)+'</span><span class="req">'+n+u+' ›</span></button>').join('');
 return '<div class="card"><h2 style="margin:0">'+escapeText(me.name||'')+' 님</h2><div class="muted">'+escapeText(kstToday())+'</div></div>'
  +'<button class="vtodo" type="button" onclick="sgo(\'check\')"><span>점장 점검 현황</span><span>보기 ›</span></button>'
  +'<div class="card"><h2>처리할 일</h2>'+(todo||'<div class="note">처리할 일이 없습니다.</div>')+'</div>'}
/* ---------- 업체 현황 (사업자 승인 + 제출자료 검토) ---------- */
const SV_ST=b=>b.status==='PENDING'?['가입 승인 대기','bad','pending']:b.status==='REJECTED'?['반려','todo','etc']:b.renewAt&&b.submissionStatus!=='APPROVED'?(['SUBMITTED','SAFETY_REVIEW'].includes(b.submissionStatus)?['재평가 검토 중','bad','review']:['재평가 '+(b.submissionStatus==='CORRECTION'?'보완 요청':'작성 중'),'todo','draft']):b.submissionStatus==='APPROVED'&&b.valid&&b.valid.expired?['평가 만료','todo','draft']:({DRAFT:['서류 작성 중','todo','draft'],CORRECTION:['보완 요청','todo','draft'],SUBMITTED:['1차 검토 중','bad','review'],SAFETY_REVIEW:['확인 중','bad','review'],APPROVED:['승인 완료','ok','ok']}[b.submissionStatus||'DRAFT']||[b.submissionStatus,'todo','etc']);
async function loadVendors(){if(!svData)svData=cacheGet('vendorList',[]);if(svData){seenTab.vendors=1;renderVendors()}try{const x=await fetcher('vendors')('vendorList');svData=x;if(tab==='vendors')renderVendors()}catch(e){}}
function svSet(f){svFilter=f;renderVendors()}
function renderVendors(){const L=svData.list,F=[['all','전체'],['pending','가입 대기'],['draft','작성 중'],['review','검토 중'],['ok','승인']],cnt=k=>k==='all'?L.length:L.filter(b=>SV_ST(b)[2]===k).length,list=L.filter(b=>svFilter==='all'||SV_ST(b)[2]===svFilter);
 $('vendors').innerHTML=gdRow('vendors')+'<div class="card"><h2 style="margin:0">업체 현황</h2><div class="seg" role="tablist">'+F.map(([k,l])=>'<button type="button" role="tab" aria-selected="'+(svFilter===k)+'" class="'+(svFilter===k?'on':'')+'" onclick="svSet(\''+k+'\')">'+l+' '+cnt(k)+'</button>').join('')+'</div></div>'
  +'<div class="card">'+(list.map(b=>{const st=SV_ST(b),e=b.contractEval;
   return '<details class="svitem"><summary><div><b>'+escapeText(b.company)+'</b> <span class="pill '+st[1]+'">'+escapeText(st[0])+'</span><div class="muted">'+escapeText(b.industry)+'</div></div></summary>'
    +'<table class="rtable" style="margin-top:8px"><tr><th>대표자</th><td>'+escapeText(b.representative)+'</td></tr><tr><th>담당자</th><td>'+escapeText(b.contact)+' · '+escapeText(b.phone)+'</td></tr><tr><th>사업자번호</th><td>'+escapeText(b.regNo)+'</td></tr><tr><th>업체 계정</th><td>'+escapeText(b.email)+'</td></tr><tr><th>승인 담당자</th><td>'+escapeText(b.approverEmail||'-')+'</td></tr>'
    +(e?'<tr><th>계약 전 평가</th><td>우수 '+e.good+' · 보통 '+e.normal+' · 미흡 '+e.poor+' <span class="muted">'+escapeText(fmtTime(e.at))+'</span> <button class="linkbtn" type="button" onclick="openEvalResult(\'CE_'+escapeText(b.id)+'\')">결과 보기</button></td></tr>':'')
    +(b.valid?'<tr><th>평가 유효기간</th><td>'+escapeText(b.valid.from)+' ~ '+escapeText(b.valid.until)+' '+(b.valid.expired?'<b class="req">만료</b>':b.valid.days<=30?'<b class="req">D-'+b.valid.days+'</b>':'<span class="muted">D-'+b.valid.days+'</span>')+(b.renewAt?'<div class="muted">재평가 진행 중 (시작 '+escapeText(fmtTime(b.renewAt))+')</div>':'')+'</td></tr>':'')+'</table>'
    +(b.docs.length?'<div class="stage">제출 서류</div>'+b.docs.map(t=>'<div class="muted">'+escapeText(t.name)+': '+(t.uploads.length?t.uploads.slice(0,1).map(u=>'<a onclick="downloadAdminFile(\''+escapeText(b.id)+'\',\''+escapeText(u.id)+'\')">v'+escapeText(u.version)+' '+escapeText(u.name)+'</a>').join(''):'미제출')+'</div>').join('')+(b.evidence.length?'<div class="muted">계획서 증빙: '+b.evidence.map(u=>'<a onclick="downloadAdminFile(\''+escapeText(b.id)+'\',\''+escapeText(u.id)+'\')">'+escapeText(u.name)+'</a>').join(' ')+'</div>':''):'')
    +(st[2]==='pending'?'<div class="row" style="margin-top:10px">'+(b.certMissing?'':'<button class="button ghost" type="button" onclick="registrationDocs(\''+escapeText(b.id)+'\')">사업자등록증</button>')+'<button class="button" type="button" onclick="svDecide(\''+escapeText(b.id)+'\',\'APPROVE\')">가입 승인</button><button class="button ghost" type="button" onclick="svDecide(\''+escapeText(b.id)+'\',\'REJECT\')">반려</button></div>':'')+'</details>'}).join('')||'<p class="muted">해당하는 업체가 없습니다.</p>')+'</div>'}
async function svDecide(id,d){const reason=d==='REJECT'?prompt('반려 사유를 입력하세요.'):'';if(d==='REJECT'&&reason===null)return;if(!confirm(d==='APPROVE'?'가입을 승인할까요?\n업체는 바로 계약 전 서류를 작성할 수 있습니다.':'가입을 반려할까요?'))return;
 try{const r=await call('decideBusiness',id,d,reason,'vendors');svData=r&&r.list?r:await call('vendorList');renderVendors();msg('처리했습니다.');refreshBadges()}catch(e){}}
