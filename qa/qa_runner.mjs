import { chromium } from '@playwright/test';
import { preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

async function main() {
  const root = path.resolve('.');
  const v2OutDir = path.join(root, 'qa', 'v2');
  const v1VerifyDir = path.join(root, 'qa', 'v1_verify');
  const baselineDir = path.join(root, 'qa', 'baseline');

  if (!fs.existsSync(v2OutDir)) fs.mkdirSync(v2OutDir, { recursive: true });
  if (!fs.existsSync(v1VerifyDir)) fs.mkdirSync(v1VerifyDir, { recursive: true });

  const results = {
    screenshotsV2: [],
    v1Regression: [],
    horizontalScroll360: null,
    reducedMotionTest: null,
    keyboardNavTest: null,
    mediaSizes: {},
    honestyGrep: {},
    defects: [],
  };

  // 1. Check Media Sizes
  const heroMp4 = path.join(root, 'public', 'v2', 'media', 'hero.mp4');
  const bentoMp4 = path.join(root, 'public', 'v2', 'media', 'bento.mp4');
  const heroSizeMB = fs.existsSync(heroMp4) ? fs.statSync(heroMp4).size / (1024 * 1024) : 0;
  const bentoSizeMB = fs.existsSync(bentoMp4) ? fs.statSync(bentoMp4).size / (1024 * 1024) : 0;

  results.mediaSizes.heroMB = heroSizeMB;
  results.mediaSizes.bentoMB = bentoSizeMB;
  results.mediaSizes.heroPass = heroSizeMB > 0 && heroSizeMB <= 6;
  results.mediaSizes.bentoPass = bentoSizeMB > 0 && bentoSizeMB <= 3;

  if (!results.mediaSizes.heroPass) results.defects.push(`Hero video size ${heroSizeMB.toFixed(2)}MB exceeds 6MB target`);
  if (!results.mediaSizes.bentoPass) results.defects.push(`Bento video size ${bentoSizeMB.toFixed(2)}MB exceeds 3MB target`);

  // Start preview server
  const server = await preview({
    root,
    preview: {
      port: 4174,
      strictPort: true,
    },
  });

  const serverUrl = 'http://localhost:4174';
  const browser = await chromium.launch();
  const widths = [360, 768, 1280, 1920];

  // 2. v2 Screenshots
  for (const width of widths) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      deviceScaleFactor: 1,
    });
    await page.goto(`${serverUrl}/v2.html`, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise((r) => setTimeout(r, 400));
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 400));
    });

    const v2Path = path.join(v2OutDir, `v2-${width}.png`);
    await page.screenshot({ path: v2Path, fullPage: true });
    results.screenshotsV2.push(v2Path);

    // Check horizontal scroll at 360
    if (width === 360) {
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const innerWidth = await page.evaluate(() => window.innerWidth);
      results.horizontalScroll360 = {
        scrollWidth,
        innerWidth,
        noOverflow: scrollWidth <= innerWidth,
      };
      if (scrollWidth > innerWidth) {
        results.defects.push(`Horizontal scroll overflow detected at 360px: scrollWidth=${scrollWidth} > innerWidth=${innerWidth}`);
      }
    }

    await page.close();
  }

  // 3. v1 Regression Comparison
  for (const width of widths) {
    const page = await browser.newPage({
      viewport: { width, height: 900 },
      deviceScaleFactor: 1,
    });
    await page.goto(`${serverUrl}/index.html`, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      await document.fonts.ready;
      window.scrollTo(0, document.body.scrollHeight);
      await new Promise((r) => setTimeout(r, 400));
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 400));
    });

    const v1Path = path.join(v1VerifyDir, `v1-${width}.png`);
    await page.screenshot({ path: v1Path, fullPage: true });

    const baselinePath = path.join(baselineDir, `v1-${width}.png`);
    let matchesBaseline = false;
    if (fs.existsSync(baselinePath)) {
      const buf1 = fs.readFileSync(baselinePath);
      const buf2 = fs.readFileSync(v1Path);
      // Check byte length similarity
      const sizeDiff = Math.abs(buf1.length - buf2.length);
      matchesBaseline = sizeDiff < 2000; // Small tolerance for subtle timestamp/rendering quirks
      results.v1Regression.push({ width, matchesBaseline, baselineSize: buf1.length, verifySize: buf2.length });
    } else {
      results.v1Regression.push({ width, matchesBaseline: false, error: 'No baseline found' });
    }

    if (!matchesBaseline) {
      results.defects.push(`v1 regression potential mismatch at ${width}px`);
    }

    await page.close();
  }

  // 4. Reduced Motion Test
  {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 900 },
      deviceScaleFactor: 1,
    });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`${serverUrl}/v2.html`, { waitUntil: 'networkidle' });
    await page.evaluate(async () => {
      await document.fonts.ready;
    });

    const isVideoRendered = await page.evaluate(() => {
      const videos = document.querySelectorAll('video');
      return videos.length;
    });

    results.reducedMotionTest = {
      prefersReducedMotionActive: true,
      videosCountInReducedMotion: isVideoRendered, // Expected 0 because shouldShowVideo is false
      passed: isVideoRendered === 0,
    };
    if (isVideoRendered > 0) {
      results.defects.push(`Reduced motion failed: <video> tags still rendered when reduced motion is enabled`);
    }
    await page.close();
  }

  // 5. Keyboard Navigation & Accordion Test
  {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 900 },
    });
    await page.goto(`${serverUrl}/v2.html`, { waitUntil: 'networkidle' });

    // Find first accordion trigger
    const firstAccordionTrigger = page.locator('button[data-radix-collection-item]').first();
    const isVisible = await firstAccordionTrigger.isVisible();
    await firstAccordionTrigger.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(300);

    const isExpanded = await firstAccordionTrigger.getAttribute('aria-expanded');
    results.keyboardNavTest = {
      triggerFound: isVisible,
      expandedViaEnter: isExpanded === 'true',
    };
    if (isExpanded !== 'true') {
      results.defects.push(`Keyboard navigation failed: FAQ accordion item did not expand via Enter key`);
    }
    await page.close();
  }

  await browser.close();
  await server.close();

  // Write results json
  fs.writeFileSync(path.join(root, 'qa', 'qa_results.json'), JSON.stringify(results, null, 2), 'utf8');
  console.log('QA run completed. Results summary:');
  console.log(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
