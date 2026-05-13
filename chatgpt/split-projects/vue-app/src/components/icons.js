const c = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"'
export const icons = {
  /* Stats */
  calendarCheck: `<svg ${c}><rect x="5" y="4" width="14" height="16" rx="3"/><path d="M9 2v4M15 2v4M8 9h8"/><path d="m9 14 2 2 4-4"/></svg>`,
  chart: `<svg ${c}><path d="M4 17h16"/><path d="M5 15l5-5 4 3 5-7"/><path d="M15 6h4v4"/></svg>`,
  income: `<svg ${c}><rect x="4" y="6" width="16" height="12" rx="3"/><path d="M4 10h16"/><path d="M8 14h3"/><path d="M16 14h.01"/></svg>`,

  /* Quick Features (金刚区) — uniform ~16×16 visual footprint */
  contract: `<svg ${c}><path d="M5 6.5h14l1.5 4H3.5l1.5-4Z"/><path d="M5 10.5v9h14v-9"/><path d="M10 19.5v-5.5h4v5.5"/></svg>`,
  clock: `<svg ${c}><circle cx="12" cy="12" r="8.2"/><path d="M12 7v5.2l3.5 2"/></svg>`,
  course: `<svg ${c}><rect x="4.5" y="4.5" width="15" height="15" rx="2.5"/><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h5"/></svg>`,
  booking: `<svg ${c}><rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M8 3.5v3M16 3.5v3M4 9.5h16"/><path d="m9 14.5 2 2 4.5-4.5"/></svg>`,
  schedule: `<svg ${c}><rect x="4" y="5" width="16" height="15" rx="2.5"/><path d="M8 3.5v3M16 3.5v3M4 9.5h16"/><path d="M8 12.5h2M13.5 12.5h2M8 16h2M13.5 16h2"/></svg>`,
  student: `<svg ${c}><circle cx="9.5" cy="7.5" r="3"/><path d="M4 19c1-3 2.8-4.5 5.5-4.5s4.5 1.5 5.5 4.5"/><circle cx="17" cy="8.5" r="2.5"/><path d="M15 14.5c2 .2 3.5 1.3 4 4.5"/></svg>`,
  order: `<svg ${c}><path d="M5 4.5h14v16l-2.5-1.3-2.8 1.3-2.8-1.3-2.5 1.3Z"/><path d="M8 9h8M8 12.5h8M8 16h5.5"/></svg>`,

  /* Bottom Nav */
  home: `<svg ${c}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M9 22V12h6v10"/></svg>`,
  mine: `<svg ${c}><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>`,

  /* Status bar */
  signal: `<svg viewBox="0 0 16 12" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"><rect x="0.5" y="7.5" width="3" height="4" rx="0.5"/><rect x="4.5" y="4.5" width="3" height="7" rx="0.5"/><rect x="8.5" y="1.5" width="3" height="10" rx="0.5"/><rect x="12.5" y="0.5" width="3" height="11" rx="0.5"/></svg>`,
  battery: `<svg viewBox="0 0 27 12" fill="none"><rect x="0" y="0" width="23" height="12" rx="2.5" stroke="currentColor" stroke-width="1"/><rect x="24" y="3.5" width="2.5" height="5" rx="1" fill="currentColor"/><rect x="2" y="2" width="17" height="8" rx="1" fill="currentColor"/></svg>`,

  search: `<svg ${c} stroke-width="2"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 20 20"/></svg>`
}
