# AlphaFold Viewer — Frontend

Interface em React (Vite) do AlphaFold Viewer. A visão geral do projeto está no [README da raiz](../README.md).

## Rodando

```bash
npm install
cp .env.example .env   # define VITE_API_BASE_URL (URL do backend)
npm run dev            # http://localhost:5173
```

O backend precisa estar rodando (veja `../backend`). Sem o `.env`, o frontend usa `http://localhost:3000`.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento com HMR |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Serve o build localmente |
| `npm run lint` | ESLint |

## Estrutura

- `src/App.jsx` — telas (Populares, Análise, Versus) e o componente `ProteinAnalyzer`
- `src/index.css` — estilos globais mínimos; o restante é estilo inline
- `public/favicon.svg` — ícone da aba

O 3Dmol.js é carregado sob demanda (`import()` dinâmico), apenas quando um visualizador 3D é exibido.
