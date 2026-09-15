Markdown# aramex-box-rate-calculator

Single-page tool for Aramex box-fitting and live shipping rate calculation.

<br>

> A lightweight, single-page web tool for Aramex shipping workflows: browse standard box classes, find the smallest box that fits a set of items using real 3D bin-packing, and get a live shipping rate quote from Aramex — all from a single HTML file plus one small local proxy script.

**No build step, no framework, no database. Just two files.**

---

## 💡 Why This Exists

Aramex's shipping fees depend on package dimensions and weight. This tool helps answer two questions before you ship:
* What's the smallest standard box that fits my items with the least wasted space?
* What will it cost to ship that box from A to B?

---

## ✨ Features

### 1. Aramex API Credentials
Enter your Aramex API credentials once (`Username`, `Password`, `Account Number`, `Account PIN`, `Account Entity`, `Account Country Code`). Click **Save Credentials** and they're locked in and stored in the browser's `localStorage`, so they persist across page reloads and are reused automatically by every other section.

### 2. Origin Address / Destination Address
Two identical address forms (fields per Aramex's `CalculateRate` address schema):
* **Country** — dropdown, built from a static ISO-3166 country list (loads instantly, no API call).
* **City** — dropdown, populated live via Aramex's `FetchCities` once a country is selected.
* **State / Province** — dropdown, populated live via Aramex's `FetchStates`; automatically shows "Not applicable" for countries that don't use states.
* Address Line 1 (required), Line 2, Line 3, Post Code, Building Number, Floor, Apartment, Description.

### 3. Shipment Box & Weight Finder
Pick how many items are in the shipment (1–30), enter each item's Length/Width/Height/Weight. The app runs a 3D bin-packing simulation (guillotine best-fit heuristic, with item rotation) across every standard box to find the smallest one that can actually contain everything — not just a volume estimate, an actual geometric packing check. Shows the winning box, its free space, space utilization %, and the shipment's total weight.

> Changing the item count adds or removes rows without wiping out values you've already entered. A **Reset** button clears the section back to its starting state.

### 4. Smart Box Finder (standalone)
The same box-fitting tool as #3, minus the weight field — useful for a quick "what box do I need" check without going through the full rate flow. A **"Send to Calculate Rate"** button copies its entered items straight into the Shipment Box & Weight Finder section above, so you don't have to re-type anything.

### 5. Aramex Box Class Selector (reference table)
Browse the full list of standard box sizes:
* **Class A (cubes):** $10\times10\times10$ cm up to $100\times100\times100$ cm in 5 cm steps $\rightarrow$ `A-01` to `A-19`
* **Class B (rectangular):** length 20–150 cm (+10 cm steps), width/height 10–75 cm (+5 cm steps) $\rightarrow$ `B-01` to `B-14`

### 6. Calculate Rate
Pulls everything together and calls Aramex's `CalculateRate` API:
* **Product Group** (`DOM`/`EXP`) is computed automatically — `DOM` if Origin and Destination are the same country, `EXP` otherwise.
* **Product Type** is a dropdown that updates live to match the current Product Group (24 Domestic types, 35 Express types, per Aramex's product reference).
* **Payment Type** is fixed to `P` (prepaid).
* **Dimensions and Actual Weight** are pulled directly from the box calculated in the Shipment Box & Weight Finder — no re-entry.
* **Preferred Currency Code** — `JOD` or `USD`.

---

## 🔄 Why There's a Proxy (`proxy.js`)

Aramex's API (`ws.aramex.net`) doesn't send CORS headers, so browsers block direct calls to it from a webpage — this is a browser security rule, not something fixable in client-side JavaScript. 

`proxy.js` is a small Node server that sits in between: the page calls `localhost:3001`, and the proxy forwards that request to Aramex server-to-server (which isn't subject to CORS), then relays the response back with the right headers.

It's **zero-dependency** — built entirely from Node's core `http` module, so no `npm install` is required.

---

## 📁 File Structure

```text
├── box_classes.html    # The entire app — UI, styling, and logic in one file
├── proxy.js            # Local API proxy (only needed for City/State lookups and rate calls)
└── README.md
---

## 🚀 Setup & Usage Requirements:

Node.js 18 or later (needed for proxy.js's built-in fetch()). Check your version with:Bashnode --version
Open a terminal in this folder and run:Bashnode proxy.js
(Leave it running — you should see Aramex proxy running at http://localhost:3001)Open box_classes.html in your browser (double-click it — no server needed for the page itself).Fill in your Aramex credentials at the top and click Save Credentials.Fill in Origin and Destination addresses.Use the Shipment Box & Weight Finder (or Smart Box Finder $\rightarrow$ "Send to Calculate Rate") to determine the box and total weight.In the Calculate Rate section, pick a Product Type and currency, then click Get Shipping Rate.

##🔌 Aramex APIs Used
PurposeEndpointFetch states/provincesLocation/Service_1_0.svc/json/FetchStatesFetch citiesLocation/Service_1_0.svc/json/FetchCitiesCalculate shipping rateRateCalculator/Service_1_0.svc/json/CalculateRate(Country list is static/local — not fetched live, since it rarely changes and avoids an unnecessary API call on every page load.)

## ⚠️ Known Limitations

CalculateRate response shape is assumed: Only the request schema for CalculateRate was available while building this; the result panel looks for a TotalAmount.Value / CurrencyCode field and falls back to showing the raw JSON response if the actual shape differs. Adjust renderRateResult() in box_classes.html once you've seen a real response.Proxy requirement: proxy.js must be running for City, State, and rate-calculation features to work — this is unavoidable given Aramex's API doesn't support browser CORS.Credentials storage: Credentials are stored in browser localStorage in plain form once saved. Fine for local/personal use; don't deploy this as-is to a shared or public-facing environment without adding proper server-side credential handling.

## 🛠️ Tech Stack

Vanilla HTML / CSS / JavaScript (no framework, no build step)Node.js (dependency-free core proxy script)


##👨‍💻 Author

Mahmoud Obaid

Communication Technology Engineer

Senior IT Analyst

GitHub: @Mahmoud-Obaid
