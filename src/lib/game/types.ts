/** Keys for timed dirty operations. */
export type OpKey = 'pr' | 'poach' | 'spy' | 'smear' | 'sab' | 'bribe' | 'acq';

/** One-time structural purchases. */
export type StructuralKey = 'opsec' | 'capture' | 'cartel';

export interface Rival {
  name: string;
  color: string;
  trait: string;
  /** Growth multiplier for market grabs and AGI progress. */
  grow: number;
  /** Chance [0,1] to strike back when attacked. */
  retaliation: number;
  /** Damage divisor when attacked: >1 is tanky, <1 is soft. */
  defense: number;
  share: number;
  agi: number;
  warnedAgi50: boolean;
  warnedAgi80: boolean;
  warnedShare45: boolean;
}

export interface TrainingRun {
  /** Total duration in seconds. */
  total: number;
  /** Seconds completed. */
  done: number;
  /** Fraction of compute locked while running. */
  lock: number;
}

export interface ActiveEvent {
  /** Index into the EVENTS table. */
  index: number;
  /** Seconds until the default (last) option auto-resolves. */
  secondsLeft: number;
}

export interface LogEntry {
  id: number;
  text: string;
}

/** How a run ended. Everything except 'loss' counts as a win. */
export type OutcomeKind = 'agi' | 'consolidation' | 'sale' | 'loss';

export interface Outcome {
  won: boolean;
  kind: OutcomeKind;
  text: string;
  /** Founder points earned by this run's ending. */
  gained: number;
  /** Whether the controller has already applied the points. */
  settled: boolean;
}

export interface Building {
  cost: number;
  count: number;
}

export interface GameState {
  // Currencies
  cash: number;
  research: number;
  influence: number;
  heat: number;

  // Market
  share: number;
  openMarket: number;

  // Capacity & staff
  groundCompute: number;
  orbitalCompute: number;
  researchers: number;
  lobbyists: number;

  // Model
  gen: number;
  training: TrainingRun | null;
  /** AGI run progress [0,100], or null when not running. */
  agiProgress: number | null;

  // Player choices
  /** Percent of effective compute allocated to inference [0,100]. */
  alloc: number;
  /** Pricing position [0,100]: 0 = cheap (grow share), 100 = costly (max margin). */
  pricing: number;
  targetIdx: number;

  // Multipliers & flags
  incomeMult: number;
  researchMult: number;
  /** Multiplier on damage rivals deal to the player. */
  defenseMult: number;
  heatGainMult: number;
  opexMult: number;
  hardwareMult: number;
  computeMult: number;
  opsec: boolean;

  // Escalating costs
  scienceCosts: [number, number];
  prUses: number;
  /** Rivals absorbed this run; drives the antitrust premium and passive heat. */
  acquisitions: number;

  // Timers & counters (in whole seconds / ticks)
  shortageT: number;
  brainDrainT: number;
  brokeTicks: number;
  ticks: number;
  lastOutageTick: number;
  lastSabBlockTick: number;
  heatWarned: boolean;
  milestones: Record<number, boolean>;
  /** Highest heat reached this run (for the shareable result card). */
  peakHeat: number;
  /** Run number and starting tier, frozen at creation for the result card. */
  runNumber: number;
  tierName: string;

  buildings: Building[];
  cooldowns: Record<OpKey, number>;
  rivals: Rival[];

  event: ActiveEvent | null;
  log: LogEntry[];

  ended: boolean;
  outcome: Outcome | null;
}

export interface FounderMeta {
  points: number;
  runs: number;
  /** Player-chosen lab name; empty until onboarding completes. */
  labName: string;
}

export interface Tier {
  min: number;
  name: string;
  cash: number;
  influence: number;
  researchers: number;
  lobbyists: number;
  datacenters: number;
  gen: number;
  incomeMult: number;
  researchMult: number;
  defenseMult: number;
}

export interface GenSpec {
  /** Base inference demand in PFLOPs. */
  demand: number;
  /** Revenue per served PFLOP per second. */
  price: number;
}

export interface TrainSpec {
  research: number;
  cash: number;
  seconds: number;
  lock: number;
}

export interface BuildingDef {
  id: string;
  name: string;
  blurb: string;
  baseCost: number;
  growth: number;
  /** Which counter the purchase increments. */
  effect: 'ground' | 'orbital' | 'researcher' | 'lobbyist';
  amount: number;
  /** Minimum model gen required to buy. */
  minGen?: number;
  /** Chance the purchase is lost to a launch failure. */
  failChance?: number;
}
