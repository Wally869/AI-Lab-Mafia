import type { BuildingDef, GenSpec, OpKey, Tier, TrainSpec } from './types';

export const TIERS: Tier[] = [
  { min: 0,   name: 'Garage nobody',  cash: 150,   influence: 0,  researchers: 0, lobbyists: 0, datacenters: 0, gen: 1, incomeMult: 1,    researchMult: 1,    defenseMult: 1 },
  { min: 25,  name: 'Angel-backed',   cash: 2000,  influence: 8,  researchers: 2, lobbyists: 0, datacenters: 0, gen: 1, incomeMult: 1.1,  researchMult: 1.1,  defenseMult: 1 },
  { min: 70,  name: 'VC darling',     cash: 8000,  influence: 25, researchers: 3, lobbyists: 1, datacenters: 1, gen: 1, incomeMult: 1.25, researchMult: 1.25, defenseMult: 1 },
  { min: 140, name: 'Unicorn',        cash: 16000, influence: 45, researchers: 4, lobbyists: 1, datacenters: 1, gen: 1, incomeMult: 1.35, researchMult: 1.35, defenseMult: 0.75 },
  { min: 240, name: 'Serial founder', cash: 22000, influence: 60, researchers: 4, lobbyists: 2, datacenters: 1, gen: 2, incomeMult: 1.5,  researchMult: 1.5,  defenseMult: 0.5 },
];

/** Global multiplier on income and research per founder point. */
export const POINTS_MULT_DIVISOR = 200;
/** Ceiling on the global founder-point multiplier. */
export const POINTS_MULT_CAP = 3;

export const GENS: GenSpec[] = [
  { demand: 12,  price: 1.5 },
  { demand: 45,  price: 2.4 },
  { demand: 160, price: 3.6 },
  { demand: 520, price: 5 },
];

/** TRAIN_RUNS[g] is the cost to train gen g+1 (index 0 unused). */
export const TRAIN_RUNS: (TrainSpec | null)[] = [
  null,
  { research: 150,  cash: 2500,  seconds: 20, lock: 0.3 },
  { research: 700,  cash: 15000, seconds: 30, lock: 0.4 },
  { research: 2400, cash: 70000, seconds: 40, lock: 0.5 },
];

export const AGI_RUN = { research: 6000, cash: 150000, seconds: 75, lock: 0.7, heatPerSecond: 0.6 };

export const BUILDINGS: BuildingDef[] = [
  { id: 'rack',    name: 'GPU rack',        blurb: '+1 PFLOP · $0.4/s opex',                      baseCost: 60,    growth: 1.16, effect: 'ground',     amount: 1 },
  { id: 'dc',      name: 'Datacenter',      blurb: '+8 PFLOPs · $3.2/s opex',                     baseCost: 900,   growth: 1.16, effect: 'ground',     amount: 8 },
  { id: 'mega',    name: 'Megacluster',     blurb: '+50 PFLOPs · $20/s opex',                     baseCost: 12000, growth: 1.16, effect: 'ground',     amount: 50 },
  { id: 'orbital', name: 'Orbital GPU farm', blurb: '+300 PFLOPs · $24/s opex · 15% launch failure', baseCost: 90000, growth: 1.3,  effect: 'orbital',    amount: 300, minGen: 3, failChance: 0.15 },
  { id: 'rsr',     name: 'Researcher',      blurb: '+1 research/s · $1.5/s salary',               baseCost: 300,   growth: 1.22, effect: 'researcher', amount: 1 },
  { id: 'lob',     name: 'Lobbyist',        blurb: '+0.4 influence/s · $2/s salary',              baseCost: 500,   growth: 1.22, effect: 'lobbyist',   amount: 1 },
];

export const OP_INFLUENCE_COSTS: Record<Exclude<OpKey, 'pr'>, number> = {
  poach: 18,
  spy: 35,
  smear: 30,
  sab: 45,
  bribe: 25,
  acq: 30,
};

export const OP_COOLDOWNS: Record<OpKey, number> = {
  pr: 6,
  poach: 12,
  spy: 20,
  smear: 18,
  sab: 15,
  bribe: 12,
  acq: 20,
};

export const STRUCTURAL = {
  opsec:   { influence: 50,  cash: 5000, label: 'Opsec team' },
  capture: { influence: 150, minGen: 2,  label: 'Regulatory capture' },
  cartel:  { influence: 120, minShare: 20, label: 'Chip cartel' },
};

export const ECON = {
  groundOpexPerPflop: 0.4,
  orbitalOpexPerPflop: 0.08,
  researcherSalary: 1.5,
  lobbyistSalary: 2,
  lobbyistInfluence: 0.4,
  trainingResearchPerPflop: 0.15,
  shareDemandBonus: 0.08,
  clickCash: 3,
  /** Heat thresholds and their penalties. */
  heatOpexThreshold: 40,
  heatOpexPenalty: 1.25,
  heatRevenueThreshold: 70,
  heatRevenuePenalty: 0.75,
  /** Passive heat per second per share-point above this. */
  scrutinyShareFloor: 30,
  scrutinyHeatPerPoint: 0.01,
  /** Pricing slider: revenue multiplier at full-cheap (0) and full-costly (100). */
  pricingRevenueMin: 0.65,
  pricingRevenueMax: 1.35,
  /** Max share drift %/s at full-cheap (needs serve floor) and full-costly. */
  pricingCheapDriftMax: 0.05,
  pricingCostlyDriftMax: 0.03,
  /** Cheap pricing only grows share while serving at least this fraction of demand. */
  pricingServeFloor: 0.95,
  /** Fraction of each lab's share that churns back to the open market per second. */
  openMarketChurn: 0.0008,
  /** Marketing blitz efficiency when drawing the shortfall from rivals. */
  blitzRivalEfficiency: 0.5,
  /** Rivals start attacking the player at this share, at full pressure rampShare later. */
  attackShareFloor: 8,
  attackShareRamp: 7,
  /** Retaliation never exceeds max(floor, fraction × share the op took). */
  retaliationCapFraction: 0.75,
  retaliationCapFloorPct: 0.5,
  /** Acquisitions: share gate, cost floor (in share points), and passive heat per buy. */
  acqShareGate: 10,
  acqCostShareFloor: 8,
  acqHeatPerSecond: 0.05,
};

export const RIVAL_DEFS = [
  { name: 'OpenMind',       color: '#9D8DF7', trait: 'vindictive', grow: 1.3, retaliation: 0.55, defense: 1 },
  { name: 'DeepFathom',     color: '#3FBF92', trait: 'fortified',  grow: 0.9, retaliation: 0.15, defense: 0.5 },
  { name: 'Cerebrum',       color: '#E8744A', trait: 'volatile',   grow: 1.1, retaliation: 0.3,  defense: 1 },
  { name: 'Mistral Valley', color: '#5CA5F2', trait: 'scrappy',    grow: 1.7, retaliation: 0.1,  defense: 1.4 },
] as const;

export const RIVAL_START_SHARES = [30, 22, 18, 12];
export const PLAYER_START_SHARE = 2;
export const OPEN_MARKET_START = 16;

/** Any lab (including rivals) reaching this share ends the game. */
export const MONOPOLY_SHARE = 60;

export const SHARE_MILESTONES = [10, 20, 30, 40, 50];
export const MILESTONE_INFLUENCE = 15;

/** Seconds before an event auto-resolves to its last option. */
export const EVENT_SECONDS = 18;

export const TICK_MS = 1000;
export const RIVAL_TICK_MS = 5000;
export const EVENT_TICK_MS = 16000;
