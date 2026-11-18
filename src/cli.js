'use strict';
const { banco } = require('./config');
const { criarPool, inicializarBanco, inserirVetor, buscarVetor,
  listarVetores, salvarResultados, consultarRanking } = require('./database');
const { executarComparacao } = require('./benchmark');

function opcoes(args) {
  const o = {};
  for (let i = 0; i < args.length; i++) {
    const token = args[i];
    if (!token.startsWith('--')) throw new Error(`Opção desconhecida: ${token}`);
    const igual = token.indexOf('=');
    if (igual > -1) {
      o[token.slice(2, igual)] = token.slice(igual + 1);
    } else {
      const proximo = args[i + 1];
      if (proximo !== undefined && !proximo.startsWith('--')) {
        o[token.slice(2)] = proximo;
        i++;
      } else {
        o[token.slice(2)] = true;
      }
    }
  }
  return o;
}

function inteiro(o, chave, padrao, min, max) {
  const valor = o[chave] === undefined ? padrao : Number(o[chave]);
  if (!Number.isSafeInteger(valor) || valor < min || valor > max) {
    throw new Error(`--${chave}: informe um inteiro entre ${min} e ${max}.`);
  }
  return valor;
}

function gerador(semente) {
  let estado = semente >>> 0;
  return function () {
    estado = (Math.imul(1664525, estado) + 1013904223) >>> 0;
    return estado / 4294967296;
  };
}

function criarVetor(quantidade, minimo, maximo, aleatorio) {
  const amplitude = maximo - minimo + 1;
  const vetor = Array.from({ length: quantidade }, () => minimo + Math.floor(aleatorio() * amplitude));
  // Evita que a comparação dependa de uma ordem gerada por acidente.
  for (let i = vetor.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [vetor[i], vetor[j]] = [vetor[j], vetor[i]];
  }
  return vetor;
}

function resumoVetor(rotulo, vetor) {
  const trecho = vetor.slice(0, 25).join(', ');
  console.log(`${rotulo} (${vetor.length} elementos): [${trecho}${vetor.length > 25 ? ', ...' : ''}]`);
}

async function gerar(pool, args) {
  const quantidade = inteiro(args, 'quantidade', 1000, 1, 10_000);
  const vetores = inteiro(args, 'vetores', 1, 1, 100);
  const minimo = inteiro(args, 'min', -1000, -1_000_000, 1_000_000);
  const maximo = inteiro(args, 'max', 1000, -1_000_000, 1_000_000);
  const semente = inteiro(args, 'semente', 12345, 0, 4_294_967_295);
  if (maximo < minimo || maximo - minimo + 1 > 1_000_000) {
    throw new Error('Intervalo inválido: max deve ser >= min e a amplitude <= 1.000.000.');
  }
  if (quantidade > 4000) console.log('Aviso: métodos O(n²) podem levar bastante tempo com vetores grandes.');
  const random = gerador(semente);
  const ids = [];
  for (let i = 0; i < vetores; i++) {
    const v = criarVetor(quantidade, minimo, maximo, random);
    const id = await inserirVetor(pool, v);
    ids.push(id);
    console.log(`\nVetor gravado no MySQL: ID ${id}`);
    resumoVetor('DESORDENADO', v);
  }
  return ids;
}

async function compararId(pool, id, repeticoes) {
  const registro = await buscarVetor(pool, id);
  console.log(`\n================= VETOR ${id} =================`);
  resumoVetor('ANTES ', registro.dados);
  console.log(`Comparando 12 algoritmos (${repeticoes} medições + 2 aquecimentos por método)...`);
  const resultados = executarComparacao(registro.dados, repeticoes);
  await salvarResultados(pool, id, resultados, repeticoes);
  resumoVetor('DEPOIS', resultados[0].ordenado);
  console.log('Todos os resultados conferidos e armazenados no MySQL.');
  await exibirRanking(pool, id);
}

async function exibirRanking(pool, id) {
  const ranking = await consultarRanking(pool, id);
  if (!ranking.length) {
    console.log(`Não há resultados para o vetor ${id}. Execute 'npm run comparar -- --id ${id}'.`);
    return;
  }
  console.log(`\nRANKING DO VETOR ${id} (menor mediana em ms = mais rápido):`);
  console.table(ranking.map((r, i) => ({
    'Posição': i + 1,
    'Método': r.algoritmo,
    'Tempo (ms)': Number(r.tempo_ms).toFixed(6),
    'Medições': r.repeticoes
  })));
}

function ajuda() {
  console.log(`
COMPARADOR DE ORDENAÇÃO - Node.js + MySQL (banco: ${banco.database})
  npm run db:init
  npm run gerar -- --quantidade 1000 --vetores 1 --min -1000 --max 1000 --semente 12345
  npm run comparar -- --id 1 --repeticoes 7
  npm run comparar -- --todos --repeticoes 7
  npm run ranking -- --id 1
  npm start                  (cria banco, gera vetor e executa comparação)
  npm test                   (verifica os 12 algoritmos sem MySQL)
`);
}

async function main() {
  const [comando = 'ajuda', ...args] = process.argv.slice(2);
  if (['ajuda', 'help', '--help'].includes(comando)) return ajuda();
  const o = opcoes(args);
  if (comando === 'init') {
    await inicializarBanco();
    console.log(`Banco '${banco.database}' e tabelas criados/verificados com sucesso.`);
    return;
  }
  if (comando === 'demo') {
    await inicializarBanco();
  }
  const pool = criarPool();
  try {
    if (comando === 'gerar') {
      await gerar(pool, o);
    } else if (comando === 'comparar') {
      const repeticoes = inteiro(o, 'repeticoes', 7, 1, 30);
      if (o.todos === true) {
        const vetores = await listarVetores(pool);
        if (!vetores.length) console.log('Nenhum vetor encontrado. Execute npm run gerar.');
        for (const vetor of vetores) await compararId(pool, vetor.id, repeticoes);
      } else {
        await compararId(pool, inteiro(o, 'id', 1, 1, Number.MAX_SAFE_INTEGER), repeticoes);
      }
    } else if (comando === 'ranking') {
      await exibirRanking(pool, inteiro(o, 'id', 1, 1, Number.MAX_SAFE_INTEGER));
    } else if (comando === 'demo') {
      const [id] = await gerar(pool, { quantidade: o.quantidade ?? 1000, vetores: 1,
        min: o.min ?? -1000, max: o.max ?? 1000, semente: o.semente ?? 12345 });
      await compararId(pool, id, inteiro(o, 'repeticoes', 7, 1, 30));
    } else {
      throw new Error(`Comando '${comando}' não existe. Execute node src/cli.js ajuda.`);
    }
  } finally {
    await pool.end();
  }
}

main().catch((erro) => {
  console.error('\nERRO:', erro.message);
  if (['ECONNREFUSED', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR'].includes(erro.code)) {
    console.error('Confira se MySQL está ativo, suas credenciais no .env e se executou npm run db:init.');
  }
  process.exitCode = 1;
});
