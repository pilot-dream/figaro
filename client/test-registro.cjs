const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
    page.on('requestfailed', request => console.log('REQUEST FAILED:', request.url(), request.failure().errorText));
    
    console.log('Navigating to http://localhost:5173/registro...');
    await page.goto('http://localhost:5173/registro', { waitUntil: 'networkidle0' });
    
    console.log('Page loaded. Taking screenshot...');
    await page.screenshot({ path: 'registro-screenshot.png' });
    
    await browser.close();
    console.log('Done.');
  } catch (err) {
    console.error('SCRIPT ERROR:', err);
  }
})();
