-- Additif : traçabilité achat → stock → recette → préparation → vente
-- Réutilise expenses, ingredients, recipe_ingredients. N’écrase pas les tables existantes.

alter table public.expenses add column if not exists unit text;

create table if not exists public.kitchen_preparations (
  id text primary key,
  product_id text references public.products(id) on delete set null,
  product_name text not null,
  quantity numeric(12, 3) not null check (quantity > 0),
  notes text,
  recorded_by uuid references public.profiles(id) on delete set null,
  prepared_at timestamptz not null default now()
);

alter table public.kitchen_preparations enable row level security;

create index if not exists kitchen_preparations_prepared_at_idx on public.kitchen_preparations(prepared_at);

drop policy if exists kitchen_preparations_read on public.kitchen_preparations;
drop policy if exists kitchen_preparations_insert on public.kitchen_preparations;
drop policy if exists ingredients_kitchen_read on public.ingredients;
drop policy if exists recipe_ingredients_kitchen_read on public.recipe_ingredients;

create policy kitchen_preparations_read on public.kitchen_preparations for select using (
  public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CUISINE', 'CAISSIER', 'SERVEUR'])
);
create policy kitchen_preparations_insert on public.kitchen_preparations for insert with check (
  recorded_by = auth.uid()
  and public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CUISINE'])
);

create policy ingredients_kitchen_read on public.ingredients for select using (
  public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CUISINE', 'CAISSIER'])
);
create policy recipe_ingredients_kitchen_read on public.recipe_ingredients for select using (
  public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE', 'CUISINE', 'CAISSIER'])
);

drop policy if exists expense_categories_cuisine_read on public.expense_categories;
create policy expense_categories_cuisine_read on public.expense_categories for select using (
  public.has_role(array['CUISINE'])
);

insert into public.expense_categories (id, name, icon_name, is_default)
values
  ('exp-viandes', 'Viandes', 'Beef', true),
  ('exp-poulet', 'Poulet', 'Drumstick', true),
  ('exp-poisson', 'Poisson', 'Fish', true),
  ('exp-riz-semoule', 'Riz / Semoule', 'Wheat', true),
  ('exp-legumes', 'Légumes', 'Carrot', true),
  ('exp-epices', 'Épices et condiments', 'Soup', true),
  ('exp-huiles', 'Huiles', 'Droplets', true),
  ('exp-boissons', 'Boissons', 'GlassWater', true),
  ('exp-farine-mais', 'Farine / Maïs', 'Wheat', true),
  ('exp-chikwangue', 'Chikwangue', 'Package', true),
  ('exp-entretien', 'Entretien', 'Wrench', true),
  ('exp-transport', 'Transport', 'Truck', true),
  ('exp-loyer', 'Loyer', 'Building', true),
  ('exp-elec-eau', 'Électricité / Eau', 'Zap', true),
  ('exp-autres', 'Autres', 'Tag', true)
on conflict (name) do nothing;
