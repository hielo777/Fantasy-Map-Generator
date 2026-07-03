import { gauss, P, ra, rand } from "../utils";
import type { State } from "./states-generator";

declare global {
  var History: HistoryModule;
}

export type HistoricalEventType = "founding" | "ruler" | "war" | "peace" | "disaster" | "golden-age" | "religious" | "rebellion";

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

// epithet -> what they are remembered for, used both for ruler naming and event text
const EPITHETS: Record<string, string> = {
  "the Great": "expanded the realm's borders and is remembered as a unifying force",
  "the Wise": "was known for just laws and a well-run court",
  "the Bold": "led armies personally and won renown on the battlefield",
  "the Builder": "raised great halls, roads and fortifications",
  "the Pious": "devoted much of the crown's wealth to temples and shrines",
  "the Cruel": "ruled through fear and left a troubled legacy",
  "the Peacemaker": "ended a long-standing conflict through negotiation rather than arms",
  "the Unlucky": "presided over famine, plague or defeat",
  "the Younger": "inherited the throne while still a child, ruling under regents at first",
  "the Usurper": "seized power from a rival claimant"
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
      state.history = this.buildTimeline(state, foundingYear, rulers).sort((a, b) => a.year - b.year);
    });

    TIME && console.timeEnd("generateHistory");
  }

  private getFoundingYear(): number {
    const maxOffset = Math.min(900, Math.max(60, options.year - 10));
    const offset = gauss(280, 140, 40, maxOffset);
    return options.year - offset;
  }

  private buildTimeline(state: State, foundingYear: number, rulers: Ruler[]): HistoricalEvent[] {
    const events: HistoricalEvent[] = [this.foundingEvent(state, foundingYear)];

    const origin = this.originEvent(state, foundingYear);
    if (origin) events.push(origin);

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

  private originEvent(state: State, foundingYear: number): HistoricalEvent | null {
    const culture = pack.cultures[state.culture];
    if (!culture) return null;

    const originId = culture.origins?.find(o => o !== null && o !== culture.i);
    const origin = originId == null ? null : pack.cultures[originId];
    if (!origin) return null;

    const year = foundingYear - rand(10, 60);
    return {
      year,
      type: "founding",
      title: "Origins",
      text: `The ${culture.name} people trace their roots to the ${origin.name}, who once dwelt in neighboring lands.`
    };
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
}

window.History = new HistoryModule();
