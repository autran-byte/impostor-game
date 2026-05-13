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

## Próximas etapas

- Rodar o schema SQL para seleção de decks e palavra chave
- Popular os baralhos atuais no banco
- Trocar o array `DECKS` por `fetch`
- Adicionar estado de carregamento

## Tecnologias

- HTML5
- CSS3
- JavaScript puro
