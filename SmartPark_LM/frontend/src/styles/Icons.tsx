const ICON_WIDTH = 18;
const ICON_HEIGHT = 18;
const ICON_STROKE = 1.5;

const iconProps = {
  width: ICON_WIDTH,
  height: ICON_HEIGHT,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: ICON_STROKE,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const dashboard_icon = () => (
  <svg {...iconProps}>
    <path d="M2 3h20" />
    <path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" />
    <path d="m7 21 5-5 5 5" />
  </svg>
);

export const parking_icon = () => (
  <svg {...iconProps}>
    <path d="m21 8-2 2-1.5-3.7A2 2 0 0 0 15.646 5H8.4a2 2 0 0 0-1.903 1.257L5 10 3 8" />
    <path d="M7 14h.01" />
    <path d="M17 14h.01" />
    <rect width="18" height="8" x="3" y="10" rx="2" />
    <path d="M5 18v2" />
    <path d="M19 18v2" />
  </svg>
);

export const heatmap_icon = () => (
  <svg {...iconProps}>
    <path d="M12 3q1 4 4 6.5t3 5.5a1 1 0 0 1-14 0 5 5 0 0 1 1-3 1 1 0 0 0 5 0c0-2-1.5-3-1.5-5q0-2 2.5-4" />
  </svg>
);

export const reports_icon = () => (
  <svg {...iconProps}>
    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <path d="M12 11h4" />
    <path d="M12 16h4" />
    <path d="M8 11h.01" />
    <path d="M8 16h.01" />
  </svg>
);

export const qrcode_icon = () => (
  <svg {...iconProps}>
    <path d="M17 12v4a1 1 0 0 1-1 1h-4" />
    <path d="M17 3h2a2 2 0 0 1 2 2v2" />
    <path d="M17 8V7" />
    <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
    <path d="M3 7V5a2 2 0 0 1 2-2h2" />
    <path d="M7 17h.01" />
    <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
    <rect x="7" y="7" width="5" height="5" rx="1" />
  </svg>
);

export const permissions_icon = () => (
  <svg {...iconProps}>
    <path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
    <circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
  </svg>
);

export const vehicle_search_icon = () => (
  <svg {...iconProps}>
    <path d="M21 5H3" />
    <path d="M10 12H3" />
    <path d="M10 19H3" />
    <circle cx="17" cy="15" r="3" />
    <path d="m21 19-1.9-1.9" />
  </svg>
);

export const system_settings_icon = () => (
  <svg {...iconProps}>
    <path d="M10.584 21H5a2 2 0 01-2-2v-9a2 2 0 01.709-1.527l7-6a2 2 0 012.582 0l7 6A2 2 0 0121 10.001v.583" />
    <path d="M14 12H10a1 1 0 00-1 1v8" />
    <path d="m14.305 19.53.923-.382" />
    <path d="m15.229 16.852-.924-.383" />
    <path d="m16.852 15.228-.383-.923" />
    <path d="m16.852 20.773-.383.924" />
    <path d="m19.148 15.228.383-.923" />
    <path d="m19.53 21.697-.382-.924" />
    <path d="m20.773 16.852.922-.383" />
    <path d="m20.773 19.148.922.383" />
    <circle cx="18" cy="18" r="3" />
  </svg>
);

export const settings_icon = () => (
  <svg {...iconProps}>
    <path d="M10 15H6a4 4 0 0 0-4 4v2" />
    <path d="m14.305 16.53.923-.382" />
    <path d="m15.228 13.852-.923-.383" />
    <path d="m16.852 12.228-.383-.923" />
    <path d="m16.852 17.772-.383.924" />
    <path d="m19.148 12.228.383-.923" />
    <path d="m19.53 18.696-.382-.924" />
    <path d="m20.772 13.852.924-.383" />
    <path d="m20.772 16.148.924.383" />
    <circle cx="18" cy="15" r="3" />
    <circle cx="9" cy="7" r="4" />
  </svg>
);

export const notifications_icon = () => (
  <svg {...iconProps}>
    <path d="M10.268 21a2 2 0 0 0 3.464 0" />
    <path d="M3.262 15.326A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.673C19.41 13.956 18 12.499 18 8A6 6 0 0 0 6 8c0 4.499-1.411 5.956-2.738 7.326" />
  </svg>
);