# Pedido de acesso avançado à Meta

Objetivo: deixar **qualquer conta profissional** do Instagram entrar no sorteio, sem precisar adicioná-la como
testadora. Para isso a Meta exige **acesso avançado** às permissões `instagram_business_basic` e
`instagram_business_manage_comments`, o que passa por **verificação da empresa** e **análise do app**.

## Arquivos desta pasta

| Arquivo | Para que serve |
|---|---|
| `app-icon-1024.png` | Ícone do app (1024×1024). Envie em *Configurações do app → Básico → Ícone do app*. Gerado por `node scripts/make-icon.mjs`. |
| `permissions.md` | Textos em inglês explicando o uso de cada permissão (com tradução). |
| `reviewer-instructions.md` | Instruções em inglês para os revisores testarem o app. |
| `screencast-script.md` | Roteiro do vídeo, cena por cena, com as legendas em inglês. |

## Checklist

**Já feito**
- [x] App publicado (fora do modo de desenvolvimento)
- [x] Política de privacidade: [português](https://lucass-schneider.github.io/sorteio-instagram/privacidade.html) e
      [inglês](https://lucass-schneider.github.io/sorteio-instagram/privacy.html), com instruções de exclusão de dados
- [x] Site em inglês (`?lang=en` ou o seletor PT/EN)
- [x] Chamadas bem-sucedidas à API com as duas permissões

**Configurações do app (painel da Meta → Configurações do app → Básico)**
- [x] Enviar o ícone `app-icon-1024.png`
- [x] Escolher a categoria (*Utilitários e produtividade*)
- [ ] Conferir o e-mail de contato

**Verificação da empresa**
- [ ] Criar um portfólio empresarial (Meta Business Suite) para a empresa (ex.: Cenoura Lanches, com CNPJ)
- [ ] Conectar o app "Sorteio Ins" a esse portfólio
- [ ] Enviar os documentos na Central de Segurança do portfólio e aguardar a aprovação
- [ ] Concluir a etapa "Torne-se um Provedor de Tecnologia" que aparece no painel do app

**Análise do app**
- [ ] Criar uma conta de teste profissional no Instagram, com um post comentado, e adicioná-la como testadora
- [ ] Gravar o vídeo seguindo `screencast-script.md`
- [ ] Em *Análise do app*, pedir **acesso avançado** a `instagram_business_basic` e
      `instagram_business_manage_comments`, colando os textos de `permissions.md`, o vídeo e as instruções de
      `reviewer-instructions.md`
- [ ] Responder o questionário de uso de dados. Hospedagem: GitHub Pages. Login: Cloudflare Workers, que só troca o
      código pelo token e não guarda nada. Nenhum dado é vendido ou compartilhado.
- [ ] Enviar e acompanhar a resposta (pode levar alguns dias; se recusarem, ajustar e reenviar)
