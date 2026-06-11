/* ============ AI LAB MAFIA — state + economy ============ */
const CFG = {
  tickMs: 200,
  researchK: 0.0273,     // per researcher, scales research from compute
  revenueK: 31.3,        // $/s per inference compute unit
  opexPerPflop: 0.072,
  heatThresh: 40,        // penalties begin
  heatRevMax: 0.6, heatOpexMax: 0.85,
  heatDrift: -0.22,      // /s natural cooldown
  agiFromResearch: 0.00003,
  modelFromResearch: 0.0009,
  rivalSpeed: 0.10,      // agi /s baseline creep
  priceScale: 1.15,
  promptBase: 3,
  eventEvery: 42,        // seconds between events
};

const ITEMS = [
  {id:'gpu', name:'GPU rack',         cat:'compute', base:42,     owned:1,  pflop:1,   sub:'+1 PFLOP'},
  {id:'dc',  name:'Datacenter',       cat:'compute', base:1141,   owned:5,  pflop:8,   sub:'+8 PFLOPs'},
  {id:'mc',  name:'Megacluster',      cat:'compute', base:15210,  owned:4,  pflop:50,  sub:'+50 PFLOPs'},
  {id:'orb', name:'Orbital GPU farm', cat:'compute', base:668087, owned:9,  pflop:300, sub:'+300 PFLOPs · 15% launch failure'},
  {id:'res', name:'Researcher',       cat:'pay',     base:8870,   owned:21, research:1,   salary:1.5, sub:'+1 research/s · $1.5/s salary'},
  {id:'lob', name:'Lobbyist',         cat:'pay',     base:500,    owned:2,  influence:0.4, salary:2,  sub:'+0.4 influence/s · $2/s salary'},
];

const SCI = [
  {id:'opt', name:'Optimize inference', cost:89535,  cur:'res', sub:()=>`+10% effective compute · now ×${S.computeMult.toFixed(1)}`},
  {id:'pub', name:'Publish a paper',    cost:100012, cur:'res', sub:()=>`+10 influence · +0.5% AGI · −5 heat`},
];

const OPS = [
  {id:'mkt',  name:'Marketing blitz',  sub:'grab open market',     cost:1600, cur:'$',   heat:+2,  cd:15, target:false},
  {id:'poach',name:'Poach team',       sub:'steal share + research',cost:18,  cur:'inf', heat:+6,  cd:22, target:true},
  {id:'esp',  name:'Espionage',        sub:'steal research',       cost:35,   cur:'inf', heat:+10, cd:25, target:true},
  {id:'smr',  name:'Smear',            sub:'target bleeds share',  cost:30,   cur:'inf', heat:+12, cd:20, target:true},
  {id:'sab',  name:'Sabotage run',     sub:"slow a rival's AGI",   cost:45,   cur:'inf', heat:+15, cd:30, target:true},
  {id:'brb',  name:'Bribe regulator',  sub:'lower your heat',      cost:25,   cur:'inf', heat:-30, cd:40, target:false},
  {id:'acq',  name:'Acquire weakest',  sub:'absorb them · +income',cost:30,   cur:'inf', heat:+20, cd:60, target:false},
];

const NEWS = [
  "Paper published — citations roll in, regulators look away",
  "Drone footage of your cooling towers trends for a day",
  "A generous donation to the Committee. Files go missing",
  "Open-source release wins hearts; your share ticks up",
  "Leaked benchmark spooks two rivals into a price war",
  "Your chatbot says something unhinged. Engagement soars",
];

function freshState(){
  return {
    cash: 9110610, research: 78833, influence: 64, heat: 62,
    split: 0.54,                 // training fraction
    computeMult: 2.6,
    modelGen: 4, modelProgress: 71,
    yourAGI: 71,
    owned: Object.fromEntries(ITEMS.map(i=>[i.id, i.owned])),
    sciCost: Object.fromEntries(SCI.map(s=>[s.id, s.cost])),    rivals: [
      {id:'om', name:'OpenMind',      agi:64, alive:true},
      {id:'df', name:'DeepFathom',    agi:52, alive:true},
      {id:'cb', name:'Cerebrum',      agi:40, alive:true},
      {id:'mv', name:'Mistral Valley',agi:33, alive:true},
    ],
    cooldowns: {},               // opId -> seconds remaining
    founderPts: 1393, run: 12,
    event: null, eventTimer: CFG.eventEvery, researchDebuff: 0,
    tab: 'lab', ended: null,
    set: { accH: 152, juice: 'med', density: 'cozy', numfmt: 'short', cardLayout: 'grid' },
  };
}

let S = freshState();

/* ---------- derived economy ---------- */
let D = {};
function ownedCount(id){ return S.owned[id] || 0; }
function price(item){ return Math.round(item.base * Math.pow(CFG.priceScale, ownedCount(item.id))); }

function recompute(){
  let pflops = 0, researchers = 0, lobbyists = 0, salaries = 0;
  for (const it of ITEMS){
    const n = ownedCount(it.id);
    if (it.pflop) pflops += it.pflop * n;
    if (it.id==='res') researchers = n;
    if (it.id==='lob') lobbyists = n;
    if (it.salary) salaries += it.salary * n;
  }
  const eff = pflops * S.computeMult;
  const heatPen = Math.max(0, (S.heat - CFG.heatThresh) / (100 - CFG.heatThresh));
  const revPen = Math.min(CFG.heatRevMax, heatPen * CFG.heatRevMax);
  const opexPen = Math.min(CFG.heatOpexMax, heatPen * CFG.heatOpexMax);
  const researchRate = eff * S.split * (CFG.researchK * researchers) * (1 - S.researchDebuff);
  const revenueRate = eff * (1 - S.split) * CFG.revenueK * (1 - revPen);
  const opex = (pflops * CFG.opexPerPflop + salaries) * (1 + opexPen);
  const inflRate = lobbyists * 0.4;

  // market shares (agi^2 weighted among alive labs incl you)
  const labs = [{id:'you', agi:S.yourAGI, alive:true}, ...S.rivals];
  let sum = 0; for (const l of labs) if (l.alive) sum += l.agi*l.agi;
  const share = {};
  for (const l of labs) share[l.id] = l.alive ? (l.agi*l.agi/sum*100) : 0;

  D = { pflops, researchers, lobbyists, eff, revPen, opexPen,
        researchRate, revenueRate, opex, cashRate: revenueRate - opex, inflRate,
        share, demand: 23 };
}

function tick(dt){
  if (S.ended) { recompute(); return; }
  recompute();
  S.cash      = Math.max(0, S.cash + D.cashRate * dt);
  S.research  += D.researchRate * dt;
  S.influence += D.inflRate * dt;
  S.heat       = clamp(S.heat + CFG.heatDrift * dt, 0, 100);
  if (S.researchDebuff > 0) S.researchDebuff = Math.max(0, S.researchDebuff - dt/20);

  // progress
  S.modelProgress = clamp(S.modelProgress + D.researchRate * CFG.modelFromResearch * dt, 0, 100);
  S.yourAGI = clamp(S.yourAGI + D.researchRate * CFG.agiFromResearch * dt, 0, 100);

  // rivals creep
  for (const r of S.rivals){ if (r.alive) r.agi = clamp(r.agi + CFG.rivalSpeed*dt*(0.5+Math.random()), 0, 100); }

  // cooldowns
  for (const k in S.cooldowns){ S.cooldowns[k] -= dt; if (S.cooldowns[k] <= 0) delete S.cooldowns[k]; }

  // events
  if (!S.event){ S.eventTimer -= dt; if (S.eventTimer <= 0) spawnEvent(); }
  else { S.event.t -= dt; if (S.event.t <= 0) resolveEvent(S.event.expire); }

  // win / lose
  recompute();
  const leadRival = topRival();
  if (S.yourAGI >= 100) endGame('win', 'agi');
  else if (D.share.you >= 60) endGame('win', 'share');
  else if (leadRival && D.share[leadRival.id] >= 60) endGame('lose', 'rival', leadRival);
  else if (S.heat >= 100) endGame('lose', 'heat');
}

function topRival(){ let best=null; for (const r of S.rivals) if (r.alive && (!best || r.agi>best.agi)) best=r; return best; }
function weakestRival(){ let w=null; for (const r of S.rivals) if (r.alive && (!w || r.agi<w.agi)) w=r; return w; }
function aliveRivals(){ return S.rivals.filter(r=>r.alive); }

/* ---------- events ---------- */
const EVENTS = [
  () => ({ key:'court', title:'A rival is courting your research lead', t:16, expire:'letgo',
    choices:[
      {label:'Counter-offer ($1,200)', do:()=>{ if(S.cash>=1200){S.cash-=1200; toast('Lead retained. <b>−$1,200</b>');} else toast('Not enough cash — they walked', 'warn'); }},
      {label:'Let them go (research −50%, 20s)', kind:'ghost', do:()=>{ S.researchDebuff=0.5; toast('Talent poached. <b class="bad">research −50%</b>'); }},
    ]}),
  () => ({ key:'audit', title:'Regulator opens a quiet audit', t:14, expire:'comply',
    choices:[
      {label:'Bribe your way out ($2,000)', do:()=>{ if(S.cash>=2000){S.cash-=2000; S.heat=clamp(S.heat-12,0,100); toast('Audit vanishes. <b>−12 heat</b>');} else toast('Too broke to bribe', 'warn'); }},
      {label:'Comply (+8 heat, slower week)', kind:'ghost', do:()=>{ S.heat=clamp(S.heat+8,0,100); toast('You comply. <b class="warn">+8 heat</b>'); }},
    ]}),
  () => ({ key:'break', title:'Late-night breakthrough on the cluster', t:18, expire:'claim',
    choices:[
      {label:'Claim (+12,000 research)', do:()=>{ S.research+=12000; toast('Breakthrough banked. <b>+12k research</b>'); }},
    ]}),
];
function spawnEvent(){ S.event = EVENTS[Math.floor(Math.random()*EVENTS.length)](); }
function resolveEvent(which){
  const e = S.event; if(!e) return;
  if (which){ const c = e.choices.find(c=>c.label.toLowerCase().includes(which)) || e.choices[e.choices.length-1]; }
  S.event = null; S.eventTimer = CFG.eventEvery;
}

/* ---------- actions ---------- */
function tapPrompt(){
  if (S.ended) return 0;
  const gain = CFG.promptBase * Math.max(1, Math.round(D.cashRate>0 ? D.cashRate*0.00003 : 1));
  S.cash += gain; return gain;
}
function buy(id){
  const it = ITEMS.find(i=>i.id===id); const p = price(it);
  if (S.cash < p) return false;
  S.cash -= p; S.owned[id] = ownedCount(id) + 1; recompute(); return true;
}
function doSci(id){
  const s = SCI.find(x=>x.id===id); const c = S.sciCost[id];
  if (S.research < c) return false;
  S.research -= c;
  if (id==='opt'){ S.computeMult *= 1.1; S.sciCost[id] = Math.round(c*1.6); }
  if (id==='pub'){ S.influence += 10; S.yourAGI = clamp(S.yourAGI+0.5,0,100); S.heat = clamp(S.heat-5,0,100); S.sciCost[id] = Math.round(c*1.4); }
  recompute(); return true;
}
function shipModel(){
  if (S.modelProgress < 100) return false;
  const need = 20000000; if (S.cash < need) return false;
  S.cash -= need; S.modelGen += 1; S.modelProgress = 0;
  S.computeMult *= 1.12; S.yourAGI = clamp(S.yourAGI+6,0,100);
  toast(`<b>Gen ${S.modelGen} shipped</b> · +6% AGI · compute ×${S.computeMult.toFixed(1)}`);
  return true;
}
function canAfford(op){ return op.cur==='$' ? S.cash>=op.cost : S.influence>=op.cost; }
function payOp(op){ if(op.cur==='$') S.cash-=op.cost; else S.influence-=op.cost; }
function runOp(op, rival){
  if (!canAfford(op) || S.cooldowns[op.id]) return false;
  payOp(op); S.heat = clamp(S.heat + op.heat, 0, 100); S.cooldowns[op.id] = op.cd;
  if (op.id==='mkt'){ S.yourAGI = clamp(S.yourAGI+1.5,0,100); toast('Market grabbed · <b>+share</b>'); }
  else if (op.id==='brb'){ toast('Regulator handled · <b>−30 heat</b>'); }
  else if (op.id==='acq'){ const w=weakestRival(); if(w){ w.alive=false; S.cash+=w.agi*40000; toast(`<b>${w.name}</b> absorbed · +income`);} }
  else if (rival){
    if (op.id==='sab'){ rival.agi = Math.max(0, rival.agi-6); toast(`<b>${rival.name}</b> sabotaged · −6 AGI`); }
    if (op.id==='smr'){ rival.agi = Math.max(0, rival.agi-3); toast(`<b>${rival.name}</b> smeared · share bleeds`); }
    if (op.id==='esp'){ S.research += 6000; rival.agi=Math.max(0,rival.agi-1.5); toast(`Stole <b>6k research</b> from ${rival.name}`); }
    if (op.id==='poach'){ S.research += 3000; rival.agi=Math.max(0,rival.agi-2); toast(`Poached <b>${rival.name}</b>'s team`); }
  }
  recompute(); return true;
}
function sellCompany(){
  const pts = Math.round(200 + S.founderPts*0.2 + S.yourAGI*1.5);
  const keep = S.founderPts + pts;
  S = freshState(); S.founderPts = keep; S.run += 1;
  recompute(); return pts;
}
function endGame(kind, why, rival){
  if (S.ended) return;
  S.ended = { kind, why, rival: rival? rival.name : null };
}

/* ---------- format ---------- */
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }
function fmt(n){
  n = Math.floor(n);
  if (S.set.numfmt === 'full') return n.toLocaleString('en-US');
  const a = Math.abs(n);
  if (a >= 1e12) return (n/1e12).toFixed(2)+'T';
  if (a >= 1e9)  return (n/1e9).toFixed(2)+'B';
  if (a >= 1e6)  return (n/1e6).toFixed(2)+'M';
  if (a >= 1e4)  return (n/1e3).toFixed(1)+'k';
  if (a >= 1e3)  return (n/1e3).toFixed(2)+'k';
  return n.toLocaleString('en-US');
}
function fmtRate(n){
  const s = n>=0?'+':'−'; n=Math.abs(n);
  if (n>=1e6) return s+'$'+(n/1e6).toFixed(2)+'M/s';
  if (n>=1e3) return s+'$'+(n/1e3).toFixed(1)+'k/s';
  return s+'$'+Math.round(n)+'/s';
}

/* ---------- persistence ---------- */
const SKEY = 'almm_hifi_v1';
function save(){ try{ localStorage.setItem(SKEY, JSON.stringify(S)); }catch(e){} }
function load(){
  try{ const raw = localStorage.getItem(SKEY); if(!raw) return false;
    const o = JSON.parse(raw); if(!o || typeof o.cash!=='number') return false;
    S = Object.assign(freshState(), o);
    S.set = Object.assign(freshState().set, o.set||{});
    S.ended = null;
    return true;
  }catch(e){ return false; }
}
function resetRun(){ const set = S.set; S = freshState(); S.set = set; recompute(); }
