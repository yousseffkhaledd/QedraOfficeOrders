# Office order (prototype)

Collect food orders in the office without logins. Everyone types their name,
picks from the menu with extras, and the buyer sees one combined order plus
who owes what.

## Run it

You need Node.js 18+.

Terminal 1, backend (NestJS, port 3000):

    cd backend
    npm install
    npm run start:dev

Terminal 2, frontend (React + Vite, port 5173):

    cd frontend
    npm install
    npm run dev

Open http://localhost:5173. Colleagues on the same network can open
http://YOUR-PC-IP:5173 (Vite prints the address).

## How it works

- Group order: one shared order everyone adds to. Only one is open at a time.
- Person order: one person's part. Submitting returns an edit token that the
  browser keeps in localStorage, so only that browser can change or remove it.
- Prices are copied into the order when it's placed, so menu changes never
  change old orders.
- The backend does all the math (see backend/src/group-orders/pricing.ts):
  line = (item price + extras) x qty; person total = food + delivery fee / people.
- The page refreshes every 4 seconds, so new orders appear for everyone.

## Where things live

    backend/src
      store/            JSON-file "database" (data/db.json) + seed menu
      menu/             GET /api/menu
      group-orders/     group orders, person orders, pricing, DTO validation
    frontend/src
      pages/OrderPage   name, menu, extras dialog, your ticket
      pages/SummaryPage restaurant order, who pays what, close/reopen
      api.js            every API call in one place
      mine.js           remembers your name + edit tokens in this browser

To change the menu for now, edit backend/src/store/seed.ts and delete
backend/data/db.json (it's recreated from the seed on start).

## API

    GET    /api/menu
    GET    /api/group-orders/current
    GET    /api/group-orders            list
    GET    /api/group-orders/:id
    POST   /api/group-orders            { title, deliveryFee?, buyerName? }
    PATCH  /api/group-orders/:id        { deliveryFee?, buyerName? }
    PATCH  /api/group-orders/:id/close
    PATCH  /api/group-orders/:id/reopen
    POST   /api/group-orders/:id/orders           { personName, lines: [{ menuItemId, qty, extraIds?, notes? }] }
    PUT    /api/group-orders/:id/orders/:orderId  header x-edit-token
    DELETE /api/group-orders/:id/orders/:orderId  header x-edit-token
    PATCH  /api/group-orders/:id/orders/:orderId/paid  { paid }
