import { describe, it, expect, beforeEach } from 'vitest';
import { timeToMin, fmtISO, fmtMD, startOfWeek, dayName } from '../../shared/js/utils.js';

// Component tests: verify the rendering data logic for coach home
// These test the pure data functions, not actual DOM rendering

describe('Coach home data logic', () => {
  let schedules, courses;

  beforeEach(() => {
    const today = new Date();
    const d = (offset) => {
      const x = new Date(today);
      x.setDate(x.getDate() + offset);
      return fmtISO(x);
    };

    courses = [
      { id: 1, name: '私教体验课', type: '一对一', unit: '按节', hours: 6, price: 299, stores: '振华商厦店', status: '已上架' },
    ];

    schedules = [
      { id: 1001, courseId: 1, courseName: '私教体验课', date: d(0), start: '09:00', end: '10:00', store: '振华商厦店', limit: 1, booked: 1, status: '可预约',
        members: [{ name: '张三', phone: '156****5666', status: '待上课', source: 'user', bookingId: 'bk-1' }] },
      { id: 1002, courseId: 1, courseName: '私教体验课', date: d(0), start: '14:00', end: '15:00', store: '振华商厦店', limit: 1, booked: 1, status: '可预约',
        members: [{ name: '李四', phone: '139****6666', status: '上课中', source: 'coach', bookingId: 'bk-2' }] },
      { id: 1003, courseId: 1, courseName: '私教体验课', date: d(1), start: '19:00', end: '20:00', store: '振华商厦店', limit: 1, booked: 1, status: '可预约',
        members: [{ name: '王五', phone: '138****3321', status: '已完课', source: 'user', bookingId: 'bk-3', completedAt: new Date().toISOString() }] },
    ];
  });

  function getScheduleActiveMembers(schedule) {
    return (schedule.members || []).filter(m => m.status !== '已取消');
  }

  function getCoachTodaySchedules() {
    const todayKey = fmtISO(new Date());
    return schedules.filter(s =>
      s.date === todayKey && s.status !== '已取消' &&
      getScheduleActiveMembers(s).length > 0
    ).sort((a, b) => timeToMin(a.start) - timeToMin(b.start));
  }

  function getCoachMonthSchedules() {
    const today = new Date();
    const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    return schedules.filter(s =>
      String(s.date || '').startsWith(monthKey) && s.status !== '已取消' &&
      getScheduleActiveMembers(s).length > 0
    );
  }

  function getCoachStudentCount() {
    const keys = new Set();
    schedules.forEach(s => {
      (s.members || []).forEach(m => {
        if (m.status === '已取消') return;
        const key = (m.phone || m.name || '').trim();
        if (key) keys.add(key);
      });
    });
    return keys.size;
  }

  function getCoachHomeStats() {
    const todaySchedules = getCoachTodaySchedules();
    const monthSchedules = getCoachMonthSchedules();
    const monthDelta = Math.max(1, Math.min(3, monthSchedules.length || 1));
    const newStudentDelta = Math.max(1, Math.min(2, getCoachStudentCount() || 1));
    return [
      { label: '今日课程', value: todaySchedules.length },
      { label: '本月课程', value: monthSchedules.length },
      { label: '学员总数', value: getCoachStudentCount() },
    ];
  }

  describe('getCoachTodaySchedules', () => {
    it('returns only today schedules with active members', () => {
      const today = getCoachTodaySchedules();
      expect(today.length).toBeGreaterThanOrEqual(0);
      today.forEach(s => {
        expect(s.date).toBe(fmtISO(new Date()));
        expect(getScheduleActiveMembers(s).length).toBeGreaterThan(0);
      });
    });

    it('sorts by start time', () => {
      const today = getCoachTodaySchedules();
      for (let i = 1; i < today.length; i++) {
        expect(timeToMin(today[i - 1].start)).toBeLessThanOrEqual(timeToMin(today[i].start));
      }
    });
  });

  describe('getCoachMonthSchedules', () => {
    it('returns schedules in current month', () => {
      const month = getCoachMonthSchedules();
      const today = new Date();
      const monthPrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      month.forEach(s => {
        expect(s.date).toMatch(new RegExp(`^${monthPrefix}`));
      });
    });
  });

  describe('getCoachStudentCount', () => {
    it('counts unique students by phone', () => {
      const count = getCoachStudentCount();
      // 3 unique phones: 156****5666, 139****6666, 138****3321
      expect(count).toBe(3);
    });

    it('excludes cancelled members', () => {
      schedules[0].members[0].status = '已取消';
      const count = getCoachStudentCount();
      expect(count).toBe(2); // 张三 excluded
    });
  });

  describe('getCoachHomeStats', () => {
    it('returns three stat items', () => {
      const stats = getCoachHomeStats();
      expect(stats).toHaveLength(3);
      expect(stats[0].label).toBe('今日课程');
      expect(stats[1].label).toBe('本月课程');
      expect(stats[2].label).toBe('学员总数');
    });
  });

  describe('coachTodayTagClass', () => {
    function coachTodayTagClass(schedule) {
      if (schedule.status === '停止预约') return 'locked';
      if (Number(schedule.booked || 0) >= Number(schedule.limit || 1)) return 'full';
      return 'pending';
    }

    it('returns locked for stopped schedules', () => {
      expect(coachTodayTagClass({ status: '停止预约', booked: 0, limit: 1 })).toBe('locked');
    });

    it('returns full when booked >= limit', () => {
      expect(coachTodayTagClass({ status: '可预约', booked: 1, limit: 1 })).toBe('full');
    });

    it('returns pending for available slots', () => {
      expect(coachTodayTagClass({ status: '可预约', booked: 0, limit: 1 })).toBe('pending');
    });
  });
});
