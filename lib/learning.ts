import { Comercio } from "@/types";

/**
 * Finds a matching category for a given store name using the learned mappings.
 * First tries exact match, then substring match.
 */
export function findCategoria(
  comercio: string,
  comercios: Comercio[]
): string | null {
  const upper = comercio.toUpperCase();

  // 1. Exact match
  const exact = comercios.find((c) => c.comercio.toUpperCase() === upper);
  if (exact) return exact.categoria;

  // 2. Substring match (comercio contains a known store name, or vice versa)
  const substr = comercios.find(
    (c) =>
      upper.includes(c.comercio.toUpperCase()) ||
      c.comercio.toUpperCase().includes(upper)
  );
  if (substr) return substr.categoria;

  return null;
}
