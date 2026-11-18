'use strict';

// Os algoritmos trabalham em ordem crescente, modificam o vetor recebido
// e retornam a referência ao mesmo vetor. Não utilizam Array.sort().
function trocar(a, i, j) {
  [a[i], a[j]] = [a[j], a[i]];
}

function bubbleSort(a) {
  let fim = a.length - 1;
  while (fim > 0) {
    let ultimaTroca = 0;
    for (let i = 0; i < fim; i++) {
      if (a[i] > a[i + 1]) {
        trocar(a, i, i + 1);
        ultimaTroca = i;
      }
    }
    fim = ultimaTroca;
  }
  return a;
}

function selectionSort(a) {
  for (let i = 0; i < a.length - 1; i++) {
    let menor = i;
    for (let j = i + 1; j < a.length; j++) {
      if (a[j] < a[menor]) menor = j;
    }
    if (menor !== i) trocar(a, i, menor);
  }
  return a;
}

function insertionSort(a) {
  for (let i = 1; i < a.length; i++) {
    const valor = a[i];
    let j = i - 1;
    while (j >= 0 && a[j] > valor) {
      a[j + 1] = a[j];
      j--;
    }
    a[j + 1] = valor;
  }
  return a;
}

function shellSort(a) {
  for (let intervalo = Math.floor(a.length / 2); intervalo > 0; intervalo = Math.floor(intervalo / 2)) {
    for (let i = intervalo; i < a.length; i++) {
      const valor = a[i];
      let j = i;
      while (j >= intervalo && a[j - intervalo] > valor) {
        a[j] = a[j - intervalo];
        j -= intervalo;
      }
      a[j] = valor;
    }
  }
  return a;
}

function medianaDeTres(x, y, z) {
  if (x > y) [x, y] = [y, x];
  if (y > z) [y, z] = [z, y];
  if (x > y) [x, y] = [y, x];
  return y;
}

function quickSort(a) {
  // Partição em três vias; pilha explícita para evitar estouro em vetores grandes.
  const pilha = [[0, a.length - 1]];
  while (pilha.length) {
    let [esq, dir] = pilha.pop();
    while (esq < dir) {
      const pivo = medianaDeTres(a[esq], a[Math.floor((esq + dir) / 2)], a[dir]);
      let menor = esq;
      let atual = esq;
      let maior = dir;
      while (atual <= maior) {
        if (a[atual] < pivo) trocar(a, menor++, atual++);
        else if (a[atual] > pivo) trocar(a, atual, maior--);
        else atual++;
      }
      // Empilha a partição maior e continua na menor.
      if (menor - esq < dir - maior) {
        if (maior + 1 < dir) pilha.push([maior + 1, dir]);
        dir = menor - 1;
      } else {
        if (esq < menor - 1) pilha.push([esq, menor - 1]);
        esq = maior + 1;
      }
    }
  }
  return a;
}

function mergeSort(a) {
  const n = a.length;
  if (n < 2) return a;
  let origem = a.slice();
  let destino = new Array(n);
  for (let largura = 1; largura < n; largura *= 2) {
    for (let ini = 0; ini < n; ini += 2 * largura) {
      const meio = Math.min(ini + largura, n);
      const fim = Math.min(ini + 2 * largura, n);
      let i = ini;
      let j = meio;
      let k = ini;
      while (i < meio && j < fim) {
        destino[k++] = origem[i] <= origem[j] ? origem[i++] : origem[j++];
      }
      while (i < meio) destino[k++] = origem[i++];
      while (j < fim) destino[k++] = origem[j++];
    }
    [origem, destino] = [destino, origem];
  }
  for (let i = 0; i < n; i++) a[i] = origem[i];
  return a;
}

function combSort(a) {
  let intervalo = a.length;
  let trocou = true;
  while (intervalo > 1 || trocou) {
    intervalo = Math.max(1, Math.floor(intervalo / 1.3));
    trocou = false;
    for (let i = 0; i + intervalo < a.length; i++) {
      if (a[i] > a[i + intervalo]) {
        trocar(a, i, i + intervalo);
        trocou = true;
      }
    }
  }
  return a;
}

function countingSort(a) {
  if (a.length < 2) return a;
  let minimo = a[0];
  let maximo = a[0];
  for (const n of a) {
    if (n < minimo) minimo = n;
    if (n > maximo) maximo = n;
  }
  const amplitude = maximo - minimo + 1;
  if (amplitude > 1_000_000) {
    throw new RangeError('CountingSort exige amplitude de valores de no máximo 1.000.000.');
  }
  const contagem = new Uint32Array(amplitude);
  for (const n of a) contagem[n - minimo]++;
  let p = 0;
  for (let i = 0; i < contagem.length; i++) {
    while (contagem[i] > 0) {
      a[p++] = i + minimo;
      contagem[i]--;
    }
  }
  return a;
}

function radixNaoNegativo(a) {
  if (a.length < 2) return a;
  let maximo = 0;
  for (const valor of a) if (valor > maximo) maximo = valor;
  let origem = a;
  let destino = new Array(a.length);
  for (let exp = 1; Math.floor(maximo / exp) > 0; exp *= 10) {
    const contagem = new Array(10).fill(0);
    for (const num of origem) contagem[Math.floor(num / exp) % 10]++;
    for (let i = 1; i < 10; i++) contagem[i] += contagem[i - 1];
    for (let i = origem.length - 1; i >= 0; i--) {
      const digito = Math.floor(origem[i] / exp) % 10;
      destino[--contagem[digito]] = origem[i];
    }
    [origem, destino] = [destino, origem];
  }
  return origem;
}

function radixSort(a) {
  // Negativos em valor absoluto, invertidos no fim; positivos normalmente.
  const negativos = [];
  const naoNegativos = [];
  for (const n of a) (n < 0 ? negativos : naoNegativos).push(n < 0 ? -n : n);
  const negOrdenados = radixNaoNegativo(negativos);
  const posOrdenados = radixNaoNegativo(naoNegativos);
  let indice = 0;
  for (let i = negOrdenados.length - 1; i >= 0; i--) a[indice++] = -negOrdenados[i];
  for (const n of posOrdenados) a[indice++] = n;
  return a;
}

function bucketSort(a) {
  const n = a.length;
  if (n < 2) return a;
  let minimo = a[0];
  let maximo = a[0];
  for (const valor of a) {
    if (valor < minimo) minimo = valor;
    if (valor > maximo) maximo = valor;
  }
  if (minimo === maximo) return a;
  const quantidadeBaldes = Math.max(1, Math.floor(Math.sqrt(n)));
  const baldes = Array.from({ length: quantidadeBaldes }, () => []);
  const amplitude = maximo - minimo + 1;
  for (const valor of a) {
    const indice = Math.min(quantidadeBaldes - 1,
      Math.floor(((valor - minimo) / amplitude) * quantidadeBaldes));
    baldes[indice].push(valor);
  }
  let p = 0;
  for (const balde of baldes) {
    insertionSort(balde);
    for (const valor of balde) a[p++] = valor;
  }
  return a;
}

function cycleSort(a) {
  for (let inicio = 0; inicio < a.length - 1; inicio++) {
    let item = a[inicio];
    let pos = inicio;
    for (let i = inicio + 1; i < a.length; i++) {
      if (a[i] < item) pos++;
    }
    if (pos === inicio) continue;
    while (item === a[pos]) pos++;
    [a[pos], item] = [item, a[pos]];
    while (pos !== inicio) {
      pos = inicio;
      for (let i = inicio + 1; i < a.length; i++) {
        if (a[i] < item) pos++;
      }
      while (item === a[pos]) pos++;
      [a[pos], item] = [item, a[pos]];
    }
  }
  return a;
}

function timSort(a) {
  // Versão didática de TimSort: detecta runs naturais, insere binariamente,
  // mantém invariantes na pilha e intercala runs. Sem otimização 'galloping'.
  const n = a.length;
  if (n < 2) return a;

  function minRun(tamanho) {
    let resto = 0;
    while (tamanho >= 64) {
      resto |= tamanho & 1;
      tamanho >>= 1;
    }
    return tamanho + resto;
  }

  function runNatural(inicio) {
    let fim = inicio + 2;
    if (fim > n) return 1;
    const descendente = a[inicio + 1] < a[inicio];
    while (fim < n && (descendente ? a[fim] < a[fim - 1] : a[fim] >= a[fim - 1])) fim++;
    if (descendente) {
      for (let i = inicio, j = fim - 1; i < j; i++, j--) trocar(a, i, j);
    }
    return fim - inicio;
  }

  function insercaoBinaria(inicio, fim, de) {
    for (let i = de; i < fim; i++) {
      const valor = a[i];
      let esq = inicio;
      let dir = i;
      while (esq < dir) {
        const meio = Math.floor((esq + dir) / 2);
        if (valor < a[meio]) dir = meio;
        else esq = meio + 1;
      }
      for (let j = i; j > esq; j--) a[j] = a[j - 1];
      a[esq] = valor;
    }
  }

  const pilha = [];
  function mesclar(indice) {
    const esquerda = pilha[indice];
    const direita = pilha[indice + 1];
    const copiaEsquerda = a.slice(esquerda.inicio, esquerda.inicio + esquerda.tamanho);
    const copiaDireita = a.slice(direita.inicio, direita.inicio + direita.tamanho);
    let i = 0, j = 0, k = esquerda.inicio;
    while (i < copiaEsquerda.length && j < copiaDireita.length) {
      a[k++] = copiaEsquerda[i] <= copiaDireita[j]
        ? copiaEsquerda[i++] : copiaDireita[j++];
    }
    while (i < copiaEsquerda.length) a[k++] = copiaEsquerda[i++];
    while (j < copiaDireita.length) a[k++] = copiaDireita[j++];
    esquerda.tamanho += direita.tamanho;
    pilha.splice(indice + 1, 1);
  }

  function equilibrar() {
    while (pilha.length > 1) {
      let i = pilha.length - 2;
      if ((i > 0 && pilha[i - 1].tamanho <= pilha[i].tamanho + pilha[i + 1].tamanho) ||
          (i > 1 && pilha[i - 2].tamanho <= pilha[i - 1].tamanho + pilha[i].tamanho)) {
        if (pilha[i - 1].tamanho < pilha[i + 1].tamanho) i--;
        mesclar(i);
      } else if (pilha[i].tamanho <= pilha[i + 1].tamanho) {
        mesclar(i);
      } else break;
    }
  }

  const minimo = minRun(n);
  let pos = 0;
  while (pos < n) {
    let tamanho = runNatural(pos);
    const tamanhoAlvo = Math.min(minimo, n - pos);
    if (tamanho < tamanhoAlvo) {
      insercaoBinaria(pos, pos + tamanhoAlvo, pos + tamanho);
      tamanho = tamanhoAlvo;
    }
    pilha.push({ inicio: pos, tamanho });
    equilibrar();
    pos += tamanho;
  }
  while (pilha.length > 1) {
    let i = pilha.length - 2;
    if (i > 0 && pilha[i - 1].tamanho < pilha[i + 1].tamanho) i--;
    mesclar(i);
  }
  return a;
}

const algoritmos = {
  BubbleSort: bubbleSort,
  SelectionSort: selectionSort,
  InsertionSort: insertionSort,
  ShellSort: shellSort,
  QuickSort: quickSort,
  MergeSort: mergeSort,
  CombSort: combSort,
  CountingSort: countingSort,
  RadixSort: radixSort,
  BucketSort: bucketSort,
  TimSort: timSort,
  CycleSort: cycleSort
};

module.exports = { algoritmos, bubbleSort, selectionSort, insertionSort, shellSort,
  quickSort, mergeSort, combSort, countingSort, radixSort, bucketSort, timSort, cycleSort };
