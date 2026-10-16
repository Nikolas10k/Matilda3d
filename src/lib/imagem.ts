// Preparação de fotos no navegador antes do upload (docs/04: webp, máx. 1600px).

export const LADO_MAXIMO = 1600;
export const TAMANHO_MAXIMO_ORIGINAL = 20 * 1024 * 1024; // 20 MB antes de converter
export const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

/** Reduz mantendo a proporção para que o maior lado tenha no máximo `maximo` px. */
export function dimensoesReduzidas(largura: number, altura: number, maximo = LADO_MAXIMO) {
  const maior = Math.max(largura, altura);
  if (maior <= maximo) return { largura, altura };
  const escala = maximo / maior;
  return { largura: Math.round(largura * escala), altura: Math.round(altura * escala) };
}

/** Converte a imagem para webp, já redimensionada. Só funciona no navegador. */
export async function converterParaWebp(arquivo: File, qualidade = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(arquivo);
  const { largura, altura } = dimensoesReduzidas(bitmap.width, bitmap.height);

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Seu navegador não conseguiu processar a imagem.");
  ctx.drawImage(bitmap, 0, 0, largura, altura);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", qualidade));
  if (!blob || blob.type !== "image/webp") {
    throw new Error("Seu navegador não conseguiu converter a foto. Tente outra imagem ou outro navegador.");
  }
  return blob;
}
