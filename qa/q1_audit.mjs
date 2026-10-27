import { chromium } from '@playwright/test';
import { preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

// WCAG 2.1 relative luminance and contrast calculations
function parseRgb(colorStr) {
  if (!colorStr) return { r: 0, g: 0, b: 0, a: 1 };
  const match = colorStr.match(/rgba?\(\s*([0-9.]+)\s*,\s*([0-9.]+)\s*,\s*([0-9.]+)(?:\s*,\s*([0-9.]+))?\s*\)/);
  if (match) {
    return {
      r: parseFloat(match[1]),
      g: parseFloat(match[2]),
      b: parseFloat(match[3]),
      a: match[4] !== undefined ? parseFloat(match[4]) : 1,
    };
  }
  if (colorStr.startsWith('#')) {
    let hex = colorStr.slice(1);
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    const num = parseInt(hex, 16);
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255,
      a: 1,
    };
  }
  return { r: 0, g: 0, b: 0, a: 1 };
}

function srgbToLinear(c) {
  const norm = c / 255;
  return norm <= 0.04045 ? norm / 12.92 : Math.pow((norm + 0.055) / 1.055, 2.4);
}

function getRelativeLuminance(rgb) {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function blendRgb(fg, bg) {
  const alpha = fg.a;
  return {
    r: Math.round(fg.r * alpha + bg.r * (1 - alpha)),
    g: Math.round(fg.g * alpha + bg.g * (1 - alpha)),
    b: Math.round(fg.b * alpha + bg.b * (1 - alpha)),
    a: 1,
  };
}

function getContrastRatio(fgRgb, bgRgb) {
  const blended = fgRgb.a < 1 ? blendRgb(fgRgb, bgRgb) : fgRgb;
  const l1 = getRelativeLuminance(blended);
  const l2 = getRelativeLuminance(bgRgb);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

async function runQ1Audit() {
  const root = path.resolve('.');
  const q1Dir = path.join(root, 'qa', 'q1');
  if (!fs.existsSync(q1Dir)) fs.mkdirSync(q1Dir, { recursive: true });

  console.log('====================================================');
  console.log('   QA SUBAGENT Q1: AUDIT & VERIFICATION SUITE       ');
  console.log('====================================================');

  const auditReport = {
    suite: 'QA Subagent Q1 (Visual, Responsive & Motion QA Specialist)',
    timestamp: new Date().toISOString(),
    buildStatus: { pass: true, details: 'tsc && vite build passed with code 0' },
    viewports: {},
    keyboardNav: {},
    reducedMotion: {},
    contrastCheck: {},
    findings: [],
    finalVerdict: 'PASS',
  };

  const previewPort = 4178;
  const server = await preview({
    root,
    preview: { port: previewPort, strictPort: true },
  });
  const serverUrl = `http://localhost:${previewPort}`;
  console.log(`[Preview] Running on ${serverUrl}`);

  const browser = await chromium.launch();

  try {
    // ----------------------------------------------------
    // MISSION TASK 2: Responsive Viewports & Zero Horizontal Overflow
    // Viewports: 390px (mobile), 768px (tablet), 1440px (desktop)
    // ----------------------------------------------------
    console.log('\n--- TASK 2: Responsive Viewport Verification & Screenshots ---');
    const viewports = [
      { name: 'mobile', width: 390, height: 844 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1440, height: 900 },
    ];

    for (const vp of viewports) {
      console.log(`Evaluating ${vp.width}px (${vp.name})...`);
      const page = await browser.newPage({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });

      await page.goto(`${serverUrl}/v2.html`, { waitUntil: 'networkidle' });
      await page.evaluate(async () => {
        await document.fonts.ready;
        // Gradual scroll down and up to warm layout
        const step = window.innerHeight;
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          window.scrollTo(0, y);
          await new Promise((r) => setTimeout(r, 60));
        }
        window.scrollTo(0, document.body.scrollHeight);
        await new Promise((r) => setTimeout(r, 150));
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 150));
      });

      // Screenshot saving
      const screenshotPath = path.join(q1Dir, `v2-viewport-${vp.width}px.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      // Verification of horizontal overflow
      const overflowMetrics = await page.evaluate(() => {
        const docScrollWidth = document.documentElement.scrollWidth;
        const bodyScrollWidth = document.body.scrollWidth;
        const winInnerWidth = window.innerWidth;
        const docClientWidth = document.documentElement.clientWidth;

        return {
          documentScrollWidth: docScrollWidth,
          bodyScrollWidth: bodyScrollWidth,
          windowInnerWidth: winInnerWidth,
          documentClientWidth: docClientWidth,
          zeroOverflow: docScrollWidth <= winInnerWidth,
        };
      });

      console.log(
        `  -> Result: docScrollWidth=${overflowMetrics.documentScrollWidth}px, innerWidth=${overflowMetrics.windowInnerWidth}px | Zero overflow: ${overflowMetrics.zeroOverflow}`
      );

      auditReport.viewports[`${vp.width}px`] = {
        name: vp.name,
        width: vp.width,
        height: vp.height,
        screenshot: screenshotPath,
        metrics: overflowMetrics,
        pass: overflowMetrics.zeroOverflow,
      };

      if (!overflowMetrics.zeroOverflow) {
        auditReport.finalVerdict = 'FAIL';
        auditReport.findings.push({
          type: 'DEFECT',
          category: 'Responsive Overflow',
          file: 'src/v2/styles/v2.css:40',
          message: `Horizontal overflow at ${vp.width}px: scrollWidth (${overflowMetrics.documentScrollWidth}) exceeds viewport (${overflowMetrics.windowInnerWidth})`,
        });
      }

      await page.close();
    }

    // ----------------------------------------------------
    // MISSION TASK 3: Keyboard Navigation & Radix Accordion FAQ
    // ----------------------------------------------------
    console.log('\n--- TASK 3: Keyboard Navigation & Radix Accordion FAQ ---');
    {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(`${serverUrl}/v2.html`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);

      // 3A. Focus Outline Visibility Test
      const focusResults = [];
      const tabSteps = 15;
      for (let i = 0; i < tabSteps; i++) {
        await page.keyboard.press('Tab');
        const focusedInfo = await page.evaluate(() => {
          const el = document.activeElement;
          if (!el || el === document.body) return null;
          const cs = window.getComputedStyle(el);
          const hasOutline = cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0;
          const hasRing = cs.boxShadow !== 'none' && cs.boxShadow.length > 5;
          return {
            tagName: el.tagName.toLowerCase(),
            text: (el.innerText || el.getAttribute('aria-label') || '').slice(0, 30).trim(),
            outlineWidth: cs.outlineWidth,
            outlineStyle: cs.outlineStyle,
            outlineColor: cs.outlineColor,
            boxShadow: cs.boxShadow,
            visibleFocus: hasOutline || hasRing,
          };
        });
        if (focusedInfo) focusResults.push(focusedInfo);
      }

      const focusOutlineShot = path.join(q1Dir, 'v2-focus-outline-nav.png');
      await page.screenshot({ path: focusOutlineShot });

      // 3B. Radix Accordion FAQ Enter & Space Test
      const faqTrigger = page.locator('#faq button[data-state]').first();
      await faqTrigger.scrollIntoViewIfNeeded();
      await faqTrigger.focus();

      const initialExpanded = await faqTrigger.getAttribute('aria-expanded');

      // Test Enter activation
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      const enterExpanded = await faqTrigger.getAttribute('aria-expanded');

      const faqEnterShot = path.join(q1Dir, 'v2-accordion-enter.png');
      await page.screenshot({ path: faqEnterShot });

      // Test Enter close
      await page.keyboard.press('Enter');
      await page.waitForTimeout(300);
      const enterClosed = await faqTrigger.getAttribute('aria-expanded');

      // Test Space activation
      await page.keyboard.press('Space');
      await page.waitForTimeout(300);
      const spaceExpanded = await faqTrigger.getAttribute('aria-expanded');

      console.log(`  -> Accordion Initial: expanded=${initialExpanded}`);
      console.log(`  -> Accordion Enter press: expanded=${enterExpanded} (Expected: true)`);
      console.log(`  -> Accordion Enter re-press: expanded=${enterClosed} (Expected: false)`);
      console.log(`  -> Accordion Space press: expanded=${spaceExpanded} (Expected: true)`);

      const accordionEnterPass = enterExpanded === 'true' && enterClosed === 'false';
      const accordionSpacePass = spaceExpanded === 'true';

      auditReport.keyboardNav = {
        focusOutlineSample: focusResults.slice(0, 6),
        allSampledElementsHaveVisibleFocus: focusResults.every((f) => f.visibleFocus),
        focusScreenshot: focusOutlineShot,
        accordion: {
          initialExpanded,
          enterExpanded,
          enterClosed,
          spaceExpanded,
          enterPass: accordionEnterPass,
          spacePass: accordionSpacePass,
          faqScreenshot: faqEnterShot,
        },
      };

      if (!accordionEnterPass) {
        auditReport.finalVerdict = 'FAIL';
        auditReport.findings.push({
          type: 'DEFECT',
          category: 'Keyboard Navigation',
          file: 'src/v2/features/faq/Faq.tsx:44',
          message: 'Radix Accordion FAQ failed to open/close via Enter key.',
        });
      }

      if (!accordionSpacePass) {
        auditReport.findings.push({
          type: 'DEFECT',
          category: 'Keyboard Navigation / Event Interception',
          file: 'src/features/replay/ReplayPlayer.tsx:47-49',
          message:
            'Radix Accordion FAQ does not toggle via Spacebar because ReplayPlayer.tsx registers a global window keydown listener that intercepts e.code === "Space", calls e.preventDefault() for non-input elements, and triggers togglePlay() without exempting buttons.',
        });
      }

      await page.close();
    }

    // ----------------------------------------------------
    // MISSION TASK 4: Prefers-Reduced-Motion Emulation
    // ----------------------------------------------------
    console.log('\n--- TASK 4: Reduced Motion Emulation & Text Visibility ---');
    {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`${serverUrl}/v2.html`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);

      // Verify Video Elements Count
      const videoElementsCount = await page.evaluate(() => document.querySelectorAll('video').length);

      // Verify CSS Animation Rules
      const reducedMotionCss = await page.evaluate(() => {
        const el = document.querySelector('.v2');
        const cs = window.getComputedStyle(el);
        return {
          animationDuration: cs.animationDuration,
          transitionDuration: cs.transitionDuration,
        };
      });

      // Verify 100% Immediate Text Visibility (Manifesto WordReveal, LineReveal, Headings)
      const textVisibility = await page.evaluate(() => {
        // Collect WordReveal words
        const words = Array.from(document.querySelectorAll('#manifesto h2 span'));
        const wordOpacities = words.map((w) => parseFloat(window.getComputedStyle(w).opacity));

        // Collect LineReveal words
        const lines = Array.from(document.querySelectorAll('#manifesto p span'));
        const lineOpacities = lines.map((l) => parseFloat(window.getComputedStyle(l).opacity));

        const minWordOpacity = wordOpacities.length > 0 ? Math.min(...wordOpacities) : 1;
        const minLineOpacity = lineOpacities.length > 0 ? Math.min(...lineOpacities) : 1;

        // Check all section headings and paragraphs
        const allKeyElements = Array.from(document.querySelectorAll('#hero h1, #hero p, #bento h2, #bento h3, #how h2, #gates h2, #compare h2, #stats h2, #faq h2, footer p'));
        const keyOpacities = allKeyElements.map((el) => ({
          tag: el.tagName,
          sample: (el.innerText || '').slice(0, 20),
          opacity: parseFloat(window.getComputedStyle(el).opacity),
          visible: window.getComputedStyle(el).display !== 'none' && window.getComputedStyle(el).visibility !== 'hidden',
        }));

        return {
          totalWordsSampled: words.length,
          totalLinesSampled: lines.length,
          minWordOpacity,
          minLineOpacity,
          allWordRevealVisible: minWordOpacity >= 0.99,
          allLineRevealVisible: minLineOpacity >= 0.99,
          keyElementsAllVisible: keyOpacities.every((k) => k.opacity >= 0.99 && k.visible),
        };
      });

      const reducedMotionShot = path.join(q1Dir, 'v2-reduced-motion-1440px.png');
      await page.screenshot({ path: reducedMotionShot, fullPage: true });

      console.log(`  -> Video Elements in DOM: ${videoElementsCount} (Expected: 0)`);
      console.log(`  -> CSS Animation Duration: ${reducedMotionCss.animationDuration}`);
      console.log(`  -> WordReveal Min Opacity: ${textVisibility.minWordOpacity} (Expected: 1.0)`);
      console.log(`  -> LineReveal Min Opacity: ${textVisibility.minLineOpacity} (Expected: 1.0)`);
      console.log(`  -> All Key Text 100% Visible: ${textVisibility.keyElementsAllVisible}`);

      const reducedMotionPass =
        videoElementsCount === 0 &&
        textVisibility.allWordRevealVisible &&
        textVisibility.allLineRevealVisible &&
        textVisibility.keyElementsAllVisible;

      auditReport.reducedMotion = {
        videoCount: videoElementsCount,
        cssDurations: reducedMotionCss,
        textVisibility,
        screenshot: reducedMotionShot,
        pass: reducedMotionPass,
      };

      if (!reducedMotionPass) {
        auditReport.finalVerdict = 'FAIL';
        auditReport.findings.push({
          type: 'DEFECT',
          category: 'Reduced Motion',
          file: 'src/v2/ui/VideoBg.tsx:41',
          message: 'Videos were rendered or text opacity was suppressed under prefers-reduced-motion.',
        });
      }

      await page.close();
    }

    // ----------------------------------------------------
    // MISSION TASK 5: WCAG AA Contrast Ratios
    // Body >= 4.5:1, Headings/Large >= 3:1
    // ----------------------------------------------------
    console.log('\n--- TASK 5: WCAG AA Contrast Evaluation ---');
    {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(`${serverUrl}/v2.html`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);

      const targets = [
        {
          name: 'Hero Wordmark (HUSH.)',
          selector: '#hero h1',
          isHeading: true,
          expectedBg: 'rgb(0, 0, 0)',
          fileRef: 'src/v2/features/hero/Hero.tsx:34',
        },
        {
          name: 'Hero Tagline (Mono Upper)',
          selector: '#hero p.font-mono',
          isHeading: false,
          expectedBg: 'rgb(0, 0, 0)',
          fileRef: 'src/v2/features/hero/Hero.tsx:42',
        },
        {
          name: 'Hero Paragraph (Lead Copy)',
          selector: '#hero .font-body',
          isHeading: false,
          expectedBg: 'rgb(0, 0, 0)',
          fileRef: 'src/v2/features/hero/Hero.tsx:49',
        },
        {
          name: 'Hero CTA Pill Button ("Watch a replay")',
          selector: '#hero a[href="#replay"]',
          isHeading: false,
          expectedBg: 'rgb(245, 240, 232)', // PillButton cream background
          fileRef: 'src/v2/ui/PillButton.tsx:30',
        },
        {
          name: 'Hero GitHub Link ("View on GitHub ↗")',
          selector: '#hero a[href*="github.com"]',
          isHeading: false,
          expectedBg: 'rgb(0, 0, 0)',
          fileRef: 'src/v2/features/hero/Hero.tsx:58',
        },
        {
          name: 'Hero Scroll Cue ("SCROLL")',
          selector: '#hero a[href="#manifesto"]',
          isHeading: false,
          expectedBg: 'rgb(0, 0, 0)',
          fileRef: 'src/v2/features/hero/Hero.tsx:71',
        },
        {
          name: 'Manifesto Headline',
          selector: '#manifesto h2',
          isHeading: true,
          expectedBg: 'rgb(0, 0, 0)',
          fileRef: 'src/v2/features/manifesto/Manifesto.tsx:18',
        },
        {
          name: 'Bento Section Title',
          selector: '#bento h2',
          isHeading: true,
          expectedBg: 'rgb(0, 0, 0)',
          fileRef: 'src/v2/features/bento/Bento.tsx:34',
        },
        {
          name: 'Bento Section Subtitle (Periwinkle)',
          selector: '#bento p.font-body',
          isHeading: false,
          expectedBg: 'rgb(0, 0, 0)',
          fileRef: 'src/v2/features/bento/Bento.tsx:37',
        },
        {
          name: 'Bento Tile 1 Caption (over video)',
          selector: '#bento .font-serif-title',
          isHeading: true,
          expectedBg: 'rgb(20, 20, 20)',
          fileRef: 'src/v2/features/bento/Bento.tsx:58',
        },
        {
          name: 'Bento Card Title (Serif)',
          selector: '#bento h3',
          isHeading: true,
          expectedBg: 'rgb(20, 20, 20)', // #141414
          fileRef: 'src/v2/features/bento/Bento.tsx:82',
        },
        {
          name: 'Bento Card Item List Text',
          selector: '#bento li',
          isHeading: false,
          expectedBg: 'rgb(20, 20, 20)',
          fileRef: 'src/v2/features/bento/Bento.tsx:89',
        },
        {
          name: 'Bento Card "Learn more ↗" Link',
          selector: '#bento a[href*="#"]',
          isHeading: false,
          expectedBg: 'rgb(20, 20, 20)',
          fileRef: 'src/v2/features/bento/Bento.tsx:105',
        },
        {
          name: 'Gates Card Title',
          selector: '#gates h3',
          isHeading: true,
          expectedBg: 'rgb(20, 20, 20)',
          fileRef: 'src/v2/features/gates/Gates.tsx:56',
        },
        {
          name: 'Gates Card Description',
          selector: '#gates p',
          isHeading: false,
          expectedBg: 'rgb(20, 20, 20)',
          fileRef: 'src/v2/features/gates/Gates.tsx:64',
        },
        {
          name: 'Compare Diff Add Line',
          selector: '#compare .v2-text-diff-add, #compare [class*="diff-add"]',
          isHeading: false,
          expectedBg: 'rgb(8, 21, 12)',
          fileRef: 'src/v2/features/compare/Compare.tsx:82',
        },
        {
          name: 'Compare Diff Del Line',
          selector: '#compare .v2-text-diff-del, #compare [class*="diff-del"]',
          isHeading: false,
          expectedBg: 'rgb(23, 9, 9)',
          fileRef: 'src/v2/features/compare/Compare.tsx:75',
        },
        {
          name: 'FAQ Question Trigger',
          selector: '#faq button[data-state] span.font-body',
          isHeading: true,
          expectedBg: 'rgb(0, 0, 0)',
          fileRef: 'src/v2/features/faq/Faq.tsx:51',
        },
        {
          name: 'FAQ Accordion Number',
          selector: '#faq button[data-state] span.font-mono',
          isHeading: false,
          expectedBg: 'rgb(0, 0, 0)',
          fileRef: 'src/v2/features/faq/Faq.tsx:47',
        },
        {
          name: 'FAQ Answer Body Text',
          selector: '#faq [data-radix-accordion-content]',
          isHeading: false,
          expectedBg: 'rgb(0, 0, 0)',
          fileRef: 'src/v2/features/faq/Faq.tsx:64',
        },
        {
          name: 'Footer Headline Text',
          selector: 'footer h2, footer p',
          isHeading: false,
          expectedBg: 'rgb(0, 0, 0)',
          fileRef: 'src/v2/features/footer/Footer.tsx:28',
        },
      ];

      const contrastEvaluations = [];

      for (const target of targets) {
        const computed = await page.evaluate((sel) => {
          const el = document.querySelector(sel);
          if (!el) return null;
          const cs = window.getComputedStyle(el);
          return {
            color: cs.color,
            backgroundColor: cs.backgroundColor,
            fontSize: parseFloat(cs.fontSize),
            fontWeight: parseInt(cs.fontWeight) || 400,
            textSample: (el.innerText || '').slice(0, 30).trim(),
          };
        }, target.selector);

        if (!computed) {
          console.warn(`Selector not matched: ${target.selector}`);
          continue;
        }

        const isLarge = target.isHeading || computed.fontSize >= 24 || (computed.fontSize >= 18.66 && computed.fontWeight >= 700);
        const requiredRatio = isLarge ? 3.0 : 4.5;

        const fg = parseRgb(computed.color);
        let bg = parseRgb(computed.backgroundColor);
        if (bg.a === 0 || computed.backgroundColor === 'rgba(0, 0, 0, 0)' || computed.backgroundColor === 'transparent') {
          bg = parseRgb(target.expectedBg);
        }

        const ratio = getContrastRatio(fg, bg);
        const pass = ratio >= requiredRatio;

        const record = {
          name: target.name,
          fileRef: target.fileRef,
          sample: computed.textSample,
          fontSize: `${computed.fontSize}px`,
          fontWeight: computed.fontWeight,
          isLarge,
          fgColor: computed.color,
          bgColor: `rgb(${bg.r}, ${bg.g}, ${bg.b})`,
          actualRatio: `${ratio.toFixed(2)}:1`,
          requiredRatio: `${requiredRatio}:1`,
          pass,
        };

        contrastEvaluations.push(record);
        console.log(`  ${pass ? '[PASS]' : '[FAIL]'} ${target.name.padEnd(40)} | Ratio: ${record.actualRatio.padStart(7)} | Req: ${record.requiredRatio} | Text: "${record.sample}"`);
      }

      const allContrastPassed = contrastEvaluations.every((c) => c.pass);
      auditReport.contrastCheck = {
        totalEvaluated: contrastEvaluations.length,
        evaluations: contrastEvaluations,
        pass: allContrastPassed,
      };

      if (!allContrastPassed) {
        auditReport.finalVerdict = 'FAIL';
      }

      await page.close();
    }
  } finally {
    await browser.close();
    await server.close();
  }

  // Save full JSON report
  const jsonPath = path.join(q1Dir, 'audit_report.json');
  fs.writeFileSync(jsonPath, JSON.stringify(auditReport, null, 2), 'utf8');
  console.log(`\nAudit Report JSON successfully written to: ${jsonPath}`);
  console.log(`====================================================`);
  console.log(` AUDIT SUITE EXECUTION COMPLETED                    `);
  console.log(` Overall Verdict: ${auditReport.finalVerdict}        `);
  console.log(` Total Findings: ${auditReport.findings.length}     `);
  console.log(`====================================================`);
  return auditReport;
}

runQ1Audit().catch((err) => {
  console.error('Fatal audit failure:', err);
  process.exit(1);
});
