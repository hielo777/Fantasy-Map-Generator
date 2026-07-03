import { ensureEl } from "../utils";

let $body: HTMLElement;
let isInitialized = false;
let activeStateId = -1;

function insertHtml(): HTMLElement {
  const html = /* html */ `<div id="historyViewer" class="dialog stable" style="display: none">
    <div id="historyViewerHeader" style="display: flex; align-items: center; gap: .6em; padding: .3em .6em">
      <select id="historyViewerSelect" style="flex: 1"></select>
      <button id="historyViewerRegenerate" data-tip="Regenerate this state's history" class="icon-arrows-cw"></button>
      <button id="historyViewerExport" data-tip="Download history as a text file" class="icon-download"></button>
    </div>
    <div id="historyViewerBody" style="max-height: 60vh; overflow-y: auto; padding: .2em .8em .6em"></div>
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
  }
}

function populateSelect(): void {
  const select = ensureEl<HTMLSelectElement>("historyViewerSelect");
  select.innerHTML = "";
  pack.states
    .filter(s => s.i && !s.removed)
    .sort((a, b) => (a.name! > b.name! ? 1 : -1))
    .forEach(s => select.options.add(new Option(s.fullName || s.name, String(s.i), false, s.i === activeStateId)));
}

function formatYear(year: number): string {
  return `${Math.round(year)} ${options.eraShort || options.era || ""}`.trim();
}

function render(): void {
  const state = pack.states[activeStateId];
  if (!state) return;
  if (!state.history?.length) History.generate(true, activeStateId);

  const coaId = `stateCOA${state.i}`;
  COArenderer.trigger(coaId, state.coa);

  const timeline =
    (state.history || [])
      .map(
        event => /* html */ `<div class="historyEvent" data-type="${event.type}">
          <div style="font-weight: bold">${formatYear(event.year)} — ${event.title}</div>
          <div>${event.text}</div>
        </div>`
      )
      .join("") || "<div>No recorded history</div>";

  const rulers =
    (state.rulers || [])
      .map(
        ruler => /* html */ `<div class="historyRuler">
          <b>${ruler.name}${ruler.notable ? ` ${ruler.notable}` : ""}</b>
          &nbsp;(${formatYear(ruler.start)} – ${ruler.end >= options.year ? "present" : formatYear(ruler.end)})
        </div>`
      )
      .join("") || "<div>No recorded rulers</div>";

  $body.innerHTML = /* html */ `
    <div style="display: flex; align-items: center; gap: .5em; margin: .4em 0">
      <svg class="coaIcon" viewBox="0 0 200 200" style="width: 2.4em; height: 2.4em"><use href="#${coaId}"></use></svg>
      <b>${state.fullName || state.name}</b>
    </div>
    <h4 style="margin: .4em 0">Timeline</h4>
    ${timeline}
    <h4 style="margin: .8em 0 .4em">Rulers</h4>
    ${rulers}
  `;
}

function downloadHistory(): void {
  const state = pack.states[activeStateId];
  if (!state) return;

  let data = `${state.fullName || state.name}\n\n`;
  (state.history || []).forEach(event => {
    data += `${formatYear(event.year)} - ${event.title}\n${event.text}\n\n`;
  });

  data += `Rulers\n`;
  (state.rulers || []).forEach(ruler => {
    const end = ruler.end >= options.year ? "present" : formatYear(ruler.end);
    data += `${ruler.name}${ruler.notable ? ` ${ruler.notable}` : ""}: ${formatYear(ruler.start)} - ${end}\n`;
  });

  downloadFile(data, `${getFileName(`${state.name} History`)}.txt`);
}

export const HistoryViewer = { open };
