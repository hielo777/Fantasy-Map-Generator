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
}

// placeholder values available to fill a figure template; state/capital are always known,
// culture/religion/campaign are only available when relevant, and gate which templates are eligible
interface FigureValues {
  state: string;
  capital: string;
  culture?: string;
  religion?: string;
  campaign?: string;
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
  Invasion: entity =>
    `${entity} was overrun by invaders from beyond its borders, and its rule collapsed within a generation.`,
  "Civil War": entity => `${entity} tore itself apart in a long civil war between rival claimants.`,
  Plague: entity => `A great plague emptied the halls of ${entity}, and its people scattered to find safer ground.`,
  Drought: entity => `Years of drought withered the fields of ${entity}, forcing its people to abandon their homeland.`,
  Schism: entity => `${entity} fractured as its people split over rival faiths, never to reunite as one.`,
  Migration: entity => `${entity} was slowly abandoned as its people migrated in search of richer lands.`
};

// broad mythic backdrop epochs that precede the specific predecessor entity, for extra flavor variety
const ANCIENT_ERAS: { prefix: string; text: string }[] = [
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
    text: "Long ago, human settlers and ancient woodland spirits abided by a strict ecological contract, keeping civilization confined to harmonious, low-impact settlements."
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

// several phrasings per role; a random one is picked and adapted with {state}/{capital}.
// most read as "{name} " + template; Commoner reads as "{name}, " + template (an appositive)
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

class HistoryModule {
  // generate history for all states; pass a stateId to (re)generate a single state only
  generate(regenerate = false, stateId: number | null = null) {
    TIME && console.time("generateHistory");

    pack.states.forEach(state => {
      if (!state.i || state.removed) return;
      if (stateId !== null && state.i !== stateId) return;
      if (!regenerate && stateId === null && state.history?.length) return;

      this.regenerateState(state);
    });

    TIME && console.timeEnd("generateHistory");
  }

  // recompute founding year, dynasty, timeline and figures for a single, already-validated state
  private regenerateState(state: State): void {
    const foundingYear = this.getFoundingYear();
    const rulers = this.generateDynasty(state, foundingYear);
    state.rulers = rulers;

    const { events, figures } = this.buildTimeline(state, foundingYear, rulers);
    state.figures = figures.sort((a, b) => a.year - b.year);
    state.history = events.sort((a, b) => a.year - b.year);
  }

  // call after a state is renamed: refreshes its own history plus any other state
  // whose history text mentions it by name (wars, alliances, vassalage)
  onStateRename(stateId: number): void {
    const state = pack.states[stateId];
    // if (!state || !state.i || state.removed) return;
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

  // call after a culture is renamed: refreshes any state that uses it directly,
  // plus states whose legendary predecessor entity is rooted in it
  onCultureRename(cultureId: number): void {
    pack.states.forEach(state => {
      if (!state.i || state.removed) return;
      const culture = pack.cultures[state.culture];
      const usesDirectly = state.culture === cultureId;
      const usesAsOrigin = culture?.origins?.includes(cultureId);
      if (usesDirectly || usesAsOrigin) this.regenerateState(state);
    });
  }

  // call after a religion is renamed: refreshes any state whose capital currently follows it
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

    //const legendSpan = gauss(250, 100, 80, 500);
    const legendSpan = gauss(7500, 2000, 200, 10500);
    const emergenceYear = foundingYear - legendSpan;
    const capitalName = pack.burgs[state.capital]?.name || state.name;
    const entityName = ra(LEGEND_FORMS).replace("{name}", Names.getCultureShort(originId ?? state.culture));

    const backdrop = ra(ANCIENT_ERAS);
    // const backdropYear = emergenceYear - rand(30, 150);
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

    // Fixed: Changed .findIndex() to .indexOf()
    const allyIndex = diplomacy.indexOf("Ally");
    if (isValid(allyIndex)) {
      events.push({
        year: rand(foundingYear + 5, options.year),
        type: "peace",
        title: "Defensive Pact",
        text: `${state.name} and ${pack.states[allyIndex].name} entered into a defensive pact, pledging to aid each other against common threats.`
      });
    }

    // Fixed: Changed .findIndex() to .indexOf()
    const vassalOfIndex = diplomacy.indexOf("Vassal");
    if (isValid(vassalOfIndex)) {
      events.push({
        year: rand(foundingYear + 5, options.year),
        type: "war",
        title: "Vassalization",
        text: `${state.name} submitted to ${pack.states[vassalOfIndex].name} and accepted vassal status.`
      });
    }

    // Fixed: Changed .findIndex() to .indexOf()
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

  // notable non-ruler individuals: philosophers, inventors, rebel leaders, religious figures...
  private figureEvents(state: State, foundingYear: number): { events: HistoricalEvent[]; figures: NotableFigure[] } {
    const roles = Object.keys(FIGURE_TEMPLATES) as FigureRole[];
    const count = rand(2, 5);

    const values: FigureValues = {
      state: state.name,
      capital: pack.burgs[state.capital]?.name || state.name,
      culture: pack.cultures[state.culture]?.name,
      religion: pack.religions[pack.cells.religion[state.center]]?.name
    };

    const figures: NotableFigure[] = [];
    const events: HistoricalEvent[] = [];

    for (let i = 0; i < count; i++) {
      const role = ra(roles);
      const year = rand(foundingYear + 10, Math.max(foundingYear + 11, options.year - 2));
      const campaign =
        role === "General"
          ? (state.campaigns || []).find(c => c.start <= year && (c.end ?? options.year) >= year)
          : undefined;

      const name = Names.getCulture(state.culture);
      const text = this.figureText(role, name, { ...values, campaign: campaign?.name });

      figures.push({ name, role, year, text });
      events.push({ year, type: "figure", title: `${name}, ${role}`, text });
    }

    return { events, figures };
  }

  // pick a random template for the role, restricted to ones whose placeholders are actually available
  // (e.g. a {campaign} template is only eligible when a war overlaps this figure's year), then fill it in.
  // Commoner reads as an appositive ("{name}, a simple baker, ..."), everything else as a verb phrase ("{name} published...")
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
