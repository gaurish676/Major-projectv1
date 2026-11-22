const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = '/home/gaurish/.gemini/antigravity-cli/brain/2ecec5ac-5d56-431e-8bfa-03deb8f9d4ed/screenshots';
const ASSETS_DIR = '/home/gaurish/Desktop/Major/v4/presentation_assets';

fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
fs.mkdirSync(ASSETS_DIR, { recursive: true });

async function saveScreenshot(page, filename, elementOrClip = null) {
  const p1 = path.join(ARTIFACT_DIR, filename);
  const p2 = path.join(ASSETS_DIR, filename);
  if (elementOrClip) {
    await elementOrClip.screenshot({ path: p1 });
    await elementOrClip.screenshot({ path: p2 });
  } else {
    await page.screenshot({ path: p1 });
    await page.screenshot({ path: p2 });
  }
  console.log(`Saved screenshot: ${filename}`);
}

async function run() {
  const browser = await puppeteer.launch({
    executablePath: '/usr/bin/google-chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--window-size=1440,1000'],
    defaultViewport: { width: 1440, height: 1000, deviceScaleFactor: 2 },
  });

  try {
    // ----------------------------------------------------------------------
    // TEST 1: Same Student Uploading Same Certificate Again (Self-Duplicate)
    // ----------------------------------------------------------------------
    console.log('--- Step 1: Logging in as Rahul Verma ---');
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'rahul@university.edu', password: 'password123' })
    });
    const { token: rahulToken } = await loginRes.json();

    const page = await browser.newPage();
    await page.goto('http://localhost:3000');
    await page.evaluate((tok) => {
      localStorage.setItem('activity_portal_token', tok);
    }, rahulToken);
    await page.goto('http://localhost:3000');

    // Wait for Dashboard to render
    await page.waitForSelector('h1', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1500));

    // Screenshot 1: Student Dashboard
    await saveScreenshot(page, '01_student_dashboard_overview.png');

    // Open Submit Activity Modal by clicking "Upload Certificate"
    console.log('--- Step 2: Opening Upload Certificate Modal ---');
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.innerText.includes('Upload Certificate'));
      if (b) b.click();
    });

    // Wait for modal to render
    await page.waitForSelector('input[type="file"]', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 800));

    // Screenshot 2: Initial Modal before upload
    await saveScreenshot(page, '02_upload_certificate_modal.png');

    // Certificate that Rahul already has approved in the database:
    // "Annual College Orientation Yoga & Fitness Sprint" (inter_university_sports_badminton.pdf)
    const sampleCertPath = '/home/gaurish/Desktop/Major/v4/uploads/inter_university_sports_badminton.pdf';
    console.log(`--- Step 3: Uploading duplicate certificate: ${sampleCertPath} ---`);
    
    const fileInput = await page.$('input[type="file"]');
    await fileInput.uploadFile(sampleCertPath);

    // Wait for the duplicate warning banner to appear
    console.log('Waiting for duplicate warning banner...');
    await page.waitForSelector('.border-rose-400', { timeout: 15000 });
    // Let animations settle and AI preview render
    await new Promise(r => setTimeout(r, 2000));

    // Screenshot 3: Modal with Red Duplicate Certificate Alert Banner and Blocked Button
    await saveScreenshot(page, '03_same_student_duplicate_modal.png');

    // Screenshot 4: Cropped Focus on Modal Card
    const modalContent = await page.$('.relative.w-full.max-w-2xl');
    if (modalContent) {
      await saveScreenshot(page, '04_same_student_duplicate_alert_focus.png', modalContent);
    }

    // ----------------------------------------------------------------------
    // TEST 2: Another Student Uploading the Same Event Certificate (Collusion)
    // ----------------------------------------------------------------------
    console.log('--- Step 4: Logging in as Priya Patel (Collusion test) ---');
    const loginPriya = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya@university.edu', password: 'password123' })
    });
    const { token: priyaToken } = await loginPriya.json();

    const page2 = await browser.newPage();
    await page2.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 2 });
    await page2.goto('http://localhost:3000');
    await page2.evaluate((tok) => {
      localStorage.setItem('activity_portal_token', tok);
    }, priyaToken);
    await page2.goto('http://localhost:3000');

    await page2.waitForSelector('h1', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 1500));

    // Open Upload Modal for Priya
    await page2.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const b = btns.find(x => x.innerText.includes('Upload Certificate'));
      if (b) b.click();
    });

    await page2.waitForSelector('input[type="file"]', { timeout: 10000 });
    await new Promise(r => setTimeout(r, 800));

    console.log('Uploading certificate already submitted by Rahul as Priya...');
    const fileInput2 = await page2.$('input[type="file"]');
    await fileInput2.uploadFile(sampleCertPath);

    await page2.waitForSelector('.border-rose-400', { timeout: 15000 });
    await new Promise(r => setTimeout(r, 2000));

    // Screenshot 5: Collusion warning modal
    await saveScreenshot(page2, '05_collusion_duplicate_warning_modal.png');

    // Screenshot 6: Collusion card focus
    const modalContent2 = await page2.$('.relative.w-full.max-w-2xl');
    if (modalContent2) {
      await saveScreenshot(page2, '06_collusion_alert_focus.png', modalContent2);
    }

    console.log('ALL SCREENSHOTS CAPTURED AND SAVED SUCCESSFULLY!');
  } catch (err) {
    console.error('Error during capture:', err);
  } finally {
    await browser.close();
  }
}

run();
