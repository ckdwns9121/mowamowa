import pets from "./pets.json";

const SHEET_W = 3766;

// 앱의 PetPortrait와 같은 스프라이트 크롭. 크롭이 없는 펫은 SVG.
export function Portrait({ id, size, className = "" }: { id: string; size: number; className?: string }) {
  const pet = pets.find((p) => p.id === id);
  if (!pet?.crop) return <img className={`portrait ${className}`} src={`/pets/${id}.svg`} width={size} height={size} alt="" draggable={false} />;
  const [x, y, w, h] = pet.crop;
  const scale = size / Math.max(w, h);
  return (
    <span
      className={`portrait ${className}`}
      aria-hidden="true"
      style={{
        display: "inline-block",
        width: w * scale,
        height: h * scale,
        backgroundImage: "url(/pets/characters.png)",
        backgroundRepeat: "no-repeat",
        backgroundSize: `${SHEET_W * scale}px auto`,
        backgroundPosition: `${-x * scale}px ${-y * scale}px`,
      }}
    />
  );
}
