# CentraLog design palette · phase one

The default green palette represents this DMCCFI school project. These are project UI colors, not a claim that they are official school brand standards. The white and night palettes share the same hierarchy and component behavior. CSS variables in `src/index.css` are the source of truth.

| Use | Signature green (`theme-dmc`) | White (`theme-light`) | Night (`theme-obsidian`) |
| --- | --- | --- | --- |
| Page canvas | `#f3f7f3` | `#f7f8fa` | `#0e1512` |
| Main surface | `#ffffff` | `#ffffff` | `#17221d` |
| Raised surface | `#eaf3ec` | `#f0f3f6` | `#203027` |
| Primary text | `#163d2b` | `#1d2935` | `#f0f6f1` |
| Secondary text | `#51695b` | `#536170` | `#afc4b5` |
| Border | `#c9d9cd` | `#d5dde4` | `#3d5647` |
| Main action | `#176b45` | `#205c48` | `#6fcca1` |
| Action text | `#ffffff` | `#ffffff` | `#102319` |

Use green for actions, focus, and a small number of meaningful highlights. Avoid putting green text on similarly colored pale surfaces or using color as the only status signal. Keep body copy on calm surfaces and reserve the strongest contrast for sign-in, page titles, and workflow actions. Test all three palettes for legibility and focus visibility before extending them to other screens.

## Login design decision

- A minimal form would make sign-in fast, but it would give a first-time reviewer little sense of the procurement and asset workflow.
- A large technical feature splash would show more capabilities, but the former page's security-console language and dense cards obscured the sign-in task. Its message also vanished on smaller screens.
- The chosen layout pairs a short workflow explanation with a calm sign-in panel. On phones, the explanation compresses to the project name, heading, and one paragraph so the form stays close. The risk is that the green introduction can still dominate a very short screen; review the form's visibility and scrolling in the live layout before carrying this pattern to other pages.
