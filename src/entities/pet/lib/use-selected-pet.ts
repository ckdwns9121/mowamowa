import { useEffect, useState } from "react";
import { emit, listen } from "@tauri-apps/api/event";
import { getDatabase } from "../../work-context/api/database";
import { DEFAULT_PET_ID, getPet } from "../model/pet";

const STORAGE_KEY = "orbit.pet-character";
const EVENT = "pet-selection-changed";
const LOCAL_EVENT = "orbit:pet-selection";
let selectionQueue = Promise.resolve();

export async function saveSelectedPet(id: string): Promise<void> {
  const pet = getPet(id);
  if (pet.id !== id) throw new Error("선택한 펫을 찾을 수 없습니다.");
  const operation = selectionQueue.then(async () => {
    const db = await getDatabase();
    await db.execute(`INSERT INTO app_settings(key,value,updated_at) VALUES('pet_character',$1,$2)
      ON CONFLICT(key) DO UPDATE SET value=excluded.value,updated_at=excluded.updated_at`, [pet.id, new Date().toISOString()]);
    localStorage.setItem(STORAGE_KEY, pet.id);
    window.dispatchEvent(new CustomEvent(LOCAL_EVENT, { detail: pet.id }));
    // Storage events and the persisted setting also recover a window that missed this event.
    await emit(EVENT, pet.id).catch(() => undefined);
  });
  selectionQueue = operation.catch(() => undefined);
  return operation;
}

export function useSelectedPet() {
  const [pet, setPet] = useState(() => getPet(localStorage.getItem(STORAGE_KEY) || DEFAULT_PET_ID));
  useEffect(() => {
    let active = true;
    let unlisten: (() => void) | undefined;
    let changed = false;
    const update = (id: unknown) => { if (active) { changed = true; setPet(getPet(id)); } };
    const onLocal = (event: Event) => update((event as CustomEvent<string>).detail);
    const onStorage = (event: StorageEvent) => { if (event.key === STORAGE_KEY) update(event.newValue); };
    window.addEventListener(LOCAL_EVENT, onLocal);
    window.addEventListener("storage", onStorage);
    void listen<string>(EVENT, (event) => update(event.payload)).then((off) => { if (active) unlisten = off; else off(); }).catch(() => undefined);
    void getDatabase().then((db) => db.select<Array<{ value: string }>>("SELECT value FROM app_settings WHERE key='pet_character'"))
      .then((rows) => {
        if (active && !changed && rows[0]) {
          const selected = getPet(rows[0].value);
          setPet(selected); localStorage.setItem(STORAGE_KEY, selected.id);
        }
      }).catch(() => undefined);
    return () => { active = false; unlisten?.(); window.removeEventListener(LOCAL_EVENT, onLocal); window.removeEventListener("storage", onStorage); };
  }, []);
  return pet;
}
