import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const allowedRoles = ['SERVEUR', 'CAISSIER', 'CUISINE', 'EMPLOYE', 'POINTAGE', 'RESPONSABLE', 'ADMINISTRATEUR'];

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authorization = request.headers.get('Authorization');
    if (!authorization) throw new Error('Authentification requise.');

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const { data: { user: caller }, error: callerError } = await adminClient.auth.getUser(authorization.replace('Bearer ', ''));
    if (callerError || !caller) throw new Error('Session invalide.');

    const { data: profile } = await adminClient.from('profiles').select('role').eq('id', caller.id).single();
    if (!profile || !['ADMINISTRATEUR', 'RESPONSABLE'].includes(profile.role)) {
      return new Response(JSON.stringify({ error: 'Permission administrateur requise.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { employeeId, role } = await request.json();
    if (typeof employeeId !== 'string' || !allowedRoles.includes(role)) throw new Error('Rôle ou employé invalide.');

    const { data: employee, error: employeeError } = await adminClient
      .from('employees')
      .select('id, auth_user_id, prenom, nom')
      .eq('id', employeeId)
      .single();
    if (employeeError || !employee) throw new Error(employeeError?.message || 'Employé introuvable.');

    if (!employee.auth_user_id) throw new Error('Cette fiche employé n’est liée à aucun compte de connexion Supabase.');

    const { error: profileUpdateError } = await adminClient.from('profiles').update({ role }).eq('id', employee.auth_user_id);
    if (profileUpdateError) throw new Error(profileUpdateError.message);

    const { error: employeeUpdateError } = await adminClient.from('employees').update({ role }).eq('id', employeeId);
    if (employeeUpdateError) throw new Error(employeeUpdateError.message);

    await adminClient.from('audit_logs').insert({
      user_id: caller.id,
      action: 'MODIFICATION_ROLE_EMPLOYE',
      target_entity: 'Employee',
      target_id: employeeId,
      new_value: { role },
      details: `Rôle de ${employee.prenom} ${employee.nom} modifié en ${role}.`,
    });

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Mise à jour impossible.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
