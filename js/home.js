/* S8-7 도급인 화면 개편 (시안 06_시안/도급인화면개편시안_보기.html)
 *  ☰ 메뉴 아이콘 (단색 선) · 「오늘 할 일」 첫 화면 · 「설정」 (가끔 쓰는 것 모음)
 *  오늘 할 일 = 눌러서 처리할 것만: 업체 승인 · 서류 검토 · 재해 조치 · 시정요구서 미조치 · 개선 계획 확인 / 이번 주 점장 순회점검 n / m / 다가오는 협의체 회의 · 합동점검
 *  서버: Relay dashSum (한 번에) · fb.js checkBoard (이번 주 제출 수) · myBadges (업체 승인 · 검토) */
Object.assign(SH_ICONS,{
 users:'<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><circle cx="17" cy="9.5" r="2.4"/><path d="M16 14.2c2.7.1 4.5 1.9 4.5 4.3"/>',
 star:'<path d="M12 4l2.4 5 5.4.8-3.9 3.8.9 5.4L12 16.5 7.2 19l.9-5.4L4.2 9.8l5.4-.8z"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M6 18l1.6-1.6M16.4 7.6 18 6"/>',
 right:'<path d="m9.5 6 6 6-6 6"/>',mail:'<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>'});
/** ☰ 메뉴 버튼에 아이콘 · 작은 설명 (한 번만) */
function smIcons(){document.querySelectorAll('#navTabs .smb[data-ic]').forEach(b=>{if(b.dataset.done)return;b.dataset.done='1';const t=b.textContent,s=b.dataset.sub;
 b.classList.add('smi');b.innerHTML=shIc(b.dataset.ic)+'<span class="smt"><b>'+escapeText(t)+'</b>'+(s?'<small>'+escapeText(s)+'</small>':'')+'</span>'});
 if($('smCss'))return;const st=document.createElement('style');st.id='smCss';st.textContent=
  '.drawer .tabs button.smi{display:flex;align-items:center;justify-content:flex-start;gap:10px;text-align:left}.drawer .tabs button.smi .smt{flex:1;text-align:left!important;align-items:flex-start}.drawer .tabs button.smi[data-n]{justify-content:flex-start!important}.drawer .tabs button.smi .shic{flex:none}.smt{display:flex;flex-direction:column;min-width:0}.smt b{font-weight:600}.smt small{font-size:11.5px;color:var(--sub);font-weight:400;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}'
  +'.drawer .tabs .smsep{padding:12px 14px 4px;font-size:11.5px;color:var(--sub);border-top:1px solid var(--line);margin-top:6px}'
  +'.dsrow{display:flex;align-items:center;gap:10px;width:100%;padding:11px 2px;border:0;border-top:1px solid var(--line);background:none;font:inherit;color:inherit;text-align:left;cursor:pointer}.dsrow:first-of-type{border-top:0}.dsrow .t{flex:1;min-width:0}.dsrow .t b{display:block}.dsrow .t span{font-size:12.5px;color:var(--sub)}'
  +'.dsn{font-size:20px;font-weight:700;min-width:28px;text-align:right}.dsn.r{color:var(--accent)}.dsbar{height:6px;background:var(--bg);border-radius:6px;overflow:hidden;margin-top:6px}.dsbar i{display:block;height:100%;background:var(--main,#111827)}';
 document.head.appendChild(st)}

/* ---------- 오늘 할 일 ---------- */
let dsD=null,dsErr='',dsBusy=false,dsChk=null,dsTried=false;
async function dashLoad(quiet){if(dsBusy)return;dsBusy=true;try{const [d,c]=await Promise.all([callQuiet('dashSum'),callQuiet('checkBoard').catch(()=>null)]);d._at=Date.now();dsD=d;if(c)dsChk=c}catch(e){if(!quiet)dsErr=(e&&e.message)||'불러오지 못했습니다.'}dsBusy=false;
 if(typeof sBadges==='function')sBadges(state.badges);if(tab==='jobs'&&smenu==='dash')renderJobs()}
/** ☰ 빨간 숫자 = 처리할 것 합계 */
function dashTodoN(){const B=(state&&state.badges)||{},D=dsD;if(!D&&!dsTried&&!dsBusy&&isStaffUI()&&!isCsUI()){dsTried=true;setTimeout(()=>dashLoad(true),0)}/* 다른 화면에서 시작해도 ☰ 숫자가 맞게 (한 번만) */return (B.admin||0)+(B.review||0)+(D?D.acc.late+D.ca.open+D.plan.wait:0)}
function dsRow(go,ic,red,t,sub,n){const e=escapeText;return '<button class="dsrow" type="button" onclick="'+go+'">'+shIc(ic,red)+'<span class="t"><b>'+e(t)+'</b>'+(sub?'<span>'+e(sub)+'</span>':'')+'</span>'+(n!==''&&n!=null?'<span class="dsn'+(red?' r':'')+'">'+n+'</span>':'')+shIc('right')+'</button>'}
function sDash(){smIcons();if(typeof chkCss==='function')chkCss();const e=escapeText,me=state.staff||{};
 if(dsErr){const m=dsErr;dsErr='';return '<div class="card"><h2>오늘 할 일</h2><p class="muted">'+e(m)+'</p><button class="button" type="button" onclick="dashLoad()">다시 시도</button></div>'}
 if(!dsD){dashLoad();return '<div class="card"><h2 style="margin:0">'+e(me.name||'')+' 님</h2><p class="muted" style="margin:6px 0 0">오늘 할 일을 불러오는 중입니다…</p></div>'}
 if(!dsBusy&&Date.now()-(dsD._at||0)>60000){dsD._at=Date.now();setTimeout(()=>dashLoad(true),0)}
 const B=state.badges||{},D=dsD,t=D.today,wd=d=>typeof jtD==='function'?jtD(d):d;
 const todo=[];
 if(B.admin)todo.push(dsRow("sgo('vendors')",'store',true,'업체 가입 승인','사업자 등록 신청',B.admin));
 if(B.review)todo.push(dsRow("sgo('vendors')",'doc',true,'계약 전 서류 검토','업체가 제출한 서류',B.review));
 if(D.acc.open)todo.push(dsRow("sgo('vendors')",'alert',!!D.acc.late,D.acc.late?'재해 조치 기한 지남':'재해 조치 대기',D.acc.first?D.acc.first.storeName+' · '+String(D.acc.first.accDate).slice(5).replace('-','.')+' · '+D.acc.first.company:'',D.acc.late||D.acc.open));
 if(D.ca.open)todo.push(dsRow("sgo('ca')",'doc',!!D.ca.late,'시정요구서 미조치',(D.ca.late?'기한 지남 '+D.ca.late+' · ':'')+(D.ca.first?D.ca.first.storeName+' · '+D.ca.first.company:''),D.ca.open));
 if(D.plan.wait)todo.push(dsRow("sgo('half')",'star',false,'개선 계획 확인','반기 평가 70점 미만 · '+(D.plan.first?D.plan.first.company:''),D.plan.wait));
 let h='<div class="card"><h2 style="margin:0 0 4px">처리할 것</h2>'+(todo.join('')||'<p class="muted" style="margin:8px 0 0">오늘 처리할 일이 없습니다.</p>')+'</div>';
 if(dsChk&&dsChk.stores&&dsChk.stores.length){const w=dsChk.thisWeek,W=dsChk.weeks[w]||{},n=dsChk.stores.length,s=dsChk.stores.filter(r=>W[r[0]]).length,p=n?Math.round(s/n*100):0;
  h+='<div class="card"><h2 style="margin:0 0 4px">이번 주 점장 순회점검</h2>'+dsRow("sgo('check')",'check',false,'제출 '+s+' / '+n+' 매장',w.slice(5).replace('-','.')+' (월) 주 · 미제출 '+(n-s),'')+'<div class="dsbar"><i style="width:'+p+'%"></i></div></div>'}
 const up=D.meets.map(m=>dsRow("sgo('co')",'cal',m.status==='OPEN',m.id.slice(0,4)+'년 '+Number(m.id.slice(5,7))+'월 협의체 회의',wd(m.date)+(m.time?' '+m.time:'')+(m.place?' · '+m.place:'')+(m.status==='OPEN'?' · 진행 중':''),''))
  .concat(D.joints.map(j=>dsRow("sgo('joint')",'users',j.status==='OPEN'||j.date<t,'합동점검 · '+j.storeName,wd(j.date)+(j.time?' '+j.time:'')+(j.csName?' · CS '+j.csName:'')+(j.date<t&&j.status!=='OPEN'?' · 날짜 지남':j.status==='OPEN'?' · 진행 중':''),'')));
 h+='<div class="card"><h2 style="margin:0 0 4px">다가오는 일정</h2>'+(up.join('')||'<p class="muted" style="margin:8px 0 0">예정된 회의 · 합동점검이 없습니다.</p>')+'</div>';
 return h}

/* ---------- 설정 (가끔 쓰는 것) ---------- */
function sSettings(){smIcons();const S=isSafetyUI(),M=!!state.isMaster,L=[];
 if(S)L.push(["sgo('items')",'check','점검 항목','점장 순회점검 문항 · 가이드 사진 · 시작 주'],["sgo('stores')",'store','매장 목록','엑셀 붙여넣기']);  /* S8-9 부서 관리 → 조직도로 합침 (store.js sDepts 코드는 그대로 둠) */
 if(M)L.push(["sgo('tpl')",'doc','표준양식 관리',''],["sgo('staff')",'users','조직도','부서 · 팀 · 팀장(Teams 알림) · CS팀 · 직원 · 도급인 책임자'],["sgo('data')",'gear','데이터 관리','']);
 return '<div class="card"><h2 style="margin:0 0 4px">설정</h2>'+(L.map(([g,ic,t,s])=>dsRow(g,ic,false,t,s,'')).join('')||'<p class="muted">쓸 수 있는 설정이 없습니다.</p>')+'</div>'}
