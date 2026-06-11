/* ===== AI Lab Mafia — Variant A (refined) wireframes ===== */
const canvas = document.getElementById('canvas');
const resHTML = document.getElementById('tpl-res').innerHTML;

const pin = (style, n) => `<div class="pin" style="${style}">${n}</div>`;

/* ---- race header: you vs. closest rival, always on top ---- */
const raceStrip = `
  <div class="racestrip">
    <div class="rc you">
      <div class="rl"><span>Your lab — <b>leading</b></span><span>1st</span></div>
      <div class="rn">AGI 71%<small>38% mkt</small></div>
      <div class="rbar"><i style="width:71%"></i></div>
    </div>
    <div class="rc">
      <div class="rl"><span>Closest — <b>OpenMind</b></span><span>2nd</span></div>
      <div class="rn">AGI 64%<small>27% mkt</small></div>
      <div class="rbar"><i style="width:64%"></i></div>
    </div>
  </div>`;

/* ---- docked action bar (Event on the LEFT, Prompt on the right) ---- */
const dockResting = `
  <div class="dock">
    <div class="d-prompt"><b>ANSWER A PROMPT</b><small>+$3</small></div>
  </div>`;
const dockEvent = `
  <div class="dock">
    <div class="d-evt"><b>⚡ EVENT</b><small>rival courting · 16s</small></div>
    <div class="d-prompt"><b>ANSWER A PROMPT</b><small>+$3</small></div>
  </div>`;

/* ---- Links / tab bar ---- */
const tabBar = (on) => {
  const tabs = [['lab','⌁','Lab'],['build','⛁','Build'],['ops','☣','Ops'],['race','◎','Race']];
  return `<div class="tabbar">${tabs.map(t=>
    `<div class="tab ${t[0]===on?'on':''}"><span class="ic">${t[1]}</span>${t[2]}</div>`).join('')}</div>`;
};

/* ---- body fragments ---- */
const computeCard = `
  <div class="card">
    <p class="k">Compute · 2,941 PFLOPs · ×2.6 opt</p>
    <div class="slidelbl"><span>◂ Training 54%</span><span>46% Inference ▸</span></div>
    <div class="slider"><i></i><span class="knob"></span></div>
    <div class="cmpout">
      <div><div class="co-l">Research / s</div><div class="co-v">2,375</div></div>
      <div><div class="co-l">Revenue / s</div><div class="co-v">$110k</div></div>
    </div>
    <div class="cmpsub">serving 23% of demand · $254/s opex</div>
  </div>`;
const modelCard = `
  <div class="card">
    <p class="k">Model · Gen 4</p>
    <div class="nm">Training run<small>71% — every rival is coming for you</small></div>
    <div class="bar you"><i style="width:71%"></i></div>
    <div class="bigbtn disabled" style="margin-top:10px">Train Gen 5 · $20M + 120k res</div>
  </div>`;
const scienceChips = `
  <p class="k">Science · spend research</p>
  <div class="chips">
    <div class="chip green"><b>Optimize inference</b><small>89,535 res · +10% compute</small></div>
    <div class="chip green"><b>Publish a paper</b><small>100k res · +10 inf · +0.5% share</small></div>
  </div>`;

const ops = [
  ['Marketing blitz','grab open market','$1,600','cost','+2 heat','bad'],
  ['Espionage','steal research','35 inf','inf','+10 heat','bad'],
  ['Sabotage run','slow a rival\u2019s AGI','45 inf','inf','+15 heat','bad'],
  ['Smear','target bleeds share','30 inf','inf','+12 heat','bad'],
  ['Bribe regulator','lower your heat','25 inf','inf','−30 heat','good'],
];
const opRows = ops.map(o=>`
  <div class="row"><span class="nm">${o[0]}<small>${o[1]}</small></span>
    <span class="rt"><span class="opcost"><span class="cost ${o[3]==='inf'?'inf':''}">${o[2]}</span>
      <span class="dh ${o[5]}">${o[4]}</span></span><span class="chev">›</span></span></div>`).join('');
const opChips = ops.map(o=>`
  <div class="chip ${o[3]==='inf'?'amber':'green'}"><b>${o[0]}</b><small>${o[2]}</small></div>`).join('');

/* ---- builders ---- */
const phone = (inner, label) =>
  `<div class="phone"><div class="scr">${inner}</div><div class="label">${label}</div></div>`;

const column = ({tag,title,desc,pros,legend,phones,wide}) => {
  const c = document.createElement('div');
  c.className = 'col' + (wide?' wide':'');
  c.innerHTML = `
    <div class="cap">
      <span class="tag">${tag}</span>
      <h2>${title}</h2>
      <p>${desc}</p>
      ${legend?`<ol class="legend">${legend.map(l=>`<li><span class="ln">${l[0]}</span><span>${l[1]}</span></li>`).join('')}</ol>`:''}
      ${pros?`<ul class="pros">${pros.map(p=>`<li class="${p[0]==='-'?'con':''}">${p.slice(1)}</li>`).join('')}</ul>`:''}
    </div>
    <div class="phones">${phones}</div>`;
  canvas.appendChild(c);
};

/* ===== COLUMN 1 — the chrome: race header + docked action bar ===== */
const labResting = phone(
  resHTML + raceStrip +
  `<div class="body scroll">${computeCard}${modelCard}${scienceChips}</div>` +
  dockResting + tabBar('lab') +
  pin('right:13px;top:118px','1') +
  pin('right:12px;top:46px','6') +
  pin('left:20px;bottom:78px','2'),
  'Lab · resting');

const labEvent = phone(
  resHTML + raceStrip +
  `<div class="body scroll">${computeCard}${modelCard}${scienceChips}</div>` +
  dockEvent + tabBar('lab') +
  pin('left:54px;bottom:78px','3'),
  'Lab · event active');

column({
  tag:'A · chosen', title:'Race header + docked actions',
  desc:'Resources, then a slim race strip — your lab vs. the current runner-up, with AGI% and market share — then the ticker. The Prompt tap target is a docked bar; when an event fires it slides in beside it. Links (tabs) sit underneath.',
  legend:[
    ['1','<b>Race header</b> — your lab vs. the current runner-up, AGI% + market share, always on top.'],
    ['6','<b>Heat</b> — big colour-coded number (green → amber → red) with a small /100; active penalties (−25% rev, +30% opex) read beneath. No bar.'],
    ['2','<b>Prompt</b> — a compact docked thumb target, not a giant floating circle.'],
    ['3','<b>Event pops on the left</b> so a right-thumb Prompt tap can’t open it sight-unseen.'],
  ],
  pros:['+Race + heat state glanceable without leaving the screen','+Prompt sized for the thumb, not the whole screen','+Event shares the dock on the safe (left) side'],
  phones: labResting + labEvent,
  wide:true
});

/* ===== COLUMN 2 — Ops → target picker (shared flow) ===== */
const opsList = phone(
  resHTML + raceStrip +
  `<div class="body scroll">
     <p class="k">Hostile ops · tap an action to choose a target</p>
     <div class="card">${opRows}</div>
   </div>` +
  dockResting + tabBar('ops') +
  pin('right:14px;top:268px','4'),
  'Ops tab · 1 · tap action');

const picker = phone(
  resHTML + raceStrip +
  `<div class="body">
     <p class="k">Hostile ops</p>
     <div class="card" style="opacity:.35">${opRows}</div>
   </div>` +
  dockResting + tabBar('ops') +
  `<div class="dim"></div>
   <div class="sheet">
     <div class="grab"></div>
     <h3>Sabotage run — pick a target</h3>
     <p class="sub">costs <b>45 influence</b> · +15 heat · 30s cooldown — slows their AGI run</p>
     <div class="target">
       <div class="info"><div class="tn">OpenMind</div><div class="ts">27% share · AGI 64% — closest threat</div>
         <div class="minibar"><i style="width:64%"></i></div></div>
       <div class="pick">TARGET</div></div>
     <div class="target">
       <div class="info"><div class="tn">DeepFathom</div><div class="ts">19% share · AGI 52%</div>
         <div class="minibar"><i style="width:52%"></i></div></div>
       <div class="pick">TARGET</div></div>
     <div class="target">
       <div class="info"><div class="tn">Cerebrum</div><div class="ts">11% share · AGI 40%</div>
         <div class="minibar"><i style="width:40%"></i></div></div>
       <div class="pick">TARGET</div></div>
     <div class="target dead">
       <div class="info"><div class="tn">Mistral Valley — gone</div><div class="ts">acquired last run</div></div>
       <div class="pick">TARGET</div></div>
   </div>` +
  pin('left:10px;bottom:196px','5'),
  '2 · pick who to hit');

column({
  tag:'Shared flow', title:'Action → target picker',
  desc:'Your friction fix, living inside the Ops tab. Tap the action first; a sheet lists every rival with a live market snapshot (share + AGI) so you choose a target in-context. One sheet pattern serves every hostile op.',
  legend:[
    ['4','<b>Tap the action first</b> — no rival selected up front; the row opens the picker.'],
    ['5','<b>Pick a target in-context</b> — every rival with a live market snapshot (share + AGI) right in the sheet.'],
  ],
  pros:['+Cuts a step: the action carries its own target list','+Market reminder right where the decision happens','+Reused for sabotage, smear, espionage, acquire…'],
  phones: opsList + picker,
  wide:true
});

/* ===== controls ===== */
function bindToggle(id, attr){
  const el = document.getElementById(id);
  el.addEventListener('click', ()=>{
    const on = el.getAttribute('data-on')==='1' ? '0':'1';
    el.setAttribute('data-on', on);
    document.body.setAttribute(attr, on);
  });
}
bindToggle('t-notes','data-notes');
bindToggle('t-hand','data-hand');

document.querySelectorAll('.sw').forEach(sw=>{
  sw.addEventListener('click', ()=>{
    document.querySelectorAll('.sw').forEach(s=>s.removeAttribute('data-sel'));
    sw.setAttribute('data-sel','1');
    const h = sw.getAttribute('data-h');
    const l = h==='330' ? '0.72':'0.80';
    const c = h==='330' ? '0.16':'0.13';
    document.documentElement.style.setProperty('--acc', `oklch(${l} ${c} ${h})`);
  });
});
