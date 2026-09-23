import { describe, expect, test } from "bun:test";
import { readFileSync, existsSync } from "node:fs";
import { PETS, DEFAULT_PET_ID, filterPets, getPet, petMoodValue } from "./pet";

describe("pet collection", () => {
  test("ships every named selection with unique art and a valid fallback", () => {
    expect(PETS).toHaveLength(17);
    expect(new Set(PETS.map((pet) => pet.id)).size).toBe(17);
    expect(filterPets("friends", "")).toHaveLength(8);
    expect(filterPets("armor", "")).toHaveLength(3);
    expect(filterPets("pajamas", "")).toHaveLength(4);
    expect(filterPets("neighbors", "")).toHaveLength(2);
    for (const pet of PETS) {
      if (pet.crop) {
        const [x,y,w,h] = pet.crop;
        expect(x).toBeGreaterThanOrEqual(0); expect(y).toBeGreaterThanOrEqual(0);
        expect(w).toBeGreaterThan(0); expect(h).toBeGreaterThan(0);
        expect(x+w).toBeLessThanOrEqual(3766); expect(y+h).toBeLessThanOrEqual(463);
      } else expect(existsSync(`public/pets/${pet.id}.svg`)).toBe(true);
    }
  });
  test("saved unknown IDs recover and search respects Korean aliases and groups", () => {
    expect(getPet("removed-character").id).toBe(DEFAULT_PET_ID);
    expect(getPet(null).id).toBe(DEFAULT_PET_ID);
    expect(filterPets("all", "카니").map((pet) => pet.id)).toEqual(["furuhonya"]);
    expect(filterPets("armor", "우사기")).toEqual([]);
    expect(filterPets("all", " USAGI ").map((pet) => pet.id)).toEqual(["usagi"]);
  });
  test("paused focus, breaks, celebrations and reactions map to separate Rive states", () => {
    expect(petMoodValue("focus", false)).toBe(0);
    expect(petMoodValue("focus", true)).toBe(1);
    expect(petMoodValue("break", false)).toBe(2);
    expect(petMoodValue("done", false)).toBe(3);
    expect(petMoodValue("react", false)).toBe(4);
  });
  test("acting rigs keep torso volume and use real joints and separate eyes", () => {
    const source = readFileSync("assets/pets/scene.rml", "utf8");
    expect((source.match(/<RootBone /g) ?? []).length).toBeGreaterThan(0);
    expect(source.match(/<RootBone[^>]*name="(?:left|right|head|stepL|stepR)"/g)).toBeNull();
    expect((source.match(/<Skin /g) ?? []).length).toBe(11);
    expect((source.match(/name="Original eye, independent blink and gaze"/g) ?? []).length).toBe(16);
    const roots = [...source.matchAll(/<Node id="([^"]+)" name="Body root"/g)].map((match) => match[1]);
    expect(roots).toHaveLength(17);
    for (const id of roots) {
      const tracks = [...source.matchAll(new RegExp(`<KeyedObject[^>]*objectId="${id}"[^>]*>([\\s\\S]*?)<\\/KeyedObject>`, "g"))];
      for (const track of tracks) {
        if (!/propertyKey="1[67]"/.test(track[1])) continue;
        for (const value of track[1].matchAll(/<KeyFrameDouble[^>]*value="([^"]+)"/g)) expect(Number(value[1])).toBe(1);
      }
    }
  });
  test("runtime export is real Rive and all artboards own five timelines", () => {
    const binary = readFileSync("public/pets/chiikawa-pets.riv");
    expect(binary.subarray(0,4).toString()).toBe("RIVE");
    const source = readFileSync("assets/pets/scene.rml", "utf8");
    const boards = [...source.matchAll(/<Artboard\b[^>]*name="([^"]+)"[^>]*>([\s\S]*?)<\/Artboard>/g)];
    expect(boards.map((match) => match[1])).toEqual(PETS.map((pet) => pet.id));
    for (const board of boards) {
      const animations = [...board[2].matchAll(/<LinearAnimation\b[^>]*name="([^"]+)"/g)].map((match) => match[1]);
      expect(animations).toEqual(["Idle", "Focus", "Break", "Celebrate", "React"]);
    }
    expect(source.includes("ScriptAsset")).toBe(false);
  });
});
