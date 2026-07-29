# Kingstar QA & Inventory Management 📦

Sistema integrado para gestão de matérias-primas, controle de qualidade e solicitações de compra.

## Módulos Principais

- **Dashboard**: Visão geral de métricas, movimentos recentes e saúde do estoque.
- **Estoque Geral**: Cadastro de materiais, definição de quantidade mínima (ruptura) e máxima (excesso) com indicadores visuais de saúde do estoque.
- **Solicitações de Compra**: Permite solicitar e aprovar requisições de compras baseadas na ruptura de estoque.
- **Relatórios**: Análise do giro de estoque, identificação de gargalos de fornecimento e itens que necessitam reposição imediata.

## Tecnologias

- **Frontend**: React 18, Tailwind CSS, Lucide Icons, Vite
- **Backend**: Express, SQLite (Local) / MySQL (CleverCloud)

## Funcionalidades Implementadas

- [x] CRUD de Materiais (Fornecedor, Medidas, Limites Mínimo/Máximo)
- [x] Registro e Histórico de Movimentações (Entradas/Saídas)
- [x] Fluxo de Aprovação de Solicitação de Compras
- [x] Relatórios e Saúde de Estoque Automáticos (Ruptura, Saudável, Excesso)
- [x] Interface Dark Mode com Tailwind CSS

## Instalação e Uso

1. Instale as dependências: `npm install`
2. Inicie o servidor: `npm run dev`
3. A aplicação estará disponível na porta `3000`.

*Desenvolvido no Google AI Studio Build.*
