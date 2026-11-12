/* S3 점장 주간 순회점검 화면 (로그인 없음)
 *  들어오는 길: 공통 링크 …/Store-Safety-Firebase/?store  (한 번 들어오면 이 기기는 다음부터 바로 점장 화면)
 *  처음 1번 맡은 매장 고르기(여러 곳) → 이 기기에 기억 · Firebase 익명 계정 · 모든 저장은 중계 서버가 확인 (Relay.gs SC_OPS_)
 *  화면: 홈 · 매장(밀린 주) · 점검표(공통 → 도급 → 이번 달 집중) · 미흡 개선 · 점검 이력 · 협의체 결과(S6) · 매장 다시 고르기 */
let shopOn=false,shV='home',shH=null,shAll=null,shF=null,shDirty=false,shHist=null,shDet=null,shFixI=null,shPick=null,shQ='';
const SH_KEY='shopStores',SH_FLAG='shopMode',SH_HOME='shopHome',SH_ALL='shopAll';
const shLS={get:(k,d)=>{try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set:(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}},del:k=>{try{localStorage.removeItem(k)}catch(e){}}};
const shPicked=()=>shLS.get(SH_KEY,[]).filter(s=>s&&s.c);
/** 점장 화면으로 열지: 주소에 ?store 가 있거나, 이 기기에서 점장 화면을 쓰고 있고 직원·업체 로그인이 없을 때 */
function shopWanted(){if(new URLSearchParams(location.search).has('store'))return true;try{return localStorage.getItem(SH_FLAG)==='1'&&!(typeof SESSION!=='undefined'&&SESSION)}catch(e){return false}}
/* ---------- 모양 ---------- */
const SH_ICONS={home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h13V10"/><path d="M10 19.5v-5h4v5"/>',store:'<path d="M4 9.5 5.5 4.5h13L20 9.5"/><path d="M4 9.5c0 1.4 1.1 2.5 2.7 2.5s2.6-1.1 2.6-2.5c0 1.4 1.1 2.5 2.7 2.5s2.7-1.1 2.7-2.5c0 1.4 1 2.5 2.6 2.5S20 10.9 20 9.5"/><path d="M5.5 12v7.5h13V12"/><path d="M10 19.5v-4h4v4"/>',
 clock:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',doc:'<path d="M6.5 3.5h7l4 4v13h-11z"/><path d="M13.5 3.5v4h4"/><path d="M9 12h6M9 15.5h6"/>',swap:'<path d="M4.5 9h13l-3.5-3.5"/><path d="M19.5 15h-13l3.5 3.5"/>',
 cal:'<rect x="4" y="5.5" width="16" height="14" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',alert:'<path d="M12 4 21 19.5H3z"/><path d="M12 10v4.5M12 17.2v.3"/>',check:'<circle cx="12" cy="12" r="8.5"/><path d="m8.3 12.2 2.5 2.5 4.9-5"/>',
 cam:'<path d="M4 8h3.5l1.5-2.5h6L16.5 8H20v11H4z"/><circle cx="12" cy="13" r="3.3"/>',search:'<circle cx="11" cy="11" r="6"/><path d="m15.5 15.5 4 4"/>',out:'<path d="M14 4.5h5.5v15H14"/><path d="M10 8l-4 4 4 4M6 12h9"/>'};
const shIc=(k,red)=>'<span class="shic'+(red?' red':'')+'" aria-hidden="true"><svg viewBox="0 0 24 24">'+(SH_ICONS[k]||'')+'</svg></span>';
function shCss(){if($('shCss'))return;const s=document.createElement('style');s.id='shCss';s.textContent=
 '.shic{width:34px;height:34px;border-radius:10px;background:var(--bg);display:inline-flex;align-items:center;justify-content:center;flex-shrink:0}.shic svg{width:19px;height:19px;fill:none;stroke:var(--main);stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}.shic.red svg{stroke:var(--accent)}'
 +'.shli{display:flex;align-items:center;gap:11px;width:100%;padding:11px 0;border:0;border-top:1px solid var(--line);background:none;font:inherit;color:inherit;text-align:left;cursor:pointer}.shli:first-of-type{border-top:0}.shli .t{flex:1;min-width:0}.shli .t b{display:block;font-size:15px}'
 +'.shdots{display:flex;gap:4px;margin-top:4px}.shdots i{width:18px;height:5px;border-radius:3px;background:#e5e7eb}.shdots i.on{background:var(--main)}'
 +'.shpill{display:inline-block;font-size:12px;border-radius:999px;padding:2px 10px;font-weight:600;background:var(--bg);color:var(--sub);white-space:nowrap}.shpill.ok{background:var(--okbg);color:var(--ok)}.shpill.no{background:#fff;color:var(--accent);box-shadow:inset 0 0 0 1px #f3c4c7}'
 +'.shstep{display:flex;gap:6px;margin:0 0 10px}.shstep button{flex:1;font:inherit;font-size:13px;font-weight:600;padding:8px 2px;border-radius:9px;background:#fff;border:1px solid var(--line);color:var(--sub)}.shstep button.on{background:var(--main);border-color:var(--main);color:#fff}.shstep button.done:not(.on){color:var(--ok);border-color:#bfe5cc}'
 +'.shgrp{background:#fff;border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:8px}.shgrp.bad{box-shadow:inset 3px 0 0 var(--accent)}.shgrp>b{font-size:15px}.shgrp.miss{border-color:var(--accent)}'
 +'.shtg{display:flex;gap:6px;margin-top:9px}.shtg button{flex:1;font:inherit;font-size:14px;border:1px solid var(--line);border-radius:9px;padding:9px;background:#fff;color:var(--sub)}.shtg .ok{background:var(--main);border-color:var(--main);color:#fff;font-weight:600}.shtg .bad{border-color:var(--accent);color:var(--accent);font-weight:600}'
 +'.shck{display:flex;align-items:flex-start;gap:10px;padding:10px 2px;border-top:1px solid var(--line);font-size:14px;cursor:pointer}.shck input{margin:3px 0 0;width:18px;height:18px;flex-shrink:0;accent-color:var(--main)}'
 +'.shinp{width:100%;border:1px solid var(--line);border-radius:10px;padding:10px 12px;font:inherit;font-size:15px;background:#fff;margin-top:8px}textarea.shinp{min-height:64px;resize:vertical}'
 +'.shcam{display:flex;align-items:center;justify-content:center;gap:8px;min-height:56px;border:1px dashed #cbd5e1;border-radius:10px;margin-top:8px;color:var(--sub);font-size:14px;cursor:pointer;position:relative;overflow:hidden}.shcam svg{width:20px;height:20px;fill:none;stroke:var(--sub);stroke-width:1.7;stroke-linejoin:round}'
 +'.shcam input{position:absolute;inset:0;opacity:0;cursor:pointer}.shcam img{max-width:100%;max-height:220px;display:block;border-radius:8px}.shcam.has{border-style:solid;padding:4px}.shpic{width:100%;max-height:260px;object-fit:contain;border-radius:10px;background:var(--bg);margin-top:8px;display:block;min-height:60px}'
 +'.shsrch{position:relative;margin-top:10px}.shsrch svg{position:absolute;left:11px;top:12px;width:18px;height:18px;fill:none;stroke:var(--sub);stroke-width:1.8;stroke-linecap:round}.shsrch input{padding-left:36px;margin-top:0}'
 +'.shchips{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.shchip{border:1px solid var(--main);border-radius:999px;padding:4px 10px;font-size:13px;background:#fff;font-family:inherit;cursor:pointer}'
 +'.shfoot{position:sticky;bottom:8px;z-index:5;display:flex;gap:8px;background:#fff;border:1px solid var(--line);border-radius:14px;padding:10px;box-shadow:0 6px 20px #0000001a}.shfoot .button{flex:1}'
 +'.shsum{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:10px}.shsum div{border:1px solid var(--line);border-radius:10px;padding:8px 4px;text-align:center}.shsum b{display:block;font-size:18px}.shsum span{font-size:12px;color:var(--sub)}.shsum .r b{color:var(--accent)}'
 +'#navTabs .shnav{display:flex;align-items:center;gap:10px;text-align:left}';document.head.appendChild(s)}
const shW=w=>/^\d{4}-\d{2}-\d{2}$/.test(w||'')?w.slice(5).replace('-','.'):'';
const shWk=w=>shW(w)+' (월) 주';
const shDays=(a,b)=>Math.round((new Date(b+'T00:00:00Z')-new Date(a+'T00:00:00Z'))/864e5);
const shEl=()=>$('my');
/* ---------- 서버 ---------- */
const SH_READ=/^(scStores|scHome|scForm|scHistory|scDetail|scPic)$/;
async function shCall(op,body,quiet){const rd=SH_READ.test(op);if(!quiet)(rd?barStart:loadStart)(op);
 try{return await FB.sm(op,body,op==='scSubmit'?240000:120000)}catch(e){if(!quiet)msg((e&&e.message)||'처리하지 못했습니다.');throw e}finally{if(!quiet)(rd?barEnd:loadEnd)()}}
/* ---------- 시작 ---------- */
async function shopBoot(){shopOn=true;try{localStorage.setItem(SH_FLAG,'1')}catch(e){}shCss();
 $('loginView').hidden=true;$('appView').hidden=false;document.title='매장 점검 · 입고·재고 안전관리';
 ['my','admin','review','tpl','staff','jobs','vendors'].forEach(n=>$(n)&&$(n).classList.toggle('hidden',n!=='my'));
 ['gearBtn','guideBtn'].forEach(id=>$(id)&&($(id).hidden=true));$('identity').textContent='매장 점검';shMenu();
 const lo=document.querySelector('.drawer .logout');if(lo){lo.textContent='직원 · 업체 로그인';lo.onclick=shopExit}
 if(typeof navInit==='function')navInit();if(typeof showVer==='function')showVer({});
 shEl().innerHTML='<div class="card"><p class="muted">준비 중입니다…</p></div>';
 if(!(window.FB&&FB.ok&&FB.anon)){shEl().innerHTML='<div class="card"><h2>연결하지 못했습니다</h2><button class="button" type="button" onclick="location.reload()">다시 시도</button></div>';return}
 try{await FB.anon()}catch(e){shEl().innerHTML='<div class="card"><h2>접속하지 못했습니다</h2><p class="muted">'+escapeText((e&&e.message)||'')+'</p><button class="button" type="button" onclick="location.reload()">다시 시도</button></div>';return}
 shPicked().length?shGo('home'):shGo('pick')}
function shopExit(){shLS.del(SH_FLAG);location.href=location.pathname}
function shMenu(){const M=[['home','home','홈'],['hist','clock','점검 이력'],['council','doc','협의체 결과'],['pick','swap','매장 다시 고르기']];
 $('navTabs').innerHTML=M.map(([k,ic,t])=>'<button id="shm_'+k+'" class="shnav" type="button" onclick="shGo(\''+k+'\')">'+shIc(ic)+'<span>'+t+'</span></button>').join('')}
function shMark(title){document.querySelectorAll('#navTabs .shnav').forEach(b=>b.classList.toggle('active',b.id==='shm_'+(shV==='store'||shV==='fix'?'home':shV==='detail'?'hist':shV)));$('pageTitle').textContent=title||''}
/** 화면 이동 (작성 중인 점검표가 있으면 한 번 물음) */
async function shGo(v,arg){if(shV==='form'&&shDirty&&v!=='form'&&!await askOk('점검표 닫기','작성 중인 내용이 사라집니다.\n닫을까요?','닫기'))return;
 toggleMenu(false);if(v!=='form'){shF=null;shDirty=false}shV=v;window.scrollTo(0,0);
 ({home:shHome,pick:shPickView,store:shStore,form:shFormOpen,hist:shHistView,detail:shDetail,fix:shFix,council:shCouncil}[v]||shHome)(arg)}
/** 뒤로 (app.js backAction) */
function shopBack(){if($('drawer')&&$('drawer').classList.contains('open'))return ()=>toggleMenu(false);const md=$('modal');if(md&&md.style.display==='flex')return ()=>{const c=$('modalCancel');(c&&!c.hidden?c:$('modalBtn')).click()};
 if(shV==='form'&&shF&&shF.step>0)return ()=>shStep(shF.step-1);if(shV==='form')return ()=>shGo('store',shF&&shF.code);if(shV==='detail')return ()=>shGo('hist');if(shV==='pick'&&!shPicked().length)return null;if(shV!=='home')return ()=>shGo('home');return null}

/* ---------- 매장 고르기 ---------- */
async function shPickView(){shMark('내 매장');shPick=new Map(shPicked().map(s=>[s.c,s]));shQ='';
 const c=shLS.get(SH_ALL,null);shAll=c&&c.at&&Date.now()-c.at<6*3600e3&&(c.stores||[]).length?c.stores:null;
 shPickDraw();if(!shAll){try{const r=await shCall('scStores',{});shAll=r.stores||[];if(shAll.length)shLS.set(SH_ALL,{at:Date.now(),stores:shAll});if(shV==='pick')shPickDraw()}catch(e){}}}
function shPickDraw(){const n=shPick.size;
 shEl().innerHTML='<div class="card"><h2 style="margin:0">내 매장</h2><div class="shsrch">'+'<svg viewBox="0 0 24 24">'+SH_ICONS.search+'</svg><input id="shQ" class="shinp" type="search" placeholder="매장명 · 코드" value="'+escapeText(shQ)+'" oninput="shQ=this.value;shPickRes()" aria-label="매장 찾기" autocomplete="off"></div>'
  +'<div class="shchips" id="shSel">'+shSelHtml()+'</div><div id="shRes">'+shPickResHtml()+'</div>'
  +'<button class="button" type="button" style="width:100%;margin-top:12px" id="shStart" onclick="shPickSave()"'+(n?'':' disabled')+'>시작'+(n?' ('+n+'곳)':'')+'</button></div>'}
const shSelHtml=()=>[...shPick.values()].map(s=>'<button type="button" class="shchip" onclick="shPickT(\''+escapeText(s.c)+'\')" aria-label="'+escapeText(s.n)+' 빼기">'+escapeText(s.n)+' ✕</button>').join('');
function shPickResHtml(){if(!shAll)return '<p class="muted" style="margin:10px 0 0">매장 목록을 불러오는 중…</p>';const q=String(shQ||'').replace(/\s/g,'').toLowerCase();if(!q)return '';
 const L=shAll.filter(r=>String(r[1]).replace(/\s/g,'').toLowerCase().includes(q)||String(r[0]).startsWith(q)).slice(0,30);
 if(!L.length)return '<p class="muted" style="margin:10px 0 0">없음</p>';
 return L.map(r=>'<label class="shck"><input type="checkbox" '+(shPick.has(r[0])?'checked':'')+' onchange="shPickT(\''+escapeText(r[0])+'\')"><span style="flex:1">'+escapeText(r[1])+'</span><span class="muted">'+escapeText(r[2])+'</span></label>').join('')}
function shPickRes(){const e=$('shRes');if(e)e.innerHTML=shPickResHtml()}
function shPickT(c){if(shPick.has(c))shPick.delete(c);else{if(shPick.size>=20){msg('20곳까지 고를 수 있습니다.');shPickRes();return}const r=(shAll||[]).find(x=>x[0]===c);if(r)shPick.set(c,{c:r[0],n:r[1],t:r[2],k:r[3]})}
 $('shSel').innerHTML=shSelHtml();shPickRes();const b=$('shStart'),n=shPick.size;b.disabled=!n;b.textContent='시작'+(n?' ('+n+'곳)':'')}
async function shPickSave(){const L=[...shPick.values()];if(!L.length)return;shLS.set(SH_KEY,L);shLS.del(SH_HOME);shCall('scPick',{codes:L.map(s=>s.c)},true).catch(()=>{});shGo('home')}

/* ---------- 홈 ---------- */
async function shHome(){const P=shPicked();if(!P.length){shGo('pick');return}shH=shLS.get(SH_HOME,null);if(shH)shHomeDraw();else{shMark('홈');shEl().innerHTML='<div class="card"><p class="muted">불러오는 중…</p></div>'}
 try{const r=await shCall('scHome',{codes:P.map(s=>s.c)});shH=r;shLS.set(SH_HOME,r);if(shV==='home')shHomeDraw()}catch(e){if(!shH)shEl().innerHTML='<div class="card"><h2>불러오지 못했습니다</h2><button class="button" type="button" onclick="shGo(\'home\')">다시 시도</button></div>'}}
function shHomeDraw(){const H=shH;shMark(shW(H.thisWeek)+' 주');
 const st=H.stores.map(s=>{const n=s.owed.length,done=!n;return '<button class="shli" type="button" onclick="shGo(\'store\',\''+escapeText(s.c)+'\')">'+shIc('store')+'<span class="t"><b>'+escapeText(s.n)+'</b><span class="shdots" aria-label="최근 4주">'+s.last4.map(x=>'<i'+(x?' class="on"':'')+'></i>').join('')+'</span></span>'+(done?'<span class="shpill ok">완료</span>':'<span class="shpill no">'+n+'장</span>')+'</button>'}).join('');
 const I=H.issues||[];
 shEl().innerHTML='<div class="card">'+(st||'<p class="muted">매장이 없습니다.</p>')+'</div>'
  +((H.gone||[]).length?'<button class="vtodo" type="button" onclick="shGo(\'pick\')"><span>목록에 없는 매장 '+H.gone.length+'곳</span><span class="req">다시 고르기 ›</span></button>':'')
  +(I.length?'<div class="card"><div class="vh-top" style="align-items:center"><h2 style="margin:0">미조치</h2><span class="shpill no">'+I.length+'</span></div>'+I.slice(0,30).map(x=>'<button class="shli" type="button" onclick="shGo(\'fix\',\''+escapeText(x.id)+'\')">'+shIc('alert',1)+'<span class="t"><b>'+escapeText(x.name)+'</b><span class="muted">'+escapeText(x.storeName+' · '+shW(x.foundDate)+(x.company?' · '+x.company:''))+'</span></span><span class="shpill">'+shDays(x.foundDate,H.today)+'일째</span></button>').join('')+'</div>':'')}

/* ---------- 매장 (밀린 주) ---------- */
function shStore(code){const s=shH&&shH.stores.find(x=>x.c===code);if(!s){shGo('home');return}shMark(s.n);const O=s.owed;
 shEl().innerHTML='<div class="card">'+(O.length?O.map((w,i)=>{const cur=w===shH.thisWeek;return '<button class="shli" type="button" onclick="shGo(\'form\',{code:\''+escapeText(code)+'\',week:\''+w+'\'})">'+shIc('cal',!cur)+'<span class="t"><b>'+shWk(w)+'</b><span class="muted">등록일 '+(cur?'오늘':shW(w))+'</span></span><span class="shpill'+(i===0?' no':'')+'">'+(i===0?'작성':'다음')+'</span></button>'}).join('')
  +'<button class="button" type="button" style="width:100%;margin-top:10px" onclick="shGo(\'form\',{code:\''+escapeText(code)+'\',week:\''+O[0]+'\'})">'+shW(O[0])+' 주 점검</button>'
  :'<div class="shli" style="cursor:default">'+shIc('check')+'<span class="t"><b>'+shWk(shH.thisWeek)+'</b><span class="muted">완료</span></span><span class="shpill ok">완료</span></div><button class="button ghost" type="button" style="width:100%;margin-top:10px" onclick="shHistView(\''+escapeText(code)+'\')">점검 이력</button>')+'</div>'}

/* ---------- 점검표 ---------- */
async function shFormOpen(arg){const {code,week}=arg||{};shMark('');shEl().innerHTML='<div class="card"><p class="muted">점검표를 여는 중…</p></div>';let r;
 try{r=await shCall('scForm',{store:code,week})}catch(e){shV='store';shStore(code);return}if(shV!=='form')return;
 shF={code,week,s:r.store,regDate:r.regDate,late:r.late,F:r.form,V:r.vendors||[],step:0,c:{},d:{has:false,companyId:'',g:{}},f:{}};shDirty=false;window.__wkCo=r.store.n;shFormDraw()}
const shSteps=()=>['공통','도급',shF.F.focus.month+'월 집중'];
const shGrpSt=(M,id)=>M[id]||(M[id]={st:'',items:[],memo:'',ph:null,url:''});
function shFormDraw(){const F=shF.F,i=shF.step,S=shSteps();shMark(shF.s.n+' · '+shW(shF.week)+' 주');
 const done=[shMiss(0).length===0,shMiss(1).length===0,shMiss(2).length===0];
 let h='<div class="shstep" role="tablist">'+S.map((t,k)=>'<button type="button" role="tab" aria-selected="'+(k===i)+'" class="'+(k===i?'on':'')+(done[k]?' done':'')+'" onclick="shStep('+k+')">'+escapeText(t)+'</button>').join('')+'</div>';
 if(shF.late&&i===0)h+='<div class="card" style="padding:10px 14px"><span class="muted">밀린 주 · 등록일 '+shW(shF.week)+'</span></div>';
 if(i===0)h+=F.common.map(g=>shGrpHtml('c',g,shF.c)).join('');
 if(i===1){const D=shF.d,nv=!shF.V.length;
  h+='<div class="card"><label class="shck" style="border:0;padding-top:0"><input type="checkbox" '+(D.has?'checked':'')+(nv&&!D.has?' disabled':'')+' onchange="shHas(this.checked)"><b>입고도우미 작업 있음</b></label>'
   +(nv?'<p class="muted" style="margin:4px 0 0">등록된 입고도우미 업체가 없습니다.</p>':D.has?'<select id="shCo" class="shinp" onchange="shF.d.companyId=this.value;shDirty=true;this.classList.remove(\'miss\')" aria-label="입고도우미 업체"><option value="">업체 선택</option>'+shF.V.map(v=>'<option value="'+escapeText(v.id)+'"'+(v.id===D.companyId?' selected':'')+'>'+escapeText(v.n)+'</option>').join('')+'</select>':'')+'</div>';
  if(D.has)h+=F.contract.map(g=>shGrpHtml('d',g,D.g)).join('')}
 if(i===2){h+='<div class="card" style="padding:12px 14px"><h2 style="margin:0;font-size:16px">'+escapeText(F.focus.name)+'</h2></div>'+F.focus.items.map(x=>shFocHtml(x)).join('')}
 h+='<div class="shfoot">'+(i>0?'<button class="button ghost" type="button" onclick="shStep('+(i-1)+')">이전</button>':'')+(i<2?'<button class="button" type="button" onclick="shNext()">다음</button>':'<button class="button" type="button" onclick="shSubmit()">제출</button>')+'</div>';
 shEl().innerHTML=h}
function shGrpHtml(p,g,M){const x=shGrpSt(M,g.id),bad=x.st==='P',k=p+'_'+g.id;
 return '<div class="shgrp'+(bad?' bad':'')+'" id="sg_'+k+'"><b>'+escapeText(g.name)+'</b><div class="shtg"><button type="button" class="'+(x.st==='G'?'ok':'')+'" aria-pressed="'+(x.st==='G')+'" onclick="shSet(\''+p+'\',\''+g.id+'\',\'G\')">양호</button><button type="button" class="'+(bad?'bad':'')+'" aria-pressed="'+bad+'" onclick="shSet(\''+p+'\',\''+g.id+'\',\'P\')">미흡</button></div>'
  +(bad?g.items.map(it=>'<label class="shck"><input type="checkbox" '+(x.items.includes(it.id)?'checked':'')+' onchange="shItem(\''+p+'\',\''+g.id+'\',\''+escapeText(it.id)+'\',this.checked)"><span>'+escapeText(it.t)+'</span></label>').join('')
   +'<textarea class="shinp" id="sm_'+k+'" placeholder="미흡 내용" oninput="shMemo(\''+p+'\',\''+g.id+'\',this.value)">'+escapeText(x.memo)+'</textarea>'+shCamHtml(p,g.id,x):'')+'</div>'}
function shFocHtml(it){const x=shGrpSt(shF.f,it.id),bad=x.st==='R',k='f_'+it.id;
 return '<div class="shgrp'+(bad?' bad':'')+'" id="sg_'+k+'"><b>'+escapeText(it.t)+'</b>'+(it.d?'<div class="muted">'+escapeText(it.d)+'</div>':'')+'<div class="shtg"><button type="button" class="'+(x.st==='S'?'ok':'')+'" aria-pressed="'+(x.st==='S')+'" onclick="shSet(\'f\',\''+it.id+'\',\'S\')">안전</button><button type="button" class="'+(bad?'bad':'')+'" aria-pressed="'+bad+'" onclick="shSet(\'f\',\''+it.id+'\',\'R\')">위험</button></div>'
  +(bad?'<textarea class="shinp" id="sm_'+k+'" placeholder="위험 내용" oninput="shMemo(\'f\',\''+it.id+'\',this.value)">'+escapeText(x.memo)+'</textarea>'+shCamHtml('f',it.id,x):'')+'</div>'}
const shCamHtml=(p,id,x)=>'<label class="shcam'+(x.url?' has':'')+'" id="sc_'+p+'_'+id+'">'+(x.url?'<img src="'+x.url+'" alt="사진">':'<svg viewBox="0 0 24 24">'+SH_ICONS.cam+'</svg>사진')+'<input type="file" accept="image/*" aria-label="사진" onchange="shPh(\''+p+'\',\''+id+'\',this)"></label>';
const shMap=p=>p==='c'?shF.c:p==='d'?shF.d.g:shF.f;
function shRedrawGrp(p,id){const y=window.scrollY;shFormDraw();window.scrollTo(0,y)}
function shSet(p,id,st){const x=shGrpSt(shMap(p),id);x.st=st;shDirty=true;shRedrawGrp(p,id)}
function shItem(p,id,it,on){const x=shGrpSt(shMap(p),id);x.items=on?[...new Set(x.items.concat(it))]:x.items.filter(v=>v!==it);shDirty=true;$('sg_'+p+'_'+id)?.classList.remove('miss')}
function shMemo(p,id,v){shGrpSt(shMap(p),id).memo=v;shDirty=true}
async function shPh(p,id,inp){const f=inp.files&&inp.files[0];if(!f)return;try{const r=await readFile(f,PHOTO_STAMP);const x=shGrpSt(shMap(p),id);x.ph=r;x.url='data:'+r.mime+';base64,'+r.data;shDirty=true;shRedrawGrp(p,id)}catch(e){msg((e&&e.message)||'사진을 읽지 못했습니다.')}}
function shHas(on){shF.d.has=!!on;shDirty=true;shFormDraw()}
/** 단계별 빠진 칸 → [요소 id, 안내] */
function shMiss(i){const F=shF.F,L=[],grp=(p,G,M,good,bad)=>G.forEach(g=>{const x=M[g.id]||{},k=p+'_'+g.id,nm=g.name||g.t;if(!x.st)L.push(['sg_'+k,nm+' · '+good+' / '+bad]);else if(x.st===(p==='f'?'R':'P')){if(p!=='f'&&!x.items.length)L.push(['sg_'+k,nm+' · 문항']);if(!String(x.memo||'').trim())L.push(['sm_'+k,nm+' · 내용']);if(!x.ph)L.push(['sc_'+k,nm+' · 사진'])}});
 if(i===0)grp('c',F.common,shF.c,'양호','미흡');
 if(i===1&&shF.d.has){if(!shF.d.companyId)L.push(['shCo','입고도우미 업체']);grp('d',F.contract,shF.d.g,'양호','미흡')}
 if(i===2)grp('f',F.focus.items,shF.f,'안전','위험');return L}
function shFlag(L){inspFlag(L.map(x=>x[0]),'빠진 곳 '+L.length+' · '+L[0][1])}
function shStep(k){shF.step=Math.max(0,Math.min(2,k));shFormDraw();window.scrollTo(0,0)}
function shNext(){const L=shMiss(shF.step);if(L.length){shFlag(L);return}shStep(shF.step+1)}
async function shSubmit(){for(let i=0;i<3;i++){const L=shMiss(i);if(L.length){if(shF.step!==i)shStep(i);setTimeout(()=>shFlag(L),80);return}}
 const pack=(G,M)=>G.map(g=>{const x=M[g.id];return x.st==='P'?{g:g.id,st:'P',items:x.items,memo:x.memo.trim(),ph:x.ph}:{g:g.id,st:'G'}}),F=shF.F;
 const body={store:shF.code,week:shF.week,common:pack(F.common,shF.c),contract:shF.d.has?{has:true,companyId:shF.d.companyId,groups:pack(F.contract,shF.d.g)}:{has:false},
  focus:F.focus.items.map(it=>{const x=shF.f[it.id];return x.st==='R'?{id:it.id,st:'R',memo:x.memo.trim(),ph:x.ph}:{id:it.id,st:'S'}})};
 const n=[].concat(body.common,body.contract.groups||[]).filter(x=>x.st==='P').length,r=body.focus.filter(x=>x.st==='R').length;
 if(!await askOk('제출',shF.s.n+' · '+shWk(shF.week)+'\n미흡 '+n+' · 위험 '+r+'\n\n제출할까요?','제출'))return;
 const code=shF.code;
 try{const o=await shCall('scSubmit',body);shDirty=false;shLS.del(SH_HOME);msg('제출했습니다.'+(o.dPoor?' (도급 미흡 '+o.dPoor+')':''));shGo('home')}
 catch(e){if(/이미 제출/.test((e&&e.message)||'')){shDirty=false;shLS.del(SH_HOME);shGo('home')}}}

/* ---------- 미흡 개선 ---------- */
const shPicMem={};
async function shPicLoad(imgId,store,ref,fid){if(!fid)return;const el=()=>$(imgId);if(shPicMem[fid]){if(el())el().src=shPicMem[fid];return}
 try{const r=await shCall('scPic',{store,ref,fid},true);shPicMem[fid]='data:'+r.mime+';base64,'+r.data;if(el())el().src=shPicMem[fid]}catch(e){if(el())el().alt='사진을 불러오지 못했습니다'}}
async function shFix(id){const x=shH&&(shH.issues||[]).find(i=>i.id===id);if(!x){shGo('home');return}shMark('미조치');const inspId=id.slice(0,id.lastIndexOf('_'));
 shFixI={x,ph:null,url:'',memo:''};shEl().innerHTML='<div class="card"><p class="muted">불러오는 중…</p></div>';let d;
 try{d=await shCall('scDetail',{store:x.store,id:inspId})}catch(e){shGo('home');return}if(shV!=='fix')return;
 const all=[].concat(d.common||[],(d.contract&&d.contract.groups)||[],(d.focus&&d.focus.items)||[]),g=all.find(v=>(v.g||v.id)===id.slice(id.lastIndexOf('_')+1))||{};shFixI.g=g;shFixDraw();
 if(g.ph)shPicLoad('shBefore',x.store,id,g.ph)}
function shFixDraw(){const {x,g}=shFixI;
 shEl().innerHTML='<div class="card"><div class="vh-top" style="align-items:center"><h2 style="margin:0">'+escapeText(x.name)+'</h2><span class="shpill no">'+shDays(x.foundDate,shH.today)+'일째</span></div><div class="muted">'+escapeText(x.storeName+' · '+shW(x.foundDate)+(x.company?' · '+x.company:''))+'</div>'
  +(g.ph?'<img id="shBefore" class="shpic" alt="조치 전 사진">':'')+((g.items||[]).length?'<div class="muted" style="margin-top:8px">'+g.items.map(i=>'· '+escapeText(i.t||i)).join('<br>')+'</div>':'')+(g.memo?'<p style="margin:8px 0 0">'+escapeText(g.memo)+'</p>':'')
  +'<textarea class="shinp" id="shFixMemo" placeholder="개선 내용" oninput="shFixI.memo=this.value">'+escapeText(shFixI.memo)+'</textarea>'
  +'<label class="shcam'+(shFixI.url?' has':'')+'" id="shFixCam">'+(shFixI.url?'<img src="'+shFixI.url+'" alt="개선 후 사진">':'<svg viewBox="0 0 24 24">'+SH_ICONS.cam+'</svg>개선 후 사진')+'<input type="file" accept="image/*" aria-label="개선 후 사진" onchange="shFixPh(this)"></label>'
  +'<button class="button" type="button" style="width:100%;margin-top:12px" onclick="shFixSave()">저장</button></div>';
 if(g.ph&&shPicMem[g.ph])$('shBefore').src=shPicMem[g.ph]}
async function shFixPh(inp){const f=inp.files&&inp.files[0];if(!f)return;try{window.__wkCo=shFixI.x.storeName;const r=await readFile(f,PHOTO_STAMP);shFixI.ph=r;shFixI.url='data:'+r.mime+';base64,'+r.data;shFixDraw()}catch(e){msg((e&&e.message)||'사진을 읽지 못했습니다.')}}
async function shFixSave(){const F=shFixI,miss=[];if(!F.memo.trim())miss.push('shFixMemo');if(!F.ph)miss.push('shFixCam');if(miss.length){inspFlag(miss,miss.length>1?'개선 내용 · 사진':miss[0]==='shFixMemo'?'개선 내용':'개선 후 사진');return}
 try{await shCall('scFix',{store:F.x.store,id:F.x.id,memo:F.memo.trim(),ph:F.ph});shLS.del(SH_HOME);msg('저장했습니다.');shGo('home')}catch(e){if(/이미 조치/.test((e&&e.message)||'')){shLS.del(SH_HOME);shGo('home')}}}

/* ---------- 점검 이력 ---------- */
async function shHistView(code){shV='hist';shMark('점검 이력');const P=shPicked();if(!P.length){shGo('pick');return}code=code||(shHist&&shHist.store&&P.some(s=>s.c===shHist.store.c)?shHist.store.c:P[0].c);
 const seg=P.length>1?'<div class="card" style="padding:10px"><select class="shinp" style="margin:0" onchange="shHistView(this.value)" aria-label="매장">'+P.map(s=>'<option value="'+escapeText(s.c)+'"'+(s.c===code?' selected':'')+'>'+escapeText(s.n)+'</option>').join('')+'</select></div>':'';
 shEl().innerHTML=seg+'<div class="card" id="shHistBox"><p class="muted">불러오는 중…</p></div>';
 try{shHist=await shCall('scHistory',{store:code})}catch(e){return}if(shV!=='hist')return;const L=shHist.list||[];
 $('shHistBox').innerHTML=L.length?L.map(w=>{const bad=(w.cPoor||0)+(w.dPoor||0)+(w.fRisk||0);return '<button class="shli" type="button" onclick="shGo(\'detail\',\''+escapeText(w.id)+'\')">'+shIc('cal')+'<span class="t"><b>'+shWk(w.week)+'</b><span class="muted">등록 '+shW(w.regDate)+(w.company?' · '+escapeText(w.company):'')+'</span></span>'+(bad?'<span class="shpill'+(w.open?' no':'')+'">미흡 '+bad+(w.open?' · 미조치 '+w.open:'')+'</span>':'<span class="shpill ok">양호</span>')+'</button>'}).join(''):'<p class="muted" style="margin:0">아직 없습니다.</p>'}
async function shDetail(id){shMark('점검 이력');const code=shHist&&shHist.store.c;if(!code){shGo('hist');return}shEl().innerHTML='<div class="card"><p class="muted">불러오는 중…</p></div>';
 try{shDet=await shCall('scDetail',{store:code,id})}catch(e){shGo('hist');return}if(shV!=='detail')return;const d=shDet,fx=d.fix||{},pics=[];
 const row=(x,bad,name)=>{if(!bad)return '';const f=fx[x.g||x.id]||{},k='shp'+pics.length;if(x.ph)pics.push([k,x.ph,(f.id||d.id)]);
  return '<div class="shgrp bad"><div class="vh-top" style="align-items:center"><b>'+escapeText(name)+'</b>'+(f.status==='DONE'?'<span class="shpill ok">조치 '+escapeText(String(f.fixAt||'').slice(5,10).replace('-','.'))+'</span>':'<span class="shpill no">미조치</span>')+'</div>'
   +((x.items||[]).length?'<div class="muted" style="margin-top:6px">'+x.items.map(i=>'· '+escapeText(i.t||i)).join('<br>')+'</div>':'')+(x.memo?'<p style="margin:6px 0 0">'+escapeText(x.memo)+'</p>':'')+(x.ph?'<img id="'+k+'" class="shpic" alt="사진">':'')
   +(f.status==='DONE'&&f.fixMemo?'<p class="muted" style="margin:6px 0 0">개선: '+escapeText(f.fixMemo)+'</p>':'')+'</div>'};
 const sec=(t,L,isBad,nm,cnt)=>'<div class="card" style="padding:12px 14px"><div class="vh-top" style="align-items:center"><h2 style="margin:0;font-size:16px">'+t+'</h2><span class="muted">'+cnt+'</span></div></div>'+L.map(x=>row(x,isBad(x),nm(x))).join('');
 const C=d.common||[],D=(d.contract&&d.contract.groups)||[],Fo=(d.focus&&d.focus.items)||[];
 shEl().innerHTML='<div class="card"><button class="button ghost" type="button" onclick="shGo(\'hist\')">← 점검 이력</button><h2 style="margin:12px 0 0">'+escapeText(d.storeName)+' · '+shWk(d.week)+'</h2><div class="muted">등록일 '+shW(d.regDate)+(d.late?' · 밀린 주':'')+'</div>'
  +'<div class="shsum"><div class="'+(d.cPoor?'r':'')+'"><b>'+(d.cPoor||0)+'</b><span>공통 미흡</span></div><div class="'+(d.dPoor?'r':'')+'"><b>'+(d.contract&&d.contract.has?(d.dPoor||0):'–')+'</b><span>도급 미흡</span></div><div class="'+(d.fRisk?'r':'')+'"><b>'+(d.fRisk||0)+'</b><span>집중 위험</span></div></div></div>'
  +sec('공통',C,x=>x.st==='P',x=>x.n,'양호 '+C.filter(x=>x.st==='G').length+' / '+C.length)
  +(d.contract&&d.contract.has?sec('도급 · '+escapeText(d.contract.company||''),D,x=>x.st==='P',x=>x.n,'양호 '+D.filter(x=>x.st==='G').length+' / '+D.length):'<div class="card" style="padding:12px 14px"><span class="muted">도급 · 입고도우미 작업 없음</span></div>')
  +sec(escapeText((d.focus&&d.focus.month)+'월 '+((d.focus&&d.focus.name)||'')),Fo,x=>x.st==='R',x=>x.t,'안전 '+Fo.filter(x=>x.st==='S').length+' / '+Fo.length);
 pics.forEach(([k,fid,ref])=>shPicLoad(k,code,ref,fid))}

/* ---------- 협의체 결과 (S6에서 채움) ---------- */
function shCouncil(){shMark('협의체 결과');shEl().innerHTML='<div class="card"><p class="muted" style="margin:0">아직 없습니다.</p></div>'}
