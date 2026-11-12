/* S4 본사: 점장 점검 현황 · 점검 항목 관리 · 가이드 사진 · 점검 시작 주 — 'jobs' 칸에 그림 (staff.js renderJobs)
 *  현황: 주 고르기 → 부서 → 팀 → 매장 · 제출 · 미제출 · 밀린 주 · 미흡 수 · 매장 누르면 점검 1장 (사진 포함)
 *  서버: fb.js checkBoard (WEEKSUM 주마다 1번 읽기) · scCounts · scDetail / Relay ckGet · ckSave · ckGuide · ckStart */
let chkB=null,chkW='',chkLv=['all'],chkCnt=null,chkDet=null,ckE=null,ckInfo=null,ckTab='c',ckMon=new Date().getMonth()+1,ckDirty=false;
const chkAdd=(w,n)=>{const d=new Date(w+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const chkWl=w=>w?w.slice(5).replace('-','.'):'';
function ckReset(){chkDet=null;if(!ckDirty)ckE=null;if(typeof caCur!=='undefined')caCur=''}
function chkCss(){if(typeof shCss==='function')shCss();if(typeof stCss==='function')stCss();if($('chkCss'))return;const s=document.createElement('style');s.id='chkCss';s.textContent=
 '.chkbar{display:flex;align-items:center;justify-content:space-between;gap:8px}.chkbar button{min-width:44px}.chkbar b{font-size:18px}'
 +'.chknum{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}.chknum div{border:1px solid var(--line);border-radius:10px;padding:8px 4px;text-align:center}.chknum b{display:block;font-size:18px}.chknum span{font-size:12px;color:var(--sub)}.chknum .r b{color:var(--accent)}'
 +'.chkt td,.chkt th{padding:7px 8px}.chkt tr.go{cursor:pointer}.chkt tr.go:hover td{background:var(--bg)}.chkt .n{text-align:right;white-space:nowrap}.chkt .r{color:var(--accent);font-weight:600}'
 +'.chkcrumb{display:flex;flex-wrap:wrap;gap:4px;align-items:center;font-size:14px}.chkcrumb button{border:0;background:none;font:inherit;color:var(--sub);cursor:pointer;padding:2px 4px}.chkcrumb b{padding:2px 4px}'
 +'.ckg{border:1px solid var(--line);border-radius:12px;padding:12px;margin-top:10px;background:#fff}.ckg.off{opacity:.55}.ckrow{display:flex;gap:6px;align-items:flex-start;margin-top:6px}.ckrow textarea,.ckrow input[type=text]{flex:1;min-width:0;padding:8px 10px;border:1px solid var(--line);border-radius:8px;font:inherit;resize:vertical}'
 +'.ckrow select{padding:8px;border:1px solid var(--line);border-radius:8px;font:inherit;background:#fff}.ckuse{display:flex;align-items:center;gap:4px;font-size:13px;white-space:nowrap;color:var(--sub);padding-top:8px}'
 +'.ckgd{display:flex;gap:8px;margin-top:8px}.ckgd>div{flex:1;border:1px dashed #cbd5e1;border-radius:10px;padding:6px;text-align:center;font-size:12.5px;color:var(--sub);position:relative}.ckgd img{width:100%;max-height:120px;object-fit:contain;display:block;border-radius:6px;margin-bottom:4px}'
 +'.ckgd label{cursor:pointer;color:var(--main);font-weight:600}.ckgd input{display:none}.ckgd .x{border:0;background:none;color:var(--accent);font:inherit;font-size:12.5px;cursor:pointer}';document.head.appendChild(s)}

/* ---------- 점검 현황 ---------- */
async function chkLoad(quiet){try{chkB=await (quiet?callQuiet:call)('checkBoard');if(!chkW||chkW>chkB.thisWeek||chkW<chkB.start)chkW=chkB.thisWeek}catch(e){}
 try{chkCnt=await callQuiet('scCounts')}catch(e){}if(tab==='jobs'&&smenu==='check')renderJobs()}
function chkRows(){const B=chkB,T={},DN={};B.teams.forEach(([t,d])=>{T[t]=d});B.depts.forEach(d=>{DN[d.id]=d.name});
 const W=[];for(let w=B.start;w<=B.thisWeek&&W.length<520;w=chkAdd(w,7))W.push(w);const cur=B.weeks[chkW]||{};
 return B.stores.map(r=>{const c=r[0];return {c,n:r[1],t:r[2]||'(팀 없음)',k:r[3],dept:DN[T[r[2]]]||'부서 미지정',s:cur[c]||null,owed:W.filter(w=>w<=chkW&&!(B.weeks[w]||{})[c]).length}})}
function chkSum(L){const sub=L.filter(x=>x.s);return {n:L.length,sub:sub.length,c:sub.reduce((a,x)=>a+(x.s.c||0),0),d:sub.reduce((a,x)=>a+(x.s.d||0),0),f:sub.reduce((a,x)=>a+(x.s.f||0),0),late:L.filter(x=>x.owed>(x.s?0:1)).length}}
const chkPct=(a,b)=>b?Math.round(a/b*100)+'%':'–';
function sChk(){chkCss();if(chkDet){jobsMode='form';return chkDet}if(!chkB){chkLoad();return '<div class="card"><h2>점검 현황</h2><p class="muted">불러오는 중입니다…</p></div>'}
 const B=chkB,all=chkRows(),[lv,a,b]=chkLv,L=lv==='all'?all:lv==='dept'?all.filter(x=>x.dept===a):all.filter(x=>x.dept===a&&x.t===b),S=chkSum(L);
 const prev=chkW>B.start,next=chkW<B.thisWeek;
 let h='<div class="card"><div class="chkbar"><button class="button ghost" type="button" onclick="chkWeek(-7)"'+(prev?'':' disabled')+' aria-label="지난주">‹</button><b>'+chkWl(chkW)+' (월) 주'+(chkW===B.thisWeek?' · 이번 주':'')+'</b><button class="button ghost" type="button" onclick="chkWeek(7)"'+(next?'':' disabled')+' aria-label="다음 주">›</button></div>'
  +'<div class="chknum"><div><b>'+S.n+'</b><span>매장</span></div><div><b>'+S.sub+'</b><span>제출 '+chkPct(S.sub,S.n)+'</span></div><div class="'+(S.n-S.sub?'r':'')+'"><b>'+(S.n-S.sub)+'</b><span>미제출</span></div><div class="'+(S.late?'r':'')+'"><b>'+S.late+'</b><span>밀린 주 있음</span></div></div>'
  +'<div class="chknum" style="grid-template-columns:repeat(3,1fr)"><div class="'+(S.c?'r':'')+'"><b>'+S.c+'</b><span>공통 미흡</span></div><div class="'+(S.d?'r':'')+'"><b>'+S.d+'</b><span>도급 미흡</span></div><div class="'+(S.f?'r':'')+'"><b>'+S.f+'</b><span>집중 위험</span></div></div>'
  +(chkCnt&&lv==='all'?'<div class="muted" style="margin-top:8px">미조치 전체 · 공통 '+chkCnt.COMMON+' · 도급 '+chkCnt.CONTRACT+' · 집중 '+chkCnt.FOCUS+'</div>':'')+'</div>';
 if(!B.stores.length)return h+'<div class="card"><p class="muted" style="margin:0">매장 목록을 먼저 반영해 주세요. (☰ 매장 → 매장 목록)</p></div>';
 h+='<div class="card"><div class="chkcrumb">'+(lv==='all'?'<b>전체</b>':'<button type="button" onclick="chkGo([\'all\'])">전체</button> ›')+(lv!=='all'?(lv==='dept'?'<b>'+escapeText(a)+'</b>':'<button type="button" onclick="chkGo([\'dept\',\''+escapeText(a)+'\'])">'+escapeText(a)+'</button> › <b>'+escapeText(b)+'</b>'):'')
  +'<span style="flex:1"></span><button class="button ghost" type="button" style="padding:6px 10px;font-size:13px" onclick="chkCopy()">미제출 복사</button></div>';
 const grp=(key,next)=>{const G={};L.forEach(x=>{(G[x[key]]=G[x[key]]||[]).push(x)});const K=Object.keys(G).sort((p,q)=>(p==='부서 미지정')-(q==='부서 미지정')||p.localeCompare(q,'ko',{numeric:true}));
  return '<table class="rtable chkt" style="margin-top:10px"><tr><th>'+(key==='dept'?'부서':'팀')+'</th><th class="n">매장</th><th class="n">제출</th><th class="n">미제출</th><th class="n">공통</th><th class="n">도급</th><th class="n">위험</th></tr>'
   +K.map(k=>{const s=chkSum(G[k]);return '<tr class="go" onclick="chkGo('+escapeText(JSON.stringify(next(k)))+')"><td><b>'+escapeText(k)+'</b></td><td class="n">'+s.n+'</td><td class="n">'+chkPct(s.sub,s.n)+'</td><td class="n'+(s.n-s.sub?' r':'')+'">'+(s.n-s.sub)+'</td><td class="n">'+s.c+'</td><td class="n'+(s.d?' r':'')+'">'+s.d+'</td><td class="n">'+s.f+'</td></tr>'}).join('')+'</table>'};
 if(lv==='all')h+=grp('dept',k=>['dept',k]);
 else if(lv==='dept')h+=grp('t',k=>['team',a,k]);
 else{const M=L.slice().sort((p,q)=>(!!p.s-!!q.s)||q.owed-p.owed||p.n.localeCompare(q.n,'ko'));
  h+='<table class="rtable chkt" style="margin-top:10px"><tr><th>매장</th><th>상태</th><th class="n">미흡</th><th class="n">밀린</th></tr>'+M.map(x=>{const bad=x.s?(x.s.c||0)+(x.s.d||0)+(x.s.f||0):0;
   return '<tr'+(x.s?' class="go" onclick="chkOpen(\''+escapeText(x.c)+'\')"':'')+'><td><b>'+escapeText(x.n)+'</b><div class="muted">'+escapeText(x.c+' · '+x.k)+'</div></td><td>'+(x.s?'<span class="shpill ok">제출 '+chkWl(x.s.r)+'</span>':'<span class="shpill no">미제출</span>')+'</td><td class="n'+(bad?' r':'')+'">'+(x.s?bad:'')+'</td><td class="n'+(x.owed>(x.s?0:1)?' r':'')+'">'+(x.owed||'')+'</td></tr>'}).join('')+'</table>'}
 return h+'</div>'}
function chkWeek(n){if(!chkB)return;const w=chkAdd(chkW,n);if(w<chkB.start||w>chkB.thisWeek)return;chkW=w;renderJobs()}
function chkGo(lv){chkLv=lv;renderJobs();window.scrollTo(0,0)}
function chkCopy(){const [lv,a,b]=chkLv,L=chkRows().filter(x=>!x.s&&(lv==='all'||x.dept===a)&&(lv!=='team'||x.t===b));if(!L.length){msg('미제출 매장이 없습니다.');return}
 const t=['매장\t매장명\t팀\t부서\t밀린 주'].concat(L.map(x=>[x.c,x.n,x.t,x.dept,x.owed].join('\t'))).join('\n');
 (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>msg('미제출 '+L.length+'곳을 복사했습니다. 엑셀에 붙여넣으세요.'),()=>prompt('복사해 주세요.',t))}
async function chkOpen(code){let d;try{d=await call('scDetail',code,code+'_'+chkW)}catch(e){return}const o=shDetailHtml(d,'chkBack()','← 점검 현황');chkDet=o.html;renderJobs();window.scrollTo(0,0);o.pics.forEach(([k,fid,ref])=>shPicLoad(k,code,ref,fid))}
function chkBack(){chkDet=null;renderJobs()}

/* ---------- 점검 항목 관리 (안전보건팀) ---------- */
async function ckLoad(){try{ckInfo=await call('ckGet');ckE=JSON.parse(JSON.stringify(ckInfo.check));ckDirty=false}catch(e){}if(tab==='jobs'&&smenu==='items')renderJobs()}
const ckList=()=>ckTab==='c'?ckE.common:ckTab==='d'?ckE.contract:((ckE.focus[ckMon]=ckE.focus[ckMon]||{id:'F'+('0'+ckMon).slice(-2),name:ckMon+'월 집중점검',items:[]}).items);
function sItems(){chkCss();if(!ckE){ckLoad();return '<div class="card"><h2>점검 항목</h2><p class="muted">불러오는 중입니다…</p></div>'}if(ckDirty)jobsMode='form';const ed=ckInfo.canEdit,dis=ed?'':' disabled';
 const cntOf=G=>G.reduce((n,g)=>n+(g.use!==false?g.items.filter(x=>x.use!==false).length:0),0);
 let h='<div class="card"><h2 style="margin:0">점검 시작 주</h2><div class="row" style="margin-top:8px"><input type="date" id="f_ckStart" value="'+escapeText(ckInfo.startWeek)+'" max="'+escapeText(ckInfo.thisWeek)+'" style="padding:9px;border:1px solid var(--line);border-radius:8px;font:inherit"'+dis+'>'+(ed?'<button class="button ghost" type="button" onclick="ckStartSave()">저장</button>':'')+'</div><div class="muted" style="margin-top:4px">이 주부터 안 낸 주 = 밀린 주 (월요일)</div></div>'
  +'<div class="card"><div class="seg" role="tablist" style="margin-top:0">'+[['c','공통 '+cntOf(ckE.common)],['d','도급 '+cntOf(ckE.contract)],['f','월별 집중']].map(([k,t])=>'<button type="button" role="tab" aria-selected="'+(ckTab===k)+'" class="'+(ckTab===k?'on':'')+'" onclick="ckTabGo(\''+k+'\')">'+t+'</button>').join('')+'</div>'
  +(ckInfo.at?'<div class="muted" style="margin-top:8px">고침 '+escapeText(fmtTime(ckInfo.at))+' · '+escapeText(ckInfo.by)+'</div>':'<div class="muted" style="margin-top:8px">기본 점검표</div>');
 if(ckTab==='f'){const F=ckE.focus[ckMon]||{name:'',items:[]};ckList();
  h+='<div class="ckrow" style="margin-top:10px"><select aria-label="달" onchange="ckMon=Number(this.value);renderJobs()">'+Array.from({length:12},(_,i)=>'<option value="'+(i+1)+'"'+(i+1===ckMon?' selected':'')+'>'+(i+1)+'월</option>').join('')+'</select><input type="text" value="'+escapeText(ckE.focus[ckMon].name)+'" placeholder="테마" aria-label="'+ckMon+'월 테마" oninput="ckE.focus[ckMon].name=this.value;ckD()"'+dis+'></div>'
   +ckE.focus[ckMon].items.map((x,i)=>'<div class="ckg'+(x.use===false?' off':'')+'"><div class="ckrow"><input type="text" value="'+escapeText(x.t)+'" placeholder="문항" aria-label="문항" oninput="ckSet('+i+',-1,\'t\',this.value)"'+dis+'>'+ckUse(i,-1,x,dis)+'</div><div class="ckrow"><textarea rows="2" placeholder="확인 내용" aria-label="확인 내용" oninput="ckSet('+i+',-1,\'d\',this.value)"'+dis+'>'+escapeText(x.d||'')+'</textarea></div>'+ckGdHtml('f',x,ed)+'</div>').join('')
   +(ed?'<button class="button ghost" type="button" style="width:100%;margin-top:10px" onclick="ckAddItem(-1)">＋ 문항</button>':'')}
 else{const G=ckList();
  h+=G.map((g,gi)=>'<div class="ckg'+(g.use===false?' off':'')+'"><div class="ckrow"><input type="text" value="'+escapeText(g.name)+'" placeholder="영역 이름" aria-label="영역 이름" style="font-weight:700" oninput="ckSetG('+gi+',\'name\',this.value)"'+dis+'>'+ckUse(gi,-2,g,dis)+'</div>'
   +ckGdHtml(ckTab,g,ed)
   +g.items.map((x,i)=>'<div class="ckrow'+(x.use===false?' ckoff':'')+'" style="'+(x.use===false?'opacity:.55':'')+'"><textarea rows="2" aria-label="문항" oninput="ckSet('+gi+','+i+',\'t\',this.value)"'+dis+'>'+escapeText(x.t)+'</textarea>'
    +(ckTab==='c'?'<select aria-label="적용" onchange="ckSet('+gi+','+i+',\'ch\',this.value)"'+dis+'><option'+(x.ch!=='직영·테넌트'?' selected':'')+'>공통</option><option'+(x.ch==='직영·테넌트'?' selected':'')+'>직영·테넌트</option></select>':'')+ckUse(gi,i,x,dis)+'</div>').join('')
   +(ed?'<button class="button ghost" type="button" style="width:100%;margin-top:8px;padding:8px" onclick="ckAddItem('+gi+')">＋ 문항</button>':'')+'</div>').join('')
  +(ed?'<button class="button ghost" type="button" style="width:100%;margin-top:10px" onclick="ckAddGrp()">＋ 영역</button>':'')}
 h+='<p class="muted" style="margin:10px 0 0">공통 「공통」 = 모든 매장 · 「직영·테넌트」 = 직영점만 · 쓰지 않는 문항은 지우지 않고 사용 해제</p></div>';
 if(ed)h+='<div class="card roomfoot"><div class="row">'+(ckDirty?'<button class="button ghost" type="button" onclick="ckE=null;ckDirty=false;renderJobs()">되돌리기</button>':'')+'<button class="button" type="button" style="flex:1" onclick="ckSave()"'+(ckDirty?'':' disabled')+'>저장</button></div></div>';
 return h}
const ckUse=(gi,i,x,dis)=>'<label class="ckuse"><input type="checkbox" '+(x.use!==false?'checked':'')+' onchange="ckSet('+gi+','+i+',\'use\',this.checked)"'+dis+'>사용</label>';
/** 가이드 사진 칸 (양호 · 미흡) · 아직 저장 안 한 영역은 저장 뒤에 */
function ckGdHtml(part,x,ed){const saved=!ckDirty&&!String(x.id||'').startsWith('NEW');
 const one=(k,fid,t)=>'<div>'+(fid?'<img id="ckg_'+k+'_'+escapeText(x.id)+'" alt="'+t+' 예시">':'')+'<span>'+t+'</span> '+(ed&&saved?'<label>'+(fid?'바꾸기':'올리기')+'<input type="file" accept="image/*" onchange="ckGdUp(\''+part+'\',\''+escapeText(x.id)+'\',\''+k+'\',this)"></label>'+(fid?' <button type="button" class="x" onclick="ckGdDel(\''+part+'\',\''+escapeText(x.id)+'\',\''+k+'\')">빼기</button>':''):(fid?'':' <span class="muted">'+(ed?'저장 뒤 올리기':'없음')+'</span>'))+'</div>';
 setTimeout(()=>[['G',x.gg],['B',x.gb]].forEach(([k,fid])=>{if(!fid)return;const el=$('ckg_'+k+'_'+x.id);if(!el)return;if(shGdMem[fid]){el.src=shGdMem[fid];return}FB.sm('scGuide',{fid}).then(r=>{shGdMem[fid]='data:'+r.mime+';base64,'+r.data;const e2=$('ckg_'+k+'_'+x.id);if(e2)e2.src=shGdMem[fid]}).catch(()=>{})}),0);
 return '<div class="ckgd">'+one('G',x.gg,'양호')+one('B',x.gb,'미흡')+'</div>'}
function ckD(full){ckDirty=true;jobsMode='form';if(full){const y=window.scrollY;renderJobs();window.scrollTo(0,y)}else{const b=document.querySelector('.roomfoot .button:not(.ghost)');if(b)b.disabled=false}}
function ckTabGo(k){ckTab=k;renderJobs()}
function ckSetG(gi,k,v){ckList()[gi][k]=v;ckD()}
/** i=-2 영역 사용 · i=-1 집중 문항(gi=문항 번호) · 그 외 영역 gi의 문항 i */
function ckSet(gi,i,k,v){const L=ckList();const x=i===-2||i===-1?L[gi]:L[gi].items[i];x[k]=v;ckD(k==='use')}
function ckAddItem(gi){const it={id:'NEW'+Date.now().toString(36),t:'',use:true};if(gi===-1){it.d='';ckList().push(it)}else{it.ch='공통';ckList()[gi].items.push(it)}ckD(true)}
function ckAddGrp(){ckList().push({id:'NEW'+Date.now().toString(36),name:'',use:true,items:[{id:'NEW'+(Date.now()+1).toString(36),t:'',ch:'공통',use:true}]});ckD(true)}
async function ckSave(){const clean=JSON.parse(JSON.stringify(ckE));const fix=x=>{if(String(x.id||'').startsWith('NEW'))x.id=''};
 clean.common.concat(clean.contract).forEach(g=>{fix(g);g.items.forEach(fix)});Object.values(clean.focus).forEach(f=>(f.items||[]).forEach(fix));
 if(!await askOk('점검 항목 저장','다음 점검부터 바뀐 점검표가 나옵니다.\n이미 낸 점검은 그대로입니다.','저장'))return;
 try{ckInfo=await call('ckSave',clean);ckE=JSON.parse(JSON.stringify(ckInfo.check));ckDirty=false;renderJobs();msg('저장했습니다.')}catch(e){}}
async function ckGdUp(part,id,kind,inp){const f=inp.files&&inp.files[0];if(!f)return;let r;try{r=await readFile(f,PHOTO_SITE)}catch(e){msg((e&&e.message)||'사진을 읽지 못했습니다.');return}
 try{ckInfo=await call('ckGuide',part,id,kind,r);ckE=JSON.parse(JSON.stringify(ckInfo.check));renderJobs();msg('가이드 사진을 올렸습니다.')}catch(e){}}
async function ckGdDel(part,id,kind){if(!await askOk('가이드 사진 빼기','이 사진을 점검표에서 뺄까요?','빼기'))return;try{ckInfo=await call('ckGuide',part,id,kind,null);ckE=JSON.parse(JSON.stringify(ckInfo.check));renderJobs()}catch(e){}}
async function ckStartSave(){const v=value('ckStart');const d=new Date(v+'T00:00:00Z');if(!v||d.getUTCDay()!==1){msg('월요일 날짜를 골라 주세요.');return}
 if(!await askOk('점검 시작 주',chkWl(v)+' (월) 주부터 밀린 주를 셉니다.\n저장할까요?','저장'))return;try{ckInfo=await call('ckStart',v);chkB=null;renderJobs();msg('저장했습니다.')}catch(e){}}
