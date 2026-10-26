import { GITHUB_URL } from '@/data/brand';

export interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

export const COPY_V2 = {
  nav: [
    { label: 'How it works', href: '#how' },
    { label: 'Gates', href: '#gates' },
    { label: 'Replay', href: '#replay' },
    { label: 'FAQ', href: '#faq' },
    { label: 'GitHub', href: GITHUB_URL, external: true },
  ] as NavItem[],
  hero: {
    wordmark: 'HUSH',
    tagline: 'Builds quietly. Speaks only when it must.',
    paragraph:
      'Describe what you want made. Hush runs the hand-offs between Claude, Gemini and Antigravity, orchestrated by Gemma 4.',
    ctaPill: 'Watch a replay',
    ctaPillHref: '#replay',
    textLink: 'View on GitHub',
    textLinkHref: GITHUB_URL,
    cue: 'SCROLL',
  },
  manifesto: {
    eyebrow: '[ HUSH ]',
    headline: {
      part1: 'We are builders of quiet automation, ',
      italic: 'working while you are away.',
      part2:
        ' We hand the copy-paste between AI tools to Gemma 4, so you only step in when it truly matters.',
    },
    paragraph:
      'Over a build, Hush plans with Claude, researches with Gemini Deep Research, builds in Antigravity and maps the result with Graphify, so every round starts from the real code. Each step is written to an audit log you can verify.',
    lineA: 'Desktop automation with a human in the loop only when needed.',
    lineB: 'Built with Gemma 4.',
  },
  bento: {
    title: {
      plain: 'Quiet automation for busy builders.',
    },
    subtitle: 'Orchestrated by Gemma 4. Remembered by Graphify.',
    tile1: {
      caption: 'Plan. Build. Verify.',
    },
  },
  how: {
    eyebrow: '[ HOW IT WORKS ]',
    title: {
      plain: 'From idea to ',
      italic: 'first build.',
    },
    paragraph: 'One rule drives the loop: keep going until it cannot continue without you.',
    nodes: [
      { id: 'plan', label: 'step/plan' },
      { id: 'research', label: 'step/research' },
      { id: 'build', label: 'step/build' },
    ],
    phases: [
      {
        phase: 'PHASE 01',
        step: 'Step 1',
        title: 'Plan with Claude',
        description: 'Gemma 4 opens Claude, pastes your idea and collects a research prompt.',
      },
      {
        phase: 'PHASE 02',
        step: 'Step 2',
        title: 'Research with Gemini',
        description:
          'Deep Research runs. Gemma 4 waits, copies the report and returns it to Claude for build prompts.',
      },
      {
        phase: 'PHASE 03',
        step: 'Repeat',
        title: 'Build, map, repeat',
        description:
          'Antigravity builds a round, Graphify refreshes the code graph and Claude writes the next prompt from it.',
      },
    ],
  },
  gates: {
    eyebrow: '[ ATTENTION GATES ]',
    title: {
      plain: 'Silent until it ',
      italic: 'must',
      after: ' speak.',
    },
    paragraph:
      'Six policy gates decide when Hush stops. Some are enforced in code, others are judged by the model, and each card says which.',
  },
  compare: {
    eyebrow: '[ SYSTEM COMPARATIVES ]',
    title: {
      plain: 'Why Hush is ',
      italic: 'Different.',
    },
    paragraph: 'Compare Hush with a hand-driven AI workflow.',
    fileHeader: 'hush.workflow.diff',
    groups: [
      {
        label: '01 // HAND-OFFS',
        del: 'You copy prompts between tools. Wait. Paste. Check. Repeat.',
        add: 'Gemma 4 moves each output to the right tool and checks the screen.',
      },
      {
        label: '02 // INTERRUPTIONS',
        del: 'Watching a screen that mostly waits, in case something needs you.',
        add: 'Silent until a login, captcha, missing key or unclear requirement. Then a phone push.',
      },
      {
        label: '03 // CONTEXT',
        del: 'Each tool only sees what you paste.',
        add: 'Graphify maps the code after every round, so the next prompt uses real structure.',
      },
      {
        label: '04 // TRUST',
        del: 'No record of what an agent did.',
        add: 'Every step goes to a hash-chained audit log you can verify.',
      },
    ],
  },
  replay: {
    eyebrow: '[ REPLAY ]',
    title: {
      plain: 'Watch a ',
      italic: 'recorded run.',
    },
  },
  faq: {
    eyebrow: '[ FAQ ]',
    title: {
      plain: 'Questions & ',
      italic: 'Guidelines.',
    },
  },
  footer: {
    wordmark: 'HUSH',
    tagline: 'Builds quietly. Speaks only when it must.',
    quickLinks: [
      { label: 'How it works', href: '#how' },
      { label: 'Gates', href: '#gates' },
      { label: 'Replay', href: '#replay' },
      { label: 'FAQ', href: '#faq' },
    ],
    projectLinks: [
      { label: 'GitHub repository', href: GITHUB_URL, external: true },
      { label: 'Graphify', href: 'https://graphify.com', external: true },
      { label: 'Gemma 4 documentation', href: 'https://ai.google.dev', external: true },
    ],
    attribution:
      'Graphify is a separate open-source project by Graphify Labs, used under its Apache 2.0 license.',
    license: 'Hush is MIT licensed. Gemma 4 is released by Google under the Apache 2.0 license.',
  },
} as const;
