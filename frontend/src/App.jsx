import { useState, useEffect, useRef } from "react";
import axios from "axios";

function App() {
  const [uniprotId, setUniprotId] = useState("P00533");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const viewerContainerRef = useRef(null);
  const [viewerInstance, setViewerInstance] = useState(null);

  useEffect(() => {
    if (viewerContainerRef.current && window.$3Dmol) {
      const viewer = window.$3Dmol.createViewer(viewerContainerRef.current, {
        backgroundColor: "#f8f9fa", // Fundo levemente cinza
      });
      setViewerInstance(viewer);
    }
  }, []);

  const fetchAndRenderProtein = async () => {
    if (!uniprotId || !viewerInstance) return;

    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(
        `https://glorious-goggles-p47qgj7xxqwh649x-3000.app.github.dev/api/protein/${uniprotId}/structure`,
      );
      const pdbData = response.data;

      viewerInstance.clear();
      viewerInstance.addModel(pdbData, "pdb");
      viewerInstance.setStyle({}, { cartoon: { color: "spectrum" } }); // Estilo colorido
      viewerInstance.zoomTo();
      viewerInstance.render();
    } catch (err) {
      console.error(err);
      setError(
        "Erro ao carregar a estrutura. Verifique se o ID está correto e o backend rodando.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: "800px",
        margin: "40px auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ textAlign: "center", color: "#333" }}>
        AlphaFold Viewer 🧬
      </h1>
      <p style={{ textAlign: "center", color: "#666" }}>
        MVP: Visualização de Estruturas Proteicas
      </p>

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginBottom: "20px",
          justifyContent: "center",
        }}
      >
        <input
          type="text"
          value={uniprotId}
          onChange={(e) => setUniprotId(e.target.value.toUpperCase())}
          placeholder="Ex: P00533"
          style={{
            padding: "10px",
            fontSize: "16px",
            width: "200px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={fetchAndRenderProtein}
          disabled={loading}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            cursor: loading ? "not-allowed" : "pointer",
            backgroundColor: loading ? "#999" : "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontWeight: "bold",
          }}
        >
          {loading ? "Processando..." : "Renderizar"}
        </button>
      </div>

      {error && (
        <div
          style={{
            color: "#d9534f",
            textAlign: "center",
            marginBottom: "15px",
          }}
        >
          {error}
        </div>
      )}

      {/* Container onde o 3Dmol vai injetar o visualizador */}
      <div
        ref={viewerContainerRef}
        style={{
          width: "100%",
          height: "500px",
          border: "2px solid #eaeaea",
          borderRadius: "8px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
          position: "relative",
        }}
      ></div>
    </div>
  );
}

export default App;
