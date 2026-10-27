// Tells Bing, Yandex and other IndexNow engines that every page in the live sitemap changed.
// Run after a deploy: `npm run indexnow`. The key is public by design (public/<key>.txt).
const site = (process.env.NEXT_PUBLIC_SITE_URL || "https://portfolio.zhyronnebatican.workers.dev").replace(/\/+$/, "");
const key = "f089f5d855a38be5d5f52e76e893d445";

const sitemap = await fetch(`${site}/sitemap.xml`).then((response) => response.text());
const urlList = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);

const response = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: new URL(site).host, key, keyLocation: `${site}/${key}.txt`, urlList }),
});

console.log(`IndexNow: ${response.status} ${response.statusText} for ${urlList.length} URLs`);
if (!response.ok) process.exit(1);
