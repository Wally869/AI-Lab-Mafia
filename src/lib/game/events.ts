import { addHeat, pushLog } from './effects';
import { fmt, revenue } from './helpers';
import type { GameState } from './types';

export interface EventOption {
  label: string;
  apply: (s: GameState) => void;
}

export interface GameEvent {
  title: string;
  /** Last option is the default used when the timer runs out. */
  options: EventOption[];
}

export const EVENTS: GameEvent[] = [
  {
    title: "A journalist has your internal 'crush them' memo.",
    options: [
      {
        label: 'Pay them off (15 inf)',
        apply(s) {
          if (s.influence < 15) {
            addHeat(s, 12);
            pushLog(s, "Couldn't afford the payoff. The memo prints. +12 heat.");
            return;
          }
          s.influence -= 15;
          if (Math.random() < 0.3) {
            addHeat(s, 10);
            pushLog(s, 'They took the money AND ran the story. +10 heat.');
          } else {
            pushLog(s, 'The story dies quietly. Journalism is expensive.');
          }
        },
      },
      {
        label: 'Let it print (+12 heat)',
        apply(s) {
          addHeat(s, 12);
          pushLog(s, "'AI LAB PLOTS MARKET DOMINATION.' Your mother calls, concerned.");
        },
      },
    ],
  },
  {
    title: 'Global GPU shortage incoming.',
    options: [
      {
        label: 'Prepay supplier',
        apply(s) {
          const cost = 800 + revenue(s) * 12;
          if (s.cash < cost) {
            s.shortageT = 15;
            pushLog(s, "Couldn't afford the prepayment. Compute −30% for 15s.");
            return;
          }
          s.cash -= cost;
          pushLog(s, `Paid $${fmt(cost)} to jump the queue. Shortage? What shortage?`);
        },
      },
      {
        label: 'Ride it out (−30% compute, 15s)',
        apply(s) {
          s.shortageT = 15;
          pushLog(s, 'The GPUs will be back. Probably.');
        },
      },
    ],
  },
  {
    title: 'A dying startup offers you their team.',
    options: [
      {
        label: 'Acqui-hire ($1,800)',
        apply(s) {
          if (s.cash < 1800) {
            pushLog(s, "Couldn't afford the acqui-hire. They join a rival. Awkward.");
            return;
          }
          s.cash -= 1800;
          s.researchers += 2;
          pushLog(s, 'Two researchers join, grateful and slightly traumatized.');
        },
      },
      {
        label: 'Pass',
        apply(s) {
          pushLog(s, 'They post a bitter thread about it. Nobody reads it.');
        },
      },
    ],
  },
  {
    title: 'A rival is courting your research lead.',
    options: [
      {
        label: 'Counter-offer ($1,200)',
        apply(s) {
          if (s.cash < 1200) {
            s.brainDrainT = 20;
            pushLog(s, "Couldn't match the offer. Research halved for 20s while the team sulks.");
            return;
          }
          s.cash -= 1200;
          pushLog(s, 'Retention bonus paid. Loyalty restored, price noted.');
        },
      },
      {
        label: 'Let them go (research −50%, 20s)',
        apply(s) {
          s.brainDrainT = 20;
          pushLog(s, 'They leave. The team spends 20s updating LinkedIn instead of working.');
        },
      },
    ],
  },
  {
    title: 'Activists protest outside your datacenter.',
    options: [
      {
        label: 'Fund a safety institute ($2,500)',
        apply(s) {
          if (s.cash < 2500) {
            addHeat(s, 8);
            pushLog(s, "Couldn't afford the optics. Footage goes viral. +8 heat.");
            return;
          }
          s.cash -= 2500;
          addHeat(s, -10);
          s.influence += 5;
          pushLog(s, 'The institute publishes reassuring reports. −10 heat.');
        },
      },
      {
        label: 'Ignore them (+8 heat)',
        apply(s) {
          addHeat(s, 8);
          pushLog(s, 'Drone footage of your cooling towers trends for a day.');
        },
      },
    ],
  },
];
