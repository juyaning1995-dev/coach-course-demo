import { describe, it, expect } from 'vitest';
import {
  timeToMin, fmtISO, fmtMD, startOfWeek, dayName, addOneHour,
  fmtUserDate, fmtUserDateTime, userSlotPeriod, normalizeUserCourseName, getDateKey
} from '../../shared/js/utils.js';

describe('timeToMin', () => {
  it('converts 00:00 to 0', () => {
    expect(timeToMin('00:00')).toBe(0);
  });
  it('converts 10:30 to 630', () => {
    expect(timeToMin('10:30')).toBe(630);
  });
  it('converts 22:00 to 1320', () => {
    expect(timeToMin('22:00')).toBe(1320);
  });
  it('handles undefined by returning 0', () => {
    expect(timeToMin()).toBe(0);
  });
  it('handles single digit hour', () => {
    expect(timeToMin('9:05')).toBe(545);
  });
});

describe('fmtISO', () => {
  it('formats a Date to YYYY-MM-DD', () => {
    const d = new Date('2026-05-06T00:00:00');
    expect(fmtISO(d)).toBe('2026-05-06');
  });
  it('pads single digit month and day', () => {
    const d = new Date('2026-01-01T00:00:00');
    expect(fmtISO(d)).toBe('2026-01-01');
  });
});

describe('fmtMD', () => {
  it('formats date to Chinese month-day', () => {
    const d = new Date('2026-05-06T00:00:00');
    expect(fmtMD(d)).toBe('5月6日');
  });
});

describe('startOfWeek', () => {
  it('returns Monday for a given date', () => {
    const result = startOfWeek(new Date('2026-05-06T00:00:00'));
    expect(result.getDay()).toBe(1); // Monday
  });
  it('handles Sunday by going back to Monday', () => {
    const result = startOfWeek(new Date('2026-05-10T00:00:00')); // Sunday
    expect(result.getDay()).toBe(1);
  });
});

describe('dayName', () => {
  it('returns Chinese day name for a date string', () => {
    // 2026-05-04 is a Monday
    expect(dayName('2026-05-04')).toBe('一');
    expect(dayName('2026-05-10')).toBe('日');
  });
  it('returns valid day names for any date', () => {
    const name = dayName(fmtISO(new Date()));
    expect(['日', '一', '二', '三', '四', '五', '六']).toContain(name);
  });
});

describe('addOneHour', () => {
  it('adds one hour to a time', () => {
    expect(addOneHour('10:00')).toBe('11:00');
    expect(addOneHour('14:30')).toBe('15:30');
  });
  it('caps at 22:00', () => {
    expect(addOneHour('22:00')).toBe('22:00');
  });
});

describe('fmtUserDate', () => {
  it('formats date string to padded month-day', () => {
    expect(fmtUserDate('2026-01-05')).toBe('01月05日');
  });
});

describe('fmtUserDateTime', () => {
  it('formats full datetime for user display', () => {
    const result = fmtUserDateTime('2026-05-04', '10:00', '11:00');
    expect(result).toContain('05月04日');
    expect(result).toContain('星期一');
    expect(result).toContain('10:00');
    expect(result).toContain('11:00');
  });
});

describe('userSlotPeriod', () => {
  it('returns 上午 for morning times', () => {
    expect(userSlotPeriod('09:00')).toBe('上午');
    expect(userSlotPeriod('11:59')).toBe('上午');
  });
  it('returns 下午 for afternoon times', () => {
    expect(userSlotPeriod('14:00')).toBe('下午');
    expect(userSlotPeriod('17:59')).toBe('下午');
  });
  it('returns 晚上 for evening times', () => {
    expect(userSlotPeriod('18:00')).toBe('晚上');
    expect(userSlotPeriod('21:30')).toBe('晚上');
  });
});

describe('normalizeUserCourseName', () => {
  it('returns empty for falsy course', () => {
    expect(normalizeUserCourseName(null)).toBe('');
    expect(normalizeUserCourseName(undefined)).toBe('');
  });
  it('appends 小班课 for 一对多 courses without existing suffix', () => {
    expect(normalizeUserCourseName({ name: '减脂塑形', type: '一对多' })).toBe('减脂塑形小班课');
  });
  it('does not double-add 小班 suffix', () => {
    expect(normalizeUserCourseName({ name: '减脂塑形小班', type: '一对多' })).toBe('减脂塑形小班');
  });
  it('returns original name for 一对一 courses', () => {
    expect(normalizeUserCourseName({ name: '私教体验课', type: '一对一' })).toBe('私教体验课');
  });
});

describe('getDateKey', () => {
  it('returns string input as-is', () => {
    expect(getDateKey('2026-05-06')).toBe('2026-05-06');
  });
  it('formats Date input', () => {
    expect(getDateKey(new Date('2026-05-06T00:00:00'))).toBe('2026-05-06');
  });
});
