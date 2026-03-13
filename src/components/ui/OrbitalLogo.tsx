"use client";

/* ------------------------------------------------------------------ */
/*  OrbitalLogo                                                        */
/*  Concentric rotating rings with crosshair lines and center glow.    */
/*  Pure CSS animation -- no Framer Motion.                            */
/* ------------------------------------------------------------------ */

export function OrbitalLogo() {
  const size = 300;
  const center = size / 2;

  return (
    <div
      className="orbital-logo"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ---- Crosshair lines ---- */}
        <line
          x1={center}
          y1={20}
          x2={center}
          y2={size - 20}
          stroke="var(--c3)"
          strokeWidth="0.5"
        />
        <line
          x1={20}
          y1={center}
          x2={size - 20}
          y2={center}
          stroke="var(--c3)"
          strokeWidth="0.5"
        />
        {/* Diagonal crosshairs */}
        <line
          x1={center - 80}
          y1={center - 80}
          x2={center + 80}
          y2={center + 80}
          stroke="var(--c3)"
          strokeWidth="0.3"
          opacity="0.5"
        />
        <line
          x1={center + 80}
          y1={center - 80}
          x2={center - 80}
          y2={center + 80}
          stroke="var(--c3)"
          strokeWidth="0.3"
          opacity="0.5"
        />
      </svg>

      {/* ---- Ring 1: Outermost -- slow rotation with hatched mask ---- */}
      <div
        className="orbital-ring orbital-ring-1"
        style={{
          width: size,
          height: size,
          animation: "orbital-rotate 120s linear infinite",
        }}
      >
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width={size}
          height={size}
          fill="none"
        >
          <circle
            cx={center}
            cy={center}
            r={center - 10}
            stroke="var(--c3)"
            strokeWidth="0.5"
          />
        </svg>
      </div>

      {/* ---- Ring 2: Dashed ring ---- */}
      <div
        className="orbital-ring orbital-ring-2"
        style={{
          width: size - 40,
          height: size - 40,
          animation: "orbital-rotate-reverse 90s linear infinite",
        }}
      >
        <svg
          viewBox={`0 0 ${size - 40} ${size - 40}`}
          width={size - 40}
          height={size - 40}
          fill="none"
        >
          <circle
            cx={(size - 40) / 2}
            cy={(size - 40) / 2}
            r={(size - 40) / 2 - 4}
            stroke="var(--c4)"
            strokeWidth="0.5"
            strokeDasharray="6 4"
          />
        </svg>
      </div>

      {/* ---- Ring 3: Medium ring ---- */}
      <div
        className="orbital-ring orbital-ring-3"
        style={{
          width: size - 100,
          height: size - 100,
          animation: "orbital-rotate 60s linear infinite",
        }}
      >
        <svg
          viewBox={`0 0 ${size - 100} ${size - 100}`}
          width={size - 100}
          height={size - 100}
          fill="none"
        >
          <circle
            cx={(size - 100) / 2}
            cy={(size - 100) / 2}
            r={(size - 100) / 2 - 4}
            stroke="var(--c4)"
            strokeWidth="0.5"
          />
          {/* Small marker on the ring */}
          <circle
            cx={(size - 100) / 2}
            cy={4}
            r="2"
            fill="var(--c5)"
          />
        </svg>
      </div>

      {/* ---- Ring 4: Inner ring ---- */}
      <div
        className="orbital-ring orbital-ring-4"
        style={{
          width: size - 170,
          height: size - 170,
          animation: "orbital-rotate-reverse 40s linear infinite",
        }}
      >
        <svg
          viewBox={`0 0 ${size - 170} ${size - 170}`}
          width={size - 170}
          height={size - 170}
          fill="none"
        >
          <circle
            cx={(size - 170) / 2}
            cy={(size - 170) / 2}
            r={(size - 170) / 2 - 4}
            stroke="var(--c5)"
            strokeWidth="0.5"
            strokeDasharray="3 6"
          />
        </svg>
      </div>

      {/* ---- Center glow point ---- */}
      <div className="orbital-center" />
    </div>
  );
}
