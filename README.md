# Sorteio de comentários do Instagram

App React (Vite + TypeScript) para sortear participantes a partir dos comentários de uma publicação,
com critérios configuráveis.

**Acesse:** https://lucass-schneider.github.io/sorteio-instagram/

## Rodar

```bash
npm install
npm run dev      # abre em http://localhost:5173
npm test         # testes das regras, importação e sorteio
npm run build    # gera a versão estática em dist/
npm run deploy   # publica dist/ na branch gh-pages (GitHub Pages)
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

## Login com Instagram (configuração única)

O botão "Entrar com Instagram" só aparece quando o site é publicado com `VITE_INSTAGRAM_APP_ID` e
`VITE_AUTH_API_URL`. O login precisa de um pequeno servidor (`auth-worker/`, Cloudflare Workers, gratuito)
porque a troca do código pelo token usa a chave secreta do app, que não pode ficar no site.

1. **Meta** – em https://developers.facebook.com/apps, crie um app com o caso de uso do Instagram
   (*API com login do Instagram*). Em *Configurar o login comercial do Instagram*, cadastre o URI de
   redirecionamento `https://lucass-schneider.github.io/sorteio-instagram/`. Anote o **ID do app do Instagram**
   e a **Chave secreta do app do Instagram**. Enquanto o app estiver em desenvolvimento, adicione sua conta
   como testadora do Instagram em *Funções do app* e aceite o convite no Instagram.
2. **Servidor de login** – crie uma conta gratuita na Cloudflare e rode:
   ```bash
   npx wrangler login        # abre o navegador para autorizar
   # coloque o ID do app em INSTAGRAM_APP_ID, no arquivo auth-worker/wrangler.toml
   npm run auth:secret       # cole a chave secreta quando pedir (ela não fica no código)
   npm run auth:deploy       # mostra a URL do servidor (…workers.dev)
   ```
3. **Site** – crie `.env.production` a partir de `.env.example` com o ID do app e a URL do servidor e rode
   `npm run deploy`.

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

## Acesso para outras contas

O passo a passo para pedir à Meta o acesso avançado (outras contas profissionais sem precisar ser testadoras) está em [`meta-review/`](meta-review/README.md).
