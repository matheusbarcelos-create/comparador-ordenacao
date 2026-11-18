'use strict';
const mysql = require('mysql2/promise');
const fs = require('node:fs/promises');
const path = require('node:path');
const { banco } = require('./config');

function criarPool() {
  return mysql.createPool({ ...banco, waitForConnections: true, connectionLimit: 5,
    decimalNumbers: true });
}

async function inicializarBanco() {
  const conexao = await mysql.createConnection({
    host: banco.host, port: banco.port, user: banco.user, password: banco.password
  });
  try {
    await conexao.query(`CREATE DATABASE IF NOT EXISTS \`${banco.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await conexao.query(`USE \`${banco.database}\``);
    const schema = await fs.readFile(path.resolve(__dirname, '../sql/schema.sql'), 'utf8');
    for (const comando of schema.split(';').map(s => s.trim()).filter(Boolean)) {
      await conexao.query(comando);
    }
  } finally {
    await conexao.end();
  }
}

async function inserirVetor(pool, vetor) {
  const [resultado] = await pool.execute(
    'INSERT INTO vetores (dados_desordenados, tamanho) VALUES (?, ?)',
    [JSON.stringify(vetor), vetor.length]
  );
  return resultado.insertId;
}

async function buscarVetor(pool, id) {
  const [linhas] = await pool.execute(
    'SELECT id, dados_desordenados, tamanho FROM vetores WHERE id = ?', [id]
  );
  if (!linhas.length) throw new Error(`Vetor de ID ${id} não encontrado no banco.`);
  const vetor = linhas[0].dados_desordenados;
  return { id: linhas[0].id, tamanho: linhas[0].tamanho,
    dados: typeof vetor === 'string' ? JSON.parse(vetor) : vetor };
}

async function listarVetores(pool) {
  const [linhas] = await pool.query('SELECT id, tamanho FROM vetores ORDER BY id');
  return linhas;
}

async function salvarResultados(pool, vetorId, resultados, repeticoes) {
  const conexao = await pool.getConnection();
  try {
    await conexao.beginTransaction();
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
      `, [vetorId, r.nome, JSON.stringify(r.ordenado), r.medianaMs,
        repeticoes, JSON.stringify(r.amostrasMs)]);
    }
    await conexao.commit();
  } catch (erro) {
    await conexao.rollback();
    throw erro;
  } finally {
    conexao.release();
  }
}

async function consultarRanking(pool, vetorId) {
  const [linhas] = await pool.execute(
    `SELECT algoritmo, tempo_ms, repeticoes FROM resultados
     WHERE vetor_id = ? AND valido = 1 ORDER BY tempo_ms ASC, algoritmo ASC`, [vetorId]
  );
  return linhas;
}

module.exports = { criarPool, inicializarBanco, inserirVetor, buscarVetor,
  listarVetores, salvarResultados, consultarRanking };
