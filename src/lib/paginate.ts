// Paginacao generica para contornar o teto de `max-rows` do PostgREST (default 1000
// linhas por SELECT no Supabase managed). Sem paginacao, qualquer query sem .range()
// retorna no maximo 1000 linhas SEM erro e SEM aviso, truncando dados silenciosamente.
//
// Funcao PURA por design: recebe um executor de pagina e um handler de erro, sem
// acoplar ao client Supabase. Isso a torna testavel isoladamente (scripts/test-pagination.mjs).

export const SUPABASE_PAGE_SIZE = 1000

/**
 * Acumula todas as linhas de um SELECT paginado via .range(), pagina a pagina,
 * ate o servidor devolver menos que `pageSize` (fim dos dados).
 *
 * @param runPage  executor que roda UMA pagina no intervalo [from, to] inclusivo
 *                 e devolve `{ data, error }` no formato do supabase-js.
 * @param onError  handler chamado com o erro de cada pagina (ex.: throwIfError).
 * @param pageSize tamanho da pagina (default = teto do PostgREST).
 */
export async function paginateRange<T>(
  runPage: (from: number, to: number) => Promise<{ data: T[] | null; error: unknown }>,
  onError: (error: unknown) => void,
  pageSize: number = SUPABASE_PAGE_SIZE,
): Promise<T[]> {
  const all: T[] = []
  let from = 0
  for (;;) {
    const to = from + pageSize - 1
    const { data, error } = await runPage(from, to)
    onError(error)
    const rows = data ?? []
    all.push(...rows)
    // Pagina incompleta = ultima pagina. Esvaziou exatamente no multiplo: a proxima
    // pagina volta vazia (length 0 < pageSize) e encerra sem duplicar.
    if (rows.length < pageSize) break
    from += pageSize
  }
  return all
}
