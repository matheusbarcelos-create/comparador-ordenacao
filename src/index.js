'use strict';

// Ao executar o programa, carrega o .env antes de ler as credenciais.
// Nos testes de algoritmos, o MySQL não precisa estar instalado/conectado.
if (require.main === module) require('dotenv').config();
const fs = require('node:fs/promises');
const path = require('node:path');
const { randomInt } = require('node:crypto');
const { algoritmos } = require('./algoritmos');

// Um único vetor com 10.000 posições: cada inteiro de 1 a 10.000 aparece
// exatamente uma vez, em ordem aleatória (Fisher-Yates).
const TAMANHO = 10_000;
const REPETICOES = 3;
const banco = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME || 'comparador_ordenacao'
};

if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(banco.database)) {
  throw new Error('DB_NAME inválido: use apenas letras, números e underline.');
}

function gerarVetor() {
  const v = Array.from({ length: TAMANHO }, (_, i) => i + 1);
  for (let i = v.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [v[i], v[j]] = [v[j], v[i]];
  }
  return v;
}

async function conectar() {
  const mysql = require('mysql2/promise');
  // Conecta sem banco para que o comando npm start também funcione
  // quando comparador_ordenacao ainda não existir.
  const conexao = await mysql.createConnection({
    host: banco.host,
    port: banco.port,
    user: banco.user,
    password: banco.password,
    decimalNumbers: true
  });
  await conexao.query(`CREATE DATABASE IF NOT EXISTS \`${banco.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conexao.query(`USE \`${banco.database}\``);
  const schema = await fs.readFile(path.join(__dirname, '../sql/schema.sql'), 'utf8');
  for (const sql of schema.split(';').map((parte) => parte.trim()).filter(Boolean)) {
    await conexao.query(sql);
  }
  return conexao;
}

async function gravarVetor(conexao) {
  const vetor = gerarVetor();
  const [resposta] = await conexao.execute(
    'INSERT INTO vetores (dados_desordenados, tamanho) VALUES (?, ?)',
    [JSON.stringify(vetor), vetor.length]
  );
  return resposta.insertId;
}

async function buscarVetor(conexao, id) {
  const [linhas] = await conexao.execute(
    'SELECT dados_desordenados FROM vetores WHERE id = ?', [id]
  );
  if (!linhas.length) throw new Error(`Vetor ID ${id} não encontrado.`);
  const dados = linhas[0].dados_desordenados;
  const vetor = typeof dados === 'string' ? JSON.parse(dados) : dados;
  // Evita misturar benchmarks com os vetores antigos, menores ou negativos.
  if (!Array.isArray(vetor) || vetor.length !== TAMANHO ||
      vetor.some((v) => !Number.isInteger(v) || v < 1 || v > TAMANHO)) {
    throw new Error('O vetor deve conter exatamente 10.000 inteiros entre 1 e 10.000. Execute npm start para criar um novo.');
  }
  return vetor;
}

function mediana(valores) {
  const v = [...valores].sort((a, b) => a - b); // Só para calcular a estatística, fora da cronometragem.
  return v[Math.floor(v.length / 2)];
}

function comparar(vetor) {
  // A conferência usa Array.sort apenas como referência, fora da cronometragem.
  const esperado = [...vetor].sort((a, b) => a - b);
  const saida = [];
  const original = [...vetor];

  // Cada método recebe sua PRÓPRIA CÓPIA do vetor original retirado do MySQL.
  for (const [nome, ordenar] of Object.entries(algoritmos)) {
    const tempos = [];
    let ordenado = null;
    for (let repeticao = 0; repeticao < REPETICOES; repeticao++) {
      const copia = [...original];  // Não entra no tempo.
      const inicio = process.hrtime.bigint();
      const resultado = ordenar(copia);
      const fim = process.hrtime.bigint();
      const tempoMs = Number(fim - inicio) / 1_000_000;

      if (resultado !== copia || resultado.length !== esperado.length ||
          resultado.some((n, i) => n !== esperado[i])) {
        throw new Error(`${nome} não ordenou corretamente. Os resultados não serão gravados.`);
      }
      tempos.push(tempoMs);
      ordenado = copia;
    }
    saida.push({ nome, ordenado, tempos, tempoMs: mediana(tempos) });
  }
  return saida;
}

async function salvarResultados(conexao, id, resultados) {
  await conexao.beginTransaction();
  try {
    for (const r of resultados) {
      await conexao.execute(`
        INSERT INTO resultados
          (vetor_id, algoritmo, dados_ordenados, tempo_ms, repeticoes, amostras_ms, valido)
        VALUES (?, ?, ?, ?, ?, ?, 1)
        ON DUPLICATE KEY UPDATE
          dados_ordenados = VALUES(dados_ordenados),
          tempo_ms = VALUES(tempo_ms),
          repeticoes = VALUES(repeticoes),
          amostras_ms = VALUES(amostras_ms),
          valido = 1,
          executado_em = CURRENT_TIMESTAMP
      `, [id, r.nome, JSON.stringify(r.ordenado), r.tempoMs,
        REPETICOES, JSON.stringify(r.tempos)]);
    }
    await conexao.commit();
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  }
}

async function ranking(conexao, id) {
  const [linhas] = await conexao.execute(`
    SELECT algoritmo, tempo_ms
    FROM resultados
    WHERE vetor_id = ? AND valido = 1
    ORDER BY tempo_ms ASC, algoritmo ASC
  `, [id]);
  if (!linhas.length) {
    console.log(`Ainda não há resultados para o vetor ${id}.`);
    return;
  }
  console.log(`\nRANKING DO VETOR ${id} (mediana de ${REPETICOES} execuções):`);
  console.table(linhas.map((r, i) => ({
    'Posição': i + 1,
    'Método': r.algoritmo,
    'Tempo (ms)': Number(r.tempo_ms).toFixed(6)
  })));
}

async function ultimoId(conexao) {
  const [linhas] = await conexao.query('SELECT id FROM vetores ORDER BY id DESC LIMIT 1');
  if (!linhas.length) throw new Error('Nenhum vetor cadastrado. Execute npm start.');
  return linhas[0].id;
}

function idOpcional() {
  const pos = process.argv.indexOf('--id');
  if (pos === -1) return null;
  const id = Number(process.argv[pos + 1]);
  if (!Number.isSafeInteger(id) || id < 1) throw new Error('Informe um ID válido: --id 1');
  return id;
}

async function main() {
  const comando = process.argv[2] || 'executar';
  if (!['executar', 'init', 'comparar', 'ranking'].includes(comando)) {
    throw new Error('Comando inválido. Use npm start, npm run db:init, npm run comparar ou npm run ranking.');
  }
  let conexao;
  try {
    conexao = await conectar();
    if (comando === 'init') {
      console.log(`Banco '${banco.database}' e tabelas prontos.`);
      return;
    }
    const id = comando === 'executar'
      ? await gravarVetor(conexao)
      : (idOpcional() ?? await ultimoId(conexao));
    if (comando !== 'ranking') {
      // Busca novamente no MySQL. Nenhuma função usa o vetor em memória
      // criado pelo gerador: todas recebem o valor efetivamente salvo.
      const vetorOriginal = await buscarVetor(conexao, id);
      console.log(`\nVetor DESORDENADO salvo no MySQL (ID ${id}, ${vetorOriginal.length} elementos):`);
      console.log(`[${vetorOriginal.slice(0, 25).join(', ')}, ...]`);
      console.log(`\nExecutando os 13 métodos (${REPETICOES} medições por método)...`);
      const resultados = comparar(vetorOriginal);
      await salvarResultados(conexao, id, resultados);
      console.log(`Vetor ORDENADO (exemplo dos 25 primeiros):`);
      console.log(`[${resultados[0].ordenado.slice(0, 25).join(', ')}, ...]`);
      console.log('Os 13 vetores ordenados e seus tempos foram gravados no MySQL.');
    }
    await ranking(conexao, id);
  } finally {
    if (conexao) await conexao.end();
  }
}

if (require.main === module) {
  main().catch((erro) => {
    console.error('\nERRO:', erro.message);
    process.exitCode = 1;
  });
}

module.exports = { gerarVetor, comparar, TAMANHO, REPETICOES };
