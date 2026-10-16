"use client";
import { useEffect } from "react";
import { Alignment, Fit, Layout, useRive } from "@rive-app/react-canvas";

// mood: 0 idle · 1 focus · 2 break · 3 done · 4 react (앱의 petMoodValue와 동일)
export function Pet({ id, mood = 0, size }: { id: string; mood?: number; size: number }) {
  const { rive, RiveComponent } = useRive(
    { src: "/pets/chiikawa-pets.riv", artboard: id, stateMachine: "Pet", autoplay: true, autoBind: true, layout: new Layout({ fit: Fit.Contain, alignment: Alignment.Center }) },
    { shouldResizeCanvasToContainer: true, useDevicePixelRatio: true },
  );
  useEffect(() => {
    const value = rive?.viewModelInstance?.number("mood");
    if (value) value.value = mood;
  }, [rive, mood]);
  return (
    <div className="pet" style={{ width: size, height: size }} aria-hidden="true">
      <RiveComponent />
    </div>
  );
}
