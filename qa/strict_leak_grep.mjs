import fs from 'node:fs';
import path from 'node:path';

const LEAK_WORDS = [
  'Prakriti',
  'carbon',
  'India',
  'Gemini Vision',
  '100%',
  'coverage',
  'YNAB',
  'CEA',
  'Diwali',
];

function checkPath(targetPath) {
  let findings = [];
  const stat = fs.statSync(targetPath);
  if (stat.isDirectory()) {
    for (const item of fs.readdirSync(targetPath)) {
      if (item === 'node_modules' || item === '.git' || item === 'dist') continue;
      findings = findings.concat(checkPath(path.join(targetPath, item)));
    }
  } else if (/\.(ts|tsx|js|mjs|jsx|json|html|css|md)$/.test(targetPath)) {
    // Skip this script and honesty_grep.mjs itself where the word list is defined
    if (targetPath.endsWith('strict_leak_grep.mjs') || targetPath.endsWith('honesty_grep.mjs')) {
      return findings;
    }
    const content = fs.readFileSync(targetPath, 'utf8');
    for (const word of LEAK_WORDS) {
      // Escape for regex if needed (like 100%)
      const escaped = word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`\\b${escaped}\\b`, 'i');
      // For 100%, \b won't match after %
      const generalRegex = new RegExp(escaped, 'i');
      if (generalRegex.test(content)) {
        const lines = content.split('\n');
        lines.forEach((l, idx) => {
          if (generalRegex.test(l)) {
            findings.push({
              file: path.relative('.', targetPath),
              line: idx + 1,
              word,
              snippet: l.trim(),
            });
          }
        });
      }
    }
  }
  return findings;
}

const targets = ['src/v2', 'src/data', 'v2.html', 'docs'];
console.log('--- STRICT REFERENCE-LEAK GREP ---');
let totalLeaks = 0;
for (const t of targets) {
  if (!fs.existsSync(t)) continue;
  const leaks = checkPath(path.resolve(t));
  console.log(`\nChecking: ${t} (${leaks.length} leaks found)`);
  if (leaks.length > 0) {
    totalLeaks += leaks.length;
    for (const leak of leaks) {
      console.log(`  [DEFECT] ${leak.file}:${leak.line} - Matched "${leak.word}": ${leak.snippet}`);
    }
  } else {
    console.log(`  PASS: 0 leaks in ${t}`);
  }
}

console.log(`\nTOTAL LEAKS FOUND: ${totalLeaks}`);
