import { useEffect, useState } from "react"

const WEEKS = 26 // 6 months of data
const DAYS = 7 // Mon to Sun

// Color scale based on study minutes
function getColor(minutes) {
  if (!minutes || minutes === 0) return "#0D1117" // empty — dark
  if (minutes < 30) return "#1e1b4b" // very light indigo
  if (minutes < 60) return "#3730a3" // light indigo
  if (minutes < 120) return "#4f46e5" // medium indigo
  if (minutes < 180) return "#6366f1" // indigo
  return "#818cf8" // bright indigo // 3h+ max intensity
}

function getTooltip(minutes, date) {
  if (!minutes || minutes === 0) return `No study on ${date}`
  if (minutes < 60) return `${minutes}m studied on ${date}`
  const hrs = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins > 0 ? `${hrs}h ${mins}m studied on ${date}` : `${hrs}h studied on ${date}`
}

export default function StudyHeatmap({ studentId }) {
  const [heatmapData, setHeatmapData] = useState({})
  const [tooltip, setTooltip] = useState(null)
  const [hoveredCell, setHoveredCell] = useState(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/memory/heatmap/${studentId}`)
        if (!res.ok) throw new Error("Failed to load heatmap")
        const data = await res.json()
        setHeatmapData(data.heatmap || {})
      } catch {
        setHeatmapData({})
      }
    }
    if (studentId) fetchData()
  }, [studentId])

  // Build grid — last 26 weeks
  function buildGrid() {
    const grid = []
    const today = new Date()

    // Go back to start of current week
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - WEEKS * 7 + 1)

    for (let w = 0; w < WEEKS; w += 1) {
      const week = []
      for (let d = 0; d < DAYS; d += 1) {
        const date = new Date(startDate)
        date.setDate(startDate.getDate() + w * 7 + d)

        const dateStr = date.toISOString().split("T")[0]
        const minutes = heatmapData[dateStr] || 0
        const isToday = dateStr === today.toISOString().split("T")[0]
        const isFuture = date > today

        week.push({
          date: dateStr,
          minutes,
          isToday,
          isFuture,
          label: date.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          }),
        })
      }
      grid.push(week)
    }
    return grid
  }

  // Get month labels for top of grid
  function getMonthLabels() {
    const labels = []
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - WEEKS * 7 + 1)

    let lastMonth = -1
    for (let w = 0; w < WEEKS; w += 1) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + w * 7)
      const month = date.getMonth()

      if (month !== lastMonth) {
        labels.push({
          week: w,
          label: date.toLocaleDateString("en-IN", { month: "short" }),
        })
        lastMonth = month
      } else {
        labels.push({ week: w, label: "" })
      }
    }
    return labels
  }

  const grid = buildGrid()
  const monthLabels = getMonthLabels()
  const dayLabels = ["Mon", "", "Wed", "", "Fri", "", "Sun"]

  // Calculate total stats
  const totalMinutes = Object.values(heatmapData).reduce((a, b) => a + b, 0)
  const activeDays = Object.values(heatmapData).filter((m) => m > 0).length

  // Calculate current streak
  function getStreak() {
    let streak = 0
    const today = new Date()
    for (let i = 0; i < 365; i += 1) {
      const d = new Date(today)
      d.setDate(today.getDate() - i)
      const key = d.toISOString().split("T")[0]
      if (heatmapData[key] > 0) {
        streak += 1
      } else if (i > 0) {
        break
      }
    }
    return streak
  }

  const streak = getStreak()

  return (
    <div
      style={{
        background: "#0D1117",
        border: "1px solid #1C2333",
        borderRadius: "16px",
        padding: "24px",
        position: "relative",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "20px",
        }}
      >
        <div>
          <div
            style={{
              fontWeight: 600,
              color: "white",
              fontSize: "15px",
            }}
          >
            Study Activity
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#4B5563",
              marginTop: "2px",
            }}
          >
            {activeDays} active days in the last 6 months
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "12px",
            alignItems: "center",
          }}
        >
          {/* Streak badge */}
          <div
            style={{
              background: streak > 0 ? "rgba(245,158,11,0.1)" : "rgba(75,85,99,0.2)",
              border: `1px solid ${streak > 0 ? "rgba(245,158,11,0.3)" : "rgba(75,85,99,0.3)"}`,
              borderRadius: "999px",
              padding: "4px 12px",
              fontSize: "12px",
              fontWeight: 700,
              color: streak > 0 ? "#F59E0B" : "#4B5563",
            }}
          >
            🔥 {streak}D STREAK
          </div>

          {/* Total hours badge */}
          <div
            style={{
              background: "rgba(99,102,241,0.1)",
              border: "1px solid rgba(99,102,241,0.2)",
              borderRadius: "999px",
              padding: "4px 12px",
              fontSize: "12px",
              fontWeight: 600,
              color: "#6366F1",
            }}
          >
            {Math.floor(totalMinutes / 60)}h total
          </div>
        </div>
      </div>

      {/* Month labels */}
      <div
        style={{
          display: "flex",
          marginLeft: "28px",
          marginBottom: "6px",
          gap: "3px",
        }}
      >
        {monthLabels.map((m, i) => (
          <div
            key={i}
            style={{
              width: "13px",
              fontSize: "10px",
              color: "#4B5563",
              whiteSpace: "nowrap",
              overflow: "visible",
            }}
          >
            {m.label}
          </div>
        ))}
      </div>

      {/* Grid + day labels */}
      <div
        style={{
          display: "flex",
          gap: "6px",
        }}
      >
        {/* Day labels */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "3px",
            paddingTop: "0px",
          }}
        >
          {dayLabels.map((d, i) => (
            <div
              key={i}
              style={{
                height: "13px",
                fontSize: "10px",
                color: "#4B5563",
                width: "22px",
                display: "flex",
                alignItems: "center",
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div
          style={{
            display: "flex",
            gap: "3px",
            overflowX: "auto",
            paddingBottom: "4px",
          }}
        >
          {grid.map((week, wi) => (
            <div
              key={wi}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "3px",
              }}
            >
              {week.map((cell, di) => (
                <div
                  key={di}
                  onMouseEnter={(e) => {
                    if (!cell.isFuture) {
                      setHoveredCell(`${wi}-${di}`)
                      setTooltip({
                        text: getTooltip(cell.minutes, cell.label),
                        x: e.clientX,
                        y: e.clientY,
                      })
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredCell(null)
                    setTooltip(null)
                  }}
                  style={{
                    width: "13px",
                    height: "13px",
                    borderRadius: "3px",
                    background: cell.isFuture ? "transparent" : getColor(cell.minutes),
                    border: cell.isToday ? "1px solid #6366F1" : cell.isFuture ? "none" : "1px solid rgba(255,255,255,0.03)",
                    cursor: cell.isFuture ? "default" : "pointer",
                    transition: "all 0.1s",
                    transform: hoveredCell === `${wi}-${di}` ? "scale(1.4)" : "scale(1)",
                    boxShadow: hoveredCell === `${wi}-${di}` ? "0 0 8px rgba(99,102,241,0.6)" : "none",
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginTop: "16px",
          justifyContent: "flex-end",
        }}
      >
        <span style={{ fontSize: "11px", color: "#4B5563" }}>Less</span>
        {["#0D1117", "#1e1b4b", "#3730a3", "#4f46e5", "#6366f1", "#818cf8"].map((c, i) => (
          <div
            key={i}
            style={{
              width: "13px",
              height: "13px",
              borderRadius: "3px",
              background: c,
              border: "1px solid rgba(255,255,255,0.05)",
            }}
          />
        ))}
        <span style={{ fontSize: "11px", color: "#4B5563" }}>More</span>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x + 12,
            top: tooltip.y - 40,
            background: "#161B27",
            border: "1px solid #1C2333",
            borderRadius: "8px",
            padding: "6px 12px",
            fontSize: "12px",
            color: "white",
            pointerEvents: "none",
            zIndex: 9999,
            whiteSpace: "nowrap",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  )
}
