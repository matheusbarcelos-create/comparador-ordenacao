# Comparador de 13 Algoritmos de Ordenação — Node.js + MySQL

Projeto de Estrutura de Dados II que compara **13 algoritmos** utilizando **exatamente o mesmo vetor** armazenado no MySQL.

## Objetivo

1. Gerar **um vetor com 10.000 inteiros positivos**, contendo todos os números de `1` a `10.000`, em ordem aleatória e sem repetição.
2. Salvar esse vetor **desordenado** na tabela `vetores` do MySQL.
3. **Ler o vetor de volta do MySQL**, de modo que a fonte da entrada de todos os algoritmos seja a mesma.
4. Passar uma **cópia idêntica** do vetor para cada uma das 13 funções de ordenação. Uma função não recebe o resultado da outra.
5. Cronometrar cada ordenação com `process.hrtime.bigint()`, usando **3 execuções por algoritmo** e a **mediana em milissegundos** como tempo do ranking.
6. Verificar se cada função retornou o vetor corretamente ordenado.
7. Salvar **13 vetores ordenados**, os tempos e suas medições na tabela `resultados`.
8. Exibir o **ranking do mais rápido para o mais lento** no terminal e permitir consulta pelo MySQL Workbench.

> **Não são gerados números negativos ou zero.** Os números são sempre de `1` a `10.000`, inclusive.

## Os 13 métodos

As implementações estão no arquivo [`src/algoritmos.js`](src/algoritmos.js), com uma função de ordenação para cada método:

| N.º | Método | Função |
| ---: | --- | --- |
| 1 | BubbleSort | `bubbleSort()` |
| 2 | SelectionSort | `selectionSort()` |
| 3 | InsertionSort | `insertionSort()` |
| 4 | ShellSort | `shellSort()` |
| 5 | QuickSort | `quickSort()` |
| 6 | IntroSort | `introSort()` |
| 7 | MergeSort | `mergeSort()` |
| 8 | CombSort | `combSort()` |
| 9 | CountingSort | `countingSort()` |
| 10 | RadixSort | `radixSort()` |
| 11 | BucketSort | `bucketSort()` |
| 12 | TimSort | `timSort()` |
| 13 | CycleSort | `cycleSort()` |

**Nota:** TimSort é uma implementação didática baseada em runs naturais e mesclagem, sem a otimização *galloping*. O ranking compara estas implementações JavaScript, não versões nativas de bibliotecas.

## Estrutura

```text
comparador-13-metodos-mysql/
├── .env.example        # Exemplo de credenciais (sem senha real)
├── .gitignore          # Protege .env e node_modules
├── package.json
├── README.md
├── sql/
│   └── schema.sql      # Tabelas vetores e resultados
├── src/
│   ├── algoritmos.js   # As 13 funções de ordenação
│   └── index.js        # Geração, MySQL, cronômetro e ranking
└── test/
    └── algoritmos.test.js
```

## Requisitos

- Node.js 18 ou superior;
- MySQL 8 (ou servidor compatível com o tipo JSON e as consultas usadas);
- VS Code/PowerShell (opcional, para acompanhar os comandos).

## Instalação (PowerShell)

Abra o VS Code **na pasta que contém `package.json`** e execute:

```powershell
npm install
Copy-Item .env.example .env
```

Preencha o arquivo `.env` com suas credenciais locais:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=SUA_SENHA_REAL
DB_NAME=comparador_ordenacao
```

**Nunca coloque sua senha real no `.env.example` ou no GitHub.**

## Executar

### 1. Criar/verificar banco e tabelas

```powershell
npm run db:init
```

### 2. Gerar um novo vetor, ordenar com os 13 métodos, gravar e exibir ranking

```powershell
npm start
```

Esse comando, em sequência:
- cria/verifica o banco;
- gera um único vetor aleatório de 10.000 posições com valores de 1 a 10.000;
- salva o vetor na tabela `vetores` e recebe seu ID;
- busca pelo mesmo ID no MySQL;
- executa as **13 funções**, cada uma com a mesma entrada e sua própria cópia;
- grava **13 resultados** em `resultados` vinculados ao mesmo ID;
- apresenta o ranking dos tempos em milissegundos.

O terminal mostra somente os **25 primeiros números** dos vetores antes/depois, para não imprimir 10.000 números; o MySQL armazena os vetores completos.

### 3. Comparar de novo um vetor que já está salvo

```powershell
npm run comparar -- --id 1
```

Substitua `1` pelo **ID** mostrado por `npm start`. Se você omitir `--id`, utiliza o último vetor cadastrado.

### 4. Mostrar o ranking salvo

```powershell
npm run ranking -- --id 1
```

Se omitir `--id`, mostra o ranking do último vetor cadastrado.

### 5. Rodar os testes

```powershell
npm test
```

Os testes verificam os 13 algoritmos, as características do gerador e a comparação usando o mesmo vetor, inclusive com 10.000 posições. **Os testes automáticos não exigem conexão MySQL**; para validar a integração com o seu servidor, execute `npm start` com o banco ativo.

## Como o tempo é medido?

```javascript
const copia = [...original];  // MESMA entrada, não cronometrada
const inicio = process.hrtime.bigint();
const ordenado = ordenar(copia); // função de ordenação
const fim = process.hrtime.bigint();
const tempoMs = Number(fim - inicio) / 1_000_000;
```

Cada método é executado 3 vezes sobre cópias novas da mesma entrada. A **mediana** das três medições define o ranking. A gravação/consulta no MySQL, a geração das cópias e a validação de correção **não fazem parte do tempo medido**.

> **Atenção:** os tempos variam conforme computador, execução e ambiente do Node.js. O ranking é referente a estas implementações e à entrada usada; não existe uma ordem fixa garantida entre todos os métodos. Os algoritmos quadráticos, como BubbleSort e CycleSort, podem demorar mais com 10.000 elementos.

## Consultas no MySQL Workbench

### Vetores desordenados cadastrados

```sql
USE comparador_ordenacao;
SELECT id, tamanho, criado_em, dados_desordenados
FROM vetores
ORDER BY id DESC;
```

### Ranking: mais rápido para mais lento

```sql
USE comparador_ordenacao;
SELECT algoritmo, tempo_ms, repeticoes, dados_ordenados
FROM resultados
WHERE vetor_id = 1
ORDER BY tempo_ms ASC;
```

Troque `vetor_id = 1` pelo ID real. São esperadas **13 linhas**, uma para cada método.

### Conferir que os 13 resultados têm exatamente 10.000 números

```sql
SELECT algoritmo, JSON_LENGTH(dados_ordenados) AS quantidade, tempo_ms
FROM resultados
WHERE vetor_id = 1
ORDER BY tempo_ms ASC;
```

### Mostrar as 3 medições de cada algoritmo

```sql
SELECT algoritmo, tempo_ms, amostras_ms
FROM resultados
WHERE vetor_id = 1
ORDER BY tempo_ms ASC;
```

## Reutilização do banco existente

Esta versão utiliza os **mesmos nomes de tabelas e campos** do projeto anterior (`comparador_ordenacao`, `vetores`, `resultados`). Não apaga registros antigos e não precisa recriar as tabelas se já estiverem corretas.

**Importante:** para assegurar o trabalho com **10.000 inteiros positivos**, o comando de comparação rejeita vetores antigos de outro tamanho ou que contenham zero/números negativos. Execute `npm start` para gerar um novo ID válido.

## Atualizar o GitHub sem enviar a senha

O `.gitignore` já exclui `.env` e `node_modules/`. Antes do push, confira:

```powershell
git check-ignore .env
git ls-files .env
```

O primeiro comando deve imprimir `.env` e o segundo deve ficar vazio. Depois:

```powershell
git add .
git commit -m "Simplifica comparador para 13 metodos com vetor unico de 10000 numeros"
git push origin main
```

Se o `.env` já foi versionado antes, execute `git rm --cached .env` e faça commit da remoção; se a senha já foi publicada, troque-a no MySQL.
