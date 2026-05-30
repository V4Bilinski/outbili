// Teste standalone da paginacao (sem runner: roda com `node scripts/test-pagination.mjs`).
// Node >=23 faz type-stripping nativo, entao importamos a funcao .ts REAL.
// Valida as fronteiras criticas do teto de 1000 do PostgREST (aqui com pageSize pequeno).
import { paginateRange } from '../src/lib/paginate.ts'

let failures = 0
function assert(cond, msg) {
  if (cond) { console.log(`  ok  ${msg}`) }
  else { console.error(`  FAIL ${msg}`); failures++ }
}

// Mock de um SELECT paginado: devolve fatias [from..to] de um array de N itens.
function makeRunner(total) {
  const items = Array.from({ length: total }, (_, i) => i)
  const calls = []
  const runPage = async (from, to) => {
    calls.push([from, to])
    return { data: items.slice(from, to + 1), error: null }
  }
  return { runPage, calls }
}
const noErr = () => {}

console.log('paginateRange — fronteiras (pageSize=3):')

// 0 itens: 1 chamada, retorna vazio
{
  const { runPage, calls } = makeRunner(0)
  const r = await paginateRange(runPage, noErr, 3)
  assert(r.length === 0, '0 itens -> 0 linhas')
  assert(calls.length === 1, '0 itens -> 1 chamada (e para)')
}
// 2 itens (< pageSize): 1 chamada
{
  const { runPage, calls } = makeRunner(2)
  const r = await paginateRange(runPage, noErr, 3)
  assert(r.length === 2, '2 itens -> 2 linhas')
  assert(calls.length === 1, '2 itens -> 1 chamada')
}
// 3 itens (== pageSize): exige 2a chamada (que volta vazia) para confirmar o fim
{
  const { runPage, calls } = makeRunner(3)
  const r = await paginateRange(runPage, noErr, 3)
  assert(r.length === 3, '3 itens (==pageSize) -> 3 linhas (sem perder a fronteira)')
  assert(calls.length === 2, '3 itens -> 2 chamadas (a 2a confirma fim)')
}
// 7 itens: 3 chamadas (3 + 3 + 1)
{
  const { runPage, calls } = makeRunner(7)
  const r = await paginateRange(runPage, noErr, 3)
  assert(r.length === 7, '7 itens -> 7 linhas (sem truncar)')
  assert(calls.length === 3, '7 itens -> 3 chamadas')
  assert(JSON.stringify(calls) === JSON.stringify([[0,2],[3,5],[6,8]]), 'ranges corretos [0-2][3-5][6-8]')
  assert(JSON.stringify(r) === JSON.stringify([0,1,2,3,4,5,6]), 'ordem e conteudo preservados, sem duplicar fronteira')
}
// 6 itens (== 2*pageSize): 3 chamadas (3 + 3 + 0)
{
  const { runPage, calls } = makeRunner(6)
  const r = await paginateRange(runPage, noErr, 3)
  assert(r.length === 6, '6 itens (==2*pageSize) -> 6 linhas')
  assert(calls.length === 3, '6 itens -> 3 chamadas (a 3a confirma fim)')
}
// Simula o cenario real do bug: pageSize 1000, 1500 itens -> nao trunca em 1000
{
  const { runPage } = makeRunner(1500)
  const r = await paginateRange(runPage, noErr, 1000)
  assert(r.length === 1500, 'pageSize 1000 + 1500 itens -> 1500 (o bug do teto de 1000 NAO ocorre)')
}
// Propagacao de erro
{
  let captured = null
  const runPage = async () => ({ data: null, error: { message: 'boom' } })
  await paginateRange(runPage, (e) => { captured = e }, 3)
  assert(captured && captured.message === 'boom', 'erro de pagina e propagado ao onError')
}

console.log(failures === 0 ? '\nTODOS OS TESTES PASSARAM' : `\n${failures} TESTE(S) FALHARAM`)
process.exit(failures === 0 ? 0 : 1)
