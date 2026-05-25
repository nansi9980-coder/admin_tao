import CalendarHeatmap from 'react-calendar-heatmap'
import 'react-calendar-heatmap/dist/styles.css'

/**
 * 90-day activity heatmap.
 * @param {{ date: string|Date, count: number }[]} values
 */
export default function ActivityHeatmap({ values = [], days = 90 }) {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)

  const data = values.map((v) => ({
    date: typeof v.date === 'string' ? v.date : v.date.toISOString().slice(0, 10),
    count: v.count || 0,
  }))

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
        <h3 style={{ margin: 0, fontFamily: 'Sora', fontSize: 14, fontWeight: 700 }}>
          Activité — {days} derniers jours
        </h3>
      </div>
      <div className="heatmap-wrapper" style={{ overflowX: 'auto' }}>
        <CalendarHeatmap
          startDate={start}
          endDate={end}
          values={data}
          showWeekdayLabels
          weekdayLabels={['', 'L', '', 'M', '', 'V', '']}
          classForValue={(value) => {
            if (!value || !value.count) return 'heatmap-empty'
            if (value.count >= 8) return 'heatmap-l4'
            if (value.count >= 4) return 'heatmap-l3'
            if (value.count >= 2) return 'heatmap-l2'
            return 'heatmap-l1'
          }}
          titleForValue={(value) => (value ? `${value.count} actions le ${value.date}` : 'Aucune activité')}
        />
      </div>
      <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text3)' }}>
        <span>Moins</span>
        <div style={{ display: 'flex', gap: 3 }}>
          <span className="heatmap-empty" style={{ width: 11, height: 11, display: 'block', borderRadius: 2 }} />
          <span className="heatmap-l1" style={{ width: 11, height: 11, display: 'block', borderRadius: 2 }} />
          <span className="heatmap-l2" style={{ width: 11, height: 11, display: 'block', borderRadius: 2 }} />
          <span className="heatmap-l3" style={{ width: 11, height: 11, display: 'block', borderRadius: 2 }} />
          <span className="heatmap-l4" style={{ width: 11, height: 11, display: 'block', borderRadius: 2 }} />
        </div>
        <span>Plus</span>
      </div>
    </div>
  )
}
