import React from "react";
import ReactDOM from "react-dom/client";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { applyTheme, getStoredTheme } from "./shared/config/theme/theme";

applyTheme(getStoredTheme());

const windowLabel = getCurrentWindow().label;
if (windowLabel === "pet" || windowLabel === "tray") {
  document.documentElement.style.background = "transparent";
  document.body.style.background = "transparent";
  document.documentElement.classList.add(`window-${windowLabel}`);
}

if (windowLabel === "tray") {
  void import("./entities/work-context/api/focus-history-repository").then(({ startFocusClock }) => startFocusClock()).catch(console.error);
}

const componentPromise = windowLabel === "pet"
  ? import("./widgets/pet")
  : import("./widgets/tray");

void componentPromise.then(({ default: RootComponent }) => {
  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <RootComponent />
    </React.StrictMode>,
  );
});
