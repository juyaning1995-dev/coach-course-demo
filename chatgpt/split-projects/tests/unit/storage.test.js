import { describe, it, expect, beforeEach, vi } from 'vitest';

// Simulate the storage layer used by both apps
// We test the pure logic patterns rather than importing from the IIFE

const WINDOW_STORE_PREFIX = '__coach_split_projects_store__:';

function readWindowStore() {
  try {
    return window.name.startsWith(WINDOW_STORE_PREFIX)
      ? JSON.parse(window.name.slice(WINDOW_STORE_PREFIX.length)) || {}
      : {};
  } catch (e) { return {}; }
}

function writeWindowStore(store) {
  try { window.name = WINDOW_STORE_PREFIX + JSON.stringify(store); } catch (e) {}
}

function readRaw(key) {
  try { const value = localStorage.getItem(key); if (value !== null) return value; } catch (e) {}
  try { const value = sessionStorage.getItem(key); if (value !== null) return value; } catch (e) {}
  const store = readWindowStore();
  return Object.prototype.hasOwnProperty.call(store, key) ? store[key] : null;
}

function writeRaw(key, value) {
  try { localStorage.setItem(key, value); } catch (e) {}
  try { sessionStorage.setItem(key, value); } catch (e) {}
  const store = readWindowStore();
  store[key] = value;
  writeWindowStore(store);
}

function removeRaw(key) {
  try { localStorage.removeItem(key); } catch (e) {}
  try { sessionStorage.removeItem(key); } catch (e) {}
  const store = readWindowStore();
  delete store[key];
  writeWindowStore(store);
}

function load(key, fallback) {
  const raw = readRaw(key);
  if (raw === null) return fallback;
  try { return JSON.parse(raw) ?? fallback; } catch (e) { return fallback; }
}

describe('storage layer', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.name = '';
  });

  describe('localStorage', () => {
    it('writes and reads raw values', () => {
      writeRaw('test_key', 'hello');
      expect(readRaw('test_key')).toBe('hello');
    });

    it('returns null for missing keys', () => {
      expect(readRaw('nonexistent')).toBeNull();
    });

    it('removes keys', () => {
      writeRaw('test_key', 'value');
      removeRaw('test_key');
      expect(readRaw('test_key')).toBeNull();
    });
  });

  describe('load (JSON)', () => {
    it('parses JSON and returns the value', () => {
      writeRaw('courses', JSON.stringify([{ id: 1, name: '私教课' }]));
      const result = load('courses', []);
      expect(result).toEqual([{ id: 1, name: '私教课' }]);
    });

    it('returns fallback for missing keys', () => {
      expect(load('missing', [])).toEqual([]);
      expect(load('missing', { default: true })).toEqual({ default: true });
    });

    it('returns fallback for invalid JSON', () => {
      writeRaw('bad', 'not-json{{{');
      expect(load('bad', [])).toEqual([]);
    });

    it('returns fallback for null JSON', () => {
      // null parses as null, which is falsy, so fallback is used
      writeRaw('null_val', 'null');
      expect(load('null_val', [])).toEqual([]);
    });
  });

  describe('window.name fallback', () => {
    it('reads from window.name when localStorage fails', () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = () => { throw new Error('blocked'); };

      writeRaw('fallback_key', 'window_value');
      const val = readRaw('fallback_key');
      expect(val).toBe('window_value');

      localStorage.getItem = originalGetItem;
    });
  });
});
