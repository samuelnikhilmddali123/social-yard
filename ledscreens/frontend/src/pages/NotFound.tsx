import React from 'react';

/* ─── Inline styles (avoids Tailwind-v4 config issues for one-off page) ─── */
const styles: Record<string, React.CSSProperties> = {
  page: {
    position: 'relative',
    minHeight: '100svh',
    width: '100%',
    backgroundColor: '#000',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  video: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: 0,
    opacity: 1,
  },
  logo: {
    position: 'absolute',
    top: 80,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    display: 'flex',
    alignItems: 'center',
    width: 233,
    height: 40,
    flexShrink: 0,
  },
  center: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: 10,
    width: 483,
    maxWidth: 'calc(100% - 40px)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 44,
  },
  heading: {
    fontFamily: '"Geist Mono:SemiBold", "Geist Mono", monospace',
    fontWeight: 600,
    fontSize: '295.751px',
    lineHeight: 1.1,
    letterSpacing: '-24.6459px',
    textAlign: 'center',
    background:
      'linear-gradient(247.33deg, rgb(255,255,255) 2.53%, rgba(255,255,255,0.4) 93.61%)',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    color: 'transparent',
    margin: 0,
    paddingBottom: '0.1em',
  },
  divider: {
    width: 425,
    maxWidth: '100%',
    height: 1,
    backgroundColor: '#fff',
    border: 'none',
    flexShrink: 0,
  },
  message: {
    fontFamily: '"Geist Mono:SemiBold", "Geist Mono", monospace',
    fontWeight: 600,
    fontSize: 24,
    lineHeight: 1.1,
    letterSpacing: '-2px',
    color: '#fff',
    textAlign: 'center',
    width: '100%',
    margin: 0,
  },
};

/* ─── Mobile overrides injected via <style> ─── */
const mobileCSS = `
  @font-face {
    font-family: "Geist Mono:SemiBold";
    font-style: normal;
    font-weight: 600;
    font-display: swap;
    src: url("https://static.figma.com/font/GeistMono_wght__1") format("woff2");
  }

  @media (max-width: 640px) {
    .e3di-logo-wrapper {
      top: 32px !important;
      transform: translateX(-50%) scale(0.75) !important;
      transform-origin: top center;
    }
    .e3di-center {
      width: min(calc(100% - 40px), 360px) !important;
      gap: 28px !important;
    }
    .e3di-heading {
      font-size: clamp(140px, 52vw, 200px) !important;
      letter-spacing: -0.09em !important;
      height: auto !important;
      min-height: 0 !important;
      padding-bottom: 0.1em !important;
    }
    .e3di-divider {
      width: 100% !important;
    }
    .e3di-message {
      font-size: clamp(16px, 4.5vw, 20px) !important;
      letter-spacing: -1.3px !important;
    }
  }
`;

export default function NotFound() {
  return (
    <>
      <style>{mobileCSS}</style>
      <main style={styles.page}>
        {/* ── Background video ── */}
        <video
          style={styles.video}
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260801_001207_ec20d138-aa45-4b2b-ab8c-bdc71607f240.mp4"
          autoPlay
          loop
          muted
          playsInline
          aria-hidden="true"
        />

        {/* ── Header logo ── */}
        <div
          className="e3di-logo-wrapper"
          style={styles.logo}
          aria-label="LGPSM"
        >
          {/* Mark — 54×40 */}
          <svg
            width="54"
            height="40"
            viewBox="0 0 54 40"
            fill="none"
            aria-hidden="true"
            style={{ flexShrink: 0 }}
          >
            <path d="M38 0H26V12H38V0Z" fill="white" />
            <path d="M54 12H38V28H54V12Z" fill="white" />
            <path d="M38 28H26V40H38V28Z" fill="white" />
            <path d="M26 12H16V22H26V12Z" fill="white" />
            <path d="M16 22H8V30H16V22Z" fill="white" />
            <path d="M16 2H6V12H16V2Z" fill="white" />
            <path d="M6 12H0V18H6V12Z" fill="white" />
          </svg>

          {/* Logotype — 14px gap, remaining width ≈ 165px at original scale */}
          <svg
            width="165"
            height="40"
            viewBox="0 0 164.311 100"
            fill="none"
            aria-hidden="true"
            style={{ marginLeft: 14, flexShrink: 0 }}
          >
            <path
              d="M122.498 37.4573H131.321L139.533 51.6222L147.772 37.4573H156.595V56.0604H152.449V37.6433L141.739 56.0604H137.354L126.617 37.6433V56.0604H122.498V37.4573ZM95.921 48.8317C92.785 48.8317 90.261 46.307 90.261 43.1445C90.261 40.0086 92.785 37.4573 95.921 37.4573H119.972V41.6031H95.921C95.071 41.6031 94.38 42.2941 94.38 43.1445C94.38 44.0215 95.071 44.7125 95.921 44.7125H114.285C117.421 44.7125 119.972 47.2372 119.972 50.3997C119.972 53.5357 117.421 56.0604 114.285 56.0604H90.261V51.9411H114.285C115.136 51.9411 115.827 51.2501 115.827 50.3997C115.827 49.5227 115.136 48.8317 114.285 48.8317H95.921ZM80.857 37.4573C84.843 37.4573 88.086 40.6995 88.086 44.7125C88.086 48.6989 84.843 51.9411 80.857 51.9411H62.254V56.0604H58.135V37.4573H80.857ZM80.83 47.7953C82.558 47.7953 83.94 46.4133 83.94 44.7125C83.94 42.985 82.558 41.6031 80.83 41.6031H62.254V47.7953H80.83ZM35.975 41.6031C33.105 41.6031 30.7927 43.9152 30.7927 46.7588C30.7927 49.629 33.105 51.9411 35.975 51.9411H51.336V48.6989H35.576V44.5796H55.482V56.0604H35.975C30.8192 56.0604 26.6734 51.9145 26.6734 46.7588C26.6734 41.6297 30.8192 37.4573 35.975 37.4573H55.482V41.6031H35.975ZM0 56.0604V37.4573H4.1192V51.9411H24.9281V56.0604H0ZM164.311 36.4177C164.311 37.7529 163.228 38.8354 161.893 38.8354C160.558 38.8354 159.475 37.7529 159.475 36.4177C159.475 35.0824 160.558 34 161.893 34C163.228 34 164.311 35.0824 164.311 36.4177Z"
              fill="white"
            />
          </svg>
        </div>

        {/* ── Centered 404 content ── */}
        <div className="e3di-center" style={styles.center}>
          <h1 className="e3di-heading" style={styles.heading}>
            404
          </h1>
          <hr className="e3di-divider" style={styles.divider} aria-hidden="true" />
          <p className="e3di-message" style={styles.message}>
            The path may be broken, but the journey isn't. Let's get you back.
          </p>
        </div>
      </main>
    </>
  );
}
