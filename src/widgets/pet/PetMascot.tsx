import { useEffect, useRef, useState } from "react";
import { Alignment, Fit, Layout, RuntimeLoader, useRive } from "@rive-app/react-canvas";
import riveWasm from "@rive-app/canvas/rive.wasm?url";
import { getPet, petMoodValue, useSelectedPet, type PetMood } from "../../entities/pet";
import { PetPortrait } from "./PetPortrait";
import "./PetMascot.scss";

RuntimeLoader.setWasmUrl(riveWasm);
export type { PetMood } from "../../entities/pet";

export function PetMascot({ mood, isRunning, size = 64, petId }: { mood: PetMood; isRunning: boolean; size?: number; petId?: string }) {
  const selected = useSelectedPet();
  const pet = getPet(petId ?? selected.id);
  return <AnimatedPet key={pet.id} petId={pet.id} mood={mood} isRunning={isRunning} size={size} />;
}

function AnimatedPet({ petId, mood, isRunning, size }: { petId: string; mood: PetMood; isRunning: boolean; size: number }) {
  const host = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [visible, setVisible] = useState(true);
  const [reduced, setReduced] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const { rive, RiveComponent } = useRive({
    src: "/pets/chiikawa-pets.riv?v=rakko-eight-views-fx-6", artboard: petId, stateMachines: "Pet",
    autoplay: true, autoBind: true,
    layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }),
    onLoadError: () => setFailed(true),
  }, { shouldResizeCanvasToContainer: true, useDevicePixelRatio: true });

  useEffect(() => {
    if (!rive) return;
    const value = rive.viewModelInstance?.number("mood");
    if (value) value.value = petMoodValue(mood, isRunning);
  }, [rive, mood, isRunning]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const changed = () => setReduced(media.matches);
    media.addEventListener("change", changed);
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    if (host.current) observer.observe(host.current);
    return () => { media.removeEventListener("change", changed); observer.disconnect(); };
  }, []);
  useEffect(() => {
    if (!rive) return;
    const update = () => { if (visible && !reduced && !document.hidden) rive.play("Pet"); else rive.pause(); };
    update(); document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, [rive, visible, reduced]);

  return <div ref={host} className="pet-mascot-container" style={{ width: size, height: size }} data-pet={petId} data-mood={mood} aria-hidden="true">
    {(!rive || failed || reduced) && <PetPortrait petId={petId} size={size} />}
    {!failed && <RiveComponent className={`pet-rive-canvas ${!rive || reduced ? "is-loading" : ""}`} />}
  </div>;
}
