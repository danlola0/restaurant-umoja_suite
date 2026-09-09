-- Additif : stock réel + paiements de salaires (réutilise public.ingredients)
-- À exécuter dans Supabase SQL Editor. N’écrase pas les tables existantes.

alter table public.ingredients add column if not exists category text not null default 'Divers';
alter table public.ingredients add column if not exists stock_qty numeric(12, 3) not null default 0;
alter table public.ingredients add column if not exists min_stock numeric(12, 3) not null default 0;

create table if not exists public.stock_movements (
  id text primary key,
  ingredient_id text references public.ingredients(id) on delete set null,
  ingredient_name text not null,
  movement_type text not null check (movement_type in ('ENTREE', 'SORTIE')),
  quantity numeric(12, 3) not null check (quantity > 0),
  unit text not null default 'kg',
  reason text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.salary_payments (
  id text primary key,
  employee_id text references public.employees(id) on delete set null,
  employee_name text not null,
  amount numeric(12, 2) not null check (amount > 0),
  period_month text not null,
  status text not null default 'PAYE' check (status in ('PAYE', 'ANNULE')),
  expense_id text references public.expenses(id) on delete set null,
  recorded_by uuid references public.profiles(id) on delete set null,
  paid_at timestamptz not null default now()
);

alter table public.stock_movements enable row level security;
alter table public.salary_payments enable row level security;

create index if not exists stock_movements_created_at_idx on public.stock_movements(created_at);
create index if not exists salary_payments_period_idx on public.salary_payments(employee_id, period_month);

drop policy if exists stock_movements_read on public.stock_movements;
drop policy if exists stock_movements_insert on public.stock_movements;
drop policy if exists salary_payments_admin_all on public.salary_payments;
drop policy if exists ingredients_kitchen_update_stock on public.ingredients;

create policy stock_movements_read on public.stock_movements for select using (
  public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CUISINE'])
);
create policy stock_movements_insert on public.stock_movements for insert with check (
  recorded_by = auth.uid()
  and public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CUISINE'])
);

create policy salary_payments_admin_all on public.salary_payments for all using (
  public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE'])
) with check (
  public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE'])
);

create policy ingredients_kitchen_update_stock on public.ingredients for update using (
  public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CUISINE'])
) with check (
  public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CUISINE'])
);

insert into public.expense_categories (id, name, icon_name, is_default)
values
  ('exp-viandes', 'Viandes', 'Beef', true),
  ('exp-epices', 'Épices', 'Soup', true),
  ('exp-legumes', 'Légumes', 'Carrot', true),
  ('exp-divers', 'Divers', 'Package', true),
  ('exp-salaires', 'Charges salariales', 'Users', true),
  ('exp-exploitation', 'Charges d’exploitation', 'Building', true),
  ('exp-eau', 'Eau', 'Droplets', true),
  ('exp-electricite', 'Électricité', 'Zap', true),
  ('exp-transport', 'Transport', 'Truck', true)
on conflict (name) do nothing;
