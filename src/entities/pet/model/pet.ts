import catalog from "./catalog.json";

export type PetMood = "idle" | "focus" | "break" | "done" | "react";
export type PetGroup = "friends" | "armor" | "pajamas" | "neighbors";
export interface PetCharacter {
  id: string;
  name: string;
  aliases?: string[];
  group: PetGroup;
  description: string;
  accent: string;
  motion: string;
  crop?: number[];
  vector?: string;
}
export const PETS = catalog as PetCharacter[];
export const DEFAULT_PET_ID = "rakko";
export const PET_GROUPS: Array<{ id: PetGroup | "all"; label: string }> = [
  { id: "all", label: "전체" }, { id: "friends", label: "친구들" },
  { id: "armor", label: "갑옷" }, { id: "pajamas", label: "파자마" }, { id: "neighbors", label: "이웃들" },
];
export function getPet(id: unknown): PetCharacter {
  return PETS.find((pet) => pet.id === id) ?? PETS.find((pet) => pet.id === DEFAULT_PET_ID)!;
}
export function petMoodValue(mood: PetMood, running = true): number {
  if (mood === "done") return 3;
  if (mood === "react") return 4;
  if (mood === "break") return 2;
  return mood === "focus" && running ? 1 : 0;
}
export function filterPets(group: PetGroup | "all", query: string): PetCharacter[] {
  const normalized = query.trim().toLocaleLowerCase();
  return PETS.filter((pet) => (group === "all" || pet.group === group)
    && `${pet.name} ${pet.id} ${(pet.aliases ?? []).join(" ")}`.toLocaleLowerCase().includes(normalized));
}
