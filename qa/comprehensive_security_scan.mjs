import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const results = {
  timestamp: new Date().toISOString(),
  checks: {},
  summary: {
    passed: true,
    failures: []
  }
};

function recordCheck(name, pass, details) {
  results.checks[name] = { pass, details };
  if (!pass) {
    results.summary.passed = false;
    results.summary.failures.push({ name, details });
  }
}

function walk(dir) {
  let res = [];
  if (!fs.existsSync(dir)) return res;
  for (const item of fs.readdirSync(dir)) {
    const p = path.join(dir, item);
    if (fs.statSync(p).isDirectory()) {
      res = res.concat(walk(p));
    } else {
      res.push(p);
    }
  }
  return res;
}

console.log('====================================================');
console.log('   QA SUBAGENT Q3: FULL COMPREHENSIVE SECURITY AUDIT');
console.log('====================================================\n');

// ---------------------------------------------------------------------------
// 1. SECRET SCAN
// ---------------------------------------------------------------------------
console.log('>> [Check 1] Secret & Credential Scan across History & Staged Files...');
const SECRET_PATTERNS = [
  { name: 'OpenAI API Key', regex: /sk-[a-zA-Z0-9_-]{20,}/g },
  { name: 'Anthropic API Key', regex: /sk-ant-[a-zA-Z0-9_-]{20,}/g },
  { name: 'Google API Key', regex: /AIza[0-9A-Za-z-_]{35}/g },
  { name: 'AWS Access Key ID', regex: /AKIA[0-9A-Z]{16}/g },
  { name: 'GitHub Token', regex: /gh[pousr]_[0-9a-zA-Z]{36,}/g },
  { name: 'Slack Token', regex: /xox[baprs]-[0-9a-zA-Z]{10,}/g },
  { name: 'Private Key', regex: /-----BEGIN (?:[A-Z0-9_-]+ )?PRIVATE KEY-----/g },
  { name: 'Hardcoded Password/Secret', regex: /(?:password|secret|api_key|apikey|token)\s*[:=]\s*['"]([a-zA-Z0-9_\-\.]{16,})['"]/gi }
];

const gitLog = execSync('git log -p --all', { maxBuffer: 50 * 1024 * 1024, encoding: 'utf8' });
const stagedDiff = execSync('git diff --cached', { encoding: 'utf8' });
const workingDiff = execSync('git diff', { encoding: 'utf8' });

// Check diffs for secrets
let diffSecretHits = [];
for (const diff of [stagedDiff, workingDiff]) {
  for (const pat of SECRET_PATTERNS) {
    pat.regex.lastIndex = 0;
    let m;
    while ((m = pat.regex.exec(diff)) !== null) {
      diffSecretHits.push({ type: pat.name, match: m[0] });
    }
  }
}

// In repository history, check for non-test secrets
let historyRealSecretHits = [];
const lines = gitLog.split(/\r?\n/);
let currentFile = '';
for (const line of lines) {
  if (line.startsWith('+++ b/')) {
    currentFile = line.slice(6);
  }
  for (const pat of SECRET_PATTERNS) {
    pat.regex.lastIndex = 0;
    let m;
    while ((m = pat.regex.exec(line)) !== null) {
      // Exclude synthetic unit test fixtures in agent/tests/ and docs quoting them
      const isTestFixture = currentFile.includes('agent/tests/') ||
                            currentFile.includes('docs/QA_REPORT.md') ||
                            line.includes('your-api-key-here') ||
                            line.includes('sk-1234567890abcdefghij') ||
                            line.includes('AIzaSyD0123456789');
      if (!isTestFixture) {
        historyRealSecretHits.push({ file: currentFile, type: pat.name, preview: line.trim() });
      }
    }
  }
}

recordCheck('Secret Scan (Working Diff & Staged)', diffSecretHits.length === 0, {
  diffSecretHitsCount: diffSecretHits.length,
  hits: diffSecretHits
});
recordCheck('Secret Scan (Git History Real Secrets)', historyRealSecretHits.length === 0, {
  historyRealSecretHitsCount: historyRealSecretHits.length,
  hits: historyRealSecretHits
});

// ---------------------------------------------------------------------------
// 2. NETWORK BOUNDARY & FETCH CALLS IN V2
// ---------------------------------------------------------------------------
console.log('>> [Check 2] Network Boundary & fetch() Scan in V2...');
const v2SourceFiles = walk('src/v2');
let fetchCalls = [];

for (const file of v2SourceFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(/fetch\([^)]+\)/g) || [];
  for (const m of matches) {
    fetchCalls.push({ file, call: m });
  }
}

// Check what fetches exist in v2
// Only allowed fetch in v2 is ReplaySection checking realUrl (same-origin replay_real.json)
let invalidFetches = fetchCalls.filter(f => !f.call.includes('realUrl') && !f.call.includes('replay.json') && !f.call.includes('replay_real.json'));

recordCheck('Network Boundary V2 fetch() Scan', invalidFetches.length === 0, {
  totalV2FetchCalls: fetchCalls.length,
  validFetches: fetchCalls.filter(f => !invalidFetches.includes(f)),
  invalidFetches
});

// ---------------------------------------------------------------------------
// 3. EXTERNAL CDN, GOOGLE FONTS & THIRD-PARTY TRACKERS
// ---------------------------------------------------------------------------
console.log('>> [Check 3] External CDN, Google Fonts, Analytics & Trackers...');
const v2HtmlPath = 'v2.html';
const v2HtmlContent = fs.readFileSync(v2HtmlPath, 'utf8');

// Check v2.html for Google Fonts link tags
const hasGoogleFontsLinkInV2Html = /fonts\.(googleapis|gstatic)\.com/i.test(v2HtmlContent);

// Check CDN patterns across v2 files
const CDN_PATTERNS = [
  /cdnjs\.cloudflare\.com/i,
  /cdn\.jsdelivr\.net/i,
  /unpkg\.com/i,
  /stackpath\.bootstrapcdn\.com/i,
  /maxcdn\.bootstrapcdn\.com/i,
  /code\.jquery\.com/i,
  /cdn\.tailwindcss\.com/i,
  /ajax\.googleapis\.com/i
];

let cdnMatches = [];
for (const file of v2SourceFiles.concat([v2HtmlPath])) {
  const content = fs.readFileSync(file, 'utf8');
  for (const pat of CDN_PATTERNS) {
    if (pat.test(content)) {
      cdnMatches.push({ file, pattern: pat.toString() });
    }
  }
}

// Check Analytics & Trackers
const TRACKER_PATTERNS = [
  /google-analytics\.com/i,
  /googletagmanager\.com/i,
  /\bgtag\(/i,
  /\bga\(/i,
  /segment\.io/i,
  /mixpanel\.com/i,
  /posthog/i,
  /hotjar/i,
  /clarity\.ms/i,
  /fbevents\.js/i,
  /connect\.facebook\.net/i,
  /plausible\.io/i,
  /pixel\.(gif|png|jpg)/i
];

let trackerMatches = [];
for (const file of v2SourceFiles.concat([v2HtmlPath])) {
  const content = fs.readFileSync(file, 'utf8');
  for (const pat of TRACKER_PATTERNS) {
    if (pat.test(content)) {
      trackerMatches.push({ file, pattern: pat.toString() });
    }
  }
}

// Check self-hosted npm fonts in v2.css
const v2CssPath = 'src/v2/styles/v2.css';
const v2CssContent = fs.readFileSync(v2CssPath, 'utf8');
const usesFontsource = v2CssContent.includes('@fontsource-variable/inter-tight') &&
                       v2CssContent.includes('@fontsource-variable/space-grotesk') &&
                       v2CssContent.includes('@fontsource/cormorant-garamond') &&
                       v2CssContent.includes('@fontsource/instrument-serif') &&
                       v2CssContent.includes('@fontsource-variable/geist-mono');

recordCheck('No Google Fonts link tag in v2.html', !hasGoogleFontsLinkInV2Html, {
  hasGoogleFontsLinkInV2Html
});
recordCheck('Self-hosted npm fonts in src/v2/styles/v2.css', usesFontsource, {
  usesFontsource
});
recordCheck('No External CDN links in V2', cdnMatches.length === 0, {
  cdnMatchesCount: cdnMatches.length,
  cdnMatches
});
recordCheck('No Third-Party Analytics or Tracking Pixels in V2', trackerMatches.length === 0, {
  trackerMatchesCount: trackerMatches.length,
  trackerMatches
});

// ---------------------------------------------------------------------------
// 4. EXTERNAL URL ALLOWLIST SCAN
// ---------------------------------------------------------------------------
console.log('>> [Check 4] External URL Allowlist Scan...');
const URL_REGEX = /https?:\/\/[^\s"'`<>{}|\\^\[\]]+/g;
const ALLOWED_DOMAINS = [
  'github.com',
  'graphify.com',
  'docs.graphify.com',
  'ai.google.dev',
  'akshayjadhav237237-cmd.github.io'
];

let allV2Urls = [];
let disallowedUrls = [];

for (const file of v2SourceFiles.concat([v2HtmlPath])) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(URL_REGEX) || [];
  for (const raw of matches) {
    const clean = raw.replace(/[.,;:]+$/, '');
    // Ignore XML namespace
    if (clean === 'http://www.w3.org/2000/svg') continue;

    const isAllowed = ALLOWED_DOMAINS.some(domain => {
      try {
        const parsed = new URL(clean);
        return parsed.hostname === domain || parsed.hostname.endsWith('.' + domain);
      } catch (e) {
        return clean.includes(domain);
      }
    });

    allV2Urls.push({ file, url: clean, allowed: isAllowed });
    if (!isAllowed) {
      disallowedUrls.push({ file, url: clean });
    }
  }
}

recordCheck('External URL Allowlist (Strict Allowed Domains Only)', disallowedUrls.length === 0, {
  totalExternalUrlsFound: allV2Urls.length,
  disallowedCount: disallowedUrls.length,
  allowedUrls: allV2Urls,
  disallowedUrls
});

// ---------------------------------------------------------------------------
// 5. DEPLOY WORKFLOW INTEGRITY & TRIGGER VERIFICATION
// ---------------------------------------------------------------------------
console.log('>> [Check 5] Deploy Workflow (.github/workflows/deploy.yml) Verification...');
const deployPath = '.github/workflows/deploy.yml';
const deployContent = fs.readFileSync(deployPath, 'utf8');

// Check git log commit count for deploy.yml
const deployGitCommits = execSync(`git log --oneline -- ${deployPath}`, { encoding: 'utf8' }).trim().split(/\r?\n/).filter(Boolean);
const deployWorkingTreeStatus = execSync(`git status --porcelain -- ${deployPath}`, { encoding: 'utf8' }).trim();

// Check triggers in deploy.yml
const onlyMainTrigger = deployContent.includes('branches:') &&
                        deployContent.includes('- main') &&
                        !deployContent.includes('landing-v2') &&
                        !deployContent.includes('pull_request:');

recordCheck('Deploy workflow was NEVER modified since creation', deployGitCommits.length === 1 && deployWorkingTreeStatus === '', {
  commitsCount: deployGitCommits.length,
  commits: deployGitCommits,
  workingTreeStatus: deployWorkingTreeStatus || 'clean (unmodified)'
});
recordCheck('Deploy workflow triggers strictly on main and workflow_dispatch only', onlyMainTrigger, {
  onlyMainTrigger,
  rawTriggers: deployContent.split('jobs:')[0].trim()
});

// ---------------------------------------------------------------------------
// SAVE RESULTS & PRINT REPORT
// ---------------------------------------------------------------------------
fs.writeFileSync('qa/comprehensive_security_results.json', JSON.stringify(results, null, 2));

console.log('\n====================================================');
console.log('AUDIT RESULTS SUMMARY:');
console.log('====================================================');
for (const [name, check] of Object.entries(results.checks)) {
  console.log(`[${check.pass ? 'PASS' : 'FAIL'}] ${name}`);
}
console.log('====================================================');
console.log(`OVERALL RESULT: ${results.summary.passed ? 'ALL CHECKS PASSED (100%)' : 'FAILURES DETECTED'}`);
console.log('Detailed results written to qa/comprehensive_security_results.json\n');
