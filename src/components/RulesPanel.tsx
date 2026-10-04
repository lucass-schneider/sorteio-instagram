import { useState, type ReactNode } from 'react'
import { DEFAULT_RULES } from '../lib/rules'
import type { Rules } from '../lib/types'

interface Props {
  rules: Rules
  onChange: (rules: Rules) => void
  owner?: string
}

function NumberField({
  label,
  value,
  onChange,
  min = 0,
  optional = false,
}: {
  label: string
  value: number | null
  onChange: (value: number | null) => void
  min?: number
  optional?: boolean
}) {
  // Rascunho enquanto o campo está em edição, para permitir apagar e redigitar.
  const [draft, setDraft] = useState<string | null>(null)

  return (
    <label className="field">
      <span>{label}</span>
      <input
        type="number"
        min={min}
        step={1}
        inputMode="numeric"
        placeholder={optional ? 'sem limite' : undefined}
        value={draft ?? (value === null ? '' : String(value))}
        onChange={(e) => {
          const raw = e.target.value
          setDraft(raw)
          if (raw === '') {
            if (optional) onChange(null)
          } else if (Number(raw) >= min) {
            onChange(Math.floor(Number(raw)))
          }
        }}
        onBlur={() => setDraft(null)}
      />
    </label>
  )
}

function Toggle({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="switch" aria-hidden="true" />
      <span>{children}</span>
    </label>
  )
}

export function RulesPanel({ rules, onChange, owner }: Props) {
  const set = <K extends keyof Rules>(key: K, value: Rules[K]) => onChange({ ...rules, [key]: value })

  return (
    <section className="card">
      <header className="card-header">
        <span className="step">2</span>
        <div>
          <h2>Critérios</h2>
          <p className="muted">A lista de participantes atualiza na hora.</p>
        </div>
      </header>

      <div className="presets">
        <button className="chip" onClick={() => onChange({ ...rules, minMentions: 2, maxMentions: 2 })}>
          Marcar exatamente 2 pessoas
        </button>
        <button className="chip" onClick={() => onChange({ ...rules, maxComments: 2, overLimit: 'disqualify' })}>
          Até 2 comentários por pessoa
        </button>
        <button className="chip" onClick={() => onChange({ ...rules, uniqueMentionsAcrossComments: true })}>
          Sem repetir amigos
        </button>
        <button className="chip subtle" onClick={() => onChange(DEFAULT_RULES)}>
          Limpar critérios
        </button>
      </div>

      <fieldset>
        <legend>Em cada comentário</legend>
        <div className="row">
          <NumberField label="Mínimo de marcações (@)" value={rules.minMentions} onChange={(v) => set('minMentions', v ?? 0)} />
          <NumberField label="Máximo de marcações (@)" value={rules.maxMentions} onChange={(v) => set('maxMentions', v)} optional />
        </div>
        <Toggle checked={rules.ignoreSelfMention} onChange={(v) => set('ignoreSelfMention', v)}>
          Marcar a si mesmo não conta
        </Toggle>
        <Toggle checked={rules.uniqueMentionsAcrossComments} onChange={(v) => set('uniqueMentionsAcrossComments', v)}>
          Não pode repetir a mesma pessoa em comentários diferentes
        </Toggle>
        <label className="field">
          <span>Marcações que não contam</span>
          <input
            type="text"
            placeholder={owner ? `@${owner}` : '@perfil_do_sorteio'}
            value={rules.ignoredMentions}
            onChange={(e) => set('ignoredMentions', e.target.value)}
          />
        </label>
        <label className="field">
          <span>Texto ou hashtag obrigatório</span>
          <input
            type="text"
            placeholder="ex.: #euquero"
            value={rules.requiredText}
            onChange={(e) => set('requiredText', e.target.value)}
          />
        </label>
      </fieldset>

      <fieldset>
        <legend>Por pessoa</legend>
        <div className="row">
          <NumberField label="Mínimo de comentários válidos" value={rules.minComments} min={1} onChange={(v) => set('minComments', v ?? 1)} />
          <NumberField label="Máximo de comentários" value={rules.maxComments} min={1} onChange={(v) => set('maxComments', v)} optional />
        </div>
        {rules.maxComments !== null && (
          <label className="field">
            <span>Quem comentar mais que o máximo</span>
            <select value={rules.overLimit} onChange={(e) => set('overLimit', e.target.value as Rules['overLimit'])}>
              <option value="disqualify">É desclassificado</option>
              <option value="firstN">Valem só os primeiros {rules.maxComments}</option>
            </select>
          </label>
        )}
        <label className="field">
          <span>Chances no sorteio</span>
          <select value={rules.ticketMode} onChange={(e) => set('ticketMode', e.target.value as Rules['ticketMode'])}>
            <option value="perUser">Uma chance por pessoa</option>
            <option value="perComment">Uma chance por comentário válido</option>
          </select>
        </label>
      </fieldset>

      <fieldset>
        <legend>Geral</legend>
        <label className="field">
          <span>Prazo final dos comentários</span>
          <input type="datetime-local" value={rules.deadline} onChange={(e) => set('deadline', e.target.value)} />
        </label>
        <Toggle checked={rules.includeReplies} onChange={(v) => set('includeReplies', v)}>
          Respostas a outros comentários também contam
        </Toggle>
        <label className="field">
          <span>Perfis que não participam</span>
          <textarea
            rows={2}
            placeholder={owner ? `@${owner}, @funcionario` : '@perfil_do_sorteio, @funcionario'}
            value={rules.excludedUsers}
            onChange={(e) => set('excludedUsers', e.target.value)}
          />
        </label>
      </fieldset>
    </section>
  )
}
