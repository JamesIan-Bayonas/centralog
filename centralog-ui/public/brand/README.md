# CentraLog identity

The mark combines an open **C** with two register lines: school assets and their records held in one place. It is a product identity, not an institutional seal or an indication that an asset has been verified.

## Assets

- `centralog-mark.svg`: master symbol, also rendered by the shared `CentraLogMark` component in the login and workspace headers.
- `centralog-logo.svg`: horizontal wordmark and asset-management descriptor for light backgrounds.
- `centralog-logo-reversed.svg`: light lettering for dark backgrounds.
- `centralog-logo.png`: 1200 × 288 transparent export of the light-background logo.
- `../favicon.svg`: exact copy of the master symbol for browser tabs.
- `../favicon.ico`: 16, 32, and 48px PNG-backed browser fallback.
- `../apple-touch-icon.png`: 180px home-screen icon.

Forest green `#19583A`, white `#FFFFFF`, and mint `#A8E6C4` stay fixed across the three interface themes. The UI wordmark inherits each theme's readable text color. The SVG wordmark uses Inter with Arial/sans-serif fallbacks; the PNG preserves its exported appearance without requiring fonts.

Keep the symbol square, preserve its proportions and clear space of at least one register-line thickness, and use at least 16px for the symbol. At small sizes, omit the descriptor and wordmark rather than squeezing them into the icon. Do not replace action, status, QR, or verification icons with this mark. Existing audit and sticker print layouts deliberately remain unchanged.

If the master symbol changes, update both favicon formats and the touch icon from that same SVG. Keep the symbol geometry in the two horizontal SVGs synchronized, and re-export the PNG. Browser favicon caches may require a refresh after deployment.
