import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const allowedRoles = ['SERVEUR', 'CAISSIER', 'CUISINE', 'EMPLOYE', 'POINTAGE', 'RESPONSABLE', 'ADMINISTRATEUR'];

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authorization = request.headers.get('Authorization');
    if (!authorization) throw new Error('Authentification requise.');

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const accessToken = authorization.replace('Bearer ', '');
    const { data: { user: caller }, error: callerError } = await adminClient.auth.getUser(accessToken);
    if (callerError || !caller) throw new Error('Session invalide.');

    const { data: callerProfile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single();
    if (!callerProfile || !['ADMINISTRATEUR', 'RESPONSABLE'].includes(callerProfile.role)) {
      return new Response(JSON.stringify({ error: 'Permission administrateur requise.' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const payload = await request.json();
    const { email, password, role, full_name, employee } = payload;
    if (!email || !password || !role || !full_name || !employee) throw new Error('Informations de compte incomplètes.');
    if (!allowedRoles.includes(role)) throw new Error('Rôle non autorisé.');
    if (password.length < 8) throw new Error('Le mot de passe doit contenir au moins 8 caractères.');

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    });
    if (createError || !created.user) throw new Error(createError?.message || 'Compte impossible à créer.');

    const userId = created.user.id;
    const { error: profileError } = await adminClient.from('profiles').update({ full_name, role }).eq('id', userId);
    if (profileError) {
      await adminClient.auth.admin.deleteUser(userId);
      throw new Error(profileError.message);
    }

    const employeeId = `emp-${crypto.randomUUID()}`;
    const matricule = `EMP-${Date.now()}`;
    const { error: employeeError } = await adminClient.from('employees').insert({
      id: employeeId,
      auth_user_id: userId,
      matricule,
      nom: employee.nom,
      prenom: employee.prenom,
      postnom: employee.postnom || null,
      telephone: employee.telephone || '',
      email,
      role,
      poste: employee.poste || 'Autre',
      salaire: employee.salaire || employee.salaireBase || 0,
      salaire_base: employee.salaireBase || employee.salaire || 0,
      date_embauche: employee.dateEmbauche,
      type_contrat: employee.typeContrat || 'CDI',
      statut: employee.statut || 'ACTIF',
      photo: employee.photo || '',
      pin: employee.pin || '1234',
      scheduled_shift_start: employee.scheduledShiftStart || '08:00',
      scheduled_shift_end: employee.scheduledShiftEnd || '17:00',
    });
    if (employeeError) {
      await adminClient.auth.admin.deleteUser(userId);
      throw new Error(employeeError.message);
    }

    const { error: auditError } = await adminClient.from('audit_logs').insert({
      user_id: caller.id,
      action: 'CREATION_EMPLOYE',
      target_entity: 'Employee',
      target_id: employeeId,
      new_value: { matricule, role, email },
      details: `Compte et profil créés pour ${employee.prenom} ${employee.nom}.`,
    });
    if (auditError) console.error('Audit creation employee failed:', auditError.message);

    return new Response(JSON.stringify({ success: true, employeeId, matricule }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Erreur serveur.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
