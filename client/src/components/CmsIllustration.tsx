/**
 * Login illustration — a stylised CMS workspace, drawn as vector so it inherits the
 * design tokens, stays sharp at any density, and costs bytes instead of kilobytes.
 * Composed to sit on the dark sign-in panel.
 */
export default function CmsIllustration({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 440 340"
      role="img"
      aria-label="Ilustrasi panel CMS: jendela ruang kerja dengan metrik, daftar konten, dan gembok akses"
      focusable="false"
    >
      <defs>
        <clipPath id="cms-card">
          <rect x="70" y="70" width="300" height="192" rx="18" />
        </clipPath>
      </defs>

      {/* Rainbow rising behind the workspace */}
      <g fill="none" strokeWidth="9" strokeLinecap="round" opacity=".9">
        <path d="M14 300a46 46 0 0 1 92 0" stroke="var(--purple-40)" />
        <path d="M26 300a34 34 0 0 1 68 0" stroke="var(--pink-40)" />
        <path d="M38 300a22 22 0 0 1 44 0" stroke="var(--lime-20)" />
      </g>

      {/* Stacked window hinted behind the main card */}
      <rect x="98" y="50" width="276" height="30" rx="13" fill="var(--lightest)" opacity=".16" />

      {/* Main workspace card */}
      <rect x="70" y="70" width="300" height="192" rx="18" fill="var(--lightest)" />
      <g clipPath="url(#cms-card)">
        {/* sidebar */}
        <rect x="70" y="94" width="74" height="168" fill="var(--purple-5)" />
        <rect x="84" y="110" width="46" height="7" rx="3.5" fill="var(--purple-40)" />
        <rect x="84" y="126" width="38" height="6" rx="3" fill="var(--cool-10)" />
        <rect x="84" y="142" width="44" height="6" rx="3" fill="var(--cool-10)" />
        <rect x="84" y="158" width="34" height="6" rx="3" fill="var(--cool-10)" />

        {/* heading */}
        <rect x="158" y="108" width="104" height="10" rx="5" fill="var(--ink)" />
        <rect x="158" y="126" width="66" height="6" rx="3" fill="var(--cool-10)" />

        {/* metric chips */}
        <g>
          <rect x="158" y="144" width="64" height="40" rx="9" fill="var(--teal-5)" />
          <rect x="167" y="154" width="24" height="8" rx="4" fill="var(--teal-50)" />
          <rect x="167" y="168" width="38" height="4" rx="2" fill="var(--teal-20)" />

          <rect x="228" y="144" width="64" height="40" rx="9" fill="var(--pink-5)" />
          <rect x="237" y="154" width="24" height="8" rx="4" fill="var(--pink-50)" />
          <rect x="237" y="168" width="30" height="4" rx="2" fill="var(--pink-20)" />

          <rect x="298" y="144" width="64" height="40" rx="9" fill="var(--yellow-5)" />
          <rect x="307" y="154" width="24" height="8" rx="4" fill="var(--yellow-50)" />
          <rect x="307" y="168" width="34" height="4" rx="2" fill="var(--yellow-20)" />
        </g>

        {/* content rows */}
        <g>
          <circle cx="168" cy="204" r="7" fill="var(--purple-10)" />
          <rect x="182" y="201" width="132" height="6" rx="3" fill="var(--cool-10)" />
          <circle cx="352" cy="204" r="3.5" fill="var(--green-40)" />

          <circle cx="168" cy="226" r="7" fill="var(--teal-10)" />
          <rect x="182" y="223" width="104" height="6" rx="3" fill="var(--cool-10)" />
          <circle cx="352" cy="226" r="3.5" fill="var(--green-40)" />

          <circle cx="168" cy="248" r="7" fill="var(--pink-10)" />
          <rect x="182" y="245" width="120" height="6" rx="3" fill="var(--cool-10)" />
          <circle cx="352" cy="248" r="3.5" fill="var(--yellow-30)" />
        </g>

        {/* window chrome */}
        <line x1="70" y1="94" x2="370" y2="94" stroke="var(--cool-10)" strokeWidth="1.5" />
        <circle cx="88" cy="82" r="3.5" fill="var(--red-40)" />
        <circle cx="99" cy="82" r="3.5" fill="var(--yellow-30)" />
        <circle cx="110" cy="82" r="3.5" fill="var(--green-40)" />
      </g>

      {/* Access badge — a padlock sticker on the corner */}
      <g>
        <circle cx="374" cy="62" r="25" fill="var(--accent)" />
        <path d="M367 57a7 7 0 0 1 14 0v4" fill="none" stroke="var(--lightest)" strokeWidth="3" strokeLinecap="round" />
        <rect x="363" y="61" width="22" height="17" rx="5" fill="var(--lightest)" />
        <circle cx="374" cy="69.5" r="2.6" fill="var(--accent)" />
      </g>

      {/* Loose marks */}
      <g stroke="var(--lime-20)" strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M36 96v14M29 103h14" />
      </g>
      <circle cx="416" cy="150" r="7" fill="none" stroke="var(--teal-30)" strokeWidth="3" />
      <circle cx="30" cy="200" r="5" fill="var(--pink-30)" />
      <rect x="404" y="236" width="14" height="14" rx="4.5" fill="var(--purple-30)" transform="rotate(18 411 243)" />
    </svg>
  );
}
