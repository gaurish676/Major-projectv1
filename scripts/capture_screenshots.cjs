const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendCDP(ws, method, params = {}) {
  const id = Math.floor(Math.random() * 1000000);
  return new Promise((resolve, reject) => {
    const handler = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id === id) {
        ws.removeEventListener('message', handler);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
    ws.addEventListener('message', handler);
    ws.send(JSON.stringify({ id, method, params }));
  });
}

async function capture() {
  const outDir = path.join(__dirname, '../presentation_assets');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 1. Launch headless chrome
  const chromeProc = spawn('/usr/bin/google-chrome', [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--remote-debugging-port=9222',
    '--user-data-dir=/tmp/chrome-profile-' + Date.now(),
    '--window-size=1440,900',
    'about:blank'
  ], { stdio: 'ignore' });

  await wait(2000);

  try {
    // 2. Discover target ws url
    const versionRes = await fetch('http://127.0.0.1:9222/json/version');
    const versionData = await versionRes.json();
    const wsUrl = versionData.webSocketDebuggerUrl;

    const listRes = await fetch('http://127.0.0.1:9222/json/list');
    const pages = await listRes.json();
    const pageWsUrl = pages[0].webSocketDebuggerUrl;

    const ws = new WebSocket(pageWsUrl);
    await new Promise(res => ws.addEventListener('open', res));

    await sendCDP(ws, 'Page.enable');
    await sendCDP(ws, 'Runtime.enable');
    await sendCDP(ws, 'Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
      mobile: false
    });

    // Helper to capture a screenshot of a route with a specific auth token
    async function capturePage(url, token, filename, waitMs = 3000, evalBeforeShot = null) {
      console.log(`Navigating to ${url}...`);
      await sendCDP(ws, 'Page.navigate', { url: 'http://localhost:3000/login' });
      await wait(1500);

      // Inject token into localStorage
      if (token) {
        await sendCDP(ws, 'Runtime.evaluate', {
          expression: `localStorage.setItem('activity_portal_token', '${token}');`
        });
      }

      await sendCDP(ws, 'Page.navigate', { url });
      await wait(waitMs);

      if (evalBeforeShot) {
        await sendCDP(ws, 'Runtime.evaluate', { expression: evalBeforeShot });
        await wait(1000);
      }

      const shotRes = await sendCDP(ws, 'Page.captureScreenshot', { format: 'png' });
      const filePath = path.join(outDir, filename);
      fs.writeFileSync(filePath, Buffer.from(shotRes.data, 'base64'));
      console.log(`Saved screenshot: ${filePath} (${fs.statSync(filePath).size} bytes)`);
    }

    // Get tokens for users
    const studentLogin = await (await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'gaurish@university.edu', password: 'password123' })
    })).json();

    const mentorLogin = await (await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'aishwarya@university.edu', password: 'password123' })
    })).json();

    const hodLogin = await (await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hod@university.edu', password: 'password123' })
    })).json();

    // 1. Capture Student UpdateMarks showing 10th & 12th records
    await capturePage(
      'http://localhost:3000/update-marks',
      studentLogin.token,
      'screenshot_10th_12th_marks.png',
      3500,
      `window.scrollTo(0, 450);`
    );

    // 2. Capture Mentor Placement Eligibility Matrix
    await capturePage(
      'http://localhost:3000/mentor/placement-eligibility',
      mentorLogin.token,
      'screenshot_placement_matrix.png',
      3500
    );

    // 3. Capture Mentor Student Marks (with MSE counseling triggers)
    await capturePage(
      'http://localhost:3000/mentor/student-marks',
      mentorLogin.token,
      'screenshot_mentor_mse_marks.png',
      3500
    );

    // 4. Capture Coordinator Master Sheet & Logisys ERP Export
    await capturePage(
      'http://localhost:3000/hod/coordinator-sheet',
      hodLogin.token,
      'screenshot_coordinator_logisys.png',
      3500
    );

    // 5. Capture Student Dashboard with clearance meter & submit modal open
    await capturePage(
      'http://localhost:3000/dashboard',
      studentLogin.token,
      'screenshot_student_dashboard.png',
      3000
    );

    // 6. Capture Review Submissions
    await capturePage(
      'http://localhost:3000/mentor/review',
      mentorLogin.token,
      'screenshot_mentor_review.png',
      3500
    );

    ws.close();
  } catch (err) {
    console.error('Error capturing screenshots:', err);
  } finally {
    chromeProc.kill();
  }
}

capture();
