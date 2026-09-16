# Logistics Command Center

Crie uma Home Page / Dashboard corporativo para a nossa equipe de Logística chamado "Central de Operações Logísticas". O objetivo é centralizar os acessos rápidos para as nossas ferramentas diárias.

Diretrizes de Design:

- Use um visual moderno, limpo, profissional e minimalista.

- Cores principais: Azul escuro corporativo (navy), fundo cinza bem claro para destacar os cards, e detalhes em verde ou laranja para botões e ações.

- Layout responsivo que funcione perfeitamente tanto no computador quanto no celular.

- Adicione uma barra de pesquisa simulada no topo com o texto "Buscar ferramenta ou documento..." e um cabeçalho elegante.

Organize a página em uma seção principal chamada "Acessos Rápidos" utilizando a biblioteca Lucide React para ícones intuitivos. Crie exatamente os seguintes 3 cards dinâmicos:

1. Card: "Tabela de Fretes"

- Ícone: LucideTruck (Caminhão) ou LucideDollarSign (Cifrão)

- Subtítulo/Descrição: "Consulta de tabelas e cálculo de fretes operacionais."

- Comportamento: Deve abrir o link real em uma nova aba: https://tabeladefretes.lovable.app/

2. Card: "Planilha de Cotação de Frete"

- Ícone: LucideFileSpreadsheet (Planilha)

- Subtítulo/Descrição: "Acesso direto à planilha oficial de cotações e simulações."

- Comportamento: Deve abrir o link real em uma nova aba: https://docs.google.com/spreadsheets/d/1kq3rg1h2jV3lmGWpX-qKfLJkrhf6eAU19iZ1-nHHzeA/edit?usp=sharing

3. Card: "Dados de Transportadores"

- Ícone: LucideUsers (Usuários/Equipe) ou LucideShieldCheck (Verificado)

- Subtítulo/Descrição: "Consulta ao sistema Caltec de dados de transportadores."

- Comportamento: Deve abrir o link real em uma nova aba: https://transportadorescaltec.lovable.app

Dica extra de layout: Deixe um card cinza tracejado ou com um botão de "+" no final escrito "Adicionar Nova Ferramenta (Em breve)" para sabermos onde colocar os próximos links no futuro.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://logisticacaltec.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/6900df9f-7fae-41fd-b572-3164a1b89420).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
