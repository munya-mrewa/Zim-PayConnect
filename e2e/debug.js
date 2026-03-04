const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const response = await page.goto('http://localhost:3000/register');
  console.log('Status:', response.status());
  console.log(await page.content());
  await browser.close();
})();
