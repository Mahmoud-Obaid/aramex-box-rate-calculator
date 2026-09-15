/**
 * Minimal Aramex API proxy — one file, zero dependencies.
 *
 * Why: Aramex's API doesn't send CORS headers, so a browser blocks direct
 * calls to it from a webpage. This tiny server sits in between: your page
 * calls THIS (http://localhost:3001), and this server calls Aramex directly
 * (server-to-server calls aren't subject to CORS), then hands the response
 * back to your page with CORS headers attached.
 *
 * Usage:
 *   node proxy.js
 * Then just open box_classes.html as usual (double-click it) — leave this
 * running in the background while you use the app.
 */

const http = require("http");

const ARAMEX_BASE = "https://ws.aramex.net/ShippingAPI.V2";
const ROUTES = {
  "/api/fetch-cities": "/Location/Service_1_0.svc/json/FetchCities",
  "/api/fetch-states": "/Location/Service_1_0.svc/json/FetchStates",
  "/api/calculate-rate": "/RateCalculator/Service_1_0.svc/json/CalculateRate",
};

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (chunk) => (data += chunk));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  const aramexPath = ROUTES[req.url];

  if (req.method === "OPTIONS" && aramexPath) {
    res.writeHead(204);
    return res.end();
  }

  if (req.method === "POST" && aramexPath) {
    try {
      const body = await readBody(req);
      const aramexRes = await fetch(`${ARAMEX_BASE}${aramexPath}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body,
      });
      const rawText = await aramexRes.text();

      // Aramex sometimes returns XML (fault pages, error responses) even on
      // a /json/ endpoint. Detect that instead of blindly forwarding it as
      // "application/json" and crashing the browser's JSON parser.
      let payload;
      try {
        JSON.parse(rawText);
        payload = rawText;
      } catch (parseErr) {
        console.error(`Aramex returned non-JSON for ${aramexPath}:`, rawText.slice(0, 300));
        payload = JSON.stringify({
          HasErrors: true,
          Notifications: [{
            Code: "NON_JSON_RESPONSE",
            Message: "Aramex returned a non-JSON response (likely an XML fault). Raw start: " + rawText.slice(0, 200),
          }],
        });
      }

      res.writeHead(aramexRes.status, { "Content-Type": "application/json" });
      return res.end(payload);
    } catch (err) {
      res.writeHead(502, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ HasErrors: true, Notifications: [{ Message: err.message }] }));
    }
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(3001, () => {
  console.log("Aramex proxy running at http://localhost:3001 — leave this running, then open box_classes.html");
});
