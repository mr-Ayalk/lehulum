# LE HULUM design notes

Source files (Claude Design export, moved here with `git mv`; filenames kept because `support.js` loads `Name.dc.html`):

- `LE HULUM Tokens and Components.dc.html` — tokens, type, spacing, buttons, switch, slider, dialog, badge, card, panel, and the CSS custom-property block.
- `LE HULUM Demo Site.dc.html` — pages 1–4 and certificate 4b, at 1280px and 360px.
- `LE HULUM Player States.dc.html` — player states A–I, laptop 1040px and mobile 360px.
- `LE HULUM App.dc.html` — the interactive prototype (same pages, plus theme and language controls).
- `SiteHeader.dc.html`, `PlayerControls.dc.html`, `lehulum-data.js` — header, control bar, and the string/token data the canvases use.
- `support.js` — Design Canvas runtime only. It does not define product tokens.
- `.thumbnail` — a WebP preview of the canvas, not a logo.

The logo is not an image. It is a 32×32 square, radius 8px, filled with the accent, with a 12px circle of the page background in the middle. `LE HULUM` is letter-spaced `.04em`. The Amharic `ለሁሉም` under it is not.

## Design tokens

Spacing is a 4px base, stored as rem at a 16px root: `--lh-space-1` 0.25rem (4px) through `--lh-space-10` 4rem (64px): 4, 8, 12, 16, 20, 24, 32, 40, 48, 64.

Radius: `--lh-radius-sm` 4px, `--lh-radius-md` 8px, `--lh-radius-lg` 12px, `--lh-radius-pill` 999px.

Shadow: dialog `--lh-shadow-dialog` `0 12px 32px rgba(0,0,0,.25)`. High contrast drops the shadow and uses a white border.

Targets: 44px minimum, 48px comfortable, 52px primary actions, 56px player-bar buttons.

Focus in the design: `outline: 2px solid transparent` plus `box-shadow: 0 0 0 2px <background>, 0 0 0 5px <focus>` (2px gap, 3px ring). On the player bar the ring is `#FFD54A`, and in high contrast `#00E5FF`. See Accessibility deviations — the built pages use a 3px outline with a 2px offset instead.

Fonts: `--lh-font-latin` Atkinson Hyperlegible; `--lh-font-ethiopic` Noto Sans Ethiopic, then Abyssinica SIL, Nyala; `--lh-font-code` JetBrains Mono. All three are SIL Open Font License. Files are local `.woff2` in `demo/fonts/` and `module/fonts/`. No font CDN.

Type scale (Latin / Ethiopic): display 64/1.05/700 and 40/1.3/600; h1 40/1.15/700 and 34/1.45/600; h2 28/1.2/700 and 26/1.5/600; h3 22/1.3/700 and 21/1.55/600; body large 20/1.6 and 19/1.8; body 17/1.55 and 17/1.75; small 15/1.45 and 16/1.7; label 13/1.2 and 13/1.4. Ethiopic line-height stays at least 1.7. Ethiopic text is never uppercased and never letter-spaced. The home hero uses 64px for the English line and 30px/1.6/600 for the Amharic line.

### Light (`:root` and `data-theme="light"`)

| Token | Value |
| --- | --- |
| `--lh-bg` | `#FAF8F3` |
| `--lh-surface` | `#FFFFFF` |
| `--lh-surface-2` | `#F1EDE4` |
| `--lh-text` | `#1C1B18` |
| `--lh-text-muted` | `#57534A` |
| `--lh-border` | `#8A8478` |
| `--lh-line` | `#D9D3C7` |
| `--lh-accent` / `--lh-color-primary` | `#0A6B4E` |
| `--lh-accent-hover` | `#085A41` |
| `--lh-on-accent` | `#FFFFFF` |
| `--lh-highlight` | `#FFE38A` |
| `--lh-on-highlight` | `#1C1B18` |
| `--lh-danger` | `#B3261E` |
| `--lh-focus` | `#1C1B18` |
| `--lh-code-bg` / `--lh-code-text` | `#1C1B18` / `#F3F0E8` |
| `--lh-scrim` | `rgba(28,27,24,.6)` |

The player bar stays dark on a light page: `--lh-player-bg` `#14130F`, text `#F3F0E8`, border `#8C8678`, accent `#62D6AA`, on-accent `#0B2219`, track `#2A2721`, muted `#BDB7AA`, focus `#FFD54A`.

Captions (later): background `rgb(0 0 0 / .88)`, text `#FFFFFF`, speaker `#FFE38A`.

### Dark (`[data-theme="dark"]`, and `prefers-color-scheme: dark` when no `data-theme`)

Background `#14130F`, surface `#1E1C18`, surface-2 `#2A2721`, text `#F3F0E8`, muted `#BDB7AA`, border `#8C8678`, line `#3A3730`, accent `#62D6AA`, on-accent `#0B2219`, highlight `#F5D76E`, on-highlight `#14130F`, danger `#FF8A80`, focus `#FFD54A`, code background `#0E0D0A`, scrim `rgba(0,0,0,.7)`. Player bar background `#0E0D0A`. Other player colours stay as in light.

### High contrast (`[data-theme="contrast"]`, and `prefers-contrast: more` when no `data-theme`)

Everything is `#000000` or `#FFFFFF`. Accent, highlight, and player accent are `#FFFF00`. On-accent and on-highlight are `#000000`. Danger `#FF8A80`. Focus and player focus `#00E5FF`. Borders and lines are white. Scrim is black.

## Components

Buttons: primary is accent fill, on-accent text, min-height 52px, radius 8px, weight 700. Secondary is surface fill, 1px border, min-height 44px. Hover darkens the border to the text colour. Pressed toggles use fill plus a 3px accent bar, not colour alone, and `aria-pressed`.

Switch: 52×32 pill, 22px thumb. On is accent with a check. Off is a bordered track with a muted thumb. Label says On or Off.

Slider: 6px track, 24px thumb, 44px hit height. Value is written next to the control (percent, or Left / Centre / Right).

Dialog: surface card, radius 12px, 1px border, the dialog shadow, a scrim behind it. Close is a real button. Escape closes it.

Badge: pill, accent fill, on-accent text, used for “Selected”, “Recommended”, “Saved”.

Card: surface, 1px border, radius 12px, padding 22px. Hover adds a 1px inset ring.

Panel: side column (transcript, what’s on screen, chapters) with a 1px divider and a close button of min-height 44px.

Player control bar (`PlayerControls.dc.html`): dark bar. Row 1 is current time, range, duration. Row 2 is buttons with a 16px glyph and a 13px label, min-height 56px, min-width 60px (52px in the compact bar). Full bar: Play, Back 10 s, Fwd 10 s, Speed, Captions, Sign, Transcript, Settings, Keys, Full screen. Compact bar (under about 480px): Play, Back, Fwd, Captions, Sign, More. Focus on the bar is the yellow (or cyan) ring.

Sign window: a bordered region labelled “Automatic sign (beta)”. Laptop floating window is 300px wide with Move, four corners, Smaller, Larger, See-through, and “Was this sign clear?”. Sign-first layout puts the signer large and the lesson small, with “Waiting for signer…” announced as status, plus “Don’t wait — continue” and Swap.

Captions: black at 88% opacity, white text, speaker name in square brackets in `#FFE38A` (not colour alone). An uncertain word has a dotted underline, a boxed “?”, and hidden text “uncertain word”. On mobile, captions sit below the video.

## Pages

Home, 1280: sticky header (logo, Home / Video lesson / Text lesson / Jobs / API docs, language button). Hero is two columns, gap 64px, padding about 72px 80px. Eyebrow, 64px headline, 30px Amharic line, 20px intro, primary “Try the video lesson” and secondary “Read the API docs”. Four cards numbered 01–04. Install section with a wrapping `<pre>` and Copy code. Footer names the hackathon and Savanna.

Home, 360: header is logo, language, and “☰ Menu”. One primary button. Four stacked 56px links instead of the cards. Install shows the script tag.

Video lesson, 1280: breadcrumb, 40px title, 26px Amharic subtitle, then a grid of the stage (about 480px tall) plus a 300px chapter column. Chapters at 0:00, 0:18, and 0:42; the current row is highlight fill with a 4px bar. Links: “Read as text lesson” and “↓ Download light lesson (1.5 MB)”. Description under the player.

Video lesson, 360: title about 26px, stage about 203px, captions under the video, compact controls, fewer chapter rows.

Text lesson, 1280: same title block, a sticky four-button toolbar (Sign, Listen, Translate, Download), the lesson column, and a 280px sign window. The active sentence is highlight fill with a 4px bar. 360 is a single column.

Jobs, 1280: title “Jobs” / “ሥራዎች”, three job cards (listen, signed gloss, apply), then a certificate block (page 4b) with a code and a verify field. 360 stacks the cards.

There is no separate sign-try artboard. State C is the closest frame: “Automatic sign (beta) · EthSL”.

## Player states (not built now)

- A — first open: Sign, Listen, Read, Save data. Laptop is four columns; mobile is a stacked Amharic list. Start lesson / Use default settings.
- B — captions on, focus on Captions. Laptop captions over the video; mobile captions below it.
- C — sign-first, waiting for the signer, lesson paused, swap control.
- D — lesson-first floating sign window, see-through 70%, corner buttons, clear / not clear.
- E — transcript panel (light host) and the sign-glossary dialog for “variable”.
- F — “What’s on screen” panel (dark host), code with line numbers, Copy code.
- G — Settings: captions, hearing, audio description, display, shortcut switch.
- H — slow connection: light lesson / video / text only, download progress, saved offline.
- I — audio-description moment in high contrast, video paused, Skip / Replay / Show code.

Also later, from the app prototype: offline empty state, certificate page 4b, and the More overflow menu. Job cards and automatic sign are later too. This step only frames those pages.

## What this step builds

Home, video lesson (real `<db-player>`), text lesson (14 sentences, player shell where the toolbar is), jobs frame, and sign-try frame. The player shell is restyled (bar, buttons, slider, help dialog, focus). Captions, the sign window, transcript, settings, chapters that seek, job cards, and automatic sign are not implemented.

## Accessibility deviations

| Element | Design | Ours | Reason |
| --- | --- | --- | --- |
| Focus | `box-shadow` ring, `outline: 2px solid transparent` | `outline: 3px solid` with `outline-offset: 2px` | Project rule: a visible 3px outline. Same 3px thickness and 2px gap. Outline is not covered by a child the way a shadow can be. |
| Player bar | Captions, Sign, Transcript, Settings, and More buttons | Those buttons are absent. Mute stays. | Those controls are later steps. Mute is already part of this player. |
| Control labels | 13px | 0.85rem (about 13.6px), line-height 1.4 in Amharic | Keeps the design size. Contrast of the bar text on `#14130F` is about 16:1, so the small label stays readable. |
| Video stage | Fixed 480px (laptop) and 203px (mobile), plus a sign window and caption chip | The real video uses `aspect-ratio: 16/9`. No sign window or caption chip. | A fixed height overflows a 360px screen once the header is included. Sign and captions are later steps. |
| Download light lesson | A button on the video page | Omitted | The file and the download flow are state H, a later step. “Read as text lesson” is a real link. |
| Text toolbar | Sign, Listen, Translate, Download | The current player shell sits in that spot | The user asked for the shell there, and not those later actions. |
| Jobs | Three cards and a certificate | The sentence “Job cards arrive in a later step” | Job cards are a later step. |
| Sign try | No dedicated page; state C is a player layout | Page frame plus “Automatic sign arrives in Step 5” | Automatic sign is Step 5. |
| Theme button | On the app header, not on the static artboard header | Included, labelled Light / Dark / High contrast | Themes have to be switchable for the dark and contrast checks. |
| Source code | A link | Text only | This repo has no remote URL. A dead link would be worse. |
| Chapters | Buttons that seek | Links to `#player`, current row styled | Seeking by chapter is a later player feature. The highlight still marks the current row, not by colour alone (weight and a 4px bar). |

## Remaining visual differences

- The home header includes the theme button, so it is wider than the artboard header.
- The video page has no sign window, no caption overlay, and no download button.
- The text page shows the player shell (including its video area) instead of the four-button toolbar and the sign column, and it shows all 14 course sentences plus the English article rather than the design’s shorter sample.
- Jobs and sign-try are frames with the placeholder sentences, not the card layouts.
- The player bar wraps extra controls instead of hiding them behind More, so 360px uses two rows. Mute is an extra button.
- The install sample is the design’s CDN snippet as text. The page itself loads `/module/db-player.js` and does not request the CDN.
