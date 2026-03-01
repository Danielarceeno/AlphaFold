import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Dna, FileText, LayoutTemplate, Search, ChevronDown, ChevronUp, Zap } from 'lucide-react';

const BASE_URL = 'https://glorious-goggles-p47qgj7xxqwh649x-3000.app.github.dev';

function ProteinAnalyzer({ defaultSearch = '', title = '' }) {
  const [searchTerm, setSearchTerm] = useState(defaultSearch);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [description, setDescription] = useState(null); 
  const [isFunctionExpanded, setIsFunctionExpanded] = useState(false);
  const [variants, setVariants] = useState([]);
  const [showMutations, setShowMutations] = useState(false);
  
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
    setVariants([]);
    setShowMutations(false);
    setIsFunctionExpanded(false);

    try {
      const BASE_URL = 'https://glorious-goggles-p47qgj7xxqwh649x-3000.app.github.dev';

      const searchResponse = await axios.get(`${BASE_URL}/api/search/${searchTerm}`);
      const proteinId = searchResponse.data.id;

      const metadataResponse = await axios.get(`${BASE_URL}/api/protein/${proteinId}`);
      setMetadata(metadataResponse.data);

      const uniprotResponse = await axios.get(`${BASE_URL}/api/uniprot/${proteinId}`);
      setDescription(uniprotResponse.data.function);
      setVariants(uniprotResponse.data.variants);

      const structureResponse = await axios.get(`${BASE_URL}/api/protein/${proteinId}/structure`);
      viewerInstance.clear();
      viewerInstance.addModel(structureResponse.data, 'pdb');
      
      applyStyles(false);
      
      viewerInstance.zoomTo();

    } catch (err) {
      console.error(err);
      setError('Não encontrada. Tente o nome em inglês (ex: Insulin) ou verifique o texto.');
    } finally {
      setLoading(false);
    }
  };

  const applyStyles = (highlight) => {
    if (!viewerInstance) return;
    
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

    if (highlight && variants.length > 0) {
      const mutatedPositions = variants.map(v => parseInt(v.position));
      viewerInstance.addStyle({resi: mutatedPositions}, {sphere: {color: '#ef4444', radius: 1.5}});
    }
    
    viewerInstance.render();
  };

  const toggleMutations = () => {
    const newState = !showMutations;
    setShowMutations(newState);
    applyStyles(newState);
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
            placeholder="Nome (ex: Hemoglobin)"
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
            
            <div 
              onClick={() => setIsFunctionExpanded(!isFunctionExpanded)}
              style={{ backgroundColor: '#0f172a', padding: '15px', borderRadius: '8px', border: '1px solid #334155', cursor: 'pointer' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 'bold' }}>FUNÇÃO / O QUE FAZ?</span>
                {isFunctionExpanded ? <ChevronUp size={16} color="#818cf8" /> : <ChevronDown size={16} color="#818cf8" />}
              </div>
              <p style={{ 
                margin: 0, fontSize: '14px', lineHeight: '1.6', color: '#cbd5e1',
                display: isFunctionExpanded ? 'block' : '-webkit-box', WebkitLineClamp: isFunctionExpanded ? 'unset' : 2, WebkitBoxOrient: 'vertical', overflow: 'hidden'
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
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <h4 style={{ margin: 0, color: '#f8fafc', fontSize: '16px' }}>Modelo 3D</h4>
            {metadata && (
              <div style={{ display: 'flex', gap: '10px', fontSize: '11px', color: '#94a3b8' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#0053d6', borderRadius: '2px' }}></div> Alta
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#65cbff', borderRadius: '2px' }}></div> Boa
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#ffe500', borderRadius: '2px' }}></div> Baixa
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '8px', height: '8px', backgroundColor: '#ff7d45', borderRadius: '2px' }}></div> Flexível
                </span>
              </div>
            )}
          </div>
          
          {variants.length > 0 && (
            <button 
              onClick={toggleMutations}
              style={{ 
                display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', fontSize: '13px', fontWeight: 'bold',
                backgroundColor: showMutations ? '#ef4444' : '#0f172a', 
                color: showMutations ? 'white' : '#f8fafc',
                border: '1px solid', borderColor: showMutations ? '#ef4444' : '#334155',
                borderRadius: '6px', cursor: 'pointer', transition: '0.2s'
              }}
            >
              <Zap size={14} />
              {showMutations ? 'Ocultar Mutações' : `Destacar ${variants.length} Mutações`}
            </button>
          )}

        </div>
        
        <div ref={viewerContainerRef} style={{ width: '100%', height: '350px', borderRadius: '8px', overflow: 'hidden', position: 'relative', marginBottom: '10px' }}></div>
        
        {showMutations && (
          <div style={{ backgroundColor: '#450a0a', border: '1px solid #7f1d1d', borderRadius: '8px', padding: '15px', maxHeight: '150px', overflowY: 'auto' }}>
            <h5 style={{ margin: '0 0 10px 0', color: '#fca5a5', fontSize: '13px' }}>MUTAÇÕES DETETADAS NESTA ESTRUTURA:</h5>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#fecaca', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {variants.slice(0, 20).map((v, i) => (
                <li key={i}>
                  <strong>Posição {v.position}</strong> ({v.original} → {v.mutated}): {v.description}
                </li>
              ))}
              {variants.length > 20 && <li><em>... e mais {variants.length - 20} variantes conhecidas.</em></li>}
            </ul>
          </div>
        )}
      </div>

      {/* NOVO: CARTÃO DA MATRIZ PAE */}
      {metadata && metadata.paeImageUrl && (
        <div style={{ backgroundColor: '#1e293b', padding: '20px', borderRadius: '12px', border: '1px solid #334155' }}>
          <h4 style={{ marginTop: 0, color: '#f8fafc', fontSize: '16px', borderBottom: '1px solid #334155', paddingBottom: '10px', marginBottom: '15px' }}>
            Matriz PAE (Detector de Flexibilidade)
          </h4>
          
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
            <img 
              src={metadata.paeImageUrl} 
              alt="Gráfico PAE" 
              style={{ width: '100%', maxWidth: '280px', borderRadius: '8px', border: '1px solid #334155' }}
            />
            
            <div style={{ flex: 1, minWidth: '250px', backgroundColor: '#0f172a', padding: '15px', borderRadius: '8px', border: '1px solid #334155' }}>
              <p style={{ margin: '0 0 10px 0', fontSize: '14px', color: '#e2e8f0', fontWeight: 'bold' }}>
                Como interpretar este gráfico?
              </p>
              <p style={{ margin: '0 0 10px 0', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5' }}>
                Este mapa mostra quais partes da proteína se movem juntas. Os cientistas utilizam-no para descobrir se a proteína é um "bloco sólido" ou se tem "tentáculos flexíveis".
              </p>
              <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: '#94a3b8', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                <li><strong style={{ color: '#22c55e' }}>Verde Escuro:</strong> Posições fixas e rígidas.</li>
                <li><strong style={{ color: '#bef264' }}>Verde Claro / Branco:</strong> Regiões soltas ou altamente flexíveis.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}

function App() {
  const [activeMenu, setActiveMenu] = useState('Proteínas');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', width: '100vw', overflowX: 'hidden', backgroundColor: '#0f172a', color: '#f8fafc', fontFamily: 'system-ui, sans-serif' }}>
      
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

      <main style={{ flex: 1, padding: '40px', boxSizing: 'border-box', maxWidth: 'calc(100vw - 260px)', overflowY: 'auto' }}>
        
        {activeMenu === 'Proteínas' && (
          <div>
            <header style={{ marginBottom: '30px' }}>
              <h1 style={{ margin: '0 0 8px 0', fontSize: '32px' }}>Análise Individual</h1>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '16px' }}>Pesquise e visualize uma sequência de proteína em 3D.</p>
            </header>
            
            <div style={{ maxWidth: '800px' }}>
              <ProteinAnalyzer defaultSearch="Hemoglobin" />
            </div>
          </div>
        )}

        {activeMenu === 'Comparações' && (
          <div>
            <header style={{ marginBottom: '30px' }}>
              <h1 style={{ margin: '0 0 8px 0', fontSize: '32px' }}>Modo Versus (Comparação)</h1>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '16px' }}>Coloque duas proteínas lado a lado para comparar as suas estruturas.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
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