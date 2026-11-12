/* 담당자 현황판 (v5.12)
 *  대시보드: ① 공사 목록(처리할 일 숫자) → ② 공사를 누르면 그 공사의 오늘 할 일·일정·이행률·업체별 표·주의 사항
 *  작업허가서 / 순회점검: 업체가 많아도 한 화면에 — 업체별 요약 표 + [승인 대기·특이사항·전체] 거르기 + 선택·일괄 승인(확인)
 *  (staff.js의 sDash, permit.js의 renderPermitList, insp.js의 renderInspList를 이 파일이 대신함)
 *  서버: Code.gs approvePermits · checkInspections */
/** 공사 1건의 처리할 일 */
/* ---------- F1.8g 도급인 메인: 알림 띠 · [현장 확인하기] · 지적사항·시정조치 · 공사 현황 ---------- */
/** 법정 주기: 협의체 매월 · 합동점검 분기마다 1회
 *  그 기간에 그 종류 미팅(예정 포함)이 있으면 끝 · 공사를 시작한 달(분기)은 착수 전에 한 미팅도 인정
 *  → 짧은 공사는 첫 미팅 1번으로 끝 · 기간이 다음 달로 늘어나면 그달 1일부터 다시 알림 */
/* F1.8h 알림: 메인에는 한 줄만 → 누르면 위에서 내려오는 창(뒤는 어둡게) → 하나를 눌러 들어가면 '본 것'으로 빠짐 (메뉴 숫자도 같이)
 *  같은 일이라도 내용이 바뀌면(연장으로 종료일 변경 · 참석 확인 인원 변경 · 다음 달 주기 등) 새 알림으로 다시 뜸 · 참조 알림은 없앰 */
/** 메인 한 줄: 🔔 알림 N · 첫 알림 제목 ▾ (안 본 알림이 없으면 숨김) */
/** 본 알림 기억 (최근 300개) → 메인 한 줄 · 메뉴 숫자 다시 계산 */
/** 큰 동그라미: 허가서 승인 대기 + 순회점검일지 확인 대기 */
/** 현장이 여러 개면 고르는 창 (확인할 것이 많은 현장이 위) */
/** 현장 확인 화면 = 그 현장의 [작업허가서 | 순회점검일지] 탭 */
/** ☰ 현장 확인 (공사 목록) */
/** 공사 1건의 주의 사항 (업체별) */
/* ---------- ① 대시보드: 공사 목록 ---------- */
/** 안전보건팀: 업체별 지적 현황 (전체) */
/* ---------- ② 대시보드: 공사 1건 현황 ---------- */
/* F1.8g '오늘 처리할 일' 목록 → 숫자 버튼 한 줄 */
/* ---------- 작업허가서: 업체별 요약 + 거르기 + 일괄 승인 ---------- */
/* ---------- 순회점검: 업체별 요약 + 거르기 + 일괄 확인 ---------- */
/* ---------- F1.9p [마스터] 데이터 관리 (조직도처럼 왼쪽 목록 · 오른쪽 처리) ----------
 *  왼쪽: ⚠ 손볼 것 · 🏢 업체(상태별) · 🏗 공사(진행·종료) · 📋 표로 보기 · 🔑 마스터 권한 · 🧾 오래된 이력 · ⛔ 전체 초기화
 *  오른쪽: 이름 목록 → 누르면 상태 한 줄 + 바로 처리 버튼 + 빨간 지우기 (확인 1번) · 전체 초기화만 '삭제' 입력
 *  업체·공사 통째 지우기 · 이력 · 초기화 = 예전 adminPreview(지울 개수 · 10분 확인표) → adminDelete(50초씩 이어서)
 *  F1.9q 빠르게: 한 번 본 목록은 이 기기에 저장 → 바로 보여 주고 뒤에서 최신으로 · 처리 중에는 가리는 창 대신 오른쪽 칸에 표시 · 확인도 오른쪽 칸 안에서 */
let admT=null,admS={t:'issues'},admOpen=new Set(['co']),admFold=false,admRowsM={},admRowsL={},admChk=new Set(),admQ='',admXp=new Set(),admCf=null,admEdit=false,admPv=null,admBusy='',admMs=null,admMsCf=null;
const ADM_CO_G=[['pend','승인 대기'],['draft','작성·보완'],['sub','검토 중'],['ok','승인'],['rej','반려']],ADM_JOB_G=[['open','진행 중','OPEN'],['ended','종료','ENDED']];
const ADM_TBL=[['PERMITS','작업허가서'],['INSP','순회점검'],['FIND','지적사항'],['WORKERS','작업자'],['MEET','미팅'],['EVALS','종료 평가'],['MAIL','메일·Teams 기록']];
const ADM_CO_PILL={pend:['승인 대기','w'],draft:['작성 중','k'],sub:['검토 중','b'],ok:['승인','g'],rej:['반려','r']};
const admQt=s=>escapeText(String(s==null?'':s).replace(/[^A-Za-z0-9_.:-]/g,''));  // onclick 안에 넣는 ID (글자 제한)
function admCss(){if(typeof orgCss==='function')orgCss();if($('admCss'))return;const s=document.createElement('style');s.id='admCss';s.textContent=
 '.ogs.adfold{width:30px;padding:6px 0}.ogsh button{border:0;background:none;color:var(--sub);font-size:14px;padding:0 3px;cursor:pointer}'
 +'.ogf .adn{margin-left:auto;font-size:11px;color:var(--sub);padding-left:3px}.ogf.on .adn{color:#d1d5db}.ogf .adn.r{color:var(--accent);font-weight:700}.ogf.on .adn.r{color:#fca5a5}.ogf.adsub{padding-left:17px}'
 +'.adr{display:flex;align-items:center;gap:6px;width:100%;border:0;border-bottom:1px solid #f0f1f4;background:none;text-align:left;font:inherit;color:inherit;padding:11px 2px;font-size:13.5px;cursor:pointer}.adr:hover{background:#fafafa}'
 +'.adr .nm{flex:1;min-width:0}.adr .nm b{font-weight:600;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.adr .nm small{display:block;font-size:11px;color:var(--sub)}.adr .nm small.r{color:var(--accent)}.adr i{font-style:normal;color:#c0c4cc}'
 +'.apl{flex:none;font-size:10.5px;border-radius:20px;padding:1px 7px;white-space:nowrap;font-weight:600;vertical-align:middle}.apl.w{background:#fff7ed;color:#b45309}.apl.b{background:#eef2ff;color:#3730a3}.apl.g{background:#ecfdf3;color:#15803d}.apl.r{background:#fdecec;color:var(--accent)}.apl.k{background:#f1f2f5;color:#566070}'
 +'.adback{border:0;background:none;font:inherit;font-size:12px;color:var(--sub);padding:0 0 8px;cursor:pointer}.adst{font-size:12px;color:var(--sub);margin:-4px 0 14px;word-break:break-all;line-height:1.6}.adst .r{color:var(--accent)}'
 +'.adbig{display:block;width:100%;border:1px solid var(--line);background:#fff;border-radius:11px;padding:12px 11px;font:inherit;font-size:13.5px;font-weight:600;text-align:left;margin:0 0 8px;color:var(--text);cursor:pointer}.adbig:hover{border-color:#9ca3af}'
 +'.addel{display:block;width:100%;border:0;border-top:1px solid var(--line);background:none;color:var(--accent);font:inherit;font-size:13px;font-weight:700;padding:12px 0 0;margin-top:14px;text-align:left;cursor:pointer}'
 +'.adcf{border:2px solid var(--accent);border-radius:12px;padding:12px 11px;margin-top:8px}.adcf.m{border-color:var(--main)}.adcf b{font-size:14px}.adcf p{font-size:12.5px;margin:4px 0 10px;color:#4b5563;white-space:pre-line}'
 +'.adbtn{display:block;border:0;border-radius:10px;font:inherit;font-weight:700;font-size:13.5px;padding:11px;width:100%;cursor:pointer}.adbtn.d{background:var(--accent);color:#fff}.adbtn.g{background:#f0f2f6;color:#374457;margin-top:6px}.adbtn.m{background:var(--main);color:#fff}.adbtn:disabled{opacity:.4;cursor:default}'
 +'.adinp{width:100%;border:1px solid #d1d5db;border-radius:9px;padding:10px;font:inherit;font-size:16px;margin:0 0 8px}.adempty{color:var(--sub);font-size:13px;padding:20px 4px;text-align:center}'
 +'.adbusy{display:flex;gap:8px;align-items:center;background:#f4f5f7;border-radius:10px;padding:12px;font-size:13px;margin:4px 0 10px}.adbusy i{width:14px;height:14px;border:2px solid #d1d5db;border-top-color:var(--main);border-radius:50%;animation:spin .8s linear infinite;flex:none}'
 +'.adtbar{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--sub);padding:4px 2px 6px;border-bottom:2px solid var(--main)}.adtbar label{display:flex;align-items:center;gap:4px}'
 +'.adtr{border-bottom:1px solid #f0f1f4}.adtr .h{display:flex;align-items:center;gap:7px;padding:9px 2px}.adtr.on{background:#fff8f8}.adtr input[type=checkbox],.adtbar input[type=checkbox],.admr input[type=checkbox]{width:18px;height:18px;flex:none;accent-color:var(--accent)}'
 +'.adtr .nm{flex:1;min-width:0;cursor:pointer;background:none;border:0;text-align:left;font:inherit;color:inherit;padding:0}.adtr .nm b{display:block;font-weight:600;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.adtr .nm small{display:block;font-size:11px;color:var(--sub);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
 +'.adtr .dt{display:none;font-size:12px;background:#f8f9fb;border-radius:8px;margin:0 2px 8px 27px;padding:6px 9px}.adtr.open .dt{display:block}.adtr .dt div{display:flex;gap:8px;padding:2px 0;word-break:break-all}.adtr .dt div span:first-child{color:var(--sub);width:62px;flex:none}'
 +'.admr{display:flex;align-items:center;gap:8px;border-bottom:1px solid #f0f1f4;padding:10px 2px;cursor:pointer}.admr.off{cursor:default;opacity:.55}.admr .nm{flex:1;min-width:0}.admr .nm b{font-size:13.5px;font-weight:600}.admr .nm small{display:block;font-size:11px;color:var(--sub);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
 +'.adsel{position:sticky;bottom:0;background:#fff;padding:8px 0 2px;margin-top:6px}.adsrch{width:100%;border:1px solid var(--line);border-radius:9px;padding:8px 10px;font:inherit;font-size:14px;margin:0 0 6px}';document.head.appendChild(s)}
function sData(){jobsMode='admin';admCss();if(!admT&&typeof cacheGet==='function')admT=cacheGet('adminTree',[]);setTimeout(()=>{if(admT)admDraw();admLoad()},0);return '<div id="admBox"><div class="card"><p class="desc">데이터를 불러오는 중입니다…</p></div></div>'}
/** 왼쪽 목록 새로 받기 (조회 = 위쪽 얇은 선만 · 가리는 창 없음) */
async function admLoad(){try{admT=await call('adminTree')}catch(e){const b=$('admBox');if(b&&!admT)b.innerHTML='<div class="card"><p class="desc">'+escapeText(e.message||'불러오지 못했습니다.')+'</p><button class="button" type="button" onclick="admLoad()">다시 시도</button></div>';return}
 if(admS.id&&!(admS.t==='co'?admT.co:admT.job).some(x=>x.id===admS.id))admS={t:admS.t,sub:admS.sub};if(!admBusy&&!admEdit&&!(admCf&&admCf.k==='fix'))admDraw();else{const n=document.querySelector('#admBox .ogs');if(n)n.innerHTML=admSide()}}
function admDraw(){const b=$('admBox');if(!b||!admT)return;admCss();const q=document.activeElement&&document.activeElement.id==='f_admQ';b.innerHTML='<div class="ogw"><nav class="ogs'+(admFold?' adfold':'')+'" aria-label="데이터 종류">'+admSide()+'</nav><section class="ogm" aria-live="polite">'+admMain()+'</section></div>';if(admS.t==='tbl'&&$('admTb'))admTb();if(q){const e=$('f_admQ');if(e){e.focus();e.setSelectionRange(admQ.length,admQ.length)}}}
function admGo(s){if(admBusy)return;const same=admS.t==='tbl'&&s.t==='tbl'&&admS.sub===s.sub;admS=s;admCf=null;admEdit=false;admPv=null;admMsCf=null;if(!same){admChk=new Set();admQ='';admXp=new Set()}if(['co','job','tbl'].includes(s.t))admOpen.add(s.t);
 if(s.t==='tbl'&&!same)admRowsLoad(s.sub);if(s.t==='perm')admMsLoad();admDraw();window.scrollTo(0,0)}
function admTg(k){if(admOpen.has(k)){admOpen.delete(k);admDraw();return}admGo({t:k,sub:{co:'pend',job:'open',tbl:'PERMITS'}[k]})}
/* 왼쪽 */
function admSide(){if(admFold)return '<div class="ogsh" style="justify-content:center"><button type="button" onclick="admFold=false;admDraw()" aria-label="목록 펼치기">»</button></div>';
 const d=admT,on=(t,sub)=>admS.t===t&&(sub===undefined||admS.sub===sub)&&!admS.id?' on':'',on2=(t,sub)=>admS.t===t&&admS.sub===sub?' on':'',n=(v,r)=>'<span class="adn'+(r&&v?' r':'')+'">'+v+'</span>';
 const grp=(k,l,v)=>'<button type="button" class="ogf" aria-expanded="'+admOpen.has(k)+'" onclick="admTg(\''+k+'\')"><span class="ic">'+(admOpen.has(k)?'▾':'▸')+'</span>'+l+(v===''?'':n(v))+'</button>';
 const item=(cls,t,sub,label,v,r)=>'<button type="button" class="ogf'+cls+'" onclick="admGo({t:\''+t+'\''+(sub?',sub:\''+sub+'\'':'')+'})"><span class="ic"></span>'+label+(v===''?'':n(v,r))+'</button>';
 return '<div class="ogsh">데이터<button type="button" onclick="admFold=true;admDraw()" aria-label="목록 접기 (오른쪽 넓게)">«</button></div>'
  +item(on('issues'),'issues','','⚠ 손볼 것',d.issues.length,1)
  +grp('co','🏢 업체',d.co.length)+(admOpen.has('co')?ADM_CO_G.map(g=>item(' adsub'+on2('co',g[0]),'co',g[0],g[1],d.co.filter(c=>c.g===g[0]).length)).join(''):'')
  +grp('job','🏗 공사',d.job.length)+(admOpen.has('job')?ADM_JOB_G.map(g=>item(' adsub'+on2('job',g[0]),'job',g[0],g[1],d.job.filter(j=>j.st===g[2]).length)).join(''):'')
  +grp('tbl','📋 표로 보기','')+(admOpen.has('tbl')?ADM_TBL.map(g=>item(' adsub'+on2('tbl',g[0]),'tbl',g[0],g[1],d.cnt[g[0]]||0)).join(''):'')
  +item(on('perm'),'perm','','🔑 마스터 권한','')+item(on('logs'),'logs','','🧾 오래된 이력','')+item(on('reset'),'reset','','⛔ 전체 초기화','')}
/* 오른쪽 */
const admSubOf=(k,id)=>{if(k==='co'){const c=admT.co.find(x=>x.id===id);return c?c.g:'pend'}const j=admT.job.find(x=>x.id===id);return j&&j.st==='ENDED'?'ended':'open'};
const admBusyBox=()=>'<div class="adbusy" role="status"><i aria-hidden="true"></i><span>'+escapeText(admBusy)+'</span></div>';
function admMain(){const d=admT,s=admS;if(admBusy&&s.t!=='tbl'&&s.t!=='perm')return admBusyBox();
 if(s.t==='issues')return '<div class="ogt">⚠ 손볼 것</div>'+(d.issues.length?d.issues.map(x=>'<button type="button" class="adr" onclick="admGo({t:\''+x.k+'\',sub:\''+admSubOf(x.k,x.id)+'\',id:\''+admQt(x.id)+'\'})"><span class="nm"><b>'+escapeText(x.n)+'</b><small class="r">'+escapeText(x.w)+'</small></span><i aria-hidden="true">›</i></button>').join(''):'<div class="adempty">✔ 손볼 것이 없습니다</div>')
  +'<p class="muted" style="font-size:11.5px;margin-top:12px">메일·Teams 실패(7일) · 조직도에 없는 담당 이메일 · 승인/검토 대기 7일 · 종료일 지남 · 종료 후 평가 미확정 3일을 자동으로 찾습니다.</p>';
 if(s.t==='co'&&!s.id){const g=ADM_CO_G.find(x=>x[0]===s.sub)||ADM_CO_G[0],L=d.co.filter(c=>c.g===g[0]);
  return '<div class="ogt">'+g[1]+'</div>'+(L.length?L.map(c=>'<button type="button" class="adr" onclick="admGo({t:\'co\',sub:\''+g[0]+'\',id:\''+admQt(c.id)+'\'})"><span class="nm"><b>'+escapeText(c.name)+'</b><small'+(c.fail||c.noOrg?' class="r"':'')+'>'+escapeText(admCoLine(c))+'</small></span><i aria-hidden="true">›</i></button>').join(''):'<div class="adempty">없습니다</div>')}
 if(s.t==='co')return admCoView();
 if(s.t==='job'&&!s.id){const g=ADM_JOB_G.find(x=>x[0]===s.sub)||ADM_JOB_G[0],L=d.job.filter(j=>j.st===g[2]);
  return '<div class="ogt">공사 · '+g[1]+'</div>'+(L.length?L.map(j=>'<button type="button" class="adr" onclick="admGo({t:\'job\',sub:\''+g[0]+'\',id:\''+admQt(j.id)+'\'})"><span class="nm"><b>'+escapeText(j.name)+'</b><small>'+escapeText(j.st==='OPEN'?(j.end?'~ '+j.end+(j.end<d.today?' (지남)':''):'종료일 없음'):j.ended+' 종료'+(j.left?' · 평가 '+j.left+'곳 남음':''))+'</small></span><i aria-hidden="true">›</i></button>').join(''):'<div class="adempty">없습니다</div>')}
 if(s.t==='job')return admJobView();
 if(s.t==='tbl')return admTblView();
 if(s.t==='perm')return admMsView();
 if(s.t==='logs')return '<div class="ogt">🧾 오래된 이력 지우기</div><div class="adst">사용 이력 · 메일·Teams 기록 중 오래된 것만 (지금 '+Number(d.logs||0).toLocaleString()+'건) · 업무 기록은 그대로</div>'
  +(admCf?admCfBox():[30,90,180].map(n=>'<button type="button" class="adbig" onclick="admAskPv({kind:\'logs\',days:'+n+'})">'+n+'일 지난 것</button>').join(''));
 if(s.t==='reset')return '<div class="ogt">⛔ 전체 초기화</div><div class="adst">운영 시작 전 테스트 기록을 모두 지울 때만 씁니다. 직원 명단 · 조직도 · 표준양식 · 로그인 계정은 남습니다. 드라이브 파일은 휴지통으로 (30일 안에 복구 가능).</div>'
  +(admCf?admCfBox():'<div class="adcf"><b>모든 업체 · 공사 · 기록을 지웁니다</b><p>되돌릴 수 없습니다. 아래 칸에 삭제 라고 적어야 버튼이 켜집니다.</p><input class="adinp" id="f_admAll" autocomplete="off" placeholder="삭제" aria-label="확인 글자 (삭제)" oninput="$(\'admAllBtn\').disabled=this.value.trim()!==\'삭제\'"><button type="button" class="adbtn d" id="admAllBtn" disabled onclick="admAskPv({kind:\'all\'})">지울 개수 보기</button></div>');
 return ''}
function admCoLine(c){return c.g==='pend'?'신청 '+c.days+'일째'+(c.fail?' · 메일 실패':c.noOrg?' · 조직도에 없는 주소':''):c.g==='sub'?'제출 '+c.days+'일째':c.g==='ok'?'승인 '+c.at:c.g==='rej'?'반려':(c.sub==='CORRECTION'?'보완 요청':'작성 중')+(c.renew?' · 재평가':'')}
function admCoView(){const c=admT.co.find(x=>x.id===admS.id);if(!c)return '<div class="adempty">이미 지워졌습니다</div>';const p=ADM_CO_PILL[c.g]||['','k'];
 let h='<button type="button" class="adback" onclick="admGo({t:\'co\',sub:\''+c.g+'\'})">‹ 목록</button><div class="ogt">'+escapeText(c.name)+' <span class="apl '+p[1]+'">'+escapeText(c.g==='draft'&&c.sub==='CORRECTION'?'보완 요청':p[0])+'</span></div>'
  +'<div class="adst">담당 '+escapeText(c.ap||'-')+(c.fail?'<br><span class="r">⚠ 최근 이 주소로 메일·Teams 보내기 실패</span>':'')+(c.noOrg?'<br><span class="r">⚠ 조직도에 없는 주소입니다 (오타인지 확인)</span>':'')+'</div>';
 if(admCf)return h+admCfBox();
 if(admEdit)return h+'<div class="adcf m"><b>새 담당자 이메일</b><p>저장하면 새 주소로 승인 요청이 다시 갑니다 (메일 · Teams).</p><input class="adinp" id="f_admAp" type="email" autocomplete="off" value="'+escapeText(c.ap)+'" aria-label="새 담당자 이메일"><button type="button" class="adbtn m" onclick="admFix(\'apEmail\')">저장하고 다시 보내기</button><button type="button" class="adbtn g" onclick="admEdit=false;admDraw()">취소</button></div>';
 const B=[];if(c.g==='pend')B.push(['✉ 담당자 이메일 바꾸기','admEdit=true;admDraw();setTimeout(()=>$(\'f_admAp\')?.focus(),50)'],['↻ 승인 요청 다시 보내기','admFix(\'resendApprove\')']);
 if(c.g==='sub')B.push(['↻ 검토 요청 다시 보내기','admFix(\'resendReview\')'],['↩ 작성 중으로 되돌리기','admFix(\'toDraft\')']);
 if(c.g==='ok')B.push(['📊 계약 전 평가 결과 보기','openEvalResult(\'CE_'+admQt(c.id)+'\',\'\')']);
 return h+B.map(b=>'<button type="button" class="adbig" onclick="'+b[1]+'">'+b[0]+'</button>').join('')+'<button type="button" class="addel" onclick="admAskPv({kind:\'company\',id:\''+admQt(c.id)+'\'})">🗑 이 업체 지우기</button>'}
function admJobView(){const j=admT.job.find(x=>x.id===admS.id);if(!j)return '<div class="adempty">이미 지워졌습니다</div>';const T=admT.today;
 let h='<button type="button" class="adback" onclick="admGo({t:\'job\',sub:\''+(j.st==='ENDED'?'ended':'open')+'\'})">‹ 목록</button><div class="ogt">'+escapeText(j.name)+' <span class="apl '+(j.st==='OPEN'?'b':'k')+'">'+(j.st==='OPEN'?'진행 중':'종료')+'</span></div>'
  +'<div class="adst">'+escapeText(j.store?'다이소 '+j.store+' · ':'')+(j.st==='OPEN'?escapeText(j.start+' ~ '+(j.end||''))+(j.end&&j.end<T?' <span class="r">(종료일 지남)</span>':''):escapeText(j.ended+' 종료')+' · '+(j.left?'<span class="r">평가 '+j.left+'곳 남음</span>':'평가 완료'))+'</div>';
 if(admCf)return h+admCfBox();
 const B=j.st==='ENDED'?[['↩ 종료 취소 (다시 진행 중으로)','admFix(\'unEnd\')']]:[];
 return h+B.map(b=>'<button type="button" class="adbig" onclick="'+b[1]+'">'+b[0]+'</button>').join('')+'<button type="button" class="addel" onclick="admAskPv({kind:\'job\',id:\''+admQt(j.id)+'\'})">🗑 이 공사 지우기</button>'}
/* 확인 창 (오른쪽 칸 안 · 팝업 없음) */
function admCfBox(){const c=admCf;
 if(c.k==='tbl')return '<div class="adcf"><b>정말 지울까요?</b><p>'+c.rows+'줄'+(c.kids?' + 딸린 기록 '+c.kids+'건':'')+'이 지워지고 되돌릴 수 없습니다.</p><button type="button" class="adbtn d" onclick="admRowsDel()">지우기</button><button type="button" class="adbtn g" onclick="admCf=null;admDraw()">취소</button></div>';
 if(c.k==='fix')return '<div class="adcf m"><b>'+escapeText(c.title)+'</b><p>'+escapeText(c.text)+'</p><button type="button" class="adbtn m" onclick="admFixRun(\''+admQt(c.act)+'\')">'+escapeText(c.btn)+'</button><button type="button" class="adbtn g" onclick="admCf=null;admDraw()">취소</button></div>';
 const v=admPv||{};if(!v.total&&!v.drive)return '<div class="adcf m"><b>지울 기록이 없습니다</b><p>'+escapeText(v.title||'')+'</p><button type="button" class="adbtn g" onclick="admCf=null;admPv=null;admDraw()">닫기</button></div>';
 return '<div class="adcf"><b>정말 지울까요?</b><p>'+escapeText(v.title)+'\n기록 '+Number(v.total).toLocaleString()+'건'+(v.items.some(x=>x.n>=1000)?' 이상':'')+'이 함께 지워지고 되돌릴 수 없습니다.'+(v.drive?'\n드라이브 폴더 '+v.drive+'개는 휴지통으로 (30일 안에 복구 가능)':'')+'</p><button type="button" class="adbtn d" onclick="admRunDel()">지우기</button><button type="button" class="adbtn g" onclick="admCf=null;admPv=null;admDraw()">취소</button></div>'}
async function admAskPv(p){if(admBusy)return;try{admPv=await call('adminPreview',p)}catch(e){return}admCf={k:'pv',kind:p.kind};admDraw()}
const admDone=()=>{admRowsM={};cacheClear();jobData=null;jobAt=0;if(typeof svData!=='undefined')svData=null};
/** 지우기 (50초씩 나눠서 끝날 때까지 이어서 · 진행은 오른쪽 칸에) */
async function admRunDel(){if(!admPv||admBusy)return;const tk=admPv.token,title=admPv.title,kind=admCf&&admCf.kind;let n=0,tr=0;admBusy='지우는 중입니다…';admDraw();
 try{for(let i=0;i<40;i++){const r=await callQuiet('adminDelete',tk);n+=r.deleted;tr+=r.trashed||0;if(!r.more)break;admBusy='지우는 중입니다… '+n.toLocaleString()+'건 (계속)';admDraw()}}
 catch(e){admBusy='';admPv=null;admCf=null;msg(e.message||'지우지 못했습니다.');admLoad();return}
 admBusy='';admPv=null;admCf=null;admDone();if(kind==='company'||kind==='job')admS={t:admS.t,sub:admS.sub};if(kind==='all')admS={t:'issues'};
 msg('지웠습니다 · '+title+' · 기록 '+n.toLocaleString()+'건'+(tr?' · 드라이브 폴더 '+tr+'개 휴지통':''));admDraw();admLoad()}
/** 바로 처리 (되돌리기·종료 취소는 오른쪽 칸에서 한 번 확인) */
const ADM_FIX_ASK={toDraft:['작성 중으로 되돌리기','업체가 서류를 다시 고칠 수 있게 「작성 중」으로 되돌립니다.\n업체가 다시 제출하면 검토 요청이 새로 갑니다.','되돌리기'],unEnd:['공사 종료 취소','이 공사를 다시 「진행 중」으로 바꿉니다.\n작성 중이던 종료 평가는 지워지고, 확정된 평가는 그대로 남습니다.','종료 취소']};
function admFix(act){if(admBusy)return;if(act==='apEmail'){const e=($('f_admAp')?.value||'').trim().toLowerCase();if(!/^[^\s@]+@daiso\.co\.kr$/.test(e)){inspFlag(['f_admAp'],'@daiso.co.kr 회사메일을 적어 주세요');return}admFixRun(act,e);return}
 const q=ADM_FIX_ASK[act];if(q){admCf={k:'fix',act,title:q[0],text:q[1],btn:q[2]};admDraw();return}admFixRun(act)}
async function admFixRun(act,email){const id=admS.id;admCf=null;admEdit=false;admBusy=act==='apEmail'||/^resend/.test(act)?'메일 · Teams 보내는 중입니다…':'처리하는 중입니다…';admDraw();
 let r;try{r=await callQuiet('adminFix',act,id,email||'')}catch(e){admBusy='';msg(e.message||'처리하지 못했습니다.');admDraw();return}
 admBusy='';admDone();if(act==='toDraft')admS={t:'co',sub:'draft',id};if(act==='unEnd')admS={t:'job',sub:'open',id};
 msg(String(r.msg||'처리했습니다.').split('\n')[0]);admDraw();admLoad()}
/* 🔑 마스터 권한 (조직도 구성원 목록 · 체크하면 마스터) */
function admMsLoad(){call('masterList').then(r=>{admMs=r;if(admS.t==='perm')admDraw()}).catch(()=>{})}
function admMsView(){const h='<div class="ogt">🔑 마스터 권한</div><div class="adst">마스터 = 데이터 관리 · 조직도 · 표준양식 · 권한을 바꿀 수 있는 사람. 꼭 필요한 사람만 체크해 주세요.</div>';
 if(!admMs)return h+'<div class="adempty">불러오는 중입니다…</div>';
 const L=admMs.list,n=L.filter(m=>m.master).length+(L.some(m=>m.fixed)?0:admMs.fixed.length);
 return h+(admBusy?admBusyBox():'')+'<div class="adtbar"><span>조직도 구성원 '+L.length+'명</span><span style="margin-left:auto">마스터 '+n+'명</span></div>'
  +(L.length?L.map(m=>{const off=m.fixed||!m.gmail||!!admBusy,cf=admMsCf&&admMsCf.id===m.id;
   return '<label class="admr'+(off?' off':'')+'"><input type="checkbox" '+(m.master?'checked':'')+(off?' disabled':'')+' onchange="admMsAsk(\''+admQt(m.id)+'\',this.checked)" aria-label="'+escapeText(m.name)+' 마스터"><span class="nm"><b>'+escapeText(m.name)+'</b>'+(m.fixed?' <span class="apl k">기본 마스터</span>':'')+'<small>'+escapeText([m.unit,m.title].filter(Boolean).join(' · '))+' · '+(m.gmail?escapeText(m.gmail):'로그인 Gmail 없음 (조직도에서 먼저 넣기)')+'</small></span></label>'
    +(cf?'<div class="adcf'+(admMsCf.on?'':' m')+'"><b>'+escapeText(m.name)+(admMsCf.on?'에게 마스터 권한을 줄까요?':'의 마스터 권한을 뺄까요?')+'</b><p>'+(admMsCf.on?'업체·공사 통째 지우기, 조직도·권한 바꾸기를 할 수 있게 됩니다.':(m.gmail===admMs.me?'본인 권한을 빼면 이 화면을 더 이상 쓸 수 없습니다.':'이제 데이터 관리 · 조직도 메뉴가 안 보이게 됩니다.'))+'</p><button type="button" class="adbtn '+(admMsCf.on?'d':'m')+'" onclick="admMsSave()">'+(admMsCf.on?'권한 주기':'권한 빼기')+'</button><button type="button" class="adbtn g" onclick="admMsCf=null;admDraw()">취소</button></div>':'')}).join(''):'<div class="adempty">조직도에 구성원이 없습니다. 👥 조직도에서 먼저 추가해 주세요.</div>')
  +'<p class="muted" style="font-size:11.5px;margin-top:10px">기본 마스터는 항상 마스터라 바꿀 수 없습니다. 권한을 받은 사람은 다시 로그인하면 메뉴가 보입니다.</p>'}
function admMsAsk(id,on){if(admBusy)return;admMsCf={id,on};admDraw()}
async function admMsSave(){const c=admMsCf;if(!c||admBusy)return;admBusy='저장하는 중입니다…';admDraw();
 try{admMs=await callQuiet('masterSet',c.id,c.on)}catch(e){admBusy='';admMsCf=null;msg(e.message||'저장하지 못했습니다.');admDraw();return}
 admBusy='';admMsCf=null;const m=admMs.list.find(x=>x.id===c.id);msg((m?m.name:'')+(c.on?'에게 마스터 권한을 줬습니다.':'의 마스터 권한을 뺐습니다.'));admDraw()}
/* 📋 표로 보기 (예전 시트처럼: 체크해서 지우기 · 한 번 본 표는 바로 보여 주고 뒤에서 최신으로) */
function admRowsLoad(k){if(admRowsL[k])return;admRowsL[k]=1;call('adminRows',k).then(r=>{admRowsM[k]=r;if(admS.t==='tbl'&&admS.sub===k&&!admBusy&&!admCf)admDraw()}).catch(()=>{}).finally(()=>{delete admRowsL[k]})}
function admTblView(){const k=admS.sub,t=ADM_TBL.find(x=>x[0]===k)||ADM_TBL[0],D=admRowsM[k];
 if(!D){admRowsLoad(k);return '<div class="ogt">📋 '+t[1]+'</div><div class="adempty">불러오는 중입니다…</div>'}
 const all=D.rows;[...admChk].forEach(id=>{if(!all.some(r=>r.id===id))admChk.delete(id)});const kids=all.filter(r=>admChk.has(r.id)).reduce((s,r)=>s+(r.kids||0),0);
 return '<div class="ogt">📋 '+t[1]+' <span class="muted" style="font-weight:400;font-size:12px">'+all.length+'줄'+(D.more?' (최근 300줄만)':'')+'</span></div>'
  +'<input class="adsrch" id="f_admQ" placeholder="🔍 업체 · 공사 · 날짜로 거르기" value="'+escapeText(admQ)+'" oninput="admQ=this.value;admTb()" aria-label="표 거르기">'
  +'<div id="admTb"></div>'
  +(admBusy?admBusyBox():admCf&&admCf.k==='tbl'?admCfBox():'<div class="adsel">'+(admChk.size?'<button type="button" class="adbtn d" onclick="admCf={k:\'tbl\',rows:'+admChk.size+',kids:'+kids+'};admDraw()">🗑 선택한 '+admChk.size+'줄 지우기'+(kids?' (+딸린 '+kids+'건)':'')+'</button>':'<div class="muted" style="font-size:12px;text-align:center">☐ 체크해서 지울 줄을 고르세요 · 줄을 누르면 내용이 펼쳐집니다</div>')+'</div>')}
function admTbL(){const q=admQ.trim(),D=admRowsM[admS.sub];return (D?D.rows:[]).filter(r=>!q||(r.a+' '+r.b).includes(q))}
function admTb(){const el=$('admTb');if(!el||!admRowsM[admS.sub])return;const L=admTbL(),allOn=L.length&&L.every(r=>admChk.has(r.id));
 el.innerHTML='<div class="adtbar"><label><input type="checkbox" '+(allOn?'checked':'')+' onchange="admCkAll(this.checked)"> 보이는 것 모두</label><span style="margin-left:auto">'+L.length+'줄</span></div>'
  +(L.length?L.map((r,i)=>'<div class="adtr'+(admChk.has(r.id)?' on':'')+(admXp.has(r.id)?' open':'')+'"><div class="h"><input type="checkbox" aria-label="'+escapeText(r.a)+' 선택" '+(admChk.has(r.id)?'checked':'')+' onchange="admCk('+i+',this.checked)"><button type="button" class="nm" aria-expanded="'+admXp.has(r.id)+'" onclick="admXpT('+i+')"><b>'+escapeText(r.a)+'</b><small>'+escapeText(r.b)+'</small></button><span class="apl '+escapeText(r.p[1])+'">'+escapeText(r.p[0])+'</span></div><div class="dt">'+(r.d||[]).filter(x=>x[1]!==''&&x[1]!=null).map(x=>'<div><span>'+escapeText(x[0])+'</span><span>'+escapeText(x[1])+'</span></div>').join('')+'</div></div>').join(''):'<div class="adempty">맞는 줄이 없습니다</div>')}
function admCk(i,v){if(admBusy)return;const r=admTbL()[i];if(!r)return;v?admChk.add(r.id):admChk.delete(r.id);admCf=null;admDraw()}
function admCkAll(v){if(admBusy)return;admTbL().forEach(r=>v?admChk.add(r.id):admChk.delete(r.id));admCf=null;admDraw()}
function admXpT(i){const r=admTbL()[i];if(!r)return;admXp.has(r.id)?admXp.delete(r.id):admXp.add(r.id);admTb()}
async function admRowsDel(){const k=admS.sub,ids=[...admChk];if(!ids.length||admBusy)return;admCf=null;admBusy='고른 줄을 지우는 중입니다…';admDraw();let r;
 try{r=await callQuiet('adminRowsDelete',k,ids)}catch(e){admBusy='';msg(e.message||'지우지 못했습니다.');admDraw();return}
 admBusy='';admChk=new Set();const ids0=new Set(ids),D=admRowsM[k];admDone();if(D)admRowsM[k]={...D,rows:D.rows.filter(x=>!ids0.has(x.id))};  // 지운 줄은 바로 빼고 뒤에서 최신으로
 msg(r.rows+'줄'+(r.deleted>r.rows?' (+딸린 '+(r.deleted-r.rows)+'건)':'')+'을 지웠습니다.');admDraw();admRowsLoad(k);admLoad()}
/* ---------- F1.8k [마스터] 도급인 책임자 설정 ----------
 *  총괄책임자(김기호) → 위임받는 책임자(곽동민) · 담당자(비우면 마스터 직원 이름)
 *  위임장 2장 · 순회점검 승인 · 회의록·점검표 머리 · 규정 "갑" 현장대리인에 그대로 들어감 */
const PR_ROWS=[['ceo','총괄책임자 (위임인)'],['delegate','위임받는 책임자 (수임인)'],['manager','도급인 담당자 (검토 · 허가서 승인)']];
const PR_F=[['name','성명'],['rank','직급'],['title','직책'],['org','소속 및 직책']];
function sPrincipal(){setTimeout(()=>sgo('staff'),0);return '<div class="card"><p class="desc">조직도로 이동합니다…</p></div>'}  /* F1.9j 도급인 책임자 = 조직도에서 사람마다 지정 */
async function prLoad(){let P;try{P=await call('principalGet')}catch(e){return}const b=$('prBox');if(!b)return;
 b.innerHTML='<div class="card"><h2 style="margin:0">도급인 책임자 설정</h2><p class="muted" style="margin-top:6px">위임장(협의체 · 합동점검) · 순회점검일지 승인 · 회의록 머리 · 규정 "갑" 현장대리인에 들어갑니다.</p></div>'
  +PR_ROWS.map(([k,l])=>'<div class="card"><h2>'+escapeText(l)+'</h2><div class="split">'+PR_F.map(([f,fl])=>input('pr_'+k+'_'+f,fl,(P[k]||{})[f]||'','text',false,((P.def||{})[k]||{})[f]||'')).join('')+'</div>'+(k==='manager'?'<p class="muted">비워 두면 마스터 계정 직원 이름이 들어갑니다. 허가서 승인·일지 확인 기록은 실제로 버튼을 누른 사람 이름으로 남습니다.</p>':'')+'</div>').join('')
  +'<div class="card roomfoot"><button class="button" type="button" style="width:100%" onclick="prSave()">저장</button></div>'}
async function prSave(){const d={};PR_ROWS.forEach(([k])=>{d[k]={};PR_F.forEach(([f])=>d[k][f]=value('pr_'+k+'_'+f))});
 if(!d.ceo.name||!d.delegate.name){inspFlag([!d.ceo.name?'f_pr_ceo_name':'f_pr_delegate_name'],'총괄책임자와 위임받는 책임자 이름은 꼭 적어 주세요');return}
 try{const P=await call('principalSave',d);if(jobData)jobData.principal=P;jobAt=0;msg('저장했습니다. 위임장·일지에 바로 반영됩니다.');prLoad()}catch(e){}}
