import { gauss, P, ra, rand } from "../utils";
import type { State } from "./states-generator";

declare global {
  var History: HistoryModule;
}

export type HistoricalEventType =
  | "legend"
  | "founding"
  | "figure"
  | "ruler"
  | "war"
  | "peace"
  | "disaster"
  | "golden-age"
  | "religious"
  | "rebellion";

export interface HistoricalEvent {
  year: number;
  type: HistoricalEventType;
  title: string;
  text: string;
}

export interface Ruler {
  name: string;
  start: number;
  end: number;
  notable?: string;
}

export type FigureRole =
  | "Rebellion Leader"
  | "Inventor"
  | "Philosopher"
  | "Religious Figure"
  | "Explorer"
  | "Artist"
  | "General"
  | "Merchant Prince";

export interface NotableFigure {
  name: string;
  role: FigureRole;
  year: number;
  text: string;
}

interface FigureContext {
  cultureName: string;
  religionName?: string;
  campaignName?: string;
}

// epithet -> what they are remembered for, used both for ruler naming and event text
const EPITHETS: Record<string, string> = {
// --- Original Epithets ---
  "the Great": "expanded the realm's borders and is remembered as a unifying force",
  "the Wise": "was known for just laws and a well-run court",
  "the Bold": "led armies personally and won renown on the battlefield",
  "the Builder": "raised great halls, roads and fortifications",
  "the Pious": "devoted much of the crown's wealth to temples and shrines",
  "the Cruel": "ruled through fear and left a troubled legacy",
  "the Peacemaker": "ended a long-standing conflict through negotiation rather than arms",
  "the Unlucky": "presided over famine, plague or defeat",
  "the Younger": "inherited the throne while still a child, ruling under regents at first",
  "the Usurper": "seized power from a rival claimant",

  // --- New Epithets ---
  "the Golden": "reigned over an unprecedented era of economic wealth and booming trade",
  "the Mad": "issued erratic decrees that destabilized the court and fractured the nobility",
  "the Silent": "was notoriously reclusive, managing state affairs entirely through an inner circle of trusted viziers",
  "the Iron": "ruthlessly crushed domestic dissension and built an unbreakable centralized bureaucracy",
  "the Navigator": "subsidized sweeping exploration efforts, expanding the state's knowledge of distant coastlines",
  "the Scholar": "amassed a legendary imperial library and placed philosophers in high government offices",
  "the Benevolent": "slashed taxes on the peasantry and established sweeping grain-dole safety nets",
  "the Just": "standardized the penal code, showing no favoritism to the upper nobility during trials",
  "the Drunkard": "neglected state duties in favor of lavish court feasts, leaving administration to corrupt ministers",
  "the Short-Lived": "passed away under mysterious circumstances mere months after ascending the throne",
  "the Restorer": "reclaimed lost territories and rebuilt the capital following a period of deep ruin",
  "the Vain": "drained the royal treasury to construct monuments, statues, and self-glorifying portraits",
  "the Exile": "spent the early years of their reign fleeing a coup before triumphantly returning with a foreign army",
  "the Zealot": "waged aggressive religious wars and violently purged unorthodox beliefs from the land",
  "the Lasting": "reigned for over half a century, providing an era of deep structural stability despite their quiet nature"
};

const FOUNDING_TEMPLATES: Record<string, string[]> = {
  Nomadic: [
    "Bands of {culture} nomads settled around {capital}, trading their wandering ways for permanent rule.",
    "{culture} riders made {capital} their seat of power after generations of migration."
  ],
  Naval: [
    "Seafarers of {culture} descent raised {capital} as a harbor for their growing fleet.",
    "{capital} was founded as a naval stronghold by {culture} captains seeking control of the coast."
  ],
  Highland: [
    "Clans of {culture} highlanders united under a single banner, naming {capital} their capital.",
    "{capital} rose among the peaks as {culture} chieftains put aside old feuds."
  ],
  River: [
    "{culture} settlers built {capital} where the river offered water, trade and defense.",
    "The founding of {capital} secured {culture} control over the river valley."
  ],
  Lake: [
    "{culture} fisherfolk grew {capital} from a lakeside camp into a seat of power.",
    "{capital} was founded on the lakeshore, giving the {culture} people a defensible capital."
  ],
  Hunting: [
    "{culture} hunters cleared the wilds around {capital} and built the first permanent halls.",
    "{capital} grew from a hunting camp into the capital of the {culture} people."
  ],
  Generic: [
    "{culture} settlers founded {capital}, which would grow into the heart of {state}.",
    "{capital} was established by {culture} folk, marking the birth of {state}."
  ]
};

const FLAVOR_EVENTS: Record<string, { type: HistoricalEventType; title: string; text: (state: State, religion?: string) => string }> = {
  "Golden Age": {
    type: "golden-age",
    title: "A Golden Age",
    text: state => `Trade and culture flourished across ${state.name} during a long period of prosperity.`
  },
  Renaissance: {
    type: "golden-age",
    title: "A Cultural Renaissance",
    text: state => `Artists and scholars flocked to ${state.name}, ushering in a renaissance of learning and art.`
  },
  Plague: {
    type: "disaster",
    title: "The Great Plague",
    text: state => `A devastating plague swept through ${state.name}, emptying towns and fields alike.`
  },
  Famine: {
    type: "disaster",
    title: "Years of Famine",
    text: state => `Poor harvests brought famine to ${state.name}, testing the resolve of its people.`
  },
  "Great Fire": {
    type: "disaster",
    title: "The Great Fire",
    text: state => `Fire tore through the capital of ${state.name}, forcing much of it to be rebuilt.`
  },
  "Religious Reform": {
    type: "religious",
    title: "Religious Reform",
    text: (state, religion) => `${religion ? religion : "The old faith"} was reshaped by reformers within ${state.name}.`
  },
  Rebellion: {
    type: "rebellion",
    title: "Popular Uprising",
    text: state => `Discontent boiled over into open rebellion against the rulers of ${state.name}.`
  }
};

// forms used to name the fictional pre-founding entity; {name} is filled with a generated short name
const LEGEND_FORMS = [
  "the Kingdom of {name}",
  "the {name} Confederacy",
  "the Tribes of {name}",
  "the {name} Dominion",
  "Old {name}",
  "the {name} Hegemony"
];

const LEGEND_DOWNFALLS: Record<string, (entity: string) => string> = {
  Invasion: entity => `${entity} was overrun by invaders from beyond its borders, and its rule collapsed within a generation.`,
  "Civil War": entity => `${entity} tore itself apart in a long civil war between rival claimants.`,
  Plague: entity => `A great plague emptied the halls of ${entity}, and its people scattered to find safer ground.`,
  Drought: entity => `Years of drought withered the fields of ${entity}, forcing its people to abandon their homeland.`,
  Schism: entity => `${entity} fractured as its people split over rival faiths, never to reunite as one.`,
  Migration: entity => `${entity} was slowly abandoned as its people migrated in search of richer lands.`
};

const FIGURE_TEMPLATES: Record<FigureRole, (name: string, state: State, ctx: FigureContext) => string> = {
  "Rebellion Leader": (name, state) =>
    `${name} led a popular uprising against the rulers of ${state.name}, giving voice to years of grievance.`,
  Inventor: (name, state) =>
    `${name}'s innovations in ${ra(["shipbuilding", "metalwork", "irrigation", "fortification", "milling", "navigation"])} changed daily life across ${state.name}.`,
  Philosopher: (name, _state, ctx) =>
    `${name}'s writings on ${ra(["governance", "ethics", "the nature of the divine", "the duties of rulers", "the order of the world"])} shaped how the ${ctx.cultureName} people saw themselves.`,
  "Religious Figure": (name, state, ctx) =>
    `${name} ${ctx.religionName ? `reformed the practice of ${ctx.religionName}` : "founded a new religious movement"}, drawing a large following within ${state.name}.`,
  Explorer: (name, state) =>
    `${name} charted unknown lands beyond ${state.name}'s borders, opening new routes for trade and settlement.`,
  Artist: (name, _state, ctx) => `${name}'s work is still celebrated as a high point of ${ctx.cultureName} art and craft.`,
  General: (name, state, ctx) =>
    ctx.campaignName
      ? `${name} distinguished themselves during the ${ctx.campaignName}, becoming a celebrated hero of ${state.name}.`
      : `${name} rose through the ranks to become one of ${state.name}'s most celebrated military commanders.`,
  "Merchant Prince": (name, state) =>
    `${name} built a trading fortune that funded much of ${pack.burgs[state.capital]?.name || state.name}'s growth.`
};

class HistoryModule {
  // generate history for all states; pass a stateId to (re)generate a single state only
  generate(regenerate = false, stateId: number | null = null) {
    TIME && console.time("generateHistory");

    pack.states.forEach(state => {
      if (!state.i || state.removed) return;
      if (stateId !== null && state.i !== stateId) return;
      if (!regenerate && stateId === null && state.history?.length) return;

      const foundingYear = this.getFoundingYear();
      const rulers = this.generateDynasty(state, foundingYear);
      state.rulers = rulers;

      const { events, figures } = this.buildTimeline(state, foundingYear, rulers);
      state.figures = figures.sort((a, b) => a.year - b.year);
      state.history = events.sort((a, b) => a.year - b.year);
    });

    TIME && console.timeEnd("generateHistory");
  }

  private getFoundingYear(): number {
    const maxOffset = Math.min(900, Math.max(60, options.year - 10));
    const offset = gauss(280, 140, 40, maxOffset);
    return options.year - offset;
  }

  private buildTimeline(
    state: State,
    foundingYear: number,
    rulers: Ruler[]
  ): { events: HistoricalEvent[]; figures: NotableFigure[] } {
    const events: HistoricalEvent[] = [];

    events.push(...this.legendaryEvents(state, foundingYear));
    events.push(this.foundingEvent(state, foundingYear));

    rulers.forEach(ruler => {
      if (!ruler.notable) return;
      events.push({
        year: ruler.start,
        type: "ruler",
        title: `${ruler.name} ${ruler.notable}`,
        text: `${ruler.name} ${ruler.notable} took the throne of ${state.name} and ${EPITHETS[ruler.notable]}.`
      });
    });

    events.push(...this.warEvents(state, foundingYear));
    events.push(...this.diplomacyEvents(state, foundingYear));
    events.push(...this.flavorEvents(state, foundingYear));

    const { events: figureEvents, figures } = this.figureEvents(state, foundingYear);
    events.push(...figureEvents);

    return { events, figures };
  }

  // fictional pre-founding era: a predecessor entity that rose, thrived and fell before the current state existed
  private legendaryEvents(state: State, foundingYear: number): HistoricalEvent[] {
    const culture = pack.cultures[state.culture];
    const originId = culture ? culture.origins?.find(o => o !== null && o !== culture.i) : undefined;
    const originCulture = originId == null ? null : pack.cultures[originId];
    const rootCultureName = originCulture?.name || culture?.name || "the peoples of this land";

    const legendSpan = gauss(250, 100, 80, 500);
    const emergenceYear = foundingYear - legendSpan;
    const capitalName = pack.burgs[state.capital]?.name || state.name;
    const entityName = ra(LEGEND_FORMS).replace("{name}", Names.getCultureShort(originId ?? state.culture));

    const events: HistoricalEvent[] = [
      {
        year: emergenceYear,
        type: "legend",
        title: `Rise of ${entityName}`,
        text: `Long before ${state.name} took its current form, ${rootCultureName} coalesced into ${entityName}, an early power that first brought order to the region.`
      }
    ];

    if (P(0.7)) {
      const peakYear = rand(emergenceYear + 10, emergenceYear + Math.max(20, Math.round(legendSpan * 0.4)));
      events.push({
        year: peakYear,
        type: "legend",
        title: `Height of ${entityName}`,
        text: `${entityName} reached the height of its power, its influence extending far beyond its heartland.`
      });
    }

    const downfallKey = ra(Object.keys(LEGEND_DOWNFALLS));
    const downfallYear = rand(Math.round(emergenceYear + legendSpan * 0.5), foundingYear - 15);
    events.push({
      year: downfallYear,
      type: "legend",
      title: `Fall of ${entityName}`,
      text: LEGEND_DOWNFALLS[downfallKey](entityName)
    });

    events.push({
      year: foundingYear - rand(5, 14),
      type: "legend",
      title: "Between Two Ages",
      text: `In the generations that followed, small settlements rose from the remains of ${entityName}, one of which would grow into ${capitalName}.`
    });

    return events;
  }

  private foundingEvent(state: State, foundingYear: number): HistoricalEvent {
    const culture = pack.cultures[state.culture];
    const capital = pack.burgs[state.capital];
    const cultureName = culture?.name || "local peoples";
    const capitalName = capital?.name || state.name;

    const templates = FOUNDING_TEMPLATES[culture?.type || "Generic"] || FOUNDING_TEMPLATES.Generic;
    const text = ra(templates)
      .replace(/{culture}/g, cultureName)
      .replace(/{capital}/g, capitalName)
      .replace(/{state}/g, state.name);

    return { year: foundingYear, type: "founding", title: `Founding of ${state.name}`, text };
  }

  private generateDynasty(state: State, foundingYear: number): Ruler[] {
    const rulers: Ruler[] = [];
    let year = foundingYear;

    while (year < options.year) {
      const reign = Math.max(1, gauss(19, 11, 1, 55));
      const end = Math.min(options.year, year + reign);
      const notable = P(0.35) ? ra(Object.keys(EPITHETS)) : undefined;

      rulers.push({ name: Names.getCulture(state.culture), start: year, end, notable });
      year = end;
    }

    if (!rulers.length) rulers.push({ name: Names.getCulture(state.culture), start: foundingYear, end: options.year });
    return rulers;
  }

  private warEvents(state: State, foundingYear: number): HistoricalEvent[] {
    const events: HistoricalEvent[] = [];

    (state.campaigns || []).forEach(campaign => {
      if (campaign.start < foundingYear) return;
      const attacker = pack.states[campaign.attacker];
      const defender = pack.states[campaign.defender];
      if (!attacker || !defender) return;

      events.push({
        year: Math.round(campaign.start),
        type: "war",
        title: campaign.name,
        text: `The ${campaign.name} broke out between ${attacker.name} and ${defender.name}.`
      });

      if (campaign.end) {
        const years = Math.max(1, Math.round(campaign.end - campaign.start));
        events.push({
          year: Math.round(campaign.end),
          type: "peace",
          title: `End of the ${campaign.name}`,
          text: `Fighting in the ${campaign.name} came to an end after ${years} year${years === 1 ? "" : "s"}.`
        });
      }
    });

    return events;
  }

  private diplomacyEvents(state: State, foundingYear: number): HistoricalEvent[] {
    const diplomacy = state.diplomacy;
    if (!diplomacy) return [];
    const events: HistoricalEvent[] = [];

    // diplomacy[i] reads as "this state IS [relation] OF state i"
    const isValid = (i: number) => i > 0 && pack.states[i] && !pack.states[i].removed;

    const allyIndex = diplomacy.findIndex(r => r === "Ally");
    if (isValid(allyIndex)) {
      events.push({
        year: rand(foundingYear + 5, options.year),
        type: "peace",
        title: "Defensive Pact",
        text: `${state.name} and ${pack.states[allyIndex].name} entered into a defensive pact, pledging to aid each other against common threats.`
      });
    }

    const vassalOfIndex = diplomacy.findIndex(r => r === "Vassal");
    if (isValid(vassalOfIndex)) {
      events.push({
        year: rand(foundingYear + 5, options.year),
        type: "war",
        title: "Vassalization",
        text: `${state.name} submitted to ${pack.states[vassalOfIndex].name} and accepted vassal status.`
      });
    }

    const suzerainOfIndex = diplomacy.findIndex(r => r === "Suzerain");
    if (isValid(suzerainOfIndex)) {
      events.push({
        year: rand(foundingYear + 5, options.year),
        type: "war",
        title: "Vassalization",
        text: `${state.name} extended its authority over ${pack.states[suzerainOfIndex].name}, who accepted vassal status.`
      });
    }

    return events;
  }

  private flavorEvents(state: State, foundingYear: number): HistoricalEvent[] {
    const religion = pack.religions[pack.cells.religion[state.center]]?.name;
    const keys = Object.keys(FLAVOR_EVENTS);
    const count = rand(1, 3);
    const events: HistoricalEvent[] = [];

    for (let i = 0; i < count; i++) {
      const key = ra(keys);
      const { type, title, text } = FLAVOR_EVENTS[key];
      const year = rand(foundingYear + 5, Math.max(foundingYear + 6, options.year - 2));
      events.push({ year, type, title, text: text(state, religion) });
    }

    return events;
  }

  // notable non-ruler individuals: rebellion leaders, inventors, philosophers, religious figures...
  private figureEvents(state: State, foundingYear: number): { events: HistoricalEvent[]; figures: NotableFigure[] } {
    const culture = pack.cultures[state.culture];
    const religion = pack.religions[pack.cells.religion[state.center]];
    const roles = Object.keys(FIGURE_TEMPLATES) as FigureRole[];
    const count = rand(2, 5);

    const figures: NotableFigure[] = [];
    const events: HistoricalEvent[] = [];

    for (let i = 0; i < count; i++) {
      const role = ra(roles);
      const year = rand(foundingYear + 10, Math.max(foundingYear + 11, options.year - 2));
      const campaign =
        role === "General" ? (state.campaigns || []).find(c => c.start <= year && (c.end ?? options.year) >= year) : undefined;

      const ctx: FigureContext = {
        cultureName: culture?.name || state.name,
        religionName: religion?.name,
        campaignName: campaign?.name
      };
      const name = Names.getCulture(state.culture);
      const text = FIGURE_TEMPLATES[role](name, state, ctx);

      figures.push({ name, role, year, text });
      events.push({ year, type: "figure", title: `${name}, ${role}`, text });
    }

    return { events, figures };
  }
}

window.History = new HistoryModule();
