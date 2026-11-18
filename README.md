# Comparador de Algoritmos de Ordenação

**Node.js + MySQL | 12 algoritmos | Benchmark de desempenho | Ranking automático**

Projeto desenvolvido para comparar o tempo de execução de **12 métodos de ordenação** utilizando vetores de números inteiros armazenados em um banco de dados MySQL. O programa recupera um vetor desordenado, executa todos os métodos com **cópias dos mesmos dados**, confere os resultados, grava os vetores ordenados e os tempos de execução no banco e gera um **ranking do mais rápido para o mais lento**.

> **Importante:** o ranking é gerado com medições realizadas na sua máquina. Não existe uma classificação universal: o desempenho muda conforme o hardware, o tamanho e a distribuição dos vetores.

## Sumário

- [Funcionalidades](#funcionalidades)
- [Algoritmos implementados](#algoritmos-implementados)
- [Tecnologias e requisitos](#tecnologias-e-requisitos)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Instalação e configuração](#instalação-e-configuração)
- [Como executar](#como-executar)
- [Banco de dados MySQL](#banco-de-dados-mysql)
- [Como funciona a medição do tempo](#como-funciona-a-medição-do-tempo)
- [Testes automatizados](#testes-automatizados)
- [Limitações e cuidados](#limitações-e-cuidados)
- [Solução de problemas](#solução-de-problemas)

## Funcionalidades

- Geração de vetores aleatórios e desordenados, com tamanho, intervalo e semente configuráveis.
- Armazenamento dos vetores originais no **MySQL**.
- Implementação própria de **12 algoritmos**, um método para cada ordenação.
- Execução de todos os métodos com o **mesmo vetor de entrada**, sem alterar o original armazenado.
- Medição de tempo em **milissegundos (ms)** com `process.hrtime.bigint()`.
- Aquecimento, múltiplas medições e cálculo da **mediana** para reduzir a influência de oscilações isoladas.
- Verificação automática de que todos os algoritmos produziram a ordenação correta.
- Gravação dos vetores ordenados, tempos e amostras individuais no banco de dados.
- Ranking automático, do **menor** para o **maior** tempo.
- Execução de um vetor específico ou de **todos os vetores** cadastrados.
- Testes de correção que podem ser executados sem conexão com o MySQL.

## Algoritmos implementados

| Nº | Algoritmo | Função no código |
|:--:|---|---|
| 1 | Bubble Sort | `bubbleSort()` |
| 2 | Selection Sort | `selectionSort()` |
| 3 | Insertion Sort | `insertionSort()` |
| 4 | Shell Sort | `shellSort()` |
| 5 | Quick Sort | `quickSort()` |
| 6 | Merge Sort | `mergeSort()` |
| 7 | Comb Sort | `combSort()` |
| 8 | Counting Sort | `countingSort()` |
| 9 | Radix Sort | `radixSort()` |
| 10 | Bucket Sort | `bucketSort()` |
| 11 | Tim Sort | `timSort()` |
| 12 | Cycle Sort | `cycleSort()` |

Todas as implementações ordenam **em ordem crescente** e retornam o vetor recebido. O `Array.sort()` nativo do JavaScript é usado **somente para verificar** a correção da ordenação e para calcular a mediana das amostras; ele não substitui nenhum dos 12 métodos no comparador.

## Tecnologias e requisitos

| Tecnologia | Finalidade |
|---|---|
| **Node.js 18+** | Execução do JavaScript e medição dos algoritmos |
| **MySQL 8+** | Armazenamento dos vetores e dos resultados |
| **mysql2** | Comunicação do Node.js com o MySQL |
| **dotenv** | Leitura das configurações do arquivo `.env` |
| **npm** | Instalação de dependências e execução dos comandos |
| **MySQL Workbench (opcional)** | Visualização das tabelas e consultas SQL |

Antes de começar, verifique se o Node.js e o npm estão instalados:

```powershell
node -v
npm -v
```

O serviço do MySQL também precisa estar iniciado e sua conta deve ter permissão para criar bancos e tabelas.

## Estrutura do projeto

```text
comparador-ordenacao-node/
│
├── .env.example            # Modelo para configurar o MySQL
├── .gitignore              # Protege o .env e ignora node_modules
├── package.json            # Dependências e comandos npm
├── README.md               # Documentação do projeto
│
├── sql/
│   └── schema.sql          # Estrutura das tabelas MySQL
│
├── src/
│   ├── algoritmos.js       # Implementações dos 12 algoritmos
│   ├── benchmark.js        # Cronometragem, mediana e validação
│   ├── cli.js              # Comandos executados pelo terminal
│   ├── config.js           # Configurações de conexão
│   └── database.js         # Consultas SQL e persistência dos dados
│
└── test/
    └── algoritmos.test.js  # Testes automatizados
```

## Instalação e configuração

Os comandos abaixo utilizam o **PowerShell**, no Windows. Abra o terminal na pasta onde está o `package.json`.

### 1. Instale as dependências

```powershell
npm install
```

### 2. Configure o acesso ao MySQL

Crie o arquivo `.env` copiando o modelo:

```powershell
Copy-Item .env.example .env
```

Depois, edite o `.env`:

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=SUA_SENHA_DO_MYSQL
DB_NAME=comparador_ordenacao
```

- `DB_HOST`: endereço do servidor MySQL.
- `DB_PORT`: porta de conexão; normalmente `3306`.
- `DB_USER`: usuário do MySQL.
- `DB_PASSWORD`: senha desse usuário.
- `DB_NAME`: nome do banco do projeto.

**Segurança:** não publique o arquivo `.env` no GitHub e não coloque sua senha diretamente no código. O `.gitignore` já foi configurado para ignorá-lo.

### 3. Crie o banco e as tabelas

```powershell
npm run db:init
```

O comando cria o banco **`comparador_ordenacao`** e as tabelas necessárias, caso ainda não existam. O banco fica separado de outros sistemas que você tenha no MySQL.

## Como executar

### Opção A — Executar o projeto completo

Para criar um vetor de **1.000 números**, comparar os 12 métodos e apresentar o ranking:

```powershell
npm start
```

Esse comando também inicializa o banco, se necessário. Cada execução cria um novo registro de vetor.

### Opção B — Executar por etapas

**1. Gerar um vetor desordenado:**

```powershell
npm run gerar -- --quantidade 1000
```

O terminal mostrará o ID do vetor salvo no MySQL (por exemplo, `1`).

Para personalizar os dados:

```powershell
npm run gerar -- --quantidade 1000 --vetores 3 --min -1000 --max 1000 --semente 12345
```

| Parâmetro | Descrição | Padrão |
|---|---|---|
| `--quantidade` | Quantidade de elementos por vetor | `1000` |
| `--vetores` | Quantidade de vetores a gerar | `1` |
| `--min` | Menor número possível | `-1000` |
| `--max` | Maior número possível | `1000` |
| `--semente` | Semente para reproduzir os valores gerados | `12345` |

**2. Comparar os 12 algoritmos:**

```powershell
npm run comparar -- --id 1
```

Substitua o `1` pelo **ID real** informado na geração. Para alterar a quantidade de medições por algoritmo:

```powershell
npm run comparar -- --id 1 --repeticoes 7
```

Para comparar **todos os vetores cadastrados**, cada um com seu próprio ranking:

```powershell
npm run comparar -- --todos
```

**3. Consultar o ranking salvo:**

```powershell
npm run ranking -- --id 1
```

Exemplo **ilustrativo do formato** (as posições e os tempos reais serão calculados pelo programa):

```text
RANKING DO VETOR 1 (menor mediana em ms = mais rápido):

Posição | Método        | Tempo (ms) | Medições
--------|---------------|------------|---------
1       | [algoritmo]   | [tempo]    | 7
2       | [algoritmo]   | [tempo]    | 7
...     | ...           | ...        | ...
12      | [algoritmo]   | [tempo]    | 7
```

O terminal também exibe uma prévia do vetor **antes** e **depois** da ordenação. Para vetores com mais de 25 elementos, a exibição é abreviada, mas **o vetor completo** é salvo no banco.

### Referência rápida dos comandos

| Comando | O que faz |
|---|---|
| `npm install` | Instala as dependências |
| `npm run db:init` | Inicializa o banco e as tabelas |
| `npm run gerar -- --quantidade 1000` | Gera e salva vetor desordenado |
| `npm run comparar -- --id 1` | Executa os 12 métodos no vetor informado |
| `npm run comparar -- --todos` | Compara todos os vetores armazenados |
| `npm run ranking -- --id 1` | Exibe ranking de um vetor |
| `npm start` | Executa o fluxo completo de demonstração |
| `npm test` | Testa os algoritmos sem depender do MySQL |

## Banco de dados MySQL

O sistema utiliza **duas tabelas** com relacionamento de um para muitos:

```text
vetores (1) ──────────────── (N) resultados
       id                     vetor_id
       dados_desordenados      algoritmo
       tamanho                dados_ordenados
       criado_em              tempo_ms
                              repeticoes
                              amostras_ms
                              valido
                              executado_em
```

### Tabela `vetores`

Armazena os vetores **antes** de serem ordenados:

| Campo | Tipo | Finalidade |
|---|---|---|
| `id` | `BIGINT` | Identificador único |
| `dados_desordenados` | `JSON` | Vetor original |
| `tamanho` | `INT` | Quantidade de elementos |
| `criado_em` | `TIMESTAMP` | Data de criação |

### Tabela `resultados`

Armazena o resultado de **cada algoritmo** aplicado a um vetor:

| Campo | Tipo | Finalidade |
|---|---|---|
| `id` | `BIGINT` | Identificador único |
| `vetor_id` | `BIGINT` | ID do vetor de origem |
| `algoritmo` | `VARCHAR(32)` | Nome do método |
| `dados_ordenados` | `JSON` | Vetor em ordem crescente |
| `tempo_ms` | `DOUBLE` | Mediana do tempo de execução em ms |
| `repeticoes` | `SMALLINT` | Número de medições |
| `amostras_ms` | `JSON` | Tempos medidos individualmente |
| `valido` | `TINYINT(1)` | Indica se o resultado foi validado |
| `executado_em` | `TIMESTAMP` | Data do teste |

A combinação `(vetor_id, algoritmo)` é única. Se você repetir a comparação com o mesmo vetor, o programa **atualizará** os resultados dos 12 métodos, em vez de adicionar registros duplicados.

### Consultas no MySQL Workbench

**Listar os vetores cadastrados:**

```sql
USE comparador_ordenacao;

SELECT id, tamanho, dados_desordenados, criado_em
FROM vetores
ORDER BY id DESC;
```

**Consultar os vetores ordenados e seus tempos:**

```sql
SELECT vetor_id, algoritmo, dados_ordenados, tempo_ms
FROM resultados
WHERE vetor_id = 1
ORDER BY tempo_ms ASC;
```

**Gerar um ranking numerado do mais rápido ao mais lento:**

```sql
SELECT
    ROW_NUMBER() OVER (ORDER BY tempo_ms ASC, algoritmo ASC) AS posicao,
    algoritmo,
    ROUND(tempo_ms, 6) AS tempo_ms,
    repeticoes
FROM resultados
WHERE vetor_id = 1 AND valido = 1
ORDER BY tempo_ms ASC, algoritmo ASC;
```

**Cadastrar um vetor manualmente pelo SQL:**

```sql
INSERT INTO vetores (dados_desordenados, tamanho)
VALUES ('[8, 3, 9, 1, 5, 2]', 6);

SELECT LAST_INSERT_ID() AS novo_vetor_id;
```

Depois, utilize o `novo_vetor_id` retornado para executar `npm run comparar -- --id ID` no terminal. O vetor ordenado esperado para o exemplo é `[1, 2, 3, 5, 8, 9]`.

## Como funciona a medição do tempo

O fluxo interno de uma comparação segue estas etapas:

```text
[MySQL: vetor desordenado]
             |
             v
[Node.js: cria cópias do mesmo vetor]
             |
             v
[Executa 2 aquecimentos por algoritmo]
             |
             v
[Executa 7 medições por algoritmo (padrão)]
             |
             v
[Confere se cada vetor está corretamente ordenado]
             |
             v
[Calcula a mediana dos tempos em ms]
             |
             v
[MySQL: salva resultados e tempos]
             |
             v
[Ranking: menor mediana -> maior mediana]
```

A duração de cada ordenação é obtida usando o relógio de alta resolução do Node.js:

```javascript
const inicio = process.hrtime.bigint();
const resultado = ordenar(copia);
const tempoMs = Number(process.hrtime.bigint() - inicio) / 1_000_000;
```

A cópia do vetor é criada **antes** de iniciar o cronômetro. A validação, as consultas SQL e a escrita no MySQL também ficam **fora** da medição. A ordem dos métodos é alterada entre as rodadas para reduzir o viés de executar sempre o mesmo algoritmo primeiro.

**Por que a mediana?** Ela representa o valor central das medições e é menos sensível a picos ocasionais de tempo do que uma média simples. Assim, o ranking considera as mesmas condições de entrada e a mediana obtida para cada método.

## Testes automatizados

Para verificar a correção das implementações, execute:

```powershell
npm test
```

Os testes cobrem vetores vazios, vetores com um único valor, dados já ordenados, ordem inversa, números negativos, repetições e vetores aleatórios. Também verificam se o benchmark retorna os resultados esperados sem modificar o vetor original.

**Esses testes não precisam do MySQL.** Para testar a integração com o banco, configure `.env` e execute o fluxo de geração e comparação.

## Limitações e cuidados

- A geração pela CLI aceita de **1 a 10.000 elementos por vetor**, com até **100 vetores** por execução.
- A amplitude do intervalo de valores deve ser de, no máximo, **1.000.000**; isso evita uso excessivo de memória no Counting Sort.
- Os algoritmos operam sobre **números inteiros seguros** do JavaScript. O Radix Sort também suporta números negativos.
- Bubble Sort, Selection Sort e Cycle Sort podem ser lentos com vetores grandes por apresentarem comportamento quadrático em muitos cenários.
- O **Tim Sort** implementado é uma versão **didática**, sem a otimização *galloping* do algoritmo completo. Seus tempos não devem ser confundidos com os do sort nativo de outras linguagens.
- O Bucket Sort utiliza baldes de largura uniforme e o Insertion Sort para ordenar o conteúdo de cada balde.
- Resultados muito próximos podem trocar de posição de uma execução para outra. Para comparação mais confiável, execute várias vezes e evite tarefas pesadas em segundo plano.
- A tabela `resultados` mantém o **último benchmark por algoritmo e por vetor**; o histórico de várias execuções do mesmo par não é preservado.

## Solução de problemas

| Problema | O que verificar |
|---|---|
| `node` ou `npm` não é reconhecido | Instale o Node.js e reabra o terminal |
| `ER_ACCESS_DENIED_ERROR` | Confira `DB_USER` e `DB_PASSWORD` no `.env` |
| `ECONNREFUSED` | Confirme que o servidor MySQL está iniciado e que a porta está correta |
| `ER_BAD_DB_ERROR` | Execute `npm run db:init` |
| `Vetor de ID ... não encontrado` | Gere um vetor e utilize o ID exibido no terminal |
| Ranking sem resultados | Rode `npm run comparar -- --id ID` antes de consultar o ranking |
| Tempo muito alto | Experimente um vetor menor: `--quantidade 100` |

---

### Objetivo do projeto

Demonstrar, de forma prática, como diferentes algoritmos de ordenação se comportam diante de **um mesmo conjunto de dados**, relacionando **estruturas de dados, análise de algoritmos, JavaScript e persistência em MySQL**.

**Desenvolvido para fins de estudo, experimentação e comparação de desempenho.**
