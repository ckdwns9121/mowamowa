# Orbit pet collection

17 selectable characters, each with an editable Rive artboard and Idle, Focus, Break, Celebrate, and React timelines. The `Pet` state machine reads the `PetState.mood` number: 0–4 in that order. Acting transitions blend for 110 ms; idle/focus/break transitions blend for 220 ms.

## Artwork and scope

- Character names/roster: [official anime character introduction](https://www.anime-chiikawa.jp/chara.html), [official English introduction](https://www.chiikawaofficial.com/characters), and the cast listing on the anime home page.
- `reference/characters.png` is the unmodified character atlas from https://www.anime-chiikawa.jp/images/characters/img_charapage.png, retrieved 2026-09-23. The 11 principal/friend/armor illustrations are sampled with mesh UVs; the source image is not repainted.
- The four individual Pajama Party members, Anoko, and Ode are separate, code-authored vector interpretations, not official animation assets. Character references: [Anoko](https://chiikawamarket.jp/collections/anoko), [Ode](https://chiikawamarket.jp/collections/ode).
- Original characters and supplied reference artwork: © Nagano / Chiikawa production committee. No affiliation or official asset license is implied. Motion rigs, application code, and supplemental vector drawings are authored for this project.
- This is the named introduction/cast roster (17 selectable entries), not a claim to include every unnamed/background creature in the manga.

## Rebuild

Use Rive CLI **1.3.0** (`brew install --cask rive-app/tap/rive-cli`; earlier builds used 1.1.1). No Rive account, scripts, publishing, or external runtime requests are required.

```sh
python3 scripts/build-pets.py
rive assets/pets --verify
rive inspect assets/pets --summary
rive assets/pets --once
cp assets/pets/build/pets.riv public/pets/chiikawa-pets.riv
```

`src/entities/pet/model/catalog.json` defines labels, groups, artwork crop coordinates, and motion personalities. `scripts/build-pets.py` creates deterministic `scene.rml` and the six matching SVG fallback portraits. Commit the source, atlas, and runtime export together.

Motion revision 3 keeps the connected atlas silhouettes rigid. Bitmap arms, heads and feet are **not** independent artwork, so they do not receive separate joint weights or rotations. Their greeting consists of a blink, gaze shift and small ear response. Only limited ear/tail influences remain away from the torso. Original eye textures are independently animated over color-matched patches.

The six vector drawings have genuinely separate hand/head/eye shapes and may use their own pivots. `pet_motion.py` keeps anticipation, held poses, the Usagi jumps, Momonga float, and independent held-object animations. Atlas arm stretching and body bending are disabled in every state, including idle/focus/break/celebration. More elaborate arm acting would require separately redrawn arm/body layers.

Only the active preview and visible mascots animate; list thumbnails are static. Reduced motion uses the matching static portrait, and loading/error states keep the same portrait visible. Selection is persisted independently of the focus timer.

## Rakko click performance

Rakko's React state jumps and makes five rapid upright 360-degree turns in 40 frames (~0.67 s). Eight discrete directions use the approved original front plus seven independently drawn side, diagonal and rear views. Hold interpolation selects exactly one direction; every drawing retains its aspect ratio. The jump pivot never rotates in the screen plane.

The source front artwork is unchanged. Wind ribbons, a landing ring and six sparks are separate Rive shapes. Chiikawa and Hachiware also have click performances (below); the remaining characters retain their previous timelines. `src/entities/pet/model/pet-action.json` owns every click performance's duration (Rakko: 90 frames at 60 fps), the Rakko spin timing, and the UI settling/replay gap. The app queues at most one replay and never changes timer data when the Rakko avatar is clicked.


Directional artwork: `turnaround/rakko-eight-views.png` was generated with ImageGen from the approved front reference, then refined for direction and scar consistency. Its generated front cell is unused. `rakko-views.json` records the atlas hash, UV crops and foot/head alignment, reproducible with `uv run --with pillow python scripts/inspect-rakko-turnaround.py`. The source PNG is unmodified. This is an eight-view 2D animation, not a 3D model.

Rakko's Idle loop also includes a short sword kata (frames 150–296 of 420): it draws the sword, makes two quick cuts with a small lunge and a slash arc, then sheathes it. The sword pivots at the grip because the atlas arms are welded to the body.

The click effect also adds three staggered peripheral light trails, eight expanding glints, and a delayed cyan landing shockwave. All effect nodes are hidden in non-React states and fade out before the action ends.

## Chiikawa and Hachiware click performances

Both keep the original atlas artwork and its rigid-silhouette rule: the body root only translates and leans as one piece (no squash, no separated limbs), plus ear bones and the independent eyes.

- **Chiikawa** (120 frames): crouch, startled jump with flicked ears, a pink exclamation mark and surprise strokes, a shaky landing, eyes squeezed shut with four falling tears, then a shy lean back to rest.
- **Hachiware** (132 frames): sings with closed eyes, leaning and stepping left/right with a small hop on each beat while ears alternate; four coloured music notes rise from beside the face.

All effect nodes are separate Rive shapes inside the body root, hidden in every non-React timeline. The app plays them through the same one-replay queue as Rakko.

## Subjugation weapon kata (Chiikawa, Hachiware, Usagi)

During the Idle loop (frames ~230–380 of 420) each pulls out a subjugation weapon with a pop, acts, and puts it away. The weapons are separate vector drawings (a sasumata for Chiikawa and Hachiware, a staff for Usagi) that pivot at a gripping paw drawn over the welded atlas paw; the body still only moves rigidly. Chiikawa thrusts twice with a nervous sweat drop, Hachiware sweeps an arc then poses with sparkles, and Usagi twirls the staff three times overhead then slams it down with a shockwave and dust. Weapons and effects are hidden in every non-Idle timeline and stay within the 256 px artboard.

## Click performances for the rest of the cast

Every character now owns a React performance (durations in `src/entities/pet/model/pet-action.json`). Effects are data in `scripts/pet_performances.py` (`pop` effects rise/drift and fade, `drop` effects fall and stack) and are separate Rive shapes inside the body root, hidden outside React. Body motion lives in `REACTIONS` in `scripts/pet_motion.py`: atlas characters move rigidly with ears, tail, eyes and props; the six vector characters also move their separately drawn arms, head and feet.
