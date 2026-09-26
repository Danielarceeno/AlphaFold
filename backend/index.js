const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { DISEASES, VARIANT_NOTES } = require("./translations");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;
const ALPHAFOLD_API = "https://alphafold.ebi.ac.uk/api/prediction";
const TRANSLATE_API = "https://api.mymemory.translated.net/get";

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
    const knownNote = VARIANT_NOTES[seg.toLowerCase()];
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
  try {
    const { name } = req.params;
    console.log(`Buscando proteína pelo nome: ${name}`);
    const searchUniprot = (query) =>
      axios.get(
        `https://rest.uniprot.org/uniprotkb/search?query=${encodeURIComponent(query)}&size=1&format=json`,
      );

    let response = await searchUniprot(`(${name}) AND reviewed:true`);
    if (!response.data.results?.length) {
      response = await searchUniprot(name);
    }

    if (response.data.results && response.data.results.length > 0) {
      const proteinId = response.data.results[0].primaryAccession;
      res.json({ id: proteinId });
    } else {
      res
        .status(404)
        .json({ error: "Nenhuma proteína encontrada com esse nome." });
    }
  } catch (error) {
    console.error("Erro na busca:", error.message);
    res.status(500).json({ error: "Erro ao buscar o nome no banco de dados." });
  }
});

app.get("/api/protein/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${ALPHAFOLD_API}/${id}`);
    res.json(response.data[0]);
  } catch (error) {
    const upstream = error.response?.status;
    const status = upstream === 404 || upstream === 400 ? 404 : 502;
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
    const { id } = req.params;
    const metadataResponse = await axios.get(`${ALPHAFOLD_API}/${id}`);
    const pdbUrl = metadataResponse.data[0].pdbUrl;
    const pdbResponse = await axios.get(pdbUrl);

    res.set("Content-Type", "text/plain");
    res.send(pdbResponse.data);
  } catch (error) {
    res.status(500).json({ error: "Erro ao baixar a estrutura da proteína." });
  }
});

app.get("/api/uniprot/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(
      `https://rest.uniprot.org/uniprotkb/${id}.json`,
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
      variants: variants,
    });
  } catch (error) {
    const upstream = error.response?.status;
    const status = upstream === 404 || upstream === 400 ? 404 : 502;
    console.error("Erro ao buscar no UniProt:", error.message);
    res.status(status).json({
      error:
        status === 404
          ? "Proteína não encontrada no UniProt."
          : "Erro ao consultar o UniProt.",
    });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend rodando na porta ${PORT}`);
});
