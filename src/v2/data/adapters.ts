import { ATTENTION_GATES } from '@/data/gates';
import { FAQ_ITEMS } from '@/data/faq';
import { EXTRA_FAQ_ITEMS } from './extraFaq';
import { GRAPH_STALL_VERIFIED } from '@/data/brand';
import type { Gate, FaqItem } from '@/data/types';

// Safely load optional test count
const testCountModules = import.meta.glob<{ TEST_COUNT: number }>(
  '/src/data/testcount.ts',
  { eager: true }
);

function getTestCount(): number {
  for (const path in testCountModules) {
    const mod = testCountModules[path];
    if (mod && typeof mod.TEST_COUNT === 'number') {
      return mod.TEST_COUNT;
    }
  }
  return 0;
}

// Safely load optional verification data
const verificationModules = import.meta.glob<Record<string, any>>(
  ['/src/data/verification.ts', '/src/data/verification.json'],
  { eager: true }
);

export function verificationSummary(): string | null {
  for (const path in verificationModules) {
    const mod = verificationModules[path];
    if (mod) {
      if (typeof mod.summary === 'string') return mod.summary;
      if (typeof mod.verifiedCount === 'number' && typeof mod.totalCount === 'number') {
        return `${mod.verifiedCount} of ${mod.totalCount} safety checks verified on a real desktop`;
      }
    }
  }
  return null;
}

export interface StatItem {
  id: string;
  value: number;
  label: string;
  suffix?: string;
}

export function stats(): StatItem[] {
  const engines = ['Claude', 'Gemini Deep Research', 'Antigravity', 'Graphify'];
  return [
    {
      id: 'tests',
      value: getTestCount(),
      label: 'UNIT TESTS PASSING',
    },
    {
      id: 'gates',
      value: ATTENTION_GATES.length,
      label: 'POLICY GATES',
    },
    {
      id: 'engines',
      value: engines.length,
      label: 'ENGINES COORDINATED',
    },
  ];
}

export function gatesList(): Gate[] {
  return ATTENTION_GATES;
}

export function faqList(): FaqItem[] {
  return [...FAQ_ITEMS, ...EXTRA_FAQ_ITEMS];
}

export interface BentoCardData {
  number: string;
  title: string;
  iconName: 'bot' | 'shield' | 'network';
  items: string[];
  learnMoreHref: string;
}

export function bentoCards(): BentoCardData[] {
  const card3Items = [
    'Builds a code graph after each round',
    'Real symbols and paths go back to Claude',
    "Code parsing stays local, per Graphify's docs",
  ];

  if (GRAPH_STALL_VERIFIED) {
    card3Items.push('Alerts you when the graph stops changing');
  }

  return [
    {
      number: '01',
      title: 'Gemma 4 Orchestration.',
      iconName: 'bot',
      items: [
        'Function calling opens apps, pastes prompts and copies results',
        'Screenshot vision checks what is on screen',
        'Runs on Gemma 4 through the Gemini API',
        'Every tool call is written to the audit log',
      ],
      learnMoreHref: '#how',
    },
    {
      number: '02',
      title: 'Attention Gates.',
      iconName: 'shield',
      items: [
        'Pauses for logins, captchas, missing keys and unclear requirements',
        'Command allowlist with workspace-only commands',
        'Step cap and mouse-corner abort',
        'Phone push when you are needed',
      ],
      learnMoreHref: '#gates',
    },
    {
      number: '03',
      title: 'Graphify Code Memory.',
      iconName: 'network',
      items: card3Items,
      learnMoreHref: '#how',
    },
  ];
}
