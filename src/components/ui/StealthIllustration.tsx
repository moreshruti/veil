"use client";

/**
 * Isometric 3D chat-bubble + shield illustration for empty states.
 * Dark neutral tones with dashed construction lines and subtle float animation.
 */
export function StealthIllustration({ size = 240 }: { size?: number }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 240 240"
        fill="none"
        className="select-none"
      >
        <defs>
          {/* Isometric face gradients */}
          <linearGradient id="iso-top" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--c4)" />
            <stop offset="100%" stopColor="var(--c3)" />
          </linearGradient>
          <linearGradient id="iso-left" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--c3)" />
            <stop offset="100%" stopColor="var(--c2)" />
          </linearGradient>
          <linearGradient id="iso-right" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--c3)" />
            <stop offset="100%" stopColor="var(--c1)" />
          </linearGradient>
          {/* Shield gradient */}
          <linearGradient id="shield-g" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--c6)" />
            <stop offset="100%" stopColor="var(--c4)" />
          </linearGradient>
          {/* Glow */}
          <radialGradient id="iso-glow" cx="50%" cy="55%" r="45%">
            <stop offset="0%" stopColor="var(--c4)" stopOpacity="0.12" />
            <stop offset="100%" stopColor="var(--c1)" stopOpacity="0" />
          </radialGradient>
          {/* Dash animation */}
          <style>{`
            @keyframes iso-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
            @keyframes dash-march { to { stroke-dashoffset: -16; } }
            @keyframes shield-pulse { 0%,100% { opacity: 0.9; } 50% { opacity: 0.6; } }
            .iso-float { animation: iso-float 4s ease-in-out infinite; }
            .dash-march { animation: dash-march 1.5s linear infinite; }
            .shield-pulse { animation: shield-pulse 3s ease-in-out infinite; }
          `}</style>
        </defs>

        {/* Background glow */}
        <ellipse cx="120" cy="140" rx="90" ry="50" fill="url(#iso-glow)" />

        {/* Shadow ellipse */}
        <ellipse cx="120" cy="185" rx="55" ry="12" fill="var(--c2)" opacity="0.6">
          <animate attributeName="rx" values="55;50;55" dur="4s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.6;0.3;0.6" dur="4s" repeatCount="indefinite" />
        </ellipse>

        {/* === Main floating group === */}
        <g className="iso-float">

          {/* Dashed construction box (outer) */}
          <path
            d="M120 40 L185 77 L185 143 L120 180 L55 143 L55 77 Z"
            stroke="var(--c4)"
            strokeWidth="1"
            strokeDasharray="6 4"
            fill="none"
            opacity="0.4"
            className="dash-march"
          />

          {/* Isometric chat bubble — top face */}
          <path
            d="M120 60 L170 88 L120 116 L70 88 Z"
            fill="url(#iso-top)"
            stroke="var(--c5)"
            strokeWidth="0.5"
          />

          {/* Isometric chat bubble — left face */}
          <path
            d="M70 88 L120 116 L120 156 L70 128 Z"
            fill="url(#iso-left)"
            stroke="var(--c5)"
            strokeWidth="0.5"
          />

          {/* Isometric chat bubble — right face */}
          <path
            d="M170 88 L120 116 L120 156 L170 128 Z"
            fill="url(#iso-right)"
            stroke="var(--c5)"
            strokeWidth="0.5"
          />

          {/* Chat bubble tail (isometric) */}
          <path
            d="M120 156 L105 164 L110 156"
            fill="url(#iso-left)"
            stroke="var(--c5)"
            strokeWidth="0.5"
            strokeLinejoin="round"
          />

          {/* Chat lines on top face */}
          <line x1="95" y1="84" x2="135" y2="84" stroke="var(--c6)" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
          <line x1="100" y1="90" x2="140" y2="90" stroke="var(--c5)" strokeWidth="1" strokeLinecap="round" opacity="0.35" />
          <line x1="103" y1="96" x2="130" y2="96" stroke="var(--c5)" strokeWidth="1" strokeLinecap="round" opacity="0.25" />

          {/* Shield on right face */}
          <g className="shield-pulse" transform="translate(132, 96)">
            <path
              d="M12 2 L22 6 L22 14 C22 20 17 24 12 26 C7 24 2 20 2 14 L2 6 Z"
              fill="url(#shield-g)"
              stroke="var(--c7)"
              strokeWidth="1"
              strokeLinejoin="round"
              opacity="0.8"
            />
            {/* Lock icon inside shield */}
            <rect x="8" y="12" width="8" height="6" rx="1" stroke="var(--c9)" strokeWidth="0.8" fill="none" opacity="0.7" />
            <path d="M10 12 L10 10 C10 8 14 8 14 10 L14 12" stroke="var(--c9)" strokeWidth="0.8" fill="none" opacity="0.7" />
          </g>

          {/* Dashed inner detail lines */}
          <line x1="120" y1="60" x2="120" y2="156" stroke="var(--c4)" strokeWidth="0.5" strokeDasharray="3 5" opacity="0.25" />
          <line x1="70" y1="88" x2="170" y2="88" stroke="var(--c4)" strokeWidth="0.5" strokeDasharray="3 5" opacity="0.25" />

        </g>

        {/* Corner markers */}
        {[
          [40, 55],
          [200, 55],
          [40, 175],
          [200, 175],
        ].map(([x, y], i) => (
          <g key={i} opacity="0.25">
            <line x1={x - 5} y1={y} x2={x + 5} y2={y} stroke="var(--c5)" strokeWidth="0.5" />
            <line x1={x} y1={y - 5} x2={x} y2={y + 5} stroke="var(--c5)" strokeWidth="0.5" />
          </g>
        ))}

        {/* Small floating dots */}
        {[
          [55, 65, 1.8],
          [185, 65, 1.5],
          [48, 140, 1.2],
          [192, 140, 1.8],
          [90, 45, 1],
          [150, 45, 1],
        ].map(([x, y, r], i) => (
          <circle key={`d-${i}`} cx={x} cy={y} r={r} fill="var(--c5)" opacity="0.4">
            <animate
              attributeName="opacity"
              values="0.4;0.15;0.4"
              dur={`${2 + i * 0.4}s`}
              repeatCount="indefinite"
            />
          </circle>
        ))}

      </svg>
    </div>
  );
}
