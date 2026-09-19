# Leville Rentals & Transportation

A rental-counter application and digital contract generator. It runs entirely in
the browser — no build step, no server, no dependencies to install. Open
`index.html` and it works.

---

## Running it

**On this machine**

Double-click `index.html`. Everything works from `file://` except a few browser
features that need a real origin (see *Serving it* below).

**On a phone or tablet** — the way it is meant to be used at the curb

Serve the folder over your local network and open the address on the device:

```
cd "C:\Developer\Neville and Son Rental"
python -m http.server 8080
```

Then browse to `http://<your-computer's-LAN-IP>:8080` from the phone. On iOS or
Android, use *Add to Home Screen* and it behaves like an installed app.

**Serving it (rather than opening the file) matters for:**

- `sms:` and `mailto:` handoff when sending a contract
- the native share sheet (`navigator.share`, which requires HTTPS or localhost)
- clipboard writes

Printing, signatures, the damage diagram and all data storage work either way.

---

## What it does

### Fleet

Vehicles are reusable profiles: year, make, model, trim, color, VIN, plate,
state, seats, class, odometer, daily rate, weekly rate, notes. Add a BMW or a
Tahoe once and pick it on every future contract — the rates and odometer load
automatically and stay adjustable per rental.

Status is derived, not typed: a vehicle is **on rent** whenever it has an active
contract, **available** otherwise, and **in service** when you mark it so.

### Writing a contract

One long form rather than a wizard, with a running total pinned to the bottom of
the screen throughout.

| Section | What it captures |
|---|---|
| 1. Vehicle | Picker over the fleet; rented and in-service vehicles are disabled |
| 2. Renter | Name, DOB, license number/state/expiry, phone, email, address |
| 3. Dates and rate | Date pickers, duration, daily/weekly rate controls |
| 4. Insurance | Company-provided (per-day fee) or self-insured |
| 5. Condition at pickup | Fuel gauge, odometer, damage diagram |
| 6. Deposit and charges | Deposit, extra line items, live ledger |
| 7. Terms | Full clause text plus renter acknowledgements |
| 8. Signature | Touch or mouse signature pad |

**Age check.** Date of birth is validated against the *pickup date*, not today.
Under the minimum age (21 by default) the contract cannot be signed. License
expiry is checked against the return date and flagged if it falls short.

**Rate calculation.** Duration comes from the two dates. In *Automatic* mode a
14-day rental bills as 2 weeks; a 10-day rental bills as 1 week plus 3 days at
the daily rate. *Daily* and *Weekly* force one or the other. Rate controls move
on the increment grid the business uses — **$25 a day, $50 a week** — via the
slider or the ± buttons, with a typed field for anything off-grid.

**Insurance.** Company coverage is billed per day for the whole term. Choosing
self-insurance opens a required panel: insurance company, policy number, a file
attachment for the declarations page, and an agent confirmation that a valid
policy was seen. None of it can be skipped, and an extra acknowledgement is
added to the contract.

**Fuel and damage.** The fuel gauge is a real gauge face with five stops
(E, ¼, ½, ¾, F) and keyboard support. The damage diagram is a five-view vehicle
schematic — roof plan, both sides, front, rear, plus a notes strip — with draw,
circle, X and text-note tools. Marks are stored as vectors in a fixed coordinate
space, so the same record renders crisply on a phone, on screen, and on paper.

### Legal clauses

Fifteen numbered clauses are generated from the live contract, so they state
*this* rental's actual deposit, insurance fee, dates and inspection schedule.
The three the business cares most about are set off with a rule on the page:

- **Tolls** — the renter is liable for every toll and toll-by-mail invoice, and
  tolls are itemized at check-in and deducted from the deposit. Invoices that
  arrive after settlement remain payable.
- **Security deposit** — $150 by default, applied in a stated order (tolls, fuel
  shortfall, cleaning, damage, late return, unpaid balance), with the balance
  returned within 7 business days and an itemized settlement printed on the
  contract.
- **Monthly inspection** — any rental over 30 days requires the vehicle to be
  presented every 30 days. The contract computes how many inspections are due
  and prints the date of the first one.

### Signing, printing, sending

The signature pad takes a finger on a phone or tablet and a mouse on a desktop.
Signing writes the contract, marks the vehicle as out, and offers the send sheet.

**Sending** hands off to whatever the device already has, because there is no
mail server behind this app:

| Route | Phone | Tablet | Desktop |
|---|---|---|---|
| Text message (`sms:`) | ✅ | — | — |
| Email (`mailto:`) | ✅ | ✅ | ✅ |
| Native share sheet | ✅ | ✅ | where supported |
| Copy full text | ✅ | ✅ | ✅ |
| Print / save PDF | ✅ | ✅ | ✅ |

Texting is offered only on devices that can actually text; on a tablet the panel
says so and points at email instead. Both routes are prefilled from the renter's
record, and a preview shows exactly what will be sent before you send it. You
choose a short **summary** (fits a text message) or the **full agreement** as
plain text. Every send is logged on the contract.

For a copy carrying the signature image and the damage diagram, use **Print →
Save as PDF** and attach it.

### Check-in

Closing a rental records return fuel and odometer, lets you mark new damage on
the same diagram, and itemizes tolls and other charges. The deposit settlement
computes live and prints on the contract. If deductions exceed the deposit, the
balance due is called out rather than silently clamped to zero.

### Dashboard

Vehicles on rent, revenue this month, deposits held, and fleet utilization;
revenue by month for the trailing six months; everything out on the road sorted
by how soon it is due back with overdue flagged; fleet status; recently closed
rentals.

---

## Data

Everything is stored in this browser's `localStorage` under `lrt.db.v2`. It does
not sync between devices — a contract written on the phone stays on the phone.

**Settings → Data** has *Export backup* (a JSON file) and *Import backup* to move
between devices, plus *Clear sample contracts* once you start entering real ones.

The app ships with a six-vehicle demo fleet and seven sample contracts so the
dashboard opens on a working business. They are all flagged `sample: true`.

### Moving to a shared backend

`assets/js/store.js` is the only module that touches storage. Replace its
private `read()` and `write()` with calls to a server and nothing else in the
app changes — every other module goes through the `LRT.store` API.

---

## Project layout

```
index.html                 markup shell, nav, script order
assets/css/app.css         design tokens, app chrome, all components
assets/css/contract.css    the contract sheet — black on white, print rules
assets/js/util.js          dates, money, duration maths, toasts
assets/js/store.js         persistence, seed data, totals, reporting
assets/js/canvas.js        damage diagram, signature pad, fuel gauge
assets/js/ui.js            icons, modals, form controls, rate control
assets/js/terms.js         the fifteen clauses and the acknowledgements
assets/js/doc.js           renders a contract as the printable sheet
assets/js/share.js         text / email / share-sheet handoff
assets/js/views.js         dashboard, fleet, contract list, check-in
assets/js/builder.js       the contract form
assets/js/app.js           hash router, shell wiring, settings
```

Plain ES5-style scripts on purpose — no modules, no bundler — so the app also
runs from `file://` with no CORS complaints.

---

## Design notes

Blue accent (`--accent`) on cool blue-biased neutrals, with semantic colors held
in reserve for state (available / on rent / in service, overdue, deposit
shortfall) so they never read as decoration. Archivo for the interface, IBM Plex
Mono for the data a rental counter reads aloud — VIN, plate, contract number,
money — and Source Serif for the contract itself.

The app follows the device's light/dark setting and can be pinned either way in
Settings. **The contract sheet is deliberately exempt**: it is always black ink
on white paper, on screen and on the printer.

Printing is set up for US Letter with page-break protection on articles,
clauses, condition boxes and the signature block.
