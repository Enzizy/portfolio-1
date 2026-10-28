const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://zhyronne.workwithoddly.com";

// Accept a bare host ("example.workers.dev") as well as a full URL.
export const siteUrl = (
  /^https?:\/\//i.test(configuredUrl) ? configuredUrl : `https://${configuredUrl}`
).replace(/\/+$/, "");
