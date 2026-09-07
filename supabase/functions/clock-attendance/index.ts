import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const timeZone = 'Africa/Kinshasa';
const formatter = new Intl.DateTimeFormat('en-CA', {
  timeZone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

const getLocalParts = () => {
  const parts = Object.fromEntries(formatter.formatToParts(new Date())
    .filter(part => part.type !== 'literal')
    .map(part => [part.type, part.value]));
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}:${parts.second}`,
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  };
};

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return new Response('Méthode non autorisée.', { status: 405, headers: corsHeaders });

  try {
    const { matricule, pin, type } = await request.json();
    if (typeof matricule !== 'string' || !/^EMP-[A-Z0-9-]+$/i.test(matricule.trim()) || typeof pin !== 'string' || !/^\d{4}$/.test(pin) || !['ENTREE', 'DEBUT_PAUSE', 'FIN_PAUSE', 'SORTIE'].includes(type)) {
      throw new Error('Informations de pointage invalides.');
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const [{ data: employee, error: employeeError }, { data: workRules, error: rulesError }] = await Promise.all([
      adminClient
      .from('employees')
      .select('id, matricule, pin, statut, scheduled_shift_start')
      .ilike('matricule', matricule.trim())
      .maybeSingle(),
      adminClient.from('work_rules').select('work_start, late_after_minutes').eq('id', true).maybeSingle(),
    ]);

    if (employeeError) throw new Error(employeeError.message);
    if (rulesError) throw new Error(rulesError.message);
    if (!employee || employee.statut !== 'ACTIF' || employee.pin !== pin) {
      return new Response(JSON.stringify({ success: false, error: 'Matricule ou code PIN incorrect.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const now = getLocalParts();
    const [hour, minute] = String(employee.scheduled_shift_start || workRules?.work_start || '08:00').slice(0, 5).split(':').map(Number);
    const scheduledMinutes = hour * 60 + minute;
    const lateAfterMinutes = workRules?.late_after_minutes ?? 5;
    const delayMinutes = type === 'ENTREE' && now.minutes > scheduledMinutes + lateAfterMinutes ? now.minutes - scheduledMinutes : 0;
    const status = delayMinutes > 0 ? 'RETARD' : 'PRESENT';
    const attendanceId = `att-${crypto.randomUUID()}`;

    const { error: insertError } = await adminClient.from('attendance_records').insert({
      id: attendanceId,
      employee_id: employee.id,
      date: now.date,
      time: now.time,
      type,
      status,
      delay_minutes: delayMinutes,
      validation_method: 'PIN',
    });
    if (insertError) throw new Error(insertError.message);

    await adminClient.from('audit_logs').insert({
      action: 'POINTAGE_BORNE',
      target_entity: 'AttendanceRecord',
      target_id: attendanceId,
      details: `Pointage ${type} validé sur borne pour ${employee.matricule}.`,
    });

    const labels: Record<string, string> = {
      ENTREE: 'Prise de poste',
      DEBUT_PAUSE: 'Début de pause',
      FIN_PAUSE: 'Fin de pause',
      SORTIE: 'Fin de service',
    };
    const label = labels[type] || 'Pointage';
    return new Response(JSON.stringify({
      success: true,
      message: `${label} enregistrée à ${now.time}.`,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Pointage impossible.' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
