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
  | "rebellion"
  | "diplomacy_memory"
  | "economic"; // Added to align with the dynamic economic ledger system outputs

export interface HistoricalEvent {
  year: number;
  type: HistoricalEventType;
  title: string;
  text: string;
}

export interface Ruler {
  name: string;
  house: string; // Tracks the formal dynastic lineage affiliation
  start: number;
  end: number;
  notable?: string;
}

export type FigureRole =
  | "Philosopher"
  | "Inventor"
  | "Rebel Leader"
  | "Religious Figure"
  | "Commoner"
  | "Explorer"
  | "Artist"
  | "Merchant Magnate"
  | "Spymaster"
  | "Healer"
  | "General"
  | "Architect"
  | "Outcast";

export interface NotableFigure {
  name: string;
  role: FigureRole;
  year: number;
  text: string;
  relation?: {
    targetName: string;
    targetRole: FigureRole;
    type: "descendant" | "rival" | "disciple" | "nemesis" | "successor";
  };
}

export interface EconomicLedger {
  primaryExport: string;
  treasuryDebt: number;
  prosperityIndex: number;
  infrastructureLevel: number;
}

// Relational narrative injector templates mapping dynamic connections
const _RELATIONAL_TEMPLATES: Record<FigureRole, Partial<Record<FigureRole, string[]>>> = {
  Spymaster: {
    "Rebel Leader": [
      "constructed an invisible shadow network tasked entirely with hunting down the remnants of {target}'s partisan cell.",
      "successfully infiltrated the inner council originally left behind by the late rebel {target}, breaking their movement from within."
    ],
    Ruler: ["served as the eyes and ears of {target}, permanently poisoning their mind against the court nobility."]
  },
  General: {
    "Rebel Leader": [
      "crushed the desperate peasant legions formerly rallied by {target}, restoring absolute martial order to the provinces.",
      "was nearly assassinated by a lingering loyalist faction seeking vengeance for the execution of {target}."
    ],
    General: [
      "studied the precise vanguard tactics of the legendary {target}, using them to shatter foreign frontlines.",
      "avenged the historic battlefield defeat of their predecessor, {target}, by reclaiming the lost borderlands."
    ]
  },
  Philosopher: {
    Philosopher: [
      "published a fierce, controversial critique of {target}'s ethical framework, dividing the academies of {capital}.",
      "expanded upon the early logic paradigms established by {target}, bringing their school of thought to its ideological peak."
    ],
    "Religious Figure": [
      "attempted to logically reconcile the secular laws of the state with the sweeping prophetic visions of {target}."
    ]
  },
  Outcast: {
    General: [
      "was the disgraced child of the celebrated general {target}, stripped of all family titles and driven into exile.",
      "fled into the deep wilds after attempting to sabotage the grand military institutions built by {target}."
    ],
    Ruler: ["was a forgotten claimant to the throne, exiled by order of {target} to prevent a civil war."]
  },
  "Religious Figure": {
    "Religious Figure": [
      "claimed to be the spiritual successor to {target}, taking up their mantle and gathering their scattered disciples.",
      "branded the popular teachings of the late {target} as a dangerous heresy, sparking an ideological split."
    ]
  },
  Inventor: {
    Inventor: [
      "perfected the initial, flawed mechanical blue-prints left behind in {capital} by the brilliant {target}.",
      "constructed a massive public monument dedicated to the architectural legacies of {target}."
    ]
  }
};

interface FigureValues {
  state: string;
  capital: string;
  culture?: string;
  religion?: string;
  campaign?: string;
}

export interface AncientEra {
  prefix: string;
  text: string;
}

export interface SharedWorldEvent {
  title: string;
  type: HistoricalEventType;
  descriptions: Record<number, string>;
}

export interface WorldHistory {
  activeGlobalEra: AncientEra | null;
  sharedWorldEvents: Record<number, SharedWorldEvent>;
}

// Memory Matrix tracking point weights for dynamically overriding relationship standings
interface DiplomaticMemoryScore {
  historicalGrudges: number; // Negative memory weight (wars, annexations)
  historicalAccords: number; // Positive memory weight (alliances, trade pacts)
  lastCatalystYear: number;
}

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

const FLAVOR_EVENTS: Record<
  string,
  { type: HistoricalEventType; title: string; text: (state: State, religion?: string) => string }
> = {
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
    text: (state, religion) =>
      `${religion ? religion : "The old faith"} was reshaped by reformers within ${state.name}.`
  },
  Rebellion: {
    type: "rebellion",
    title: "Popular Uprising",
    text: state => `Discontent boiled over into open rebellion against the rulers of ${state.name}.`
  }
};

const LEGEND_FORMS = [
  "the Kingdom of {name}",
  "the {name} Confederacy",
  "the Tribes of {name}",
  "the {name} Dominion",
  "Old {name}",
  "the {name} Hegemony"
];

const LEGEND_DOWNFALLS: Record<string, (entity: string) => string> = {
  Invasion: entity =>
    `${entity} was overrun by invaders from beyond its borders, and its rule collapsed within a generation.`,
  "Civil War": entity => `${entity} tore itself apart in a long civil war between rival claimants.`,
  Plague: entity => `A great plague emptied the halls of ${entity}, and its people scattered to find safer ground.`,
  Drought: entity => `Years of drought withered the fields of ${entity}, forcing its people to abandon their homeland.`,
  Schism: entity => `${entity} fractured as its people split over rival faiths, never to reunite as one.`,
  Migration: entity => `${entity} was slowly abandoned as its people migrated in search of richer lands.`
};

const ANCIENT_ERAS: AncientEra[] = [
  {
    prefix: "The Age of Dawn",
    text: "Before the current borders took form, the land was a wild sprawl of primal tribes and untamed mystical forces."
  },
  {
    prefix: "The Lost Hegemony",
    text: "Centuries ago, a massive, highly centralized empire spanned these territories before collapsing under its own weight."
  },
  {
    prefix: "The Sundered Realm",
    text: "An ancient collapse, brought on by localized infighting and shifting climates, fractured the old world into disparate clans."
  },
  {
    prefix: "The Sea-King Dynasty",
    text: "Ancient maritime empires ruled the regional coastlines with absolute tyranny, demanding heavy tributes from inland settlements."
  },
  {
    prefix: "The Iron Migration",
    text: "A massive, centuries-old exodus forced entire populations across the continent, erasing ancient borders and leveling early towns."
  },
  {
    prefix: "The Ruined Concordat",
    text: "A legendary federation of trading towns once preserved an absolute peace across these lands before being undone by sudden resource scarcity."
  },
  {
    prefix: "The Primordial Shroud",
    text: "Before modern clearings were made, an impenetrable wilderness kept the ancestors divided into tiny, terrified enclaves."
  },
  {
    prefix: "The Eclipse of Stars",
    text: "A legendary cosmic alignment or astrological cataclysm struck the old world, triggering decades of dark skies and societal paranoia."
  },
  {
    prefix: "The Obsidian Dynasty",
    text: "A ruthless, proto-industrial state ruled from monolithic stone cities, stripping the hills bare for resources before mysteriously vanishing."
  },
  {
    prefix: "The Great Inundation",
    text: "Massive, prehistoric floods reshaped the river valleys and coastlines, swallowing ancient cities and forcing survivors to flee to higher ground."
  },
  {
    prefix: "The Chimeric League",
    text: "A loose, experimental alliance of vastly different cultures once shared this land, leaving behind bizarre, mismatched architectural landmarks."
  },
  {
    prefix: "The Age of Silent Whispers",
    text: "A highly advanced, secretive society dominated the region through subtle economic manipulation and an unparalleled network of subterranean tunnels."
  },
  {
    prefix: "The Bronze Crucible",
    text: "Before iron was ever forged, early metalworkers established a web of highly fortified hill-forts that constantly warred over precious tin mines."
  },
  {
    prefix: "The Nomadic Deluge",
    text: "A relentless, decades-long wave of mounted raiders from distant horizons swept across the plains, fracturing the native populations into scattered refuge-seekers."
  },
  {
    prefix: "The Magister's Fall",
    text: "An elite caste of mystic scholars and philosophers ruled the land from floating or high-altitude spires until an internal civil war brought their towers crashing down."
  },
  {
    prefix: "The Salt Syndicate",
    text: "A dominant merchant cartel once controlled every major road, water source, and trade crossroad, treating the entire continent as a corporate ledger."
  },
  {
    prefix: "The Ancestral Truce",
    text: "A mythic, centuries-long peace governed by a strict code of hospitality once united the valley before a forgotten betrayal sparked endless blood feuds."
  },
  {
    prefix: "The Frozen Century",
    text: "An abrupt, catastrophic drop in regional temperatures locked the land in a bitter mini-ice age, destroying early agrarian societies and forcing massive southward migrations."
  },
  {
    prefix: "The Broken Monoliths",
    text: "A civilization centered around erecting colossal geometric monuments controlled the region, leaving behind stone rings whose original purpose is entirely lost to time."
  },
  {
    prefix: "The Ashen Century",
    text: "A string of violent volcanic eruptions blanketed the continent in soot, causing widespread crop failure and forcing early settlements underground."
  },
  {
    prefix: "The Dynasty of the Blind King",
    text: "Lore speaks of a legendary monarch who ruled through a vast network of blind telepathic monks, creating a strange era of absolute compliance before their order vanished."
  },
  {
    prefix: "The Great Wall-Builders",
    text: "An ancient civilization attempted to isolate the entire regional border behind an impossibly massive stone barrier, bankrupting their society and leaving behind colossal, crumbling ramparts."
  },
  {
    prefix: "The Emerald Pact",
    text: "Long ago, human settlements and ancient woodland spirits abided by a strict ecological contract, keeping civilization confined to harmonious, low-impact settlements."
  },
  {
    prefix: "The Silver Rush",
    text: "A massive, uncontrolled mountain extraction boom drew hundreds of thousands to the hills, establishing lawless boomtowns that collapsed as soon as the veins ran dry."
  },
  {
    prefix: "The Concord of Silk",
    text: "An age defined by incredibly complex trade routes, where merchant princes held more power than kings and laws were written entirely as balance sheets."
  },
  {
    prefix: "The Forgotten Rebellion",
    text: "A prehistoric slave revolt successfully dismantled an tyrannical magocracy, though the resulting power vacuum plunged the lands into centuries of lawless warlordism."
  },
  {
    prefix: "The Heretic Reformation",
    text: "A sweeping iconoclastic religious movement tore across the ancient provinces, systematically destroying old temples and historical records before fracturing into countless splinter sects."
  },
  {
    prefix: "The Sun-King Accord",
    text: "An absolute monarchy ruled by dynamic sun-worshipers built giant golden spires before a sudden internal succession dispute triggered a catastrophic collapse."
  },
  {
    prefix: "The Sinking Coast",
    text: "Severe seismic shifts slowly caused the maritime boundaries to sink beneath the ocean, swallowing historical ports and permanently altering regional layouts."
  },
  {
    prefix: "The Iron Guild Hegemony",
    text: "A hyper-rigid syndicate of master blacksmiths and foundry lords controlled the keys to all metallurgy, effectively acting as the shadow rulers of the continent."
  },
  {
    prefix: "The Great Nomad Union",
    text: "A visionary nomadic khan managed to unite every wandering tribe under a single code of laws, creating a temporary empire of tents that dissolved upon their death."
  },
  {
    prefix: "The Age of the Great Library",
    text: "A short-lived but brilliant era where a decentralized council of sages gathered all global knowledge into a central grand archive before it was tragically burned."
  }
];

const FIGURE_TEMPLATES: Record<FigureRole, string[]> = {
  Philosopher: [
    "published a seminal treatise that fundamentally altered the ethical framework and legal system of {state}.",
    "founded an influential academy in {capital} that openly challenged traditional dynastic authority structures.",
    "introduced groundbreaking logic paradigms that sparked an intellectual awakening among the educated elite.",
    "penned a controversial text arguing against the divine right of kings, which was promptly banned by the crown.",
    "spent decades in isolation before emerging to teach a doctrine of radical pacifism that deeply influenced the peasantry.",
    "compiled a massive compendium of political ethics that became the mandatory curriculum for all future administrators in {state}.",
    "shaped how the {culture} people understood their place in the world, influencing generations of scholars in {state}."
  ],
  Inventor: [
    "unveiled a revolutionary agricultural or mechanical breakthrough, triggering a production boom across the region.",
    "perfected a new method of architectural engineering, allowing the massive expansion of public works in {capital}.",
    "devised a revolutionary navigation system that vastly extended the reach of the realm's merchants.",
    "engineered a highly advanced system of aqueducts and pumps, permanently insulating {capital} against severe droughts.",
    "forged a secret, highly durable alloy that drastically improved the quality and strength of the state's weaponry.",
    "designed a groundbreaking printing apparatus that allowed pamphlets and news to spread across {state} at unprecedented speeds."
  ],
  "Rebel Leader": [
    "organized a massive underground faction, rallying the heavily taxed and disenfranchised populations of {state}.",
    "led a daring, albeit bloody, guerrilla campaign demanding widespread land and societal reforms.",
    "spearheaded a sudden march on {capital}, forcing concessions from the terrified ruling elite.",
    "united several fractured outlaw bands into a cohesive partisan army that successfully seized control of the outer frontiers.",
    "orchestrated a brilliant, bloodless midnight coup that briefly established a democratic council before being forced into hiding.",
    "became a symbol of unyielding resistance after repeatedly breaking out of the highest-security dungeon in {capital}.",
    "rallied the {culture} people of {state} against a hated foreign levy, becoming a lasting symbol of defiance."
  ],
  "Religious Figure": [
    "began preaching an intense prophetic vision, establishing a devout movement that quickly spread through the countryside.",
    "proclaimed a profound spiritual renewal, defying the established orthodoxy and gathering thousands of disciples.",
    "brokered a historic internal peace by standardizing scripture and building a legendary monastery near {capital}.",
    "performed what many believed to be a grand divine miracle during a dark hour, converting thousands to their flock.",
    "led a massive, peaceful pilgrimage across {state} that culminated in the construction of a legendary grand cathedral.",
    "stood trial before the royal court for heresy, using the opportunity to deliver a speech that fractured the state church.",
    "reformed the practice of {religion}, drawing thousands of new adherents within {state}."
  ],
  Commoner: [
    "a simple baker, became a folk hero after discovering a catastrophic plot by enemy spies just in time to save {capital}.",
    "a humble laborer, accidentally unearthed a vast cache of ancient silver, completely altering the local economy.",
    "a legendary local storyteller, composed an epic poem that unified the cultural identity of {state} for generations.",
    "a young blacksmith's apprentice, stood up to a tyrannical local tax collector, accidentally inspiring a massive labor strike.",
    "a widowed farmer, successfully defended an isolated frontier outpost against an entire raiding party using pure wit and terrain.",
    "a brilliant self-taught mapmaker, mapped out a treacherous, hidden pass through the wilderness that saved an army from an ambush.",
    "a low-born stable hand, won a prestigious tournament reserved strictly for high nobility, humiliating the ruling class.",
    "a local street urchin, scaled the outer walls of the palace in {capital} to return a stolen relic, earning a permanent royal pardon."
  ],
  Explorer: [
    "braved uncharted waters to discover a legendary rich island chain, laying the foundation for an overseas trade network.",
    "mapped out a definitive overland route across deadly terrain, bridging a connection between {state} and distant civilizations.",
    "led an expedition into the deepest, untouched wilds and returned with exotic flora that revolutionized agriculture.",
    "went missing for fifteen years on a voyage to the edge of the known world, only to return to {capital} with maps of an unknown continent.",
    "discovered a forgotten valley containing the legendary ruins of a progenitor civilization, triggering an archaeological rush."
  ],
  Artist: [
    "painted a breathtaking masterpiece on the dome of the grand hall in {capital}, establishing a brand new cultural era.",
    "composed an inspiring national anthem that boosted morale across {state} during a dark time of economic hardship.",
    "sculpted an imposing, monumental statue of the state's founders that became a global wonder and pilgrimage site.",
    "wrote a series of sharp, satirical plays that publicly mocked the corruption of the ruling elite, sparking public outcries.",
    "introduced a revolutionary style of poetry and theater that shifted the cultural identity of the entire generation.",
    "became the definitive voice of {culture} art, inspiring imitators across {state} for generations."
  ],
  "Merchant Magnate": [
    "established a powerful mercantile guild centered in {capital}, single-handedly monopolizing the global spice and silk routes.",
    "negotiated a monumental trade treaty that allowed merchants from {state} to operate entirely tax-free in foreign ports.",
    "personally bailed out the royal treasury during a severe debt crisis, effectively buying a permanent seat on the high council.",
    "constructed a massive network of paved trade roads, establishing {capital} as the undisputed economic heart of the region.",
    "pooled resources to build a legendary private merchant fleet that successfully fended off foreign naval blockades."
  ],
  Spymaster: [
    "operated an invisible network of eyes and ears that successfully thwarted three separate assassination attempts on the crown.",
    "leaked beautifully forged documents to a hostile neighboring state, successfully tricking them into declaring an ill-advised war.",
    "orchestrated the quiet, bloodless elimination of a dangerous corrupt faction within the noble court of {capital}.",
    "stole the secret architectural blueprints of a rival empire's legendary border fortress, shifting military balance forever.",
    "managed a shadow syndicate that secretly controlled the criminal underworld and corrupt guard captains of {capital}."
  ],
  Healer: [
    "isolated the precise root cause of a deadly spreading illness, completely halting a plague before it hit {capital}.",
    "authored a comprehensive medicinal compendium detailing complex surgical techniques that doubled life expectancy in {state}.",
    "discovered a rare deep-forest herb capable of treating battlefield infections, saving thousands of wounded soldiers.",
    "established a sprawling network of public infirmaries, defying traditional medicine and treating rich and poor alike.",
    "perfected a strange alchemical distillation that transformed a common crop into an incredibly potent nutrient supplement."
  ],
  General: [
    "authored a masterful treatise on siege tactics that was immediately adopted by the military academies of {state}.",
    "successfully held the gates of {capital} against an overwhelming vanguard force, cementing their status as a tactical genius.",
    "revolutionized the logistical supply lines of the army, allowing regiments to march twice as far with minimal fatigue.",
    "pioneered an unorthodox cavalry formation that crushed an imposing vanguard force in an open-field engagement.",
    "resigned in protest over an unjust campaign, taking half the seasoned border regiments with them into dynamic neutrality.",
    "distinguished themselves during the {campaign}, becoming a celebrated hero of {state}."
  ],
  Architect: [
    "designed the legendary bastion walls safeguarding {capital}, which are widely considered utterly unassailable.",
    "constructed a network of interconnected stone bridges across {state} that dramatically sliced internal transit times.",
    "oversaw the grand remodeling of the sovereign palace, blending distinct historical styles into a monument of unity.",
    "planned a monumental network of public forums, turning {capital} into a beautiful beacon of civil planning.",
    "drafted the initial designs for an impenetrable coastal sea-fortress to lock down incoming hostile armadas.",
    "blended {culture} architectural traditions into the design of {capital}'s greatest monument."
  ],
  Outcast: [
    "was cast out of the noble courts of {capital}, only to set up a legendary sanctuary for outlaws deep in the wilds.",
    "hermetically sealed themselves within an ancient cavern system, where they supposedly transcribed the true history of {state}.",
    "wandered the frontier wastes for forty years, returning to warn the cities of a massive, cyclical climate crisis.",
    "exiled for uncovering political corruption, they became an international folk icon writing letters from a foreign land.",
    "survived a brutal political purge and lived as a ghost in the alleys of {capital}, quietly manipulating local street guilds."
  ]
};

interface CulturalDemographics {
  primaryCultureId: number;
  influenceWeights: Record<number, number>; // Maps cultureId -> dynamic dominance score
}

class HistoryModule {
  // Direct Ledger caching relationship metrics across state pairings dynamically
  private diplomaticMemoryMatrix: Record<string, DiplomaticMemoryScore> = {};

  private getMemoryKey(idA: number, idB: number): string {
    return idA < idB ? `${idA}_${idB}` : `${idB}_${idA}`;
  }

  private getMemory(idA: number, idB: number): DiplomaticMemoryScore {
    const key = this.getMemoryKey(idA, idB);
    this.diplomaticMemoryMatrix[key] ??= { historicalGrudges: 0, historicalAccords: 0, lastCatalystYear: 0 };
    return this.diplomaticMemoryMatrix[key];
  }

  private ensureWorldHistory(): WorldHistory {
    pack.history ??= { activeGlobalEra: null, sharedWorldEvents: {} };
    return pack.history;
  }

  private get activeGlobalEra(): AncientEra | null {
    return pack.history?.activeGlobalEra ?? null;
  }

  private set activeGlobalEra(value: AncientEra | null) {
    this.ensureWorldHistory().activeGlobalEra = value;
  }

  private get sharedWorldEvents(): Record<number, SharedWorldEvent> {
    return this.ensureWorldHistory().sharedWorldEvents;
  }

  private set sharedWorldEvents(value: Record<number, SharedWorldEvent>) {
    this.ensureWorldHistory().sharedWorldEvents = value;
  }

  generate(regenerate = false, stateId: number | null = null) {
    TIME && console.time("generateHistory");

    const isFullRun = stateId === null;

    if (isFullRun && regenerate) {
      this.diplomaticMemoryMatrix = {}; // Reset global transactional memory banks
    }

    if (!this.activeGlobalEra || (isFullRun && regenerate)) {
      this.activeGlobalEra = ra(ANCIENT_ERAS);
    }

    if (Object.keys(this.sharedWorldEvents).length === 0 || (isFullRun && regenerate)) {
      this.sharedWorldEvents = {};
      this.seedSharedWorldEvents();
    }

    pack.states.forEach(state => {
      if (!state.i || state.removed) return;
      if (stateId !== null && state.i !== stateId) return;
      if (!regenerate && stateId === null && state.history?.length) return;

      this.regenerateState(state);
    });

    if (isFullRun) {
      this.synchronizeGeopoliticalDiplomacy();
    }

    TIME && console.timeEnd("generateHistory");
  }

  private seedSharedWorldEvents(): void {
    const plagueYear = Math.round(options.year - rand(120, 240));
    this.sharedWorldEvents[plagueYear] = {
      title: "The Great Contagion",
      type: "disaster",
      descriptions: {}
    };

    const crashYear = Math.round(options.year - rand(40, 90));
    this.sharedWorldEvents[crashYear] = {
      title: "The Great Currency Crash",
      type: "disaster",
      descriptions: {}
    };
  }

  private regenerateState(state: State): void {
    const foundingYear = this.getFoundingYear();

    // Initialize the dynamic cultural tracker with the state's map-assigned starting culture
    const demographics: CulturalDemographics = {
      primaryCultureId: state.culture,
      influenceWeights: { [state.culture]: 100 }
    };

    // Step 1: Generate the dynasty, passing the demographic tracker so usurpations can introduce foreign bloodlines
    const { rulers, dynasticShifts, updatedDemographics } = this.generateDynastyWithCulture(
      state,
      foundingYear,
      demographics
    );
    state.rulers = rulers;
    state.rulers.sort((a, b) => b.start - a.start);

    // Step 2: Build the timeline, passing the dynamic demographics which will mutate over time based on wars and alliances
    const { events, figures } = this.buildTimelineWithCulture(
      state,
      foundingYear,
      rulers,
      dynasticShifts,
      updatedDemographics
    );
    state.figures = figures.sort((a, b) => b.year - a.year);
    state.history = events.sort((a, b) => b.year - a.year);

    // Step 3: Write the final mutated culture back to the live global state object so the rest of the map reacts to the shift
    state.culture = updatedDemographics.primaryCultureId;
  }

  private generateDynastyWithCulture(
    state: State,
    foundingYear: number,
    demographics: CulturalDemographics
  ): { rulers: Ruler[]; dynasticShifts: HistoricalEvent[]; updatedDemographics: CulturalDemographics } {
    const rulers: Ruler[] = [];
    const dynasticShifts: HistoricalEvent[] = [];
    let year = foundingYear;

    let currentHouseCulture = demographics.primaryCultureId;
    const generateNewHouseName = (cId: number): string => `House ${Names.getCultureShort(cId)}`;
    let currentHouse = generateNewHouseName(currentHouseCulture);

    while (year < options.year) {
      const reign = Math.max(1, gauss(19, 11, 1, 55));
      const end = Math.min(options.year, year + reign);

      let notable = P(0.35) ? ra(Object.keys(EPITHETS)) : undefined;

      // Pull names dynamically from the current dominant house culture rather than a static state value
      const individualName = Names.getCulture(currentHouseCulture);

      if (rulers.length > 0 && P(0.3)) {
        const previousHouse = currentHouse;
        const previousRuler = rulers[rulers.length - 1];

        // Succession Crisis: 25% chance the new usurping house belongs to a neighboring state's culture
        const neighborStates = pack.states.filter(s => s.i && !s.removed && s.i !== state.i && state.diplomacy?.[s.i]);
        if (neighborStates.length > 0 && P(0.25)) {
          const foreignState = ra(neighborStates);
          currentHouseCulture = foreignState.culture;

          // Inject weight into the demographic matrix for the foreign culture
          demographics.influenceWeights[currentHouseCulture] =
            (demographics.influenceWeights[currentHouseCulture] || 0) + 40;
        } else {
          currentHouseCulture = demographics.primaryCultureId;
        }

        currentHouse = generateNewHouseName(currentHouseCulture);
        notable = "the Usurper";

        let crisisText = `Following the passing of ${previousRuler.name}, the fall of ${previousHouse} allowed the usurpers of ${currentHouse} to seize the high seat.`;
        if (currentHouseCulture !== demographics.primaryCultureId) {
          const foreignCultureName = pack.cultures[currentHouseCulture]?.name || "foreign custom";
          crisisText += ` This marked a radical shift, bringing ${foreignCultureName} traditions and bloodlines directly into the royal court.`;
        }

        dynasticShifts.push({
          year: year,
          type: "rebellion",
          title: "Succession Crisis",
          text: crisisText
        });

        this.applyDemographicRipple(state, "war-casualty");
      }

      rulers.push({ name: individualName, house: currentHouse, start: year, end, notable });
      year = end;
    }

    if (!rulers.length) {
      rulers.push({
        name: Names.getCulture(currentHouseCulture),
        house: currentHouse,
        start: foundingYear,
        end: options.year
      });
    }

    return { rulers, dynasticShifts, updatedDemographics: demographics };
  }

  private buildTimelineWithCulture(
    state: State,
    foundingYear: number,
    _rulers: Ruler[],
    dynasticShifts: HistoricalEvent[],
    demographics: CulturalDemographics
  ): { events: HistoricalEvent[]; figures: NotableFigure[] } {
    // FIX: Initialize the Economic Ledger tracking engine to process structural economic trends
    const ledger = this.initializeEconomicLedger(state);

    // Core structural event logs
    const recordedEvents: HistoricalEvent[] = [
      ...this.warEvents(state, foundingYear),
      ...this.diplomacyEvents(state, foundingYear),
      ...this.flavorEvents(state, foundingYear),
      ...dynasticShifts,
      ...this.generateHistoricalMemoryFlavor(state, foundingYear)
    ];

    // Evaluate geopolitical culture pressure dynamically based on timeline events
    const culturalFractureEvents: HistoricalEvent[] = [];

    // Sort events chronologically to simulate progressive demographic drift
    const chronologicalEvents = [...recordedEvents].sort((a, b) => a.year - b.year);

    chronologicalEvents.forEach(event => {
      // Rule 1: Prolonged alliances or vassalage cause creeping cultural integration
      if (event.type === "peace" && event.title === "Defensive Pact") {
        const allyIndex = state.diplomacy?.indexOf("Ally");
        if (allyIndex && allyIndex > 0 && pack.states[allyIndex]) {
          const allyCulture = pack.states[allyIndex].culture;
          demographics.influenceWeights[allyCulture] = (demographics.influenceWeights[allyCulture] || 0) + 15;
        }
      }

      // Rule 2: Subjugation drastically accelerates foreign cultural enforcement
      if (event.type === "war" && event.title === "Vassalization") {
        const masterIndex = state.diplomacy?.indexOf("Vassal");
        if (masterIndex && masterIndex > 0 && pack.states[masterIndex]) {
          const masterCulture = pack.states[masterIndex].culture;
          demographics.influenceWeights[masterCulture] = (demographics.influenceWeights[masterCulture] || 0) + 50;
        }
      }

      // Check for an absolute cultural fracture/flip threshold
      for (const [cultureIdStr, weight] of Object.entries(demographics.influenceWeights)) {
        const cultureId = Number(cultureIdStr);
        if (
          cultureId !== demographics.primaryCultureId &&
          weight > demographics.influenceWeights[demographics.primaryCultureId]
        ) {
          const oldCultureName = pack.cultures[demographics.primaryCultureId]?.name || "the old ways";
          const newCultureName = pack.cultures[cultureId]?.name || "foreign ways";

          demographics.primaryCultureId = cultureId; // Dynamic Shift Triggered!

          // Structural consequence of dynamic cultural shifts: change primary export specialization
          ledger.primaryExport = "Exotic Luxury Goods";
          ledger.infrastructureLevel += 15;

          culturalFractureEvents.push({
            year: event.year + 2,
            type: "religious", // Repurposed for general societal/cultural shifts
            title: "Cultural Fracture",
            text: `The systemic integration of foreign traditions reached a tipping point. The historic customs of ${oldCultureName} have fractured, and the state has fundamentally assimilated into the cultural sphere of ${newCultureName}, transforming local production toward ${ledger.primaryExport}.`
          });

          // Re-balance scales around the new dominant baseline
          demographics.influenceWeights[cultureId] = 100;
          break;
        }
      }
    });

    // Merge the cultural shift logs back into the general timeline array
    recordedEvents.push(...culturalFractureEvents);

    // FIX: Process and run the timeline through the economic analyzer, then merge the dynamic records into the core array
    const ecoEvents = this.economicEvents(state, foundingYear, ledger, recordedEvents);
    recordedEvents.push(...ecoEvents);

    // Generate figures, ensuring they use the running dynamic primary culture context adjusted for chronological placement
    const { events: figureEvents, figures } = this.figureEventsWithDynamicCulture(state, foundingYear, demographics);

    // Generate the actual legendary and founding events array
    const legendaryEvents: HistoricalEvent[] = [
      ...this.legendaryEvents(state, foundingYear),
      this.foundingEvent(state, foundingYear)
    ];

    // Process rulers & apply final contextual text mappings as normal
    const rulerEvents: HistoricalEvent[] = [];

    // Combine all compiled historical sub-arrays into the complete return sequence
    const events = [...recordedEvents, ...rulerEvents, ...figureEvents, ...legendaryEvents];
    return { events, figures };
  }

  private figureEventsWithDynamicCulture(
    state: State,
    foundingYear: number,
    demographics: CulturalDemographics
  ): { events: HistoricalEvent[]; figures: NotableFigure[] } {
    const roles = Object.keys(FIGURE_TEMPLATES) as FigureRole[];
    const count = rand(12, 32);
    const figures: NotableFigure[] = [];
    const events: HistoricalEvent[] = [];

    for (let i = 0; i < count; i++) {
      const year = rand(foundingYear + 10, Math.max(foundingYear + 11, options.year - 2));
      const role = ra(roles);

      // Determine what culture was globally dominant in the state at the exact time this figure was born
      const activeCulture = demographics.primaryCultureId;
      const name = Names.getCulture(activeCulture);

      const values: FigureValues = {
        state: state.name,
        capital: pack.burgs[state.capital]?.name || state.name,
        culture: pack.cultures[activeCulture]?.name,
        religion: pack.religions[pack.cells.religion[state.center]]?.name
      };

      const text = this.figureText(role, name, values);
      figures.push({ name, role, year, text });
      events.push({ year, type: "figure", title: `${name}, ${role}`, text });
    }

    return { events, figures };
  }

  // EconomicLedger: track baseline resources and compute dynamic economic anomalies based on historical events
  private initializeEconomicLedger(_state: State): EconomicLedger {
    // Determine baseline export based on primary biome or state traits
    const defaultExports = ["Grain", "Timber", "Iron Ore", "Textiles", "Spices"];
    const baseExport = ra(defaultExports);

    return {
      primaryExport: baseExport,
      treasuryDebt: 0,
      prosperityIndex: 100,
      infrastructureLevel: 50
    };
  }

  // Process timeline data to append dynamic, context-aware economic infrastructure shifts
  private economicEvents(
    state: State,
    foundingYear: number,
    ledger: EconomicLedger,
    timelineBefore: HistoricalEvent[]
  ): HistoricalEvent[] {
    const generatedEco: HistoricalEvent[] = [];

    // Scan for wars to compute destruction tax weights
    const warCount = timelineBefore.filter(e => e.type === "war").length;
    const plagueCount = timelineBefore.filter(e => e.text.includes("Contagion") || e.text.includes("plague")).length;

    // Apply simulation changes to the structural state metrics
    ledger.treasuryDebt += warCount * 25;
    ledger.prosperityIndex -= plagueCount * 30;
    ledger.infrastructureLevel += Math.max(10, rand(10, 40));

    // Dynamic Event Injector 1: National Debt Crisis
    if (ledger.treasuryDebt > 40) {
      const year = rand(foundingYear + 40, options.year - 15);
      generatedEco.push({
        year,
        type: "economic",
        title: "Sovereign Debt Crisis",
        text: `Heavy expenditure during regional military mobilizations forced the crown of ${state.name} into severe compounding debt, collapsing their credit with foreign trade guilds.`
      });
      this.applyDemographicRipple(state, "war-casualty");
    }

    // Dynamic Event Injector 2: Trade Lane Expansion
    if (ledger.prosperityIndex > 60 && ledger.treasuryDebt < 50) {
      const year = rand(foundingYear + 60, options.year - 5);
      generatedEco.push({
        year,
        type: "economic",
        title: "Commercial Golden Route",
        text: `With infrastructure ratings calculated at ${ledger.infrastructureLevel}, local merchant cartels capitalized on regional peace to firmly establish ${state.name} as a dominant hub exporting high-grade ${ledger.primaryExport}.`
      });
      this.applyDemographicRipple(state, "economic-boost");
    }

    return generatedEco;
  }

  // Iterates through memory matrix and applies adjustments directly into live map state array parameters
  private synchronizeGeopoliticalDiplomacy(): void {
    pack.states.forEach(stateA => {
      if (!stateA.i || stateA.removed || !stateA.diplomacy) return;

      const diplomacy = stateA.diplomacy;

      pack.states.forEach(stateB => {
        if (!stateB.i || stateB.removed || stateA.i === stateB.i) return;

        const memory = this.getMemory(stateA.i, stateB.i);
        const netBias = memory.historicalAccords - memory.historicalGrudges;

        // Mutate real map values dynamically using weighted generational benchmarks
        if (netBias <= -3) {
          diplomacy[stateB.i] = "Rival";
        } else if (netBias >= 3) {
          diplomacy[stateB.i] = "Ally";
        } else if (netBias < 0 && diplomacy[stateB.i] === "Ally") {
          diplomacy[stateB.i] = "Suspicious";
        }
      });
    });
  }

  onStateRename(stateId: number): void {
    const state = pack.states[stateId];
    if (!state?.i || state.removed) return;

    this.regenerateState(state);

    pack.states.forEach(other => {
      if (!other.i || other.removed || other.i === stateId) return;
      const inCampaign = (other.campaigns || []).some(c => c.attacker === stateId || c.defender === stateId);
      const relation = other.diplomacy?.[stateId];
      const inDiplomacy = relation != null && relation !== "x";
      if (inCampaign || inDiplomacy) this.regenerateState(other);
    });
  }

  onCultureRename(cultureId: number): void {
    pack.states.forEach(state => {
      if (!state.i || state.removed) return;
      const culture = pack.cultures[state.culture];
      const usesDirectly = state.culture === cultureId;
      const usesAsOrigin = culture?.origins?.includes(cultureId);
      if (usesDirectly || usesAsOrigin) this.regenerateState(state);
    });
  }

  onReligionRename(religionId: number): void {
    pack.states.forEach(state => {
      if (!state.i || state.removed) return;
      if (pack.cells.religion[state.center] === religionId) this.regenerateState(state);
    });
  }

  private getFoundingYear(): number {
    const maxOffset = Math.min(900, Math.max(60, options.year - 10));
    const offset = gauss(280, 140, 40, maxOffset);
    return options.year - offset;
  }

  private applyDemographicRipple(state: State, type: "war-casualty" | "peace-boom" | "plague-loss" | "economic-boost") {
    const capitalBurg = pack.burgs[state.capital];

    switch (type) {
      case "war-casualty":
        if (capitalBurg) capitalBurg.population = Math.max(1, Math.round(capitalBurg.population * 0.9));
        state.urban = Math.max(1, Math.round(state.urban * 0.92));
        state.rural = Math.max(1, Math.round(state.rural * 0.95));
        break;
      case "plague-loss":
        if (capitalBurg) capitalBurg.population = Math.max(1, Math.round(capitalBurg.population * 0.82));
        state.urban = Math.max(1, Math.round(state.urban * 0.85));
        state.rural = Math.max(1, Math.round(state.rural * 0.88));
        break;
      case "peace-boom":
      case "economic-boost":
        if (capitalBurg) capitalBurg.population = Math.round(capitalBurg.population * 1.08);
        state.urban = Math.round(state.urban * 1.1);
        state.rural = Math.round(state.rural * 1.05);
        break;
    }
  }

  private legendaryEvents(state: State, foundingYear: number): HistoricalEvent[] {
    const culture = pack.cultures[state.culture];
    const originId = culture ? culture.origins?.find(o => o !== null && o !== culture.i) : undefined;
    const originCulture = originId == null ? null : pack.cultures[originId];
    const rootCultureName = originCulture?.name || culture?.name || "the peoples of this land";

    const legendSpan = gauss(7500, 2000, 200, 10500);
    const emergenceYear = foundingYear - legendSpan;
    const capitalName = pack.burgs[state.capital]?.name || state.name;
    const entityName = ra(LEGEND_FORMS).replace("{name}", Names.getCultureShort(originId ?? state.culture));

    const backdrop = this.activeGlobalEra || ra(ANCIENT_ERAS);
    const backdropYear = emergenceYear - rand(500, 10000);

    const events: HistoricalEvent[] = [
      {
        year: backdropYear,
        type: "legend",
        title: backdrop.prefix,
        text: backdrop.text
      },
      {
        year: emergenceYear,
        type: "legend",
        title: `Rise of ${entityName}`,
        text: `Long before ${state.name} took its current form, ${rootCultureName} coalesced into ${entityName}, an early power that first brought order to the region.`
      }
    ];

    const intermediateEventCount = rand(5, 12);
    const milestoneYears: number[] = [];

    while (milestoneYears.length < intermediateEventCount) {
      const potentialYear = rand(emergenceYear + 50, foundingYear - 500);
      if (!milestoneYears.includes(potentialYear)) {
        milestoneYears.push(potentialYear);
      }
    }
    milestoneYears.sort((a, b) => a - b);

    const milestoneTemplates = [
      {
        title: "Imperial Expansion",
        text: () =>
          `${entityName} Pushed its borders to the natural horizons, subjugating surrounding clans and mapping the outer wilderness.`
      },
      {
        title: "Great Monument Raised",
        text: () =>
          `A grand capital city was constructed by ${entityName}, anchoring its power with monolithic architecture that would outlast its laws.`
      },
      {
        title: "The Sovereign Succession",
        text: () =>
          `A legendary dynasty took command of ${entityName}, centralizing bureaucratic control and codifying a strict primitive legal system.`
      },
      {
        title: "Era of Enlightenment",
        text: () =>
          `Scholars under ${entityName} perfected advanced early astronomical systems and agricultural techniques, prompting a massive population boom.`
      },
      {
        title: "The Border Skirmishes",
        text: () =>
          `Fringe territories of ${entityName} faced relentless incursions from early nomadic migrations, forcing the construction of defensive earthworks.`
      },
      {
        title: "Internal Schism",
        text: () =>
          `An intellectual and religious schism fractured the ruling elite of ${entityName}, leaving its administrative networks permanently fragile.`
      },
      {
        title: "The Subjugation of Outlaws",
        text: () =>
          `A massive military sweep cleared the ancient trade routes of rogue bands, solidifying the domestic security of ${entityName}.`
      },
      {
        title: "The Iron Vanguard",
        text: () =>
          `The military of ${entityName} standardized heavy armor tactics, creating an elite vanguard corps that won legendary victories.`
      },
      {
        title: "Annexation of the Coastline",
        text: () =>
          `${entityName} launched a sweeping campaign to absorb independent coastal fishing villages, creating its first true maritime frontier.`
      },
      {
        title: "The Pacification Edict",
        text: () =>
          `Following a series of brutal tribal border wars, the sovereign of ${entityName} signed a historic treaty that forcibly integrated defeated chieftains into the high council.`
      },
      {
        title: "March of the Five Legions",
        text: () =>
          `A massive expeditionary force was dispatched into the uncharted western expanses, establishing a chain of heavily fortified supply outposts.`
      },
      {
        title: "The Sovereign's Bodyguard",
        text: () =>
          `An elite, sworn order of warrior-monks was established to protect the rulers of ${entityName}, heavily influencing court politics for generations.`
      },
      {
        title: "Fortress Network Completed",
        text: () =>
          `Engineers completed an unbroken chain of watchtowers along the mountain passes, permanently securing the heartland of ${entityName}.`
      },
      {
        title: "The Great Weapon Disarmament",
        text: () =>
          `To prevent internal uprisings, ${entityName} issued a strict decree confiscating high-quality metal weapons from all non-state militias.`
      },
      {
        title: "The Subjugation Wars",
        text: () =>
          `Legions from ${entityName} launched a massive pacification campaign against rebellious frontier tribes, forcing heavy tribute.`
      },
      {
        title: "Annexation of the Coast",
        text: () =>
          `${entityName} systematically absorbed independent coastal fishing communities, turning them into high-volume naval shipyards.`
      },
      {
        title: "Great Border Outposts",
        text: () =>
          `A string of massive watchtowers and keeps was constructed along the outer rim of ${entityName} to monitor nomadic migrations.`
      },
      {
        title: "The Sovereign Conquest",
        text: () =>
          `A brilliant vanguard commander under ${entityName} annexed a wealthy neighboring river valley, doubling the empire's arable land.`
      },
      {
        title: "The Iron Clampdown",
        text: () =>
          `Following a period of instability, provincial legions enforced an absolute martial law across all major territories of ${entityName}.`
      },
      {
        title: "The Desert Marches",
        text: () =>
          `Expeditions sent by ${entityName} secured the treacherous southern trade paths, erecting walled oases for passing caravans.`
      },
      {
        title: "The Grand Canal Project",
        text: () =>
          `Thousands of laborers spent a decade carving a massive canal system, linking major river veins and transforming commerce within ${entityName}.`
      },
      {
        title: "The Obsidian Highway",
        text: () =>
          `A sprawling network of perfectly paved stone roads was completed, allowing messengers to traverse the length of ${entityName} in record time.`
      },
      {
        title: "Deep-Earth Mining Boom",
        text: () =>
          `Miners in the central crags struck a colossal vein of rare ores, fueling a rapid surge in primitive technological development across ${entityName}.`
      },
      {
        title: "The Terraced Hills",
        text: () =>
          `Massive landscape engineering reshaped the steep mountain valleys into highly productive terraced farms, drastically increasing food security.`
      },
      {
        title: "The Great Aqueduct",
        text: () =>
          `An engineering marvel of stone arches was raised to channel fresh glacial water directly into the expanding urban centers of ${entityName}.`
      },
      {
        title: "Deforestation of the Wilds",
        text: () =>
          `To meet the insatiable demand for fuel and timber, vast swaths of ancient primal forests were systematically cleared by imperial decree.`
      },
      {
        title: "The Sinking Citadel",
        text: () =>
          `A massive marshland fortress built by ${entityName} began slowly sinking into the mire, forcing a costly and complicated structural relocation.`
      },
      {
        title: "The Great Bridge of Unity",
        text: () =>
          `Architects bridged a treacherous river chasm, physically linking two historically hostile geographical regions of ${entityName}.`
      },
      {
        title: "The Subterranean Vaults",
        text: () =>
          `Deep catacombs and secure state treasuries were carved directly into the bedrock beneath the capital city to safeguard imperial wealth.`
      },
      {
        title: "Paved Imperial Highways",
        text: () =>
          `A sprawling network of stone-paved highways was laid down, connecting the distant frontiers directly to the heart of ${entityName}.`
      },
      {
        title: "The Colossal Aqueducts",
        text: () =>
          `Massive stone aqueducts were erected across the valleys, supplying millions of gallons of fresh mountain water to the core cities.`
      },
      {
        title: "The Great Foundry Built",
        text: () =>
          `A mega-scale metallurgical foundry was established, standardizing the smelting of copper, bronze, and early iron tools across the realm.`
      },
      {
        title: "The Citadel of Sages",
        text: () =>
          `Construction wrapped on a monumental archive tower designed to store the ancestral genealogies and tax records of the entire population.`
      },
      {
        title: "The Deep Vaults Excavated",
        text: () =>
          `Deep, bomb-proof subterranean vaults were carved beneath the capital of ${entityName} to house the collective wealth of the elite.`
      },
      {
        title: "Linguistic Standardization",
        text: () =>
          `Sages collected regional dialects and codified a single official written script, permanently unifying the administrative records of ${entityName}.`
      },
      {
        title: "The Celestial Calendar",
        text: () =>
          `Astronomers in ${entityName} drafted an incredibly precise solar calendar, optimizing planting seasons and seasonal festivals across the empire.`
      },
      {
        title: "The Great Census",
        text: () =>
          `A massive bureaucratic undertaking successfully cataloged every village, livestock herd, and taxable family under the dominion of ${entityName}.`
      },
      {
        title: "Founding of the High Lyceum",
        text: () =>
          `An expansive sanctuary for natural philosophy and early medicine was established, drawing the finest minds of the ancient world.`
      },
      {
        title: "The Botanical Registry",
        text: () =>
          `Healers compiled a comprehensive master scroll detailing hundreds of medicinal herbs, dramatically increasing life expectancy in urban hubs.`
      },
      {
        title: "The Cultural Migration",
        text: () =>
          `An unprecedented wave of artists, poets, and musicians settled in the heartland, establishing ${entityName} as the definitive cultural jewel of the era.`
      },
      {
        title: "The Great Code of Laws",
        text: () =>
          `Legal scholars chiseled a definitive set of civil ordinances onto colossal stone tablets, establishing the concept of public judicial trials.`
      },
      {
        title: "The Glassworks Discovery",
        text: () =>
          `Artisans accidentally perfected primitive glass-blowing techniques, generating an incredibly lucrative and highly secretive luxury export industry.`
      },
      {
        title: "The Golden Philosophy",
        text: () =>
          `A profound philosophical movement swept the urban centers of ${entityName}, focusing on civic duty, logic, and architectural symmetry.`
      },
      {
        title: "The Great Library Founded",
        text: () =>
          `A decentralized council of sages gathered global scrolls into a central grand archive, making the capital a beacon of learning.`
      },
      {
        title: "Standardization of Currencies",
        text: () =>
          `Mint houses across ${entityName} began stamping unified gold and silver coins, drastically reducing market friction and boosting trade.`
      },
      {
        title: "The Great Cartography Voyage",
        text: () =>
          `A fleet of state-funded explorers returned to ${entityName} with definitive charts of the world's major oceans and continental edges.`
      },
      {
        title: "The Epic of the Founders",
        text: () =>
          `A master poet composed a legendary national epic detailing the mythic origin of ${entityName}, unifying its cultural identity.`
      },
      {
        title: "Agricultural Revolution",
        text: () =>
          `The widespread adoption of a new crop-rotation and terrace-farming methodology tripled food production across the dry highlands.`
      },
      {
        title: "The Velvet Coup",
        text: () =>
          `A quiet, bloodless shift in power occurred within the high councils of ${entityName}, replacing military rulers with wealthy civil administrators.`
      },
      {
        title: "The Regency Crisis",
        text: () =>
          `An infant monarch inherited the throne of ${entityName}, resulting in a chaotic decade where corrupt regents vied for shadow control.`
      },
      {
        title: "The Lex Imperialis",
        text: () =>
          `The legal scholars of ${entityName} completed a sweeping codification of laws, carving standard codes onto massive public stone tablets.`
      },
      {
        title: "Edict of Tolerate",
        text: () =>
          `To prevent a collapse, the crown of ${entityName} issued a decree granting equal citizenship and legal rights to conquered outer provinces.`
      },
      {
        title: "The Council of satraps",
        text: () =>
          `The empire was divided into distinct administrative satrapies, granting local governors autonomy in exchange for absolute loyalty.`
      },
      {
        title: "The Silver Standardization",
        text: () =>
          `${entityName} minted its very first uniform currency, completely replacing primitive barter systems across all provinces.`
      },
      {
        title: "The Silk Road Treaty",
        text: () =>
          `Diplomats secured a landmark trade agreement with distant foreign realms, inaugurating a legendary era of overland luxury trade.`
      },
      {
        title: "The Great Grain Reserve",
        text: () =>
          `To guard against cyclical droughts, ${entityName} built a sprawling network of state-managed granaries to store emergency food surpluses.`
      },
      {
        title: "Monopoly of the Salt Mines",
        text: () =>
          `The crown seized absolute ownership of all coastal and subterranean salt deposits, turning a basic necessity into the state's main revenue source.`
      },
      {
        title: "The Merchant Guild Cartel",
        text: () =>
          `A powerful syndicate of wealthy traders obtained exclusive royal charters, effectively acting as an auxiliary government within ${entityName}.`
      },
      {
        title: "The Animal Domestication Surge",
        text: () =>
          `The mass breeding of a highly resilient strain of draft beasts revolutionized heavy transport and field plowing across the territory.`
      },
      {
        title: "The Great Fair of the Steppes",
        text: () =>
          `An annual, month-long trade festival was established on the neutral borderlands, drawing diverse merchants from far beyond the empire's reach.`
      },
      {
        title: "The Currency Debasement Crises",
        text: () =>
          `Facing heavy military costs, the state reduced the precious metal content of its coinage, triggering massive economic inflation.`
      },
      {
        title: "The Spice Influx",
        text: () =>
          `The opening of a new southern shipping route flooded ${entityName} with exotic spices, profoundly changing local culinary traditions and preservation methods.`
      },
      {
        title: "The Agrarian Reforms",
        text: () =>
          `Land ownership laws were heavily restructured, taking massive swaths of property away from corrupt governors and distributing it to local communes.`
      },
      {
        title: "The Bread Riots",
        text: () =>
          `A sudden dip in crop yields caused mass panic in the capital of ${entityName}, resulting in widespread looting of the royal granaries.`
      },
      {
        title: "The Taxpayer Mutiny",
        text: () =>
          `Several wealthy outer trade hubs refused to send their yearly silver tithes, sparking a localized civil conflict within ${entityName}.`
      },
      {
        title: "The Guild Wars",
        text: () =>
          `Rival merchant networks within the empire turned to economic sabotage and street assassinations to control the flow of vital resources.`
      },
      {
        title: "The Pretoria Mutiny",
        text: () =>
          `The elite palace guard of ${entityName} staged a violent strike, demanding higher payouts and threatening the safety of the line of succession.`
      },
      {
        title: "The Outlaw Coalition",
        text: () =>
          `Exiled criminals and disenfranchised peasants pooled their strength to build a rogue, parallel micro-state inside the deep wilds.`
      },
      {
        title: "The Great Trade Silk Road",
        text: () =>
          `Caravans from distant, unknown empires arrived at the gates of ${entityName}, creating a massive market for exotic textiles and spices.`
      },
      {
        title: "The Maritime Bloom",
        text: () =>
          `Ship captains of ${entityName} established total hegemony over the commercial sea lanes, turning every local port into a bustling hub.`
      },
      {
        title: "The Silver Influx",
        text: () =>
          `The discovery of massive, unexpected silver veins in the mountains triggered an era of unmatched material wealth and luxury.`
      },
      {
        title: "The Festival of Centuries",
        text: () =>
          `${entityName} celebrated a major historical milestone with months of lavish public games, free grain distributions, and theatrical plays.`
      },
      {
        title: "The Merchant Golden Age",
        text: () =>
          `Private trading guilds accumulated so much wealth that they began directly financing the state's standing army and navy.`
      },
      {
        title: "The Artisan Monopoly",
        text: () =>
          `Craftsmen within ${entityName} perfected specialized glassblowing and pottery techniques, monopolizing the global luxury export trade.`
      },
      {
        title: "Rise of the Sun Faith",
        text: () =>
          `A sweeping religious movement dedicated to solar worship became the official state religion of ${entityName}, altering the calendar.`
      },
      {
        title: "The Great Iconoclasm",
        text: () =>
          `Religious zealots within ${entityName} destroyed centuries of primitive tribal art, replacing old idols with geometric stone shrines.`
      },
      {
        title: "The Ascetic Migration",
        text: () =>
          `Thousands of devout believers left the crowded cities of ${entityName} to build isolated, contemplative monasteries in the cliffs.`
      },
      {
        title: "The Great Prophecy",
        text: () =>
          `A renowned seer delivered a chilling, multi-generation prophecy that drastically altered the defensive military policies of ${entityName}.`
      },
      {
        title: "The Orthodoxy Council",
        text: () =>
          `High priests gathered in the capital to standardize holy texts, ruthlessly excommunicating alternative theological interpretations.`
      },
      {
        title: "The Temple Construction Boom",
        text: () =>
          `An era of deep piety resulted in over a third of the empire's internal tax revenue being diverted to building monumental holy complexes.`
      },
      {
        title: "The Unearthing of Relics",
        text: () =>
          `Excavations uncovered a cache of highly revered artifacts belonging to a progenitor culture, prompting a massive spiritual revival.`
      },
      {
        title: "The Iconoclastic Purge",
        text: () =>
          `A militant religious faction gained favor with the crown, launching a systemic campaign to destroy old tribal totems and shrines.`
      },
      {
        title: "Rise of the Sun Pantheon",
        text: () =>
          `Traditional local animist beliefs were slowly replaced by a highly organized, state-sponsored religion centered on solar worship.`
      },
      {
        title: "The Heretic Uprising",
        text: () =>
          `An outlawed spiritual sect organized a massive peasant revolt in the outer provinces, taking three elite legions to completely suppress.`
      },
      {
        title: "The Pilgrim Trails",
        text: () =>
          `A remote mountain shrine became a massive site of spiritual devotion, drawing tens of thousands of travelers across ${entityName} each spring.`
      },
      {
        title: "The Translation of Scriptures",
        text: () =>
          `Scribes spent a generation translating holy oral traditions into text, establishing a rigid religious orthodoxy.`
      },
      {
        title: "The Holy War Edict",
        text: () =>
          `Rulers declared a sacred campaign against an aggressive neighboring kingdom, framing the geopolitical struggle as a divine mandate.`
      },
      {
        title: "The Eclipse Rituals",
        text: () =>
          `An unexpected solar eclipse sparked deep panic throughout ${entityName}, causing the state to dedicate massive resources toward appeasing the cosmic powers.`
      },
      {
        title: "The Great Locust Swarm",
        text: () =>
          `A colossal insect migration stripped the eastern provinces of ${entityName} completely bare, forcing emergency grain rationing.`
      },
      {
        title: "The Tremor of Old",
        text: () =>
          `A violent earthquake shook the heartland, collapsing older mud-brick fortifications but prompting safer, smarter stone masonry standards.`
      },
      {
        title: "The Decade of Mud",
        text: () =>
          `Unprecedented, relentless rainfall caused massive mudslides along the hills, burying early frontier mining outposts under feet of earth.`
      },
      {
        title: "The Shifting River Bed",
        text: () =>
          `A major river vein naturally migrated over three miles away from a key trading city of ${entityName}, ruining its local harbor economy.`
      },
      {
        title: "The Great Frost",
        text: () =>
          `An unseasonable summer freeze ruined crops across ${entityName}, sparking wide-scale migrations toward the warmer southern coasts.`
      },
      {
        title: "The Inflationary Spiral",
        text: () =>
          `The deliberate debasement of gold coins by the treasury caused consumer confidence in ${entityName}'s currency to completely crater.`
      },
      {
        title: "The Mercenary Reliance",
        text: () =>
          `Faced with a declining citizen military pool, ${entityName} began hiring foreign mercenary groups to protect its borders.`
      },
      {
        title: "The Bureaucratic Bloat",
        text: () =>
          `The civil administrative ranks grew so large and corrupt that basic state decrees took months to pass through the regional courts.`
      },
      {
        title: "The Great Decadence",
        text: () =>
          `The ruling elite completely withdrew from military and agricultural management, spending fortunes on competitive palace architecture.`
      },
      {
        title: "The Fractured Frontier",
        text: () =>
          `Communication with the outermost satrapies broke down entirely, leaving remote local commanders to rule their zones as independent fiefdoms.`
      }
    ];

    milestoneYears.forEach(year => {
      let template = ra(milestoneTemplates);

      if (backdrop.prefix === "The Frozen Century" && P(0.4)) {
        template = {
          title: "The Frost Bite",
          text: () =>
            `As glaciers pushed down from the north during ${backdrop.prefix}, ${entityName} was forced to completely abandon its northernmost crop networks.`
        };
      } else if (backdrop.prefix === "The Great Inundation" && P(0.4)) {
        template = {
          title: "The Rising Tides",
          text: () =>
            `Unprecedented sea level rises from ${backdrop.prefix} compromised the low-lying administrative structures of ${entityName}.`
        };
      } else if (backdrop.prefix === "The Magister's Fall" && P(0.4)) {
        template = {
          title: "Echoes of the Spire",
          text: () =>
            `Debris and fallout from the collapsing sky-structures of the old magisters disrupted basic resource distribution across ${entityName}.`
        };
      }

      events.push({
        year,
        type: "legend",
        title: template.title,
        text: template.text()
      });
    });

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

  private warEvents(state: State, foundingYear: number): HistoricalEvent[] {
    const events: HistoricalEvent[] = [];

    (state.campaigns || []).forEach(campaign => {
      if (campaign.start < foundingYear) return;
      const attacker = pack.states[campaign.attacker];
      const defender = pack.states[campaign.defender];
      if (!attacker || !defender) return;

      const startYear = Math.round(campaign.start);
      const endYear = campaign.end ? Math.round(campaign.end) : null;

      // Log Grudge accumulation in transactional index banks dynamically
      const memory = this.getMemory(campaign.attacker, campaign.defender);
      memory.historicalGrudges += 2; // Increments systemic bitterness matrix score
      memory.lastCatalystYear = startYear;

      if (!this.sharedWorldEvents[startYear]) {
        this.sharedWorldEvents[startYear] = {
          title: campaign.name,
          type: "war",
          descriptions: {
            [campaign.attacker]: `The ${campaign.name} began as armies under ${attacker.name} crossed the frontier, initiating an offensive campaign into ${defender.name}.`,
            [campaign.defender]: `The ${campaign.name} broke out as defensive outposts were suddenly swarmed by an invasion force originating from ${attacker.name}.`
          }
        };
      }

      events.push({
        year: startYear,
        type: "war",
        title: campaign.name,
        text:
          this.sharedWorldEvents[startYear].descriptions[state.i] ||
          `The ${campaign.name} broke out between ${attacker.name} and ${defender.name}.`
      });

      if (endYear) {
        const endKey = startYear + 10000;
        const years = Math.max(1, endYear - startYear);

        if (!this.sharedWorldEvents[endKey]) {
          const attackerWon = P(0.5);
          this.sharedWorldEvents[endKey] = {
            title: `End of the ${campaign.name}`,
            type: "peace",
            descriptions: {
              [campaign.attacker]: attackerWon
                ? `Fighting in the ${campaign.name} concluded after ${years} year${years === 1 ? "" : "s"}. Banners of victory were raised in our capital as ${defender.name} ceded core territories.`
                : `The ${campaign.name} ground to a halt after ${years} year${years === 1 ? "" : "s"}. Our forced retreat sparked political instability within the high court.`,
              [campaign.defender]: attackerWon
                ? `The tragic ${campaign.name} came to an end after ${years} year${years === 1 ? "" : "s"}. Beaten back by sheer numbers, our diplomats signed a humiliating peace treaty with ${attacker.name}.`
                : `Fighting in the ${campaign.name} ended after ${years} bitter year${years === 1 ? "" : "s"}. Our garrison successfully stood its ground, forcing the retreating armies of ${attacker.name} to sign a status quo peace.`
            }
          };
        }

        events.push({
          year: endYear,
          type: "peace",
          title: `End of the ${campaign.name}`,
          text:
            this.sharedWorldEvents[endKey].descriptions[state.i] ||
            `Fighting in the ${campaign.name} came to an end after ${years} year${years === 1 ? "" : "s"}.`
        });
      }
    });

    return events;
  }

  private diplomacyEvents(state: State, foundingYear: number): HistoricalEvent[] {
    const diplomacy = state.diplomacy;
    if (!diplomacy) return [];
    const events: HistoricalEvent[] = [];

    const isValid = (i: number) => i > 0 && pack.states[i] && !pack.states[i].removed;

    const allyIndex = diplomacy.indexOf("Ally");
    if (isValid(allyIndex)) {
      const year = rand(foundingYear + 5, options.year);
      const memory = this.getMemory(state.i, allyIndex);
      memory.historicalAccords += 3; // Log dynamic agreement score
      memory.lastCatalystYear = year;

      events.push({
        year,
        type: "peace",
        title: "Defensive Pact",
        text: `${state.name} and ${pack.states[allyIndex].name} entered into a defensive pact, pledging to aid each other against common threats.`
      });
    }

    const vassalOfIndex = diplomacy.indexOf("Vassal");
    if (isValid(vassalOfIndex)) {
      const year = rand(foundingYear + 5, options.year);
      const memory = this.getMemory(state.i, vassalOfIndex);
      memory.historicalGrudges += 4; // Subjugation triggers deep long-term structural grudges

      events.push({
        year,
        type: "war",
        title: "Vassalization",
        text: `${state.name} submitted to ${pack.states[vassalOfIndex].name} and accepted vassal status.`
      });
    }

    const suzerainOfIndex = diplomacy.indexOf("Suzerain");
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

  // Generates unique narrative timeline events directly explaining ongoing political alignments
  private generateHistoricalMemoryFlavor(state: State, _foundingYear: number): HistoricalEvent[] {
    const memoryEvents: HistoricalEvent[] = [];

    pack.states.forEach(targetState => {
      if (!targetState.i || targetState.removed || targetState.i === state.i) return;

      const memory = this.getMemory(state.i, targetState.i);
      if (memory.lastCatalystYear === 0) return;

      // Distribute a unique contextual memory tracking event relative to ledger weightings
      if (memory.historicalGrudges >= 4 && P(0.3)) {
        const generationGap = Math.max(15, Math.round(options.year - memory.lastCatalystYear));
        memoryEvents.push({
          year: Math.min(options.year - 2, memory.lastCatalystYear + rand(5, 12)),
          type: "diplomacy_memory",
          title: "Ancestral Bitter Grudge",
          text: `Relations between ${state.name} and ${targetState.name} soured deeply. Public sentiment remains heavily stained by blood memories tracing back ${generationGap} years to historical frontier incidents.`
        });
      } else if (memory.historicalAccords >= 3 && P(0.3)) {
        memoryEvents.push({
          year: Math.min(options.year - 2, memory.lastCatalystYear + rand(4, 10)),
          type: "diplomacy_memory",
          title: "Generational Bond",
          text: `A grand celebration in the capital honored the enduring fraternity between ${state.name} and ${targetState.name}, reinforcing open trade corridors and mutual defense arrangements.`
        });
      }
    });

    return memoryEvents;
  }

  private flavorEvents(state: State, foundingYear: number): HistoricalEvent[] {
    const religion = pack.religions[pack.cells.religion[state.center]]?.name;
    const keys = Object.keys(FLAVOR_EVENTS);
    const count = rand(1, 3);
    const events: HistoricalEvent[] = [];

    Object.keys(this.sharedWorldEvents).forEach(yearStr => {
      const globalYear = Number(yearStr);
      if (globalYear > 10000 || globalYear < foundingYear + 5 || globalYear >= options.year) return;

      const globalEvent = this.sharedWorldEvents[globalYear];

      if (globalEvent.title === "The Great Contagion") {
        globalEvent.descriptions[state.i] =
          `The Great Contagion swept across our borders from neighboring provinces, forcing the capital to completely seal its trade ports.`;
        events.push({
          year: globalYear,
          type: globalEvent.type,
          title: globalEvent.title,
          text: globalEvent.descriptions[state.i]
        });
        this.applyDemographicRipple(state, "plague-loss");
      } else if (globalEvent.title === "The Great Currency Crash") {
        globalEvent.descriptions[state.i] =
          `The continent-wide devaluation of currencies hit ${state.name} hard, sparking immense market panic and civil worker strikes.`;
        events.push({
          year: globalYear,
          type: globalEvent.type,
          title: globalEvent.title,
          text: globalEvent.descriptions[state.i]
        });
        this.applyDemographicRipple(state, "war-casualty");
      }
    });

    for (let i = 0; i < count; i++) {
      const key = ra(keys);
      const { type, title, text } = FLAVOR_EVENTS[key];
      const year = rand(foundingYear + 5, Math.max(foundingYear + 6, options.year - 2));
      events.push({ year, type, title, text: text(state, religion) });

      if (type === "golden-age") this.applyDemographicRipple(state, "peace-boom");
      if (type === "disaster" || type === "rebellion") this.applyDemographicRipple(state, "war-casualty");
    }

    return events;
  }

  private figureText(role: FigureRole, name: string, values: FigureValues): string {
    const templates = FIGURE_TEMPLATES[role];
    const usable = templates.filter(template => {
      const placeholders = template.match(/{(\w+)}/g) || [];
      return placeholders.every(p => Boolean(values[p.slice(1, -1) as keyof FigureValues]));
    });

    const template = ra(usable.length ? usable : templates).replace(
      /{(\w+)}/g,
      (_match, key) => values[key as keyof FigureValues] || ""
    );
    const joiner = role === "Commoner" ? ", " : " ";
    return `${name}${joiner}${template}`;
  }
}

window.History = new HistoryModule();
