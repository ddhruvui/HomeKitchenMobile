import { formatQty, qtyUnit } from '../src/lib/format';
import { addDays, byExpiryThenName, expiryLabel, relativeWeek, shortDate, toDateStr, toLocalDate } from '../src/lib/dates';
import { nightLabel } from '../app/(tabs)/cook';
describe('display helpers (mirror of the backend formatter)', () => {
  it('fractions', () => { expect(formatQty(0.5)).toBe('½'); expect(formatQty(2.25)).toBe('2¼'); expect(formatQty(0.7)).toBe('0.7'); expect(qtyUnit(16, 'each')).toBe('16 each'); });
  it('expiry sorts to the top, soonest first, and reads in words', () => {
    expect([{ name: 'Salt' }, { name: 'Masala', expiresOn: '2026-12-01' }, { name: 'Turmeric', expiresOn: '2026-09-15' }].sort(byExpiryThenName).map((r) => r.name)).toEqual(['Turmeric', 'Masala', 'Salt']);
    expect(expiryLabel('2026-09-01', '2026-09-03')).toBe('expired 2 days ago'); expect(expiryLabel('2026-09-15', '2026-09-03')).toBe('expires in 12 days');
  });
  it('a picked Date round-trips to a local YYYY-MM-DD without timezone drift', () => { expect(toDateStr(toLocalDate('2026-09-15'))).toBe('2026-09-15'); expect(toDateStr(new Date(2026, 11, 31, 23, 30))).toBe('2026-12-31'); });
  it('dates', () => { expect(addDays('2026-09-26', 6)).toBe('2026-10-02'); expect(shortDate('2026-09-05')).toBe('Sat 5 Sep'); expect(relativeWeek('2026-09-12', '2026-09-05')).toBe('Next week'); });
  // A lunch that skipped a fast day was cooked two nights back, and has to say so rather than "last night" (§4).
  it('names the evening a pot was cooked', () => { expect(nightLabel('2026-09-07', '2026-09-08')).toBe('last night'); expect(nightLabel('2026-09-07', '2026-09-09')).toBe('Monday night'); });
});
