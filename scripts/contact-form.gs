/**
 * Google Apps Script for the portfolio contact form.
 *
 * Setup (once):
 * 1. Paste this file into an Apps Script project (from a Google Sheet's Extensions -> Apps Script,
 *    or a standalone project, which creates a "Portfolio inquiries" sheet in your Drive).
 * 2. Project Settings -> Script properties -> add CONTACT_SECRET with a long random value.
 *    Put the same value in Cloudflare as the CONTACT_SCRIPT_SECRET secret.
 * 3. Run `setup` once from the editor to grant permissions; the log shows the sheet's link.
 * 4. Deploy -> New deployment -> Web app. Execute as: Me. Who has access: Anyone.
 *    Put the web app URL in Cloudflare as the CONTACT_SCRIPT_URL secret.
 *
 * The portfolio validates and rate-limits submissions before calling this script; the
 * secret stops anyone else from posting to it directly.
 */

const NOTIFY_EMAIL = "zhyronnebatican@gmail.com";
const SHEET_NAME = "Inquiries";

function doPost(e) {
  let data;
  try {
    data = JSON.parse(e.postData.contents);
  } catch (error) {
    return respond({ ok: false, error: "invalid-json" });
  }

  const secret = PropertiesService.getScriptProperties().getProperty("CONTACT_SECRET");
  if (!secret || data.secret !== secret) return respond({ ok: false, error: "unauthorized" });

  const name = clean(data.name, 80);
  const email = clean(data.email, 160);
  const projectType = clean(data.projectType, 80);
  const message = clean(data.message, 3000);
  if (!name || !email || !projectType || !message) return respond({ ok: false, error: "missing-fields" });

  inquiriesSheet().appendRow([new Date(), name, email, projectType, message].map(asText));

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    replyTo: email,
    name: "Portfolio contact form",
    subject: `Portfolio inquiry: ${projectType} — ${name}`,
    body: `Name: ${name}\nEmail: ${email}\nProject type: ${projectType}\n\n${message}`,
  });

  return respond({ ok: true });
}

// Run once from the editor: asks for permissions, creates the sheet if needed, logs its link.
function setup() {
  const sheet = inquiriesSheet();
  MailApp.getRemainingDailyQuota();
  const hasSecret = Boolean(PropertiesService.getScriptProperties().getProperty("CONTACT_SECRET"));
  console.log(`Inquiries sheet: ${sheet.getParent().getUrl()}`);
  console.log(hasSecret ? "CONTACT_SECRET is set." : "CONTACT_SECRET is missing: add it in Project Settings.");
}

function inquiriesSheet() {
  // A script opened from a Sheet uses that Sheet; a standalone one creates its own once.
  const properties = PropertiesService.getScriptProperties();
  let spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    const id = properties.getProperty("SHEET_ID");
    spreadsheet = id ? SpreadsheetApp.openById(id) : SpreadsheetApp.create("Portfolio inquiries");
    properties.setProperty("SHEET_ID", spreadsheet.getId());
  }
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
    sheet.appendRow(["Received", "Name", "Email", "Project type", "Message"]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function clean(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

// A leading = + - or @ would make Sheets treat a visitor's text as a formula.
function asText(value) {
  return typeof value === "string" && /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function respond(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}
