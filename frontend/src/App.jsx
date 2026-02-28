import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Dna, FileText, Search } from 'lucide-react';

function App() {
  const [searchTerm, setSearchTerm] = useState('P00533');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);
  
  const viewerContainerRef = useRef(null);
  const [viewerInstance, setViewerInstance] = useState(null);

  useEffect(() => {
    if (viewerContainerRef.current && window.$3Dmol) {
      const viewer = window.$3Dmol.createViewer(viewerContainerRef.current, {
        backgroundColor: '#1e293b' 
      });
      setViewerInstance(viewer);
    }
  }, []);

 const fetchAndRenderProtein = async () => {
    if (!searchTerm || !viewerInstance) return;

    setLoading(true);
    setError(null);
    setMetadata(null);

    try {
      const baseUrl = 'https://glorious-goggles-p47qgj7xxqwh649x-3000.app.github.dev';
      const searchResponse = await axios.get(`${baseUrl}/api/search/${searchTerm}`);
      const proteinId = searchResponse.data.id; // Ex: Vai transformar "Insulin" em "P01308"
      const metadataResponse = await axios.get(`${baseUrl}/api/protein/${proteinId}`);
      setMetadata(metadataResponse.data);

      const structureResponse = await axios.get(`${baseUrl}/api/protein/${proteinId}/structure`);
      viewerInstance.clear();
      viewerInstance.addModel(structureResponse.data, 'pdb');
      viewerInstance.setStyle({}, { cartoon: { color: 'spectrum' } }); 
      viewerInstance.zoomTo();
      viewerInstance.render();

    } catch (err) {
      console.error(err);
      setError('Não conseguimos encontrar essa proteína. Tente digitar o nome em inglês (ex: Insulin, Hemoglobin) ou verifique a ortografia.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', overflowX: 'hidden', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* BARRA LATERAL SIMPLIFICADA */}
      <aside style={{ width: '260px', minWidth: '260px', backgroundColor: '#1e293b', borderRight: '1px solid #334155', padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', color: '#818cf8' }}>
          <Dna size={32} />
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold' }}>AlphaFold</h2>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>Analysis System</span>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
              backgroundColor: '#312e81', color: '#e0e7ff',
              border: 'none', borderRadius: '8px', cursor: 'default',
              textAlign: 'left', fontSize: '15px', fontWeight: '500'
            }}
          >
            <FileText size={20} />
            Proteínas
          </button>
        </nav>
      </aside>

      {/* ÁREA PRINCIPAL COM LIMITADOR DE LARGURA */}
      <main style={{ flex: 1, padding: '40px', boxSizing: 'border-box', maxWidth: 'calc(100vw - 260px)' }}>
        <header style={{ marginBottom: '30px' }}>
          <h1 style={{ margin: '0 0 8px 0', fontSize: '32px' }}>Proteínas</h1>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '16px' }}>
            Pesquise, visualize e analise sequências de proteínas em 3D.
          </p>
        </header>

        <div style={{ display: 'flex', gap: '15px', marginBottom: '30px', backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={20} color="#94a3b8" style={{ position: 'absolute', left: '15px', top: '15px' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
              placeholder="Digite o código da proteína (ex: P00533 ou P69905)"
              style={{ 
                width: '100%', padding: '14px 14px 14px 45px', fontSize: '16px', 
                backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white',
                borderRadius: '8px', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>
          <button
            onClick={fetchAndRenderProtein}
            disabled={loading}
            style={{ 
              padding: '0 30px', fontSize: '16px', fontWeight: 'bold',
              backgroundColor: loading ? '#4f46e580' : '#4f46e5', color: 'white',
              border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {loading ? 'Analisando...' : 'Analisar Estrutura'}
          </button>
        </div>

        {error && <div style={{ backgroundColor: '#7f1d1d', color: '#fca5a5', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>{error}</div>}

        {/* ALINHAMENTO CORRIGIDO: alignItems: 'start' evita que o grid estique bizarramente */}
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(250px, 1fr) 2fr', gap: '20px', alignItems: 'start' }}>
          
          <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155' }}>
            <h3 style={{ marginTop: 0, color: '#f8fafc', fontSize: '18px', borderBottom: '1px solid #334155', paddingBottom: '15px' }}>
              Dados da Proteína
            </h3>
            
            {metadata ? (
              <div>
                <div style={{ marginBottom: '15px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '4px' }}>NOME COMUM</span>
                  <strong style={{ fontSize: '16px', color: '#818cf8', wordBreak: 'break-word' }}>{metadata.proteinDescription}</strong>
                </div>
                <div style={{ marginBottom: '15px' }}>
                  <span style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '4px' }}>ESPÉCIE / ORGANISMO</span>
                  <span style={{ fontSize: '15px', wordBreak: 'break-word' }}>{metadata.organismScientificName}</span>
                </div>
                <div>
                  <span style={{ color: '#94a3b8', fontSize: '13px', display: 'block', marginBottom: '4px' }}>CÓDIGO GENÉTICO (GENE)</span>
                  <span style={{ fontSize: '15px', backgroundColor: '#0f172a', padding: '4px 8px', borderRadius: '4px' }}>{metadata.gene}</span>
                </div>
              </div>
            ) : (
              <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6' }}>
                Nenhuma proteína carregada. Digite um código no campo acima para visualizar as propriedades biológicas.
              </p>
            )}
          </div>

          <div style={{ backgroundColor: '#1e293b', padding: '24px', borderRadius: '12px', border: '1px solid #334155', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginTop: 0, color: '#f8fafc', fontSize: '18px', borderBottom: '1px solid #334155', paddingBottom: '15px', marginBottom: '15px' }}>
              Modelo Tridimensional (AlphaFold)
            </h3>
            <div
              ref={viewerContainerRef}
              style={{ 
                width: '100%', 
                height: '400px', 
                borderRadius: '8px', 
                overflow: 'hidden',
                position: 'relative'
              }}
            ></div>
          </div>

        </div>
      </main>
    </div>
  );
}

export default App;