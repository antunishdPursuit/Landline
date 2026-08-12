import { seedCallLogs, seedRequests, seedStaffRoster } from '@/lib/mock-data'

describe('deterministic dashboard seed data', () => {
  it('keeps the approved request and team totals stable', () => {
    const requests = seedRequests()
    const staff = seedStaffRoster()

    expect(requests).toHaveLength(6)
    expect(requests.filter((request) => request.status === 'new')).toHaveLength(3)
    expect(requests.filter((request) => request.status === 'in_progress')).toHaveLength(2)
    expect(requests.filter((request) => request.status === 'done')).toHaveLength(1)
    expect(requests.filter((request) => request.requires_human)).toHaveLength(1)
    expect(requests.every((request) => request.language_detected === 'en')).toBe(true)

    expect(staff).toHaveLength(10)
    expect(staff.filter((member) => member.active)).toHaveLength(6)
  })

  it('keeps seven English calls with stable outcome totals', () => {
    const calls = seedCallLogs()

    expect(calls).toHaveLength(7)
    expect(calls.filter((call) => call.intent === 'answerable_qa')).toHaveLength(3)
    expect(calls.filter((call) => call.intent === 'physical_request')).toHaveLength(3)
    expect(calls.filter((call) => call.intent === 'defer_to_operator')).toHaveLength(1)
    expect(calls.every((call) => call.language_detected === 'en')).toBe(true)
    expect(new Set(calls.map((call) => call.id)).size).toBe(7)
  })

  it('does not seed unverified property facts', () => {
    const transcript = seedCallLogs()
      .flatMap((call) => call.transcript)
      .map((turn) => turn.text)
      .join(' ')
      .toLowerCase()

    expect(transcript).not.toContain('pool is open')
    expect(transcript).not.toContain('breakfast is included')
    expect(transcript).not.toContain('stayhere2024')
  })
})
