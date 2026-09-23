# Orbit pet collection

17 selectable characters, each with an editable Rive artboard and Idle, Focus, Break, Celebrate, and React timelines. The `Pet` state machine reads the `PetState.mood` number: 0–4 in that order. Acting transitions blend for 110 ms; idle/focus/break transitions blend for 220 ms.

## Artwork and scope

- Character names/roster: [official anime character introduction](https://www.anime-chiikawa.jp/chara.html), [official English introduction](https://www.chiikawaofficial.com/characters), and the cast listing on the anime home page.
- `reference/characters.png` is the unmodified character atlas from https://www.anime-chiikawa.jp/images/characters/img_charapage.png, retrieved 2026-09-23. The 11 principal/friend/armor illustrations are sampled with mesh UVs; the source image is not repainted.
- The four individual Pajama Party members, Anoko, and Ode are separate, code-authored vector interpretations, not official animation assets. Character references: [Anoko](https://chiikawamarket.jp/collections/anoko), [Ode](https://chiikawamarket.jp/collections/ode).
- Original characters and supplied reference artwork: © Nagano / Chiikawa production committee. No affiliation or official asset license is implied. Motion rigs, application code, and supplemental vector drawings are authored for this project.
- This is the named introduction/cast roster (17 selectable entries), not a claim to include every unnamed/background creature in the manga.

## Rebuild

Use Rive CLI **1.1.1**. No Rive account, scripts, publishing, or external runtime requests are required.

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
