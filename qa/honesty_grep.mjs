import fs from 'node:fs';
import path from 'node:path';

const v2Dir = path.resolve('src/v2');

function walk(dir) {
  let files = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      files = files.concat(walk(full));
    } else if (/\.(ts|tsx|js|jsx|css|html)$/.test(item)) {
      files.push(full);
    }
  }
  return files;
}

const allFiles = walk(v2Dir);

// 1. Reference leak words
const LEAK_WORDS = [
  "Prakriti",
  "carbon",
  "India",
  "Gemini Vision",
  "100%",
  "coverage",
  "YNAB",
  "CEA",
  "Diwali"
];

console.log('--- 1. Reference Leak Words Grep ---');
let leakFound = false;
for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  for (const word of LEAK_WORDS) {
    if (content.toLowerCase().includes(word.toLowerCase())) {
      console.log(`[LEAK] Found "${word}" in ${file}`);
      leakFound = true;
    }
  }
}
if (!leakFound) console.log('PASS: 0 reference leak words found.');

// 2. Fetch calls
console.log('\n--- 2. Fetch Calls Grep ---');
for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(/fetch\([^)]+\)/g);
  if (matches) {
    console.log(`Fetch in ${file}:`, matches);
  }
}

// 3. Hex colors outside v2.css
console.log('\n--- 3. Hex Colors Check ---');
const hexRegex = /#[0-9a-fA-F]{3,8}/g;
for (const file of allFiles) {
  if (file.endsWith('v2.css')) continue;
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(hexRegex);
  if (matches) {
    const unique = [...new Set(matches)];
    console.log(`Hex colors in ${path.relative(v2Dir, file)}:`, unique);
  }
}

// 4. External URLs
console.log('\n--- 4. External URLs Check ---');
const urlRegex = /https?:\/\/[^\s"'`)]+/g;
const allowedDomains = [
  'github.com',
  'graphify.com',
  'ai.google.dev',
  'docs.graphify.com'
];
for (const file of allFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const matches = content.match(urlRegex);
  if (matches) {
    for (const url of matches) {
      const allowed = allowedDomains.some(d => url.includes(d));
      console.log(`URL in ${path.relative(v2Dir, file)}: ${url} (${allowed ? 'ALLOWED' : 'CHECK'})`);
    }
  }
}
