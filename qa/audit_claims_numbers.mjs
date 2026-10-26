import fs from 'node:fs';
import path from 'node:path';

const v2Dir = path.resolve('src/v2');

function walk(dir) {
  let files = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) {
      files = files.concat(walk(full));
    } else if (/\.(ts|tsx)$/.test(item)) {
      files.push(full);
    }
  }
  return files;
}

const files = walk(v2Dir);

console.log('=== NON-CLASS STRINGS CONTAINING NUMBERS OR METRICS IN src/v2 ===\n');

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const rel = path.relative(v2Dir, file);
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Skip imports, classNames, css
    if (/^\s*(import|export\s+interface|export\s+type)/.test(line)) return;
    if (line.includes('className=') && !line.includes('>')) return;
    
    // Look for numbers in user-facing strings
    const strMatches = line.match(/(["'`])(?:(?=(\\?))\2.)*?\1/g) || [];
    for (const lit of strMatches) {
      const val = lit.slice(1, -1);
      // Skip path/import
      if (val.startsWith('@/') || val.startsWith('./') || val.startsWith('/')) continue;
      // Skip pure class names
      if (val.includes('text-') || val.includes('p-') || val.includes('rounded-') || val.includes('sm:') || val.includes('md:') || val.includes('lg:')) continue;
      if (val.includes('var(--v2-')) continue;
      if (/^\b\d+(px|rem|%|ms|s)?\b$/.test(val)) continue;
      if (/^#?[0-9a-fA-F]+$/.test(val)) continue;

      if (/\d/.test(val)) {
        console.log(`${rel}:${idx + 1} -> ${lit}`);
      }
    }
  });
}
