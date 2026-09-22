# Honey Inventory

A mobile-first web app for a small family store. Open it, search a product, see the price, add it to the sale, take payment (or record utang), and stock updates on its own.

Built with React, TypeScript, Vite, Tailwind CSS and Supabase (PostgreSQL). Needs Node 20.19 or newer.

## Set up (about 15 minutes)

1. **Create a Supabase project** at supabase.com.
2. **Create the database.** Dashboard > SQL Editor > New query. Paste all of `supabase/schema.sql` and press Run. Run it once only.
3. **(Optional) Load demo products** by running `supabase/seed.sql` the same way. Everything in it is marked DEMO. Remove it later with the *Remove demo data* button on the Products page.
4. **Add the family's logins.** Dashboard > Authentication > Users > Add user (email and password). Then Authentication > Sign In / Providers, and turn **off** "Allow new users to sign up", so strangers cannot create accounts.
5. **Connect the app.** Copy `.env.example` to `.env`. Fill in the Project URL and anon key from Project Settings > API.
6. Run:

```bash
npm install
npm run dev        # open the address it prints, on a phone too (same Wi-Fi)
npm test           # unit tests for search, sale math, validation
npm run build      # production build in dist/
```

To put it online, import the repo into Vercel, add the same two `VITE_` variables, and deploy. On a phone, "Add to Home Screen" makes it open like an app.

## How it works

- **Home** is the counter: search (partial words, any order, nicknames like "coke"), Quick sell tiles, a live sale total, PAID with change or UTANG to a customer.
- **Products** are added with just name, price and stock. Star up to 9 for Quick sell. Products are archived, never deleted, so old sales stay correct.
- **Sales** shows today's total, items sold, outstanding utang and low stock, then the history.
- **Utang** shows who owes what, with a running ledger, payments, and manual utang.
- **Stock** has the end-of-day physical count (type only what you counted), a low stock list, and the full stock history.

## Rules the database enforces

Sales, stock and utang change only through database functions in `schema.sql`, each all-or-nothing:

- `confirm_sale` re-checks stock, takes prices from the products table (not the phone), refuses if a price changed mid-sale, deducts stock, writes stock history, and adds to the customer's balance for utang. Two phones selling the last item cannot both succeed.
- `add_stock`, `apply_stock_counts`, `create_product`, `record_customer_transaction` do the same for their jobs.
- Every stock change leaves a row in `stock_movements`. A customer's balance is the sum of their ledger rows, so it cannot drift.
- Stock cannot go below zero. Payments cannot exceed the balance.

## Left out on purpose

Voiding or editing a finished sale, fractional quantities (half a kilo), barcode scanning, receipts, multiple stores, user roles. Corrections today go through a stock count or an utang adjustment.
