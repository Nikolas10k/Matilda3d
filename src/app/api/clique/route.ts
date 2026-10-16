import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

// Registro anônimo de cliques no botão do WhatsApp (docs/03): só produto, origem
// e data. Nenhum dado do visitante é guardado (nem IP). Gravado pelo servidor
// com a service_role, porque visitantes não têm permissão de escrita no banco.
const esquema = z.object({
  produtoId: z.string().uuid().nullable().optional(),
  origem: z.enum(["card", "pagina_produto", "header", "encomenda"]),
});

export async function POST(request: Request) {
  let corpo: unknown;
  try {
    corpo = JSON.parse(await request.text());
  } catch {
    return new Response(null, { status: 400 });
  }
  const r = esquema.safeParse(corpo);
  if (!r.success) return new Response(null, { status: 400 });

  try {
    // Produto inexistente é recusado pela chave estrangeira; o erro é ignorado de propósito.
    await createAdminClient().from("cliques_whatsapp").insert({ produto_id: r.data.produtoId ?? null, origem: r.data.origem });
  } catch {
    // Sem service_role configurada: o clique simplesmente não é contado.
  }
  return new Response(null, { status: 204 });
}
