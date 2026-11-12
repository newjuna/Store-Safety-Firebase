/* S2 매장 목록 · 부서 관리 (본사) — 'jobs' 칸에 그림 (staff.js renderJobs)
 *  매장 목록: 엑셀에서 복사 → 붙여넣기 → 미리보기 → 저장 (매장 코드 기준 덮어쓰기 · 빠진 매장 = 「목록에 없음」)
 *    대상 = 형태 직영점 · 유통점 · 유통행사 + 폐점여부 영업 · 빈 칸(병합 칸) = 바로 위 줄 값 · 코드가 숫자가 아닌 줄(합계 등) = 무시
 *  부서 관리: 부서 이름 + 팀(= 매장 목록 「지역」) → 부서 연결 (해마다 바뀜)
 *  서버: fb.js storeBoard · storeSave · deptSave (Firestore STORES/list · STORES/depts) */
let stB=null,stBusy=false,stPaste=false,stPv=null,stQ='',stTeam='',stKind='',dpEdit=null;
const ST_TYPES=['직영점','유통점','유통행사'],ST_OPEN='영업',ST_SHOW=100;
const stNorm=v=>String(v==null?'':v).replace(/\s+/g,'');
const stAct=()=>((stB&&stB.stores)||[]).filter(s=>!s[4]);
const stCmp=(a,b)=>String(a).localeCompare(String(b),'ko',{numeric:true});
function stCss(){if($('stCss'))return;const s=document.createElement('style');s.id='stCss';s.textContent=
 '.stnum{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}.stnum div{border:1px solid var(--line);border-radius:10px;padding:8px 4px;text-align:center}.stnum b{display:block;font-size:18px}.stnum span{font-size:12px;color:var(--sub)}'
 +'.stnum .r b{color:var(--accent)}.stchips{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}.stchip{border:1px solid var(--line);border-radius:999px;padding:3px 10px;font-size:12.5px;background:#fff}'
 +'.stfill{background:#fff4cc}.sttb td,.sttb th{padding:6px 8px}.sttb .c{white-space:nowrap;color:var(--sub)}.stgone{color:var(--sub)}.stgone b{font-weight:600}'
 +'.stbar{display:flex;gap:6px;margin-top:10px}.stbar input,.stbar select{flex:1;min-width:0;padding:10px;border:1px solid var(--line);border-radius:10px;font:inherit;background:#fff}'
 +'.stpaste{width:100%;min-height:150px;padding:10px;border:1px solid var(--line);border-radius:10px;font:12px/1.5 monospace;resize:vertical}'
 +'.dprow{display:flex;gap:6px;align-items:center;margin:6px 0}.dprow input{flex:1;min-width:0;padding:10px;border:1px solid var(--line);border-radius:10px;font:inherit}'
 +'.dpsel{width:100%;padding:7px;border:1px solid var(--line);border-radius:8px;font:inherit;background:#fff}.dpsel.no{border-color:var(--accent)}';document.head.appendChild(s)}
/** 매장 · 부서 받기 (처음은 로딩 창 · 다음부터는 조용히) */
async function stLoad(quiet){if(stBusy)return;stBusy=true;try{stB=await (quiet?callQuiet:call)('storeBoard')}catch(e){}stBusy=false;if(tab==='jobs'&&['stores','depts'].includes(smenu))renderJobs()}
const stWait=t=>'<div class="card"><h2>'+t+'</h2><p class="muted">불러오는 중입니다…</p></div>';
/** 팀(지역) 목록 + 영업 매장 수 · 부서 연결 */
function stTeams(){const n={};stAct().forEach(s=>{const t=s[2]||'';n[t]=(n[t]||0)+1});const map=(stB&&stB.teams)||[],M={};map.forEach(([t,id])=>{M[t]=id});
 Object.keys(M).forEach(t=>{if(!(t in n))n[t]=0});return Object.keys(n).filter(Boolean).sort(stCmp).map(t=>({t,n:n[t],d:M[t]||''}))}
const stDeptName=id=>((stB&&stB.depts)||[]).find(d=>d.id===id)?.name||'';

/* ---------- 매장 목록 ---------- */
function sStores(){stCss();if(!stB){stLoad();return stWait('매장 목록')}if(stPv){jobsMode='form';return stPvHtml()}
 const A=stAct(),gone=stB.stores.length-A.length,by=k=>A.filter(s=>s[3]===k).length,T=stTeams(),noD=T.filter(x=>x.n&&!x.d).length,ed=stB.canEdit;
 return '<div class="card"><div class="vh-top"><h2 style="margin:0">매장 목록</h2>'+(ed?'<button class="button'+(stPaste?' ghost':'')+'" type="button" onclick="stPasteTg()">'+(stPaste?'닫기':'붙여넣기로 반영')+'</button>':'')+'</div>'
  +'<div class="muted">'+(stB.at?'반영 '+escapeText(fmtTime(stB.at))+' · '+escapeText(stB.by||''):'아직 반영한 목록이 없습니다')+'</div>'
  +'<div class="stnum"><div><b>'+A.length+'</b><span>영업</span></div><div><b>'+by('직영점')+'</b><span>직영점</span></div><div><b>'+by('유통점')+'</b><span>유통점</span></div><div><b>'+by('유통행사')+'</b><span>유통행사</span></div></div>'
  +(gone?'<div class="muted" style="margin-top:6px">목록에 없음 '+gone+'곳</div>':'')
  +'<div class="row" style="margin-top:10px;justify-content:space-between"><span class="muted">점장 링크 · '+escapeText(stShopUrl())+'</span><button class="button ghost" type="button" onclick="copyLink(stShopUrl())">복사</button></div></div>'
  +(stPaste&&ed?'<div class="card"><h2>붙여넣기</h2><p class="muted" style="margin:0 0 8px">엑셀에서 제목 줄(매장 · 매장명 · 지역 · 형태 · 폐점여부)부터 복사해 붙여넣으세요.</p><textarea id="stText" class="stpaste" spellcheck="false" aria-label="매장 목록 붙여넣기"></textarea><button class="button" type="button" style="width:100%;margin-top:8px" onclick="stPreview()">미리보기</button></div>':'')
  +(noD?'<button class="vtodo" type="button" onclick="sgo(\'depts\')"><span>부서 미지정 팀</span><span class="req">'+noD+'팀 ›</span></button>':'')
  +(stB.stores.length?'<div class="card"><div class="stbar"><input id="stQ" type="search" placeholder="매장명 · 코드" value="'+escapeText(stQ)+'" oninput="stQ=this.value;stFind()" aria-label="매장 찾기">'
   +'<select id="stTeam" onchange="stTeam=this.value;stFind()" aria-label="팀"><option value="">전체 팀</option>'+T.map(x=>'<option'+(x.t===stTeam?' selected':'')+'>'+escapeText(x.t)+'</option>').join('')+'</select>'
   +'<select id="stKind" onchange="stKind=this.value;stFind()" aria-label="형태"><option value="">전체 형태</option>'+ST_TYPES.concat(['목록에 없음']).map(k=>'<option'+(k===stKind?' selected':'')+'>'+k+'</option>').join('')+'</select></div><div id="stRes">'+stResHtml()+'</div></div>':'')}
/** S3 점장 공통 링크 (로그인 없이 매장 고르고 점검) */
const stShopUrl=()=>location.origin+location.pathname+'?store';
function stPasteTg(){stPaste=!stPaste;renderJobs();if(stPaste)setTimeout(()=>$('stText')?.focus(),50)}
function stResHtml(){const q=stNorm(stQ).toLowerCase(),L=stB.stores.filter(s=>(!q||stNorm(s[1]).toLowerCase().includes(q)||String(s[0]).includes(q))&&(!stTeam||s[2]===stTeam)&&(!stKind||(stKind==='목록에 없음'?s[4]:!s[4]&&s[3]===stKind)));
 if(!L.length)return '<p class="muted" style="margin:10px 0 0">없음</p>';
 return '<div class="muted" style="margin:10px 0 4px">'+L.length+'곳'+(L.length>ST_SHOW?' · 위 '+ST_SHOW+'곳만 표시':'')+'</div><table class="rtable sttb"><tr><th>코드</th><th>매장명</th><th>팀</th><th>형태</th></tr>'
  +L.slice(0,ST_SHOW).map(s=>'<tr'+(s[4]?' class="stgone"':'')+'><td class="c">'+escapeText(s[0])+'</td><td>'+escapeText(s[1])+(s[4]?' <b>· 목록에 없음</b>':'')+'</td><td>'+escapeText(s[2])+'</td><td>'+escapeText(s[3])+'</td></tr>').join('')+'</table>'}
function stFind(){const el=$('stRes');if(el)el.innerHTML=stResHtml()}
/** 붙여넣은 글 → 줄 · 칸 (엑셀 = 탭 구분 · 따옴표 칸 안 줄바꿈 처리) */
function stCells(text){const R=[];let row=[],cell='',q=false;const s=String(text||'').replace(/\r\n?/g,'\n');
 for(let i=0;i<s.length;i++){const ch=s[i];
  if(q){if(ch==='"'){if(s[i+1]==='"'){cell+='"';i++}else q=false}else cell+=ch;continue}
  if(ch==='"'&&cell==='')q=true;else if(ch==='\t'){row.push(cell);cell=''}else if(ch==='\n'){row.push(cell);R.push(row);row=[];cell=''}else cell+=ch}
 if(cell!==''||row.length){row.push(cell);R.push(row)}return R.filter(r=>r.some(c=>String(c).trim()!==''))}
/** 칸 위치 찾기: 제목 줄이 있으면 이름으로 · 없으면 앞 5칸 순서대로 */
function stCols(R){for(let i=0;i<Math.min(10,R.length);i++){const H=R[i].map(stNorm),f=t=>H.findIndex(t);
  const c={code:f(h=>h==='매장'||/^(매장|점포)코드$|^코드$/.test(h)),name:f(h=>/^(매장|점포)명$/.test(h)),team:f(h=>h==='지역'||/^팀(명)?$/.test(h)),kind:f(h=>/형태/.test(h)),closed:f(h=>/폐점/.test(h))};
  if(c.code>=0&&c.name>=0&&c.kind>=0)return {c,head:i,found:true}}
 return {c:{code:0,name:1,team:2,kind:3,closed:4},head:-1,found:false}}
function stParse(text){const R=stCells(text);if(!R.length)return {err:'붙여넣은 내용이 없습니다.'};if(!R.some(r=>r.length>=3))return {err:'칸이 나뉘어 있지 않습니다. 엑셀에서 칸째로 복사해 붙여넣어 주세요.'};
 const {c,head,found}=stCols(R),get=(r,k)=>c[k]>=0?String(r[c[k]]==null?'':r[c[k]]).trim():'',last={team:'',kind:'',closed:''},rows=[];let ignored=0,filled=0;
 R.slice(head+1).forEach(r=>{const code=stNorm(get(r,'code'));const v={team:get(r,'team'),kind:get(r,'kind'),closed:get(r,'closed')},fill={};
  ['team','kind','closed'].forEach(k=>{if(!v[k]&&last[k]){v[k]=last[k];fill[k]=1;}else if(v[k])last[k]=v[k]});  // 병합 칸 = 바로 위 값
  if(!/^\d{1,12}$/.test(code)){ignored++;return}  // 합계 · 소계 · 빈 코드 줄
  const n=Object.keys(fill).length;filled+=n;rows.push({c:code,n:get(r,'name'),t:v.team,k:stNorm(v.kind),cl:stNorm(v.closed),fill})});
 const seen=new Set(),target=[],excl=[],dup=[];
 rows.forEach(x=>{if(seen.has(x.c)){dup.push(x);return}seen.add(x.c);const why=!x.n?'매장명 없음':!ST_TYPES.includes(x.k)?(x.k||'형태 없음'):x.cl!==ST_OPEN?(x.cl||'폐점여부 없음'):'';if(why)excl.push(Object.assign({why},x));else target.push(x)});
 /* 지금 목록과 비교 */
 const cur={};((stB&&stB.stores)||[]).forEach(s=>{cur[s[0]]=s});const nw=target.filter(x=>!cur[x.c]||cur[x.c][4]),chg=target.filter(x=>cur[x.c]&&!cur[x.c][4]&&(cur[x.c][1]!==x.n||cur[x.c][2]!==x.t||cur[x.c][3]!==x.k)),tg=new Set(target.map(x=>x.c));
 const out=stAct().filter(s=>!tg.has(s[0]));
 return {target,excl,dup,ignored,filled,found,nw,chg,out}}
function stPreview(){const p=stParse($('stText')?.value||'');if(p.err){msg(p.err);return}if(!p.target.length){msg('대상 매장(직영점 · 유통점 · 유통행사 · 영업)이 없습니다.');return}stPv=p;renderJobs();window.scrollTo(0,0)}
function stPvHtml(){const p=stPv,why={};p.excl.forEach(x=>{why[x.why]=(why[x.why]||0)+1});const cell=(x,k,v)=>'<td'+(x.fill[k]?' class="stfill"':'')+'>'+escapeText(v)+'</td>';
 return '<div class="card"><button class="button ghost" type="button" onclick="stPvClose()">← 매장 목록</button><h2 style="margin-top:12px">미리보기</h2>'
  +(p.found?'':'<div class="note">제목 줄을 못 찾아 앞에서부터 매장 · 매장명 · 지역 · 형태 · 폐점여부 순서로 읽었습니다.</div>')
  +'<div class="stnum"><div><b>'+p.target.length+'</b><span>대상</span></div><div><b>'+p.excl.length+'</b><span>제외</span></div><div><b>'+p.ignored+'</b><span>무시한 줄</span></div><div><b>'+p.filled+'</b><span>빈칸 채움</span></div></div>'
  +'<div class="stnum"><div><b>'+p.nw.length+'</b><span>새 매장</span></div><div><b>'+p.chg.length+'</b><span>바뀜</span></div><div class="'+(p.out.length?'r':'')+'"><b>'+p.out.length+'</b><span>목록에서 빠짐</span></div><div><b>'+p.dup.length+'</b><span>코드 중복</span></div></div>'
  +(p.excl.length?'<div class="stchips">'+Object.entries(why).sort((a,b)=>b[1]-a[1]).map(([k,n])=>'<span class="stchip">'+escapeText(k)+' '+n+'</span>').join('')+'</div>':'')+'</div>'
  +'<div class="card"><h2>대상 매장</h2>'+(p.filled?'<div class="muted" style="margin:-6px 0 8px"><span class="stchip stfill">노란 칸</span> = 바로 위 줄 값으로 채움</div>':'')
  +'<table class="rtable sttb"><tr><th>코드</th><th>매장명</th><th>지역</th><th>형태</th></tr>'+p.target.slice(0,50).map(x=>'<tr><td class="c">'+escapeText(x.c)+'</td><td>'+escapeText(x.n)+'</td>'+cell(x,'team',x.t)+cell(x,'kind',x.k)+'</tr>').join('')+'</table>'
  +(p.target.length>50?'<div class="muted" style="margin-top:6px">외 '+(p.target.length-50)+'곳</div>':'')+'</div>'
  +(p.out.length?'<div class="card"><details class="hist"><summary>목록에서 빠지는 매장 '+p.out.length+'곳</summary>'+p.out.slice(0,200).map(s=>'<div class="muted">'+escapeText(s[0]+' '+s[1]+' · '+s[2])+'</div>').join('')+'</details></div>':'')
  +(p.excl.length?'<div class="card"><details class="hist"><summary>제외 '+p.excl.length+'곳</summary>'+p.excl.slice(0,300).map(x=>'<div class="muted">'+escapeText(x.c+' '+x.n+' · '+x.why)+'</div>').join('')+'</details></div>':'')
  +'<div class="card roomfoot"><div class="row"><button class="button ghost" type="button" onclick="stPvClose()">취소</button><button class="button" type="button" style="flex:1" onclick="stSave()">저장 · '+p.target.length+'곳</button></div></div>'}
function stPvClose(){stPv=null;renderJobs();window.scrollTo(0,0)}
async function stSave(){const p=stPv;if(!p)return;if(!await askOk('매장 목록 저장','대상 '+p.target.length+'곳\n새 매장 '+p.nw.length+' · 바뀜 '+p.chg.length+' · 목록에서 빠짐 '+p.out.length+'\n\n저장할까요?','저장'))return;
 try{stB=await call('storeSave',p.target.map(x=>[x.c,x.n,x.t,x.k]));stPv=null;stPaste=false;dpEdit=null;renderJobs();window.scrollTo(0,0);msg('저장했습니다.')}catch(e){}}

/* ---------- 부서 관리 ---------- */
function dpInit(){const T=stTeams();dpEdit={depts:((stB&&stB.depts)||[]).map(d=>({id:d.id,name:d.name})),teams:T.map(x=>x.t),cnt:T.map(x=>x.n),map:T.map(x=>x.d),dirty:false}}
function sDepts(){stCss();if(!stB){stLoad();return stWait('부서 관리')}if(!dpEdit)dpInit();const E=dpEdit,ed=stB.canEdit,dis=ed?'':' disabled';if(E.dirty)jobsMode='form';
 const noD=E.map.filter((d,i)=>!d&&E.cnt[i]).length,opt=cur=>'<option value="">부서 미지정</option>'+E.depts.map(d=>'<option value="'+escapeText(d.id)+'"'+(d.id===cur?' selected':'')+'>'+escapeText(d.name||'(이름 없음)')+'</option>').join('');
 const order=E.teams.map((t,i)=>i).sort((a,b)=>(!!E.map[a]-!!E.map[b])||stCmp(E.teams[a],E.teams[b]));
 return '<div class="card">'+(E.dirty?'<button class="button ghost" type="button" onclick="dpReset()">← 되돌리기</button>':'')+'<h2 style="'+(E.dirty?'margin-top:12px':'margin:0')+'">부서</h2>'
  +(stB.deptAt?'<div class="muted">저장 '+escapeText(fmtTime(stB.deptAt))+'</div>':'')
  +E.depts.map((d,i)=>'<div class="dprow"><input value="'+escapeText(d.name)+'" placeholder="부서 이름" aria-label="부서 이름" oninput="dpName('+i+',this.value)"'+dis+'><span class="muted" style="white-space:nowrap">'+E.map.filter(x=>x===d.id).length+'팀</span>'+(ed?'<button class="button ghost" type="button" onclick="dpDel('+i+')" aria-label="부서 삭제">삭제</button>':'')+'</div>').join('')
  +(ed?'<button class="button ghost" type="button" style="width:100%;margin-top:6px" onclick="dpAdd()">＋ 부서 추가</button>':'')+'</div>'
  +'<div class="card"><div class="vh-top"><h2 style="margin:0">팀 → 부서</h2>'+(noD?'<span class="pill bad">미지정 '+noD+'</span>':'')+'</div>'
  +(E.teams.length?'<table class="rtable sttb" style="margin-top:10px"><tr><th>팀</th><th>매장</th><th>부서</th></tr>'+order.map(i=>'<tr'+(E.cnt[i]?'':' class="stgone"')+'><td>'+escapeText(E.teams[i])+'</td><td class="c">'+E.cnt[i]+'</td><td><select class="dpsel'+(!E.map[i]&&E.cnt[i]?' no':'')+'" aria-label="'+escapeText(E.teams[i])+' 부서" onchange="dpTeam('+i+',this.value)"'+dis+'>'+opt(E.map[i])+'</select></td></tr>').join('')+'</table>'
   :'<p class="muted" style="margin:10px 0 0">매장 목록을 먼저 반영하면 팀이 나옵니다.</p>')+'</div>'
  +(ed?'<div class="card roomfoot"><button class="button" type="button" style="width:100%" onclick="dpSave()"'+(E.dirty?'':' disabled')+'>저장</button></div>':'')}
function dpDirty(full){dpEdit.dirty=true;jobsMode='form';if(full){const y=window.scrollY;renderJobs();window.scrollTo(0,y)}else{const b=document.querySelector('.roomfoot .button');if(b)b.disabled=false}}
function dpName(i,v){dpEdit.depts[i].name=v;dpDirty(false)}
function dpAdd(){dpEdit.depts.push({id:'D-'+Date.now().toString(36).slice(-8),name:''});dpDirty(true);setTimeout(()=>{const L=document.querySelectorAll('.dprow input');L[L.length-1]?.focus()},50)}
async function dpDel(i){const d=dpEdit.depts[i],n=dpEdit.map.filter(x=>x===d.id).length;if(n&&!await askOk('부서 삭제',(d.name||'이 부서')+'에 연결된 '+n+'팀은 「부서 미지정」이 됩니다.\n삭제할까요?','삭제'))return;
 dpEdit.map=dpEdit.map.map(x=>x===d.id?'':x);dpEdit.depts.splice(i,1);dpDirty(true)}
function dpTeam(i,v){dpEdit.map[i]=v;dpDirty(true)}
function dpReset(){dpEdit=null;renderJobs()}
async function dpSave(){const E=dpEdit,names=E.depts.map(d=>d.name.trim());if(names.some(n=>!n)){msg('이름이 빈 부서가 있습니다.');return}if(new Set(names).size!==names.length){msg('같은 부서 이름이 있습니다.');return}
 try{stB=await call('deptSave',E.depts.map(d=>({id:d.id,name:d.name.trim()})),E.teams.map((t,i)=>[t,E.map[i]]).filter(x=>x[1]));dpEdit=null;renderJobs();msg('저장했습니다.')}catch(e){}}
/** 다른 메뉴로 갈 때 (staff.js sgo) · 작성 중이던 미리보기 · 부서 고침은 버림 */
function stReset(){stPv=null;stPaste=false;dpEdit=null}
