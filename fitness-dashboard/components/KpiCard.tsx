interface Props {
  label: string
  value: string
  sub?: string
  valueClass?: string
}

export default function KpiCard({ label, value, sub, valueClass }: Props) {
  return (
    <div className="kpi">
      <div className="kpi-label">{label}</div>
      <div className={`kpi-val${valueClass ? ' ' + valueClass : ''}`}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  )
}
