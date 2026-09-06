import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

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

    const { data: callerProfile } = await adminClient.from('profiles').select('role').eq('id', caller.id).single();
    if (!callerProfile || !['ADMINISTRATEUR', 'RESPONSABLE'].includes(callerProfile.role)) {
      return new Response(JSON.stringify({ error: 'Permission administrateur requise.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { employeeId } = await request.json();
    if (typeof employeeId !== 'string' || !employeeId) throw new Error('Employé invalide.');

    const { data: employee, error: employeeError } = await adminClient
      .from('employees')
      .select('id, auth_user_id, prenom, nom, matricule')
      .eq('id', employeeId)
      .single();
    if (employeeError || !employee) throw new Error(employeeError?.message || 'Employé introuvable.');

    // Suppression ordonnée des données liées : aucune donnée orpheline conservée.
    const { error: attendanceError } = await adminClient.from('attendance_records').delete().eq('employee_id', employeeId);
    if (attendanceError) throw new Error(`Présences non supprimées : ${attendanceError.message}`);
    const { error: credentialsError } = await adminClient.from('webauthn_credentials').delete().eq('employee_id', employeeId);
    if (credentialsError) throw new Error(`Identifiants biométriques non supprimés : ${credentialsError.message}`);
    const { error: employeeDeleteError } = await adminClient.from('employees').delete().eq('id', employeeId);
    if (employeeDeleteError) throw new Error(`Employé non supprimé : ${employeeDeleteError.message}`);

    // La suppression de l'utilisateur Auth supprime aussi son profil (on delete cascade).
    if (employee.auth_user_id) {
      const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(employee.auth_user_id);
      if (authDeleteError) throw new Error(`Compte de connexion non supprimé : ${authDeleteError.message}`);
    }

    await adminClient.from('audit_logs').insert({
      user_id: caller.id,
      action: 'SUPPRESSION_EMPLOYE',
      target_entity: 'Employee',
      target_id: employeeId,
      details: `Suppression complète de ${employee.prenom} ${employee.nom} (${employee.matricule}) et de ses données liées.`,
    });

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Suppression impossible.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
