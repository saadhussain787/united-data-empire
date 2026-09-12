const fs = require('fs');
const https = require('https');

const pages = [
  'Premier_League',
  'UEFA_Champions_League',
  'FA_Cup',
  'EFL_Cup',
  'UEFA_Europa_League',
  'FIFA_Club_World_Cup',
  'FA_Community_Shield',
  'Intercontinental_Cup_(football)',
  'UEFA_Cup_Winners%27_Cup',
  'UEFA_Super_Cup'
];

async function fetchImage(page) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${page}&prop=pageimages&format=json&pithumbsize=500`;
  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const pages = json.query.pages;
          const pageId = Object.keys(pages)[0];
          if (pages[pageId].thumbnail) {
            resolve(pages[pageId].thumbnail.source);
          } else {
            resolve(null);
          }
        } catch (e) {
          resolve(null);
        }
      });
    });
  });
}

async function run() {
  const results = {};
  for (const page of pages) {
    results[page] = await fetchImage(page);
  }
  console.log(JSON.stringify(results, null, 2));
}

run();
