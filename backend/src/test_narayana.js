const { chromium } = require('playwright');

(async () => {
  console.log('Launching browser to check Narayana website...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();
  
  const url = 'https://branches.narayanaschools.in/narayana-school/education-in-tambaram/education-in-medavakkam/narayana-etechnoschool-in-medavakkam-tambaram--5WKHJr/home';
  try {
    console.log(`Navigating to: ${url}`);
    await page.goto(url, { timeout: 25000, waitUntil: 'commit' });
    await page.waitForTimeout(2000);
    
    const hrefs = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href]')).map(a => a.href);
    });
    
    console.log('\nAll social links found on the page:');
    hrefs.forEach(href => {
      if (href.includes('facebook') || href.includes('instagram') || href.includes('twitter') || href.includes('linkedin') || href.includes('youtube')) {
        console.log(`- ${href}`);
      }
    });
  } catch (err) {
    console.error('Error loading page:', err);
  } finally {
    await browser.close();
  }
})();
