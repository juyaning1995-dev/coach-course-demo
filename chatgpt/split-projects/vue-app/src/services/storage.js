/**
 * Storage abstraction layer.
 * Currently uses localStorage. Swap implementations for API-based storage.
 * All keys use the `coachSplitProject` prefix for cross-app compatibility.
 */
const P = 'coachSplitProject'

function key(name) { return `${P}_${name}` }

function r(k) { try { return localStorage.getItem(k) } catch { return null } }
function w(k, v) { try { localStorage.setItem(k, v) } catch {} }
function d(k) { try { localStorage.removeItem(k) } catch {} }

export function load(keyName, fallback) {
  const raw = r(key(keyName))
  if (raw === null) return fallback
  try { return JSON.parse(raw) ?? fallback } catch { return fallback }
}

export function save(keyName, value) {
  w(key(keyName), JSON.stringify(value))
}

export function remove(keyName) {
  d(key(keyName))
}

/** Read raw string from localStorage (for draft state etc.) */
export function readRaw(fullKey) {
  return r(fullKey)
}

/** Write raw string to localStorage */
export function writeRaw(fullKey, value) {
  w(fullKey, value)
}

/** Delete raw key */
export function deleteRaw(fullKey) {
  d(fullKey)
}

/** Generate a namespaced key for per-app data (e.g. drafts, active page) */
export function appKey(appMode, name) {
  return `${appMode}_${name}`
}
