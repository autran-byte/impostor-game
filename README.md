# IMPOSTOR — O Jogo

Um jogo local de palavras secretas para jogar em grupo. Um ou mais jogadores recebem o papel de impostor e precisam descobrir a palavra apenas pelas dicas dos outros participantes.

## Status do projeto

Primeira etapa concluída: o arquivo único foi separado em boas práticas com HTML, CSS e JavaScript em arquivos diferentes.

A próxima etapa planejada é substituir o array local de palavras por dados vindos do Supabase.

## Estrutura

```txt
impostor-game-separated/
├── index.html
├── styles.css
├── script.js
├── README.md
└── .gitignore
```

## Como rodar localmente

Como o projeto ainda é HTML, CSS e JS puro, basta abrir o arquivo `index.html` no navegador.

Também é possível rodar com uma extensão como **Live Server** no VS Code.

## Próximas etapas

- Criar projeto no Supabase
- Rodar o schema SQL
- Popular os baralhos atuais no banco
- Trocar o array `DECKS` por `fetch`
- Adicionar estado de carregamento
- Publicar no Netlify
- Configurar variáveis de ambiente no Netlify

## Tecnologias

- HTML5
- CSS3
- JavaScript puro

## Observação

Neste momento, os baralhos ainda estão definidos localmente dentro do arquivo `script.js`.
