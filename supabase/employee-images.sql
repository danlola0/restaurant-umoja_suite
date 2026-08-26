-- A executer dans Supabase > SQL Editor > Run
-- Ce script cree le stockage des photos des employes.

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
