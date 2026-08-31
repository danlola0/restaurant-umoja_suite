create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null default 'CLIENT' check (role in ('CLIENT', 'SERVEUR', 'CAISSIER', 'CUISINE', 'EMPLOYE', 'POINTAGE', 'RESPONSABLE', 'ADMINISTRATEUR')),
  created_at timestamptz not null default now()
);

create table if not exists public.employees (
  id text primary key,
  auth_user_id uuid unique references public.profiles(id) on delete set null,
  matricule text not null unique,
  nom text not null,
  postnom text,
  prenom text not null,
  telephone text not null default '',
  email text,
  poste text not null default 'Autre',
  salaire numeric(12, 2) not null default 0 check (salaire >= 0),
  date_embauche date not null default current_date,
  type_contrat text not null default 'CDI',
  statut text not null default 'ACTIF' check (statut in ('ACTIF', 'INACTIF', 'SUSPENDU', 'CONGE')),
  photo text not null default '',
  scheduled_shift_start time not null default '08:00',
  scheduled_shift_end time not null default '17:00',
  created_at timestamptz not null default now()
);

alter table public.employees add column if not exists role text;
alter table public.employees add column if not exists salaire_base numeric(12, 2);
alter table public.employees add column if not exists pin text not null default '1234';

create table if not exists public.categories (
  id text primary key,
  name text not null,
  description text,
  icon_name text not null default 'UtensilsCrossed',
  display_order integer not null default 0,
  active boolean not null default true
);

create table if not exists public.products (
  id text primary key,
  category_id text references public.categories(id) on delete set null,
  name text not null,
  description text not null default '',
  price numeric(12, 2) not null check (price >= 0),
  photo text not null default '',
  available boolean not null default true,
  is_recommended boolean not null default false,
  display_order integer not null default 0,
  preparation_time_minutes integer not null default 0 check (preparation_time_minutes >= 0),
  spicy_level integer not null default 0 check (spicy_level between 0 and 3),
  tags text[] not null default '{}'
);

create table if not exists public.restaurant_tables (
  id text primary key,
  code text not null unique,
  name text not null,
  zone text not null,
  capacity integer not null check (capacity > 0),
  status text not null default 'LIBRE',
  waiter_name text
);

create table if not exists public.table_sessions (
  id text primary key,
  table_id text not null references public.restaurant_tables(id),
  opened_by uuid references public.profiles(id) on delete set null,
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'CLOSED')),
  customer_count integer not null default 1 check (customer_count > 0),
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  paid_amount numeric(12, 2) not null default 0 check (paid_amount >= 0)
);

create table if not exists public.orders (
  id text primary key,
  order_number text not null unique,
  table_session_id text references public.table_sessions(id) on delete set null,
  table_id text references public.restaurant_tables(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  client_name text,
  status text not null default 'NOUVELLE',
  special_instructions text,
  order_type text not null default 'SUR_PLACE' check (order_type in ('SUR_PLACE', 'A_EMPORTER')),
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  created_at timestamptz not null default now(),
  prepared_at timestamptz,
  served_at timestamptz
);

create table if not exists public.order_items (
  id text primary key,
  order_id text not null references public.orders(id) on delete cascade,
  product_id text references public.products(id) on delete set null,
  product_name text not null,
  unit_price numeric(12, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  notes text,
  subtotal numeric(12, 2) not null check (subtotal >= 0)
);

create table if not exists public.invoices (
  id text primary key,
  invoice_number text not null unique,
  table_session_id text references public.table_sessions(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  subtotal numeric(12, 2) not null default 0 check (subtotal >= 0),
  discount_amount numeric(12, 2) not null default 0 check (discount_amount >= 0),
  tax_amount numeric(12, 2) not null default 0 check (tax_amount >= 0),
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  paid_amount numeric(12, 2) not null default 0 check (paid_amount >= 0),
  status text not null default 'EN_ATTENTE',
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

alter table public.invoices add column if not exists table_id text references public.restaurant_tables(id) on delete set null;
alter table public.invoices add column if not exists table_code text;
alter table public.invoices add column if not exists order_ids jsonb not null default '[]'::jsonb;
alter table public.invoices add column if not exists cashier_name text;
alter table public.invoices add column if not exists payment_method text;
alter table public.invoices add column if not exists payment_reference text;

create table if not exists public.payments (
  id text primary key,
  invoice_id text not null references public.invoices(id) on delete restrict,
  amount numeric(12, 2) not null check (amount > 0),
  payment_method text not null,
  reference text,
  note text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.attendance_records (
  id text primary key,
  employee_id text not null references public.employees(id) on delete restrict,
  recorded_by uuid references public.profiles(id) on delete set null,
  date date not null default current_date,
  time time not null default localtime,
  type text not null check (type in ('ENTREE', 'DEBUT_PAUSE', 'FIN_PAUSE', 'SORTIE')),
  status text not null default 'PRESENT',
  delay_minutes integer not null default 0 check (delay_minutes >= 0),
  is_manual_correction boolean not null default false,
  correction_reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.webauthn_credentials (
  id uuid primary key default gen_random_uuid(),
  employee_id text not null references public.employees(id) on delete cascade,
  credential_id text not null unique,
  public_key bytea not null,
  counter bigint not null default 0,
  transports text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table if not exists public.webauthn_challenges (
  user_id uuid primary key references auth.users(id) on delete cascade,
  challenge text not null,
  purpose text not null check (purpose in ('registration', 'authentication')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.expenses (
  id text primary key,
  category text not null,
  description text not null,
  amount numeric(12, 2) not null check (amount > 0),
  payment_method text not null,
  supplier text,
  reference text,
  recorded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.expenses add column if not exists expense_date date not null default current_date;

create table if not exists public.expense_categories (
  id text primary key,
  name text not null unique,
  icon_name text not null default 'Tag',
  is_default boolean not null default false
);

create table if not exists public.cash_register_sessions (
  id text primary key,
  opened_by uuid references public.profiles(id) on delete set null,
  opened_at timestamptz not null default now(),
  closed_by uuid references public.profiles(id) on delete set null,
  closed_at timestamptz,
  opening_balance numeric(12, 2) not null default 0 check (opening_balance >= 0),
  real_balance numeric(12, 2),
  variance numeric(12, 2),
  variance_reason text,
  notes text,
  status text not null default 'OPEN' check (status in ('OPEN', 'CLOSED'))
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  target_entity text not null,
  target_id text not null,
  old_value jsonb,
  new_value jsonb,
  details text,
  created_at timestamptz not null default now()
);

create index if not exists orders_created_by_idx on public.orders(created_by);
create index if not exists orders_status_idx on public.orders(status);
create index if not exists attendance_employee_idx on public.attendance_records(employee_id, date);
create index if not exists payments_invoice_idx on public.payments(invoice_id);
create index if not exists expenses_created_at_idx on public.expenses(created_at);
create index if not exists cash_register_sessions_opened_at_idx on public.cash_register_sessions(opened_at desc);

create or replace function public.has_role(required_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = any(required_roles)
  );
$$;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists product_images_public_read on storage.objects;
drop policy if exists product_images_manager_insert on storage.objects;
drop policy if exists product_images_manager_update on storage.objects;
drop policy if exists product_images_manager_delete on storage.objects;

create policy product_images_public_read on storage.objects
for select using (bucket_id = 'product-images');

create policy product_images_manager_insert on storage.objects
for insert with check (
  bucket_id = 'product-images'
  and public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE'])
);

create policy product_images_manager_update on storage.objects
for update using (
  bucket_id = 'product-images'
  and public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE'])
) with check (
  bucket_id = 'product-images'
  and public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE'])
);

create policy product_images_manager_delete on storage.objects
for delete using (
  bucket_id = 'product-images'
  and public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE'])
);

insert into storage.buckets (id, name, public)
values ('employee-images', 'employee-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists employee_images_public_read on storage.objects;
drop policy if exists employee_images_manager_insert on storage.objects;
drop policy if exists employee_images_manager_update on storage.objects;
drop policy if exists employee_images_manager_delete on storage.objects;

create policy employee_images_public_read on storage.objects
for select using (bucket_id = 'employee-images');

create policy employee_images_manager_insert on storage.objects
for insert with check (
  bucket_id = 'employee-images'
  and public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE'])
);

create policy employee_images_manager_update on storage.objects
for update using (
  bucket_id = 'employee-images'
  and public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE'])
) with check (
  bucket_id = 'employee-images'
  and public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE'])
);

create policy employee_images_manager_delete on storage.objects
for delete using (
  bucket_id = 'employee-images'
  and public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE'])
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.email, 'Utilisateur'));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.employees enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.restaurant_tables enable row level security;
alter table public.table_sessions enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;
alter table public.attendance_records enable row level security;
alter table public.webauthn_credentials enable row level security;
alter table public.webauthn_challenges enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_categories enable row level security;
alter table public.cash_register_sessions enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_admin_all on public.profiles;
drop policy if exists employees_select_allowed on public.employees;
drop policy if exists employees_admin_all on public.employees;
drop policy if exists categories_public_read on public.categories;
drop policy if exists categories_admin_all on public.categories;
drop policy if exists products_public_read on public.products;
drop policy if exists products_admin_all on public.products;
drop policy if exists tables_authenticated_read on public.restaurant_tables;
drop policy if exists tables_manager_all on public.restaurant_tables;
drop policy if exists sessions_owner_or_staff on public.table_sessions;
drop policy if exists sessions_staff_write on public.table_sessions;
drop policy if exists orders_owner_or_staff on public.orders;
drop policy if exists orders_client_insert on public.orders;
drop policy if exists orders_public_insert on public.orders;
drop policy if exists sessions_public_insert on public.table_sessions;
drop policy if exists order_items_public_insert on public.order_items;
drop policy if exists orders_staff_update on public.orders;
drop policy if exists order_items_visible_with_order on public.order_items;
drop policy if exists order_items_staff_write on public.order_items;
drop policy if exists invoices_staff_read on public.invoices;
drop policy if exists invoices_cashier_write on public.invoices;
drop policy if exists payments_staff_read on public.payments;
drop policy if exists payments_cashier_write on public.payments;
drop policy if exists attendance_self_read on public.attendance_records;
drop policy if exists attendance_self_insert on public.attendance_records;
drop policy if exists attendance_manager_update on public.attendance_records;
drop policy if exists expenses_manager_read on public.expenses;
drop policy if exists expenses_manager_write on public.expenses;
drop policy if exists expense_categories_manager_read on public.expense_categories;
drop policy if exists expense_categories_admin_write on public.expense_categories;
drop policy if exists cash_register_sessions_staff_read on public.cash_register_sessions;
drop policy if exists cash_register_sessions_cashier_write on public.cash_register_sessions;
drop policy if exists audit_admin_read on public.audit_logs;
drop policy if exists audit_authenticated_insert on public.audit_logs;
drop policy if exists webauthn_credentials_self_read on public.webauthn_credentials;
drop policy if exists webauthn_credentials_manager_all on public.webauthn_credentials;

create policy profiles_select_own on public.profiles for select using (id = auth.uid() or public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE']));
create policy profiles_update_own on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_all on public.profiles for all using (public.has_role(array['ADMINISTRATEUR'])) with check (public.has_role(array['ADMINISTRATEUR']));

create policy employees_select_allowed on public.employees for select using (auth_user_id = auth.uid() or public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE']));
create policy employees_admin_all on public.employees for all using (public.has_role(array['ADMINISTRATEUR'])) with check (public.has_role(array['ADMINISTRATEUR']));

create policy categories_public_read on public.categories for select using (active = true or public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE']));
create policy categories_admin_all on public.categories for all using (public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE'])) with check (public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE']));

create policy products_public_read on public.products for select using (available = true or public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CUISINE', 'CAISSIER']));
create policy products_admin_all on public.products for all using (public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE'])) with check (public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE']));

create policy tables_authenticated_read on public.restaurant_tables for select using (auth.uid() is not null);
create policy tables_manager_all on public.restaurant_tables for all using (public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CAISSIER', 'SERVEUR'])) with check (public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CAISSIER', 'SERVEUR']));

create policy sessions_owner_or_staff on public.table_sessions for select using (opened_by = auth.uid() or public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CAISSIER', 'SERVEUR', 'CUISINE']));
create policy sessions_staff_write on public.table_sessions for all using (public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CAISSIER', 'SERVEUR'])) with check (public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CAISSIER', 'SERVEUR']));

create policy orders_owner_or_staff on public.orders for select using (created_by = auth.uid() or public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CAISSIER', 'SERVEUR', 'CUISINE']));
create policy orders_client_insert on public.orders for insert with check (created_by = auth.uid());
create policy orders_public_insert on public.orders for insert with check (created_by is null and status = 'NOUVELLE');
create policy sessions_public_insert on public.table_sessions for insert with check (opened_by is null and status = 'ACTIVE');
create policy order_items_public_insert on public.order_items for insert with check (
  exists (select 1 from public.orders where orders.id = order_id and orders.created_by is null)
);
create policy orders_staff_update on public.orders for update using (public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CUISINE', 'SERVEUR'])) with check (public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CUISINE', 'SERVEUR']));
create policy order_items_visible_with_order on public.order_items for select using (exists (select 1 from public.orders where orders.id = order_id and (orders.created_by = auth.uid() or public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CAISSIER', 'SERVEUR', 'CUISINE']))));
create policy order_items_staff_write on public.order_items for all using (public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CUISINE', 'SERVEUR'])) with check (public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CUISINE', 'SERVEUR']));

create policy invoices_staff_read on public.invoices for select using (created_by = auth.uid() or public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CAISSIER']));
create policy invoices_cashier_write on public.invoices for all using (public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CAISSIER'])) with check (public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CAISSIER']));
create policy payments_staff_read on public.payments for select using (recorded_by = auth.uid() or public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CAISSIER']));
create policy payments_cashier_write on public.payments for all using (public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CAISSIER'])) with check (public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CAISSIER']));

create policy attendance_self_read on public.attendance_records for select using (exists (select 1 from public.employees where employees.id = employee_id and employees.auth_user_id = auth.uid()) or public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE']));
create policy attendance_self_insert on public.attendance_records for insert with check (exists (select 1 from public.employees where employees.id = employee_id and employees.auth_user_id = auth.uid()) or public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE']));
create policy attendance_manager_update on public.attendance_records for update using (public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE'])) with check (public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE']));

create policy expenses_manager_read on public.expenses for select using (recorded_by = auth.uid() or public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CAISSIER']));
create policy expenses_manager_write on public.expenses for all using (public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CAISSIER'])) with check (public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CAISSIER']));

create policy expense_categories_manager_read on public.expense_categories for select using (public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CAISSIER']));
create policy expense_categories_admin_write on public.expense_categories for all using (public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE'])) with check (public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE']));

create policy cash_register_sessions_staff_read on public.cash_register_sessions for select using (public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CAISSIER']));
create policy cash_register_sessions_cashier_write on public.cash_register_sessions for all using (public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CAISSIER'])) with check (public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CAISSIER']));

create policy audit_admin_read on public.audit_logs for select using (user_id = auth.uid() or public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE']));
create policy audit_authenticated_insert on public.audit_logs for insert with check (user_id = auth.uid());

create policy webauthn_credentials_self_read on public.webauthn_credentials
for select using (exists (select 1 from public.employees where employees.id = employee_id and employees.auth_user_id = auth.uid()) or public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE']));
create policy webauthn_credentials_manager_all on public.webauthn_credentials
for all using (public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE'])) with check (public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE']));

create or replace function public.prevent_audit_log_changes()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Les journaux d''audit sont immuables';
end;
$$;

drop trigger if exists audit_logs_immutable on public.audit_logs;
create trigger audit_logs_immutable
before update or delete on public.audit_logs
for each row execute procedure public.prevent_audit_log_changes();
