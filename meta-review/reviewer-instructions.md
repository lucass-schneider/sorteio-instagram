# Instruções para os revisores da Meta

Cole o texto em **inglês** no campo de instruções de teste do formulário da análise do app. Onde estiver
`[TEST ACCOUNT]`, informe uma conta de teste **diretamente no formulário da Meta**. Nunca coloque as senhas neste
repositório nem no chat.

**Sobre a conta de teste:**
- **Recomendado:** criar uma conta do Instagram **só para teste**, profissional, com um post que tenha alguns
  comentários com marcações (@). Assim você não expõe a senha da conta da lanchonete.
- **Testador:** adicione essa conta como **Testador do Instagram** no app e aceite o convite.
- **Verificação em duas etapas:** deixe **desligada** nela, senão o revisor não consegue entrar.

---

**Inglês (para colar):**

> Comment Giveaway is a web app: https://lucass-schneider.github.io/sorteio-instagram/?lang=en
> (the "?lang=en" parameter shows the English interface; there is also a PT/EN switch in the header).
>
> Test account (Instagram professional account): [TEST ACCOUNT — username and password]
> Test post with comments: [TEST POST LINK]
>
> Steps to test instagram_business_basic and instagram_business_manage_comments:
> 1. Open the URL above.
> 2. In section "1 Comments", tab "Fetch from Instagram", click "Log in with Instagram".
> 3. Log in with the test account and allow the requested permissions.
> 4. You are sent back to the app, which shows "Connected as @username" (instagram_business_basic).
> 5. Paste the test post link into "Post link" and click "Fetch comments". The app finds the post among the account's
>    media (instagram_business_basic) and loads its comments (instagram_business_manage_comments). You will see
>    "N comments loaded".
> 6. Section "3 Participants" lists every commenter by @username; click a profile to see its comments.
> 7. In section "2 Rules", click "Tag exactly 2 people" and "Up to 2 comments per person". The participants are
>    re-evaluated instantly and each disqualified comment shows the reason.
> 8. In section "4 Draw", click "Draw". A full-screen animation shows the participating comments, a countdown and the
>    winner.
> 9. Click "Log out" to remove the access token from the browser.
>
> The app only reads comments; it never posts, replies to, hides or deletes them. No data is stored on our servers.
> To see the rules and draw flow without Instagram, use "Import file / text" → "Use sample data".
