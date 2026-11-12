/* 공사 연장 · 공사 종료 · 공사 종료 평가 · 참조 알림 (v5.1)
 *  공사 카드 [연장·종료] → 새 종료일·사유로 연장 / [공사 종료] → 참여 업체마다 평가서 생성
 *  평가: 12항목을 수행 기록으로 자동 체크 → 담당자가 확인·수정 → [평가 확정] = 최종 (안전보건팀은 참조 알림)
 *  확정 후 [결과지 PDF] [전체 활동내역 ZIP] 내려받기 · 원본 기록은 지우지 않음
 *  서버: Code.gs (extendJob · endJob · jobEvalList · saveJobEval · reopenJobEval · jobEvalFile · noticeList · readNotices) */
const EV_LV={G:'우수',N:'보통',P:'미흡'},EV_CLS={G:'ok',N:'na',P:'bad'};
let evData=null,evCur=null;
const gradePill=g=>'<span class="pill '+(['S','A'].includes(g)?'ok':['C','D'].includes(g)?'bad':'todo')+'">'+escapeText(g)+'등급</span>';
/* ---------- 공사 카드: 기간 줄 ---------- */
/* ---------- 연장·종료 화면 ---------- */
/* ---------- 종료 평가 목록 (업체별) ---------- */
/* 점수 계산 (서버 evalScore_와 같은 규칙) */
/* ---------- 확정된 평가 보기 + 내려받기 ---------- */
/* ---------- F1.9w 비상훈련 결과보고서 (종료 평가 11번 옆) · 강평·문제점·개선사항·차기계획 = 자동 문장 (평가 확정 전까지 도급인이 고칠 수 있음)
 *  최종 PDF = 전체 활동내역 ZIP「3-7 비상대응훈련」(중계 서버가 같은 규칙으로 만듦 · 매일 저녁 미리 만들어 둠) ---------- */
/* ---------- F1.9x 12번 재해 = 산재 확인서(자동) + 공사 중 사고(도급인이 고름) ---------- */
/* F1.7b ZIP 바로 내려받기: [내려받기]를 누르면 드라이브 화면을 거치지 않고 다운로드 폴더로 받음 (본인 계정에만 보기 권한)
 *  안 받아지면(브라우저에 다른 구글 계정이 로그인된 경우 등) 드라이브 화면에서 ⬇ */
/** 내려받기를 누른 뒤 화면 아래에 [드라이브에서 열기] 버튼 (10초 동안) */
/** F1.7d 받을 파일이 여러 개(활동내역 ZIP + 원본파일 ZIP)일 때: 파일마다 [내려받기] 버튼
 *  (브라우저는 한 번 누를 때 다운로드 하나만 허용하므로 버튼을 하나씩 따로 둠) */
/* F1.8j ZIP 바로 내려받기: 드라이브 화면을 거치지 않고 8MB씩 받아 이어 붙여 휴대폰·PC에 저장 */
/* ---------- 업체 화면: 종료된 공사 ---------- */
/* ---------- 안전보건팀: 참조 알림 ---------- */
/* F1.9b 공사 만들기: 계약 전 평가 점수 · 70점 미만이면 고를 때 경고 창 (배정은 막지 않음) */
/* ---------- 공사 만들기: 업체 고를 때 지난 종료 평가 (C·D등급은 경고) ---------- */
/* =====================================================================
 * F1.9e 평가 결과 화면 (메일 버튼 · 종료 평가 · 업체 현황 · 업체 첫 화면에서 열림)
 *  총점 · 분야별 점수 · 12항목(점수·근거·의견) · 개선사항
 *  [❔ 사용 가이드] = 왜 이 점수인지 따라가기 (깎인 점수가 큰 항목부터) · [📋 평가 기준] = 같이 정한 기준
 * ===================================================================== */
let evRes=null;
const ER_PILL={G:'ok',N:'erN',P:'bad'},ER_SEC={A:['A','안전보건관리체제',20],B:['B','실행수준',40],C:['C','운영관리',20],D:['D','재해발생 수준',20]};
/** F1.9f 평가 항목표 (시안 2: No · 평가항목·근거 · 결과 · 점수 · 분야는 회색 줄 · 합계는 검정 줄)
 *  items = [{no, sec(A~D), name, lv, pts, max, why, memo}] */
function erTable(items,total,grade){let h='<table class="ertb"><thead><tr><th style="width:26px">No</th><th>평가항목 · 근거</th><th style="width:44px">결과</th><th style="width:52px;text-align:right">점수</th></tr></thead><tbody>';
 ['A','B','C','D'].forEach(k=>{const L=items.filter(x=>x.sec===k);if(!L.length)return;const sum=L.reduce((s,x)=>s+(x.pts||0),0),S=ER_SEC[k],lo=k!=='D'&&sum<S[2]/2;
  h+='<tr class="g" id="er_sg'+k+'"><td colspan="3">'+S[0]+'. '+escapeText(S[1])+(lo?' <span class="req">· 절반 미만 → D등급</span>':'')+'</td><td class="r">'+sum+'/'+S[2]+'</td></tr>';
  L.forEach(x=>{h+='<tr id="er_it'+escapeText(x.no)+'"><td class="muted">'+escapeText(x.no)+'</td><td>'+escapeText(x.name)+((x.why||x.memo)?'<div class="muted">'+escapeText(x.why||'')+(x.why&&x.memo?' · ':'')+escapeText(x.memo||'')+'</div>':'')+'</td><td class="erlv '+escapeText(x.lv||'')+'">'+(EV_LV[x.lv]||'-')+'</td><td class="r">'+(x.pts||0)+'<span class="muted" style="font-weight:400">/'+x.max+'</span></td></tr>'})});
 return h+'<tr class="tot" id="er_sum"><td colspan="3">합계 · 등급</td><td class="r">'+total+' · '+escapeText(grade)+'</td></tr></tbody></table>'}
/** 메일 버튼(?evres=…&go=gd|crit)으로 들어오면 로그인 뒤 한 번 열기 */
let evresAsked=false;
function evresPending(){let p=null;try{p=JSON.parse(localStorage.getItem('evresGo')||'null')}catch(e){}if(!p||!p.r)return;const drop=()=>{try{localStorage.removeItem('evresGo')}catch(e){}};if(Date.now()-Number(p.t||0)>7200000){drop();return}
 /* F1.9i 링크가 누구용인지와 지금 접속 구분이 다르면 → 맞는 구분으로 다시 로그인 안내 (예: 안전보건팀 참조 메일인데 협력업체로 접속) */
 const want=p.f==='staff'?'STAFF':p.f==='vendor'?'VENDOR':'',isStaff=!!(state&&state.staff);
 if(want&&(want==='STAFF')!==isStaff){if(evresAsked)return;evresAsked=true;const W=want==='STAFF'?'다이소 담당자':'협력업체';
  popup('📊 '+W+'용 평가 결과 링크입니다','이 평가 결과는 ['+W+']로 로그인해야 볼 수 있습니다.\n지금은 '+(isStaff?'다이소 담당자':'협력업체')+'로 접속되어 있습니다.','다시 로그인',()=>{try{localStorage.setItem('loginMode',want)}catch(e){}relogin()},drop,'닫기');return}
 drop();msg('평가 결과를 여는 중입니다…');openEvalResult(p.r,p.g)}
async function openEvalResult(ref,go,jobId){let r;try{r=await call('evalResult',ref,jobId||'')}catch(e){return}evRes=r;renderEvalResult();if(go==='gd')setTimeout(()=>startTour('evres'),500);else if(go==='crit')setTimeout(evCritOpen,300)}
function erCss(){if($('erCss'))return;const s=document.createElement('style');s.id='erCss';s.textContent=
 '#evres{position:fixed;inset:0;z-index:80;background:var(--bg);overflow:auto;-webkit-overflow-scrolling:touch}.pill.erN{background:#fff7ed;color:#b45309}'
 +'.erbig{font-size:36px;font-weight:800;line-height:1.1;color:var(--main)}.erbar{height:8px;background:#e5e7eb;border-radius:8px;overflow:hidden;margin:3px 0 10px}.erbar span{display:block;height:100%;background:var(--main)}.erbar span.low{background:var(--accent)}'
 +'.erit{display:flex;gap:8px;align-items:center;padding:10px 0;border:0;border-top:1px solid var(--line);width:100%;background:none;text-align:left;font:inherit;color:inherit;cursor:pointer}.erit .no{width:22px;color:#9ca3af;font-weight:700;flex:none}.erit .pt{margin-left:auto;font-weight:700;white-space:nowrap}'
 +'.erwhy{display:none;font-size:13px;background:var(--bg);border-radius:8px;padding:8px 10px;margin:0 0 8px;line-height:1.6}.eritw.open .erwhy{display:block}'
 +'.ertb{width:100%;border-collapse:collapse;font-size:13px}.ertb th{font-size:12px;color:var(--sub);font-weight:600;text-align:left;padding:6px 4px;border-bottom:2px solid var(--main)}.ertb td{padding:8px 4px;border-bottom:1px solid var(--line);vertical-align:top}.ertb td.r{text-align:right;white-space:nowrap;font-weight:700}.ertb tr.g td{background:var(--bg);font-weight:700;font-size:12px;padding:5px 4px}.ertb .erlv{font-weight:700;white-space:nowrap}.ertb .erlv.P{color:var(--accent)}.ertb .erlv.N{color:#b45309}.ertb .erlv.G{color:var(--ok)}.ertb tr.tot td{background:var(--main);color:#fff;font-weight:700;font-size:14px;border:0;padding:10px 8px}.ertb tr.tot td:first-child{text-align:right;border-radius:0 0 0 8px}.ertb tr.tot td.r{border-radius:0 0 8px 0}'
 +'#evcrit{position:fixed;inset:0;z-index:82;background:rgba(15,23,42,.55);display:flex;align-items:flex-end;justify-content:center}#evcrit .ercsheet{background:#fff;width:100%;max-width:560px;max-height:88vh;overflow:auto;border-radius:18px 18px 0 0;padding:18px 16px 24px}'
 /* F1.9k 평가 기준 표: 첫 칸(항목)은 줄바꿈 없이 내용 길이만큼 · 글씨 조금 작게 · 둘째 칸은 단어 단위로 줄바꿈 */
 +'#evcrit table{width:100%;border-collapse:collapse}#evcrit td{font-size:12.5px;line-height:1.5;padding:7px 5px;border-top:1px solid var(--line);vertical-align:top;word-break:keep-all;overflow-wrap:anywhere}'
 +'#evcrit td:first-child{white-space:nowrap;width:1%;padding-right:10px;font-weight:600}#evcrit td:last-child{white-space:normal}#evcrit td:nth-child(3){white-space:nowrap;width:1%;text-align:right}#evcrit,#evcrit *{box-sizing:border-box}#evcrit table{table-layout:auto;max-width:100%}'
 /* F1.9m 점수·등급 탭 표 */
 +'#evcrit .ecs td:first-child{width:auto}#evcrit .ecs td.n{width:52px;text-align:center;white-space:nowrap}#evcrit .ecs .hd td.n{font-size:12px}#evcrit .ecs tr:not(.hd):not(.g):not(.tot) td.n:nth-child(2){color:var(--ok,#15803d);font-weight:700}'
 +'#evcrit .ecs tr.g td{background:var(--bg);font-weight:700;font-size:12px;border-top:1px solid #d1d5db}#evcrit .ecs tr.g td.n{color:var(--sub)}#evcrit .ecs tr.tot td{background:var(--main);color:#fff;font-weight:700;border:0}#evcrit .ecs tr.tot td:first-child{border-radius:0 0 0 8px}#evcrit .ecs tr.tot td.n{border-radius:0 0 8px 0}'
 +'#evcrit .egr{table-layout:fixed}#evcrit .egr td.c{width:20%;text-align:center;white-space:nowrap;font-weight:400;padding:7px 2px;border:1px solid var(--line)}#evcrit .egr .hd td.c{font-size:15px;font-weight:800;background:var(--bg)}#evcrit .egr .hd td.c:last-child{color:var(--accent,#d7262e)}#evcrit .hd td{background:var(--bg);font-weight:700;font-size:12px}'
 +'#evcrit h3{font-size:14px;margin:14px 0 6px}#evcrit .muted{font-size:11.5px}@media(max-width:380px){#evcrit td{font-size:12px;padding:6px 4px}#evcrit .ercsheet{padding:16px 12px 22px}}'
 +'.ertabs{display:flex;gap:6px;margin:10px 0}.ertabs button{flex:1;border:1px solid var(--line);background:#fff;border-radius:9px;padding:8px 4px;font:inherit;font-size:13px;cursor:pointer}.ertabs button[aria-selected=true]{background:var(--main);color:#fff;border-color:var(--main)}';document.head.appendChild(s)}
function renderEvalResult(){const r=evRes;if(!r)return;erCss();let el=$('evres');if(!el){el=document.createElement('div');el.id='evres';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.addEventListener('keydown',e=>{if(e.key==='Escape'&&!(typeof tour!=='undefined'&&tour)&&!$('evcrit'))closeEvalResult()});document.body.appendChild(el)}
 el.setAttribute('aria-label',r.title);document.body.style.overflow='hidden';
 const gl=['S','A'].includes(r.grade)?'G':r.grade==='B'?'N':'P',low=r.items.filter(x=>x.lv&&x.lv!=='G').sort((p,q)=>(q.max-q.pts)-(p.max-p.pts)),good=r.items.filter(x=>x.lv==='G');
 el.innerHTML='<div class="pbar"><button class="button ghost" type="button" onclick="closeEvalResult()">‹ 이전으로</button><b class="pbt">'+escapeText(r.title)+'</b><span style="width:64px"></span></div><div class="cwrap" style="max-width:640px;margin:0 auto">'
  +'<div class="card" id="er_tot"><div class="row" style="justify-content:space-between;gap:6px"><b>'+escapeText(r.title)+'</b><span class="row" style="gap:6px">'+gdBtn('evres')+'<button type="button" class="button ghost" style="padding:4px 8px;font-size:12px" id="erCrit" onclick="evCritOpen()">📋 평가 기준</button></span></div>'
  +'<div class="muted" style="margin-top:4px">'+escapeText(r.sub)+(r.evaluator?' · 평가 '+escapeText(r.evaluator):'')+'</div>'
  +'<div class="row" style="align-items:flex-end;gap:8px;margin-top:10px"><span class="erbig">'+r.total+'</span><span class="muted" style="font-size:14px">/ 100점</span><span class="pill '+ER_PILL[gl]+'" style="margin-left:auto">'+escapeText(r.grade)+'등급</span></div></div>'
  +'<div class="card" id="er_items" style="padding:12px"><b>평가 항목표</b><div style="margin-top:8px;overflow-x:auto">'+erTable(r.items,r.total,r.grade)+'</div></div>'
  +'<div class="card" id="er_cmt"><b>'+(r.kind==='JE'?'개선사항 (다음 계약 때 안내)':'검토 의견')+'</b><p style="margin:6px 0 0;white-space:pre-line">'+escapeText(r.comment||'없음')+'</p></div></div>';
 el.scrollTop=0;
 /* 가이드: 총점 → 가장 많이 깎인 분야 → 깎인 항목(큰 순) → 우수 항목 → 의견 → 기준 버튼 */
 const sl=r.sec.slice().sort((a,b)=>(b[3]-b[2])/b[3]-(a[3]-a[2])/a[3])[0],T=t=>String(t||'').replace(/\s*\n\s*/g,' · ');
 TOUR_STEPS.evres=[{sel:'#gd_evres',text:'평가 결과 가이드입니다. 왜 이 점수가 나왔는지 하나씩 따라가 봅니다.'},
  {sel:'#er_tot',text:'총점 '+r.total+'점이라 '+r.grade+'등급입니다. (S 90 · A 80 · B 70 · C 60점 이상 · D 60점 미만)'+(r.limited?' 한 분야가 배점의 절반이 안 돼서 총점과 상관없이 D등급입니다.':'')},
  {sel:'#er_sg'+sl[0],text:sl[2]>=sl[3]?'모든 분야가 만점입니다.':sl[1]+' 분야가 '+sl[2]+'/'+sl[3]+'점으로 가장 많이 깎였습니다.'+(sl[0]!=='D'&&sl[2]<sl[3]/2?' 절반이 안 돼서 D등급이 됩니다.':'')}]
  .concat(low.map(x=>({sel:'#er_it'+x.no,text:T(x.no+'번 '+x.name+' '+EV_LV[x.lv]+' ('+x.pts+'/'+x.max+'점 · -'+(x.max-x.pts)+'점) — '+(x.why||'')+(x.memo?' · '+x.memo:''))})))
  .concat([{sel:'#er_it'+((good[0]||r.items[0]).no),text:low.length?'우수 항목('+good.map(x=>x.no).join('·')+'번)은 기준을 다 채운 것입니다. 항목 이름 아래 작은 글씨가 근거입니다.':r.items.length+'개 항목 모두 우수입니다.'},
   {sel:'#er_sum',text:'맨 아래 검정 줄이 합계와 등급입니다. 분야별 소계(회색 줄)를 더한 점수입니다.'},
   {sel:'#er_cmt',text:r.kind==='JE'?'평가자가 남긴 개선사항입니다. 다음 계약 때 이 부분을 보완하면 점수가 올라갑니다.':'검토자 의견입니다. 보완 요청이면 이 내용대로 고쳐서 다시 제출합니다.'},
   {sel:'#erCrit',tap:1,text:'기준이 궁금하면 [📋 평가 기준]을 누르세요. 배점·등급·자동 체크 규칙이 모두 나옵니다.'}]);
 setTimeout(()=>$('gd_evres')?.focus({preventScroll:true}),50)}
function erToggle(b){const w=b.parentNode;w.classList.toggle('open');b.setAttribute('aria-expanded',w.classList.contains('open'))}
function closeEvalResult(){if(typeof tour!=='undefined'&&tour)endTour(true);$('evcrit')?.remove();$('evres')?.remove();document.body.style.overflow='';evRes=null}
/** F1.9m 점수·등급 탭: 배점표(분야 묶음 줄 + 항목별 우수/보통/미흡 칸) · 등급표 · 등급별 조치표 */
function erScoreTbl(){
 const G=[['A 관리체제',20,[['1 방침',5,3],['2 목표·지표',10,5],['3 조직',5,3]]],['B 실행수준',40,[['4 위험성평가',5,3],['5 점검',10,5],['6 이행확인',10,5],['7 교육',5,3],['8 작업허가',10,5]]],
  ['C 운영관리',20,[['9 신호·연락',5,3],['10 설비',10,5],['11 비상대책',5,3]]],['D 재해',20,[['12 산재',20,10]]]];
 return '<table class="ecs"><tr class="hd"><td>항목</td><td class="n">우수</td><td class="n">보통</td><td class="n">미흡</td></tr>'
  +G.map(g=>'<tr class="g"><td colspan="3">'+g[0]+'</td><td class="n">'+g[1]+'점</td></tr>'+g[2].map(r=>'<tr><td>'+r[0]+'</td><td class="n">'+r[1]+'</td><td class="n">'+r[2]+'</td><td class="n">1</td></tr>').join('')).join('')
  +'<tr class="tot"><td colspan="3">합계 (모두 우수일 때)</td><td class="n">100점</td></tr></table>';
}
/** 📋 평가 기준 (그동안 정한 기준 · 탭 3개) */
const ER_CRIT=[['점수·등급','<h3>배점 (100점)</h3>'+erScoreTbl()+'<p class="muted">미흡은 0점이 아니라 1점</p>'
 +'<h3>등급</h3><table class="egr"><tr class="hd"><td class="c">S</td><td class="c">A</td><td class="c">B</td><td class="c">C</td><td class="c">D</td></tr><tr><td class="c">90점 이상</td><td class="c">80점 이상</td><td class="c">70점 이상</td><td class="c">60점 이상</td><td class="c">60점 미만</td></tr></table>'
 +'<p class="muted">A·B·C 분야 중 하나라도 배점의 절반 미만이면 총점과 상관없이 <b>D</b></p>'
 +'<h3>등급에 따라</h3><table><tr class="hd"><td>조건</td><td>조치</td></tr><tr><td>70점 미만</td><td>도급인에게 경고 (서류 검토 화면 · 공사 배정 때) · 막지는 않음</td></tr><tr><td>D등급</td><td>업체가 계약 전 서류를 제출할 수 없음 · 부족한 항목 안내 + [바로 고치기]</td></tr><tr><td>종료 평가<br>C·D등급</td><td>다음 공사 배정 때 경고</td></tr></table>'],
 ['계약 전 평가','<h3>업체가 쓴 계획서로 자동 체크 → 검토자가 확인·수정</h3><table><tr class="hd"><td>항목</td><td>우수 조건</td></tr>'
 +'<tr><td>1 방침</td><td>규정 서명 + 방침 3줄 이상</td></tr><tr><td>2 목표</td><td>목표 + 성과지표 3개 이상</td></tr><tr><td>3 조직</td><td>현장대리인 이름·연락처 (이름만 = 보통)</td></tr>'
 +'<tr><td>4 위험성평가</td><td>해당 위험요인 3개 이상 체크</td></tr><tr><td>5 · 7 · 10</td><td>법정 기본값을 앱이 미리 채움 → 우수 (영세업체 배려 · 꼭 해야 하는 법적 사항)</td></tr>'
 +'<tr><td>6 이행확인</td><td>이행 사례 20자 이상 + 증빙 사진 = 우수 · 글만 = 보통 · 비우면 미흡</td></tr><tr><td>8 작업허가</td><td>작업허가 대상 공종이 있음</td></tr><tr><td>9 신호·연락</td><td>현장대리인 연락처</td></tr>'
 +'<tr><td>11 비상대책</td><td>시나리오 2개 이상 + 시나리오에 필요한 훈련을 모두 체크 (공통: 대피 경로 안내·비상대피 훈련 · 화재 → 소화기 · 감전 → 감전 사고 대응 · 추락·응급환자 → CPR) · 일부 빠지면 보통 · 없으면 미흡</td></tr><tr><td>12 산재</td><td>건수 기준 · 증빙 있음 + 0건 = 우수 · 2건 이하 = 보통 · <b>증빙 없으면 미제출 → 미흡</b> · 계획서 낸 뒤에도 [산재 확인서 추가 제출]로 올리면 자동으로 다시 계산</td></tr></table><p class="muted">평가 유효기간: 승인일부터 1년</p>'],
 ['종료 평가','<h3>종료 평가 = 계약 전 계획을 공사 중에 지켰는가 (실행률)</h3><table><tr class="hd"><td>항목</td><td>보는 것</td></tr>'
 +'<tr><td>1 · 2 · 3 · 10</td><td>계약 전 평가 결과 그대로</td></tr><tr><td>4 위험성평가</td><td>계획서 위험요인이 순회점검에서 \'양호\'였던 비율</td></tr><tr><td>5 점검</td><td>순회점검 횟수 ÷ (작업일 ÷ 2)</td></tr>'
 +'<tr><td>6 이행확인</td><td>미조치가 있으면 미흡 · 평균 3일 안에 조치 = 우수</td></tr><tr><td>7 교육</td><td>작업자 기초안전보건교육 이수증 제출 비율</td></tr><tr><td>8 작업허가</td><td>허가서를 쓴 날 ÷ 작업일</td></tr>'
 +'<tr><td>9 신호·연락</td><td>협의체·합동점검 참석률</td></tr><tr><td>11 비상대책</td><td>계획서에서 필요한 훈련(비상대피 · CPR · 소화기 · 감전 사고 대응) 모두 실시 + 평균 참석률 80% 이상 = 우수 · 비상대피는 했지만 빠진 훈련이 있거나 80% 미만 = 보통 · 비상대피 0회 = 미흡 · 하루에 여러 훈련도 각각 인정</td></tr><tr><td>12 재해</td><td>산재 확인서(계획서 증빙 · 나중에 추가 제출 포함) + 공사 중 사고 (담당자가 고름) · 확인서 없음 = 미흡 · 확인서 + 사고 없음 = 우수 · 확인서 + 1건 = 보통 · 2건 이상 = 미흡</td></tr></table>'
 +'<p class="muted">비율: 90% 이상 우수 · 60% 이상 보통 · 그 아래 미흡 · 공사가 끝날 때 하는 평가 = 반기 평가</p>']];
function evCritOpen(i){erCss();$('evcrit')?.remove();i=i==null?(evRes&&evRes.kind==='CE'?1:evRes&&evRes.kind==='JE'?2:0):i;const w=document.createElement('div');w.id='evcrit';w.setAttribute('role','dialog');w.setAttribute('aria-modal','true');w.setAttribute('aria-label','평가 기준');
 w.innerHTML='<div class="ercsheet"><div class="row" style="justify-content:space-between"><b style="font-size:17px">📋 평가 기준</b><button class="button ghost" type="button" id="evcritX" style="padding:6px 10px">✕ 닫기</button></div>'
  +'<div class="ertabs" role="tablist">'+ER_CRIT.map((c,k)=>'<button type="button" role="tab" aria-selected="'+(k===i)+'" onclick="evCritOpen('+k+')">'+escapeText(c[0])+'</button>').join('')+'</div>'+ER_CRIT[i][1]+'</div>';
 document.body.appendChild(w);const close=()=>w.remove();$('evcritX').onclick=close;w.addEventListener('click',e=>{if(e.target===w)close()});w.addEventListener('keydown',e=>{if(e.key==='Escape')close()});setTimeout(()=>w.querySelector('[aria-selected=true]')?.focus(),30)}
