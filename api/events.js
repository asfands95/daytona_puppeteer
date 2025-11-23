export default async function handler(req, res) {
  try {
    const apiKey = process.env.SCRAPINGBEE_KEY;

    // Fetch rendered HTML from ScrapingBee
    const response = await fetch(
      `https://app.scrapingbee.com/api/v1/?api_key=${apiKey}&url=` +
        encodeURIComponent("https://members.daytonachamber.com/events?ce=true") +
        "&render_js=true"
    );

    const html = await response.text();

    // Parse events using simple string extraction
    const events = [];
    const regex = /class="tm-event-item"([\s\S]*?)<\/div>\s*<\/div>/g;
    let match;

    while ((match = regex.exec(html)) !== null) {
      const block = match[1];
      const title = /class="tm-event-name">([^<]+)/.exec(block)?.[1] ?? "";
      const date = /class="tm-event-date">([^<]+)/.exec(block)?.[1] ?? "";
      const link = /href="([^"]+)"/.exec(block)?.[1] ?? "";

      events.push({ title, date, link });
    }

    res.status(200).json({ events });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
}
