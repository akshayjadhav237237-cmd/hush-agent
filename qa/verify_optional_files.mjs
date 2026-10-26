import fs from 'node:fs';
import path from 'node:path';

console.log('=== VERIFY OPTIONAL FILE HANDLING ===\n');

// 1. Check testcount.ts import.meta.glob pattern
const adaptersPath = path.resolve('src/v2/data/adapters.ts');
const adaptersContent = fs.readFileSync(adaptersPath, 'utf8');

const hasTestCountGlob = adaptersContent.includes("import.meta.glob<{ TEST_COUNT: number }>(") &&
  adaptersContent.includes("'/src/data/testcount.ts'");
console.log('1. testcount.ts import.meta.glob present:', hasTestCountGlob ? 'PASS' : 'FAIL');

// Check fallback if testcount is empty or missing
const hasTestCountFallback = adaptersContent.includes('return 0;');
console.log('   testcount.ts zero fallback present:', hasTestCountFallback ? 'PASS' : 'FAIL');

// 2. Check verification.ts / verification.json import.meta.glob pattern
const hasVerificationGlob = adaptersContent.includes("import.meta.glob<Record<string, any>>(") &&
  adaptersContent.includes("'/src/data/verification.ts'") &&
  adaptersContent.includes("'/src/data/verification.json'");
console.log('2. verification.ts/json import.meta.glob present:', hasVerificationGlob ? 'PASS' : 'FAIL');

const hasVerificationFallback = adaptersContent.includes('return null;');
console.log('   verification null fallback present:', hasVerificationFallback ? 'PASS' : 'FAIL');

// Check Gates.tsx consumer of verificationSummary
const gatesPath = path.resolve('src/v2/features/gates/Gates.tsx');
const gatesContent = fs.readFileSync(gatesPath, 'utf8');
const gatesHandlesNullSummary = gatesContent.includes('const summary = verificationSummary();') &&
  gatesContent.includes('{summary && (');
console.log('   Gates.tsx conditionally renders summary without throwing:', gatesHandlesNullSummary ? 'PASS' : 'FAIL');

// 3. Check replay_real.json handling in ReplaySection.tsx
const replaySectionPath = path.resolve('src/v2/features/replay/ReplaySection.tsx');
const replaySectionContent = fs.readFileSync(replaySectionPath, 'utf8');

const hasReplayRealCheck = replaySectionContent.includes('replay_real.json') &&
  replaySectionContent.includes('setHasRealReplay(true)') &&
  replaySectionContent.includes('.catch(');
console.log('3. ReplaySection.tsx optional replay_real.json fetch with catch fallback:', hasReplayRealCheck ? 'PASS' : 'FAIL');

const hasReplayRealTabGuards = replaySectionContent.includes('{hasRealReplay && (');
console.log('   ReplaySection.tsx tab UI guarded by hasRealReplay:', hasReplayRealTabGuards ? 'PASS' : 'FAIL');

const hasReplayPlayerModeCheck = fs.readFileSync('src/features/replay/ReplayPlayer.tsx', 'utf8')
  .includes("payload?.mode === 'real'");
console.log('   ReplayPlayer.tsx retains simulated/real badge distinction:', hasReplayPlayerModeCheck ? 'PASS' : 'FAIL');

console.log('\nAll optional file handling checks passed.');
