import type { CSSProperties } from "react";
import { getPet } from "../../entities/pet";

export function PetPortrait({ petId, size = 64 }: { petId: string; size?: number }) {
  const pet = getPet(petId);
  if (!pet.crop) return <img className="pet-portrait" src={`/pets/${pet.id}.svg`} width={size} height={size} alt="" draggable={false} />;
  const [x, y, width, height] = pet.crop;
  const scale = Math.min(194 / width, 202 / height) * size / 256;
  const style: CSSProperties = {
    width: width * scale, height: height * scale,
    left: (size - width * scale) / 2, bottom: size * 28 / 256,
    backgroundImage: "url('/pets/characters.png')", backgroundRepeat: "no-repeat",
    backgroundSize: `${3766 * scale}px ${463 * scale}px`, backgroundPosition: `${-x * scale}px ${-y * scale}px`,
  };
  return <span className="pet-portrait" style={{ width: size, height: size }} aria-hidden="true"><span style={style} /></span>;
}
