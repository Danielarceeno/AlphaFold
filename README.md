# 🧬 AlphaFold Viewer & Protein Analysis System

<p align="center">
  Uma plataforma Full Stack avançada para visualização, análise comparativa e mapeamento genético de estruturas proteicas em 3D, integrando a inteligência preditiva do <b>AlphaFold</b> com o vasto banco de dados do <b>UniProt</b>.
</p>

<div align="center">
  <a href="https://alpha-fold.vercel.app/" target="_blank"><strong>🚀 Acessar Aplicação (Live Demo)</strong></a>
</div>

---

## 🔬 Sobre o Projeto

Este sistema foi desenvolvido para traduzir dados complexos de bioinformática em uma interface acessível e visual. Focado em estudantes, cientistas e pesquisadores, o sistema não exige conhecimento prévio de códigos PDB complexos. Basta buscar pelo nome comum da proteína (ex: *Insulin*, *Hemoglobin*) e o sistema orquestra a busca, cruzamento de dados biológicos e renderização 3D de alta performance.

---

## ✨ Principais Funcionalidades

- [x] **Tradução Inteligente:** Conversão de buscas de texto livre (nomes de proteínas) em IDs universais.
- [x] **Renderização 3D Nativa:** Modelos gerados com `3Dmol.js`, suportando zoom, rotação e pan.
- [x] **Mapeamento de Confiança (pLDDT):** Colorização oficial do AlphaFold para indicar precisão preditiva estrutural.
- [x] **Painel de Variantes Genéticas:** Mapeamento de mutações naturais associadas a doenças com destaque interativo (esferas vermelhas) na estrutura tridimensional.
- [x] **Análise de Flexibilidade (Matriz PAE):** Exibição do gráfico de Erro Alinhado Predito com guia de interpretação para leigos.
- [x] **Modo Versus:** Renderização paralela de múltiplas proteínas para comparação morfológica.
- [x] **Hall da Fama:** Galeria pré-selecionada das moléculas mais estudadas na academia científica.
- [x] **Design Responsivo:** UI/UX totalmente adaptada para dispositivos móveis, tablets e monitores ultrawide.

---

## 🛠 Arquitetura e Tecnologias

O projeto utiliza uma arquitetura baseada em microsserviços lógicos, separando a responsabilidade de apresentação visual da orquestração de dados.

### 🎨 Frontend (Interface de Usuário)
- **React.js** (via Vite)
- **Axios** para requisições assíncronas
- **3Dmol.js** para renderização WebGL
- **Lucide-React** para iconografia
- **Hospedagem:** Vercel

### ⚙️ Backend (Orquestrador de APIs RESTful)
- **Node.js** com framework **Express**
- **CORS** para segurança de rotas
- Consumo e tratamento das APIs:
  - *REST API UniProtKB* (Dados biológicos e mutações)
  - *AlphaFold Protein Structure API* (Arquivos .pdb e imagens PAE)
- **Hospedagem:** Render

---

👨‍💻 Autor
Desenvolvido com 🩵 por Daniel.

Este projeto faz parte de um Trabalho de Conclusão de Curso (TCC) na intersecção entre Desenvolvimento de Software e Bioinformática.
