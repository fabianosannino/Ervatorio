// Helpers de autenticação para Edge Functions.
// Extrai o JWT do cabeçalho Authorization e resolve o user_profile
// via service_role, evitando ida ao Postgres usando RLS.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface AuthedUser {
  id: string;
  email: string | null;
  isAdmin: boolean;
  /**
   * O que este admin pode fazer. `isAdmin` diz se ele ENTRA no painel;
   * isto diz o que ele FAZ. Ver a migration 20260815220000.
   */
  capabilities: string[];
}

/**
 * O chamador tem a capacidade?
 *
 * Exige `isAdmin` também, e não só a presença na lista: revogar o acesso ao
 * painel de alguém precisa bastar para tirar tudo, sem caçar cada capacidade
 * que essa pessoa acumulou. É a mesma regra de `public.tem_capacidade()`, e as
 * duas precisam concordar — o RLS é a barreira, isto aqui é a que responde
 * antes, com uma mensagem melhor.
 */
export function temCapacidade(user: AuthedUser | null, capacidade: string): boolean {
  return !!user?.isAdmin && user.capabilities.includes(capacidade);
}

export async function getUserFromRequest(req: Request): Promise<AuthedUser | null> {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error } = await admin.auth.getUser(auth.replace('Bearer ', ''));
  if (error || !userData?.user) return null;

  const { data: profile } = await admin
    .from('user_profiles')
    .select('is_admin, admin_capabilities')
    .eq('id', userData.user.id)
    .maybeSingle();

  return {
    id: userData.user.id,
    email: userData.user.email ?? null,
    isAdmin: !!profile?.is_admin,
    capabilities: profile?.admin_capabilities ?? [],
  };
}

export function adminClient() {
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  return createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
