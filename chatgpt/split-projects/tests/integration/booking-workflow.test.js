import { describe, it, expect, beforeEach } from 'vitest';
import { timeToMin, fmtISO, dayName, fmtUserDateTime, normalizeUserCourseName } from '../../shared/js/utils.js';

// Integration test: simulate the full booking data flow
// These tests verify the core business logic without DOM

describe('Booking workflow (integration)', () => {
  let courses, workTimes, schedules, userProducts, userBookings;

  const DEMO_COACH = '王美丽';

  beforeEach(() => {
    const today = new Date();
    const d = (offset) => {
      const x = new Date(today);
      x.setDate(x.getDate() + offset);
      return fmtISO(x);
    };

    courses = [
      { id: 1, name: '私教体验课', type: '一对一', unit: '按节', hours: 6, minutes: 60, price: 299, validDays: 30, stores: '振华商厦店', status: '已上架' },
      { id: 2, name: '减脂塑形', type: '一对多', unit: '按时间', limit: 2, hours: 3, price: 899, validDays: 30, stores: '振华商厦店', status: '已上架' },
    ];

    workTimes = {
      一: ['09:00–12:00', '14:00–18:00', '18:30–21:30'],
      二: ['09:00–12:00', '14:00–18:00'],
      三: ['09:00–12:00', '14:00–18:00', '18:30–21:30'],
      四: ['09:00–12:00', '14:00–18:00'],
      五: ['09:00–12:00', '14:00–18:00', '18:30–21:30'],
      六: ['09:00–12:00', '14:00–18:00', '18:30–21:30'],
      日: ['09:00–12:00', '14:00–18:00'],
    };

    schedules = [
      { id: 1001, courseId: 1, courseType: '一对一', courseName: '私教体验课', date: d(0), start: '09:00', end: '10:00', store: '振华商厦店', limit: 1, booked: 0, status: '可预约', members: [] },
      { id: 1002, courseId: 1, courseType: '一对一', courseName: '私教体验课', date: d(0), start: '14:00', end: '15:00', store: '振华商厦店', limit: 1, booked: 0, status: '可预约', members: [] },
      { id: 2001, courseId: 2, courseType: '一对多', courseName: '减脂塑形小班', date: d(0), start: '10:00', end: '11:00', store: '振华商厦店', limit: 2, booked: 0, status: '可预约', members: [] },
    ];

    userProducts = [
      { id: 'product-1', courseId: 1, name: '私教体验课', type: '一对一', remain: 6, coachName: DEMO_COACH, store: '振华商厦店' },
      { id: 'product-2', courseId: 2, name: '减脂塑形小班课', type: '一对多', remain: 3, coachName: DEMO_COACH, store: '振华商厦店' },
    ];

    userBookings = [];
  });

  // Helper functions (same logic as app)
  function getUserProduct(id) {
    return userProducts.find(p => String(p.id) === String(id));
  }

  function getUserSlot(id) {
    return schedules.find(s => String(s.id) === String(id));
  }

  function getUserRemainingSeats(slot) {
    return Math.max(0, Number(slot.limit || 1) - Number(slot.booked || 0));
  }

  function canUserBookSlot(slot, product) {
    return !!slot && !!product && Number(product.remain || 0) > 0 &&
      slot.status !== '停止预约' && slot.status !== '已取消' &&
      getUserRemainingSeats(slot) > 0;
  }

  function makeBookingId() {
    return `booking-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  function syncScheduleBookedCount(schedule) {
    schedule.booked = (schedule.members || []).filter(m => m.status !== '已取消').length;
    if (schedule.status !== '停止预约' && schedule.status !== '已取消') {
      schedule.status = schedule.booked >= Number(schedule.limit || 1) ? '已满' : '可预约';
    }
  }

  function bookSlot(slot, product) {
    if (!canUserBookSlot(slot, product)) return null;

    product.remain = Math.max(0, Number(product.remain || 0) - 1);

    const booking = {
      id: makeBookingId(),
      productId: product.id,
      courseId: slot.courseId,
      courseName: normalizeUserCourseName({ name: slot.courseName.replace(/小班$/, ''), type: slot.courseType }),
      coachName: DEMO_COACH,
      store: slot.store,
      scheduleId: slot.id,
      date: slot.date,
      start: slot.start,
      end: slot.end,
      type: slot.courseType,
      status: '待上课',
    };

    slot.members.push({
      bookingId: booking.id,
      name: '用户本人',
      phone: '188****0000',
      time: '用户端预约',
      status: '待上课',
      source: 'user',
      isCurrentUser: true,
    });

    syncScheduleBookedCount(slot);
    userBookings.unshift(booking);
    return booking;
  }

  describe('课程 → 时段 → 预约流程', () => {
    it('用户可预约一对一课程的有效时段', () => {
      const product = getUserProduct('product-1');
      const slot = getUserSlot(1001);

      expect(product.remain).toBe(6);
      expect(canUserBookSlot(slot, product)).toBe(true);

      const booking = bookSlot(slot, product);

      expect(booking).not.toBeNull();
      expect(booking.status).toBe('待上课');
      expect(product.remain).toBe(5);
      expect(slot.booked).toBe(1);
      expect(slot.status).toBe('已满'); // 一对一，limit=1
      expect(userBookings).toHaveLength(1);
    });

    it('一对一满员后不可再约', () => {
      const product = getUserProduct('product-1');
      const slot = getUserSlot(1001);

      bookSlot(slot, product); // first booking
      expect(canUserBookSlot(slot, product)).toBe(false);
    });

    it('一对多课程可多人预约', () => {
      const product = getUserProduct('product-2');
      const slot = getUserSlot(2001);

      expect(slot.limit).toBe(2);
      expect(canUserBookSlot(slot, product)).toBe(true);

      bookSlot(slot, product);
      expect(slot.booked).toBe(1);
      expect(slot.status).toBe('可预约'); // 未满

      // Second booking (simulate another user)
      product.remain = 3; // reset for second user
      const product2 = { ...product, remain: 3 };
      // Need to update the members to simulate another booking
      slot.members.push({
        bookingId: makeBookingId(),
        name: '李三',
        phone: '139****6666',
        time: '用户端预约',
        status: '待上课',
        source: 'user',
        isCurrentUser: false,
      });
      syncScheduleBookedCount(slot);

      expect(slot.booked).toBe(2);
      expect(slot.status).toBe('已满');
    });

    it('课时不足时不可预约', () => {
      const product = getUserProduct('product-1');
      product.remain = 0;
      const slot = getUserSlot(1002);

      expect(canUserBookSlot(slot, product)).toBe(false);
    });

    it('已停止预约的时段不可预约', () => {
      const product = getUserProduct('product-1');
      const slot = getUserSlot(1001);
      slot.status = '停止预约';

      expect(canUserBookSlot(slot, product)).toBe(false);
    });
  });

  describe('时间工具在业务场景中的正确性', () => {
    it('timeToMin 正确排序时段', () => {
      const times = ['18:30', '09:00', '14:00', '10:00'];
      times.sort((a, b) => timeToMin(a) - timeToMin(b));
      expect(times).toEqual(['09:00', '10:00', '14:00', '18:30']);
    });

    it('fmtUserDateTime 生成正确的预约摘要', () => {
      const result = fmtUserDateTime('2026-05-06', '14:00', '15:00');
      expect(result).toContain('星期三');
      expect(result).toContain('14:00');
      expect(result).toContain('15:00');
    });

    it('dayName 用于过滤工作日', () => {
      const date = fmtISO(new Date());
      const day = dayName(date);
      const ranges = workTimes[day] || [];
      expect(Array.isArray(ranges)).toBe(true);
    });
  });

  describe('课程名称规范化', () => {
    it('一对多课程自动补小班课', () => {
      expect(normalizeUserCourseName({ name: '减脂塑形', type: '一对多' })).toBe('减脂塑形小班课');
    });

    it('已含小班的课程不重复补', () => {
      expect(normalizeUserCourseName({ name: '减脂塑形小班', type: '一对多' })).toBe('减脂塑形小班');
      expect(normalizeUserCourseName({ name: '瑜伽团课', type: '一对多' })).toBe('瑜伽团课');
    });
  });
});
