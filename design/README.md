# Design

Three files, drawn from the flow as it is actually built rather than from an early sketch that has since drifted. Where a decision was reversed on a device, the sketch was redrawn to match the reversal rather than left showing the version that lost.

They are sketches, so they abbreviate: a list that has sixteen options may be drawn with twelve, and spacing is indicative. What they do not do is show a behaviour the app does not have.

| File           | What it is                                                                                                                                                                                                                                                                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `akis.svg`     | The end-to-end flow, from the launch sequence and its six-second ceiling on the backdrop to the branches that are easy to leave out: the age gate, the one skippable step, a step that fails to save, a session that ends mid-flow, and the interrupted-and-resumed path. The option sets the server serves are listed at the foot, with their rules. |
| `ekranlar.svg` | Sixteen frames: the launch screen, the two welcome screens, register and login, the six steps with the birth-date wheel drawn as its own frame, the completion screen, and the three states that are easy to miss: keyboard open, a server error, and an upload in progress.                                                                          |
| `tokens.svg`   | Colour roles in both variants, the type scale, spacing, corner radii, the two shadow levels and the motion durations.                                                                                                                                                                                                                                 |

The sketches are annotated in Turkish because the product is in Turkish, and the copy in them is the product's own copy rather than placeholder text. It is wrapped to fit a drawing, so a sentence may break across lines where the dictionary keeps it whole. Reading a sketch next to the running app should not require translating between them.

Dark is drawn as the primary variant, which is how the app ships. The light variant is fully defined in the token sheet, and both sheets themselves are set on the light variant's paper so the phone frames read as objects on a page.

The crimson sweep behind the phone frames stands in for the journey artwork; the artwork itself is not embedded. It carries two things the screens depend on: the band moves across the frame as the flow advances, and every block of text sits on a veil drawn from the background rather than on the image.

The flow diagram is worth reading before the screens. Most of the interesting decisions are in the branches, not in the happy path: where the flow refuses to continue, where it continues anyway despite a failure, and where it hands control back to the user.
