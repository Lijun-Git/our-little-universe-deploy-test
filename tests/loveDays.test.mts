import assert from 'node:assert/strict'
import { test } from 'node:test'
import { spawnSync } from 'node:child_process'
import { calculateLoveDays, millisecondsUntilShanghaiMidnight, watchLoveDays } from '../src/utils/loveDays.ts'

test('Beijing calendar dates, anniversary boundary, month/year and leap year', () => {
  for (const [date, expected] of [
    ['2026-08-18T23:59:59.999+08:00', 0],
    ['2026-08-19T00:00:00+08:00', 1],
    ['2026-08-20T00:00:00+08:00', 2],
    ['2026-11-09T12:00:00+08:00', 83],
    ['2026-08-31T23:59:59+08:00', 13],
    ['2026-09-01T00:00:00+08:00', 14],
    ['2026-12-31T23:59:59+08:00', 135],
    ['2027-01-01T00:00:00+08:00', 136],
    ['2028-02-28T12:00:00+08:00', 559],
    ['2028-02-29T12:00:00+08:00', 560],
    ['2028-03-01T00:00:00+08:00', 561],
  ] as const) assert.equal(calculateLoveDays(new Date(date)), expected, date)
  assert.equal(millisecondsUntilShanghaiMidnight(new Date('2026-08-19T23:59:00+08:00')), 60_000)
  assert.equal(millisecondsUntilShanghaiMidnight(new Date('2026-08-19T23:59:59.999+08:00')), 1)
})

test('same instant is independent of device timezone', () => {
  const moduleUrl = new URL('../src/utils/loveDays.ts', import.meta.url).href
  for (const TZ of ['UTC', 'Asia/Shanghai', 'America/Los_Angeles', 'Pacific/Kiritimati']) {
    const result = spawnSync(process.execPath, ['--input-type=module', '-e',
      `import { calculateLoveDays } from ${JSON.stringify(moduleUrl)}; console.log(calculateLoveDays(new Date('2026-08-19T16:00:00Z')))`],
    { env: { ...process.env, TZ }, encoding: 'utf8' })
    assert.equal(result.status, 0, result.stderr)
    assert.equal(result.stdout.trim(), '2', TZ)
  }
})

test('midnight, delayed timers, resume events, cleanup and StrictMode-style remount', () => {
  let current = new Date('2026-08-19T23:59:59+08:00')
  let nextId = 0
  const timers = new Map<number, { callback: () => void; delay: number }>()
  const target = Object.assign(new EventTarget(), {
    setTimeout(callback: () => void, delay: number) {
      const id = ++nextId
      timers.set(id, { callback, delay })
      return id
    },
    clearTimeout(id: number) { timers.delete(id) },
  })
  const page = Object.assign(new EventTarget(), { visibilityState: 'visible' })
  const environment = {
    now: () => current,
    window: target as unknown as Window,
    document: page as unknown as Document,
  }
  const values: number[] = []
  const stop = watchLoveDays(value => values.push(value), environment)
  assert.deepEqual(values, [1])
  assert.equal(timers.size, 1)
  assert.equal([...timers.values()][0].delay, 1000)
  current = new Date('2026-08-20T00:00:00+08:00')
  const queued = [...timers.values()][0].callback
  queued()
  assert.equal(values.at(-1), 2)
  assert.equal(timers.size, 1)

  page.visibilityState = 'hidden'
  current = new Date('2026-08-22T12:00:00+08:00')
  const before = values.length
  page.dispatchEvent(new Event('visibilitychange'))
  assert.equal(values.length, before)
  page.visibilityState = 'visible'
  page.dispatchEvent(new Event('visibilitychange'))
  assert.equal(values.at(-1), 4)
  current = new Date('2026-08-23T12:00:00+08:00')
  target.dispatchEvent(new Event('focus'))
  assert.equal(values.at(-1), 5)
  current = new Date('2026-08-24T12:00:00+08:00')
  target.dispatchEvent(new Event('pageshow'))
  assert.equal(values.at(-1), 6)
  current = new Date('2026-08-26T12:00:00+08:00')
  ;[...timers.values()][0].callback()
  assert.equal(values.at(-1), 8)
  assert.equal(timers.size, 1)

  stop()
  assert.equal(timers.size, 0)
  const count = values.length
  target.dispatchEvent(new Event('focus'))
  target.dispatchEvent(new Event('pageshow'))
  page.dispatchEvent(new Event('visibilitychange'))
  queued()
  assert.equal(values.length, count)

  const stopAgain = watchLoveDays(value => values.push(value), environment)
  const afterMount = values.length
  target.dispatchEvent(new Event('focus'))
  assert.equal(values.length, afterMount + 1)
  assert.equal(timers.size, 1)
  stopAgain()
  assert.equal(timers.size, 0)
})
