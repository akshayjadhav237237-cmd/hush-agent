import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const PATTERNS = [
  { name: 'OpenAI API Key', regex: /sk-[a-zA-Z0-9_-]{20,}/g },
  { name: 'Anthropic API Key', regex: /sk-ant-[a-zA-Z0-9_-]{20,}/g },
  { name: 'Google API Key', regex: /AIza[0-9A-Za-z-_]{35}/g },
  { name: 'AWS Access Key ID', regex: /AKIA[0-9A-Z]{16}/g },
  { name: 'GitHub Token', regex: /gh[pousr]_[0-9a-zA-Z]{36,}/g },
  { name: 'Slack Token', regex: /xox[baprs]-[0-9a-zA-Z]{10,}/g },
  { name: 'Private Key', regex: /-----BEGIN (?:[A-Z0-9_-]+ )?PRIVATE KEY-----/g },
  { name: 'Generic Secret Assignment', regex: /(?:api[_-]?key|secret[_-]?key|auth[_-]?token|access[_-]?token|client[_-]?secret|password)\s*[:=]\s*['"]([^'"]{12,})['"]/gi },
  { name: 'Bearer Token', regex: /Bearer\s+([a-zA-Z0-9_\-\.]{25,})/gi },
  { name: 'JSON Web Token (JWT)', regex: /eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_\-\+.\/]{10,}/g },
];

function scanText(sourceName, text) {
  const matches = [];
  const lines = text.split(/\r?\n/);
  for (let lineNum = 1; lineNum <= lines.length; lineNum++) {
    const line = lines[lineNum - 1];
    for (const pat of PATTERNS) {
      pat.regex.lastIndex = 0;
      let match;
      while ((match = pat.regex.exec(line)) !== null) {
        matches.push({
          source: sourceName,
          line: lineNum,
          type: pat.name,
          match: match[0],
          preview: line.trim()
        });
      }
    }
  }
  return matches;
}

console.log('--- 1. SCANNING GIT REPOSITORY COMMIT HISTORY ---');
const gitLogDiff = execSync('git log -p --all', { maxBuffer: 50 * 1024 * 1024, encoding: 'utf8' });
const gitMatches = scanText('git-history', gitLogDiff);

console.log(`Git history scanned: ${gitLogDiff.length} chars.`);
console.log(`Potential secret findings in git history: ${gitMatches.length}`);
for (const m of gitMatches) {
  console.log(`  [${m.type}] in ${m.source}:${m.line} -> ${m.match.slice(0, 8)}... (preview: ${m.preview.slice(0, 80)})`);
}

console.log('\n--- 2. SCANNING WORKING TREE FILES ---');
function walkDir(dir) {
  let files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.git' || entry.name === 'dist' || entry.name === '.venv' || entry.name === '__pycache__') {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(walkDir(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

const allFiles = walkDir('.');
let workingMatches = [];
for (const f of allFiles) {
  // skip binary files
  if (/\.(png|jpg|jpeg|webp|gif|mp4|webm|woff|woff2|ico|tar|gz|zip)$/i.test(f)) continue;
  try {
    const content = fs.readFileSync(f, 'utf8');
    const fMatches = scanText(f, content);
    workingMatches = workingMatches.concat(fMatches);
  } catch (err) {
    // binary or unreadable
  }
}

console.log(`Total working files scanned: ${allFiles.length}`);
console.log(`Potential secret findings in working files: ${workingMatches.length}`);
for (const m of workingMatches) {
  console.log(`  [${m.type}] in ${m.source}:${m.line} -> ${m.match.slice(0, 8)}... (preview: ${m.preview.slice(0, 80)})`);
}

console.log('\n--- 3. SCANNING STAGED & UNSTAGED DIFFS ---');
const stagedDiff = execSync('git diff --cached', { encoding: 'utf8' });
const unstagedDiff = execSync('git diff', { encoding: 'utf8' });
const diffMatches = scanText('staged-diff', stagedDiff).concat(scanText('unstaged-diff', unstagedDiff));
console.log(`Potential secret findings in diffs: ${diffMatches.length}`);
for (const m of diffMatches) {
  console.log(`  [${m.type}] in ${m.source}:${m.line} -> ${m.match.slice(0, 8)}... (preview: ${m.preview.slice(0, 80)})`);
}

const summary = {
  gitHistoryCount: gitMatches.length,
  workingTreeCount: workingMatches.length,
  diffCount: diffMatches.length,
  gitMatches,
  workingMatches,
  diffMatches
};

fs.writeFileSync('qa/secret_scan_results.json', JSON.stringify(summary, null, 2));
console.log('\nSecret scan complete. Results saved to qa/secret_scan_results.json');
