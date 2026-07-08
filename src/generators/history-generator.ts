import { gauss, P, ra, rand } from "../utils";
import type { Burg } from "./burgs-generator";

import type { Religion } from "./religions-generator";
import type { State } from "./states-generator";

declare global {
  var History: HistoryModule;
}

type HistoricalEventType =
  | "legend"
  | "founding"
  | "figure"
  | "ruler"
  | "scandal" // Internal court drama, illegitimate heirs
  | "conspiracy" // Assassinations, failed coups, secret pacts
  | "war"
  | "peace"
  | "rebellion"
  | "holy-war"
  | "disaster" // Famines, fires, volcanic eruptions
  | "plague" // Pandemics, localized contagions affecting population
  | "anomaly" // Comets, omens, unexplained phenomena
  | "golden-age"
  | "renaissance" // Inventions, artistic/philosophical movements, universities
  | "infrastructure" // Great walls, highways, grand cathedrals, aqueducts
  | "discovery" // Lost ruins found, uncharted territory explored
  | "religious"
  | "schism"
  | "sacked" // a capital captured/sacked during a lost war
  | "diplomacy_memory"
  | "economic" // Added to align with the dynamic economic ledger system outputs
  | "demographic"; // Mass migrations, refugee influxes, population collapses

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
  | "Outcast"
  // --- NEW UNCONVENTIONAL ROLES ---
  | "Lawgiver" // Writers of ancient legal codes
  | "Chronicler" // Historians whose records shape the past
  | "Diplomat" // Envoys who averted wars or made alliances
  | "Martyr" // Figures whose tragic deaths triggered massive movements
  | "Pretender" // False heirs who destabilized thrones
  | "Outlaw Folk-Hero" // Loved by the people, hunted by the crown
  | "Oracle" // Prophetic mystics guiding major state decisions
  | "Champion" // Iconic duelists, blademasters, or folk warriors
  | "Inquisitor" // Zealots who root out internal subversion or heresy
  | "Cartographer" // Mapmakers who unlocked frontiers or war plans
  | "Alchemist" // Discoverers of volatile substances or early medicines
  | "Courtesan" // Socialites influencing rulers from behind the scenes
  | "Smuggler" // Blockade-runners who defined shadow economies
  | "Shipwright" // Engineers who revolutionized naval dominance
  | "Astronomer" // Stargazers predicting cataclysms or tracking omens
  | "Magistrate" // Judges whose arbitration settled historic feuds
  // --- INTRIGUE & COURT SHADOWS ---
  | "Regent" // Holds temporary power, hates to give it up
  | "Usurper" // Stole the crown, forever looking over their shoulder
  | "Rival Claimant" // The ambitious sibling or bastard eyeing the throne
  | "Grand Vizier" // The power behind the throne, filtering information
  | "Defector" // Traitor to one nation, asset to another
  | "Assassin" // Surgical political removal specialists
  | "Double Agent" // Infiltrators playing both sides of a shadow war
  | "Exile-Plotter" // Banished nobles orchestrating a comeback from afar
  | "Heresiarch" // Leaders of forbidden, subversive underground sects
  | "Blackmailer" // Holds the dirty laundry of the ruling elite
  // --- HIGH FANTASY (EPIC & ARCANE) ---
  | "Chosen One" // Prophesied figures carrying the fate of the world
  | "Archmage" // Master spellcasters whose magic alters reality
  | "God-Emissary" // Living avatars or divine envoys guiding mortals
  | "Relic-Keeper" // Guardians of world-ending ancient artifacts
  | "Oath-Sworn Knight" // Warriors magically bound to an unyielding cosmic vow
  // --- GRIM FANTASY (DARK & GRITTY) ---
  | "Witch-Hunter" // Brutal zealots purging arcane or demonic corruption
  | "Necromancer" // Pariahs who break the ultimate taboo of death magic
  | "Plague-Doctor" // Grim medics managing bio-magical catastrophes
  | "Blood-Mage" // Users of outlawed, sacrifice-fueled sorcery
  | "Slayer" // Monster-hunting mercenaries scarred by the dark
  | "Sin-Eater" // Outcasts who absorb spiritual corruption from the dead
  // --- HUMBLE ORIGINS & ACCIDENTAL HEROES ---
  | "Gate-Keeper" // Lowly guards whose single action saved or lost a city
  | "Scullery-Spy" // Overlooked servants who overheard world-altering secrets
  | "Conscript-Hero" // Commoners who accidentally slew commanders in battle
  | "Foundling-Heir" // Urchins revealed to be vital keys to a broken throne
  | "Messenger-Runner" // Couriers whose desperate sprints saved entire armies
  | "Stable-Hand" // Laborers at crucial bottlenecks changing a king's fate
  | "Hermit-Prophet"; // Outcasts whose unexpected warnings saved civilizations

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
    Ruler: ["served as the eyes and ears of {target}, permanently poisoning their mind against the court nobility."],
    "Double Agent": [
      "spent years feeding false leads to {target}, completely unaware that they were being fed masterfully tailored misinformation in return."
    ],
    Blackmailer: [
      "engaged in a silent, high-stakes shadow war through the backalleys of {capital} to locate and destroy {target}'s hidden archives."
    ]
  },
  General: {
    "Rebel Leader": [
      "crushed the desperate peasant legions formerly rallied by {target}, restoring absolute martial order to the provinces.",
      "was nearly assassinated by a lingering loyalist faction seeking vengeance for the execution of {target}."
    ],
    General: [
      "studied the precise vanguard tactics of the legendary {target}, using them to shatter foreign frontlines.",
      "avenged the historic battlefield defeat of their predecessor, {target}, by reclaiming the lost borderlands."
    ],
    Alchemist: [
      "integrated the volatile siege compounds engineered by {target} into frontline artillery doctrines, forever altering battlefield mechanics."
    ],
    "Conscript-Hero": [
      "initially dismissed {target} as an undisciplined farmhand, only to watch them completely save the entire vanguard from a catastrophic rout."
    ]
  },
  Philosopher: {
    Philosopher: [
      "published a fierce, controversial critique of {target}'s ethical framework, dividing the academies of {capital}.",
      "expanded upon the early logic paradigms established by {target}, bringing their school of thought to its ideological peak."
    ],
    "Religious Figure": [
      "attempted to logically reconcile the secular laws of the state with the sweeping prophetic visions of {target}."
    ],
    Heresiarch: [
      "engaged in a legendary, week-long public debate in {capital} against {target}, trying desperately to contain their radical ideological contagion."
    ]
  },
  Outcast: {
    General: [
      "was the disgraced child of the celebrated general {target}, stripped of all family titles and driven into exile.",
      "fled into the deep wilds after attempting to sabotage the grand military institutions built by {target}."
    ],
    Ruler: ["was a forgotten claimant to the throne, exiled by order of {target} to prevent a civil war."],
    "Exile-Plotter": [
      "was dragged into a dangerous frontier conspiracy after crossing paths with the embittered, banished noble {target}."
    ]
  },
  "Religious Figure": {
    "Religious Figure": [
      "claimed to be the spiritual successor to {target}, taking up their mantle and gathering their scattered disciples.",
      "branded the popular teachings of the late {target} as a dangerous heresy, sparking an ideological split."
    ],
    "God-Emissary": [
      "fell to their knees in the grand square of {capital}, declaring to the masses that {target} truly wielded direct celestial authority."
    ]
  },
  Inventor: {
    Inventor: [
      "perfected the initial, flawed mechanical blue-prints left behind in {capital} by the brilliant {target}.",
      "constructed a massive public monument dedicated to the architectural legacies of {target}."
    ],
    Shipwright: [
      "collaborated with {target} to merge breakthrough industrial mechanics with experimental hull designs, establishing total naval supremacy."
    ]
  },
  Alchemist: {
    "Plague-Doctor": [
      "worked in a frantic, subterranean lab to mass-produce the synthetic antidotes requested by {target} during the outbreak."
    ],
    Necromancer: [
      "uncovered evidence that {target} was using their specialized chemical reagents to preserve and reanimate decayed tissue."
    ]
  },
  Courtesan: {
    Ruler: ["became the true power behind the throne of {target}, filtering what reality reached the monarch's ears."],
    Regent: [
      "used unmatched social influence to ensure the high court favored {target}'s temporary grip on power over the true heirs."
    ],
    "Rival Claimant": [
      "secretly funneled court secrets and palace security schedules to the ambitious {target} to assist their provincial uprising."
    ]
  },
  Regent: {
    "Foundling-Heir": [
      "frantically deployed agents to suppress the sudden, terrifying rumors that {target} had been found alive in the slums."
    ],
    "Rival Claimant": [
      "used the temporary power of the crown to declare {target} a traitor to the realm, freezing their provincial assets."
    ]
  },
  Blackmailer: {
    Regent: [
      "held documented proof of {target}'s illegal treasury liquidations, completely dictating state policy from the shadows."
    ],
    Courtesan: [
      "intercepted a cache of private letters that completely exposed {target}'s network of high-court spies."
    ]
  },
  "Witch-Hunter": {
    Archmage: [
      "spent an entire career building a specialized iron-clad unit specifically to hunt down and dismantle {target}'s sovereign arcane enclave."
    ],
    "Blood-Mage": [
      "left a trail of ashes across the frontier while tracking the horrific, sacrifice-fueled rituals performed by {target}."
    ],
    Necromancer: [
      "tracked the sulfurous wake of {target} across three separate provinces, arriving just hours too late to stop a massive grave desecration."
    ]
  },
  "Scullery-Spy": {
    "Grand Vizier": [
      "while scrubbing the palace kitchens, overheard {target} plotting to poison the minds of the royal heirs."
    ],
    Assassin: [
      "unwittingly aided {target} by unlocking a hidden servant's corridor that led directly to a corrupt minister's private bedchamber."
    ],
    Blackmailer: [
      "covertly sold scraps of discarded palace correspondence to {target}, completely unaware that the secrets were being used to hold the high council hostage."
    ]
  },
  "Sin-Eater": {
    Ruler: [
      "was brought to the royal deathbed in absolute secrecy to absorb the lifetime of hidden atrocities committed by {target}."
    ],
    Usurper: [
      "nearly collapsed under the sheer weight of spiritual corruption when forced to ingest the sins of the blood-stained {target}."
    ],
    "Blood-Mage": [
      "discovered that the horrific spiritual stain left on souls by {target}'s sacrifice-fueled sorcery was entirely immune to their cleansing rituals."
    ]
  },
  Slayer: {
    Astronomer: [
      "used the precise celestial coordinates tracked by {target} to locate and slay a cosmic apex beast before it could descend on the lowlands."
    ],
    Necromancer: [
      "was contracted by the high council to hunt down and permanently put to rest the unnatural, reanimated monstrosities unleashed by {target}."
    ]
  },
  "Messenger-Runner": {
    "Gate-Keeper": [
      "collapsed into the dust at the frontier checkpoint, delivering a world-altering warning to {target} just seconds before the perimeter was breached."
    ],
    Regent: [
      "was intercepted on the road by agents of {target} who tried to violently suppress the emergency succession scrolls they carried."
    ]
  },
  Smuggler: {
    Magistrate: [
      "spent years playing a high-stakes game of cat-and-mouse with {target}, constantly adapting subterranean trade routes to evade their court tariffs."
    ],
    "Rival Claimant": [
      "was paid a massive fortune to covertly transport a personal militia raised by {target} across the heavily locked-down provincial borders."
    ],
    "Gate-Keeper": [
      "covertly study the exact guard rotation schedule of {target} to perfectly time the midnight running of their subterranean trade vessels."
    ]
  },
  Necromancer: {
    "Oath-Sworn Knight": [
      "desecrated the historic blood vows of {target} by raising their fallen vanguard brothers to serve as mindless thralls."
    ]
  },
  "Oath-Sworn Knight": {
    "Chosen One": [
      "bound their life and blade to an immutable, cosmic vow to serve as the personal vanguard protector of {target}."
    ],
    Usurper: [
      "refused to break their ancestral oath to the old dynasty, launching a legendary but suicidal solo charge against the throne room of {target}."
    ]
  },
  "Gate-Keeper": {
    Defector: [
      "risked immediate execution for treason by quietly unlocking the midnight postern gate to grant asylum to the fleeing {target}."
    ],
    Smuggler: [
      "was outsmarted for years by {target}, who used a complex series of false bottoms in flour barrels to slip contraband right past the city gates."
    ]
  },
  "Chosen One": {
    "God-Emissary": [
      "was guided through a series of grueling trial rituals by {target} to fully awaken the mythic destiny dormant in their blood."
    ],
    Usurper: [
      "was forced into hiding as a child after {target} seized the crown and ordered the systematic extermination of everyone bearing the prophetic mark."
    ]
  },
  "Stable-Hand": {
    Usurper: [
      "severely crippled the offensive momentum of {target}'s palace coup by spiking the water troughs of their elite heavy cavalry horses."
    ]
  },
  "Double Agent": {
    "Grand Vizier": [
      "spent months engineering a flawless, falsified paper trail to convince {target} that a non-existent military threat was mobilizing on the frontier."
    ]
  },
  "Grand Vizier": {
    "Scullery-Spy": [
      "instituted a brutal purge of the palace domestic staff after realizing a nameless servant had been leaking high-level administrative secrets."
    ]
  },
  Shipwright: {
    Smuggler: [
      "discovered that a rogue segment of their custom hull designs had been stolen and heavily modified by {target} for high-speed blockade running."
    ]
  },
  Astronomer: {
    Archmage: [
      "noted a terrifying, localized distortion in the stellar alignment right at the exact moment {target} unleashed their monumental display of power."
    ]
  },
  "Plague-Doctor": {
    "Blood-Mage": [
      "realized with absolute horror that the bio-magical rot sweeping the slums was the direct side-effect of a botched ritual performed by {target}."
    ]
  },
  "Rival Claimant": {
    "Foundling-Heir": [
      "spent an immense fortune to manufacture a fraudulent birthmark, aiming to completely discredit the sudden popular legitimacy of {target}."
    ]
  },
  "Foundling-Heir": {
    "Oath-Sworn Knight": [
      "was pulled from a life of destitution in the slums after {target} knelt before them, presenting the shattered remains of their family crest."
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
  victor?: number; // winning state's id, set for war-end events so other systems (e.g. capital sacking) agree with the outcome
}

// Memory Matrix tracking point weights for dynamically overriding relationship standings
export interface DiplomaticMemoryScore {
  historicalGrudges: number; // Negative memory weight (wars, annexations)
  historicalAccords: number; // Positive memory weight (alliances, trade pacts)
  lastCatalystYear: number;
}

// a legendary predecessor entity shared by every state descended from the same origin culture
export interface OriginLegend {
  entityName: string;
  events: HistoricalEvent[]; // backdrop era, rise, milestones, peak, downfall — NOT the per-state bridging event
}

// world-level history coordination data; this is persisted on pack.history (not on the
// HistoryModule instance) specifically so it survives save/export and load/import, and so
// two states (or religions) that share an event keep telling the same story after either is regenerated
export interface WorldHistory {
  activeGlobalEra: AncientEra | null;
  sharedWorldEvents: Record<number, SharedWorldEvent>;
  diplomaticMemoryMatrix: Record<string, DiplomaticMemoryScore>;
  religionHistory: Record<number, HistoricalEvent[]>;
  burgHistory: Record<number, HistoricalEvent[]>; // keyed by burg id; currently populated for state capitals only
  originLegends: Record<number, OriginLegend>; // keyed by origin culture id
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
    "{culture} riders made {capital} their seat of power after generations of migration.",
    "The seasonal grazing routes of the {culture} clans permanently converged at {capital}, locking their sprawling wagon circles into a stone foundation.",
    "Tired of chasing horizons, a visionary {culture} khan drove their spear into the soil of {capital}, decreeing that the wandering tribes would now build rather than roam.",
    "What began as a sprawling winter camp for {culture} herders slowly solidified into the bastions of {capital}, transforming tent-lines into permanent streets.",
    "Following a catastrophic loss of their livestock, fractured bands of {culture} wanderers sought refuge near {capital}, trading the freedom of the steppes for the security of city walls.",
    "The great caravans of the {culture} people ground to a final halt at {capital} when their elders declared the ancient migrations complete, laying the framework for {state}.",
    "A legendary truce among warring {culture} riders turned a neutral trading oasis into the capital city of {capital}, anchoring the birth of {state}.",
    "Driven by changing climates, a vast sea of {culture} tents pitched along the strategic crossroads of {capital}, establishing a permanent kingdom where their ancestors once only passed through."
  ],
  Naval: [
    "Seafarers of {culture} descent raised {capital} as a harbor for their growing fleet.",
    "{capital} was founded as a naval stronghold by {culture} captains seeking control of the coast.",
    "A powerful syndicate of {culture} merchant captains pooled their gold to build the massive breakwaters of {capital}, securing a permanent monopoly over the regional shipping lanes.",
    "Driven from the mainland by war, a ragtag armada of {culture} refugees lashed their ships together at {capital}, laying the floating foundations of what would become a global maritime empire.",
    "What began as a notorious, hidden cove for {culture} privateers slowly legitimized into the bustling, tax-heavy docks of {capital}.",
    "Guided by the stars and seasonal trade winds, {culture} deep-water navigators dropped anchor at {capital}, establishing a vital re-provisioning outpost that soon outgrew its mother country.",
    "The foundational timbers of {capital} were literally carved from the hulls of beach-stranded {culture} exploration vessels whose crews swore never to look back.",
    "Positioned perfectly along the great salt-routes, {capital} grew from a humble {culture} fishing village into a heavily fortified admiralty commanding the local waters.",
    "Seeking protection from seasonal typhoons, the ancestral {culture} fleet designated the deep, natural basin of {capital} as their sovereign sanctuary and capital.",
    "A fleet of exiled {culture} privateers ran their storm-battered hulls aground at {capital}, stripping the timbers of their ships to build the city's first fortifications.",
    "What began as a network of seasonal salt-pans and fish-drying racks for the {culture} people grew into the heavily fortified harbor of {capital}.",
    "Driven by a desire to dominate the regional sea lanes, wealthy {culture} merchant-captains laid the first stones of {capital} atop a defensible coastal crag.",
    "Following the discovery of deep-water channels, {culture} pearl-divers and traders established {capital} as a tiny island sanctuary that quickly evolved into a maritime powerhouse.",
    "The foundation of {capital} was secured when {culture} shipwrights constructed a massive breakwater, creating a perfect sanctuary for fleets fleeing the open sea.",
    "A loose coalition of {culture} island-clans swore a blood-oath at {capital}, uniting their individual longship fleets into the sovereign navy of {state}.",
    "Fleeing justice on the high seas, a rebellious faction of {culture} mutineers intentionally torched their own ships at {capital}, trapping themselves into founding the isolated cradle of {state}.",
    "Originally a lawless sandbar where {culture} merchants fled to evade imperial taxes, the chaotic trading camps of {capital} eventually organized into the sovereign heart of {state}."
  ],
  Highland: [
    "Clans of {culture} highlanders united under a single banner, naming {capital} their capital.",
    "{capital} rose among the peaks as {culture} chieftains put aside old feuds.",
    "Perched on a knife-edge ridge, the formidable watchtowers of {capital} were raised by {culture} stonemasons to guard the only navigable pass through the mountains.",
    "When rich veins of ore were struck deep within the crags, rival {culture} mining families locked hands and forged {capital} out of the living rock.",
    "Fleeing the vulnerable lowlands, the survivors of a shattered {culture} host scaled the precipice to build {capital}—a sovereign mountain citadel that no invader could ever reach.",
    "What started as a sacred high-altitude sanctuary for {culture} ascetics grew into the fortified terraces of {capital}, attracting pilgrims who eventually stayed to build a nation.",
    "The cold-hardened shepherds and hunters of the {culture} peaks established {capital} around an ancient, wind-swept stone ring where their chieftains had sworn blood oaths for centuries.",
    "To break a brutal multi-generational blood feud, the grand elders of the {culture} clans built {capital} as a neutral, high-walled seat of law above the clouds.",
    "Carved directly into the sheer canyon walls, the cliff-dwellings of the {culture} tribes expanded into the great vertical city of {capital}."
  ],
  River: [
    "{culture} settlers built {capital} where the river offered water, trade and defense.",
    "The founding of {capital} secured {culture} control over the river valley.",
    "When a legendary engineering feat tamed the seasonal, destructive floods of the valley, grateful {culture} farmers built {capital} atop the new stone dikes.",
    "The first stakes of {capital} were driven into the mud at a massive river fork, where {culture} toll-keepers could intercept and tax cargo coming from both directions.",
    "What began as a chaotic cluster of timber docks for {culture} grain barges slowly coalesced into the wealthy, sprawling river-port of {capital}.",
    "A great timber bridge raised by {culture} architects became such a lucrative trade bottleneck that a permanent city, {capital}, crystallized across both banks.",
    "Deep within the fertile silt lands, {culture} canal-builders dug a sprawling network of waterways that converged at a central island, laying the foundations for {capital}.",
    "Driven by a devastating drought upstream, fractured clans of {culture} boat-dwellers steered their rafts to the deep-water basin of {capital} and laid down permanent roots.",
    "The sovereign boundaries of {state} were born when a union of {culture} fishermen fortified the sacred estuary of {capital}, locking down the mouth of the world's greatest highway."
  ],
  Lake: [
    "{culture} fisherfolk grew {capital} from a lakeside camp into a seat of power.",
    "{capital} was founded on the lakeshore, giving the {culture} people a defensible capital.",
    "Fleeing mainland raiders, an ingenious community of {culture} artisans drove thousands of ironwood pilings into the shallows, lifting the floating boardwalks of {capital} entirely above the water.",
    "The deep, mist-shrouded waters were deemed sacred by {culture} mystics, who raised the white stone plazas of {capital} around a legendary island shrine.",
    "What began as a seasonal trading market where {culture} canoe fleets met to barter amber and fur slowly hardened into the fortified docks of {capital}.",
    "Nestled safely within the flooded caldera of an ancient volcano, {capital} was built by {culture} engineers who utilized the sheer crater walls as a natural, unassailable ring fortress.",
    "When a severe regional drought shrank the lake, {culture} pioneers quickly claimed the newly exposed, nutrient-rich lakebed, founding {capital} at the retreating waterline.",
    "The birth of {state} was secured when a confederation of {culture} lakeside villages pooled their militias to build a massive stone watch-citadel at {capital}, locking down the regional trade routes.",
    "Straddling a narrow, strategic land bridge between two massive bodies of water, {capital} grew rapidly as {culture} merchants built portage tracks to haul ships across the divide."
  ],
  Hunting: [
    "{culture} hunters cleared the wilds around {capital} and built the first permanent halls.",
    "{capital} grew from a hunting camp into the capital of the {culture} people.",
    "Positioned squarely along the ancient migratory path of the great herds, {capital} was established by {culture} trappers to process the massive autumn harvests.",
    "The foundational logs of {capital} were felled by a legendary {culture} tracker who successfully slew a monstrous apex beast, claiming the wilderness in the name of their people.",
    "What began as a scattering of temporary hide-tents for {culture} fur-merchants rapidly evolved into the fortified timber palisades of {capital}.",
    "Deep within the primeval canopy, a grand alliance of {culture} wood-clans designated {capital} as their neutral winter camp and supreme council ground.",
    "Driven into the deep woods by aggressive expansionists, {culture} rangers mastered the hostile terrain, raising the hidden forest-keep of {capital} to defy their enemies.",
    "The birth of {state} was secured when {culture} bowmen successfully defended their ancestral, game-rich valleys by building a permanent choke-point fortress at {capital}.",
    "Originally a high-canopy lookout post for spotting migrating beasts, the structures of {capital} steadily expanded downward to become a thriving frontier capital."
  ],
  Generic: [
    "{culture} settlers founded {capital}, which would grow into the heart of {state}.",
    "{capital} was established by {culture} folk, marking the birth of {state}.",
    "A historic convergence of {culture} pioneering families laid the first foundation stones of {capital}, anchoring a legacy that would blossom into {state}.",
    "Fleeing ancient hardships elsewhere, an exodus of {culture} folk marked their arrival in the region by raising the defensive walls of {capital}.",
    "What began as a modest agricultural cooperative among local {culture} families steadily crystallized into the sprawling urban core of {capital}.",
    "A legendary charter signed by early {culture} leaders formally established {capital}, drawing thousands of ambitious souls to the banner of {state}.",
    "Erected at a crucial geopolitical crossroads, the early bastions of {capital} were built by {culture} laborers to assert permanent dominance over the territory.",
    "The birth of {state} was forever secured when a coalition of {culture} settlements pooled their gold to erect a magnificent high court at {capital}.",
    "Driven by common purpose, scattered enclaves of {culture} descent integrated their customs and built {capital} as a monument to their newfound unity.",
    "Following decades of uncoordinated growth, the vibrant markets of the {culture} people were formally unified under the central administration of {capital}.",
    "A visionary decree by a legendary {culture} patriarch transformed a simple frontier outpost into the sovereign capital of {capital}.",
    "Built atop the ruins of an older, forgotten age, the rising towers of {capital} announced the definitive awakening of the {culture} people.",
    "The first civic assemblies of the {culture} folk met in the open fields of {capital}, drafting the early bylaws that would govern the future of {state}.",
    "Positioned perfectly to exploit local wealth, {capital} expanded rapidly from a basic clearing into the undisputed powerhouse of {state}.",
    "Following a disastrous, bankrupting colonial venture overseas, the devastated elites of the {culture} people signed away their independence at {capital}, merging their lands to form {state}.",
    "To prevent a bloody civil war between rival cities, {culture} architects cleared a neutral piece of wilderness to build {capital}, an artificial compromise that became the seat of {state}.",
    "Driven by a mysterious darkening of the sun and failing crops in the far north, an entire generation of starving {culture} folk migrated south, capturing {capital} to ensure the survival of {state}.",
    "Born from a chaotic, multi-generational real-estate dispute between ancient landlords, {capital} grew as a bewildering patchwork of sovereign {culture} enclaves that eventually solidified into {state}.",
    "Established originally as a remote penal colony for the empire's unwanted convicts, the hardened {culture} frontiersmen of {capital} eventually overthrew their guards and declared the sovereignty of {state}."
  ]
};

// religion founding narrative, keyed by religion.type; {culture} and {deity} are filled in,
// with {deity} falling back to a generic phrase for faiths without a named deity
const RELIGION_FOUNDING_TEMPLATES: Record<string, string[]> = {
  Folk: [
    "took root organically among the {culture} people, growing out of ancestral rites and oral tradition rather than any single prophet.",
    "emerged over generations from {culture} folk custom, its origins too old for any single founder to be remembered by name.",
    "grew from the seasonal rites of {culture} farmers and herders into a shared, unwritten faith devoted to {deity}.",
    "coalesced around the ancient whispering groves and sacred landscape features, where the {culture} ancestors first felt the presence of {deity}.",
    "was forged in the crucible of survival, born from the protective warding signs and winter night songs passed down by {culture} elders to appease {deity}."
  ],
  Organized: [
    "was formally established with a written code of belief, an ordained clergy, and devotion to {deity}.",
    "was founded when a growing priesthood devoted to {deity} codified generations of scattered belief into a single doctrine.",
    "began as a small congregation among the {culture} people before its clergy and scripture were formally organized around {deity}.",
    "was established from above when a victorious monarch declared devotion to {deity} the sole law of the land, forcing the {culture} people to accept a unified liturgy.",
    "solidified when a network of wandering monastic scribes gathered scattered scroll fragments, binding the {culture} people to a single written covenant under {deity}."
  ],
  Cult: [
    "began as a small, secretive following devoted to {deity}, drawing suspicion from the established faiths around it.",
    "coalesced around a charismatic figure and a fervent devotion to {deity}, remaining a fringe movement for its early years.",
    "formed in the shadows of larger faiths, its devotion to {deity} kept quiet among the {culture} people who first embraced it.",
    "ignited behind heavy stone doors and in torchlit cellars, where an inner circle of {culture} mystics sought forbidden, direct communion with {deity}.",
    "spread like wildfire through the desperate slums and frontier outposts, drawing outcasts who abandoned their old lives for the uncompromising promises of {deity}."
  ],
  Heresy: [
    "broke away as a heretical offshoot, rejecting the orthodoxy of its parent faith over the true nature of {deity}.",
    "was declared heretical almost as soon as it was preached, yet found enough followers among the {culture} people to survive persecution.",
    "split from established doctrine over a bitter dispute about {deity}, and was branded a heresy by the faith it left behind.",
    "ignited when a radical faction of ascetics accused the high church of turning its back on the true, original mandates of {deity}.",
    "mutated rapidly away from orthodox doctrine after a regional governor altered the holy scripts to justify an independent rule in the name of {deity}."
  ]
};

// causes for a religion breaking away from its parent faith
const SCHISM_CAUSES = [
  "over disputes in doctrine",
  "after a bitter succession dispute among its clergy",
  "when reformers rejected the growing wealth and corruption of the established priesthood",
  "after a disagreement over the true nature of {deity}",
  "when a charismatic preacher declared the old rites hollow and incomplete"
];

// what made a capital notable at its founding, keyed to an actual structural flag on the burg
// (citadel/walls/port/temple/plaza/shanty); {name} is filled with the burg's own name
const BURG_NOTABLE_TRAITS: Record<string, (name: string) => string> = {
  citadel: name =>
    `${name}'s founders raised a citadel on the high ground first, and the town grew up around its walls.`,
  walls: name => `${name} was walled early in its life, a sign of how much its position was worth defending.`,
  port: name => `${name} grew around its harbor, and its fortunes have always run with the tide of trade.`,
  temple: name =>
    `${name} was founded around a shrine, and the pilgrims following the road there gave rise to the town itself.`,
  plaza: name => `${name}'s founders laid out a central market square before much else, betting on trade over defense.`,
  shanty: name => `${name} grew faster than anyone had planned for, and its ramshackle outer wards still show it.`,
  // --- Industry, Logistics & Transit ---
  crossroads: name =>
    `Born at the intersection of two major trade ways, ${name} exists entirely to service the traffic passing through it.`,
  bridge: name =>
    `${name} began as a single heavily guarded crossing, collecting tolls long before it became a proper town.`,
  quarry: name =>
    `The deep scars of industry surround ${name}, which grew from a rough workers' camp into a grey stone town.`,
  academy: name =>
    `${name} developed around a prestigious center of learning, and its economy is still driven by scholars, bookbinders, and student taverns.`,
  foundry: name =>
    `The air above ${name} is rarely clear; it was built on soot and iron, growing around a massive cluster of furnaces.`,
  // --- Geography & Survival ---
  oasis: name =>
    `Surrounded by harsh, unforgiving terrain, ${name} owes its entire existence to a dependable water source that life clings to.`,
  terraced: name =>
    `Built directly into a steep hillside, ${name}'s narrow, vertical streets feel more like a carved staircase than a traditional town.`,
  ruins: name =>
    `${name} was built directly into the bones of a much older, forgotten settlement, reusing ancient foundations for modern storefronts.`,
  choke: name =>
    `Squeezed tightly between two geographic barriers, ${name} is narrow, dense, and built upward rather than outward.`,
  // --- Social & Political Flavors ---
  boomtown: name =>
    `${name} sprung up almost overnight following a sudden rush for local resources, giving it a frantic, lawless energy.`,
  charter: name =>
    `Founded by a specific decree or merchant company, ${name} is meticulously grid-planned and operates under its own unique legal privileges.`,
  retreat: name =>
    `Originally a quiet haven for the wealthy or reclusive, ${name} slowly transformed into a town as servants and merchants moved in to support them.`,
  // --- Cultural & Demographic Dominance ---
  melting: name =>
    `A magnet for travelers from all corners of the map, ${name}'s local culture is an aggressive blend of languages, foods, and customs with no single group holding a true monopoly.`,
  orthodox: name =>
    `The dominant culture of ${name} is fiercely bound to ancient, unyielding religious traditions, making it an incredibly difficult place for foreign ideas or customs to take root.`,
  enclave: name =>
    `Though situated in foreign lands, ${name} is dominated by a powerful immigrant diaspora that has meticulously recreated the architecture, laws, and lifestyle of their original homeland.`,
  patrician: name =>
    `${name}'s culture is strictly dictated by an insular elite of wealthy old bloodlines who deeply look down on outsiders and aggressively guard the local customs from changing.`,
  guild: name =>
    `Artisans and craft-masters dictate the social rhythm of ${name}; your trade defines your social standing, and the local holidays are all organized around guild cycles.`,
  frontier: name =>
    `Populated by rugged pioneers and stubborn outcasts, ${name}'s culture is defined by an intense self-reliance and a shared distrust of the capital's laws.`,
  creative: name =>
    `${name} has long served as a safe haven for painters, poets, and radical thinkers, fostering a vibrant, eccentric street culture that frequently clashes with the ruling class.`,
  martial: name =>
    `The local population of ${name} is deeply shaped by decades of border warfare, breeding a proud, highly disciplined culture where military veterans hold the highest social prestige.`,
  schismatic: name =>
    `${name} is culturally fractured right down the middle, with two rival factions constantly vying for ideological dominance over the city's courts and public spaces.`,
  // --- High Fantasy ---
  leylined: name =>
    `Built atop a convergence of natural magical currents, ${name} is a place where local architecture defies gravity, and glowing ambient energy fuels daily life.`,
  feywild: name =>
    `The boundary between worlds is dangerously thin in ${name}; its citizens have adapted to erratic, whimsical local laws and the frequent, unpredictable visits of otherworldly beings.`,
  immortal: name =>
    `${name} is ruled and heavily influenced by an ancient, long-lived dynasty, resulting in a stagnant, deeply conservative culture that measures social change in centuries rather than years.`,
  floating: name =>
    `A portion of ${name} rests on massive, levitating shards of earth, splitting the population between those who walk the soil and the magical elite who dwell in the clouds.`,
  relic: _name =>
    `The town is dominated by the colossal, dormant remains of a divine weapon or ancient titan, which the locals have hollowed out and turned into a bustling marketplace.`,
  // --- Grim Fantasy ---
  blighted: name =>
    `A lingering, unnatural corruption taints the soil and water of ${name}, breeding a grim, gaunt populace that treats sickness, mutation, and early death as regular facts of life.`,
  zealot: name =>
    `Paranoia runs rampant through the muddy streets of ${name}, where a radical, witch-hunting cult holds absolute cultural sway, punishing any sign of unorthodoxy with the pyre.`,
  carrion: name =>
    `${name} thrives on the misfortunes of others, its economy and culture completely built around scavenging battlefield wreckage, processing the dead, or picking over ruins.`,
  blooddebt: name =>
    `A dark, generational pact hangs over ${name}, dictating a culture of grim compliance where citizens are periodically chosen by lottery to satisfy a sinister tithe to the ruling class.`,
  subterranean: name =>
    `Driven underground by surface horrors or toxic ash, ${name}'s culture is claustrophobic and utilitarian, where light is a precious currency and fresh air is heavily taxed.`,
  penitent: name =>
    `Believing themselves cursed by the gods, the citizens of ${name} live in a perpetual state of public mourning, filling the grey streets with silent flagellant processions and austere laws.`,
  // --- Acoustic & Audio Atmosphere ---
  echoing: name =>
    `Built inside a deep, rocky ravine, the sound of footsteps, church bells, and shouting in ${name} bounces endlessly off the stone walls, creating a perpetual, deafening din.`,
  hushed: name =>
    `A heavy, unnerving silence hangs over ${name}, where the locals speak only in hushed whispers and even the stray animals seem to move without making a sound.`,
  industrial: name =>
    `The air in ${name} is never truly quiet; a rhythmic, mechanical pounding from local waterwheels and steamworks vibrates through the floorboards of every house, day and night.`,
  // --- Visual & Atmospheric Conditions ---
  shrouded: name =>
    `Chilled by local waters or magic, ${name} is perpetually choked by a thick, clinging fog that turns its lanterns into dim halos and keeps the upper stories of buildings hidden from view.`,
  sunbleached: name =>
    `Basked in merciless, blinding light, ${name}'s whitewashed stone walls radiate intense heat, forcing all public life to retreat indoors until the cool of the evening.`,
  luminescent: name =>
    `When night falls, ${name} transforms; it is lit entirely by strange glowing fungi, bioluminescent waters, or enchanted glass, bathing the streets in an eerie, otherworldly palette.`,
  // --- Olfactory & Sensory Textures ---
  brine: name =>
    `The crisp, stinging scent of sea salt, rotting kelp, and wet wood is baked into every timber of ${name}, and a fine mist coats everything in a damp, sticky residue.`,
  perfumed: name =>
    `To mask the stench of its crowded alleys, ${name}'s upper districts burn constant mountains of incense, filling the air with a cloying, dizzying mixture of spices and smoke.`,
  ironscent: name =>
    `The metallic tang of blood and wet iron hangs constantly on the wind in ${name}, a grim olfactory reminder of the sprawling slaughterhouses or massive foundries that drive its economy.`,
  // --- Architectural & Structural Chaos ---
  vertical: name =>
    `Space is at such a premium in ${name} that its buildings lean precariously over the streets, nearly touching at the rooftops and blocking out the sky to create a labyrinth of dark tunnels.`,
  submerged: name =>
    `Built on shifting wetlands or a sinking coast, half of ${name} rests on rotting wooden stilts, and its citizens navigate the flooded boardwalks by skiff and gondola.`,
  labyrinthine: name =>
    `${name} was built without a single straight line; its chaotic tangle of dead ends, blind alleys, and hidden staircases was intentionally designed to confuse invading armies—and still baffles outsiders.`,
  // --- Historic Triumphs & Tragedies ---
  phoenix: name =>
    `Built atop a thick layer of ash and scorched earth, ${name} has been burned to the ground a dozen times throughout its bloody history, always defying its enemies by rising again.`,
  plagued: name =>
    `${name} still bears the psychological scars of a historic quarantine; its older districts remain completely walled off and abandoned, left as silent monuments to the dead.`,
  cursed: name =>
    `A centuries-old betrayal by the town's founding families is said to have drawn a generational curse upon ${name}, a piece of local lore that citizens still blame for every bad harvest or sudden misfortune.`,
  sieged: name =>
    `The architecture of ${name} is permanently scarred by a legendary, years-long siege; its old stone structures are riddled with ancient catapult craters and patched with mismatched brickwork.`,
  // --- Foundational Mysteries & Myths ---
  exiled: name =>
    `${name} was originally founded as a remote penal colony or a refuge for outcasts, and a fierce, deeply ingrained anti-authoritarian streak still defines the legal code of its descendants.`,
  monolithic: _name =>
    `The town was built directly around a towering, inexplicable black monolith that predates recorded history, an object the locals treat with a mixture of civic pride and quiet dread.`,
  dragonfall: name =>
    `Legend holds that ${name} marks the exact site where a mythical beast was slain in antiquity; the town's primary economy grew out of harvesting the gargantuan, fossilized bones buried beneath its streets.`,
  conquered: name =>
    `Once the proud jewel of a fallen empire, ${name} was annexed generations ago by a foreign power, leaving its people culturally divided between imperial loyalists and those who dream of ancestral independence.`,
  // --- Economic & Social Evolution ---
  ghosttown: name =>
    `${name} was once a thriving metropolis three times its current size, but a sudden shift in trade routes or resource depletion left entire districts to rot into hollow ghost-neighborhoods.`,
  pactbound: name =>
    `The charter that founded ${name} was signed under an ancient, bizarre treaty with a non-human faction or local entity, forcing the town to uphold strange, archaic laws to this day to avoid restarting a forgotten war.`,
  sunken: name =>
    `Old records indicate that a massive cataclysm long ago swallowed half of the original settlement; at low tide, the eerie, barnacle-encrusted spires of "Old ${name}" can still be seen breaking the harbor waves.`
};

const FLAVOR_EVENTS: Record<
  string,
  { type: HistoricalEventType; title: string; text: (state: any, religion?: string) => string }
> = {
  // --- UPGRADED STANDARD EVENTS ---
  "Golden Age": {
    type: "golden-age",
    title: "A Golden Age",
    text: state => `Trade and culture flourished across ${state.name} during a long period of prosperity.`
  },
  Renaissance: {
    type: "renaissance", // Refined to new type
    title: "A Cultural Renaissance",
    text: state =>
      `Artists and scholars flocked to ${state.capital}, ushering in a renaissance of learning, philosophy, and classical art.`
  },
  Plague: {
    type: "plague", // Refined to new type
    title: "The Great Plague",
    text: state =>
      `A devastating plague swept through ${state.name}, emptying towns, halting local trade, and leaving fields untended.`
  },
  Famine: {
    type: "disaster",
    title: "Years of Famine",
    text: state =>
      `Consecutive poor harvests brought widespread famine to ${state.name}, testing the resolve of its people.`
  },
  "Great Fire": {
    type: "disaster",
    title: "The Great Fire",
    text: state =>
      `A catastrophic fire tore through the densely packed districts of ${state.capital}, forcing much of the city to be rebuilt in stone.`
  },
  "Religious Reform": {
    type: "religious",
    title: "Religious Reform",
    text: (state, religion) =>
      `${religion ? religion : "The old faith"} was radically reshaped by reformers seeking to purge corruption within ${state.name}.`
  },
  Rebellion: {
    type: "rebellion",
    title: "Popular Uprising",
    text: state =>
      `Discontent among the overtaxed peasantry boiled over into open rebellion against the rulers of ${state.name}.`
  },

  // --- NEW DOMESTIC & SOCIAL EVENTS ---
  "Court Scandal": {
    type: "scandal",
    title: "A Whispered Scandal",
    text: state =>
      `The court at ${state.capital} was shaken to its core when the rightful heir to ${state.name} was exposed as illegitimate, fracturing the loyalty of the nobles.`
  },
  "Failed Coup": {
    type: "conspiracy",
    title: "The Silent Coup",
    text: state =>
      `A shadowy cabal of disgruntled military officers attempted to assassinate the leadership of ${state.name} in their sleep, but the plot was betrayed at the final hour.`
  },
  "Refugee Influx": {
    type: "demographic",
    title: "The Great Migration",
    text: state =>
      `A massive wave of displaced families from war-torn neighboring lands crossed the borders of ${state.name}, changing the demography and labor force forever.`
  },

  // --- NEW CIVILIZATIONAL & INFRASTRUCTURE EVENTS ---
  "Grand Monument": {
    type: "infrastructure",
    title: "The Great Work",
    text: state =>
      `To projecting their immortal majesty, the rulers of ${state.name} completed a staggering architectural marvel in ${state.capital} that dominated the skyline.`
  },
  "Border Defense": {
    type: "infrastructure",
    title: "The Iron Wall",
    text: state =>
      `Fearing aggression, ${state.name} poured vast treasury reserves into constructing a formidable chain of frontier fortresses and watchtowers.`
  },
  "Expedition Success": {
    type: "discovery",
    title: "Uncharted Frontiers",
    text: state =>
      `A state-sponsored expedition returned to ${state.capital} after traversing the deep wilderness, bearing exotic maps and tales of lost ancient ruins.`
  },

  // --- NEW UNPREDICTABLE FORCES ---
  "Celestial Omen": {
    type: "anomaly",
    title: "The Heaven's Wrath",
    text: state =>
      `A brilliant, blood-red comet split the night sky over ${state.name}. Panic gripped the populace, who interpreted it as a dark omen of coming doom.`
  },
  "Year of Frost": {
    type: "anomaly",
    title: "The Endless Winter",
    text: state =>
      `An unexplainable global cooling caused snow to fall in midsummer across ${state.name}, completely destroying the year's agricultural cycle.`
  }
};

const LEGEND_FORMS = [
  "the Kingdom of {name}",
  "the {name} Confederacy",
  "the Tribes of {name}",
  "the {name} Dominion",
  "Old {name}",
  "the {name} Hegemony",
  "the Bands of {name}",
  "the {name} Alliance",
  "the {name} Empire",
  "the {name} Brotherhood",
  "the {name} Union",
  "the {name} Federation",
  "the {name} Collective",
  "the {name} Concordat",
  "the {name} Protectorate",
  "the {name} Principality",
  // --- NEW CLASSICAL & ADMINISTRATIVE ---
  "the {name} Imperium",
  "the Satrapy of {name}",
  "the Commonwealth of {name}",
  "the Directorship of {name}",
  // --- NEW MYSTICAL & SACRED ---
  "the Theocracy of {name}",
  "the Sacred Concordat of {name}",
  "the Sovereign Enclave of {name}",
  "the {name} Archonate",
  "the {name} Hierarchy",
  "the {name} Sanctum",
  "the {name} Celestial Order",
  "the {name} Divine Assembly",
  "the {name} Oracle",
  "the {name} Sacred Circle",
  "the {name} Holy See",
  "the {name} Temple-State",
  // --- NEW MERCHANT & TRADE-BASED ---
  "the Merchant Guild of {name}",
  "the Trade Consortium of {name}",
  "the Mercantile League of {name}",
  "the Commercial Syndicate of {name}",
  "the Bazaar Confederation of {name}",
  "the Market Alliance of {name}",
  "the Trading Company of {name}",
  // --- NEW MILITARY & STRATEGIC ---
  "the Fortress of {name}",
  "the Citadel of {name}",
  "the Bastion of {name}",
  "the Garrison of {name}",
  "the Watch of {name}",
  "the Vanguard of {name}",
  "the Legion of {name}",
  "the Armada of {name}",
  "the Phalanx of {name}",
  "the Cohort of {name}",
  "the Brigade of {name}",
  "the Squadron of {name}",
  "the Regiment of {name}",
  "the Battalion of {name}",
  "the Division of {name}",
  "the Command of {name}",
  "the Outpost of {name}",
  // --- NEW SEAFARING & ALLIANCE-BASED ---
  "the {name} Thalassocracy",
  "the Hanseatic League of {name}",
  "the Greater Clans of {name}",
  "the Grand Khanate of {name}"
];

const LEGEND_DOWNFALLS: Record<string, (entity: string) => string> = {
  Invasion: entity =>
    `${entity} was overrun by invaders from beyond its borders, and its rule collapsed within a generation.`,
  "Civil War": entity => `${entity} tore itself apart in a long civil war between rival claimants.`,
  Plague: entity => `A great plague emptied the halls of ${entity}, and its people scattered to find safer ground.`,
  Drought: entity => `Years of drought withered the fields of ${entity}, forcing its people to abandon their homeland.`,
  Schism: entity => `${entity} fractured as its people split over rival faiths, never to reunite as one.`,
  Migration: entity => `${entity} was slowly abandoned as its people migrated in search of richer lands.`,

  // --- NEW ADVANCED DOWNFALLS ---
  Deluge: entity =>
    `A sudden, catastrophic shift in the regional waterways swallowed the lowlands of ${entity}, drowning its capital and burying its wealth beneath the mud.`,
  "The Ash Awakening": entity =>
    `The mountains spoke in fire, choking the skies above ${entity} with ash for a decade and turning its once-fertile valleys into a permanent grey wasteland.`,
  Decadence: entity =>
    `The rulers of ${entity} grew blind with luxury and bloated by bureaucracy, leaving the borders undefended until the entire administrative machine quietly dissolved.`,
  "Economic Crash": entity =>
    `A sudden, inexplicable collapse of core trade routes devalued the wealth of ${entity}, sparking an economic ruin that starved its grand cities faster than any invading army.`,
  "Thrall Revolt": entity =>
    `The lower classes and bond-servants who built the monuments of ${entity} rose up in unison, burning the grand archives and erasing all memory of their masters.`,
  Hubris: entity =>
    `In their pursuit of forbidden secrets, the leadership of ${entity} brought down a terrible curse that caused their people to forget their own language and flee into the wilds.`,
  "The Waning": entity =>
    `A strange, creeping despair settled over the cradles of ${entity}; over three generations, fewer and fewer children were born until only the elderly remained to guard empty palaces.`,
  // --- HISTORICALLY INSPIRED COLLAPSES ---
  "Systemic Collapse": entity =>
    `${entity} fell not to a single foe, but to a cascading failure of the world's trade lines; when its neighboring allies collapsed, its own fragile economy shattered, triggering a sudden dark age.`,
  "Ecological Ruin": entity =>
    `${entity} brought about its own doom by stripping its forests and exhausting its soil to feed its great cities, leaving a barren wasteland where nothing could grow.`,
  "The Veil of Ash": entity =>
    `A distant, thunderous mountain eruption choked the skies of ${entity} with a permanent winter; with the sun hidden for years, the crops failed, and the starving populace turned on one another.`,
  "The Strangled Cradle": entity =>
    `The very rivers that sustained ${entity} became its undoing, slowly choking its grand harbors with silt and turning its fertile fields into a poisoned, salty desert.`,
  "The Quiet Abandonment": entity =>
    `A silent, creeping exhaustion overtook the cities of ${entity}; without a war or a burning fire, its people simply walked away, leaving their grand architectures to be reclaimed by the dust.`,
  "The Great Betrayal": entity =>
    `The unassailable walls of ${entity} never fell to siege; instead, a trusted inner faction secretly unbolted the city gates at midnight, letting an eager foe butcher the sleeping empire.`,
  "The Vanishing": entity =>
    `A silent, chilling mystery took the people of ${entity}; overnight, every soul vanished from its bustling streets, leaving grand feasts on tables and gold in the vaults, but not a single body behind.`,
  "The Erasure": entity =>
    `For reasons lost to time, the inhabitants of ${entity} systematically set fire to their own beautiful cities, burning centuries of history to ash before walking into the wild with nothing but their clothes.`,
  "The Day of Shadows": entity =>
    `A sudden, contagious madness gripped the minds of ${entity}; in a single afternoon of terror, the populace destroyed their own monuments, forgot their own names, and scattered into the woods like beasts.`,
  "The Forgotten Curse": entity =>
    `A dark, ancient taboo was violated by the kings of ${entity}, invoking a forgotten curse that soured the milk, turned the well-waters to rust, and drove a once-proud populace to tear down their own palace walls out of sheer, unholy terror.`
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
  ],
  // --- NEW UNCONVENTIONAL ROLES ---
  Lawgiver: [
    "carved a foundational legal code onto stone monoliths in {capital}, shaping the justice system of {state} for centuries.",
    "instituted a radical set of civil ordinances that stripped corrupt judges of their traditional privileges.",
    "drafted the historic property charters that permanently reallocated ancestral lands from the crown to the common workforce of {state}.",
    "established a system of public tribunals in {capital}, ensuring even the highest nobility could be held accountable for treason.",
    "authored the sacred maritime treaties that normalized trade tariffs and effectively ended piracy across the waters of {state}."
  ],
  Chronicler: [
    "penned the definitive historical record of {state}, quietly erasing or highlighting dynasties to shape political legacies.",
    "traveled the provinces to compile the ancestral genealogies of the {culture} people.",
    "preserved a hidden cache of forbidden records in {capital}, documenting the dark truths the current regime tried to burn.",
    "recorded the final, dying words of frontline soldiers during the great expansion, creating an epic anthology that defined {culture} patriotism.",
    "exposed a massive chronological forgery in the royal archives, proving the current ruling house of {state} had no legal claim to the throne."
  ],
  Diplomat: [
    "brokered a historic non-aggression pact that narrowly averted a catastrophic conflict between {state} and its neighbors.",
    "negotiated the complex territorial treaties that established the modern borders of {state}.",
    "spent years embedded in a hostile foreign court, quietly turning key ministers against their own war-hawks to protect {state}.",
    "defused a volatile international crisis in {capital} by orchestrating a high-profile political marriage between rival dynasties.",
    "secured exclusive, lucrative trade monopolies with distant merchants, enriching the merchant guilds of {state} overnight."
  ],
  Martyr: [
    "whose public execution in {capital} ignited a firestorm of civil unrest, unifying fractured factions overnight.",
    "became an enduring symbol of sacrifice, whose final defiant words inspired generations of {culture} songs.",
    "refused to recant their political philosophy under extreme torture, hardening the resolve of the underground movement in {state}.",
    "willingly walked into a deadly trap to buy enough time for the vanguard forces of {state} to evacuate a doomed city.",
    "was assassinated by corrupt nobility, instantly transforming from a controversial local activist into a sacred icon for the {culture} people."
  ],
  Pretender: [
    "emerged from obscurity claiming to be a lost royal heir, fracturing the military allegiance of {state}.",
    "waged a bitter shadow campaign to reclaim what they asserted was their stolen birthright.",
    "convinced the provincial governors of {state} that they were the true successor, nearly triggering a total collapse of the high court.",
    "forged a flawless ancestral signet ring to legitimize their claim to the throne in {capital}, winning over a massive peasant army.",
    "gained the backing of a foreign empire, marching on {capital} under a banner that directly challenged the sitting monarch's bloodline."
  ],
  "Outlaw Folk-Hero": [
    "robbed the tax caravans leaving {capital}, distributing the wealth back to the destitute frontier communes.",
    "eluded the crown's elite bounty hunters for decades, protected entirely by the loyal peasantry of {state}.",
    "broke into the high dungeons of {capital} to free political prisoners, leaving a mocking signature that humiliated the guard.",
    "became the subject of countless clandestine tavern ballads across {state} after humiliating a notoriously cruel tax collector.",
    "negotiated a secret amnesty with a sympathetic general, trading their own freedom for the permanent relief of provincial debts."
  ],
  Oracle: [
    "delivered a chilling, cryptic prophecy that fundamentally redirected the defensive military strategies of {state}.",
    "guided the crown through a time of severe panic with visions interpreted as divine warnings.",
    "uttered a final, dying curse from the steps of the grand temple in {capital}, predicting a dynastic collapse that came true to the exact day.",
    "interpreted a rare celestial alignment, convincing the high council of {state} to call off a disastrous offensive campaign.",
    "withstood severe political pressure to alter a vision, refusing to falsify a grim omen concerning the ruling family's future."
  ],
  Champion: [
    "slew a rival nation's vanguard leader in a legendary trial by combat, securing an immediate battlefield truce.",
    "remained undefeated in the grand arenas of {capital}, embodying the martial pride of the {culture} people.",
    "carried the battered battle standard of {state} through an overwhelming horde, rallying a shattered vanguard to a miraculous victory.",
    "won the grand tourney in {capital}, using the prize and newfound prestige to petition the crown directly for provincial reforms.",
    "defended the narrow palace gates during a bloody insurrection, single-handedly matching the elite warriors sent to assassinate the council."
  ],
  Inquisitor: [
    "instituted a ruthless domestic purge to root out internal subversion and treason within the courts.",
    "hunted down hidden political factions operating out of the shadows of {capital}.",
    "exposed a high-level network of foreign spies embedded inside the military command structure of {state}.",
    "commandeered the legal system of {capital}, utilizing aggressive interrogation methods that terrified both the guilty and innocent.",
    "uncovered a treasonous plot among the provincial governors just days before they could mobilize their private guards against the crown."
  ],
  Cartographer: [
    "drafted the first highly accurate military tactical maps of the frontier, exposing vital weaknesses in enemy territory.",
    "unlocked the treacherous paths of the deep wilderness, expanding the sovereign claims of {state}.",
    "discovered a hidden deep-water passage through the coastal reefs, giving the naval fleet of {state} a devastating tactical surprise.",
    "spent decades mapping the subterranean ruins beneath {capital}, creating a master grid that was instantly classified by the high council.",
    "proved through precise geographical surveys that a resource-rich border territory legally belonged to {state}, sparking an immediate diplomatic crisis."
  ],
  Alchemist: [
    "perfected a highly volatile incendiary compound that revolutionized siege defense metrics for {state}.",
    "discovered a crude synthetic antidote that effectively halted a localized contagion.",
    "transmuted a common base mineral into a highly sought-after industrial catalyst, temporarily rescuing the economy of {state} from bankruptcy.",
    "was brought before the high court of {capital} under charges of heresy after an experimental elixir permanently altered a noble's physical constitution.",
    "engineered a slow-acting, completely undetectable poison that became the preferred tool for political liquidations within the shadow networks."
  ],
  Courtesan: [
    "used unparalleled social influence within the high courts of {capital} to quietly manipulate key succession choices.",
    "acted as the true power behind the throne, filtering what information reached the monarch's ears.",
    "leveraged pillow-talk secrets from foreign diplomats to dismantle an impending invasion alliance targeting {state}.",
    "bankrolled a massive network of spies across {capital} using the lavish jewelry and estates gifted to them by infatuated lords.",
    "orchestrated the quiet, public disgrace of a warmongering general by exposing their private indiscretions to the high council."
  ],
  Smuggler: [
    "engineered a vast underground blockade-running operation that kept vital resources flowing during an economic embargo.",
    "controlled the subterranean trade networks running beneath the city walls of {capital}.",
    "devised a genius method of concealing rare contraband inside official diplomatic cargo, compromising several high-ranking officials.",
    "bribed an entire segment of the city guard in {capital} to look away as an outlawed political faction was safely extracted from the country.",
    "opened up a treacherous maritime route through jagged shoals, single-handedly breaking the naval encirclement of {state}."
  ],
  Shipwright: [
    "designed a radically optimized hull blueprint that established the absolute naval dominance of {state}.",
    "pioneered structural engineering methods allowing warships to navigate treacherous deep-water channels.",
    "constructed a legendary, heavily armored flagship in the shipyards of {capital} that survived three successive naval blockades.",
    "revolutionized the production line of the shipyards, allowing {state} to rebuild its shattered armada in a fraction of the usual time.",
    "adapted experimental engineering principles to design shallow-draft transports, enabling vanguard forces to launch surprise river invasions deep into enemy territory."
  ],
  Astronomer: [
    "calculated a precise planetary alignment that successfully predicted a major agricultural shift.",
    "tracked an unexplainable celestial anomaly, advising the council on strategic actions before panic spread.",
    "used a custom-built array of lenses in {capital} to accurately predict a solar eclipse, which the military used to terrify an superstitious invading force.",
    "discovered a fundamental error in the traditional navigational charts of {state}, preventing the merchant fleet from charting a disastrous course.",
    "penned a highly controversial cosmic treatise that challenged orthodox spiritual doctrines, causing a major intellectual rift in the high court."
  ],
  Magistrate: [
    "arbitrated a multi-generational border feud between the state's most powerful noble houses, preventing a civil war.",
    "overhauled the local court tariffs to ensure fair trade conditions across the regional markets.",
    "exposed a systemic ring of embezzlement among the tax collectors of {capital}, recovering a fortune for the depleted treasury.",
    "defied a direct decree from the high court by granting legal asylum to a controversial political group passing through {state}.",
    "drafted an unprecedented municipal charter that granted basic civil protections to the migrant labor forces working the frontier mines."
  ],
  // --- INTRIGUE & COURT SHADOWS ---
  Regent: [
    "held the strings of temporary power during a succession gap, refusing to relinquish control to the rightful heir.",
    "steered the high council of {state} through a decade of minority rule with a cold, calculating grip.",
    "liquidated the royal treasury under the guise of an emergency war effort to enrich their own loyalist houses.",
    "signed a highly controversial peace treaty with an aggressive neighbor before the young monarch could come of age to object.",
    "systematically isolated the rightful heir from the high court of {capital}, convincing the populace that the youth was unfit to govern."
  ],
  Usurper: [
    "seized the crown through a bloody palace coup, spending their entire reign eliminating potential rivals.",
    "overthrew the established dynastic line, forever looking over their shoulder for signs of retribution.",
    "marched an insurrectionist army into {capital}, executing the high council on the palace steps to declare a new imperial era.",
    "assassinated the entire royal lineage during a state banquet, relying on raw military muscle to suppress the ensuing civilian revolts.",
    "rewrote the ancestral laws of {state} to legitimize their conquest, rebranding their violent takeover as a divine liberation."
  ],
  "Rival Claimant": [
    "an ambitious sibling of the crown, destabilized the court by raising a massive personal militia in the provinces.",
    "garnered foreign financial backing to challenge the legitimacy of the sitting monarch of {state}.",
    "produced a contested deathbed will from the previous ruler, splitting the political loyalties of the high council down the middle.",
    "used their vast popularity among the common folk of {culture} to openly contest the crown's unfair tax levies from afar.",
    "staged a dramatic arrival at the coronation ceremony in {capital}, presenting an older, validated bloodline claim that shocked the nobility."
  ],
  "Grand Vizier": [
    "masterfully controlled the flow of imperial paperwork, isolating the ruler from the realities of the realm.",
    "orchestrated the rise and fall of dozens of minor ministers to protect their own supreme administrative status.",
    "diverted massive regional tariffs into a private black budget to fund an elite, secret intelligence network loyal only to them.",
    "manipulated the succession line by poisoning the emperor's mind against his eldest, most capable children.",
    "leveraged their unmatched knowledge of the labyrinthine imperial bureaucracy to trap their political rivals in endless legal deadlock."
  ],
  Defector: [
    "abandoned a powerful rival empire, bringing invaluable military intelligence directly to the high command of {state}.",
    "traded state secrets for safety, transforming the regional political balance in an instant.",
    "fled across the heavily fortified border at midnight, carrying complete schematics of the enemy's frontier defense network.",
    "used their knowledge of foreign court politics to help {state} anticipate and counter every major diplomatic maneuver from their former home.",
    "escaped a purges within a hostile foreign regime, providing the high council of {state} with an exact roster of their deep-cover spies."
  ],
  Assassin: [
    "executed the flawless, silent removal of a foreign commander, dismantling an invasion plan before armies could march.",
    "left no trace behind after striking down a high-ranking corrupt official in the heart of {capital}.",
    "infiltrated a highly secure peace summit, eliminating a warmongering dictator and making it appear like natural heart failure.",
    "used a customized, untraceable poison during a state toast, ending a terrifying dynastic threat in full view of the high court.",
    "hunted down and neutralized the rogue cell leaders who were planning to detonate an alchemical weapon inside {capital}."
  ],
  "Double Agent": [
    "infiltrated the highest inner circles of a hostile state while secretly feeding strategic misinformation back to {state}.",
    "played both sides of a delicate border proxy war, accumulating immense personal leverage.",
    "passed flawless operational plans to a rival military, intentionally omitting a single fatal flaw that led them into an ambush by {state}.",
    "served as a trusted personal advisor to a foreign monarch while systematically sabotaging their diplomatic alliances behind the scenes.",
    "narrowly escaped exposure in a foreign court by framing a completely innocent minister, cementing their own position as an untouchable asset."
  ],
  "Exile-Plotter": [
    "banished to the far frontier, spent a quarter-century orchestrating a complex political comeback from afar.",
    "funded an underground network within {state} while living under the protection of a foreign court.",
    "used their vast, overseas merchant connections to build a massive mercenary host, preparing for an inevitable return to {capital}.",
    "smuggled hundreds of subversive pamphlets into {state} to systematically erode public confidence in the regime that cast them out.",
    "engineered a brilliant diplomatic crisis from a distance, forcing the current rulers of {state} to beg for their return and mediation."
  ],
  Heresiarch: [
    "led a forbidden, highly organized subterranean movement that openly rejected the state's orthodox spiritual laws.",
    "preached a radical underground theology that rapidly infected the lower labor classes of {state}.",
    "converted an entire frontier legion to their unrecognized faith, creating a massive, ideologically driven military breakaway threat.",
    "authored a powerful, banned text that claimed the ruling dynasty of {state} had lost its divine mandate, sparking widespread iconoclasm.",
    "defied the grand inquisitors in {capital} during a public debate, turning their execution into a catalyst for a full-scale religious schism."
  ],
  Blackmailer: [
    "accumulated an archive of deep secrets regarding the ruling elite, dictating state policy through leverage alone.",
    "controlled major court appointments in {capital} without ever holding an official government title.",
    "intercepted a series of highly incriminating letters between a royal heir and a foreign power, using them to extract immense provincial tax exemptions.",
    "built a secret network of eavesdroppers throughout the high estates of {capital} to ensure no noble could safely oppose their demands.",
    "held the ultimate proof of a sitting general's past treason, forcing the military command to execute specific tactical maneuvers on a whim."
  ],
  // --- HIGH FANTASY (EPIC & ARCANE) ---
  "Chosen One": [
    "awoke to an ancient, world-shaping legacy, bearing a mark that compelled the immediate allegiance of the populace.",
    "became the focal point of a sweeping cross-continental movement to fulfill a mythic destiny.",
    "bypassed centuries of strict trial rituals by effortlessly drawing a legendary relic that had rejected every noble in {state}.",
    "unified the disparate, warring clans of {culture} under a single banner, fulfilling a thousands-of-years-old ancestral prophecy.",
    "survived a cataclysmic disaster completely unscathed, convincing both the high council and the peasantry of their divine mandate."
  ],
  Archmage: [
    "unleashed a monumental display of arcane power that permanently altered the local landscape features around {capital}.",
    "established a sovereign arcane enclave, forcing the crown to grant magic users total legal immunity.",
    "constructed an invisible, impenetrable barrier around the borders of {state}, completely halting a massive hostile invasion.",
    "rewrote the laws of elemental manipulation to single-handedly reverse a multi-year magical blight that was starving the realm.",
    "transmuted an entire attacking armada into harmless glass just miles off the vulnerable coastline of {capital}."
  ],
  "God-Emissary": [
    "walked out of the deep wilderness claiming direct celestial authority, issuing absolute mandates that the court dared not defy.",
    "acted as a living avatar, guiding the structural laws of {state} along divine principles.",
    "performed a series of undeniable, awe-inspiring miracles in the grand square of {capital} to validate their cosmic authority.",
    "demanded the immediate dismantling of the corrupt high court, speaking with a resonant voice that brought the nobility to their knees.",
    "instituted a sweeping, fundamental reformation of the spiritual calendar across {state}, aligning civil life with celestial movements."
  ],
  "Relic-Keeper": [
    "safeguarded an ancient, volatile artifact capable of immense destruction, keeping it sealed deep beneath {capital}.",
    "vowed to protect a mythic item, preventing both internal factions and foreign spies from seizing it.",
    "smuggled a world-ending relic out of {capital} just as the palace fell, ensuring the artifact remained hidden from the conquering army.",
    "sacrificed their own eyesight to activate the protective wards sealing a legendary weapon away from the high council's ambition.",
    "maintained a secret, centuries-old order dedicated to monitoring a slumbering cosmic entity bound beneath the soil of {state}."
  ],
  "Oath-Sworn Knight": [
    "bound themselves to an immutable, cosmic vow that forced them to defend the borders of {state} without rest.",
    "marched alone into an overwhelming vanguard force to honor a blood oath sworn to a dying dynasty.",
    "refused a direct royal pardon, choosing to live in permanent exile on the frontier to fulfill the final command of their fallen lord.",
    "stood as a silent, unyielding sentinel outside the high council chambers in {capital}, bound by honor to protect the seat of power regardless of who sat in it.",
    "shattered their own family crest to honor a higher vow of absolute poverty and martial service to the destitute classes of {culture}."
  ],
  // --- GRIM FANTASY (DARK & GRITTY) ---
  "Witch-Hunter": [
    "conducted a brutal, uncompromising purge across the provinces to eliminate forbidden arcane corruption.",
    "left a trail of ashes through the frontier towns, executing anyone suspected of practicing outlawed magic.",
    "infiltrated the high courts of {capital} to expose a secret, magic-wielding coven operating among the nobility.",
    "confiscated an entire library of ancient, occult texts from an estate in {state}, consigning the knowledge to a massive public bonfire.",
    "wore a mask of absolute piety while deploying specialized, anti-magic iron weaponry to neutralize highly dangerous rogue sorcerers."
  ],
  Necromancer: [
    "shattered the ultimate taboo by raising an army of the fallen to defend an otherwise doomed border city.",
    "was hunted into exile after deep catacombs beneath {capital} were discovered filled with their dark experiments.",
    "whispered forbidden incantations in the royal crypts of {state}, forcing long-dead monarchs to yield up their ancient military secrets.",
    "bound their own life force to a decaying relic, ensuring that striking them down would trigger a catastrophic localized curse.",
    "engineered a localized resurrection ritual that allowed a fallen vanguard unit to fight on hours after their physical deaths."
  ],
  "Plague-Doctor": [
    "managed a bio-magical catastrophe in the slums of {capital}, utilizing grim, experimental methods to contain the rot.",
    "walked through the dead zones of {state} when all other healers and administrative officials had fled.",
    "instituted an absolute, military-enforced quarantine on a wealthy merchant district in {capital}, callously sacrificing the few to save the city.",
    "discovered that the raging pandemic ravaging {state} was actually an engineered bio-weapon, successfully identifying the specific alchemical antidote.",
    "harvested biological samples from terminal patients to create a volatile, defensive miasma that could be weaponized on the frontier."
  ],
  "Blood-Mage": [
    "utilized outlawed, sacrifice-fueled sorcery to manipulate the physical endurance of frontline battalions.",
    "executed a forbidden ritual that exacted a terrible personal toll on their subjects to turn the tide of a siege.",
    "drew upon their own life essence during a desperate rearguard action, unleashing a crimson wave that withered an entire pursuing cavalry unit.",
    "concocted a dark, vitality-stealing curse that quietly drained the health of an occupying garrison from across the city walls of {capital}.",
    "offered their own memories as a catalyst to forge an unbreakable blood-bond between the high council and their elite bodyguards."
  ],
  Slayer: [
    "a scarred monster-hunting mercenary, cleared a vital mountain pass of a terrifying apex beast that had halted trade.",
    "was hired by the high council to eliminate an unnatural threat lurking within the old ruins.",
    "tracked a legendary, deep-sea leviathan that was terrorizing the merchant fleets of {state}, returning to {capital} with its severed horn.",
    "infiltrated a subterranean nest of aggressive troglodytes beneath the frontier mines, single-handedly securing the colony's primary economic engine.",
    "survived a week-long hunt through a toxic marshland to collect the heart of a primordial stalker that had decimated a whole military scout unit."
  ],
  "Sin-Eater": [
    "an absolute social pariah, tasked with absorbing the spiritual corruption of dying lords to preserve the line of succession.",
    "lived on the fringes of {capital}, carrying the collective guilt of a dynasty's hidden atrocities.",
    "absorbed the final, agonizing curses of a dying warlord, ensuring the passing soul did not drag the entire stability of {state} down with it.",
    "sat by the deathbed of a corrupt high councilor, willingly taking on decades of systemic treason so the heir could inherit an unblemished name.",
    "was secretly brought into the palace of {capital} at midnight to cleanse a mad monarch, emerging with a fractured mind but a secure realm."
  ],
  // --- HUMBLE ORIGINS & ACCIDENTAL HEROES ---
  "Gate-Keeper": [
    "a lowly night watchman, defied a direct command and barred the outer gate of {capital}, narrowly preventing a midnight infiltration.",
    "held a vital checkpoint single-handedly during a chaotic retreat, giving civilian populations time to escape.",
    "refused a massive fortune in bribes from an advancing mercenary army, locking down the harbor gates of {capital} and sounding the alarm.",
    "maintained the heavy frontier gates during an intense artillery bombardment, ensuring the garrison's retreat line remained secure.",
    "memorized every face that entered the inner sanctum of {state} for forty years, identifying a disguised assassin through posture alone."
  ],
  "Scullery-Spy": [
    "an overlooked palace servant, overheard a world-altering conspiracy in the royal kitchens and brought it to the loyal guard.",
    "intercepted coded letters meant for a foreign defector while cleaning the high chambers.",
    "poisoned the wine goblets of a treasonous faction during a secret meeting in the palace cellars, stopping a coup before it began.",
    "utilized the palace's complex servant corridors to safely smuggle a deposed young heir out of {capital} inside a laundry bin.",
    "noticed a subtle discrepancy in the regular food provisions, uncovering an active plot to slowly starve the monarch of {state}."
  ],
  "Conscript-Hero": [
    "a simple farmhand forced into the military, accidentally slew the enemy general in the chaos of a panicked rout.",
    "rallied a broken vanguard line using nothing but a broken banner and absolute desperation.",
    "used their knowledge of rural irrigation networks to flood a valley, completely trapping an advancing heavy cavalry division of a rival nation.",
    "volunteered for a suicidal rearguard action on the frontier, miraculously surviving while holding off an entire scout platoon with a pitchfork.",
    "dragged their wounded commander three miles through an active combat zone, preserving the high leadership of the army of {state}."
  ],
  "Foundling-Heir": [
    "raised as a destitute street urchin, was revealed through a birthmark to be the critical missing link to a broken throne.",
    "discovered by the high council just as a civil succession war threatened to tear {state} apart.",
    "was picked from the slums of {capital} after an ancient royal relic resonated with their bloodline, shocking the noble houses.",
    "grew up under a false identity in a border village, unaware that their hidden heritage made them the ultimate political target.",
    "presented a verified signet ring to the high court, instantly invalidating the claims of the corrupt factions vying for power."
  ],
  "Messenger-Runner": [
    "completed a desperate, non-stop sprint through hostile lines to deliver reinforcement orders, collapsing as the gates opened.",
    "traversed a crumbling mountain pass in record time to warn {capital} of an incoming flanking detachment.",
    "swallowed a critical diplomatic missive to keep it hidden from an enemy scouting party, successfully delivering it to the garrison command of {state}.",
    "navigated a dense, treacherous swamp at midnight to deliver the high council's counter-orders to an advancing vanguard force.",
    "raced through a city wide firestorm in {capital} to ensure the evacuation orders reached the lower quarters before the walls breached."
  ],
  "Stable-Hand": [
    "sabotaged the cavalry mounts of an invading vanguard force at a crucial bottleneck, crippling their offensive pace.",
    "provided fresh horses to a fleeing royal family, altering the political survival of the dynasty.",
    "tended to the elite warhorses of {state}, using a specialized herbal blend to cure a sudden equine plague that threatened the cavalry divisions.",
    "overheard a treasonous plot spoken by a high-ranking lord while prepping their steed in the royal stables of {capital}.",
    "loosed an entire herd of thoroughbreds into an occupying army's camp at midnight, causing absolute chaos and delaying their morning march."
  ],
  "Hermit-Prophet": [
    "emerged from decades in the deep wastes to issue an unexpected warning that successfully saved the capital from a natural disaster.",
    "rejected the wealth of {capital} to live in a cave, where their sudden political insights became highly sought after by rulers.",
    "accurately predicted the complete collapse of a ruling dynasty of {state}, writing the warning in the dust outside the high court gates.",
    "was dragged before the high council in chains, only to calmly outline the exact tactical flaws in the nation's upcoming campaign.",
    "guided a lost, retreating legion through an impassable mountain range after receiving a vision of their plight in the wilderness."
  ]
};

interface CulturalDemographics {
  primaryCultureId: number;
  influenceWeights: Record<number, number>; // Maps cultureId -> dynamic dominance score
}

class HistoryModule {
  private getMemoryKey(idA: number, idB: number): string {
    return idA < idB ? `${idA}_${idB}` : `${idB}_${idA}`;
  }

  private getMemory(idA: number, idB: number): DiplomaticMemoryScore {
    const key = this.getMemoryKey(idA, idB);
    this.diplomaticMemoryMatrix[key] ??= { historicalGrudges: 0, historicalAccords: 0, lastCatalystYear: 0 };
    return this.diplomaticMemoryMatrix[key];
  }

  // All of the below are backed by pack.history (not plain instance fields) so they survive
  // export/import — otherwise the memory/coordination behind a state's diplomacy, shared world
  // events, or a religion's history would silently reset every time the page reloads.
  private ensureWorldHistory(): WorldHistory {
    pack.history ??= {
      activeGlobalEra: null,
      sharedWorldEvents: {},
      diplomaticMemoryMatrix: {},
      religionHistory: {},
      burgHistory: {},
      originLegends: {}
    };

    return pack.history;
  }

  private get diplomaticMemoryMatrix(): Record<string, DiplomaticMemoryScore> {
    return this.ensureWorldHistory().diplomaticMemoryMatrix;
  }

  private set diplomaticMemoryMatrix(value: Record<string, DiplomaticMemoryScore>) {
    this.ensureWorldHistory().diplomaticMemoryMatrix = value;
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

  private get religionHistory(): Record<number, HistoricalEvent[]> {
    return this.ensureWorldHistory().religionHistory;
  }

  private set religionHistory(value: Record<number, HistoricalEvent[]>) {
    this.ensureWorldHistory().religionHistory = value;
  }

  private get burgHistory(): Record<number, HistoricalEvent[]> {
    return this.ensureWorldHistory().burgHistory;
  }

  private set burgHistory(value: Record<number, HistoricalEvent[]>) {
    this.ensureWorldHistory().burgHistory = value;
  }

  private get originLegends(): Record<number, OriginLegend> {
    return this.ensureWorldHistory().originLegends;
  }

  private set originLegends(value: Record<number, OriginLegend>) {
    this.ensureWorldHistory().originLegends = value;
  }



  generate(regenerate = false, stateId: number | null = null) {
    TIME && console.time("generateHistory");

    const isFullRun = stateId === null;

    if (isFullRun && regenerate) {
      this.diplomaticMemoryMatrix = {}; // Reset global transactional memory banks
      this.originLegends = {}; // Reset shared legendary predecessor entities so siblings re-coordinate
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

    // religion history is world-level (like the shared events above), not per-state, so it's
    // only (re)built on a full run — a single-state regenerate has no reason to touch it
    if (isFullRun && (regenerate || Object.keys(this.religionHistory).length === 0)) {
      this.generateReligionHistory();
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

    // Step 3.5: Burg-level moments for the capital (founding notability + any sacking during a lost war)
    this.burgHistory[state.capital] = this.buildCapitalHistory(state, foundingYear);

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

    // INJECT RELIGIOUS GEOPOLITICS HERE
    const religiousConflicts = this.processReligiousGeopolitics(state, foundingYear, recordedEvents);
    recordedEvents.push(...religiousConflicts);

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
      const activeCulture = demographics.primaryCultureId;
      const name = Names.getCulture(activeCulture);

      // Check for an active campaign during the figure's timeframe if they are a General
      const campaign =
        role === "General"
          ? (state.campaigns || []).find(c => c.start <= year && (c.end ?? options.year) >= year)
          : undefined;

      const values: FigureValues = {
        state: state.name,
        capital: pack.burgs[state.capital]?.name || state.name,
        culture: pack.cultures[activeCulture]?.name,
        religion: pack.religions[pack.cells.religion[state.center]]?.name,
        campaign: campaign?.name
      };

      let relationData: NotableFigure["relation"];
      let text = "";

      // Relational Engine: Look for a preceding historical figure to tie down a narrative link
      // We look for characters born 15 to 70 years prior to establish logical timeline pacing
      // const anchor = figures.find(f => f.year < year && year - f.year >= 15 && year - f.year <= 70);

      // const roleTemplates = _RELATIONAL_TEMPLATES[role];
      // const templateList = anchor && roleTemplates ? roleTemplates[anchor.role] : undefined;

      // 1. Get the template mappings for the current figure's role
      const roleTemplates = _RELATIONAL_TEMPLATES[role];

      // 2. Find ALL valid preceding figures that fit the timeline AND have a defined template relationship
      const validAnchors = figures.filter(f => {
        const ageDifference = year - f.year;
        const fitsTimeframe = ageDifference >= 15 && ageDifference <= 70;
        const hasValidTemplate = roleTemplates?.[f.role] && roleTemplates[f.role]!.length > 0;
        return fitsTimeframe && hasValidTemplate;
      });

      // 3. Randomly select an anchor from the pool of valid options, if any exist
      const anchor = validAnchors.length > 0 ? ra(validAnchors) : undefined;
      const templateList = anchor ? roleTemplates[anchor.role] : undefined;

      if (anchor && templateList && templateList.length > 0 && P(0.4)) {
        // Build relational text line from templates
        const chosenTemplate = ra(templateList);
        text = `${name} ${chosenTemplate.replace(/{target}/g, anchor.name).replace(/{capital}/g, values.capital)}`;

        // Map reciprocal structural relationship classifications cleanly
        const relationshipTypes: Record<FigureRole, NotableFigure["relation"]["type"]> = {
          Philosopher: "disciple",
          Inventor: "successor",
          "Rebel Leader": "nemesis",
          "Religious Figure": "disciple",
          Commoner: "rival",
          Explorer: "successor",
          Artist: "disciple",
          "Merchant Magnate": "rival",
          Spymaster: "rival",
          Healer: "disciple",
          General: "successor",
          Architect: "successor",
          Outcast: "descendant"
        };

        relationData = {
          targetName: anchor.name,
          targetRole: anchor.role,
          type: relationshipTypes[role] || "successor"
        };
      } else {
        // Fallback to traditional context-driven generation if no logical legacy match fits
        text = this.figureText(role, name, values);
      }

      const newFigure: NotableFigure = { name, role, year, text };
      if (relationData) {
        newFigure.relation = relationData;
      }

      figures.push(newFigure);
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

  // burg-level moments for a state's capital: a founding tied to why the town actually became
  // notable, plus any sacking suffered during a war it actually lost. Stored on pack.history,
  // keyed by burg id, since a burg's story shouldn't vanish if the state itself is later removed.
  private buildCapitalHistory(state: State, foundingYear: number): HistoricalEvent[] {
    const capital = pack.burgs[state.capital];
    if (!capital) return [];

    const events: HistoricalEvent[] = [this.burgFoundingEvent(capital, foundingYear)];
    events.push(...this.capitalSackEvents(state, capital, foundingYear));

    return events.sort((a, b) => b.year - a.year);
  }

  private burgFoundingEvent(burg: Burg, foundingYear: number): HistoricalEvent {
    const name = burg.name || "the settlement";

    const allTraits = Object.keys(BURG_NOTABLE_TRAITS) as Array<keyof typeof BURG_NOTABLE_TRAITS>;
    
    // 1. Separate traits the burg actually qualifies for vs. general flavor
    const realTraits = allTraits.filter(trait => Number(burg[trait] || 0) > 0);
    const flavorTraits = allTraits.filter(trait => !realTraits.includes(trait));

    const targetCount = rand(3, 5);
    const selectedTraits: string[] = [];

    // 2. Pull from real traits first
    while (realTraits.length > 0 && selectedTraits.length < targetCount) {
      const index = Math.floor(Math.random() * realTraits.length);
      const trait = realTraits.splice(index, 1)[0];
      selectedTraits.push(BURG_NOTABLE_TRAITS[trait](name));
    }

    // 3. If we haven't hit our target, pad it out with random flavor traits
    while (flavorTraits.length > 0 && selectedTraits.length < targetCount) {
      const index = Math.floor(Math.random() * flavorTraits.length);
      const trait = flavorTraits.splice(index, 1)[0];
      selectedTraits.push(BURG_NOTABLE_TRAITS[trait](name));
    }

    const text = selectedTraits.join(" ");
    return { year: foundingYear - rand(1, 8), type: "founding", title: `Founding of ${name}`, text };
  }

  // only the defending side's capital is ever at risk — and only when the attacker actually won
  // the same coordinated coin flip already used to narrate the state-level war outcome
  private capitalSackEvents(state: State, capital: Burg, foundingYear: number): HistoricalEvent[] {
    const events: HistoricalEvent[] = [];
    const name = capital.name || state.name;

    (state.campaigns || []).forEach(campaign => {
      if (campaign.start < foundingYear || !campaign.end) return;
      if (campaign.defender !== state.i) return;

      const startYear = Math.round(campaign.start);
      const endKey = startYear + 10000; // matches the keying scheme used in warEvents()
      const outcome = this.sharedWorldEvents[endKey];
      if (!outcome || outcome.victor !== campaign.attacker) return;
      if (!P(0.5)) return; // not every lost war reaches all the way to the capital

      const attacker = pack.states[campaign.attacker];
      events.push({
        year: Math.round(campaign.end),
        type: "sacked",
        title: `Sack of ${name}`,
        text: `${name} was sacked by the armies of ${
          attacker?.name || "the enemy"
        } during the ${campaign.name}, and the scars of that day are still spoken of.`
      });
    });

    return events;
  }

  // builds a founding/schism/holy-war timeline for every real religion (skips "No religion" and removed ones),
  // stored world-level on pack.history since it isn't owned by any single state
  private generateReligionHistory(): void {
    const history: Record<number, HistoricalEvent[]> = {};

    pack.religions.forEach(religion => {
      if (!religion.i || religion.removed) return;

      const foundingYear = this.getFoundingYear();
      const events: HistoricalEvent[] = [this.religionFoundingEvent(religion, foundingYear)];

      const schism = this.religionSchismEvent(religion, foundingYear);
      if (schism) events.push(schism);

      const holyWar = this.religionHolyWarEvent(religion, foundingYear);
      if (holyWar) events.push(holyWar);

      history[religion.i] = events.sort((a, b) => b.year - a.year);
    });

    this.religionHistory = history;
  }

  private religionFoundingEvent(religion: Religion, foundingYear: number): HistoricalEvent {
    const culture = pack.cultures[religion.culture];
    const cultureName = culture?.name || "the local peoples";
    const deityText = religion.deity || "a nameless divine force";

    const templates = RELIGION_FOUNDING_TEMPLATES[religion.type] || RELIGION_FOUNDING_TEMPLATES.Folk;
    const text = `${religion.name} ${ra(templates)
      .replace(/{culture}/g, cultureName)
      .replace(/{deity}/g, deityText)}`;

    return { year: foundingYear, type: "religious", title: `Founding of ${religion.name}`, text };
  }

  // if this religion has a real parent (religion.origins), it schismed off that parent faith
  private religionSchismEvent(religion: Religion, foundingYear: number): HistoricalEvent | null {
    const originId = religion.origins?.find(o => o !== religion.i);
    const parent = originId == null ? null : pack.religions[originId];
    if (!parent) return null;

    const schismYear = foundingYear + rand(5, 40);
    const deityText = religion.deity || parent.deity || "the nature of the divine";
    const cause = ra(SCHISM_CAUSES).replace(/{deity}/g, deityText);

    return {
      year: schismYear,
      type: "schism",
      title: `Schism from ${parent.name}`,
      text: `${religion.name} broke away from ${parent.name} ${cause}, forming a distinct movement of its own.`
    };
  }

  // a real holy war: this religion's dominant state actually fought a state of a different,
  // non-trivial religion. Only generated when the underlying campaign data supports it —
  // no fabricated conflict if none of the religion's states were ever at war over faith.
  private religionHolyWarEvent(religion: Religion, foundingYear: number): HistoricalEvent | null {
    for (const state of pack.states) {
      if (!state.i || state.removed) continue;
      if (pack.cells.religion[state.center] !== religion.i) continue;

      const campaign = (state.campaigns || []).find(c => {
        if (c.start < foundingYear) return false;
        const foeId = c.attacker === state.i ? c.defender : c.attacker;
        const foe = pack.states[foeId];
        if (!foe) return false;
        const foeReligion = pack.religions[pack.cells.religion[foe.center]];
        return Boolean(foeReligion && foeReligion.i !== religion.i && foeReligion.i !== 0);
      });
      if (!campaign) continue;

      const foeId = campaign.attacker === state.i ? campaign.defender : campaign.attacker;
      const foe = pack.states[foeId];
      const foeReligion = pack.religions[pack.cells.religion[foe.center]];

      return {
        year: Math.round(campaign.start),
        type: "holy-war",
        title: `Holy War: ${campaign.name}`,
        text: `In the name of ${religion.name}, ${state.name} clashed with ${foe.name} and its faith, ${
          foeReligion?.name || "a rival creed"
        }, during the ${campaign.name}.`
      };
    }

    return null;
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
    const originKey = originId ?? state.culture;
    const legend = this.getOriginLegend(originKey);
    const capitalName = pack.burgs[state.capital]?.name || state.name;

    return [
      ...legend.events,
      {
        year: foundingYear - rand(5, 14),
        type: "legend",
        title: "Between Two Ages",
        text: `In the generations that followed, small settlements rose from the remains of ${legend.entityName}, one of which would grow into ${capitalName}.`
      }
    ];
  }

  // shared by every state descended from the same origin culture (see legendaryEvents), so siblings
  // tell the same legendary story instead of each inventing their own predecessor entity. Memoized on
  // pack.history.originLegends, keyed by origin culture id, the same coordination pattern as
  // sharedWorldEvents/activeGlobalEra above.
  private getOriginLegend(originKey: number): OriginLegend {
    this.originLegends[originKey] ??= this.buildOriginLegend(originKey);
    return this.originLegends[originKey];
  }

  private buildOriginLegend(originKey: number): OriginLegend {
    const originCulture = pack.cultures[originKey];
    const rootCultureName = originCulture?.name || "the peoples of this land";

    //

    //
    const legendSpan = gauss(7500, 2000, 200, 10500);
        const emergenceYear = options.year - legendSpan;
    const entityName = ra(LEGEND_FORMS).replace("{name}", Names.getCultureShort(originKey));

    // the earliest year any state could possibly roll as its own founding year (see getFoundingYear) —
    // used as a conservative upper bound so this shared timeline always predates every sibling's founding,
    // regardless of which specific state's own (independently rolled) foundingYear ends up being
    const conservativeFoundingFloor = options.year - Math.min(900, Math.max(60, options.year - 10));

    const backdrop = this.activeGlobalEra || ra(ANCIENT_ERAS);
    const backdropYear = emergenceYear - rand(700, 10000);

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
        text: `Long before the great states of today took shape, ${rootCultureName} coalesced into ${entityName}, an early power that first brought order to the region.`
      }
    ];

    const intermediateEventCount = rand(25, 100); // Number of events to generate between the emergence and founding years
    const milestoneYears: number[] = [];

    while (milestoneYears.length < intermediateEventCount) {
      const milestoneUpperBound = Math.max(emergenceYear + 60, conservativeFoundingFloor - 500);
      const potentialYear = rand(emergenceYear + 50, milestoneUpperBound);

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
    const downfallUpperBound = Math.max(Math.round(emergenceYear + legendSpan * 0.5) + 1, conservativeFoundingFloor - 15);
    const downfallYear = rand(Math.round(emergenceYear + legendSpan * 0.5), downfallUpperBound);
    events.push({
      year: downfallYear,
      type: "legend",
      title: `Fall of ${entityName}`,
      text: LEGEND_DOWNFALLS[downfallKey](entityName)
    });

    return { entityName, events };

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
            victor: attackerWon ? campaign.attacker : campaign.defender,
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

  // Core processor for analyzing inter-state religious friction or synchronization
  private processReligiousGeopolitics(
    state: State,
    foundingYear: number,
    recordedEvents: HistoricalEvent[]
  ): HistoricalEvent[] {
    const religiousEvents: HistoricalEvent[] = [];
    const stateReligionId = pack.cells.religion[state.center];
    const stateReligionName = pack.religions[stateReligionId]?.name;

    if (!stateReligionName || !state.diplomacy) return religiousEvents;

    // Scan for geopolitical neighbors
    pack.states.forEach(otherState => {
      if (!otherState.i || otherState.removed || otherState.i === state.i) return;

      const otherReligionId = pack.cells.religion[otherState.center];
      const otherReligionName = pack.religions[otherReligionId]?.name;
      if (!otherReligionName) return;

      const memory = this.getMemory(state.i, otherState.i);
      const relation = state.diplomacy?.[otherState.i];

      // --- CASE 1: HOLY WARS (Different Faiths + Existing War/Rivalry) ---
      if (stateReligionId !== otherReligionId && (relation === "Rival" || memory.historicalGrudges > 3)) {
        const triggerYear = Math.round(rand(Math.max(foundingYear, memory.lastCatalystYear), options.year - 5));

        // Ensure we don't duplicate a massive clash in the exact same timeframe
        if (!recordedEvents.some(e => Math.abs(e.year - triggerYear) < 15 && e.type === "war")) {
          memory.historicalGrudges += 5; // Drastically inflames generational hatred

          religiousEvents.push({
            year: triggerYear,
            type: "war",
            title: `Holy War of the Two Faiths`,
            text: `The deep theological chasm between the ${stateReligionName} of ${state.name} and the ${otherReligionName} followers of ${otherState.name} erupted into a savage Holy War. The borderlands were systematically purged, leaving a legacy of bitter generational radicalization.`
          });

          // Apply severe infrastructure and demographic tax penalties
          this.applyDemographicRipple(state, "war-casualty");
          this.applyDemographicRipple(state, "plague-loss"); // Simulates the devastation of religious zealotry
        }
      }

      // --- CASE 2: SYNCRETIC ACCORDS (Different Faiths + Longterm Alliance/Peace) ---
      if (stateReligionId !== otherReligionId && relation === "Ally" && P(0.35)) {
        const triggerYear = Math.round(rand(foundingYear + 20, options.year - 10));

        if (!recordedEvents.some(e => Math.abs(e.year - triggerYear) < 20 && e.title.includes("Syncretic"))) {
          memory.historicalAccords += 4; // Binds the structural diplomatic ties closer together

          religiousEvents.push({
            year: triggerYear,
            type: "religious",
            title: "Syncretic Accord",
            text: `Years of peaceful trade corridors between ${state.name} and ${otherState.name} allowed a unique theological synthesis to emerge. Elements of ${otherReligionName} were formally woven into the local rites of ${stateReligionName}, calming structural border friction and fostering shared cultural enlightenment.`
          });

          this.applyDemographicRipple(state, "peace-boom");
        }
      }
    });

    return religiousEvents;
  }
}

window.History = new HistoryModule();
