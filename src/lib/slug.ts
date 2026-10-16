/** "Chaveiro com Nome!" → "chaveiro-com-nome". Usado nas URLs dos produtos. */
export function gerarSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

export const SLUG_VALIDO = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
