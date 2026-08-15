// Remove um usuário por completo (auth.users + user_profiles + dados RLS-anexos).
// Bug corrigido: o painel admin antigo só deletava de user_profiles, deixando
// o auth user órfão. Aqui usamos admin.auth.deleteUser() com service_role.
// Chamar via POST { userId: "<uuid>" } — requer token de admin.
import { handleCors, jsonResponse } from '../_shared/cors.ts';
import { getUserFromRequest, adminClient, temCapacidade } from '../_shared/auth.ts';

Deno.serve(async (req) => {
  const cors = handleCors(req);
  if (cors) return cors;

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  const caller = await getUserFromRequest(req);
  if (!caller) return jsonResponse({ error: 'Unauthorized' }, 401);
  // Apagar conta é a operação mais destrutiva do painel, e por isso tem
  // capacidade própria. Antes bastava `is_admin`: quem entrava para despachar
  // pedido recebia junto o poder de apagar a base de usuários.
  if (!temCapacidade(caller, 'usuarios:excluir')) {
    return jsonResponse({ error: 'Forbidden — requer usuarios:excluir' }, 403);
  }

  let body: { userId?: string };
  try {
    body = await req.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  const userId = body.userId;
  if (!userId || !/^[0-9a-f-]{36}$/i.test(userId)) {
    return jsonResponse({ error: 'userId inválido' }, 400);
  }

  if (userId === caller.id) {
    return jsonResponse({ error: 'Não é possível deletar a própria conta por aqui' }, 400);
  }

  const admin = adminClient();
  const { error } = await admin.auth.admin.deleteUser(userId);
  if (error) return jsonResponse({ error: error.message }, 500);

  return jsonResponse({ ok: true, deleted: userId });
});
