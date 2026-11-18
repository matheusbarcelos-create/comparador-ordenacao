'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { algoritmos } = require('../src/algoritmos');
const { executarComparacao, mediana } = require('../src/benchmark');

const casos = [
  [], [1], [2, 1], [1, 1], [5, 4, 3, 2, 1], [1, 2, 3, 4, 5],
  [0, -2, 4, -8, 0, 20, -2, 1], [7, 7, 7, 7], [-1, -3, -2],
  [100, 3, 0, 100, -100, -100, 4, 5],
  Array.from({length: 100}, (_, i) => i % 8),
  Array.from({length: 100}, (_, i) => 100 - i),
  Array.from({length: 1000}, (_, i) => (i * 7919) % 199 - 99),
  Array.from({length: 2000}, (_, i) => (i * 17) % 113 - 50)
];

for (const [nome, ordenar] of Object.entries(algoritmos)) {
  test(`${nome}: vetores fixos, vazios, repetidos e negativos`, () => {
    for (const entrada of casos) {
      const copia = entrada.slice();
      const recebido = ordenar(copia);
      assert.strictEqual(recebido, copia, 'deve retornar o vetor recebido');
      assert.deepEqual(copia, entrada.slice().sort((a, b) => a - b));
      assert.deepEqual(entrada, casos[casos.indexOf(entrada)], 'não deve alterar o original');
    }
  });

  test(`${nome}: vetores aleatórios`, () => {
    let estado = 42;
    const rnd = () => ((estado = (Math.imul(1664525, estado) + 1013904223) >>> 0) / 4294967296);
    for (let tamanho = 0; tamanho < 100; tamanho += 5) {
      const entrada = Array.from({length: tamanho}, () => Math.floor(rnd() * 51) - 25);
      assert.deepEqual(ordenar(entrada.slice()), entrada.slice().sort((a, b) => a - b));
    }
  });
}

test('benchmark mede e valida os 12 algoritmos', () => {
  const entrada = [20, -4, 5, 2, 2, 0, -7, 10, 3, 1];
  const resultados = executarComparacao(entrada, 3);
  assert.equal(resultados.length, 12);
  for (const r of resultados) {
    assert.deepEqual(r.ordenado, [-7, -4, 0, 1, 2, 2, 3, 5, 10, 20]);
    assert.equal(r.amostrasMs.length, 3);
    assert.ok(r.medianaMs >= 0);
  }
  assert.deepEqual(entrada, [20, -4, 5, 2, 2, 0, -7, 10, 3, 1]);
  assert.equal(mediana([2, 5, 1, 4]), 3);
});
