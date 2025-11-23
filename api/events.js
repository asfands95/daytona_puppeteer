import { chromium } from "playwright-core";

export default async function handler(req, res) {
  try {
    const browser = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true
    });

    const page = await browser.newPage();

    await page.goto("https://members.daytonachamber.com/events?ce=true", {
      waitUntil: "networkidle"
    });

    await page.waitForTimeout(3000);

    const events = await page.evaluate(() => {
      const items = [...document.querySelectorAll('.tm-event-list .tm-event-item')];
      return items.map(item => {
        const title = item.querySelector('.tm-event-name')?.innerText || "";
        const date = item.querySelector('.tm-event-date')?.innerText || "";
        const link = item.querySelector('a')?.href || "";
        return { title, date, link };
      });
    });

    await browser.close();

    res.status(200).json({ events });

  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
}
