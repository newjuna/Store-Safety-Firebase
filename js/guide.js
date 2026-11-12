/* =====================================================================
 * 화면 따라가기 사용 가이드 (S1: 공사·오픈지원 가이드 지움 · 계약 전 화면 · 업체 현황 · 미팅 방만 남김)
 *  실제 화면을 어둡게 하고 눌러야 할 버튼만 밝게 + 손가락 + 말풍선 · 4.5초마다 저절로 다음
 *  [◀ 이전] [⏸ 멈춤] [다음 ▶] [✕ 끝내기] · 안내 중에는 화면이 눌리지 않음 (보기 전용 · 저장 안 함)
 * ===================================================================== */
const TOUR_STEPS={};
/* 화면별 사용 가이드 (지금 화면 그대로 · 화면에 없는 칸은 자동으로 건너뜀) */
const G=(kind,first,list)=>{TOUR_STEPS[kind]=[{sel:'#gd_'+kind,text:first}].concat(list.map(a=>({sel:a[0],tap:a[2]?1:0,text:a[1]})))};
// ── 협력업체 (계약 전) ──
G('regForm','사업자 등록 화면입니다. 위에서부터 차례대로 적으면 됩니다.',[
 ['#f_company','① 업체명(상호)을 사업자등록증에 적힌 그대로 적습니다.'],
 ['#f_regNo','② 사업자등록번호 10자리를 적습니다. (- 없이 숫자만 적어도 됩니다)'],
 ['#f_representative','③ 대표자 이름을 적습니다.'],
 ['#f_address','④ 사업장 주소를 적습니다.'],
 ['#f_contact','⑤ 현장대리인(현장 업무를 맡는 사람) 이름을 적습니다.'],
 ['#f_phone','⑥ 연락받을 휴대폰 번호를 적습니다.'],
 ['#f_approverEmail','⑦ 다이소 담당자(도급인) 이메일을 적습니다. 이 사람이 등록을 승인합니다.'],
 ['#f_industry','⑧ 업종을 고릅니다.'],
 ['#cert','⑨ 사업자등록증 사진이나 PDF를 올립니다. 지금 없으면 나중에 올려도 됩니다.',1],
 ['#agree','⑩ 개인정보 수집·이용 동의에 체크합니다.',1],
 ['form button[type=submit]','⑪ [등록 신청]을 누르면 다이소 담당자에게 승인 요청이 갑니다.',1]]);
G('pending','등록 신청이 끝났습니다. 다이소 승인 담당자가 메일 링크로 승인하면 이 화면에 안내 창이 뜨고 서류 작성으로 넘어갑니다.',[
 ['#pollInfo','승인 여부는 15초마다 저절로 확인합니다. 화면을 켜 두기만 하면 됩니다.'],
 ['#btnChkApv','바로 확인하고 싶으면 [지금 확인하기]를 누르세요.',1],
 ['#btnRegEdit','승인 담당자 메일 주소 등을 잘못 적었으면 [신청 내용 고치기]로 고치고 다시 보냅니다.',1]]);
G('contract','계약 전에 할 일 화면입니다. 위에서부터 ① → ② → ③ 순서로 하면 됩니다.',[
 ['#infoCard','① 사업장 정보입니다. 가입 때 적은 값이 들어가 있으니 틀린 곳만 고칩니다.',1],
 ['#docsCard','② 계약 전에 낼 서류입니다. [미작성] 표시가 아직 안 한 서류입니다.'],
 ['#row_docC02','안전보건관리규정·계획서는 [✍ 작성하기]를 눌러 화면에서 바로 씁니다. 규정은 자동, 계획서는 단계별로 적고 서명 한 번이면 끝입니다.',1],
 ['#finCard','③ 다 채웠으면 여기서 제출합니다. 본사 담당자 → 안전보건팀 순서로 검토합니다.'],
 ['#btnSubmitAll','[누락 확인 후 제출하기]를 누르면 빠진 칸은 빨갛게 표시되고, 다 됐으면 제출됩니다.',1]]);
const PL_NEXT=['.roomfoot .button:not(.ghost)','다 적었으면 [다음]을 누르세요. 위쪽 탭을 눌러 원하는 단계로 바로 갈 수도 있습니다.',1];
G('plan2','계획서 작성 화면입니다. 위쪽 탭이 빨간색이면 아직 덜 쓴 단계, 초록색이면 다 쓴 단계입니다.',[
 ['#plTabs','탭을 누르면 그 단계로 바로 이동합니다.',1],
 ['#f_plGoal','안전 목표를 적습니다. (예: 무재해 달성)'],
 ['#f_plK0','성과지표(지표명·목표)를 적습니다. [+ 지표 추가]로 늘릴 수 있습니다.'],
 ['details.hist','관련 법규는 자동으로 들어갑니다. 눌러서 볼 수만 있습니다.'],PL_NEXT]);
G('plan3','안전관리책임자(현장대리인) 단계입니다.',[
 ['#f_plN0','현장대리인 이름을 적습니다.'],
 ['#f_plP0','연락처를 숫자만 적습니다. (- 는 자동)'],
 ['#f_plGb','생년월일을 고릅니다.'],
 ['#f_plGa','주소를 적습니다. 기술자면허가 있으면 아래 칸을 펼쳐 적습니다.'],PL_NEXT]);
G('plan4','위험성평가 단계입니다.',[
 ['#plWorks','우리 업체가 실제로 하는 작업을 누릅니다. 누르면 그 작업의 위험요인이 아래에 나옵니다.',1],
 ['#plRisks','나온 위험요인 중 해당하는 것만 체크합니다. 3개 이상이면 평가 4번 우수입니다.',1],PL_NEXT]);
G('plan5','비상 시나리오 단계입니다.',[
 ['#plScen','일어날 수 있는 사고를 모두 누릅니다. 누르면 필요한 훈련이 [대피훈련 계획]에 자동으로 체크됩니다.',1],
 ['#f_plHos','가까운 병원을 적습니다. (선택)'],PL_NEXT]);
G('plan6','비상대피훈련 계획 단계입니다.',[
 ['#f_plDr','대피 경로를 적습니다. (예: 작업장 → 비상구 → 주차장)'],
 ['#f_plDa','집결 장소를 적습니다.'],
 ['#f_plDm','훈련 담당자 이름을 적습니다.'],
 ['#plDrill','시나리오에 맞는 훈련이 자동으로 체크되어 있습니다. 빼면 빨간 테두리가 생기고 평가 11번 점수가 내려갑니다.',1],PL_NEXT]);
G('plan7','마지막 단계입니다. 서명하면 계획서가 완성됩니다.',[
 ['#plAcc','최근 3년 산업재해 건수를 적습니다. 없으면 0.'],
 ['#plEv','근로복지공단 산재 확인서 등 증빙을 올립니다. 증빙이 없으면 미제출로 평가 12번 미흡(1점)입니다.',1],
 ['#plPrCard','이행 사례(평가 6번)를 적습니다. 글 + 증빙 사진 = 우수 10점 · 글만 = 보통 5점 · 비우면 미흡 1점.',1],
 ['#sigBox','현장대리인이 손가락으로 서명합니다.',1],
 ['#planSave','[서명하고 작성 완료]를 누르면 끝입니다.',1]]);
// ── 도급인(다이소 담당자) ──
G('vendors','업체 현황 화면입니다.',[
 ['.seg','상태별(가입 대기·작성 중·검토 중·승인)로 골라 봅니다.',1],
 ['.svitem','업체를 누르면 신청 내용과 제출 서류가 펼쳐집니다.',1],
 ['button[onclick^="svDecide"]','가입 대기 업체는 내용을 확인하고 [가입 승인] 또는 [반려]를 누릅니다.',1]]);
G('room','미팅 화면입니다. ① 참석 → ② 합동점검 → ③ 회의록 순서로 합니다.',[
 ['#rt_att','위 번호 칩을 누르면 그 단계로 바로 갑니다.',1],
 ['#rp_att','업체가 QR을 찍으면 참석자가 여기 나옵니다. 담당자 확인을 누릅니다.'],
 ['#rp_joint','합동점검표입니다. 전 항목이 [양호]로 미리 체크되어 있으니 문제 있는 것만 바꿉니다.'],
 ['#rp_council','협의체 회의록을 적습니다.'],
 ['.roomfoot','다 적었으면 맨 아래 버튼으로 미팅을 마칩니다.',1]]);
/** ❔ 사용 가이드 버튼 (kind 별 · 가이드가 없는 화면은 버튼 없음) */
function gdBtn(kind,label){if(!TOUR_STEPS[kind])return '';return '<button type="button" class="button ghost gdbtn" id="gd_'+kind+'" style="padding:4px 8px;font-size:12px" onclick="startTour(\''+kind+'\')">'+(label||'❔ 사용 가이드')+'</button>'}
function gdRow(kind){const b=gdBtn(kind);return b?'<div style="text-align:right;margin:0 0 8px">'+b+'</div>':''}
let tour=null;
function tourCss(){if($('tourCss'))return;const s=document.createElement('style');s.id='tourCss';s.textContent=
 '#tourMask{position:fixed;inset:0;z-index:85;background:transparent}'
 +'#tourHole{position:fixed;z-index:86;border-radius:12px;box-shadow:0 0 0 9999px rgba(15,23,42,.62);outline:3px solid #facc15;transition:all .35s ease;pointer-events:none}'
 +'#tourHand{position:fixed;z-index:88;font-size:38px;pointer-events:none;transition:left .35s,top .35s;filter:drop-shadow(0 3px 4px #0006)}'
 +'#tourHand.tap{animation:tourTap 1s ease-in-out infinite}@keyframes tourTap{0%,100%{transform:translate(0,0) scale(1)}45%{transform:translate(-4px,-10px) scale(.9)}}'
 +'#tourBox{position:fixed;z-index:89;left:12px;right:12px;max-width:440px;margin:0 auto;background:#fff;border-radius:14px;padding:14px;box-shadow:0 10px 30px #0005;transition:top .35s}'
 +'#tourBox p{margin:0 0 10px;font-size:15px;line-height:1.55}#tourBox .tbar{display:flex;gap:6px;align-items:center}#tourBox .tbar button{padding:8px 10px;font-size:13px}'
 +'#tourBox .tprog{height:4px;background:#e5e7eb;border-radius:4px;margin:0 0 10px;overflow:hidden}#tourBox .tprog span{display:block;height:100%;background:#facc15;transition:width .3s}'
 +'@media (prefers-reduced-motion:reduce){#tourHole,#tourHand,#tourBox{transition:none}#tourHand.tap{animation:none}}';document.head.appendChild(s)}
/** 사용 가이드 시작 */
function startTour(kind){const st=TOUR_STEPS[kind];if(!st||!st.length)return;endTour(true);tourCss();document.body.classList.add('touring');
 const mk=(id,tag)=>{const e=document.createElement(tag||'div');e.id=id;document.body.appendChild(e);return e};
 const mask=mk('tourMask');mask.onclick=()=>tourGo(1);mk('tourHole');const hand=mk('tourHand');hand.textContent='👆';hand.setAttribute('aria-hidden','true');
 const box=mk('tourBox');box.setAttribute('role','dialog');box.setAttribute('aria-modal','true');box.setAttribute('aria-label','사용 가이드');
 tour={kind,steps:st,i:-1,play:true,timer:0,dir:1,busy:false};
 tour.key=e=>{if(e.key==='Escape')endTour();else if(e.key==='ArrowRight')tourGo(1);else if(e.key==='ArrowLeft')tourGo(-1)};document.addEventListener('keydown',tour.key);
 tour.pos=()=>tourPlace();window.addEventListener('resize',tour.pos);window.addEventListener('scroll',tour.pos,true);
 tourGo(1)}
async function tourGo(d){if(!tour||tour.busy)return;clearTimeout(tour.timer);tour.dir=d;tour.busy=true;
 try{let i=tour.i;for(;;){i+=d;if(i<0){i=0;d=1}if(i>=tour.steps.length){tour.busy=false;endTour();return}
   const s=tour.steps[i];await new Promise(r=>setTimeout(r,120));
   const el=document.querySelector(s.sel)||(s.alt&&document.querySelector(s.alt));if(el&&el.getClientRects().length){tour.i=i;tour.el=el;break}}  // 지금 화면에 없는 버튼은 건너뜀
  tour.el.scrollIntoView({behavior:'smooth',block:'center'});await new Promise(r=>setTimeout(r,380));tourDraw()}
 finally{if(tour)tour.busy=false}
 if(tour&&tour.play)tour.timer=setTimeout(()=>tourGo(1),4500)}
function tourDraw(){if(!tour)return;const s=tour.steps[tour.i],n=tour.steps.length,box=$('tourBox');
 box.innerHTML='<div class="tprog"><span style="width:'+Math.round((tour.i+1)/n*100)+'%"></span></div><p aria-live="polite">'+escapeText(s.text)+'</p>'
  +'<div class="tbar"><span class="muted" style="flex:1;font-size:12px">'+(tour.i+1)+' / '+n+'</span><button class="button ghost" type="button" onclick="tourGo(-1)" '+(tour.i?'':'disabled')+' aria-label="이전">◀ 이전</button>'
  +'<button class="button ghost" type="button" onclick="tourPlay()" aria-label="'+(tour.play?'멈춤':'자동 재생')+'">'+(tour.play?'⏸':'▶')+'</button><button class="button" type="button" id="tourNext" onclick="tourGo(1)">'+(tour.i===n-1?'끝':'다음 ▶')+'</button><button class="button ghost" type="button" onclick="endTour()" aria-label="가이드 끝내기">✕</button></div>';
 $('tourHand').className=s.tap?'tap':'';$('tourHand').style.display=s.tap?'block':'none';tourPlace();setTimeout(()=>$('tourNext')?.focus({preventScroll:true}),50)}
function tourPlace(){if(!tour||!tour.el)return;if(!tour.el.isConnected){const s=tour.steps[tour.i],e=document.querySelector(s.sel)||(s.alt&&document.querySelector(s.alt));if(!e)return;tour.el=e}  // 화면이 새로 그려졌으면 다시 찾음
 const r=tour.el.getBoundingClientRect(),p=6,h=$('tourHole'),hd=$('tourHand'),box=$('tourBox'),vh=window.innerHeight;
 h.style.left=(r.left-p)+'px';h.style.top=(r.top-p)+'px';h.style.width=(r.width+p*2)+'px';h.style.height=(Math.min(r.height,vh*0.6)+p*2)+'px';
 hd.style.left=(r.left+Math.min(r.width/2,140)-12)+'px';hd.style.top=(r.top+Math.min(r.height,vh*0.6)/2)+'px';
 const bh=box.offsetHeight||150,below=r.top+Math.min(r.height,vh*0.6)+p+14;box.style.top=(below+bh<vh-8?below:Math.max(8,r.top-p-bh-14))+'px'}
function tourPlay(){if(!tour)return;tour.play=!tour.play;clearTimeout(tour.timer);if(tour.play)tour.timer=setTimeout(()=>tourGo(1),1500);tourDraw()}
/** 가이드 끝: 화면은 그대로 두고 가이드 버튼으로 돌아옴 */
function endTour(quiet){if(!tour)return;const t=tour;clearTimeout(t.timer);document.removeEventListener('keydown',t.key);window.removeEventListener('resize',t.pos);window.removeEventListener('scroll',t.pos,true);
 ['tourMask','tourHole','tourHand','tourBox'].forEach(id=>$(id)?.remove());tour=null;document.body.classList.remove('touring');
 if(quiet)return;const b=$('gd_'+t.kind);if(b){b.scrollIntoView({block:'center'});b.focus({preventScroll:true})}}
/* 위쪽 [❔ 가이드] 버튼 (☰ 옆) · 화면을 그릴 때 setTopGuide(kind) · 다른 화면으로 가면 setTopGuide('') */
function setTopGuide(kind){window.__gdKind=kind&&TOUR_STEPS[kind]?kind:'';const b=$('guideBtn');if(b)b.hidden=!window.__gdKind}
function topGuide(){const k=window.__gdKind;if(k){toggleMenu(false);startTour(k)}}
