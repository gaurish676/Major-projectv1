const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = '/home/gaurish/.gemini/antigravity-cli/brain/2ecec5ac-5d56-431e-8bfa-03deb8f9d4ed/screenshots';
const ASSETS_DIR = '/home/gaurish/Desktop/Major/v4/presentation_assets';

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
fs.mkdirSync(ASSETS_DIR, { recursive: true });

async function saveScreenshot(pageOrElement, filename) {
  const p1 = path.join(ARTIFACT_DIR, filename);
  const p2 = path.join(ASSETS_DIR, filename);
  await pageOrElement.screenshot({ path: p1 });
  await pageOrElement.screenshot({ path: p2 });
  console.log(`Saved screenshot: ${filename}`);
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,960'],
    defaultViewport: { width: 1440, height: 960, deviceScaleFactor: 2 },
  });

  try {
    // -------------------------------------------------------------
    // PART 1: Ananya Joshi (Original Owner) Submitting Duplicate
    // -------------------------------------------------------------
    console.log('--- Logging in as Ananya Joshi ---');
    const loginAnanya = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ananya@university.edu', password: 'password123' })
    });
    const { token: ananyaToken } = await loginAnanya.json();

    const page1 = await browser.newPage();
    await page1.goto('http://localhost:3000');
    await page1.evaluate((tok) => {
      localStorage.setItem('activity_portal_token', tok);
    }, ananyaToken);
    await page1.goto('http://localhost:3000');
    await page1.waitForSelector('h1', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1200));

    // 1. Dashboard Overview
    await saveScreenshot(page1, '01_student_dashboard_approved_activities.png');

    // 2. Open Submissions History Tab
    console.log('Navigating to Submission History...');
    await page1.evaluate(() => {
      const items = Array.from(document.querySelectorAll('button, a'));
      const subItem = items.find(x => x.innerText.includes('My Submissions') || x.innerText.includes('Submission History'));
      if (subItem) subItem.click();
    });
    await new Promise(r => setTimeout(r, 1200));
    await saveScreenshot(page1, '02_student_submissions_ledger.png');

    // 3. Open Upload Certificate Modal
    console.log('Opening Upload Modal...');
    await page1.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.innerText.includes('Upload Certificate'));
      if (b) b.click();
    });

    const modalSelector = '.relative.w-full.max-w-xl';
    await page1.waitForSelector(modalSelector, { timeout: 10000 });
    await new Promise(r => setTimeout(r, 800));

    // Screenshot empty modal
    await saveScreenshot(page1, '03_upload_certificate_modal_empty.png');

    // 4. Upload the same certificate that Ananya already submitted
    const sampleCertPath = '/home/gaurish/Desktop/Major/v4/uploads/inter_university_sports_badminton.pdf';
    console.log('Triggering file upload for self-duplicate...');
    const [fileChooser1] = await Promise.all([
      page1.waitForFileChooser(),
      page1.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const b = btns.find(x => x.innerText.includes('Choose PDF or Image'));
        if (b) b.click();
      }),
    ]);
    await fileChooser1.accept([sampleCertPath]);

    // Wait for the duplicate alert to render
    await page1.waitForSelector('.border-rose-400', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 2000));

    // Full modal screenshot
    await saveScreenshot(page1, '04_same_student_duplicate_full_modal.png');

    // Cropped focus on the modal card
    const modalEl1 = await page1.$(modalSelector);
    if (modalEl1) {
      await saveScreenshot(modalEl1, '05_same_student_duplicate_banner_zoomed.png');
    }

    // -------------------------------------------------------------
    // PART 2: Priya Patel (Another Student) Submitting Same Certificate (Collusion)
    // -------------------------------------------------------------
    console.log('--- Logging in as Priya Patel (Collusion test) ---');
    const loginPriya = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya@university.edu', password: 'password123' })
    });
    const { token: priyaToken } = await loginPriya.json();

    const page2 = await browser.newPage();
    await page2.goto('http://localhost:3000');
    await page2.evaluate((tok) => {
      localStorage.setItem('activity_portal_token', tok);
    }, priyaToken);
    await page2.goto('http://localhost:3000');
    await page2.waitForSelector('h1', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1200));

    console.log('Opening Upload Modal as Priya...');
    await page2.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.innerText.includes('Upload Certificate'));
      if (b) b.click();
    });

    await page2.waitForSelector(modalSelector, { timeout: 10000 });
    await new Promise(r => setTimeout(r, 800));

    console.log('Triggering file upload for collusion...');
    const [fileChooser2] = await Promise.all([
      page2.waitForFileChooser(),
      page2.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const b = btns.find(x => x.innerText.includes('Choose PDF or Image'));
        if (b) b.click();
      }),
    ]);
    await fileChooser2.accept([sampleCertPath]);

    await page2.waitForSelector('.border-rose-400', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 2000));

    // Full modal screenshot
    await saveScreenshot(page2, '06_collusion_duplicate_full_modal.png');

    // Cropped focus on the modal card
    const modalEl2 = await page2.$(modalSelector);
    if (modalEl2) {
      await saveScreenshot(modalEl2, '07_collusion_alert_zoomed.png');
    }

    console.log('--- ALL 7 SCREENSHOTS CAPTURED SUCCESSFULLY! ---');
  } catch (err) {
    console.error('Error in capture process:', err);
  } finally {
    await browser.close();
  }
}

run();
