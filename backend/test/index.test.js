const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const {
  app,
  stripReferences,
  splitIntoChunks,
  describeVariant,
  MAX_CHUNK,
} = require("../index");

// Nenhum teste aqui depende de rede: só cobrem funções puras e respostas
// que o servidor dá antes de consultar as APIs externas.

test("stripReferences remove citações do PubMed e ajusta a pontuação", () => {
  assert.equal(
    stripReferences(
      "Binds oxygen (PubMed:123, PubMed:456). Also  transports CO2 (PubMed:9) .",
    ),
    "Binds oxygen. Also transports CO2.",
  );
});

test("splitIntoChunks respeita o limite e não perde texto", () => {
  const text = "Uma frase de tamanho médio para o teste. ".repeat(40).trim();
  const chunks = splitIntoChunks(text);
  assert.ok(chunks.length > 1);
  for (const chunk of chunks) assert.ok(chunk.length <= MAX_CHUNK);
  assert.equal(chunks.join(" "), text);
});

test("splitIntoChunks quebra frases maiores que o limite", () => {
  const chunks = splitIntoChunks("a".repeat(MAX_CHUNK * 2 + 10));
  assert.equal(chunks.length, 3);
  assert.equal(chunks.join("").length, MAX_CHUNK * 2 + 10);
});

const variant = (original, alternatives, description) => ({
  alternativeSequence: {
    originalSequence: original,
    alternativeSequences: alternatives,
  },
  description,
});

test("describeVariant descreve a troca e a doença associada", async () => {
  const diseases = new Map([["LFS", "Síndrome de Li-Fraumeni"]]);
  const result = await describeVariant(
    variant("R", ["C"], "in LFS; germline mutation; dbSNP:rs123"),
    diseases,
  );
  assert.deepEqual(result, {
    original: "R",
    mutated: "C",
    description:
      "Troca Arginina (R) por Cisteína (C). Associada a: Síndrome de Li-Fraumeni (LFS). Mutação germinativa.",
  });
});

test("describeVariant trata deleção e variante sem doença", async () => {
  const result = await describeVariant(variant("A", [], ""), new Map());
  assert.equal(result.mutated, "");
  assert.equal(
    result.description,
    "Remoção de Alanina (A). Variante natural sem doença descrita.",
  );
});

test("describeVariant reconhece variantes batizadas com nomes de lugar", async () => {
  const result = await describeVariant(
    variant("E", ["K"], "in Newcastle and Duino"),
    new Map(),
  );
  assert.match(result.description, /Variante conhecida como Newcastle e Duino\./);
});

let server;
let baseUrl;

before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://localhost:${server.address().port}`;
});

after(() => server.close());

const get = async (path) => {
  const response = await fetch(baseUrl + path);
  return { status: response.status, body: await response.json() };
};

test("rotas com :id rejeitam valores que não são accession do UniProt", async () => {
  for (const path of [
    "/api/protein/XXXX",
    "/api/protein/..%2F..%2Fapi%2Fprediction%2FP01308",
    "/api/protein/..%2FP01308/structure",
    "/api/uniprot/..%2Funiprotkb%2FP01308",
  ]) {
    const { status, body } = await get(path);
    assert.equal(status, 400, path);
    assert.equal(body.error, "ID de proteína inválido.");
  }
});

test("busca vazia retorna 400", async () => {
  const { status } = await get("/api/search/%20");
  assert.equal(status, 400);
});

test("busca resolve os apelidos do Hall da Fama sem consultar o UniProt", async () => {
  const expected = { p53: "P04637", "%20CAS9%20": "Q99ZW2", Spike: "P0DTC2" };
  for (const [name, id] of Object.entries(expected)) {
    const { status, body } = await get(`/api/search/${name}`);
    assert.equal(status, 200, name);
    assert.equal(body.id, id);
  }
});
