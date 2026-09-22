-- Honey Inventory: database schema
-- Run this whole file once in the Supabase SQL Editor (Dashboard > SQL Editor > New query).
-- It is safe to read top to bottom: tables, then security, then the functions the app calls.

-- =====================================================================
-- TABLES
-- =====================================================================

create table public.products (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null check (length(btrim(name)) > 0),
  -- Optional nicknames used only for searching, e.g. "coke" for Coca-Cola.
  search_terms        text,
  selling_price       numeric(12,2) not null check (selling_price >= 0),
  stock_quantity      integer not null default 0 check (stock_quantity >= 0),
  low_stock_threshold integer not null default 5 check (low_stock_threshold >= 0),
  is_quick_access     boolean not null default false,
  -- Products are archived (is_active = false), never deleted, so old sales stay intact.
  is_active           boolean not null default true,
  -- True for sample data from seed.sql so it can be found and removed later.
  is_demo             boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Two active products cannot share a name (upper/lower case ignored).
create unique index products_active_name_key
  on public.products (lower(btrim(name))) where is_active;

create table public.customers (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (length(btrim(name)) > 0),
  phone      text,
  notes      text,
  is_demo    boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.sales (
  id            uuid primary key default gen_random_uuid(),
  total_amount  numeric(12,2) not null check (total_amount >= 0),
  payment_type  text not null check (payment_type in ('PAID', 'UTANG')),
  cash_received numeric(12,2),
  change_amount numeric(12,2),
  customer_id   uuid references public.customers (id),
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users (id) on delete set null default auth.uid(),
  constraint sales_utang_needs_customer
    check (payment_type <> 'UTANG' or customer_id is not null)
);

create index sales_created_at_idx on public.sales (created_at desc);

-- Each line remembers the name and price at the time of the sale.
-- Changing a product's price later never changes old sales.
create table public.sale_items (
  id           uuid primary key default gen_random_uuid(),
  sale_id      uuid not null references public.sales (id) on delete cascade,
  product_id   uuid not null references public.products (id),
  product_name text not null,
  quantity     integer not null check (quantity > 0),
  unit_price   numeric(12,2) not null check (unit_price >= 0),
  subtotal     numeric(12,2) not null check (subtotal >= 0)
);

create index sale_items_sale_idx on public.sale_items (sale_id);
create index sale_items_product_idx on public.sale_items (product_id);

-- The utang ledger. Amounts are signed: utang is +, payments are -.
-- A customer's balance is the sum of their rows, so it can never drift.
create table public.customer_transactions (
  id                uuid primary key default gen_random_uuid(),
  customer_id       uuid not null references public.customers (id),
  type              text not null check (type in ('UTANG', 'PAYMENT', 'ADJUSTMENT')),
  amount            numeric(12,2) not null check (amount <> 0),
  reference_sale_id uuid references public.sales (id),
  notes             text,
  is_demo           boolean not null default false,
  created_at        timestamptz not null default now(),
  created_by        uuid references auth.users (id) on delete set null default auth.uid(),
  constraint customer_transactions_sign check (
    (type = 'UTANG' and amount > 0) or (type = 'PAYMENT' and amount < 0) or type = 'ADJUSTMENT'
  )
);

create index customer_transactions_customer_idx
  on public.customer_transactions (customer_id, created_at desc);

-- Every change to stock leaves a row here. quantity is signed (+ in, - out).
-- stock_after is the stock right after the change, so "expected" = stock_after - quantity.
create table public.stock_movements (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references public.products (id),
  type              text not null check (type in ('SALE', 'RESTOCK', 'ADJUSTMENT')),
  quantity          integer not null check (quantity <> 0),
  stock_after       integer not null check (stock_after >= 0),
  reference_sale_id uuid references public.sales (id),
  reason            text,
  created_at        timestamptz not null default now(),
  created_by        uuid references auth.users (id) on delete set null default auth.uid()
);

create index stock_movements_product_idx
  on public.stock_movements (product_id, created_at desc);
create index stock_movements_created_at_idx
  on public.stock_movements (created_at desc);

create view public.customer_balances
with (security_invoker = true) as
select c.id,
       c.name,
       c.phone,
       c.notes,
       c.is_demo,
       c.created_at,
       coalesce(sum(t.amount), 0)::numeric(12,2) as balance,
       max(t.created_at) as last_activity
from public.customers c
left join public.customer_transactions t on t.customer_id = c.id
group by c.id;

create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- =====================================================================
-- SECURITY
-- Only signed-in users can see anything. Sales, stock and the utang ledger
-- can only be changed through the functions further down, never directly.
-- =====================================================================

alter table public.products              enable row level security;
alter table public.customers             enable row level security;
alter table public.sales                 enable row level security;
alter table public.sale_items            enable row level security;
alter table public.customer_transactions enable row level security;
alter table public.stock_movements       enable row level security;

create policy "Signed-in users can read" on public.products
  for select to authenticated using (true);
create policy "Signed-in users can read" on public.customers
  for select to authenticated using (true);
create policy "Signed-in users can read" on public.sales
  for select to authenticated using (true);
create policy "Signed-in users can read" on public.sale_items
  for select to authenticated using (true);
create policy "Signed-in users can read" on public.customer_transactions
  for select to authenticated using (true);
create policy "Signed-in users can read" on public.stock_movements
  for select to authenticated using (true);

create policy "Signed-in users can edit products" on public.products
  for update to authenticated using (true) with check (true);
create policy "Signed-in users can add customers" on public.customers
  for insert to authenticated with check (true);
create policy "Signed-in users can edit customers" on public.customers
  for update to authenticated using (true) with check (true);

revoke all on public.products, public.customers, public.sales, public.sale_items,
              public.customer_transactions, public.stock_movements,
              public.customer_balances
  from anon, authenticated;

grant select on public.products, public.customers, public.sales, public.sale_items,
                public.customer_transactions, public.stock_movements,
                public.customer_balances
  to authenticated;

-- Stock can only change through the functions below, so it is left out of this list.
grant update (name, search_terms, selling_price, low_stock_threshold, is_quick_access, is_active)
  on public.products to authenticated;
grant insert (name, phone, notes) on public.customers to authenticated;
grant update (name, phone, notes) on public.customers to authenticated;

-- =====================================================================
-- FUNCTIONS (each one runs as a single all-or-nothing transaction)
-- =====================================================================

-- Add a product. Starting stock is recorded as a stock movement.
create function public.create_product(
  p_name         text,
  p_price        numeric,
  p_stock        integer,
  p_low_stock    integer default 5,
  p_quick        boolean default false,
  p_search_terms text default null
) returns public.products
language plpgsql security definer set search_path = public as $$
declare
  v_name    text := btrim(coalesce(p_name, ''));
  v_product public.products;
begin
  if auth.uid() is null then raise exception 'Please log in again.'; end if;
  if v_name = '' then raise exception 'Please enter a product name.'; end if;
  if p_price is null or p_price < 0 then raise exception 'Please enter a selling price.'; end if;
  if p_stock is null or p_stock < 0 then raise exception 'Please enter the current stock.'; end if;
  if exists (select 1 from public.products where is_active and lower(btrim(name)) = lower(v_name)) then
    raise exception '% is already in your product list.', v_name;
  end if;

  insert into public.products (name, search_terms, selling_price, stock_quantity, low_stock_threshold, is_quick_access)
  values (v_name, nullif(btrim(p_search_terms), ''), p_price, p_stock, coalesce(p_low_stock, 5), coalesce(p_quick, false))
  returning * into v_product;

  if v_product.stock_quantity > 0 then
    insert into public.stock_movements (product_id, type, quantity, stock_after, reason)
    values (v_product.id, 'RESTOCK', v_product.stock_quantity, v_product.stock_quantity, 'Starting stock');
  end if;

  return v_product;
end $$;

-- Add stock to a product.
create function public.add_stock(
  p_product_id uuid,
  p_quantity   integer
) returns public.products
language plpgsql security definer set search_path = public as $$
declare
  v_product public.products;
begin
  if auth.uid() is null then raise exception 'Please log in again.'; end if;
  if p_quantity is null or p_quantity <= 0 then raise exception 'Please enter how many to add.'; end if;

  update public.products
     set stock_quantity = stock_quantity + p_quantity
   where id = p_product_id
  returning * into v_product;

  if not found then raise exception 'That product could not be found.'; end if;

  insert into public.stock_movements (product_id, type, quantity, stock_after, reason)
  values (v_product.id, 'RESTOCK', p_quantity, v_product.stock_quantity, 'Restock');

  return v_product;
end $$;

-- End-of-day physical count. p_counts looks like:
--   [{"product_id": "...", "actual": 5, "reason": "Missing item"}, ...]
-- Stock is set to the counted number and the difference is saved as an adjustment.
-- Returns how many products actually changed.
create function public.apply_stock_counts(p_counts jsonb) returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_item    jsonb;
  v_product public.products;
  v_actual  integer;
  v_diff    integer;
  v_changed integer := 0;
begin
  if auth.uid() is null then raise exception 'Please log in again.'; end if;
  if jsonb_typeof(p_counts) <> 'array' or jsonb_array_length(p_counts) = 0 then
    raise exception 'There is nothing to adjust.';
  end if;

  for v_item in
    select e from jsonb_array_elements(p_counts) as t(e) order by e ->> 'product_id'
  loop
    v_actual := (v_item ->> 'actual')::integer;
    if v_actual is null or v_actual < 0 then
      raise exception 'Please enter a count of 0 or more.';
    end if;

    select * into v_product
      from public.products
     where id = (v_item ->> 'product_id')::uuid
     for update;
    if not found then raise exception 'A product in this count could not be found.'; end if;

    v_diff := v_actual - v_product.stock_quantity;
    if v_diff <> 0 then
      update public.products set stock_quantity = v_actual where id = v_product.id;
      insert into public.stock_movements (product_id, type, quantity, stock_after, reason)
      values (v_product.id, 'ADJUSTMENT', v_diff, v_actual,
              coalesce(nullif(btrim(v_item ->> 'reason'), ''), 'Physical count'));
      v_changed := v_changed + 1;
    end if;
  end loop;

  return v_changed;
end $$;

-- Confirm a sale. p_items looks like:
--   [{"product_id": "...", "quantity": 2}, ...]
-- Prices come from the products table, not from the app. p_expected_total is the
-- total the cashier saw; if a price changed in the meantime the sale is refused.
create function public.confirm_sale(
  p_items          jsonb,
  p_payment_type   text,
  p_expected_total numeric,
  p_cash_received  numeric default null,
  p_customer_id    uuid default null
) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_line    record;
  v_product public.products;
  v_sale_id uuid;
  v_total   numeric(12,2) := 0;
  v_cash    numeric(12,2);
  v_change  numeric(12,2);
  v_balance numeric(12,2);
begin
  if auth.uid() is null then raise exception 'Please log in again.'; end if;
  if p_payment_type not in ('PAID', 'UTANG') then raise exception 'Please choose PAID or UTANG.'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Add at least one product to the sale.';
  end if;

  if p_payment_type = 'UTANG' then
    if p_customer_id is null then raise exception 'Please choose who this utang is for.'; end if;
    -- Locking the customer keeps two phones from updating the same balance at once.
    perform 1 from public.customers where id = p_customer_id for update;
    if not found then raise exception 'That customer could not be found.'; end if;
  end if;

  insert into public.sales (total_amount, payment_type, customer_id)
  values (0, p_payment_type, case when p_payment_type = 'UTANG' then p_customer_id end)
  returning id into v_sale_id;

  for v_line in
    select (e ->> 'product_id')::uuid as product_id,
           sum((e ->> 'quantity')::integer) as qty
      from jsonb_array_elements(p_items) as t(e)
     group by 1
     order by 1
  loop
    if v_line.qty is null or v_line.qty <= 0 then
      raise exception 'Quantity must be at least 1.';
    end if;

    select * into v_product from public.products where id = v_line.product_id for update;
    if not found or not v_product.is_active then
      raise exception 'A product in this sale is no longer available.';
    end if;
    if v_product.stock_quantity < v_line.qty then
      raise exception 'Only % % are available.', v_product.stock_quantity, v_product.name;
    end if;

    update public.products
       set stock_quantity = stock_quantity - v_line.qty
     where id = v_product.id;

    insert into public.sale_items (sale_id, product_id, product_name, quantity, unit_price, subtotal)
    values (v_sale_id, v_product.id, v_product.name, v_line.qty,
            v_product.selling_price, v_product.selling_price * v_line.qty);

    insert into public.stock_movements (product_id, type, quantity, stock_after, reference_sale_id, reason)
    values (v_product.id, 'SALE', -v_line.qty, v_product.stock_quantity - v_line.qty, v_sale_id, 'Sale');

    v_total := v_total + v_product.selling_price * v_line.qty;
  end loop;

  if v_total <= 0 then raise exception 'The total must be more than ₱0.'; end if;
  if p_expected_total is null or round(p_expected_total, 2) <> v_total then
    raise exception 'A price changed while you were working. Please check the total and try again.';
  end if;

  if p_payment_type = 'PAID' then
    -- No cash entered means the customer paid the exact amount.
    v_cash := coalesce(p_cash_received, v_total);
    if v_cash < v_total then raise exception 'The cash received is less than the total.'; end if;
    v_change := v_cash - v_total;
  end if;

  update public.sales
     set total_amount = v_total, cash_received = v_cash, change_amount = v_change
   where id = v_sale_id;

  if p_payment_type = 'UTANG' then
    insert into public.customer_transactions (customer_id, type, amount, reference_sale_id, notes)
    values (p_customer_id, 'UTANG', v_total, v_sale_id, 'Sale');

    select coalesce(sum(amount), 0) into v_balance
      from public.customer_transactions where customer_id = p_customer_id;
  end if;

  return jsonb_build_object(
    'sale_id', v_sale_id,
    'total', v_total,
    'cash_received', v_cash,
    'change', v_change,
    'customer_balance', v_balance
  );
end $$;

-- Add utang (without a sale) or record a payment for a customer.
-- p_amount is always a positive number. Returns the new balance.
create function public.record_customer_transaction(
  p_customer_id uuid,
  p_type        text,
  p_amount      numeric,
  p_notes       text default null
) returns numeric
language plpgsql security definer set search_path = public as $$
declare
  v_amount  numeric(12,2) := round(coalesce(p_amount, 0), 2);
  v_balance numeric(12,2);
begin
  if auth.uid() is null then raise exception 'Please log in again.'; end if;
  if p_type not in ('UTANG', 'PAYMENT') then raise exception 'Please choose utang or payment.'; end if;
  if v_amount <= 0 then raise exception 'Please enter an amount more than ₱0.'; end if;

  perform 1 from public.customers where id = p_customer_id for update;
  if not found then raise exception 'That customer could not be found.'; end if;

  select coalesce(sum(amount), 0) into v_balance
    from public.customer_transactions where customer_id = p_customer_id;

  if p_type = 'PAYMENT' and v_amount > v_balance then
    raise exception 'The balance is only ₱%. Please enter that amount or less.',
      to_char(v_balance, 'FM999,999,990.00');
  end if;

  insert into public.customer_transactions (customer_id, type, amount, notes)
  values (p_customer_id, p_type,
          case when p_type = 'PAYMENT' then -v_amount else v_amount end,
          nullif(btrim(p_notes), ''));

  return v_balance + case when p_type = 'PAYMENT' then -v_amount else v_amount end;
end $$;

-- Remove the sample data from seed.sql.
-- Demo products that were never sold are deleted. Demo products that already
-- appear in a sale are archived instead, so that sale history stays complete.
create function public.remove_demo_data() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Please log in again.'; end if;

  -- Demo customers whose ledger holds only demo rows.
  delete from public.customer_transactions t
   where t.is_demo
     and t.customer_id in (
       select c.id from public.customers c
        where c.is_demo
          and not exists (
            select 1 from public.customer_transactions x
             where x.customer_id = c.id and not x.is_demo
          )
     );
  delete from public.customers c
   where c.is_demo
     and not exists (select 1 from public.customer_transactions x where x.customer_id = c.id)
     and not exists (select 1 from public.sales s where s.customer_id = c.id);

  delete from public.stock_movements m
   where m.product_id in (
     select p.id from public.products p
      where p.is_demo and not exists (select 1 from public.sale_items i where i.product_id = p.id)
   );
  delete from public.products p
   where p.is_demo and not exists (select 1 from public.sale_items i where i.product_id = p.id);

  update public.products set is_active = false where is_demo;
end $$;

-- Only signed-in users may call these functions.
revoke all on function public.create_product(text, numeric, integer, integer, boolean, text) from public, anon;
revoke all on function public.add_stock(uuid, integer) from public, anon;
revoke all on function public.apply_stock_counts(jsonb) from public, anon;
revoke all on function public.confirm_sale(jsonb, text, numeric, numeric, uuid) from public, anon;
revoke all on function public.record_customer_transaction(uuid, text, numeric, text) from public, anon;
revoke all on function public.remove_demo_data() from public, anon;

grant execute on function public.create_product(text, numeric, integer, integer, boolean, text) to authenticated;
grant execute on function public.add_stock(uuid, integer) to authenticated;
grant execute on function public.apply_stock_counts(jsonb) to authenticated;
grant execute on function public.confirm_sale(jsonb, text, numeric, numeric, uuid) to authenticated;
grant execute on function public.record_customer_transaction(uuid, text, numeric, text) to authenticated;
grant execute on function public.remove_demo_data() to authenticated;

-- =====================================================================
-- LIVE UPDATES
-- Lets one phone see stock and utang changes made on another phone.
-- =====================================================================

alter publication supabase_realtime add table public.products;
alter publication supabase_realtime add table public.customer_transactions;
