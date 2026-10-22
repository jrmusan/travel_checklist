/*
 * Small illustrated icons (48×48 grid) for category tiles and checklist rows.
 * Fixed warm palette so they read as illustrations in every theme.
 */
const G = '#5d7a43'
const GD = '#34492a'
const GL = '#8fa86f'
const T = '#d9a54a'
const TD = '#9a6b26'
const O = '#de7b3e'
const OD = '#a9522a'
const C = '#f4e7c9'
const B = '#93603a'
const BD = '#5e3b22'
const S = '#8b97a0'
const SD = '#56636c'
const N = '#2b4434'
const K = '#33302b'

const ART = {
  tent: (
    <>
      <path d="M24 9 6 38h36Z" fill={T} />
      <path d="M24 9 42 38h-9Z" fill={TD} opacity=".55" />
      <path d="m24 17-7 21h14Z" fill={BD} />
      <path d="M24 5v5" stroke={BD} strokeWidth="2.4" strokeLinecap="round" />
      <rect x="4" y="37" width="40" height="4" rx="2" fill={G} />
    </>
  ),
  mug: (
    <>
      <path d="M17 7c-2 2.5 2 4 0 7M23 6c-2 2.5 2 4 0 7" stroke={S} strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M33 22h2.5a5 5 0 0 1 0 10H33" stroke={GD} strokeWidth="3.2" fill="none" />
      <path d="M10 18h24v17a5 5 0 0 1-5 5H15a5 5 0 0 1-5-5Z" fill={G} />
      <ellipse cx="22" cy="18" rx="12" ry="2.6" fill={GD} />
      <circle cx="16" cy="27" r="1.3" fill={C} />
      <circle cx="25" cy="31" r="1.1" fill={C} />
      <circle cx="21" cy="35" r="1" fill={C} />
    </>
  ),
  jacket: (
    <>
      <path d="m17 8 7 3 7-3 9 7-3.5 9-3.5-2v18H15V22l-3.5 2L8 15Z" fill={G} />
      <path d="M15 27h18M15 33h18" stroke={GD} strokeWidth="1.6" opacity=".6" />
      <path d="M24 11v29" stroke={GD} strokeWidth="2" />
      <path d="m17 8 7 5 7-5" stroke={GD} strokeWidth="2" fill="none" strokeLinejoin="round" />
      <rect x="18" y="26" width="3.5" height="1.6" rx=".8" fill={T} />
    </>
  ),
  bottles: (
    <>
      <rect x="15" y="9" width="6" height="6" rx="1.2" fill={BD} />
      <rect x="12" y="14" width="12" height="27" rx="3.5" fill={O} />
      <rect x="14.5" y="22" width="7" height="9" rx="1.5" fill={C} />
      <path d="M30 13h6M33 13v6" stroke={K} strokeWidth="2.2" strokeLinecap="round" />
      <rect x="27" y="19" width="12" height="22" rx="5" fill={T} />
      <rect x="29.5" y="26" width="7" height="7" rx="1.5" fill={C} />
    </>
  ),
  rope: (
    <>
      <circle cx="19" cy="27" r="12" stroke={O} strokeWidth="4.5" fill="none" />
      <circle cx="19" cy="27" r="6" stroke={OD} strokeWidth="3.2" fill="none" />
      <rect x="29" y="8" width="12" height="22" rx="6" stroke={S} strokeWidth="3.4" fill="none" />
      <path d="M41 14v10" stroke={SD} strokeWidth="3.4" />
    </>
  ),
  laptop: (
    <>
      <rect x="9" y="10" width="30" height="20" rx="2.5" fill={N} />
      <rect x="12" y="13" width="24" height="14" rx="1" fill={GL} />
      <path d="M17 22l4-4 3 3 3-3 4 4" stroke={GD} strokeWidth="1.6" fill="none" />
      <path d="M5 32h38l-3 6H8Z" fill={TD} />
      <rect x="20" y="32" width="8" height="2" rx="1" fill={BD} />
    </>
  ),
  camera: (
    <>
      <rect x="16" y="10" width="11" height="6" rx="2" fill={K} />
      <rect x="6" y="14" width="36" height="25" rx="5" fill={N} />
      <rect x="6" y="20" width="36" height="3" fill={GD} />
      <circle cx="24" cy="27" r="9" fill={C} />
      <circle cx="24" cy="27" r="5.5" fill={K} />
      <circle cx="22" cy="25" r="1.6" fill={C} />
      <rect x="33" y="16" width="5" height="3" rx="1" fill={O} />
    </>
  ),
  paw: (
    <>
      <path d="M24 24c-6 0-11 6.5-11 11 0 4 3.5 5 6 4.3 2-.6 3.5-1.3 5-1.3s3 .7 5 1.3c2.5.7 6-.3 6-4.3 0-4.5-5-11-11-11Z" fill={B} />
      <ellipse cx="11.5" cy="21" rx="4" ry="5" fill={B} />
      <ellipse cx="19" cy="12.5" rx="4" ry="5.2" fill={B} />
      <ellipse cx="29" cy="12.5" rx="4" ry="5.2" fill={B} />
      <ellipse cx="36.5" cy="21" rx="4" ry="5" fill={B} />
    </>
  ),
  bear: (
    <>
      <circle cx="14" cy="11" r="5" fill={B} />
      <circle cx="34" cy="11" r="5" fill={B} />
      <circle cx="14" cy="11" r="2.4" fill={T} />
      <circle cx="34" cy="11" r="2.4" fill={T} />
      <ellipse cx="24" cy="36" rx="12" ry="9" fill={B} />
      <ellipse cx="24" cy="37" rx="6.5" ry="5.5" fill={T} />
      <circle cx="24" cy="19" r="11" fill={B} />
      <ellipse cx="24" cy="23" rx="5" ry="4" fill={T} />
      <circle cx="19.5" cy="17" r="1.5" fill={K} />
      <circle cx="28.5" cy="17" r="1.5" fill={K} />
      <ellipse cx="24" cy="21.5" rx="1.8" ry="1.3" fill={K} />
    </>
  ),
  compass: (
    <>
      <circle cx="24" cy="7" r="3" stroke={TD} strokeWidth="2.2" fill="none" />
      <circle cx="24" cy="26" r="16" fill={T} />
      <circle cx="24" cy="26" r="12.5" fill={C} />
      <path d="m24 15 4 11h-8Z" fill={O} />
      <path d="m24 37-4-11h8Z" fill={N} />
      <circle cx="24" cy="26" r="1.8" fill={K} />
    </>
  ),
  lantern: (
    <>
      <path d="M17 12a7 7 0 0 1 14 0" stroke={K} strokeWidth="2.2" fill="none" />
      <path d="M15 12h18l-2 5H17Z" fill={GD} />
      <rect x="17" y="17" width="14" height="17" rx="2" fill={T} opacity=".9" />
      <ellipse cx="24" cy="26" rx="3.4" ry="5" fill="#fff4cf" />
      <path d="M17 17v17M31 17v17" stroke={GD} strokeWidth="2.2" />
      <path d="M14 34h20l-2 6H16Z" fill={GD} />
    </>
  ),
  hat: (
    <>
      <ellipse cx="24" cy="31" rx="19" ry="6" fill={T} />
      <path d="M13 30c0-9 4.5-15 11-15s11 6 11 15c-3 1.5-7 2-11 2s-8-.5-11-2Z" fill={TD} />
      <path d="M13.5 26c3 1.6 6.5 2.2 10.5 2.2s7.5-.6 10.5-2.2" stroke={O} strokeWidth="3" fill="none" />
    </>
  ),
  boot: (
    <>
      <path d="M14 8h12v17l10 4c4 1.6 6 4 6 8v2H8V12a4 4 0 0 1 4-4Z" fill={B} />
      <path d="M8 35h34v4H8Z" fill={BD} />
      <path d="M26 14h-6M26 18h-6M26 22h-6" stroke={T} strokeWidth="1.8" strokeLinecap="round" />
      <rect x="12" y="8" width="16" height="4" rx="2" fill={BD} />
    </>
  ),
  sock: (
    <>
      <path d="M17 6h14v18l-8 12a6 6 0 0 1-10-6.5L17 23Z" fill={O} />
      <rect x="17" y="6" width="14" height="6" fill={C} />
      <path d="M17 17h14" stroke={C} strokeWidth="2.4" />
      <path d="M14 32a6 6 0 0 0 9 4" stroke={OD} strokeWidth="3" fill="none" strokeLinecap="round" />
    </>
  ),
  shirt: (
    <>
      <path d="m17 8 7 3 7-3 10 7-4 7-5-2.5V40H16V19.5L11 22l-4-7Z" fill={S} />
      <path d="M19 9.5a5 5 0 0 0 10 0" stroke={SD} strokeWidth="2" fill="none" />
      <rect x="16" y="26" width="16" height="3" fill={SD} opacity=".5" />
    </>
  ),
  towel: (
    <>
      <rect x="10" y="9" width="28" height="31" rx="3" fill={G} />
      <rect x="10" y="30" width="28" height="4" fill={C} />
      <rect x="10" y="35" width="28" height="2" fill={C} opacity=".7" />
      <rect x="8" y="7" width="32" height="5" rx="2.5" fill={GD} />
    </>
  ),
  snack: (
    <>
      <path d="M12 12h24l-3 28H15Z" fill={O} />
      <path d="M11 9h26v5H11Z" fill={OD} />
      <circle cx="24" cy="26" r="6" fill={C} />
      <path d="M24 21v-3" stroke={G} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M24 20c2-2 4-2 5-1" stroke={G} strokeWidth="1.8" fill="none" />
    </>
  ),
  helmet: (
    <>
      <path d="M8 31a16 16 0 0 1 32 0Z" fill={O} />
      <path d="M24 15v16M16 18l3 13M32 18l-3 13" stroke={OD} strokeWidth="2" />
      <rect x="6" y="30" width="36" height="5" rx="2.5" fill={K} />
      <path d="M14 35v3a4 4 0 0 0 4 4h12a4 4 0 0 0 4-4v-3" stroke={SD} strokeWidth="2" fill="none" />
    </>
  ),
  toothbrush: (
    <>
      <rect x="21" y="18" width="6" height="25" rx="3" fill={G} transform="rotate(20 24 30)" />
      <rect x="20" y="6" width="8" height="14" rx="2" fill={C} transform="rotate(20 24 13)" />
      <path d="M22 7v11M25 7v11" stroke={S} strokeWidth="1.4" transform="rotate(20 24 13)" />
      <rect x="9" y="30" width="9" height="12" rx="2" fill={O} />
      <rect x="10.5" y="26" width="6" height="5" rx="1" fill={OD} />
    </>
  ),
  plug: (
    <>
      <path d="M19 6v8M29 6v8" stroke={SD} strokeWidth="3" strokeLinecap="round" />
      <path d="M14 14h20v8a10 10 0 0 1-20 0Z" fill={K} />
      <path d="M24 32v6a4 4 0 0 0 4 4h8" stroke={K} strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="m25 16-4 6h5l-4 6" stroke={T} strokeWidth="2" fill="none" strokeLinejoin="round" />
    </>
  ),
  headset: (
    <>
      <path d="M10 28v-4a14 14 0 0 1 28 0v4" stroke={K} strokeWidth="3.2" fill="none" />
      <rect x="7" y="25" width="9" height="13" rx="4" fill={N} />
      <rect x="32" y="25" width="9" height="13" rx="4" fill={N} />
      <path d="M12 38c0 3 3 5 8 5h3" stroke={K} strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="25" cy="43" r="2.4" fill={O} />
    </>
  ),
  sleepingBag: (
    <>
      <rect x="9" y="8" width="30" height="34" rx="12" fill={G} />
      <path d="M11 22c4 2 22 2 26 0" stroke={GD} strokeWidth="2" fill="none" />
      <path d="M11 31c4 2 22 2 26 0" stroke={GD} strokeWidth="2" fill="none" />
      <ellipse cx="24" cy="15" rx="9" ry="4.5" fill={C} />
      <path d="M36 10v28" stroke={T} strokeWidth="2" strokeDasharray="2 3" />
    </>
  ),
  chair: (
    <>
      <path d="M13 8h22l-2 17H15Z" fill={G} />
      <path d="M13 8h22" stroke={GD} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M11 25h26v5H11Z" fill={GD} />
      <path d="m14 30-4 12M34 30l4 12M16 30l16 12M32 30 16 42" stroke={K} strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),
  backpack: (
    <>
      <path d="M19 9a5 5 0 0 1 10 0v2" stroke={GD} strokeWidth="2.4" fill="none" />
      <path d="M12 20a10 10 0 0 1 10-10h4a10 10 0 0 1 10 10v18a4 4 0 0 1-4 4H16a4 4 0 0 1-4-4Z" fill={O} />
      <rect x="16" y="27" width="16" height="11" rx="3" fill={OD} />
      <path d="M16 20h16" stroke={OD} strokeWidth="2" strokeLinecap="round" />
      <rect x="22" y="30" width="4" height="2" rx="1" fill={T} />
    </>
  ),
  paper: (
    <>
      <path d="M12 6h18l7 7v29H12Z" fill={C} />
      <path d="M30 6v7h7" fill={T} />
      <path d="M17 19h14M17 25h14M17 31h9" stroke={SD} strokeWidth="2" strokeLinecap="round" />
      <path d="m30 33 8-12 3 2-8 12-4 1Z" fill={O} />
    </>
  ),
  babyBottle: (
    <>
      <path d="M21 4h6l1 6h-8Z" fill={T} />
      <rect x="17" y="10" width="14" height="5" rx="2" fill={O} />
      <rect x="16" y="15" width="16" height="27" rx="5" fill={C} />
      <path d="M16 26h16v11a5 5 0 0 1-5 5h-6a5 5 0 0 1-5-5Z" fill="#fffaf0" />
      <path d="M26 20h4M26 25h4M26 30h4" stroke={SD} strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  jug: (
    <>
      <rect x="20" y="5" width="8" height="5" rx="1.5" fill={GD} />
      <path d="M14 14a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4Z" fill="#7aa3b8" />
      <path d="M14 22h20v16a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4Z" fill="#4f7f97" />
      <path d="M34 16h3a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-3" stroke={GD} strokeWidth="2.6" fill="none" />
    </>
  ),
  spray: (
    <>
      <rect x="18" y="5" width="9" height="6" rx="1.5" fill={K} />
      <path d="M27 7h4" stroke={K} strokeWidth="2" strokeLinecap="round" />
      <path d="M34 4l3-1M34 8h4M34 12l3 1" stroke={S} strokeWidth="1.6" strokeLinecap="round" />
      <rect x="15" y="11" width="15" height="31" rx="4" fill={O} />
      <rect x="15" y="20" width="15" height="12" fill={T} />
    </>
  ),
  phone: (
    <>
      <rect x="14" y="5" width="20" height="38" rx="4.5" fill={K} />
      <rect x="16.5" y="9" width="15" height="28" rx="1.5" fill={GL} />
      <path d="M17 31l5-6 3 3 3-4 3.5 7" fill={G} />
      <rect x="21" y="39.5" width="6" height="1.6" rx=".8" fill={S} />
    </>
  ),
  board: (
    <>
      <ellipse cx="24" cy="24" rx="9" ry="20" fill={T} transform="rotate(30 24 24)" />
      <path d="M13 33 35 15" stroke={O} strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  pill: (
    <>
      <rect x="7" y="18" width="34" height="13" rx="6.5" fill={C} transform="rotate(-35 24 24)" />
      <path d="M7 18h17v13H13.5A6.5 6.5 0 0 1 7 24.5Z" fill={O} transform="rotate(-35 24 24)" />
    </>
  ),
} as const

export type ArtName = keyof typeof ART

interface ArtIconProps {
  name: ArtName
  size?: number
  className?: string
}

export function ArtIcon({ name, size = 40, className }: ArtIconProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      aria-hidden
      focusable="false"
    >
      {ART[name]}
    </svg>
  )
}
