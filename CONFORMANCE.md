# WCAG 2.2 AA conformance

This table is for the LE HULUM player, the sample lesson pages, the job card, and the HTML document. It is a self-review. A co-designer has not yet completed an unaided pass with NVDA or TalkBack on the new controls. axe-core was not re-run after those controls were added.

| WCAG 2.2 AA criterion | Supports / Partly / Does not | Notes |
| --- | --- | --- |
| 1.1.1 Non-text Content | Partly | On-screen code and output have text in `screen.json`, in the HTML document, and in the PDF. Sign clips are named in the glossary. A line with no clip shows its letters. |
| 1.2.1 Audio-only and Video-only (Prerecorded) | Supports | The lesson has a transcript and captions. |
| 1.2.2 Captions (Prerecorded) | Supports | Amharic and English WebVTT. The learner can resize and recolour them. A pair under 4.5:1 is refused. |
| 1.2.3 Audio Description or Media Alternative (Prerecorded) | Partly | Five description cues cover the editor, the code, the output, and the error. They do not describe every frame. |
| 1.2.5 Audio Description (Prerecorded) | Partly | Same cues. The lesson pauses when a description would be covered by the next caption. |
| 1.3.1 Info and Relationships | Partly | The HTML document uses headings, paragraphs, and figures. The PDF is untagged. |
| 1.3.2 Meaningful Sequence | Supports | Captions, transcript, and the text lesson follow lesson order. |
| 1.4.3 Contrast (Minimum) | Supports | Caption presets are checked at 4.5:1. The player uses a visible focus ring. |
| 1.4.4 Resize Text | Supports | Caption size runs from 75% to 300%. Page content uses relative units. |
| 1.4.10 Reflow | Partly | The player wraps controls. The Savanna page keeps its own layout. |
| 1.4.11 Non-text Contrast | Supports | Controls and the focus ring use the player tokens. |
| 2.1.1 Keyboard | Supports | Play, seek, captions, sign, transcript, description, hearing, and the job card are buttons or links. |
| 2.1.2 No Keyboard Trap | Supports | The help dialog has a close button. Panels stay in the page. |
| 2.4.3 Focus Order | Supports | Controls follow the control order, then the open panel. |
| 2.4.7 Focus Visible | Supports | A 3px outline is on buttons, the seek bar, and panel controls. |
| 2.5.8 Target Size (Minimum) | Supports | Player buttons are at least 44 by 44 CSS pixels. |
| 3.1.1 Language of Page | Supports | Pages set `lang`. Amharic runs set `lang="am"`. |
| 3.1.2 Language of Parts | Supports | The second caption language and Amharic job text are marked. |
| 3.3.2 Labels or Instructions | Supports | The certificate form and the job form label each field. |
| 4.1.2 Name, Role, Value | Supports | Buttons expose pressed state. The transcript marks the current line. |
| 4.1.3 Status Messages | Supports | Play, seek, copy, offline, and description use live regions. |
