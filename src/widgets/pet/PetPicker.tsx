import { useEffect, useRef, useState, type CSSProperties } from "react";
import { ArrowLeft, Check, Eye, EyeOff, Search } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { PETS, PET_GROUPS, filterPets, getPet, saveSelectedPet, useSelectedPet, type PetGroup, type PetMood } from "../../entities/pet";
import { PetMascot } from "./PetMascot";
import { PetPortrait } from "./PetPortrait";
import "./PetPicker.scss";

const MOODS: Array<{ id: PetMood; label: string }> = [{ id: "react", label: "인사" }, { id: "idle", label: "대기" }, { id: "focus", label: "집중" }, { id: "break", label: "휴식" }, { id: "done", label: "완료" }];
export default function PetPicker({ onClose }: { onClose: () => void }) {
  const selected = useSelectedPet();
  const [previewId, setPreviewId] = useState(selected.id);
  const [mood, setMood] = useState<PetMood>("react");
  const [replay, setReplay] = useState(0);
  const [group, setGroup] = useState<PetGroup | "all">("all");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [petVisible, setPetVisible] = useState(true);
  const closeRef = useRef<HTMLButtonElement>(null);
  const preview = getPet(previewId);
  const pets = filterPets(group, query);
  useEffect(() => { closeRef.current?.focus(); void invoke<boolean>("is_pet_window_visible").then(setPetVisible).catch(() => undefined); }, []);
  async function apply() {
    setSaving(true); setError(null);
    try { await saveSelectedPet(preview.id); await invoke("show_pet_window"); setPetVisible(true); }
    catch (cause) { setError(String(cause)); }
    finally { setSaving(false); }
  }
  return <section className="pet-picker" aria-label="펫 선택" style={{ "--pet-accent": preview.accent } as CSSProperties}>
    <header className="pet-picker-heading"><button ref={closeRef} type="button" aria-label="펫 선택 닫기" onClick={onClose}><ArrowLeft size={16} /></button><div><strong>함께할 친구</strong><span>{PETS.length}명의 작은 응원단</span></div><button type="button" aria-label={petVisible ? "펫 숨기기" : "펫 보이기"} onClick={() => void invoke<boolean>("toggle_pet_window").then(setPetVisible).catch((cause) => setError(String(cause)))}>{petVisible ? <Eye size={16} /> : <EyeOff size={16} />}</button></header>
    <div className="pet-picker-preview">
      <button type="button" className="pet-preview-stage" aria-label={`${preview.name} 반응 보기`} onClick={() => { setMood("react"); setReplay((n) => n + 1); }}><PetMascot key={`${preview.id}-${replay}`} petId={preview.id} mood={mood} isRunning={mood === "focus"} size={106} /></button>
      <div className="pet-preview-copy"><small>{selected.id === preview.id ? "지금 함께하는 친구" : "새로운 친구"}</small><h2>{preview.name}</h2><p>{preview.description}</p><button className="pet-apply" type="button" disabled={saving} onClick={() => void apply()}>{selected.id === preview.id ? <><Check size={12} /> 함께하는 중</> : saving ? "변경 중…" : "이 친구와 함께하기"}</button></div>
    </div>
    <div className="pet-motion-tabs" aria-label="미리보기 동작">{MOODS.map((entry) => <button type="button" aria-pressed={mood === entry.id} key={entry.id} onClick={() => { setMood(entry.id); setReplay((n) => n + 1); }}>{entry.label}</button>)}</div>
    {error && <p className="pet-picker-error" role="alert">{error}</p>}
    <div className="pet-picker-search"><Search size={13} /><input aria-label="펫 검색" placeholder="이름으로 찾기" value={query} onChange={(event) => setQuery(event.target.value)} /></div>
    <div className="pet-group-tabs" aria-label="캐릭터 분류">{PET_GROUPS.map((entry) => <button type="button" key={entry.id} aria-pressed={group === entry.id} onClick={() => setGroup(entry.id)}>{entry.label}</button>)}</div>
    <div className="pet-picker-grid" role="group" aria-label="캐릭터 목록">{pets.map((pet) => <button type="button" key={pet.id} className={`pet-choice ${previewId === pet.id ? "is-previewed" : ""}`} aria-pressed={previewId === pet.id} aria-label={`${pet.name}${selected.id === pet.id ? ", 선택됨" : ""}`} onClick={() => { setPreviewId(pet.id); setMood("react"); setReplay(0); }} style={{ "--card-accent": pet.accent } as CSSProperties}><PetPortrait petId={pet.id} size={68} /><span>{pet.name}</span>{selected.id === pet.id && <Check className="pet-choice-check" size={12} />}</button>)}</div>
    {pets.length === 0 && <p className="pet-picker-empty">이름에 맞는 친구가 없어요.</p>}
  </section>;
}
