/* ============ AI LAB MAFIA — UI + loop ============ */
const $ = s => document.querySelector(s);
const screen = $('.screen'), body = $('#body'), res = $('#res'), racebar = $('#racebar'),
      dock = $('#dock'), tabbar = $('#tabbar'), sheet = $('#sheet'), scrim = $('#scrim'),
      toastEl = $('#toast'), over = $('#over');

const ICON = {
  lab:'<path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/><rect x="6" y="6" width="12" height="12" rx="2"/><rect x="10" y="10" width="4" height="4" rx="1"/>',
  build:'<rect x="3" y="4" width="18" height="6" rx="2"/><rect x="3" y="14" width="18" height="6" rx="2"/><path d="M7 7h.01M7 17h.01"/>',
  ops:'<circle cx="12" cy="12" r="8"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>',
  race:'<path d="M5 21V4M5 4c3-1.5 6 1.5 9 0s5-1 5-1v9s-2 .5-5 1-6-1.5-9 0"/>',
};
function tabSvg(k){ return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${ICON[k]}</svg>`; }
function ordinal(n){ return n+(['th','st','nd','rd'][(n%100>>3^1&&n%10)||0]||'th'); }
function ord(n){ const s=['th','st','nd','rd'], v=n%100; return n+(s[(v-20)%10]||s[v]||s[0]); }

/* ---------- chrome ---------- */
function renderRes(){
  const hc = S.heat<=30?'cool':S.heat<=60?'warm':'hot';
  const pen = S.heat>CFG.heatThresh;
  const mal = pen ? `−${Math.round(D.revPen*100)}% rev<br>+${Math.round(D.opexPen*100)}% opex` : 'stable';
  res.innerHTML = `
    <div class="stat"><div class="l">Cash</div><div class="v num">$${fmt(S.cash)}</div>
      <div class="d ${D.cashRate<0?'neg':''}">${fmtRate(D.cashRate)}</div></div>
    <div class="stat"><div class="l">Research</div><div class="v num">${fmt(S.research)}</div>
      <div class="d">+${Math.round(D.researchRate).toLocaleString('en-US')}/s</div></div>
    <div class="stat"><div class="l">Influence</div><div class="v num">${Math.floor(S.influence)}</div>
      <div class="d">+${D.inflRate.toFixed(1)}/s</div></div>
    <div class="stat heat"><div class="l">Heat</div>
      <div class="hv"><span class="hn num ${hc}">${Math.round(S.heat)}</span><span class="max">/100</span></div>
      <div class="mal" ${pen?'':'style="color:var(--mut2)"'}>${mal}</div></div>`;
}
function renderRace(){
  const labs = [{id:'you',name:'Your lab',agi:S.yourAGI},...aliveRivals().map(r=>({id:r.id,name:r.name,agi:r.agi}))];
  labs.sort((a,b)=>b.agi-a.agi);
  const youRank = labs.findIndex(l=>l.id==='you')+1;
  const tr = topRival();
  const trRank = tr ? labs.findIndex(l=>l.id===tr.id)+1 : 1;
  const leadTxt = youRank===1 ? 'leading' : 'chasing';
  racebar.innerHTML = `
    <div class="rc you"><div class="rl"><span>Your lab — <b>${leadTxt}</b></span><span>${ord(youRank)}</span></div>
      <div class="rn num">AGI ${Math.round(S.yourAGI)}%<small>${(D.share.you||0).toFixed(0)}% mkt</small></div>
      <div class="rbar"><i style="width:${S.yourAGI}%"></i></div></div>
    <div class="rc"><div class="rl"><span>Closest — <b>${tr?tr.name:'—'}</b></span><span>${ord(trRank)}</span></div>
      <div class="rn num">AGI ${tr?Math.round(tr.agi):0}%<small>${tr?(D.share[tr.id]||0).toFixed(0):0}% mkt</small></div>
      <div class="rbar"><i style="width:${tr?tr.agi:0}%"></i></div></div>`;
}
function buildTicker(){
  const c = `<b>WIRE TAPS</b>` + NEWS.map(n=>`<span>${n}</span>`).join('');
  $('#tk').innerHTML = c + c;
}
function renderTabbar(){
  const tabs=[['lab','Lab'],['build','Build'],['ops','Ops'],['race','Race']];
  tabbar.innerHTML = tabs.map(([k,l])=>`<button class="tab ${S.tab===k?'on':''}" data-act="tab:${k}">${tabSvg(k)}${l}</button>`).join('');
}

/* ---------- dock ---------- */
let lastEvt = undefined;
function promptGain(){ return CFG.promptBase * Math.max(1, Math.round(D.cashRate>0 ? D.cashRate*0.00003 : 1)); }
function renderDock(){
  if (S.event){
    dock.innerHTML = `
      <button class="devt" data-act="evt"><b>⚡ EVENT</b><small id="cdlbl">tap to view</small>
        <span class="cd" id="cdbar"></span></button>
      <button class="dprompt" data-act="prompt"><b>ANSWER A PROMPT</b><small id="pgain">+$${promptGain()}</small></button>`;
  } else {
    dock.innerHTML = `<button class="dprompt" data-act="prompt"><b>ANSWER A PROMPT</b><small id="pgain">tap · +$${promptGain()}</small></button>`;
  }
}
function updateDockLive(){
  const pg = $('#pgain'); if (pg) pg.textContent = (S.event?'+$':'tap · +$') + promptGain();
  if (S.event){
    if (!S.event.tot) S.event.tot = S.event.t;
    const bar = $('#cdbar'), lbl = $('#cdlbl');
    if (bar) bar.style.width = clamp(S.event.t/S.event.tot*100,0,100)+'%';
    if (lbl) lbl.textContent = `${Math.ceil(S.event.t)}s · tap`;
  }
}
function syncDock(){ const has=!!S.event; if(has!==lastEvt){ lastEvt=has; renderDock(); } updateDockLive(); }

/* ---------- body / tabs ---------- */
function renderTab(){
  if (S.tab==='lab') return renderLab();
  if (S.tab==='build') return renderBuild();
  if (S.tab==='ops') return renderOps();
  return renderRaceTab();
}
function paintBody(){ const sc=body.scrollTop; body.innerHTML = renderTab(); body.scrollTop = sc; }

function renderLab(){
  const tr=Math.round(S.split*100), inf=100-tr;
  const shipReady = S.modelProgress>=100 && S.cash>=20000000;
  return `
  <div class="tabsec">
    <div class="card">
      <div class="k">Compute · ${fmt(D.pflops)} PFLOPs<span class="kr">×${S.computeMult.toFixed(1)} optimized</span></div>
      <div class="slidelbl"><span>◂ <b>Training</b> ${tr}%</span><span>${inf}% <b>Inference</b> ▸</span></div>
      <div class="slider" data-slider><span class="fill" style="width:${tr}%"></span><span class="knob" style="left:${tr}%"></span></div>
      <div class="cmpout">
        <div><div class="co-l">Research / s</div><div class="co-v num">${Math.round(D.researchRate).toLocaleString('en-US')}</div></div>
        <div><div class="co-l">Revenue / s</div><div class="co-v num">$${fmt(D.revenueRate)}</div></div>
      </div>
      <div class="cmpsub"><span>serving ${D.demand}% of demand</span><span>$${fmt(D.opex)}/s opex</span></div>
    </div>
    <div class="card">
      <div class="k">Model · Gen ${S.modelGen}</div>
      <div class="titrow"><span class="t">Training run</span><span class="pct num">${Math.round(S.modelProgress)}%</span></div>
      <div class="sub">${S.modelProgress>=100?'Ready to ship — every rival is coming for you':'Compute is grinding out the next checkpoint'}</div>
      <div class="bar"><i style="width:${S.modelProgress}%"></i></div>
      <button class="btn sm ${shipReady?'':'disabled'}" data-act="ship" style="margin-top:12px">
        ${shipReady?`Ship Gen ${S.modelGen+1} · +6% AGI`:`Ship Gen ${S.modelGen+1} · need 100% + $20M`}</button>
    </div>
  </div>
  <div class="tabsec">
    <div class="k">Science · spend research</div>
    <div class="chips">
      ${SCI.map(s=>{ const can=S.research>=S.sciCost[s.id]; return `
        <button class="chip ${can?'':'no'}" data-act="sci:${s.id}">
          <div class="t">${s.name}</div>
          <div class="sub">${typeof s.sub==='function'?s.sub():s.sub}</div>
          <div class="sub" style="margin-top:6px;color:${can?'var(--green)':'var(--mut2)'}">${fmt(S.sciCost[s.id])} res</div>
        </button>`; }).join('')}
    </div>
  </div>`;
}

function buyRow(it){
  const p=price(it), can=S.cash>=p;
  return `<button class="row" data-buyable="1" data-act="buy:${it.id}">
    <div class="nm"><div class="t">${it.name}</div><div class="sub">${it.sub}</div></div>
    <div class="rt"><span class="price num ${can?'ok':'no'}">$${fmt(p)}</span><span class="own">${ownedCount(it.id)} owned</span></div>
  </button>`;
}
function buyCard(it){
  const p=price(it), can=S.cash>=p;
  return `<button class="gcell" data-buyable="1" data-act="buy:${it.id}">
    <div class="t"><span class="cn">${it.name}</span></div>
    <div class="csub">${it.sub}</div>
    <div class="cfoot"><span class="price num ${can?'ok':'no'}">$${fmt(p)}</span><span class="own">${ownedCount(it.id)} owned</span></div>
  </button>`;
}
function renderBuild(){
  const comp=ITEMS.filter(i=>i.cat==='compute'), pay=ITEMS.filter(i=>i.cat==='pay');
  const grid=S.set.cardLayout==='grid';
  const wrap=cards=> grid?`<div class="cardgrid">${cards}</div>`:cards;
  const fn = grid?buyCard:buyRow;
  return `
  <div class="tabsec"><div class="k">Hardware<span class="kr">${fmt(D.pflops)} PFLOPs</span></div>
    ${wrap(comp.map(fn).join(''))}</div>
  <div class="tabsec"><div class="k">Payroll<span class="kr">${D.researchers} staff</span></div>
    ${wrap(pay.map(fn).join(''))}</div>`;
}

function opMeta(op){
  const cd=S.cooldowns[op.id], oncd=!!cd, can=canAfford(op)&&!oncd;
  const cur = op.cur==='$'?'$'+fmt(op.cost):op.cost+' inf';
  const heatTxt = (op.heat>=0?'+':'−')+Math.abs(op.heat)+' heat';
  const tag = op.target?'chevron':(op.id==='acq'?'auto':op.id==='brb'?'self':'instant');
  return {cd,oncd,can,cur,heatTxt,tag};
}
function opRow(op){
  const {cd,oncd,can,cur,heatTxt,tag}=opMeta(op);
  const rt = tag==='chevron'?'<span class="chev">›</span>':`<span class="own">${tag}</span>`;
  return `<button class="row ${oncd?'oncd':''}" ${oncd?'':'data-buyable="1"'} data-act="op:${op.id}">
    <div class="nm"><div class="t">${op.name}</div>
      <div class="sub">${oncd?`cooling down · ${Math.ceil(cd)}s`:op.sub}</div></div>
    <div class="rt"><span class="price num ${op.cur==='$'?'':'inf'} ${can?'':'no'}">${cur}</span>
      <span class="dh ${op.heat<0?'good':'bad'}">${heatTxt}</span></div>
    ${rt}
    ${oncd?`<span class="cool" style="width:${cd/op.cd*100}%"></span>`:''}
  </button>`;
}
function opCard(op){
  const {cd,oncd,can,cur,heatTxt}=opMeta(op);
  return `<button class="gcell ${oncd?'oncd':''}" ${oncd?'':'data-buyable="1"'} data-act="op:${op.id}">
    <div class="t"><span class="cn">${op.name}</span>${op.target?'<span class="chev">›</span>':''}</div>
    <div class="csub">${oncd?`cooling · ${Math.ceil(cd)}s`:op.sub}</div>
    <div class="cfoot"><span class="price num ${op.cur==='$'?'':'inf'} ${can?'':'no'}">${cur}</span>
      <span class="dh ${op.heat<0?'good':'bad'}">${heatTxt}</span></div>
    ${oncd?`<span class="cool" style="width:${cd/op.cd*100}%"></span>`:''}
  </button>`;
}
function renderOps(){
  const grid=S.set.cardLayout==='grid';
  const items=OPS.map(grid?opCard:opRow).join('');
  return `
  <div class="tabsec"><div class="k">Hostile ops<span class="kr">cooldowns apply</span></div>
    ${grid?`<div class="cardgrid">${items}</div>`:items}</div>`;
}

function renderRaceTab(){
  const labs=[{id:'you',name:'Your lab',agi:S.yourAGI,alive:true,you:true},
              ...S.rivals.map(r=>({...r}))];
  labs.sort((a,b)=> (b.alive-a.alive) || b.agi-a.agi);
  return `
  <div class="tabsec"><div class="k">The AGI race<span class="kr">reach 60% share to win</span></div>
    ${labs.map((l,i)=>{
      const sh = D.share[l.id]||0;
      return `<div class="rivalrow ${l.you?'you':''} ${l.alive?'':'dead'}">
        <span class="rk num">${l.alive?ord(i+1).replace(/\D/g,''):'—'}</span>
        <div class="ri"><div class="rt"><span class="nm">${l.name}${l.alive?'':' — gone'}</span>
          <span class="agi num">AGI ${Math.round(l.agi)}%</span></div>
          <div class="mbar"><i style="width:${l.alive?l.agi:0}%"></i></div></div>
        <span class="sh num">${l.alive?sh.toFixed(0)+'%':'0%'}</span>
      </div>`;
    }).join('')}
    <div class="wincond">⚑ Any lab hitting <b>60% market share</b> wins outright · or be first to <b>AGI 100%</b></div>
  </div>`;
}

/* ---------- sheets ---------- */
let pickerOp = null, sheetKind = null;
const SHEET_EASE='cubic-bezier(.2,.9,.25,1)';
function openSheet(html){ sheetKind=null; sheet.innerHTML = `<div class="grab"></div>`+html; sheet.style.transform='translateY(0)'; sheet.style.opacity='1'; sheet.classList.add('show'); scrim.style.opacity='1'; scrim.style.pointerEvents='auto'; scrim.classList.add('show'); }
function closeSheet(){ sheetKind=null; sheet.classList.remove('show'); sheet.style.transform='translateY(110%)'; sheet.style.opacity='0'; scrim.classList.remove('show'); scrim.style.opacity='0'; scrim.style.pointerEvents='none'; pickerOp=null; }

function openPicker(op){
  pickerOp = op;
  const cur = op.cur==='$'?'$'+fmt(op.cost):op.cost+' inf';
  const heatTxt = (op.heat>=0?'+':'−')+Math.abs(op.heat)+' heat';
  const ranked=[...aliveRivals()].sort((a,b)=>b.agi-a.agi);
  const dead = S.rivals.filter(r=>!r.alive);
  const tr = topRival();
  openSheet(`
    <h3>${op.name} — pick a target</h3>
    <div class="shsub">costs <b>${cur}</b> · ${heatTxt} · ${op.cd}s cooldown — ${op.sub}</div>
    ${ranked.map(r=>`<div class="target">
      <div class="ti"><div class="tn">${r.name}</div>
        <div class="ts">${(D.share[r.id]||0).toFixed(0)}% share · AGI ${Math.round(r.agi)}%${tr&&tr.id===r.id?' — closest threat':''}</div>
        <div class="mb"><i style="width:${r.agi}%"></i></div></div>
      <button class="pick" data-act="pick:${r.id}">TARGET</button></div>`).join('')}
    ${dead.map(r=>`<div class="target dead"><div class="ti"><div class="tn">${r.name} — gone</div>
      <div class="ts">absorbed earlier</div></div><button class="pick">TARGET</button></div>`).join('')}
  `);
}
function openEvent(){
  const e=S.event; if(!e) return;
  openSheet(`<h3>${e.title}</h3>
    <div class="shsub"><b class="warn">${Math.ceil(e.t)}s</b> to decide — ignore it and the worse option lands.</div>
    ${e.choices.map((c,i)=>`<button class="btn ${c.kind==='ghost'?'':'full'} sm" style="margin-bottom:9px" data-act="evtChoice:${i}">${c.label}</button>`).join('')}`);
  sheetKind='event';
}
function openCompany(){
  const preview = Math.round(200 + S.founderPts*0.2 + S.yourAGI*1.5);
  openSheet(`<h3>Your company</h3>
    <div class="shsub">Serial founder · run ${S.run} · max tier reached</div>
    <div class="cstat">
      <div class="b"><div class="l">Founder pts</div><div class="v num g">${fmt(S.founderPts)}</div></div>
      <div class="b"><div class="l">This run</div><div class="v num">#${S.run}</div></div>
      <div class="b"><div class="l">Your AGI</div><div class="v num">${Math.round(S.yourAGI)}%</div></div>
      <div class="b"><div class="l">Market share</div><div class="v num g">${(D.share.you||0).toFixed(0)}%</div></div>
    </div>
    <button class="btn full" data-act="sell">Sell company · bank +${preview} founder pts</button>
    <div class="shsub" style="margin-top:10px;text-align:center">Cash out for prestige and start a fresh, faster run. Founder points carry over and boost every future company.</div>`);
}
function openSettings(){
  const s=S.set;
  const hues=[['Terminal green',152],['Cyan',200],['Amber',80],['Magenta',330]];
  const segs=(act,opts,val)=>`<div class="seg">${opts.map(([v,l])=>`<button class="${val===v?'on':''}" data-act="${act}:${v}">${l}</button>`).join('')}</div>`;
  openSheet(`<h3>Settings</h3><div class="shsub">Tune the build — changes apply live.</div>
    <div class="setrow"><div class="sl">Accent<small>terminal hue</small></div>
      <div class="swrow">${hues.map(([l,h])=>`<span class="sw ${s.accH===h?'on':''}" data-act="acc:${h}" style="background:oklch(0.82 0.15 ${h})" title="${l}"></span>`).join('')}</div></div>
    <div class="setrow"><div class="sl">Juice<small>motion & feedback</small></div>
      ${segs('juice',[['low','Low'],['med','Med'],['high','Juicy']],s.juice)}</div>
    <div class="setrow"><div class="sl">Density</div>
      ${segs('density',[['cozy','Cozy'],['compact','Compact']],s.density)}</div>
    <div class="setrow"><div class="sl">Cards<small>Ops &amp; Build layout</small></div>
      ${segs('cards',[['grid','Grid'],['list','List']],s.cardLayout)}</div>
    <div class="setrow"><div class="sl">Numbers<small>${'$9.1M vs $9,110,610'}</small></div>
      ${segs('numfmt',[['short','9.1M'],['full','9,110,610']],s.numfmt)}</div>
    <div class="setrow"><div class="sl">Run<small>wipe this run, keep settings</small></div>
      <button class="btn sm" style="width:auto;padding:8px 14px" data-act="reset">Reset run</button></div>`);
}

/* ---------- toast / fx / end ---------- */
let toastT;
function toast(msg, kind){ toastEl.innerHTML = msg; toastEl.style.opacity='1'; toastEl.style.transform='translateX(-50%) translateY(0)'; toastEl.classList.add('show'); clearTimeout(toastT);
  toastT=setTimeout(()=>{ toastEl.style.opacity='0'; toastEl.style.transform='translateX(-50%) translateY(10px)'; toastEl.classList.remove('show'); }, 1700); }
function floatFx(x,y,txt){
  if (S.set.juice==='low') return;
  const f=document.createElement('div'); f.className='fx go'; f.textContent=txt;
  f.style.left=x+'px'; f.style.top=y+'px'; screen.appendChild(f);
  setTimeout(()=>f.remove(), 900);
}
let endShown=false;
function showEnd(){
  if (endShown) return; endShown=true;
  const e=S.ended;
  const win=e.kind==='win';
  let big, p, btn;
  if (win && e.why==='agi'){ big='AGI ACHIEVED'; p='The market becomes a historical footnote. So does everything else — but that\u2019s a sequel problem.'; }
  else if (win){ big='YOU WIN THE RACE'; p='60% of the market is yours. The others are acquisition targets now.'; }
  else if (e.why==='heat'){ big='RAIDED'; p='Heat hit 100. The regulators, the press, and three angry rivals arrive at once.'; }
  else { big='OUTRUN'; p=`${e.rival||'A rival'} crossed 60% share first. The board would like a word.`; }
  const award = win ? Math.round(300 + S.yourAGI*2 + S.run*10) : 0;
  over.className = `over show ${win?'win':'lose'}`;
  over.style.opacity='1'; over.style.pointerEvents='auto';
  over.innerHTML = `<div class="big">${big}</div><p>${p}</p>
    <button class="btn full" style="width:auto;padding:13px 22px" data-act="restart">
      ${win?`Found a new company · +${award} pts`:'Start a new run'}</button>`;
}

/* ---------- interactions ---------- */
screen.addEventListener('click', e=>{
  const t = e.target.closest('[data-act]'); 
  if (e.target===scrim){ closeSheet(); return; }
  if (!t) return;
  const [act,arg] = t.dataset.act.split(':');

  if (act==='prompt'){ const g=tapPrompt(); const r=t.getBoundingClientRect(), sr=screen.getBoundingClientRect();
    floatFx(r.left-sr.left+r.width/2-14, r.top-sr.top-6, '+$'+g); pulse(); renderRes(); return; }
  if (act==='tab'){ S.tab=arg; renderTabbar(); paintBody(); return; }
  if (act==='buy'){ if(buy(arg)){ paintBody(); renderRes(); bump(t);} else nope(t); return; }
  if (act==='sci'){ if(doSci(arg)){ paintBody(); renderRes(); } else nope(t); return; }
  if (act==='ship'){ if(shipModel()){ paintBody(); renderRes(); } return; }
  if (act==='op'){ const op=OPS.find(o=>o.id===arg); if(S.cooldowns[op.id]) return;
    if(op.target){ if(!canAfford(op)){ nope(t); return;} openPicker(op); }
    else { if(runOp(op)){ paintBody(); renderRes(); closeSheet(); } else nope(t); } return; }
  if (act==='pick'){ const r=S.rivals.find(x=>x.id===arg); if(pickerOp&&runOp(pickerOp,r)){ closeSheet(); paintBody(); renderRes(); } return; }
  if (act==='evt'){ openEvent(); return; }
  if (act==='evtChoice'){ const e2=S.event; if(e2){ e2.choices[+arg].do(); S.event=null; S.eventTimer=CFG.eventEvery; } closeSheet(); renderRes(); syncDock(); return; }
  if (act==='pts'){ openCompany(); return; }
  if (act==='gear'|| t.id==='gearBtn'){ openSettings(); return; }
  if (act==='sell'){ const p=sellCompany(); closeSheet(); endShown=false; paintBody(); renderRes(); renderRace(); toast(`Company sold · <b>+${p} founder pts</b>`); return; }
  if (act==='acc'){ S.set.accH=+arg; applySettings(); openSettings(); return; }
  if (act==='juice'){ S.set.juice=arg; openSettings(); return; }
  if (act==='density'){ S.set.density=arg; applySettings(); openSettings(); return; }
  if (act==='cards'){ S.set.cardLayout=arg; openSettings(); paintBody(); return; }
  if (act==='numfmt'){ S.set.numfmt=arg; applySettings(); openSettings(); renderRes(); renderRace(); paintBody(); return; }
  if (act==='reset'){ resetRun(); closeSheet(); endShown=false; over.className='over'; over.style.opacity='0'; over.style.pointerEvents='none'; paintBody(); renderRes(); renderRace(); toast('Run reset'); return; }
  if (act==='restart'){ if(S.ended&&S.ended.kind==='win'){ S.founderPts += Math.round(300+S.yourAGI*2+S.run*10);} const set=S.set; const fp=S.founderPts; const run=S.run; S=freshState(); S.set=set; S.founderPts=fp; S.run=run+1; recompute(); endShown=false; over.className='over'; over.style.opacity='0'; over.style.pointerEvents='none'; paintBody(); renderRes(); renderRace(); return; }
});
$('#gearBtn').addEventListener('click', openSettings);
$('#ptsBtn').addEventListener('click', openCompany);

function nope(el){ el.animate([{transform:'translateX(0)'},{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'translateX(0)'}],{duration:200}); }
function bump(el){ if(S.set.juice==='low')return; el.animate([{transform:'scale(1)'},{transform:'scale(1.015)'},{transform:'scale(1)'}],{duration:180}); }
function pulse(){ if(S.set.juice!=='high')return; const p=$('.dprompt'); if(p) p.animate([{filter:'brightness(1)'},{filter:'brightness(1.25)'},{filter:'brightness(1)'}],{duration:160}); }

/* ---------- slider drag ---------- */
let dragging=false;
function setSplitFromX(clientX){
  const sl=$('[data-slider]'); if(!sl) return; const r=sl.getBoundingClientRect();
  S.split = clamp((clientX-r.left)/r.width, 0.05, 0.95); recompute();
  const tr=Math.round(S.split*100);
  sl.querySelector('.fill').style.width=tr+'%'; sl.querySelector('.knob').style.left=tr+'%';
  const lbl=sl.previousElementSibling; if(lbl) lbl.innerHTML=`<span>◂ <b>Training</b> ${tr}%</span><span>${100-tr}% <b>Inference</b> ▸</span>`;
  const outs=body.querySelectorAll('.cmpout .co-v');
  if(outs[0]) outs[0].textContent=Math.round(D.researchRate).toLocaleString('en-US');
  if(outs[1]) outs[1].textContent='$'+fmt(D.revenueRate);
  renderRes();
}
screen.addEventListener('pointerdown', e=>{ if(e.target.closest('[data-slider]')){ dragging=true; setSplitFromX(e.clientX); e.preventDefault(); } });
window.addEventListener('pointermove', e=>{ if(dragging) setSplitFromX(e.clientX); });
window.addEventListener('pointerup', ()=>{ dragging=false; });

/* ---------- settings apply ---------- */
function applySettings(){
  document.documentElement.style.setProperty('--acc-h', S.set.accH);
  document.body.setAttribute('data-density', S.set.density);
}

/* ---------- phone scale ---------- */
function scalePhone(){
  const p=$('#phone'); const sc=Math.max(0.3, Math.min((window.innerWidth-20)/390,(window.innerHeight-20)/844,1));
  p.style.transform=`scale(${sc})`;
}
window.addEventListener('resize', ()=>requestAnimationFrame(scalePhone));

/* ---------- clock ---------- */
function tickClock(){ const d=new Date(); $('#clock').textContent = d.getHours()+':'+String(d.getMinutes()).padStart(2,'0'); }

/* ---------- loop ---------- */
function init(){
  load(); applySettings(); recompute();
  buildTicker(); renderTabbar(); renderRes(); renderRace(); renderDock(); paintBody();
  lastEvt=!!S.event; scalePhone(); tickClock();
  let n=0;
  setInterval(()=>{
    tick(CFG.tickMs/1000); n++;
    renderRes(); renderRace(); syncDock();
    if (!dragging && !sheet.classList.contains('show') && n%3===0) paintBody();
    if (S.ended) showEnd();
    if (!S.event && sheetKind==='event') closeSheet();
    if (n%12===0){ save(); tickClock(); }
    // live update open sheets that show timers
    if (S.event && sheet.classList.contains('show') && sheet.querySelector('h3') &&
        sheet.querySelector('h3').textContent===S.event.title){
      const b=sheet.querySelector('.shsub b.warn'); if(b) b.textContent=Math.ceil(S.event.t)+'s';
    }
  }, CFG.tickMs);
}
init();
