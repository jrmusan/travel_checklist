/** Decorative line-art for app header — tent, pines, trail marker */
export function HeaderArt() {
  return (
    <svg
      className="header-art"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 120 56"
      aria-hidden
    >
      <g fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
        {/* Pines */}
        <path
          strokeWidth="1.4"
          d="M8 48V28M8 28l-6 10h12M8 28l6 10M8 20l-4 6h8M8 12l-3 5h6"
          className="header-art-pine"
        />
        <path
          strokeWidth="1.4"
          d="M22 48V32M22 32l-5 8h10M22 32l5 8M22 26l-3 5h6"
          className="header-art-pine"
        />
        {/* Tent */}
        <path strokeWidth="1.6" d="M52 48V22L68 48H52Z" fill="currentColor" fillOpacity="0.08" />
        <path strokeWidth="1.6" d="M52 48V22L68 48M60 22v26" />
        <path strokeWidth="1.2" d="M56 48h8" strokeDasharray="2 2" opacity="0.5" />
        {/* Carabiner hint */}
        <path
          strokeWidth="1.3"
          d="M78 26c0-4 3-6 6-6s6 2 6 6v8c0 3-2 5-5 5h-2c-3 0-5-2-5-5v-8z"
          opacity="0.85"
        />
        <path strokeWidth="1.3" d="M84 20v-4" />
        {/* Right pine cluster */}
        <path
          strokeWidth="1.4"
          d="M98 48V30M98 30l-6 9h12M98 30l6 9M98 22l-4 6h8"
          className="header-art-pine"
        />
        <path strokeWidth="1.4" d="M112 48V34M112 34l-4 7h8M112 34l4 7" className="header-art-pine" />
      </g>
    </svg>
  )
}
