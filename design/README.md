# Design

Three files, drawn from the flow as it is actually built rather than from an early sketch that has since drifted.

| File           | What it is                                                                                                                                                                                                   |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `akis.svg`     | The end-to-end flow, including the branches that are easy to leave out: the age gate, the one skippable step, a step that fails to save, a session that ends mid-flow, and the interrupted-and-resumed path. |
| `ekranlar.svg` | The nine screens plus the completion screen, and the three states that are easy to miss: keyboard open, a server error, and an upload in progress.                                                           |
| `tokens.svg`   | Colour roles in both variants, the type scale, spacing, corner radii, the two shadow levels and the motion durations.                                                                                        |

The sketches are annotated in Turkish because the product is in Turkish, and the copy in them is the product's own copy rather than placeholder text. It is wrapped to fit a drawing, so a sentence may break across lines where the dictionary keeps it whole. Reading a sketch next to the running app should not require translating between them.

Dark is drawn as the primary variant, which is how the app ships. The light variant is fully defined in the token sheet.

The flow diagram is worth reading before the screens. Most of the interesting decisions are in the branches, not in the happy path — where the flow refuses to continue, where it continues anyway despite a failure, and where it hands control back to the user.
