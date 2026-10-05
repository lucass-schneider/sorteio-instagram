# Textos das permissões (análise do app na Meta)

Cole o texto em **inglês** no formulário da análise do app (*Análise do app → Solicitações de permissões e recursos*),
no campo que pergunta como o app usa cada permissão. A tradução em português abaixo de cada um é só para você
conferir.

---

## instagram_business_basic

**Inglês (para colar):**

> Comment Giveaway (https://lucass-schneider.github.io/sorteio-instagram/?lang=en) is a web tool that lets Instagram
> professional accounts (businesses and creators) run fair giveaways among the comments of their own posts.
>
> We use instagram_business_basic to:
> 1. Identify the professional account that logged in by reading its username. It is shown in the app as
>    "Connected as @username", so the user always knows which account is in use.
> 2. List the logged-in account's own media (id and permalink) to find the post whose link the user pasted, so we can
>    load that post's comments.
>
> We only access media of the account that logged in. All processing happens in the user's browser; we do not store
> profile or media data on any server. The user can log out at any time, which deletes the access token from the
> browser.

**Tradução:**

> O Comment Giveaway é uma ferramenta web que permite a contas profissionais do Instagram (empresas e criadores)
> fazer sorteios justos entre os comentários dos seus próprios posts.
>
> Usamos instagram_business_basic para:
> 1. Identificar a conta profissional que fez login, lendo o nome de usuário. Ele aparece no app como
>    "Connected as @usuario", para a pessoa sempre saber qual conta está em uso.
> 2. Listar as mídias da própria conta (id e link) para achar o post cujo link a pessoa colou e carregar os
>    comentários dele.
>
> Só acessamos mídias da conta que fez login. Todo o processamento acontece no navegador; não guardamos dados de
> perfil ou de mídia em nenhum servidor. A pessoa pode sair a qualquer momento, o que apaga o token do navegador.

---

## instagram_business_manage_comments

**Inglês (para colar):**

> After logging in, the user pastes the link of one of their own posts and the app reads that post's comments
> (text, timestamp and the commenter's username) to build the list of giveaway participants.
>
> The user then defines the giveaway rules (for example: tag exactly 2 people per comment, at most 2 comments per
> person, a required hashtag, a deadline). The app shows who qualifies and why each disqualified comment does not count,
> and finally draws the winners at random among qualified participants.
>
> The commenter's username is essential: rules are applied per person (e.g. maximum comments per person) and the
> winner has to be announced by @username. This is the permission required to read comments on the account's own media
> with the Instagram API with Instagram Login.
>
> We only read comments. The app never posts, replies to, hides or deletes comments. Comments are processed in the
> user's browser only and are not stored on any server.

**Tradução:**

> Depois do login, a pessoa cola o link de um post seu e o app lê os comentários desse post (texto, data e o nome de
> usuário de quem comentou) para montar a lista de participantes do sorteio.
>
> A pessoa define as regras (por exemplo: marcar exatamente 2 pessoas por comentário, no máximo 2 comentários por
> pessoa, hashtag obrigatória, prazo). O app mostra quem está apto e por que cada comentário desclassificado não vale,
> e então sorteia os ganhadores entre os aptos.
>
> O nome de usuário de quem comentou é essencial: as regras são aplicadas por pessoa (ex.: máximo de comentários por
> pessoa) e o ganhador precisa ser anunciado pelo @. Essa é a permissão exigida para ler comentários das mídias da
> própria conta na API do Instagram com login do Instagram.
>
> Só lemos comentários. O app nunca publica, responde, oculta ou apaga comentários. Os comentários são processados só
> no navegador e não ficam guardados em nenhum servidor.
