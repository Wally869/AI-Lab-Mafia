/**
 * Pure simulation core. No DOM, no timers, no Svelte: every function takes a
 * GameState and mutates it deterministically (modulo Math.random). This is the
 * module you would port to a Rust server for authoritative multiplayer — the
 * UI layer only renders state and forwards intents.
 */
import {
  AGI_RUN,
  BUILDINGS,
  ECON,
  MILESTONE_INFLUENCE,
  MONOPOLY_SHARE,
  OPEN_MARKET_START,
  OP_COOLDOWNS,
  OP_INFLUENCE_COSTS,
  PLAYER_START_SHARE,
  RIVAL_DEFS,
  RIVAL_START_SHARES,
  SHARE_MILESTONES,
  STRUCTURAL,
  TIERS,
  TRAIN_RUNS,
} from './constants';
import { addHeat, endGame, pushLog, stealShare } from './effects';
import { EVENTS } from './events';
import {
  acquisitionCost,
  aliveRivals,
  currentTarget,
  demand,
  inferenceCapacity,
  netCashFlow,
  pointsMult,
  prCost,
  researchRate,
  tierIndex,
  totalCompute,
  weakestRival,
} from './helpers';
import type { FounderMeta, GameState, OpKey, Rival, StructuralKey } from './types';

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function createGame(meta: FounderMeta): GameState {
  const tier = TIERS[tierIndex(meta.points)];
  const gm = pointsMult(meta.points);

  const rivals: Rival[] = RIVAL_DEFS.map((d, i) => ({
    ...d,
    share: RIVAL_START_SHARES[i],
    agi: 0,
    warnedAgi50: false,
    warnedAgi80: false,
    warnedShare45: false,
  }));

  const state: GameState = {
    cash: tier.cash,
    research: 0,
    influence: tier.influence,
    heat: 0,
    share: PLAYER_START_SHARE,
    openMarket: OPEN_MARKET_START,
    groundCompute: tier.datacenters * 8 + (tier.datacenters > 0 ? 1 : 0),
    orbitalCompute: 0,
    researchers: tier.researchers,
    lobbyists: tier.lobbyists,
    gen: tier.gen,
    training: null,
    agiProgress: null,
    alloc: 50,
    targetIdx: 0,
    incomeMult: tier.incomeMult * gm,
    researchMult: tier.researchMult * gm,
    defenseMult: tier.defenseMult,
    heatGainMult: 1,
    opexMult: 1,
    hardwareMult: 1,
    computeMult: 1,
    opsec: false,
    scienceCosts: [80, 60],
    prUses: 0,
    shortageT: 0,
    brainDrainT: 0,
    brokeTicks: 0,
    ticks: 0,
    lastOutageTick: -100,
    lastSabBlockTick: -100,
    heatWarned: false,
    milestones: {},
    buildings: BUILDINGS.map((b, i) => ({
      cost: b.baseCost,
      count: b.effect === 'researcher' ? tier.researchers
        : b.effect === 'lobbyist' ? tier.lobbyists
        : i === 1 ? tier.datacenters
        : i === 0 && tier.datacenters > 0 ? 1
        : 0,
    })),
    cooldowns: { pr: 0, poach: 0, spy: 0, smear: 0, sab: 0, bribe: 0, acq: 0 },
    rivals,
    event: null,
    log: [],
    ended: false,
    outcome: null,
  };

  pushLog(
    state,
    `Run #${meta.runs} as ${tier.name} (${meta.points} pts). Reminder: any lab reaching ${MONOPOLY_SHARE}% share — including rivals — ends the game.`,
  );
  return state;
}

// ---------------------------------------------------------------------------
// Player actions
// ---------------------------------------------------------------------------

export function answerPrompt(s: GameState): void {
  if (s.ended) return;
  s.cash += ECON.clickCash * s.incomeMult;
  if (Math.random() < 0.3) s.research += 0.5;
}

export function buyBuilding(s: GameState, index: number): void {
  if (s.ended) return;
  const def = BUILDINGS[index];
  const b = s.buildings[index];
  const isHardware = def.effect === 'ground' || def.effect === 'orbital';
  const price = isHardware ? b.cost * s.hardwareMult : b.cost;
  if (s.cash < price) return;
  if (def.minGen && s.gen < def.minGen) return;

  s.cash -= price;
  b.cost = Math.ceil(b.cost * def.growth);

  if (def.failChance && Math.random() < def.failChance) {
    s.cash += price * 0.6;
    pushLog(s, 'LAUNCH FAILURE. The rocket performs an unscheduled disassembly. Insurance covers 60%.');
    return;
  }

  b.count += 1;
  switch (def.effect) {
    case 'ground':
      s.groundCompute += def.amount;
      break;
    case 'orbital':
      s.orbitalCompute += def.amount;
      pushLog(s, `Orbital GPU farm deployed. ${def.amount} PFLOPs now compute in the cold silence of space.`);
      break;
    case 'researcher':
      s.researchers += def.amount;
      break;
    case 'lobbyist':
      s.lobbyists += def.amount;
      break;
  }
}

export function buyScience(s: GameState, index: 0 | 1): void {
  if (s.ended || s.research < s.scienceCosts[index]) return;
  s.research -= s.scienceCosts[index];
  if (index === 0) {
    s.scienceCosts[0] = Math.ceil(s.scienceCosts[0] * 1.55);
    s.computeMult = Math.round((s.computeMult + 0.1) * 10) / 10;
    pushLog(s, `Inference stack optimized. Same GPUs, ${Math.round((s.computeMult - 1) * 100)}% more effective compute.`);
  } else {
    s.scienceCosts[1] = Math.ceil(s.scienceCosts[1] * 1.4);
    s.influence += 10;
    const grabbed = Math.min(0.5, s.openMarket);
    s.openMarket -= grabbed;
    s.share += grabbed;
    addHeat(s, -5);
    pushLog(s, 'Paper published. Citations roll in, regulators soften. +10 influence.');
  }
}

export function startTraining(s: GameState): void {
  if (s.ended || s.training || s.agiProgress !== null) return;
  if (s.gen < 4) {
    const spec = TRAIN_RUNS[s.gen];
    if (!spec || s.research < spec.research || s.cash < spec.cash) return;
    s.research -= spec.research;
    s.cash -= spec.cash;
    s.training = { total: spec.seconds, done: 0, lock: spec.lock };
    pushLog(s, `Training run for Gen ${s.gen + 1} begins. The datacenter hums ominously.`);
  } else {
    if (s.research < AGI_RUN.research || s.cash < AGI_RUN.cash) return;
    s.research -= AGI_RUN.research;
    s.cash -= AGI_RUN.cash;
    s.agiProgress = 0;
    addHeat(s, 10);
    pushLog(s, 'THE AGI RUN BEGINS. Someone leaks it within the hour. The world holds its breath.');
  }
}

function retaliate(s: GameState, rival: Rival, why: string): void {
  if (Math.random() < rival.retaliation && rival.share > 0.05) {
    const dmg = clamp((0.8 + Math.random() * 1.2) * s.defenseMult, 0, s.share - 0.5);
    if (dmg > 0) {
      s.share -= dmg;
      rival.share += dmg;
      pushLog(s, `${rival.name} retaliates for the ${why}. You lose ${dmg.toFixed(1)}%.`);
    }
  }
}

export function canRunOp(s: GameState, key: OpKey): boolean {
  if (s.ended || s.cooldowns[key] > 0) return false;
  if (key === 'pr') return s.cash >= prCost(s) && s.openMarket >= 0.1;
  if (s.influence < OP_INFLUENCE_COSTS[key]) return false;
  const t = currentTarget(s);
  switch (key) {
    case 'poach':
    case 'smear':
    case 'spy':
      return t !== null;
    case 'sab':
      return t !== null && t.agi >= 8;
    case 'acq': {
      const w = weakestRival(s);
      return w !== null && s.cash >= acquisitionCost(s);
    }
    default:
      return true;
  }
}

export function runOp(s: GameState, key: OpKey): void {
  if (!canRunOp(s, key)) return;
  const target = currentTarget(s);

  switch (key) {
    case 'pr': {
      s.cash -= prCost(s);
      s.prUses += 1;
      s.cooldowns.pr = OP_COOLDOWNS.pr;
      addHeat(s, 2);
      const got = Math.min((0.6 + 0.5 * s.gen) * (0.8 + Math.random() * 0.5), s.openMarket);
      s.openMarket -= got;
      s.share += got;
      pushLog(s, `Marketing blitz lands. +${got.toFixed(1)}% from the open market.`);
      break;
    }
    case 'poach': {
      if (!target) return;
      s.influence -= OP_INFLUENCE_COSTS.poach;
      s.cooldowns.poach = OP_COOLDOWNS.poach;
      addHeat(s, 6);
      const got = stealShare(s, (1.2 + Math.random() * 1.6) / target.defense, target);
      s.research += 25;
      pushLog(s, `Your new hire arrives from ${target.name} with +${got.toFixed(1)}% share and 25 research.`);
      retaliate(s, target, 'poaching');
      break;
    }
    case 'spy': {
      if (!target) return;
      s.influence -= OP_INFLUENCE_COSTS.spy;
      s.cooldowns.spy = OP_COOLDOWNS.spy;
      addHeat(s, 10);
      const gain = 60 + s.gen * 40;
      s.research += gain;
      target.agi = Math.max(0, target.agi - 3);
      pushLog(s, `A USB stick changes hands in a parking garage. +${gain} research from ${target.name}'s checkpoints.`);
      retaliate(s, target, 'espionage');
      break;
    }
    case 'smear': {
      if (!target) return;
      s.influence -= OP_INFLUENCE_COSTS.smear;
      s.cooldowns.smear = OP_COOLDOWNS.smear;
      addHeat(s, 12);
      const lost = Math.min((2.5 + Math.random() * 2.5) / target.defense, target.share);
      target.share -= lost;
      s.openMarket += lost * 0.6;
      s.share += lost * 0.4;
      pushLog(s, `Anonymous benchmark leak. ${target.name} bleeds ${lost.toFixed(1)}%.`);
      retaliate(s, target, 'smear');
      break;
    }
    case 'sab': {
      if (!target) return;
      s.influence -= OP_INFLUENCE_COSTS.sab;
      s.cooldowns.sab = OP_COOLDOWNS.sab;
      addHeat(s, 15);
      target.agi = Math.max(0, target.agi - 8);
      pushLog(s, `A 'power grid incident' corrupts ${target.name}'s checkpoint. Their AGI slips back 8%.`);
      retaliate(s, target, 'sabotage');
      break;
    }
    case 'bribe': {
      s.influence -= OP_INFLUENCE_COSTS.bribe;
      s.cooldowns.bribe = OP_COOLDOWNS.bribe;
      const catchChance = 0.2 + s.heat / 300;
      if (Math.random() < catchChance) {
        s.influence = Math.max(0, s.influence - 15);
        addHeat(s, 18);
        pushLog(s, "The 'regulator' was wearing a wire. +18 heat, and your contacts stop returning calls.");
      } else {
        addHeat(s, -30);
        pushLog(s, 'A generous donation to the Committee for Responsible Innovation. Files go missing.');
      }
      break;
    }
    case 'acq': {
      const w = weakestRival(s);
      if (!w) return;
      const cost = acquisitionCost(s);
      if (s.cash < cost) return;
      s.cash -= cost;
      s.influence -= OP_INFLUENCE_COSTS.acq;
      s.cooldowns.acq = OP_COOLDOWNS.acq;
      addHeat(s, 20);
      stealShare(s, w.share, w);
      s.incomeMult *= 1.15;
      pushLog(s, `You acquire ${w.name}. 'A merger of equals,' says the press release. Income +15%.`);
      break;
    }
  }
}

export function canBuyStructural(s: GameState, key: StructuralKey): boolean {
  if (s.ended) return false;
  switch (key) {
    case 'opsec':
      return !s.opsec && s.influence >= STRUCTURAL.opsec.influence && s.cash >= STRUCTURAL.opsec.cash;
    case 'capture':
      return s.heatGainMult >= 1 && s.influence >= STRUCTURAL.capture.influence && s.gen >= STRUCTURAL.capture.minGen;
    case 'cartel':
      return s.hardwareMult >= 1 && s.influence >= STRUCTURAL.cartel.influence && s.share >= STRUCTURAL.cartel.minShare;
  }
}

export function buyStructural(s: GameState, key: StructuralKey): void {
  if (!canBuyStructural(s, key)) return;
  switch (key) {
    case 'opsec':
      s.influence -= STRUCTURAL.opsec.influence;
      s.cash -= STRUCTURAL.opsec.cash;
      s.opsec = true;
      pushLog(s, 'Opsec team hired. They sweep for bugs, find three, and frame it as a win.');
      break;
    case 'capture':
      s.influence -= STRUCTURAL.capture.influence;
      s.heatGainMult = 0.6;
      pushLog(s, 'Three former staffers now write the AI regulations. Heat gain permanently reduced.');
      break;
    case 'cartel':
      s.influence -= STRUCTURAL.cartel.influence;
      s.hardwareMult = 0.7;
      s.opexMult = 0.7;
      pushLog(s, 'Exclusive fab allocation secured over a very long dinner. Hardware and opex −30%.');
      break;
  }
}

export function sellCompany(s: GameState): void {
  if (s.ended) return;
  endGame(s, false, "You sell the company. The acquirer's CEO calls it 'visionary.' You call it an exit.");
}

export function resolveEvent(s: GameState, optionIndex: number): void {
  if (!s.event) return;
  const ev = EVENTS[s.event.index];
  s.event = null;
  ev.options[optionIndex]?.apply(s);
}

export function maybeSpawnEvent(s: GameState): void {
  if (s.ended || s.event || Math.random() > 0.5) return;
  s.event = { index: Math.floor(Math.random() * EVENTS.length), secondsLeft: 18 };
}

// ---------------------------------------------------------------------------
// Ticks
// ---------------------------------------------------------------------------

/** Runs once per second. */
export function tickSecond(s: GameState): void {
  if (s.ended) return;
  s.ticks += 1;

  const net = netCashFlow(s);
  s.cash += net;
  s.research += researchRate(s);
  s.influence += s.lobbyists * ECON.lobbyistInfluence;

  // Success draws scrutiny; investigations are sticky.
  if (s.share > ECON.scrutinyShareFloor) {
    addHeat(s, (s.share - ECON.scrutinyShareFloor) * ECON.scrutinyHeatPerPoint);
  }
  s.heat = Math.max(0, s.heat - (s.heat >= ECON.heatRevenueThreshold ? 0.15 : 0.3));

  if (s.shortageT > 0) s.shortageT -= 1;
  if (s.brainDrainT > 0) s.brainDrainT -= 1;
  for (const k of Object.keys(s.cooldowns) as OpKey[]) {
    if (s.cooldowns[k] > 0) s.cooldowns[k] -= 1;
  }

  if (s.event) {
    s.event.secondsLeft -= 1;
    if (s.event.secondsLeft <= 0) {
      const defaultIdx = EVENTS[s.event.index].options.length - 1;
      resolveEvent(s, defaultIdx);
    }
  }

  if (s.training) {
    s.training.done += 1;
    if (s.training.done >= s.training.total) {
      s.gen += 1;
      s.training = null;
      pushLog(s, `Gen ${s.gen} ships. Benchmarks tremble. Demand surges.`);
    }
  }

  if (s.agiProgress !== null) {
    s.agiProgress += 100 / AGI_RUN.seconds;
    addHeat(s, AGI_RUN.heatPerSecond);
    if (s.agiProgress >= 100) {
      endGame(
        s,
        true,
        "AGI ACHIEVED. The market becomes a historical footnote. So does everything else, but that's a sequel problem.",
      );
      return;
    }
  }

  for (const m of SHARE_MILESTONES) {
    if (s.share >= m && !s.milestones[m]) {
      s.milestones[m] = true;
      s.influence += MILESTONE_INFLUENCE;
      pushLog(s, `Crossed ${m}% market share. Doors open. +${MILESTONE_INFLUENCE} influence.`);
    }
  }

  if (s.cash <= 0 && net < 0) {
    s.cash = 0;
    s.brokeTicks += 1;
    if (s.brokeTicks === 4) {
      pushLog(s, `PAYROLL WARNING: ${10 - s.brokeTicks}s of negative cash flow until insolvency. Cut costs or die.`);
    }
    if (s.brokeTicks >= 10) {
      endGame(s, false, "Bankrupt. The megacluster is auctioned to a crypto company. Your researchers' badges stop working mid-swipe.");
      return;
    }
  } else {
    s.brokeTicks = 0;
  }

  // Unserved demand churns to rivals.
  const d = demand(s);
  const served = d > 0 ? inferenceCapacity(s) / d : 1;
  if (totalCompute(s) >= 4 && served < 0.65 && Math.random() < 0.3 && s.share > 1) {
    const a = aliveRivals(s);
    if (a.length > 0) {
      const r = a[Math.floor(Math.random() * a.length)];
      const loss = clamp(0.2 + Math.random() * 0.2, 0, s.share - 0.5);
      s.share -= loss;
      r.share += loss;
      if (s.ticks - s.lastOutageTick > 8) {
        s.lastOutageTick = s.ticks;
        pushLog(s, `Outages. Customers rage-quit to ${r.name}. Serve your demand or lose it.`);
      }
    }
  }

  if (s.heat >= 70 && !s.heatWarned) {
    s.heatWarned = true;
    pushLog(s, "A subpoena arrives. Legal says 'don't panic,' which is worrying.");
  }
  if (s.heat < 60) s.heatWarned = false;
}

/** Runs once per rival tick (every 5 seconds). */
export function tickRivals(s: GameState): void {
  if (s.ended) return;
  const a = aliveRivals(s);
  if (a.length === 0) return;

  // AGI race progress and warnings.
  for (const r of a) {
    r.agi += (0.16 + r.share * 0.018) * r.grow * (s.agiProgress !== null ? 1.25 : 1);
    if (r.agi >= 100) {
      endGame(
        s,
        false,
        `${r.name} achieves AGI first. Their model writes a polite email explaining why your company no longer needs to exist.`,
      );
      return;
    }
    if (r.agi >= 50 && !r.warnedAgi50) {
      r.warnedAgi50 = true;
      pushLog(s, `${r.name} hits 50% AGI progress. Their CEO starts wearing turtlenecks.`);
    }
    if (r.agi >= 80 && !r.warnedAgi80) {
      r.warnedAgi80 = true;
      pushLog(s, `WARNING: ${r.name} at 80% AGI. Sabotage them or outrun them.`);
    }
    if (r.share >= 45 && !r.warnedShare45) {
      r.warnedShare45 = true;
      pushLog(s, `WARNING: ${r.name} at ${r.share.toFixed(0)}% share — at ${MONOPOLY_SHARE}% they own the industry and you LOSE.`);
    }
  }

  // Sabotage attempts against the player's active runs.
  if ((s.training || s.agiProgress !== null) && Math.random() < 0.2) {
    const saboteur = a[Math.floor(Math.random() * a.length)];
    if (s.opsec && Math.random() < 0.75) {
      if (s.ticks - s.lastSabBlockTick > 12) {
        s.lastSabBlockTick = s.ticks;
        pushLog(s, `Opsec intercepts a contractor with a suspicious badge. ${saboteur.name}'s sabotage fails.`);
      }
    } else if (s.agiProgress !== null) {
      s.agiProgress = Math.max(0, s.agiProgress - 5);
      pushLog(s, `${saboteur.name} sabotages your AGI run. Checkpoint corrupted: −5% progress.`);
    } else if (s.training) {
      s.training.done = Math.max(0, s.training.done - 4);
      pushLog(s, `${saboteur.name} sabotages your training run. 4 seconds of progress lost.`);
    }
  }

  // One weighted rival acts.
  const weights = a.map((r) => r.grow * (r.share > 35 ? 1.5 : 1));
  const totalWeight = weights.reduce((x, y) => x + y, 0);
  let pick = Math.random() * totalWeight;
  let actor = a[0];
  for (let i = 0; i < a.length; i++) {
    pick -= weights[i];
    if (pick <= 0) {
      actor = a[i];
      break;
    }
  }

  const pressure = (s.heat >= 70 ? 2 : 1) * (s.agiProgress !== null ? 1.6 : 1);
  const roll = Math.random();

  if (s.agiProgress !== null || (roll < 0.45 && s.share > 1)) {
    const taken = clamp((0.4 + Math.random() * 0.7) * pressure * s.defenseMult, 0, s.share - 0.5);
    if (taken > 0) {
      s.share -= taken;
      actor.share += taken;
      pushLog(
        s,
        s.agiProgress !== null
          ? `${actor.name} strikes while you're mid-run. −${taken.toFixed(1)}% share.`
          : `${actor.name} undercuts your pricing. −${taken.toFixed(1)}% share.`,
      );
    }
  } else if (s.openMarket > 0.5 && roll < 0.75) {
    const grabbed = Math.min((0.5 + Math.random() * 0.8) * actor.grow, s.openMarket);
    s.openMarket -= grabbed;
    actor.share += grabbed;
  } else {
    const victims = a.filter((r) => r !== actor);
    if (victims.length > 0) {
      const victim = victims[Math.floor(Math.random() * victims.length)];
      const taken = Math.min(0.5 + Math.random() * 0.8, victim.share);
      victim.share -= taken;
      actor.share += taken;
    }
  }

  // Small rivals can fold outright.
  for (const r of a) {
    if (r.share > 0.05 && r.share < 3.5 && Math.random() < 0.25) {
      s.openMarket += r.share;
      pushLog(s, `${r.name} runs out of runway and folds. ${r.share.toFixed(1)}% returns to the open market.`);
      r.share = 0;
    }
  }

  const monopolist = s.rivals.find((r) => r.share >= MONOPOLY_SHARE);
  if (monopolist && !s.ended) {
    endGame(
      s,
      false,
      `${monopolist.name} hits ${MONOPOLY_SHARE}% market share and de-facto owns the industry. You're acquired for an amount described as 'symbolic.'`,
    );
  }
}
