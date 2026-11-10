const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { DISEASES, VARIANT_NOTES } = require("./translations");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;
const ALPHAFOLD_API = "https://alphafold.ebi.ac.uk/api/prediction";
const UNIPROT_API = "https://rest.uniprot.org/uniprotkb";
const TRANSLATE_API = "https://api.mymemory.translated.net/get";

// Formato oficial de um accession do UniProt (ex.: P01308, A0A024R161)
const ACCESSION_REGEX =
  /^([OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2})$/;

// Impede que o :id seja usado para montar outros caminhos nas APIs externas
app.param("id", (req, res, next, id) => {
  const accession = id.toUpperCase();
  if (!ACCESSION_REGEX.test(accession)) {
    return res.status(400).json({ error: "ID de proteína inválido." });
  }
  req.params.id = accession;
  next();
});

const upstreamStatus = (error) => {
  const upstream = error.response?.status;
  return upstream === 404 || upstream === 400 ? 404 : 502;
};

// Nomes populares que a busca textual do UniProt resolve para a proteína errada
// (ex.: "p53" devolvia uma proteína de Drosophila e "Spike" devolvia a ACE2 humana)
const PROTEIN_ALIASES = {
  p53: "P04637", // Cellular tumor antigen p53 (Homo sapiens)
  tp53: "P04637",
  cas9: "Q99ZW2", // Cas9 de Streptococcus pyogenes (SpCas9), a usada no CRISPR
  spcas9: "Q99ZW2",
  spike: "P0DTC2", // Spike glycoprotein (SARS-CoV-2)
  "spike protein": "P0DTC2",
  "spike glycoprotein": "P0DTC2",
};

const MAX_PREDICTIONS_CACHED = 200;
const predictionCache = new Map();

// Metadados do AlphaFold; o cache evita consultar a API de novo ao baixar a estrutura
function fetchPrediction(id) {
  if (!predictionCache.has(id)) {
    const request = axios.get(`${ALPHAFOLD_API}/${id}`).then(({ data }) => {
      const entry = data.find((e) => e.uniprotAccession === id) || data[0];
      if (!entry) {
        throw Object.assign(new Error("Sem predição para este ID"), {
          response: { status: 404 },
        });
      }
      return entry;
    });
    if (predictionCache.size >= MAX_PREDICTIONS_CACHED) {
      predictionCache.delete(predictionCache.keys().next().value);
    }
    predictionCache.set(id, request);
    request.catch(() => predictionCache.delete(id));
  }
  return predictionCache.get(id);
}

function stripReferences(text) {
  return text
    .replace(/\s*\([^()]*PubMed:[^()]*\)/g, "")
    .replace(/\s+([.,;:])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

const MAX_CHUNK = 450;
const translationCache = new Map();

function splitIntoChunks(text) {
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) || [text];
  const chunks = [];
  let current = "";
  for (const sentence of sentences) {
    if (current && (current + sentence).length > MAX_CHUNK) {
      chunks.push(current.trim());
      current = "";
    }
    current += sentence;
    while (current.length > MAX_CHUNK) {
      chunks.push(current.slice(0, MAX_CHUNK));
      current = current.slice(MAX_CHUNK);
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function translateToPortuguese(text) {
  if (!translationCache.has(text)) {
    const request = (async () => {
      const translated = [];
      for (const chunk of splitIntoChunks(text)) {
        const { data } = await axios.get(TRANSLATE_API, {
          params: { q: chunk, langpair: "en|pt-BR" },
          timeout: 8000,
        });
        if (data.quotaFinished || data.responseStatus !== 200) {
          throw new Error(`Tradução indisponível (status ${data.responseStatus})`);
        }
        translated.push(data.responseData.translatedText);
      }
      return translated.join(" ");
    })();
    translationCache.set(text, request);
    request.catch((error) => {
      console.error("Erro na tradução:", error.message);
      translationCache.delete(text);
    });
  }
  return translationCache.get(text).catch(() => text);
}

const AMINO_ACIDS = {
  A: "Alanina", R: "Arginina", N: "Asparagina", D: "Ácido aspártico",
  C: "Cisteína", E: "Ácido glutâmico", Q: "Glutamina", G: "Glicina",
  H: "Histidina", I: "Isoleucina", L: "Leucina", K: "Lisina",
  M: "Metionina", F: "Fenilalanina", P: "Prolina", S: "Serina",
  T: "Treonina", W: "Triptofano", Y: "Tirosina", V: "Valina",
};

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

const aminoName = (code) => (AMINO_ACIDS[code] ? `${AMINO_ACIDS[code]} (${code})` : code);

async function describeVariant(feature, diseaseNames) {
  const original = feature.alternativeSequence?.originalSequence || "";
  const mutated = feature.alternativeSequence?.alternativeSequences?.[0] || "";

  let change;
  if (original && mutated) {
    change = `Troca ${aminoName(original)} por ${aminoName(mutated)}.`;
  } else if (original) {
    change = `Remoção de ${aminoName(original)}.`;
  } else {
    change = "Alteração na sequência.";
  }

  const segments = (feature.description || "")
    .split(";")
    .map((seg) => seg.trim())
    .filter((seg) => seg && !/^(in\s+)?(dbSNP|ECO):/i.test(seg));

  const parts = [change];
  for (const seg of segments) {
    const noteKey = seg.toLowerCase();
    const knownNote =
      Object.hasOwn(VARIANT_NOTES, noteKey) && VARIANT_NOTES[noteKey];
    if (knownNote) {
      parts.push(`${knownNote}.`);
      continue;
    }
    if (!/^in\s/i.test(seg)) {
      const isPhrase = /\s/.test(seg) || /^[a-z]/.test(seg);
      parts.push(
        isPhrase
          ? `${capitalize(await translateToPortuguese(seg))}.`
          : `Variante "${seg}".`,
      );
      continue;
    }
    const acronyms = seg.slice(3).split(/,\s*|\s+and\s+/);
    // Variantes batizadas com nomes de lugar, ex.: "in Raleigh" ou "in Newcastle and Duino"
    const isVariantName = (a) => /^[A-Z][A-Za-z-]*$/.test(a) && /[a-z]/.test(a);
    if (acronyms.every((a) => !diseaseNames.has(a) && isVariantName(a))) {
      parts.push(`Variante conhecida como ${acronyms.join(" e ")}.`);
      continue;
    }
    if (acronyms.every((a) => diseaseNames.has(a))) {
      const names = acronyms.map((a) => `${diseaseNames.get(a)} (${a})`);
      parts.push(`Associada a: ${names.join("; ")}.`);
    } else {
      parts.push(`${capitalize(await translateToPortuguese(seg))}.`);
    }
  }
  if (parts.length === 1) parts.push("Variante natural sem doença descrita.");

  return { original, mutated, description: parts.join(" ") };
}

app.get("/", (req, res) => {
  res.send("Servidor do AlphaFold Viewer está rodando! 🚀");
});

app.get("/api/search/:name", async (req, res) => {
  const name = req.params.name.trim();
  if (!name) {
    return res.status(400).json({ error: "Informe o nome da proteína." });
  }
  const alias = name.toLowerCase().replace(/\s+/g, " ");
  if (Object.hasOwn(PROTEIN_ALIASES, alias)) {
    return res.json({ id: PROTEIN_ALIASES[alias] });
  }
  try {
    console.log(`Buscando proteína pelo nome: ${name}`);
    const searchUniprot = (query) =>
      axios.get(`${UNIPROT_API}/search`, {
        params: { query, size: 1, format: "json" },
      });

    let response = await searchUniprot(`(${name}) AND reviewed:true`);
    if (!response.data.results?.length) {
      response = await searchUniprot(name);
    }

    if (response.data.results?.length) {
      res.json({ id: response.data.results[0].primaryAccession });
    } else {
      res
        .status(404)
        .json({ error: "Nenhuma proteína encontrada com esse nome." });
    }
  } catch (error) {
    console.error("Erro na busca:", error.message);
    // O UniProt responde 400 quando o texto quebra a sintaxe da consulta, ex.: "a(b"
    if (error.response?.status === 400) {
      return res.status(400).json({
        error: "Termo de busca inválido. Use apenas o nome da proteína.",
      });
    }
    res.status(502).json({ error: "Erro ao buscar o nome no banco de dados." });
  }
});

app.get("/api/protein/:id", async (req, res) => {
  try {
    res.json(await fetchPrediction(req.params.id));
  } catch (error) {
    const status = upstreamStatus(error);
    console.error("Erro ao buscar no AlphaFold:", error.message);
    res.status(status).json({
      error:
        status === 404
          ? "Proteína não encontrada no AlphaFold DB."
          : "Erro ao consultar o AlphaFold DB.",
    });
  }
});

app.get("/api/protein/:id/structure", async (req, res) => {
  try {
    const { pdbUrl } = await fetchPrediction(req.params.id);
    const pdbResponse = await axios.get(pdbUrl, { responseType: "text" });

    res.set("Content-Type", "text/plain");
    res.send(pdbResponse.data);
  } catch (error) {
    const status = upstreamStatus(error);
    console.error("Erro ao baixar a estrutura:", error.message);
    res.status(status).json({
      error:
        status === 404
          ? "Estrutura não encontrada no AlphaFold DB."
          : "Erro ao baixar a estrutura da proteína.",
    });
  }
});

app.get("/api/uniprot/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(
      `${UNIPROT_API}/${id}.json`,
    );
    const functionComment = response.data.comments?.find(
      (c) => c.commentType === "FUNCTION",
    );
    const description = functionComment
      ? functionComment.texts[0].value
      : "Descrição não disponível.";
    const diseaseNames = new Map();
    for (const c of response.data.comments || []) {
      if (c.commentType === "DISEASE" && c.disease?.acronym) {
        diseaseNames.set(
          c.disease.acronym,
          DISEASES[c.disease.diseaseId] ||
            (await translateToPortuguese(c.disease.diseaseId || c.disease.acronym)),
        );
      }
    }

    const variantFeatures = (response.data.features || []).filter(
      (f) => f.type === "Natural variant" && f.location?.start?.value,
    );
    const variants = [];
    const BATCH_SIZE = 10;
    for (let i = 0; i < variantFeatures.length; i += BATCH_SIZE) {
      const batch = variantFeatures.slice(i, i + BATCH_SIZE);
      const described = await Promise.all(
        batch.map((f) => describeVariant(f, diseaseNames)),
      );
      batch.forEach((f, j) =>
        variants.push({ position: f.location.start.value, ...described[j] }),
      );
    }

    const hasDescription = Boolean(functionComment);
    res.json({
      function: hasDescription
        ? await translateToPortuguese(stripReferences(description))
        : description,
      variants,
    });
  } catch (error) {
    const status = upstreamStatus(error);
    console.error("Erro ao buscar no UniProt:", error.message);
    res.status(status).json({
      error:
        status === 404
          ? "Proteína não encontrada no UniProt."
          : "Erro ao consultar o UniProt.",
    });
  }
});

// Só sobe o servidor quando executado diretamente; os testes importam o app
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✅ Backend rodando na porta ${PORT}`);
  });
}

module.exports = {
  app,
  stripReferences,
  splitIntoChunks,
  describeVariant,
  MAX_CHUNK,
  PROTEIN_ALIASES,
};
