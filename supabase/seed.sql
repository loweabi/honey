-- Honey Inventory: DEMO DATA
-- Optional. Run this after schema.sql if you want sample products to try things out.
--
-- Everything here is marked is_demo = true. The app shows a DEMO tag on these rows
-- and has a "Remove demo data" button on the Products page. Do not use demo data
-- as real business records.

with demo_products (name, search_terms, price, stock, low_stock, quick) as (
  values
    ('Coca-Cola 1.5L',         'coke softdrink soft drink',  75.00,  8, 5, true),
    ('Coca-Cola 1L',           'coke softdrink soft drink',  55.00, 12, 5, false),
    ('Coca-Cola Can',          'coke softdrink soft drink',  40.00, 18, 6, true),
    ('Pepsi 1.5L',             'softdrink soft drink',       72.00, 10, 5, false),
    ('Lucky Me Pancit Canton', 'pancit noodles',             15.00, 20, 8, false),
    ('Instant Noodles',        'noodles cup',                13.00, 25, 8, false),
    ('Sardines',               'canned',                     24.00,  4, 5, true),
    ('Coffee',                 'kape sachet',                10.00, 30, 10, true),
    ('Laundry Soap',           'sabon detergent bar',        18.00, 12, 4, true),
    ('Shampoo',                'sachet',                      8.00, 40, 12, false),
    ('Biscuits',               'crackers',                   10.00, 24, 8, false),
    ('Rice (1 kilo)',          'bigas',                      58.00, 50, 10, true)
),
inserted as (
  insert into public.products
    (name, search_terms, selling_price, stock_quantity, low_stock_threshold, is_quick_access, is_demo)
  select name, search_terms, price, stock, low_stock, quick, true
    from demo_products
  returning id, stock_quantity
)
insert into public.stock_movements (product_id, type, quantity, stock_after, reason)
select id, 'RESTOCK', stock_quantity, stock_quantity, 'Demo starting stock'
  from inserted
 where stock_quantity > 0;

-- One demo customer with an existing balance of ₱250 so utang can be tried out.
with demo_customer as (
  insert into public.customers (name, phone, notes, is_demo)
  values ('Juan Dela Cruz', null, 'Demo customer', true)
  returning id
)
insert into public.customer_transactions (customer_id, type, amount, notes, is_demo)
select id, 'UTANG', 250.00, 'Demo balance', true
  from demo_customer;
