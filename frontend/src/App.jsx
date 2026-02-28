import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Dna, FileText, LayoutTemplate, Search, ChevronDown, ChevronUp } from 'lucide-react';

const BASE_URL = 'https://glorious-goggles-p47qgj7xxqwh649x-3000.app.github.dev';

function ProteinAnalyzer({ defaultSearch = '', title = '' }) {
  const [searchTerm, setSearchTerm] = useState(defaultSearch);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [description, setDescription] = useState(null); 
  
  // NOVO: Controla se o texto da função está expandido ou não
  const [isFunctionExpanded, setIsFunctionExpanded] = useState(false);
  
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
    setDescription(null);
    setIsFunctionExpanded(false);

    try {
      const BASE_URL = 'https://glorious-goggles-p47qgj7xxqwh649x-3000.app.github.dev';

      const searchResponse = await axios.get(`${BASE_URL}/api/search/${searchTerm}`);
      const proteinId = searchResponse.data.id;

      const metadataResponse = await axios.get(`${BASE_URL}/api/protein/${proteinId}`);
      setMetadata(metadataResponse.data);

      const descResponse = await axios.get(`${BASE_URL}/api/uniprot/${proteinId}`);
      setDescription(descResponse.data.function);

      const structureResponse = await axios.get(`${BASE_URL}/api/protein/${proteinId}/structure`);
      viewerInstance.clear();
      viewerInstance.addModel(structureResponse.data, 'pdb');
      
      viewerInstance.setStyle({}, { 
        cartoon: { 
          colorfunc: (atom) => {
            if (atom.b > 90) return '#0053d6'; 
            if (atom.b > 70) return '#65cbff'; 
            if (atom.b > 50) return '#ffe500'; 
            return '#ff7d45';                  
          } 
        } 
      }); 
      
      viewerInstance.zoomTo();
      viewerInstance.render();

    } catch (err) {
      console.error(err);
      setError('Não encontrada. Tente o nome em inglês (ex: Insulin) ou verifique o texto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {title && <h3 style={{ margin: 0, color: '#818cf8' }}>{title}</h3>}
      
      <div style={{ display: 'flex', gap: '10px', backgroundColor: '#1e293b', padding: '15px', borderRadius: '12px', border: '1px solid #334155' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <Search size={18} color="#94a3b8" style={{ position: 'absolute', left: '12px', top: '12px' }} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Nome (ex: Keratin)"
            style={{ 
              width: '100%', padding: '10px 10px 10px 40px', fontSize: '15px', 
              backgroundColor: '#0f172a', border: '1px solid #334155', color: 'white',
              borderRadius: '6px', outline: 'none', boxSizing: 'border-box'
            }}
          />
        </div>
        <button
          onClick={fetchAndRenderProtein}
          disabled={loading}
          style={{ 
            padding: '0 20px', fontSize: '14px', fontWeight: 'bold',
            backgroundColor: loading ? '#4f46e580' : '#4f46e5', color: 'white',
            border: 'none', borderRadius: '6px', cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Buscando...' : 'Analisar'}
        </button>
      </div>

      {error && <div style={{ backgroundColor: '#7f1d1d', color: '#fca5a5', padding: '12px', borderRadius: '8px', fontSize: '14px' }}>{error}</div>}

      <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
        <h4 style={{ marginTop: 0, color: '#f8fafc', fontSize: '16px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
          Informações Biológicas
        </h4>
        {metadata ? (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '12px', display: 'block' }}>NOME COMUM</span>
                <strong style={{ fontSize: '15px', color: '#818cf8' }}>{metadata.proteinDescription}</strong>
              </div>
              <div>
                <span style={{ color: '#94a3b8', fontSize: '12px', display: 'block' }}>ORGANISMO</span>
                <span style={{ fontSize: '14px', fontStyle: 'italic' }}>{metadata.organismScientificName}</span>
              </div>
            </div>
            
            {/* Caixa de Função Interativa */}
            <div 
              onClick={() => setIsFunctionExpanded(!isFunctionExpanded)}
              style={{ 
                backgroundColor: '#0f172a', padding: '15px', borderRadius: '8px', 
                border: '1px solid #334155', cursor: 'pointer' 
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'bold' }}>
                  FUNÇÃO / O QUE FAZ?
                </span>
                {/* O ícone muda dependendo de estar aberto ou fechado */}
                {isFunctionExpanded ? <ChevronUp size={16} color="#818cf8" /> : <ChevronDown size={16} color="#818cf8" />}
              </div>
              
              <p style={{ 
                margin: 0, fontSize: '14px', lineHeight: '1.6', color: '#cbd5e1',
                display: isFunctionExpanded ? 'block' : '-webkit-box',
                WebkitLineClamp: isFunctionExpanded ? 'unset' : 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden'
              }}>
                {description || 'Buscando explicação...'}
              </p>
            </div>
            
          </div>
        ) : (
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Nenhuma proteína carregada.</p>
        )}
      </div>

      <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '15px' }}>
          <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '16px' }}>Modelo 3D</h4>
          
          {metadata && (
            <div style={{ display: 'flex', gap: '15px', fontSize: '11px', color: '#94a3b8' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '10px', height: '10px', backgroundColor: '#0053d6', borderRadius: '2px' }}></div> Certeza Alta
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '10px', height: '10px', backgroundColor: '#65cbff', borderRadius: '2px' }}></div> Boa
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '10px', height: '10px', backgroundColor: '#ffe500', borderRadius: '2px' }}></div> Baixa
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <div style={{ width: '10px', height: '10px', backgroundColor: '#ff7d45', borderRadius: '2px' }}></div> Flexível/Inseguro
              </span>
            </div>
          )}
        </div>
        
        <div ref={viewerContainerRef} style={{ width: '100%', height: '350px', borderRadius: '8px', overflow: 'hidden', position: 'relative' }}></div>
      </div>
    </div>
  );
}

function App() {
  const [activeMenu, setActiveMenu] = useState('Proteínas');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', overflowX: 'hidden', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      
      {/* BARRA LATERAL */}
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
            onClick={() => setActiveMenu('Proteínas')}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
              backgroundColor: activeMenu === 'Proteínas' ? '#312e81' : 'transparent',
              color: activeMenu === 'Proteínas' ? '#e0e7ff' : '#cbd5e1',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
              textAlign: 'left', fontSize: '15px', fontWeight: '500', transition: '0.2s'
            }}
          >
            <FileText size={20} /> Análise Individual
          </button>
          
          <button
            onClick={() => setActiveMenu('Comparações')}
            style={{
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
              backgroundColor: activeMenu === 'Comparações' ? '#312e81' : 'transparent',
              color: activeMenu === 'Comparações' ? '#e0e7ff' : '#cbd5e1',
              border: 'none', borderRadius: '8px', cursor: 'pointer',
              textAlign: 'left', fontSize: '15px', fontWeight: '500', transition: '0.2s'
            }}
          >
            <LayoutTemplate size={20} /> Modo Versus
          </button>
        </nav>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main style={{ flex: 1, padding: '40px', boxSizing: 'border-box', maxWidth: 'calc(100vw - 260px)', overflowY: 'auto' }}>
        
        {/* TELA 1: ANÁLISE INDIVIDUAL */}
        {activeMenu === 'Proteínas' && (
          <div>
            <header style={{ marginBottom: '30px' }}>
              <h1 style={{ margin: '0 0 8px 0', fontSize: '32px' }}>Análise Individual</h1>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '16px' }}>Pesquise e visualize uma sequência de proteína em 3D.</p>
            </header>
            
            <div style={{ maxWidth: '800px' }}>
              {/* Aqui chamamos o nosso componente UMA vez */}
              <ProteinAnalyzer defaultSearch="Insulin" />
            </div>
          </div>
        )}

        {/* TELA 2: MODO VERSUS (COMPARAÇÃO) */}
        {activeMenu === 'Comparações' && (
          <div>
            <header style={{ marginBottom: '30px' }}>
              <h1 style={{ margin: '0 0 8px 0', fontSize: '32px' }}>Modo Versus (Comparação)</h1>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '16px' }}>Coloque duas proteínas lado a lado para comparar as suas estruturas.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
              {/* Aqui chamamos o nosso componente DUAS vezes, lado a lado! */}
              <ProteinAnalyzer defaultSearch="Hemoglobin" title="Amostra A" />
              <ProteinAnalyzer defaultSearch="Myoglobin" title="Amostra B" />
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

export default App;