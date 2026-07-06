import type { HistoricalEvent } from "@/generators/history-generator";
import { ensureEl } from "../utils";

let $body: HTMLElement;
let isInitialized = false;
let activeStateId = -1;

const EVENT_COLORS: Record<string, string> = {
  legend: "#8e7cc3",
  founding: "#4caf50",
  figure: "#3f8fd2",
  ruler: "#c9a227",
  war: "#c0392b",
  peace: "#16a085",
  disaster: "#8b4513",
  "golden-age": "#d4af37",
  religious: "#9b59b6",
  schism: "#d35400",
  "holy-war": "#922b21",
  rebellion: "#e67e22",
  global: "#4a90e2" // Color accent for macro legendary eras
};

function insertHtml(): HTMLElement {
  const html = /* html */ `<div id="historyViewer" class="dialog stable" style="display: none">
    <div id="historyViewerHeader" style="display: flex; align-items: center; gap: .6em; padding: .3em .6em">
      <select id="historyViewerSelect" style="flex: 1"></select>
      <button id="historyViewerRegenerate" data-tip="Regenerate this state's history" class="icon-arrows-cw"></button>
      <button id="historyViewerExport" data-tip="Download history as a text file" class="icon-download"></button>
    </div>
    <div id="historyViewerBody" style="max-height: 60vh; max-width: 120ch; overflow-y: auto; overflow-wrap: break-word; padding: .2em .8em .6em"></div>
  </div>`;

  ensureEl("dialogs").insertAdjacentHTML("beforeend", html);
  return ensureEl("historyViewerBody");
}

function open(stateId?: number): void {
  if (customization) return;

  const valid = pack.states.filter(s => s.i && !s.removed);
  if (!valid.length) {
    tip("There are no states to show history for", false, "error");
    return;
  }

  if (!$body) $body = insertHtml();
  closeDialogs(".stable");

  activeStateId = stateId && pack.states[stateId] && !pack.states[stateId].removed ? stateId : valid[0].i;
  populateSelect();
  render();

  $("#historyViewer").dialog();

  if (!isInitialized) {
    $("#historyViewer").dialog({
      title: "History",
      resizable: false,
      width: fitContent(),
      position: { my: "right top", at: "right-10 top+10", of: "svg", collision: "fit" }
    });

    ensureEl<HTMLSelectElement>("historyViewerSelect").on("change", () => {
      activeStateId = +ensureEl<HTMLSelectElement>("historyViewerSelect").value;
      render();
    });
    ensureEl("historyViewerRegenerate").on("click", () => {
      History.generate(true, activeStateId);
      render();
    });
    ensureEl("historyViewerExport").on("click", downloadHistory);
    isInitialized = true;

    //Wire up the Global Click Interceptor.
    if (!window.hasHistoryStateListener) {
      window.addEventListener("switchHistoryState", (e: any) => {
        const nextStateId = e.detail;
        if (pack.states[nextStateId] && !pack.states[nextStateId].removed) {
          activeStateId = nextStateId;
          ensureEl<HTMLSelectElement>("historyViewerSelect").value = String(nextStateId);
          render();
        }
      });
      window.hasHistoryStateListener = true;
    }
  }
}

function populateSelect(): void {
  const select = ensureEl<HTMLSelectElement>("historyViewerSelect");
  select.innerHTML = "";
  pack.states
    .filter(s => s.i && !s.removed)
    .sort((a, b) => (a.name! > b.name! ? 1 : -1))
    .forEach(s => {
      select.options.add(new Option(s.fullName || s.name, String(s.i), false, s.i === activeStateId));
    });
  //.forEach(s => select.options.add(new Option(s.fullName || s.name, String(s.i), false, s.i === activeStateId)));
}

function formatYear(year: number): string {
  return `${Math.round(year)} ${options.eraShort || options.era || ""}`.trim();
}

// function renderEvents(events: HistoricalEvent[], emptyText: string): string {
//   return (
//     events
//       .map(
//         event => /* html */ `<div class="historyEvent" data-type="${event.type}" style="border-left: 3px solid ${
//           EVENT_COLORS[event.type] || "#999"
//         }; padding: .15em 0 .15em .6em; margin: .3em 0">
//           <div style="font-weight: bold">${formatYear(event.year)} — ${event.title}</div>
//           <div>${event.text}</div>
//         </div>`
//       )
//       .join("") || `<div>${emptyText}</div>`
//   );
// }

// function render(): void {
//   const state = pack.states[activeStateId];
//   if (!state) return;
//   if (!state.figures) History.generate(true, activeStateId);

//   const coaId = `stateCOA${state.i}`;
//   COArenderer.trigger(coaId, state.coa);

//   const history = state.history || [];
//   const legendary = history.filter(event => event.type === "legend");
//   const recorded = history.filter(event => event.type !== "legend");

//   const rulers =
//     (state.rulers || [])
//       .map(
//         ruler => /* html */ `<div class="historyRuler">
//           <b>${ruler.name}${ruler.notable ? ` ${ruler.notable}` : ""}</b>
//           &nbsp;(${formatYear(ruler.start)} – ${ruler.end >= options.year ? "present" : formatYear(ruler.end)})
//         </div>`
//       )
//       .join("") || "<div>No recorded rulers</div>";

//   const figures =
//     (state.figures || [])
//       .map(
//         figure => /* html */ `<div class="historyFigure" style="margin: .2em 0">
//           <b>${figure.name}</b> — ${figure.role} <span style="opacity: .7">(${formatYear(figure.year)})</span>
//         </div>`
//       )
//       .join("") || "<div>No notable figures recorded</div>";

//   $body.innerHTML = /* html */ `
//     <div style="display: flex; align-items: center; gap: .5em; margin: .4em 0">
//       <svg class="coaIcon" viewBox="0 0 200 200" style="width: 2.4em; height: 2.4em"><use href="#${coaId}"></use></svg>
//       <b>${state.fullName || state.name}</b>
//     </div>
//     <h4 style="margin: .8em 0 .4em">Recorded History</h4>
//     <h4 style="margin: 1.2em 0 .4em; padding-top: .8em; border-top: 1px solid #ddd;">Recorded Histor</h4>
//     ${renderEvents(recorded, "No recorded history")}
//     <hr style="border: 0; border-top: 1px solid #ccc; margin: 1.5em 0 .8em;">
//     <h4 style="margin: .8em 0 .4em">Rulers</h4>
//     ${rulers}
//     <h4 style="margin: .8em 0 .4em">Notable Figures</h4>
//     ${figures}
//     <hr style="border: 0; border-top: 1px solid #ccc; margin: 1.5em 0 .8em;">
//     <h4 style="margin: 1.2em 0 .4em; padding-top: .8em; border-top: 1px solid #ddd;">Legendary Era</h4>
//     ${renderEvents(legendary, "No legends survive from before the founding")}
//   `;
// }

function renderEvents(events: HistoricalEvent[], emptyText: string, currentStateId: number): string {
  if (!events.length) return `<div>${emptyText}</div>`;

  // Dynamic state names cache for fast linking lookups
  const activeStates = pack.states.filter(s => s.i && !s.removed);

  return events
    .map(event => {
      // 1. Detect if this is the foundational "Global Backdrop Anchor"
      //const isGlobalEraAnchor = event.type === "legend" && ANCIENT_ERAS.some(era => era.prefix === event.title);
      // shadow-check if it's the global template based on its structural text characteristics
      const isGlobalEraAnchor =
        event.type === "legend" &&
        event.title.startsWith("The ") &&
        (event.text.includes("era") ||
          event.text.includes("age") ||
          event.text.includes("century") ||
          event.text.includes("inundation"));

      if (isGlobalEraAnchor) {
        //Shared World Events. These events are not tied to a specific state but rather provide a global historical context. They are visually distinguished with a dashed border and a globe icon.
        return /* html */ `
          <div class="historyEvent globalEraAnchor" style="background: rgba(74, 144, 226, 0.08); border: 2px dashed ${EVENT_COLORS.global}; border-radius: 6px; padding: .8em; margin: .8em 0; box-shadow: inset 0 0 10px rgba(0,0,0,0.05)">
            <div style="font-weight: bold; color: ${EVENT_COLORS.global}; font-size: 1.1em; display: flex; align-items: center; gap: .4em;">
              <span class="icon-globe"></span> ${formatYear(event.year)} — WORLD EVENT: ${event.title}
            </div>
            <div style="font-style: italic; margin-top: .4em; opacity: .95; line-height: 1.4;">${event.text}</div>
          </div>`;
      }

      // 2. Cross-State Scanning Mechanism
      // Look for references to other states to generate badge shortcuts
      const mentionedBadges = activeStates
        .filter(
          s =>
            s.i !== currentStateId && (event.text.includes(s.name) || (s.fullName && event.text.includes(s.fullName)))
        )
        .map(
          s => /* html */ `
          <span class="state-link-badge" data-id="${s.i}" style="background: rgba(0,0,0,0.06); border: 1px solid #ccc; padding: 1px 6px; border-radius: 4px; font-size: .8em; cursor: pointer; font-weight: 500;" onclick="window.dispatchEvent(new CustomEvent('switchHistoryState', {detail: ${s.i}}))">
            🔀 ${s.name}
          </span>`
        )
        .join(" ");

      const isCrossState = mentionedBadges.length > 0;
      const borderStyle = isCrossState
        ? `border-left: 4px double #e74c3c; background: rgba(231, 76, 60, 0.02);`
        : `border-left: 3px solid ${EVENT_COLORS[event.type] || "#999"};`;

      return /* html */ `
        <div class="historyEvent" data-type="${event.type}" style="${borderStyle} padding: .3em 0 .3em .6em; margin: .45em 0; border-radius: 0 4px 4px 0;">
          <div style="font-weight: bold; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: .4em;">
            <span>${formatYear(event.year)} — ${event.title}</span>
            ${isCrossState ? `<span style="font-size: .75em; font-weight: bold; text-transform: uppercase; color: #c0392b; background: #fadbd8; padding: 1px 5px; border-radius: 3px;">Geopolitical Event</span>` : ""}
          </div>
          <div style="margin-top: .15em;">${event.text}</div>
          ${isCrossState ? `<div style="margin-top: .4em; display: flex; gap: .3em; flex-wrap: wrap; align-items: center;">${mentionedBadges}</div>` : ""}
        </div>`;
    })
    .join("");
}

function render(): void {
  const state = pack.states[activeStateId];
  if (!state) return;
  if (!state.figures) History.generate(true, activeStateId);

  const coaId = `stateCOA${state.i}`;
  COArenderer.trigger(coaId, state.coa);

  const history = state.history || [];
  const legendary = history.filter(event => event.type === "legend");
  const recorded = history.filter(event => event.type !== "legend");

  // const rulers =
  //   (state.rulers || [])
  //     .map(
  //       ruler => /* html */ `<div class="historyRuler" style="padding: .2em 0;">
  //         <b>${ruler.name}${ruler.notable ? ` ${ruler.notable}` : ""}</b>
  //         &nbsp;<span style="opacity: .8">(${formatYear(ruler.start)} – ${ruler.end >= options.year ? "present" : formatYear(ruler.end)})</span>
  //       </div>`
  //     )
  //     .join("") || "<div>No recorded rulers</div>";

  // In history-viewer.ts -> function render()[cite: 2]
  const rulers =
    (state.rulers || [])
      .map(
        ruler => /* html */ `<div class="historyRuler" style="padding: .25em 0; border-bottom: 1px dashed rgba(0,0,0,0.05);">
          <b>${ruler.name}</b> 
          ${ruler.notable ? `<span style="color: ${EVENT_COLORS.ruler}; font-weight: bold; font-style: italic;">${ruler.notable}</span>` : ""}
          &nbsp;<span style="opacity: .8; font-size: .9em;">(${formatYear(ruler.start)} – ${ruler.end >= options.year ? "present" : formatYear(ruler.end)})</span>
        </div>`
      )
      .join("") || "<div>No recorded rulers</div>";

  const figures =
    (state.figures || [])
      .map(
        figure => /* html */ `<div class="historyFigure" style="margin: .3em 0; padding-left: .4em;">
          <b>${figure.name}</b> — ${figure.role} <span style="opacity: .7">(${formatYear(figure.year)})</span>
        </div>`
      )
      .join("") || "<div>No notable figures recorded</div>";

  const religion = pack.religions[pack.cells.religion[state.center]];
  const religionEvents = (religion && pack.history?.religionHistory?.[religion.i]) || [];
  const religionLabel = religion?.i ? `${religion.name} (${religion.type})` : "No state religion";
  const religionHistoryHtml = religionEvents.length
    ? renderEvents(religionEvents, "No recorded religious history", state.i)
    : "<div>No recorded religious history</div>";

  $body.innerHTML = /* html */ `
    <div style="display: flex; align-items: center; gap: .5em; margin: .4em 0; background: rgba(0,0,0,0.03); padding: .4em; border-radius: 6px;">
      <svg class="coaIcon" viewBox="0 0 200 200" style="width: 2.6em; height: 2.6em"><use href="#${coaId}"></use></svg>
      <b style="font-size: 1.2em;">${state.fullName || state.name}</b>
    </div>
    
    <!-- Collapsible Sections -->
    <details open style="margin: .6em 0; border: 1px solid #ddd; border-radius: 4px; padding: .4em;">
      <summary style="font-weight: bold; cursor: pointer; font-size: 1.05em; outline: none; padding: .2em 0;">📜 Recorded History</summary>
      <div style="margin-top: .4em;">${renderEvents(recorded, "No recorded history", state.i)}</div>
    </details>

    <details style="margin: .6em 0; border: 1px solid #ddd; border-radius: 4px; padding: .4em;">
      <summary style="font-weight: bold; cursor: pointer; font-size: 1.05em; outline: none; padding: .2em 0;">👑 Rulers & Leaders</summary>
      <div style="margin-top: .4em; max-height: 200px; overflow-y: auto;">${rulers}</div>
    </details>

    <details style="margin: .6em 0; border: 1px solid #ddd; border-radius: 4px; padding: .4em;">
      <summary style="font-weight: bold; cursor: pointer; font-size: 1.05em; outline: none; padding: .2em 0;">🌟 Notable Figures</summary>
      <div style="margin-top: .4em; max-height: 200px; overflow-y: auto;">${figures}</div>
    </details>

    <details style="margin: .6em 0; border: 1px solid #ddd; border-radius: 4px; padding: .4em;">
      <summary style="font-weight: bold; cursor: pointer; font-size: 1.05em; outline: none; padding: .2em 0;">🕊️ Religion — ${religionLabel}</summary>
      <div style="margin-top: .4em;">${religionHistoryHtml}</div>
    </details>

    <details open style="margin: .6em 0; border: 1px solid #ddd; border-radius: 4px; padding: .4em;">
      <summary style="font-weight: bold; cursor: pointer; font-size: 1.05em; outline: none; padding: .2em 0;">⏳ Legendary Era</summary>
      <div style="margin-top: .4em;">${renderEvents(legendary, "No legends survive from before the founding", state.i)}</div>
    </details>
  `;
}

function downloadHistory(): void {
  const state = pack.states[activeStateId];
  if (!state) return;

  const history = state.history || [];
  const legendary = history.filter(event => event.type === "legend");
  const recorded = history.filter(event => event.type !== "legend");

  let data = `${state.fullName || state.name}\n\n`;

  data += `Legendary Era\n`;
  legendary.forEach(event => {
    data += `${formatYear(event.year)} - ${event.title}\n${event.text}\n\n`;
  });

  data += `Recorded History\n`;
  recorded.forEach(event => {
    data += `${formatYear(event.year)} - ${event.title}\n${event.text}\n\n`;
  });

  data += `Rulers\n`;
  (state.rulers || []).forEach(ruler => {
    const end = ruler.end >= options.year ? "present" : formatYear(ruler.end);
    data += `${ruler.name}${ruler.notable ? ` ${ruler.notable}` : ""}: ${formatYear(ruler.start)} - ${end}\n`;
  });

  data += `\nNotable Figures\n`;
  (state.figures || []).forEach(figure => {
    data += `${figure.name}, ${figure.role} (${formatYear(figure.year)}): ${figure.text}\n`;
  });

  const religion = pack.religions[pack.cells.religion[state.center]];
  const religionEvents = (religion && pack.history?.religionHistory?.[religion.i]) || [];
  if (religion?.i) {
    data += `\n${religion.name} (${religion.type})\n`;
    religionEvents.forEach(event => {
      data += `${formatYear(event.year)} - ${event.title}\n${event.text}\n\n`;
    });
  }

  downloadFile(data, `${getFileName(`${state.name} History`)}.txt`);
}

export const HistoryViewer = { open };
