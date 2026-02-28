const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
const ALPHAFOLD_API = 'https://alphafold.ebi.ac.uk/api/prediction';

app.get('/', (req, res) => {
    res.send('Servidor do AlphaFold Viewer está rodando!');
});

app.get('/api/protein/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Buscando proteína: ${id}`);
        const response = await axios.get(`${ALPHAFOLD_API}/${id}`);
        res.json(response.data[0]);   
    } catch (error) {
        console.error("Erro na busca:", error.message);
        res.status(404).json({ error: 'Proteína não encontrada no AlphaFold DB.' });
    }
});
app.listen(PORT, () => {
    console.log(`✅ Backend rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});