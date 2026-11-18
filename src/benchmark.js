'use strict';
const { algoritmos } = require('./algoritmos');

function validarVetor(vetor) {
  if (!Array.isArray(vetor)) throw new TypeError('O vetor precisa ser um array.');
  if (!vetor.every(Number.isSafeInteger)) {
    throw new TypeError('Todos os elementos precisam ser números inteiros seguros.');
  }
  if (vetor.length > 100_000) throw new RangeError('Limite de 100.000 elementos por vetor.');
  let minimo = Infinity;
  let maximo = -Infinity;
  for (const valor of vetor) {
    if (valor < minimo) minimo = valor;
    if (valor > maximo) maximo = valor;
  }
  if (vetor.length && maximo - minimo + 1 > 1_000_000) {
    throw new RangeError('Amplitude maior que 1.000.000: CountingSort consumiria muita memória.');
  }
}

function mediana(valores) {
  const ordenados = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);
  return ordenados.length % 2 ? ordenados[meio] : (ordenados[meio - 1] + ordenados[meio]) / 2;
}

function embaralhar(lista, semente) {
  let estado = semente >>> 0;
  function aleatorio() {
    estado = (Math.imul(1664525, estado) + 1013904223) >>> 0;
    return estado / 4294967296;
  }
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

function executarComparacao(vetor, repeticoes = 7) {
  validarVetor(vetor);
  if (!Number.isInteger(repeticoes) || repeticoes < 1 || repeticoes > 30) {
    throw new RangeError('Repetições devem ser de 1 a 30.');
  }
  const esperado = vetor.slice().sort((a, b) => a - b); // apenas validação, não entra no ranking
  const metodos = Object.entries(algoritmos);
  const amostras = new Map(metodos.map(([nome]) => [nome, []]));
  const saidas = new Map();

  function conferir(nome, resultado) {
    if (!Array.isArray(resultado) || resultado.length !== esperado.length ||
        resultado.some((valor, i) => valor !== esperado[i])) {
      throw new Error(`${nome} devolveu ordenação incorreta. Nenhum resultado será salvo.`);
    }
  }

  // Aquecimento não cronometrado para minimizar o efeito da compilação JIT.
  for (const [nome, ordenar] of metodos) {
    for (let i = 0; i < 2; i++) conferir(nome, ordenar(vetor.slice()));
  }

  // A ordem muda a cada rodada para reduzir o viés da posição no teste.
  for (let rodada = 0; rodada < repeticoes; rodada++) {
    for (const [nome, ordenar] of embaralhar(metodos, 4096 + rodada)) {
      const copia = vetor.slice(); // cópia fora da medição
      const inicio = process.hrtime.bigint();
      const resultado = ordenar(copia);
      const tempoMs = Number(process.hrtime.bigint() - inicio) / 1_000_000;
      conferir(nome, resultado); // validação fora da medição
      amostras.get(nome).push(tempoMs);
      saidas.set(nome, resultado);
    }
  }

  return metodos.map(([nome]) => ({
    nome, ordenado: saidas.get(nome), amostrasMs: amostras.get(nome),
    medianaMs: mediana(amostras.get(nome))
  }));
}

module.exports = { executarComparacao, validarVetor, mediana };
