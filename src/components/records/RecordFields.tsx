import {
  BLOOD_LABELS,
  CONDITION_LABELS,
  MEDICATION_LABELS,
} from '../../domain/record'
import {
  BLOOD_STATUSES,
  CONDITION_STATUSES,
  MEDICATION_STATUSES,
  type HealthRecordDraft,
} from '../../domain/types'

interface RecordFieldsProps {
  draft: HealthRecordDraft
  disabled?: boolean
  onChange: (draft: HealthRecordDraft) => void
}

interface ChoiceGroupProps<T extends string> {
  label: string
  name: string
  options: readonly T[]
  labels: Record<T, string>
  value: T
  disabled: boolean
  onChange: (value: T) => void
}

function ChoiceGroup<T extends string>({
  label,
  name,
  options,
  labels,
  value,
  disabled,
  onChange,
}: ChoiceGroupProps<T>) {
  return (
    <fieldset className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <legend className="px-1 font-semibold">{label}</legend>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {options.map((option) => (
          <label
            className={`flex min-h-11 cursor-pointer items-center justify-center rounded-xl border px-2 text-center text-sm font-medium transition-colors focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue-600 ${
              value === option
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
            }`}
            key={option}
          >
            <input
              checked={value === option}
              className="sr-only"
              disabled={disabled}
              name={name}
              onChange={() => onChange(option)}
              type="radio"
              value={option}
            />
            {labels[option]}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function RecordFields({ draft, disabled = false, onChange }: RecordFieldsProps) {
  return (
    <div className="space-y-4">
      <ChoiceGroup
        disabled={disabled}
        label="体調"
        labels={CONDITION_LABELS}
        name="condition"
        onChange={(condition) => onChange({ ...draft, condition })}
        options={CONDITION_STATUSES}
        value={draft.condition}
      />

      <fieldset className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <legend className="px-1 font-semibold">腹痛レベル</legend>
        <div className="mt-2 grid grid-cols-6 gap-2">
          {[0, 1, 2, 3, 4, 5].map((level) => (
            <label
              className={`grid min-h-11 cursor-pointer place-items-center rounded-full font-semibold focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue-600 ${
                draft.stomachPainLevel === level
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
              }`}
              key={level}
            >
              <input
                checked={draft.stomachPainLevel === level}
                className="sr-only"
                disabled={disabled}
                name="stomachPainLevel"
                onChange={() => onChange({ ...draft, stomachPainLevel: level })}
                type="radio"
                value={level}
              />
              {level}
            </label>
          ))}
        </div>
      </fieldset>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900" aria-labelledby="toilet-count-label">
        <h2 className="font-semibold" id="toilet-count-label">トイレ回数</h2>
        <div className="mt-3 flex items-center justify-center gap-6">
          <button
            aria-label="トイレ回数を1回減らす"
            className="grid size-12 place-items-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-blue-950 dark:text-blue-300"
            disabled={disabled || draft.toiletCount === 0}
            onClick={() => onChange({ ...draft, toiletCount: Math.max(0, draft.toiletCount - 1) })}
            type="button"
          >
            −
          </button>
          <output aria-live="polite" className="min-w-20 text-center text-2xl font-bold">
            {draft.toiletCount}回
          </output>
          <button
            aria-label="トイレ回数を1回増やす"
            className="grid size-12 place-items-center rounded-full bg-blue-600 text-2xl font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            disabled={disabled}
            onClick={() => onChange({ ...draft, toiletCount: draft.toiletCount + 1 })}
            type="button"
          >
            ＋
          </button>
        </div>
      </section>

      <ChoiceGroup
        disabled={disabled}
        label="血便"
        labels={BLOOD_LABELS}
        name="bloodStatus"
        onChange={(bloodStatus) => onChange({ ...draft, bloodStatus })}
        options={BLOOD_STATUSES}
        value={draft.bloodStatus}
      />

      <ChoiceGroup
        disabled={disabled}
        label="服薬チェック"
        labels={MEDICATION_LABELS}
        name="medicationStatus"
        onChange={(medicationStatus) => onChange({ ...draft, medicationStatus })}
        options={MEDICATION_STATUSES}
        value={draft.medicationStatus}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <label className="font-semibold" htmlFor="record-memo">自由メモ</label>
        <textarea
          className="mt-3 min-h-28 w-full resize-y rounded-xl border border-slate-300 bg-slate-50 p-3 text-base focus:border-blue-600 focus:outline-2 focus:outline-blue-600 dark:border-slate-700 dark:bg-slate-800"
          disabled={disabled}
          id="record-memo"
          onChange={(event) => onChange({ ...draft, memo: event.target.value })}
          value={draft.memo}
        />
      </div>
    </div>
  )
}
