const DAY_MS = 86_400_000
const START_DAY = Date.UTC(2026, 7, 19)
const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000

const shanghaiDate = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Shanghai',
  calendar: 'gregory',
  numberingSystem: 'latn',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

// UTC is only used to number calendar days, not to interpret a local midnight.
function calendarDay(now: Date): number {
  const parts = shanghaiDate.formatToParts(now)
  const value = (type: string) => Number(parts.find(part => part.type === type)!.value)
  return Date.UTC(value('year'), value('month') - 1, value('day'))
}

export function calculateLoveDays(now: Date): number {
  return Math.max(0, Math.floor((calendarDay(now) - START_DAY) / DAY_MS) + 1)
}

export function millisecondsUntilShanghaiMidnight(now: Date): number {
  // Asia/Shanghai uses UTC+8 for the dates supported by this anniversary.
  return calendarDay(now) + DAY_MS - SHANGHAI_OFFSET_MS - now.getTime()
}

type WatchEnvironment = {
  now: () => Date
  window: Pick<Window, 'setTimeout' | 'clearTimeout' | 'addEventListener' | 'removeEventListener'>
  document: Pick<Document, 'visibilityState' | 'addEventListener' | 'removeEventListener'>
}

export function watchLoveDays(
  onChange: (days: number) => void,
  environment: WatchEnvironment = { now: () => new Date(), window, document },
): () => void {
  let timer: number | undefined
  let disposed = false
  const { window: target, document: page, now } = environment

  const refresh = () => {
    if (disposed) return
    target.clearTimeout(timer)
    const current = now()
    onChange(calculateLoveDays(current))
    // Recalculate from the current clock each time. The minute cap also handles
    // clock changes; a shorter timeout targets the actual Beijing midnight.
    timer = target.setTimeout(refresh, Math.max(1, Math.min(
      60_000, millisecondsUntilShanghaiMidnight(current),
    )))
  }
  const onVisible = () => {
    if (page.visibilityState === 'visible') refresh()
  }

  target.addEventListener('focus', refresh)
  target.addEventListener('pageshow', refresh)
  page.addEventListener('visibilitychange', onVisible)
  refresh()

  return () => {
    disposed = true
    target.clearTimeout(timer)
    target.removeEventListener('focus', refresh)
    target.removeEventListener('pageshow', refresh)
    page.removeEventListener('visibilitychange', onVisible)
  }
}
