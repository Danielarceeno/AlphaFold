const express = require("express");
const cors = require("cors");
const axios = require("axios");

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

async function translateToPortuguese(text) {
  if (translationCache.has(text)) return translationCache.get(text);
  try {
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
    const result = translated.join(" ");
    translationCache.set(text, result);
    return result;
  } catch (error) {
    console.error("Erro na tradução:", error.message);
    return text;
  }
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
    const variants =
      response.data.features
        ?.filter(
          (f) => f.type === "Natural variant" && f.location?.start?.value,
        )
        .map((f) => ({
          position: f.location.start.value,
          original: f.alternativeSequence ? f.alternativeSequence.original : "",
          mutated: f.alternativeSequence
            ? f.alternativeSequence.alternative
            : "",
          description: f.description || "Mutação associada a doença/variação",
        })) || [];

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
