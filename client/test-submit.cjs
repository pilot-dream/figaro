const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
    
    console.log('Navigating to http://localhost:5173/registro...');
    await page.goto('http://localhost:5173/registro', { waitUntil: 'networkidle0' });
    
    console.log('Filling form...');
    await page.type('input[type="text"]', 'Joao Vitor');
    await page.type('input[type="tel"]', '11999999999');
    await page.type('input[type="email"]', 'joao.test' + Date.now() + '@gmail.com');
    await page.type('input[type="password"]', '123456');
    
    console.log('Clicking submit...');
    await page.click('button[type="submit"]');
    
    console.log('Waiting 5 seconds...');
    await new Promise(r => setTimeout(r, 5000));
    
    console.log('Taking screenshot...');
    await page.screenshot({ path: 'registro-submit-screenshot.png' });
    
    await browser.close();
    console.log('Done.');
  } catch (err) {
    console.error('SCRIPT ERROR:', err);
  }
})();
