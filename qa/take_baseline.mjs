import { chromium } from '@playwright/test';
import { preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

async function main() {
  const root = path.resolve('.');
  const outDir = path.join(root, 'qa', 'baseline');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // Start preview server
  const server = await preview({
    root,
    preview: {
      port: 4173,
      strictPort: true,
    },
  });

  const serverUrl = 'http://localhost:4173';
  console.log(`Preview server running at ${serverUrl}`);

  const browser = await chromium.launch();
  const widths = [360, 768, 1280, 1920];

  for (const width of widths) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      deviceScaleFactor: 1,
    });
    console.log(`Taking screenshot at ${width}px...`);
    await page.goto(`${serverUrl}/index.html`, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      // scroll to trigger any reveals or lazy loads, then scroll back
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise(r => setTimeout(r, 400));
      window.scrollTo(0, 0);
      await new Promise(r => setTimeout(r, 400));
    });

    const screenshotPath = path.join(outDir, `v1-${width}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Saved ${screenshotPath}`);
    await page.close();
  }

  await browser.close();
  await server.close();
  console.log('Baseline screenshots completed successfully.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
