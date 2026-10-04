# Sorteio de comentários do Instagram

App React (Vite + TypeScript) para sortear participantes a partir dos comentários de uma publicação,
com critérios configuráveis.

## Rodar

```bash
npm install
npm run dev      # abre em http://localhost:5173
npm test         # testes das regras, importação e sorteio
npm run build    # gera a versão estática em dist/
```

> O `.npmrc` desta pasta aponta para o registry público do npm, para não usar o registry da empresa
> configurado no `~/.npmrc`.

## De onde vêm os comentários

1. **Link + token da Meta** – busca os comentários pela API oficial. Funciona para publicações da
   sua própria conta **Profissional** (Comercial ou Criador de conteúdo). O passo a passo para gerar
   o token está no próprio app, em "Por que precisa de token?".
2. **Importar** – cole ou envie um arquivo JSON, CSV (`Usuário;Comentário;Data`) ou texto com uma
   linha por comentário (`usuario: comentário`). Serve para exportações de outras ferramentas.

O Instagram não permite ler comentários só com o link (sem login/API), por isso o token é necessário.

## Critérios disponíveis

- Mínimo e máximo de pessoas marcadas por comentário (ex.: exatamente 2)
- Marcar a si mesmo não conta; lista de marcações que não contam (ex.: o perfil do sorteio)
- Não repetir a mesma pessoa em comentários diferentes
- Texto ou hashtag obrigatório
- Mínimo de comentários válidos e máximo de comentários por pessoa
  (quem passar do máximo é desclassificado, ou valem só os primeiros)
- Prazo final, respostas contam ou não, perfis excluídos
- Uma chance por pessoa ou uma chance por comentário válido

O sorteio usa `crypto.getRandomValues` (gerador criptográfico) e permite ganhadores e suplentes.
