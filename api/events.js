import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req, res) {
  const SCRAPERBEE_API_KEY = process.env.SCRAPERBEE_API_KEY;
  if (!SCRAPERBEE_API_KEY) {
    return res.status(500).json({ error: 'SCRAPERBEE_API_KEY is missing in Vercel settings' });
  }

  try {
    const response = await axios.get('https://app.scraperbee.com/api/v1', {
      params: {
        api_key: SCRAPERBEE_API_KEY,
        url: 'https://members.daytonachamber.com/events?ce=true',
        render_js: 'true',
        block_resources: 'true', 
        block_ads: 'true',
        wait_for: '.mn-listing', 
        timeout: 25000 
      },
    });

    const $ = cheerio.load(response.data);
    const events = [];

    $('.mn-listing').each((i, el) => {
      const title = $(el).find('.mn-title a').text().trim();
      let link = $(el).find('.mn-title a').attr('href');
      const date = $(el).find('.mn-date').text().trim();
      const desc = $(el).find('.mn-desc').text().trim();
      const loc = $(el).find('[itemprop="location"]').text().trim() || $(el).find('.mn-listing-location').text().trim();

      if (link && !link.startsWith('http')) {
        link = `https://members.daytonachamber.com${link}`;
      }

      if (title) {
        events.push({ title, date, link, description: desc, location: loc });
      }
    });

    res.status(200).json({ count: events.length, events });

  } catch (error) {
    console.error('Scraper Error:', error.message);
    res.status(500).json({ 
      error: 'Failed to scrape events', 
      details: error.message,
      scraper_response: error.response?.data 
    });
  }
}
