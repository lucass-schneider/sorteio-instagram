import type { ReactNode } from 'react'
import type { LoginCode } from '../lib/auth'
import { apiText, LOCALES, parseText, ruleText, type Lang } from './lib'

const n = (count: number, one: string, many: string) => `${count} ${count === 1 ? one : many}`

const pt = {
  lang: 'pt' as Lang,
  locale: LOCALES.pt,
  rule: ruleText.pt,
  parse: parseText.pt,
  api: apiText.pt,

  app: {
    title: 'Sorteio de comentários',
    subtitle: 'Carregue os comentários de uma publicação do Instagram, defina as regras e sorteie.',
    privacy: 'Política de Privacidade',
    privacyHref: './privacidade.html',
    language: 'Idioma',
  },

  source: {
    title: 'Comentários',
    subtitle: 'De onde vêm os comentários da publicação.',
    tabApi: 'Buscar no Instagram',
    tabImport: 'Importar arquivo / texto',
    connectedAs: 'Conectado como',
    yourAccount: 'sua conta',
    logout: 'Sair',
    login: 'Entrar com Instagram',
    loginHint:
      'Você autoriza no Instagram e volta para cá. Precisa ser uma conta Profissional (Comercial ou Criador de conteúdo), e só dá para buscar publicações dela.',
    link: 'Link da publicação',
    fetch: 'Buscar comentários',
    fetching: 'Buscando…',
    connecting: 'Conectando…',
    cancel: 'Cancelar',
    manualToken: 'Usar um token manualmente (avançado)',
    whyToken: 'Por que precisa de token? Como conseguir um?',
    tokenLabel: 'Token de acesso da Meta',
    tokenPlaceholder: 'IGAA… ou EAA…',
    show: 'Mostrar',
    hide: 'Ocultar',
    tokenNote: 'O token fica só nesta aba e é enviado apenas para a API da Meta.',
    help: (
      <>
        <p>
          O Instagram não libera comentários só pelo link: sem login, a página bloqueia o acesso e o navegador impede
          leituras de outro site. O caminho oficial é a API da Meta, que funciona para publicações da{' '}
          <strong>sua própria conta Profissional</strong> (Comercial ou Criador de conteúdo).
        </p>
        <ol>
          <li>No app do Instagram, deixe a conta como Profissional (Configurações → Tipo de conta).</li>
          <li>
            Em{' '}
            <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer">
              developers.facebook.com/apps
            </a>
            , crie um app e adicione o produto <strong>Instagram</strong> → <em>API com login do Instagram</em>.
          </li>
          <li>
            Em <em>Gerar tokens de acesso</em>, adicione sua conta do Instagram e gere o token (começa com <code>IG</code>).
            Permissões: <code>instagram_business_basic</code> e <code>instagram_business_manage_comments</code>.
          </li>
          <li>Cole o link do post e o token aqui.</li>
        </ol>
        <p className="muted">
          Também aceita token do Facebook (começa com <code>EAA</code>, ex.: pelo Graph API Explorer) com{' '}
          <code>instagram_basic</code>, <code>instagram_manage_comments</code>, <code>pages_show_list</code> e{' '}
          <code>pages_read_engagement</code>, para contas ligadas a uma Página. Se a busca pelo link não achar o post,
          cole o ID numérico da mídia no lugar do link.
        </p>
      </>
    ) as ReactNode,
    importLabel: 'Cole os comentários ou envie um arquivo (.json, .csv, .txt)',
    importPlaceholder: 'usuario: texto do comentário\nana.souza: Quero! @carla @bia\nbruno_r: Participando @joao @lucas',
    importFormats: (
      <>
        Formatos aceitos: JSON (lista com <code>username</code>, <code>text</code>, <code>timestamp</code>), CSV com
        cabeçalho (ex.: <code>Usuário;Comentário;Data</code>) ou uma linha por comentário no formato{' '}
        <code>usuario: comentário</code>. Serve para exportações de ferramentas de terceiros.
      </>
    ) as ReactNode,
    load: 'Carregar',
    chooseFile: 'Escolher arquivo',
    sample: 'Usar dados de exemplo',
    sampleLabel: 'Dados de exemplo',
    pastedLabel: 'Texto colado',
    noneRecognized: 'Nenhum comentário reconhecido. Confira o formato.',
    cannotRead: (detail: string) => `Não foi possível ler: ${detail}`,
    loaded: (count: number) => `${count} comentários carregados`,
    profile: 'perfil',
    rulesReset: 'Novo post ou perfil: os critérios voltaram ao padrão para este sorteio.',
    missingUsernames: (missing: number, total: number, fields: string) =>
      `A API do Instagram não informou o @ de ${missing} de ${total} comentários. Campos recebidos: ${fields || 'nenhum'}.`,
    fewerThanExpected: (expected: number, got: number) =>
      `O Instagram informa ~${expected} comentários, mas a API entregou ${got}. Comentários ocultos, apagados ou de contas restritas não são retornados.`,
    login_: {
      finishing: 'Concluindo login com o Instagram…',
      cancelled: 'Login cancelado.',
      notCompleted: 'Login não concluído.',
      badState: 'Não foi possível confirmar o login. Tente entrar de novo.',
      serverUnreachable: 'Não foi possível falar com o servidor de login.',
      failed: 'Não foi possível concluir o login.',
      expired: 'Sua sessão do Instagram expirou. Entre de novo.',
    } satisfies Record<LoginCode, string>,
  },

  rules: {
    title: 'Critérios',
    subtitle: 'A lista de participantes atualiza na hora.',
    presetExact2: 'Marcar exatamente 2 pessoas',
    presetMax2: 'Até 2 comentários por pessoa',
    presetNoRepeat: 'Sem repetir amigos',
    presetClear: 'Limpar critérios',
    perComment: 'Em cada comentário',
    minMentions: 'Mínimo de marcações (@)',
    maxMentions: 'Máximo de marcações (@)',
    noLimit: 'sem limite',
    ignoreSelf: 'Marcar a si mesmo não conta',
    noRepeat: 'Não pode repetir a mesma pessoa em comentários diferentes',
    ignoredMentions: 'Marcações que não contam',
    requiredText: 'Texto ou hashtag obrigatório',
    requiredTextPlaceholder: 'ex.: #euquero',
    perPerson: 'Por pessoa',
    minComments: 'Mínimo de comentários válidos',
    maxComments: 'Máximo de comentários',
    overLimit: 'Quem comentar mais que o máximo',
    overDisqualify: 'É desclassificado',
    overFirstN: (max: number) => `Valem só os primeiros ${max}`,
    entries: 'Chances no sorteio',
    perUser: 'Uma chance por pessoa',
    perValidComment: 'Uma chance por comentário válido',
    general: 'Geral',
    deadline: 'Prazo final dos comentários',
    includeReplies: 'Respostas a outros comentários também contam',
    excluded: 'Perfis que não participam',
    excludedPlaceholder: '@perfil_do_sorteio, @funcionario',
    ignoredPlaceholder: '@perfil_do_sorteio',
  },

  participants: {
    title: 'Participantes',
    subtitle: 'Clique em um perfil para ver os comentários e o motivo de cada um.',
    comments: 'comentários',
    profiles: 'perfis',
    qualified: 'aptos',
    disqualified: 'desclassificados',
    entries: 'chances',
    all: 'Todos',
    qualifiedTab: 'Aptos',
    disqualifiedTab: 'Desclassificados',
    search: 'Buscar perfil ou texto',
    none: 'Nenhum perfil nesta lista.',
    showMore: (rest: number) => `Mostrar mais (${rest} restantes)`,
    validCount: (valid: number, total: number) => `${valid}/${total} ${total === 1 ? 'válido' : 'válidos'}`,
    entriesCount: (count: number) => `${count} chances`,
    valid: 'válido',
    invalid: 'inválido',
    reply: 'resposta',
    noText: '(sem texto)',
  },

  draw: {
    title: 'Sorteio',
    none: 'Nenhum participante apto ainda.',
    summary: (profiles: number, entries: number) => `${n(profiles, 'perfil apto', 'perfis aptos')} · ${entries} chances`,
    winners: 'Ganhadores',
    alternates: 'Suplentes',
    countdown: 'Contagem',
    seconds: (count: number) => `${count} segundos`,
    drawing: 'Sorteando…',
    again: 'Sortear de novo',
    start: 'Sortear',
    tooMany: (requested: number, available: number) =>
      `Pediu ${n(requested, 'nome', 'nomes')}, mas só há ${n(available, 'perfil apto', 'perfis aptos')}.`,
    changed: 'Os critérios ou os comentários mudaram depois deste sorteio.',
    nthWinner: (i: number) => `${i}º ganhador`,
    winner: 'Ganhador(a)',
    footer: (at: string, qualified: number, entries: number) =>
      `Sorteado em ${at} entre ${qualified} perfis aptos (${entries} chances), com gerador aleatório criptográfico do navegador.`,
    copy: 'Copiar resultado',
    copied: 'Copiado!',
    resultText: {
      heading: (at: string) => `Sorteio realizado em ${at}`,
      qualified: (count: number, entries: number) => `Participantes aptos: ${count} (${entries} chances)`,
      rules: 'Critérios:',
      winners: 'Ganhadores:',
      winner: 'Ganhador(a):',
      alternates: 'Suplentes:',
      ordinal: (i: number) => `${i}º`,
    },
  },

  stage: {
    label: 'Sorteio',
    participating: 'Participando do sorteio',
    summary: (profiles: number, comments: number) =>
      `${n(profiles, 'perfil', 'perfis')} · ${n(comments, 'comentário válido', 'comentários válidos')}`,
    countdown: 'O resultado sai em',
    winners: 'Ganhadores',
    winner: 'Ganhador(a)',
    alternates: 'Suplentes',
    ordinal: (i: number) => `${i}º`,
    close: 'Fechar',
    skip: 'Pular animação',
  },
}

export type Messages = typeof pt

const en: Messages = {
  lang: 'en',
  locale: LOCALES.en,
  rule: ruleText.en,
  parse: parseText.en,
  api: apiText.en,

  app: {
    title: 'Comment giveaway',
    subtitle: 'Load the comments of an Instagram post, set the rules and pick the winners.',
    privacy: 'Privacy Policy',
    privacyHref: './privacy.html',
    language: 'Language',
  },

  source: {
    title: 'Comments',
    subtitle: 'Where the post comments come from.',
    tabApi: 'Fetch from Instagram',
    tabImport: 'Import file / text',
    connectedAs: 'Connected as',
    yourAccount: 'your account',
    logout: 'Log out',
    login: 'Log in with Instagram',
    loginHint:
      'You authorize on Instagram and come back here. It must be a professional account (Business or Creator), and only its own posts can be fetched.',
    link: 'Post link',
    fetch: 'Fetch comments',
    fetching: 'Fetching…',
    connecting: 'Connecting…',
    cancel: 'Cancel',
    manualToken: 'Use an access token manually (advanced)',
    whyToken: 'Why is a token needed? How do I get one?',
    tokenLabel: 'Meta access token',
    tokenPlaceholder: 'IGAA… or EAA…',
    show: 'Show',
    hide: 'Hide',
    tokenNote: 'The token stays in this tab only and is sent only to the Meta API.',
    help: (
      <>
        <p>
          Instagram does not expose comments from a link alone: without login the page blocks access and the browser
          prevents reading other sites. The official way is the Meta API, which works for posts of{' '}
          <strong>your own professional account</strong> (Business or Creator).
        </p>
        <ol>
          <li>In the Instagram app, switch the account to Professional (Settings → Account type).</li>
          <li>
            At{' '}
            <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer">
              developers.facebook.com/apps
            </a>
            , create an app and add the <strong>Instagram</strong> product → <em>API setup with Instagram login</em>.
          </li>
          <li>
            Under <em>Generate access tokens</em>, add your Instagram account and generate a token (starts with{' '}
            <code>IG</code>). Permissions: <code>instagram_business_basic</code> and{' '}
            <code>instagram_business_manage_comments</code>.
          </li>
          <li>Paste the post link and the token here.</li>
        </ol>
        <p className="muted">
          Facebook tokens (starting with <code>EAA</code>, e.g. from the Graph API Explorer) with{' '}
          <code>instagram_basic</code>, <code>instagram_manage_comments</code>, <code>pages_show_list</code> and{' '}
          <code>pages_read_engagement</code> also work, for accounts linked to a Page. If the link search cannot find the
          post, paste the numeric media ID instead of the link.
        </p>
      </>
    ),
    importLabel: 'Paste the comments or upload a file (.json, .csv, .txt)',
    importPlaceholder: 'username: comment text\nana.souza: I want it! @carla @bia\nbruno_r: Joining @joao @lucas',
    importFormats: (
      <>
        Accepted formats: JSON (list with <code>username</code>, <code>text</code>, <code>timestamp</code>), CSV with a
        header (e.g. <code>Username;Comment;Date</code>) or one comment per line as <code>username: comment</code>.
        Useful for exports from third-party tools.
      </>
    ),
    load: 'Load',
    chooseFile: 'Choose file',
    sample: 'Use sample data',
    sampleLabel: 'Sample data',
    pastedLabel: 'Pasted text',
    noneRecognized: 'No comments recognized. Check the format.',
    cannotRead: (detail: string) => `Could not read it: ${detail}`,
    loaded: (count: number) => `${count} comments loaded`,
    profile: 'profile',
    rulesReset: 'New post or profile: the rules were reset to the defaults for this giveaway.',
    missingUsernames: (missing: number, total: number, fields: string) =>
      `The Instagram API did not return the username for ${missing} of ${total} comments. Fields received: ${fields || 'none'}.`,
    fewerThanExpected: (expected: number, got: number) =>
      `Instagram reports ~${expected} comments, but the API returned ${got}. Hidden, deleted or restricted-account comments are not returned.`,
    login_: {
      finishing: 'Finishing Instagram login…',
      cancelled: 'Login cancelled.',
      notCompleted: 'Login not completed.',
      badState: 'Could not confirm the login. Please try again.',
      serverUnreachable: 'Could not reach the login server.',
      failed: 'Could not complete the login.',
      expired: 'Your Instagram session expired. Please log in again.',
    },
  },

  rules: {
    title: 'Rules',
    subtitle: 'The participant list updates instantly.',
    presetExact2: 'Tag exactly 2 people',
    presetMax2: 'Up to 2 comments per person',
    presetNoRepeat: 'No repeated friends',
    presetClear: 'Clear rules',
    perComment: 'In each comment',
    minMentions: 'Minimum tags (@)',
    maxMentions: 'Maximum tags (@)',
    noLimit: 'no limit',
    ignoreSelf: 'Tagging yourself does not count',
    noRepeat: 'The same person cannot be tagged in different comments',
    ignoredMentions: 'Tags that do not count',
    requiredText: 'Required text or hashtag',
    requiredTextPlaceholder: 'e.g. #iwantit',
    perPerson: 'Per person',
    minComments: 'Minimum valid comments',
    maxComments: 'Maximum comments',
    overLimit: 'Whoever comments more than the maximum',
    overDisqualify: 'Is disqualified',
    overFirstN: (max: number) => `Only the first ${max} count`,
    entries: 'Entries in the draw',
    perUser: 'One entry per person',
    perValidComment: 'One entry per valid comment',
    general: 'General',
    deadline: 'Comment deadline',
    includeReplies: 'Replies to other comments also count',
    excluded: 'Profiles that cannot take part',
    excludedPlaceholder: '@giveaway_profile, @employee',
    ignoredPlaceholder: '@giveaway_profile',
  },

  participants: {
    title: 'Participants',
    subtitle: 'Click a profile to see its comments and the reason for each one.',
    comments: 'comments',
    profiles: 'profiles',
    qualified: 'qualified',
    disqualified: 'disqualified',
    entries: 'entries',
    all: 'All',
    qualifiedTab: 'Qualified',
    disqualifiedTab: 'Disqualified',
    search: 'Search profile or text',
    none: 'No profiles in this list.',
    showMore: (rest: number) => `Show more (${rest} left)`,
    validCount: (valid: number, total: number) => `${valid}/${total} valid`,
    entriesCount: (count: number) => `${count} entries`,
    valid: 'valid',
    invalid: 'invalid',
    reply: 'reply',
    noText: '(no text)',
  },

  draw: {
    title: 'Draw',
    none: 'No qualified participants yet.',
    summary: (profiles: number, entries: number) => `${n(profiles, 'qualified profile', 'qualified profiles')} · ${entries} entries`,
    winners: 'Winners',
    alternates: 'Alternates',
    countdown: 'Countdown',
    seconds: (count: number) => `${count} seconds`,
    drawing: 'Drawing…',
    again: 'Draw again',
    start: 'Draw',
    tooMany: (requested: number, available: number) =>
      `You asked for ${n(requested, 'name', 'names')}, but there ${available === 1 ? 'is only 1 qualified profile' : `are only ${available} qualified profiles`}.`,
    changed: 'The rules or the comments changed after this draw.',
    nthWinner: (i: number) => `Winner #${i}`,
    winner: 'Winner',
    footer: (at: string, qualified: number, entries: number) =>
      `Drawn on ${at} among ${qualified} qualified profiles (${entries} entries), using the browser's cryptographic random generator.`,
    copy: 'Copy result',
    copied: 'Copied!',
    resultText: {
      heading: (at: string) => `Giveaway drawn on ${at}`,
      qualified: (count: number, entries: number) => `Qualified participants: ${count} (${entries} entries)`,
      rules: 'Rules:',
      winners: 'Winners:',
      winner: 'Winner:',
      alternates: 'Alternates:',
      ordinal: (i: number) => `#${i}`,
    },
  },

  stage: {
    label: 'Giveaway draw',
    participating: 'In the draw',
    summary: (profiles: number, comments: number) =>
      `${n(profiles, 'profile', 'profiles')} · ${n(comments, 'valid comment', 'valid comments')}`,
    countdown: 'Result in',
    winners: 'Winners',
    winner: 'Winner',
    alternates: 'Alternates',
    ordinal: (i: number) => `#${i}`,
    close: 'Close',
    skip: 'Skip animation',
  },
}

export const messages: Record<Lang, Messages> = { pt, en }
