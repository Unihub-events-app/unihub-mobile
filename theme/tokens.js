export const palette = {
  // Brand
  lime:         "#C8E630",
  limeDark:     "#A8C420",
  limeSoft:     "#D8F040",
  limeTint10:   "rgba(200,230,48,0.10)",
  limeTint18:   "rgba(200,230,48,0.18)",
  limeTint30:   "rgba(200,230,48,0.30)",

  // Section identity accents
  violet:       "#7C3AED",
  violetLight:  "#A78BFA",
  violetSoft:   "#EDE9FE",
  violetTint:   "rgba(124,58,237,0.12)",

  coral:        "#F97316",
  coralLight:   "#FB923C",
  coralSoft:    "#FFF7ED",
  coralTint:    "rgba(249,115,22,0.12)",

  amber:        "#F59E0B",
  amberLight:   "#FBD24A",
  amberSoft:    "#FFFBEB",
  amberTint:    "rgba(245,158,11,0.12)",

  sky:          "#0EA5E9",
  skyLight:     "#38BDF8",
  skySoft:      "#F0F9FF",
  skyTint:      "rgba(14,165,233,0.12)",

  // Semantic
  green:        "#22C55E",
  greenLight:   "#4ADE80",
  greenTint:    "rgba(34,197,94,0.12)",
  red:          "#EF4444",
  redLight:     "#F87171",
  redTint:      "rgba(239,68,68,0.12)",
  orange:       "#F59E0B",
  orangeLight:  "#FBD24A",

  // Neutral scale
  ink:          "#0F0F0D",
  ink90:        "#1A1A14",
  ink80:        "#2A2A20",
  ink60:        "#4A4A38",
  ink40:        "#7A7A62",
  ink20:        "#B0AF98",
  ink10:        "#D8D7C4",
  paper:        "#F5F4EC",
  white:        "#FFFFFF",
};

export const spacing = {
  xs:      4,
  sm:      8,
  md:      12,
  lg:      16,
  xl:      20,
  xxl:     28,
  xxxl:    40,
  page:    18,
  section: 32,
};

export const radius = {
  xs:   6,
  sm:   10,
  md:   16,
  lg:   20,
  xl:   28,
  xxl:  36,
  full: 9999,
};

export const elevation = {
  flat:   { shadowOpacity: 0,    elevation: 0 },
  card:   { shadowOffset: { width: 0, height: 4  }, shadowOpacity: 0.07, shadowRadius: 16, elevation: 4  },
  modal:  { shadowOffset: { width: 0, height: 8  }, shadowOpacity: 0.14, shadowRadius: 28, elevation: 10 },
  nav:    { shadowOffset: { width: 0, height: 8  }, shadowOpacity: 0.20, shadowRadius: 24, elevation: 12 },
  button: { shadowOffset: { width: 0, height: 4  }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 5  },
};

export const springs = {
  snappy: { damping: 20, stiffness: 400 },
  smooth: { damping: 22, stiffness: 280 },
  bouncy: { damping: 14, stiffness: 260 },
  gentle: { damping: 28, stiffness: 200 },
};

export const themes = {
  light: {
    mode: "light",
    colors: {
      // Surfaces
      background:       palette.paper,
      backgroundAlt:    "#EDECDF",
      surface:          palette.white,
      surfaceMuted:     "#F2F1E8",
      surfaceElevated:  "#FAFAF5",
      surfaceGlass:     "rgba(255,255,255,0.85)",

      // Borders
      border:           "rgba(0,0,0,0.07)",
      borderStrong:     "rgba(0,0,0,0.13)",
      borderBrand:      "rgba(200,230,48,0.40)",

      // Text
      text:             palette.ink90,
      textMuted:        palette.ink60,
      textSubtle:       palette.ink40,
      textOnBrand:      palette.ink90,
      textOnDark:       palette.paper,
      textOnAccent:     palette.white,

      // Brand
      brand:            palette.lime,
      brandStrong:      palette.limeDark,
      brandSoft:        palette.limeSoft,
      brandTint:        palette.limeTint18,

      // Section accents
      accentCommunity:  palette.violet,
      accentCommunityTint: palette.violetTint,
      accentLibrary:    palette.coral,
      accentLibraryTint: palette.coralTint,
      accentWallet:     palette.amber,
      accentWalletTint: palette.amberTint,
      accentProfile:    palette.sky,
      accentProfileTint: palette.skyTint,

      // Semantic
      success:          palette.green,
      successTint:      palette.greenTint,
      warning:          palette.orange,
      error:            palette.red,
      errorTint:        palette.redTint,

      // Navigation
      navSurface:       palette.ink90,
      navActive:        palette.lime,
      navText:          "rgba(245,244,236,0.45)",
      navTextActive:    palette.ink90,

      // Shadows
      shadow:           "rgba(0,0,0,0.06)",
      shadowMedium:     "rgba(0,0,0,0.10)",
      shadowStrong:     "rgba(0,0,0,0.16)",
      overlay:          "rgba(15,15,13,0.52)",
    },
  },
  dark: {
    mode: "dark",
    colors: {
      // Surfaces
      background:       palette.ink,
      backgroundAlt:    palette.ink90,
      surface:          "#1C1C18",
      surfaceMuted:     "#242420",
      surfaceElevated:  "#2C2C26",
      surfaceGlass:     "rgba(28,28,24,0.85)",

      // Borders
      border:           "rgba(255,255,255,0.07)",
      borderStrong:     "rgba(255,255,255,0.12)",
      borderBrand:      "rgba(200,230,48,0.25)",

      // Text
      text:             "#F5F4EC",
      textMuted:        palette.ink20,
      textSubtle:       palette.ink40,
      textOnBrand:      palette.ink90,
      textOnDark:       "#F5F4EC",
      textOnAccent:     palette.white,

      // Brand
      brand:            palette.lime,
      brandStrong:      palette.limeDark,
      brandSoft:        palette.limeSoft,
      brandTint:        palette.limeTint10,

      // Section accents
      accentCommunity:  palette.violetLight,
      accentCommunityTint: palette.violetTint,
      accentLibrary:    palette.coralLight,
      accentLibraryTint: palette.coralTint,
      accentWallet:     palette.amberLight,
      accentWalletTint: palette.amberTint,
      accentProfile:    palette.skyLight,
      accentProfileTint: palette.skyTint,

      // Semantic
      success:          palette.greenLight,
      successTint:      "rgba(74,222,128,0.12)",
      warning:          palette.orangeLight,
      error:            palette.redLight,
      errorTint:        "rgba(248,113,113,0.12)",

      // Navigation
      navSurface:       "#0C0C0A",
      navActive:        palette.lime,
      navText:          "rgba(255,255,255,0.38)",
      navTextActive:    palette.ink90,

      // Shadows
      shadow:           "rgba(0,0,0,0.30)",
      shadowMedium:     "rgba(0,0,0,0.44)",
      shadowStrong:     "rgba(0,0,0,0.60)",
      overlay:          "rgba(8,8,6,0.75)",
    },
  },
};

export const themeNames = ["light", "dark", "system"];
export const defaultTheme = "system";
export const themeStorageKey = "unihub_mobile_theme_mode";
