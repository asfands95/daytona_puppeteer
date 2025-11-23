import chromium from "playwright-aws-lambda";

export default async function handler(req, res) {
  let browser = null;

  try {
    // Launch Playwright Chromium
    browser = await chromium.launch({
      headless: true,
      args: chromium.args,
      executablePath: await chromium.executablePath,
    });

    const page = await browser.newPage();

    // Load the events page
    await page.goto("https://members.daytonachamber.com/events?ce=true", {
      waitUntil: "networkidle",
    });

    // Wait for event cards to load
    await page.waitForSelector(".mn-event-card", { timeout: 15000 });

    // Scrape events
    const events = await page.evaluate(() => {
      const cards = document.querySelectorAll(".mn-event-card");
      return Array.from(cards).map(card => ({
        title: card.querySelector(".mn-event-card__title")?.innerText.trim() || "",
        date: card.querySelector(".mn-event-card__date")?.innerText.trim() || "",
        time: card.querySelector(".mn-event-card__time")?.innerText.trim() || "",
        location: card.querySelector(".mn-event-card__location")?.innerText.trim() || "",
        link: card.querySelector("a")?.href || ""
      }));
    });

    res.status(200).json({ events });

  } catch (err) {
    console.error("SCRAPER ERROR:", err);
    res.status(500).json({ error: err.toString() });
  } finally {
    if (browser) await browser.close();
  }
}
