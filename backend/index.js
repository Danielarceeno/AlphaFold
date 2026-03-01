const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
const ALPHAFOLD_API = "https://alphafold.ebi.ac.uk/api/prediction";

app.get("/", (req, res) => {
  res.send("Servidor do AlphaFold Viewer está rodando! 🚀");
});

app.get("/api/search/:name", async (req, res) => {
  try {
    const { name } = req.params;
    console.log(`Buscando proteína pelo nome: ${name}`);
    const response = await axios.get(
      `https://rest.uniprot.org/uniprotkb/search?query=${name}&size=1&format=json`,
    );

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
    res.status(404).json({ error: "Proteína não encontrada no AlphaFold DB." });
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

    res.json({ function: description, variants: variants });
  } catch (error) {
    res.json({ function: "Erro ao carregar dados.", variants: [] });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend rodando na porta ${PORT}`);
});
