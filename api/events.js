import puppeteer from "puppeteer";

export default async function handler(req, res) {
  const url = "https://members.daytonachamber.com/events?ce=true";

  // scrape current month + next 3 months
  const MONTHS_TO_SCRAPE = 4;

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    let allEvents = [];

    for (let i = 0; i < MONTHS_TO_SCRAPE; i++) {

      await page.waitForSelector(".fc-event", { timeout: 15000 });

      const events = await page.evaluate(() => {
        const elements = Array.from(document.querySelectorAll(".fc-event"));
        
        return elements.map((el) => ({
          title: el.querySelector(".fc-title")?.innerText.trim() || "",
          time: el.querySelector(".fc-time")?.innerText.trim() || "",
          date: el.getAttribute("data-date") || "",
          description: el.getAttribute("title") || el.innerText.trim(),
          url: el.querySelector("a")?.href || null
        }));
      });

      allEvents.push(...events);

      const nextBtn = await page.$(".fc-next-button");
      if (!nextBtn) break;

      await nextBtn.click();
      await page.waitForTimeout(3000);
    }

    await browser.close();

    res.setHeader("Cache-Control", "s-maxage=86400, stale-while-revalidate=86400");
    return res.status(200).json({ events: allEvents });

  } catch (err) {
    console.error("Scraper error:", err);
    return res.status(500).json({ error: err.toString() });
  }
}
