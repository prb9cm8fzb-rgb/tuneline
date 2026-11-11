type Props = {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: 'text' | 'number'
  disabled?: boolean
}

export default function AnswerField({ label, value, onChange, placeholder, type = 'text', disabled }: Props) {
  return (
    <label className="answer-field">
      <span>{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        inputMode={type === 'number' ? 'numeric' : 'text'}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}
