import { useState, type ReactNode } from 'react'
import { useI18n } from '../i18n/context'
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
  placeholder,
}: {
  label: string
  value: number | null
  onChange: (value: number | null) => void
  min?: number
  /** Quando informado, o campo aceita ficar vazio (= sem limite). */
  placeholder?: string
}) {
  const optional = placeholder !== undefined
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
        placeholder={placeholder}
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
  const { t } = useI18n()
  const r = t.rules
  const set = <K extends keyof Rules>(key: K, value: Rules[K]) => onChange({ ...rules, [key]: value })

  return (
    <section className="card">
      <header className="card-header">
        <span className="step">2</span>
        <div>
          <h2>{r.title}</h2>
          <p className="muted">{r.subtitle}</p>
        </div>
      </header>

      <div className="presets">
        <button className="chip" onClick={() => onChange({ ...rules, minMentions: 2, maxMentions: 2 })}>
          {r.presetExact2}
        </button>
        <button className="chip" onClick={() => onChange({ ...rules, maxComments: 2, overLimit: 'disqualify' })}>
          {r.presetMax2}
        </button>
        <button className="chip" onClick={() => onChange({ ...rules, uniqueMentionsAcrossComments: true })}>
          {r.presetNoRepeat}
        </button>
        <button className="chip subtle" onClick={() => onChange(DEFAULT_RULES)}>
          {r.presetClear}
        </button>
      </div>

      <fieldset>
        <legend>{r.perComment}</legend>
        <div className="row">
          <NumberField label={r.minMentions} value={rules.minMentions} onChange={(v) => set('minMentions', v ?? 0)} />
          <NumberField label={r.maxMentions} value={rules.maxMentions} onChange={(v) => set('maxMentions', v)} placeholder={r.noLimit} />
        </div>
        <Toggle checked={rules.ignoreSelfMention} onChange={(v) => set('ignoreSelfMention', v)}>
          {r.ignoreSelf}
        </Toggle>
        <Toggle checked={rules.uniqueMentionsAcrossComments} onChange={(v) => set('uniqueMentionsAcrossComments', v)}>
          {r.noRepeat}
        </Toggle>
        <label className="field">
          <span>{r.ignoredMentions}</span>
          <input
            type="text"
            placeholder={owner ? `@${owner}` : r.ignoredPlaceholder}
            value={rules.ignoredMentions}
            onChange={(e) => set('ignoredMentions', e.target.value)}
          />
        </label>
        <label className="field">
          <span>{r.requiredText}</span>
          <input
            type="text"
            placeholder={r.requiredTextPlaceholder}
            value={rules.requiredText}
            onChange={(e) => set('requiredText', e.target.value)}
          />
        </label>
      </fieldset>

      <fieldset>
        <legend>{r.perPerson}</legend>
        <div className="row">
          <NumberField label={r.minComments} value={rules.minComments} min={1} onChange={(v) => set('minComments', v ?? 1)} />
          <NumberField label={r.maxComments} value={rules.maxComments} min={1} onChange={(v) => set('maxComments', v)} placeholder={r.noLimit} />
        </div>
        {rules.maxComments !== null && (
          <label className="field">
            <span>{r.overLimit}</span>
            <select value={rules.overLimit} onChange={(e) => set('overLimit', e.target.value as Rules['overLimit'])}>
              <option value="disqualify">{r.overDisqualify}</option>
              <option value="firstN">{r.overFirstN(rules.maxComments)}</option>
            </select>
          </label>
        )}
        <label className="field">
          <span>{r.entries}</span>
          <select value={rules.ticketMode} onChange={(e) => set('ticketMode', e.target.value as Rules['ticketMode'])}>
            <option value="perUser">{r.perUser}</option>
            <option value="perComment">{r.perValidComment}</option>
          </select>
        </label>
      </fieldset>

      <fieldset>
        <legend>{r.general}</legend>
        <label className="field">
          <span>{r.deadline}</span>
          <input type="datetime-local" value={rules.deadline} onChange={(e) => set('deadline', e.target.value)} />
        </label>
        <Toggle checked={rules.includeReplies} onChange={(v) => set('includeReplies', v)}>
          {r.includeReplies}
        </Toggle>
        <label className="field">
          <span>{r.excluded}</span>
          <textarea
            rows={2}
            placeholder={owner ? `@${owner}, @…` : r.excludedPlaceholder}
            value={rules.excludedUsers}
            onChange={(e) => set('excludedUsers', e.target.value)}
          />
        </label>
      </fieldset>
    </section>
  )
}
