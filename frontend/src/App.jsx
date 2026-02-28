import { useState, useEffect, useRef } from 'react';
import axios from 'axios';

function App() {
  const [uniprotId, setUniprotId] = useState('P00533'); 
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // 1. Novo estado para guardar as informações da proteína
  const [metadata, setMetadata] = useState(null); 
  
  const viewerContainerRef = useRef(null);
  const [viewerInstance, setViewerInstance] = useState(null);

  useEffect(() => {
    if (viewerContainerRef.current && window.$3Dmol) {
      const viewer = window.$3Dmol.createViewer(viewerContainerRef.current, {
        backgroundColor: '#f8f9fa' 
      });
      setViewerInstance(viewer);
    }
  }, []);

  const fetchAndRenderProtein = async () => {
    if (!uniprotId || !viewerInstance) return;

    setLoading(true);
    setError(null);
    setMetadata(null);

    try {
      const baseUrl = 'https://glorious-goggles-p47qgj7xxqwh649x-3000.app.github.dev';

      const metadataResponse = await axios.get(`${baseUrl}/api/protein/${uniprotId}`);
      setMetadata(metadataResponse.data);
      const structureResponse = await axios.get(`${baseUrl}/api/protein/${uniprotId}/structure`);
      const pdbData = structureResponse.data;

      viewerInstance.clear();
      viewerInstance.addModel(pdbData, 'pdb');
      viewerInstance.setStyle({}, { cartoon: { color: 'spectrum' } }); 
      viewerInstance.zoomTo();
      viewerInstance.render();

    } catch (err) {
      console.error(err);
      setError('Erro ao carregar a estrutura. Verifique se o ID está correto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '40px auto', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#333' }}>AlphaFold Viewer 🧬</h1>
      <p style={{ textAlign: 'center', color: '#666' }}>MVP: Visualização de Estruturas Proteicas</p>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center' }}>
        <input
          type="text"
          value={uniprotId}
          onChange={(e) => setUniprotId(e.target.value.toUpperCase())}
          placeholder="Ex: P00533"
          style={{ padding: '10px', fontSize: '16px', width: '200px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
        <button
          onClick={fetchAndRenderProtein}
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            fontSize: '16px', 
            cursor: loading ? 'not-allowed' : 'pointer',
            backgroundColor: loading ? '#999' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 'bold'
          }}
        >
          {loading ? 'Processando...' : 'Renderizar'}
        </button>
      </div>

      {error && <div style={{ color: '#d9534f', textAlign: 'center', marginBottom: '15px' }}>{error}</div>}

      {/* 4. Exibe o painel de metadados apenas se ele existir */}
      {metadata && (
        <div style={{ 
          backgroundColor: '#e9ecef', 
          padding: '15px 20px', 
          borderRadius: '8px', 
          marginBottom: '20px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ marginTop: '0', color: '#2c3e50' }}>{metadata.proteinDescription}</h3>
          <p style={{ margin: '5px 0', color: '#34495e' }}><strong>Organismo:</strong> <i>{metadata.organismScientificName}</i></p>
          <p style={{ margin: '5px 0', color: '#34495e' }}><strong>Gene:</strong> {metadata.gene}</p>
        </div>
      )}

      <div
        ref={viewerContainerRef}
        style={{
          width: '100%',
          height: '500px',
          border: '2px solid #eaeaea',
          borderRadius: '8px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
          position: 'relative'
        }}
      ></div>
    </div>
  );
}

export default App;