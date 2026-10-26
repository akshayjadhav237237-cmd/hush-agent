import fs from 'node:fs';
import path from 'node:path';

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

const v2Files = walk('src/v2').concat(['v2.html']);
const urlRegex = /https?:\/\/[^\s"'`<>{}|\\^\[\]]+/g;

const ALLOWED_PATTERNS = [
  /^https?:\/\/(www\.)?github\.com(\/|$)/,
  /^https?:\/\/(www\.)?graphify\.com(\/|$)/,
  /^https?:\/\/docs\.graphify\.com(\/|$)/,
  /^https?:\/\/ai\.google\.dev(\/|$)/,
  /^https?:\/\/akshayjadhav237237-cmd\.github\.io\/hush-agent(\/|$)/
];

const results = [];
const disallowed = [];

for (const file of v2Files) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(urlRegex) || [];
  for (const rawUrl of matches) {
    // Strip trailing punctuation often caught in regex
    const cleanUrl = rawUrl.replace(/[.,;:]+$/, '');
    const isAllowed = ALLOWED_PATTERNS.some(pat => pat.test(cleanUrl));
    results.push({ file, url: cleanUrl, allowed: isAllowed });
    if (!isAllowed) {
      disallowed.push({ file, url: cleanUrl });
    }
  }
}

console.log('=== URLs in src/v2 and v2.html ===');
console.log(`Total URLs found: ${results.length}`);
console.log(`Allowed URLs: ${results.filter(r => r.allowed).length}`);
console.log(`Disallowed URLs: ${disallowed.length}`);

for (const item of results) {
  console.log(`[${item.allowed ? 'PASS' : 'FAIL'}] ${item.file} -> ${item.url}`);
}

if (disallowed.length > 0) {
  console.error('\nDISALLOWED URLS FOUND:');
  console.error(disallowed);
} else {
  console.log('\nALL URLs STRICTLY WITHIN ALLOWED SET!');
}
