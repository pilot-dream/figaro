const puppeteer = require('puppeteer');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => {
    console.log('BROWSER ERROR:', err.toString());
  });
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
  });

  console.log('Navigating to vercel app...');
  await page.goto('https://figaro-omega.vercel.app/filipe-lacerda-', { waitUntil: 'networkidle2' });
  
  console.log('Waiting for service card...');
  // Find a service card. In BarberBookingPage, we added a group class or cursor-pointer class
  await page.waitForSelector('.cursor-pointer', { timeout: 10000 });
  
  console.log('Clicking the service card...');
  await page.click('.cursor-pointer');
  
  console.log('Waiting 3 seconds to see if it crashes...');
  await new Promise(r => setTimeout(r, 3000));
  
  console.log('Done.');
  await browser.close();
})().catch(console.error);
