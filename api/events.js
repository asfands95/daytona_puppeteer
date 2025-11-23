import * as cheerio from "cheerio";

export default async function handler(req, res) {
  try {
    const apiKey = process.env.SCRAPINGBEE_KEY;

    // Use the printable calendar version (very stable and static HTML)
    const targetUrl =
      "https://members.daytonachamber.com/events?ce=true";

    // Enable JS just in case, but print view normally does not need it
    const scrapingBeeUrl =
      `https://app.scrapingbee.com/api/v1/?api_key=${apiKey}` +
      `&url=${encodeURIComponent(targetUrl)}` +
      `&render_js=1`;

    const response = await fetch(scrapingBeeUrl);
    const html = await response.text();

    // Load full HTML into Cheerio
    const $ = cheerio.load(html);

    const events = [];

    // Daytona Chamber print calendar uses this selector:
    $(".em-event-card").each((i, el) => {
      const title = $(el).find(".em-event-title").text().trim();
      const date = $(el).find(".em-event-date").text().trim();
      let link = $(el).find("a").attr("href") || "";

      if (link && !link.startsWith("http")) {
        link = "https://members.daytonachamber.com" + link;
      }

      events.push({ title,
