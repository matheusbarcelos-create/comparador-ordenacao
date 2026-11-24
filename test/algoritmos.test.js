'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { algoritmos } = require('../src/algoritmos');
const { gerarVetor, comparar, TAMANHO, REPETICOES } = require('../src/index');

const entradas = [
  [], [1], [2, 1], [1, 1, 1],
  [5, 3, 10, 2, 3, 1],
  Array.from({ length: 100 }, (_, i) => 100 - i),
  Array.from({ length: 250 }, (_, i) => i % 17 + 1),
  Array.from({ length: 1000 }, (_, i) => ((i * 7919) % 10000) + 1)
];

for (const [nome, metodo] of Object.entries(algoritmos)) {
  test(`${nome} ordena corretamente`, () => {
    for (const valores of entradas) {
      const original = [...valores];
      const copia = [...valores];
      assert.strictEqual(metodo(copia), copia);
      assert.deepEqual(copia, [...original].sort((a, b) => a - b));
      assert.deepEqual(valores, original);
    }
  });
}

test('existem exatamente 13 métodos', () => {
  assert.equal(Object.keys(algoritmos).length, 13);
});

test('gerador produz permutação positiva de 1 a 10000', () => {
  const v = gerarVetor();
  assert.equal(v.length, TAMANHO);
  assert.equal(new Set(v).size, TAMANHO);
  assert.equal(Math.min(...v), 1);
  assert.equal(Math.max(...v), TAMANHO);
});

test('todos recebem mesmo vetor, sem alterar o original', () => {
  const original = [8, 6, 3, 1, 2, 10, 5, 9, 4, 7];
  const antes = [...original];
  const resultados = comparar(original);
  assert.equal(resultados.length, 13);
  for (const r of resultados) {
    assert.deepEqual(r.ordenado, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    assert.equal(r.tempos.length, REPETICOES);
    assert.ok(r.tempoMs >= 0);
  }
  assert.deepEqual(original, antes);
});

test('os 13 algoritmos ordenam o mesmo vetor completo de 10000 posições', () => {
  const original = gerarVetor();
  const resultados = comparar(original);
  const esperado = Array.from({ length: TAMANHO }, (_, i) => i + 1);
  for (const r of resultados) assert.deepEqual(r.ordenado, esperado, r.nome);
  assert.notDeepEqual(original, esperado);
});
