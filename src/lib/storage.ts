// Endereços públicos do Supabase Storage (buckets públicos: produtos, marca).

export const BUCKET_PRODUTOS = "produtos";

export function urlPublica(bucket: string, caminho: string): string {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const caminhoCodificado = caminho.split("/").map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${bucket}/${caminhoCodificado}`;
}

export function urlFotoProduto(caminho: string): string {
  return urlPublica(BUCKET_PRODUTOS, caminho);
}
