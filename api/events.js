import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  // 1. Setup ScraperBee parameters
  const SCRAPERBEE_API_KEY = process.env.SCRAPERBEE_API_KEY;
  const TARGET_URL = 'https://members.daytonachamber.com/events?ce=true';

  if (!SCRAPERBEE_API_KEY) {
    return res.status(500).json({ error: 'SCRAPERBEE_API_KEY is not set in environment variables.' });
  }

  try {
    // 2. Call ScraperBee
    // We use render_js=true because the target site uses JS to load the calendar.
    // We wait_for the body to ensure the initial load is complete.
    const response = await axios.get('https://app.scraperbee.com/api/v1', {
      params: {
        api_key: SCRAPERBEE_API_KEY,
        url: TARGET_URL,
        render_js: 'true',
        wait_for: 'body', // Wait for the body to be fully present
        premium_proxy: 'false', // Set to true if standard proxies get blocked
      },
    });

    const html = response.data;
    const $ = cheerio.load(html);
    const events = [];

    // 3. Parse HTML
    // Strategy: MemberZone/GrowthZone sites typically use specific "mn-" classes.
    // We look for both list items and calendar event rows to be safe.
    
    // Attempt 1: Look for Listing Items (List View)
    $('.mn-listing, .mn-list-item, .gz-events-card').each((index, element) => {
      const title = $(element).find('.mn-title a, .gz-event-title a, h3').text().trim();
      const date = $(element).find('.mn-date, .gz-event-date, .mn-listing-date').text().trim();
      const link = $(element).find('.mn-title a, .gz-event-title a').attr('href');
      const description = $(element).find('.mn-desc, .mn-listing-desc').text().trim();
      const location = $(element).find('[itemprop="location"], .mn-listing-location').text().trim();

      if (title) {
        events.push({
          title,
          date,
          link: link ? (link.startsWith('http') ? link : `https://members.daytonachamber.com${link}`) : null,
          description,
          location,
          source: 'list-view'
        });
      }
    });

    // Attempt 2: Fallback to Table Rows if List View fails (Calendar View)
    if (events.length === 0) {
      $('.mn-calendar-event').each((index, element) => {
        const title = $(element).find('.mn-event-title').text().trim();
        const date = $(element).find('.mn-event-day').text().trim();
        const link = $(element).find('a').attr('href');

        if (title) {
          events.push({
            title,
            date,
            link: link ? (link.startsWith('http') ? link : `https://members.daytonachamber.com${link}`) : null,
            source: 'calendar-view'
          });
        }
      });
    }

    // 4. Return Data
    res.status(200).json({
      count: events.length,
      events: events,
      debug_info: {
        scraper_status: 'success',
        found_method: events.length > 0 ? events[0].source : 'none'
      }
    });

  } catch (error) {
    console.error('Scraping Error:', error.message);
    res.status(500).json({
      error: 'Failed to scrape events',
      details: error.response ? error.response.data : error.message
    });
  }
}
