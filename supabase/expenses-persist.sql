-- Autorise la suppression réelle des dépenses par l’admin / responsable.
-- À exécuter une fois dans Supabase (SQL Editor). Ne supprime aucune donnée.

drop policy if exists expenses_manager_delete on public.expenses;
create policy expenses_manager_delete on public.expenses
  for delete using (public.has_role(array['ADMINISTRATEUR', 'RESPONSABLE']));
