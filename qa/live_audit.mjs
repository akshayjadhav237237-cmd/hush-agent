import { chromium } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

async function auditSite(browser, url, label) {
  const root = path.resolve('.');
  const liveDir = path.join(root, 'qa', 'live');
  if (!fs.existsSync(liveDir)) fs.mkdirSync(liveDir, { recursive: true });

  const viewports = [390, 768, 1440];
  const auditResults = {
    url,
    label,
    viewports: {},
  };

  const context = await browser.newContext();
  
  for (const width of viewports) {
    console.log(`[${label}] Starting viewport ${width}px...`);
    const page = await context.newPage();
    const consoleErrors = [];
    const failedRequests = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('requestfailed', request => {
      failedRequests.push({
        url: request.url(),
        failure: request.failure()?.errorText || 'unknown'
      });
    });

    await page.setViewportSize({ width, height: 900 });
    
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(3000); // let scripts/videos initialize
    } catch (e) {
      console.log(`[${label}] Navigation warning at ${width}: ${e.message}`);
    }

    // 1. Hero video checks
    const heroVideoCheck = await page.evaluate(() => {
      const video = document.querySelector('video');
      if (!video) return { exists: false };
      const style = window.getComputedStyle(video);
      return {
        exists: true,
        autoplay: video.autoplay,
        playsInline: video.playsInline,
        paused: video.paused,
        filter: style.filter,
        backdropFilter: style.backdropFilter
      };
    });

    // 2. Bento video checks
    const bentoVideoCheck = await page.evaluate(() => {
      const videos = Array.from(document.querySelectorAll('video'));
      const bentoVideo = videos.length > 1 ? videos[1] : null;
      const overlay = document.querySelector('.bento-play-overlay, [data-play-button], button[aria-label*="play" i]');
      return {
        exists: !!bentoVideo,
        paused: bentoVideo ? bentoVideo.paused : null,
        hasPlayOverlay: !!overlay
      };
    });

    // 3. Stats section
    const statsCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      return {
        has285: text.includes('285'),
        has6Gates: text.includes('6') || text.includes('gates'),
        has4Engines: text.includes('4') || text.includes('engines'),
        snippet: text.substring(0, 500)
      };
    });

    // 4. Manifesto word reveal
    const manifestoCheck = await page.evaluate(() => {
      const manifesto = document.querySelector('#manifesto, .manifesto, [class*="manifesto"]');
      if (!manifesto) return { found: false };
      const words = manifesto.querySelectorAll('span, p, div');
      return { found: true, count: words.length };
    });

    // 5. Compare section (rows 01 to 03 only, no TRUST row)
    const compareCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasTrustRow = /trust/i.test(text) && (text.includes('04') || text.includes('TRUST'));
      return {
        hasTrustRow
      };
    });

    // 6. FAQ accordion questions (exactly 5)
    const faqCheck = await page.evaluate(() => {
      const questions = Array.from(document.querySelectorAll('h3, h4, button, [class*="faq"]')).filter(el => el.innerText.includes('?'));
      return {
        questionCount: questions.length,
        questions: questions.map(q => q.innerText.trim())
      };
    });

    // 7. Replay section check
    const replayCheck = await page.evaluate(() => {
      const text = document.body.innerText;
      const hasReplay = /replay/i.test(text) && (text.includes('CLI Replay') || text.includes('Session Replay'));
      return {
        hasReplay
      };
    });

    // 8. Navigation & Links
    const linksCheck = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'));
      const broken = [];
      links.forEach(a => {
        const href = a.getAttribute('href');
        if (href && href.startsWith('#') && href.length > 1) {
          const target = document.querySelector(href);
          if (!target) broken.push(href);
        }
      });
      return {
        totalLinks: links.length,
        brokenAnchors: broken
      };
    });

    // 10. Measurements
    const measurements = await page.evaluate(() => {
      const heroFrame = document.querySelector('.hero-frame, [class*="frame"], main > div:first-child');
      const nav = document.querySelector('nav, header');
      const wordmark = document.querySelector('.wordmark, h1, [class*="logo"]');

      const getRect = (el) => el ? el.getBoundingClientRect() : null;
      const frameRect = getRect(heroFrame);
      const navRect = getRect(nav);
      const wordmarkRect = getRect(wordmark);

      return {
        frameMarginPx: frameRect ? frameRect.left : null,
        navWidthPx: navRect ? navRect.width : null,
        wordmarkHeightPx: wordmarkRect ? wordmarkRect.height : null
      };
    });

    const shotName = `${label}-${width}.png`;
    const shotPath = path.join(liveDir, shotName);
    await page.screenshot({ path: shotPath, fullPage: true });

    auditResults.viewports[width] = {
      heroVideo: heroVideoCheck,
      bentoVideo: bentoVideoCheck,
      stats: statsCheck,
      manifesto: manifestoCheck,
      compare: compareCheck,
      faq: faqCheck,
      replay: replayCheck,
      links: linksCheck,
      measurements,
      consoleErrors,
      failedRequests,
      screenshot: shotPath
    };

    console.log(`[${label}] Viewport ${width}px complete.`);
    await page.close();
  }

  await context.close();
  return auditResults;
}

async function main() {
  const browser = await chromium.launch();
  console.log('Auditing Vercel deployment...');
  const vercelResults = await auditSite(browser, 'https://hush-agent-alpha.vercel.app', 'vercel');
  console.log('Auditing GitHub Pages deployment...');
  const ghResults = await auditSite(browser, 'https://akshayjadhav237237-cmd.github.io/hush-agent/', 'gh');
  await browser.close();

  const report = {
    timestamp: new Date().toISOString(),
    vercel: vercelResults,
    github: ghResults
  };

  const reportPath = path.resolve('qa', 'live', 'live_audit_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Live audit complete. Report saved to ${reportPath}`);
}

main().catch(console.error);
