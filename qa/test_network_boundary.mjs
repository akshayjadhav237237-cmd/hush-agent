import { chromium } from '@playwright/test';
import { preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

async function runNetworkBoundaryTest() {
  const root = path.resolve('.');
  console.log('--- Starting Network Boundary & Live Request Interception Test ---');

  const server = await preview({
    root,
    preview: {
      port: 4179,
      strictPort: true,
    },
  });

  const serverUrl = 'http://localhost:4179';
  console.log(`Preview server started at ${serverUrl}`);

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const requests = [];
  const externalRequests = [];
  const fetchRequests = [];

  page.on('request', (req) => {
    const url = req.url();
    const method = req.method();
    const resourceType = req.resourceType();
    const headers = req.headers();

    const isLocalhost = url.startsWith(serverUrl);
    requests.push({ url, method, resourceType, isLocalhost });

    if (!isLocalhost && !url.startsWith('data:') && !url.startsWith('blob:')) {
      externalRequests.push({ url, method, resourceType });
    }

    if (resourceType === 'fetch' || resourceType === 'xhr') {
      fetchRequests.push({ url, method, resourceType });
    }
  });

  console.log('Navigating to /v2.html...');
  await page.goto(`${serverUrl}/v2.html`, { waitUntil: 'networkidle' });

  // Scroll smoothly down the page to trigger IntersectionObservers and any lazy media/components
  await page.evaluate(async () => {
    await document.fonts.ready;
    const distance = 400;
    const totalHeight = document.body.scrollHeight;
    let current = 0;
    while (current < totalHeight) {
      window.scrollBy(0, distance);
      current += distance;
      await new Promise((r) => setTimeout(r, 60));
    }
    await new Promise((r) => setTimeout(r, 500));
    window.scrollTo(0, 0);
  });

  // Interact with replay controls / tabs if available
  const tabButtons = await page.$$('[role="tab"]');
  console.log(`Found ${tabButtons.length} tab buttons. Clicking them...`);
  for (const btn of tabButtons) {
    try {
      await btn.click();
      await page.waitForTimeout(300);
    } catch (e) {
      // ignore
    }
  }

  // Check play/pause or speed controls in replay player
  const replayButtons = await page.$$('.v2-replay-scope button');
  console.log(`Found ${replayButtons.length} replay player controls.`);
  for (const btn of replayButtons.slice(0, 5)) {
    try {
      await btn.click();
      await page.waitForTimeout(100);
    } catch (e) {
      // ignore
    }
  }

  // Wait for any trailing requests
  await page.waitForTimeout(1000);

  await browser.close();
  await server.close();

  console.log('\n--- Network Request Summary ---');
  console.log(`Total requests captured: ${requests.length}`);
  console.log(`External requests: ${externalRequests.length}`);
  console.log(`Fetch / XHR requests: ${fetchRequests.length}`);

  console.log('\nFetch / XHR breakdown:');
  for (const req of fetchRequests) {
    const isAllowedFetch = req.url.includes('replay.json') || req.url.includes('replay_real.json');
    console.log(`  [${isAllowedFetch ? 'ALLOWED' : 'UNEXPECTED'}] ${req.method} ${req.url}`);
  }

  const unexpectedFetches = fetchRequests.filter(
    (req) => !req.url.includes('replay.json') && !req.url.includes('replay_real.json')
  );

  const report = {
    timestamp: new Date().toISOString(),
    totalRequests: requests.length,
    externalRequestsCount: externalRequests.length,
    externalRequests,
    fetchRequestsCount: fetchRequests.length,
    fetchRequests,
    unexpectedFetchesCount: unexpectedFetches.length,
    unexpectedFetches,
    passed: externalRequests.length === 0 && unexpectedFetches.length === 0
  };

  fs.writeFileSync('qa/network_boundary_results.json', JSON.stringify(report, null, 2));

  if (report.passed) {
    console.log('\n>>> NETWORK BOUNDARY AUDIT: PASS! ZERO EXTERNAL CALLS, ZERO UNEXPECTED FETCHES <<<');
  } else {
    console.error('\n>>> NETWORK BOUNDARY AUDIT: FAIL! Check findings above. <<<');
  }
}

runNetworkBoundaryTest().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
