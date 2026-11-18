import type { ReactNode } from 'react'

const paths = {
  sprout: <><path d="M12 21v-7C12 8 8 5 3 5c0 5 3 9 9 9M12 17c0-5 4-8 9-8 0 5-4 8-9 8M8 21h8" /></>,
  world: <><path d="M2.5 18 8 8l4 6 3-4 6.5 8H2.5Z" /><path d="M16.5 5a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0Z" /></>,
  habits: <><path d="M8 6h12M8 12h12M8 18h12M3 5l1 1 2-2M3 11l1 1 2-2M3 17l1 1 2-2" /></>,
  journal: <><path d="M4 5c3-1 6-.8 8 1 2-1.8 5-2 8-1v14c-3-1-6-.8-8 1-2-1.8-5-2-8-1V5Zm8 1v14" /><path d="M7 9h2m-2 4h2m6-4h2m-2 4h2" /></>,
  progress: <><path d="M4 19h16M7 15v-4m5 4V7m5 8V4" /></>,
  calendar: <><rect x="4" y="6" width="16" height="15" rx="2" /><path d="M8 3v6m8-6v6M4 11h16m-10 4h4" /></>,
  settings: <><path d="M4 7h16M4 17h16" /><circle cx="9" cy="7" r="2.5" fill="var(--icon-bg, #f7f3e9)" /><circle cx="15" cy="17" r="2.5" fill="var(--icon-bg, #f7f3e9)" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  reset: <path d="M5 10a7 7 0 1 1 .7 7M5 5v5h5" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  check: <path d="m5 12 4 4L19 6" />,
  chevron: <path d="m6 9 6 6 6-6" />,
  lantern: <><path d="M9 5a3 3 0 0 1 6 0M7 6h10l2 4-2 10H7L5 10l2-4Zm-2 4h14M10 14l2-2 2 2-2 4-2-4Z" /></>,
  clock: <><circle cx="12" cy="12" r="8" /><path d="M12 7v5l3 2" /></>,
  pin: <><path d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 0 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>,
  house: <><path d="m3 11 9-7 9 7m-16-1v9h14v-9m-9 9v-5h4v5" /></>,
  lock: <><rect x="6" y="10" width="12" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v2" /></>,
  download: <path d="M12 4v11m-4-4 4 4 4-4M5 16v4h14v-4" />,
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof paths

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  )
}
