import type { Fact, HistoryEvent, Quote, TriviaQuestionWithAnswer, WordOfDay } from "../types";

export const MOCK_HEADLINES: Record<string, { title: string; source: string; blurb: string }[]> = {
  technology: [
    { title: "Chipmakers race to ship the first 1.4nm processors", source: "TechWire", blurb: "foundries are accelerating next-generation lithography to meet surging demand from data centers and consumer devices" },
    { title: "Open-source browsers gain ground as privacy rules tighten", source: "The Byte", blurb: "new regulations around tracking are pushing users and enterprises toward privacy-first browsing tools" },
    { title: "Foldable laptops move from novelty to mainstream", source: "Gadget Daily", blurb: "manufacturers say improved hinges and display durability have finally made foldable PCs practical for everyday work" },
  ],
  science: [
    { title: "Researchers map the most detailed atlas of the human brain yet", source: "Science Today", blurb: "an international consortium released cell-level maps that could reshape how neurological conditions are studied" },
    { title: "New superconductor candidate passes independent replication", source: "Lab Notes", blurb: "two independent labs confirmed key properties of a material that conducts with minimal resistance at higher temperatures" },
    { title: "Ocean sensors reveal hidden currents beneath Antarctic ice", source: "Earth Journal", blurb: "autonomous floats collected years of data showing how warm water reaches the underside of ice shelves" },
  ],
  ai: [
    { title: "Small language models close the gap with frontier systems", source: "AI Insider", blurb: "compact models running on laptops and phones are now matching larger systems on many everyday reasoning benchmarks" },
    { title: "Hospitals pilot AI assistants to cut documentation time", source: "MedTech Review", blurb: "clinicians report spending less time on paperwork as ambient AI tools draft visit notes for review" },
    { title: "Governments agree on shared AI safety testing framework", source: "Policy Wire", blurb: "a coalition of countries endorsed common evaluation standards for advanced AI systems before deployment" },
  ],
  finance: [
    { title: "Central banks signal a cautious path for interest rates", source: "Market Ledger", blurb: "policymakers indicated they will weigh cooling inflation against slowing growth before making further moves" },
    { title: "Digital payments overtake cash in more emerging markets", source: "Fintech Times", blurb: "instant payment networks and mobile wallets are rapidly replacing cash for daily transactions" },
    { title: "Personal savings rates climb as households turn cautious", source: "Money Matters", blurb: "consumers are setting aside more income amid uncertainty about jobs and prices" },
  ],
  business: [
    { title: "Retailers bet on smaller stores and faster delivery", source: "Commerce Weekly", blurb: "chains are reshaping their footprints to blend neighborhood stores with same-day fulfillment hubs" },
    { title: "Four-day work week trials expand across industries", source: "Work Life", blurb: "companies participating in pilots report steady productivity and improved employee retention" },
    { title: "Startups find new funding in revenue-based financing", source: "Venture Beat Daily", blurb: "founders are turning to flexible repayment models as traditional venture rounds take longer to close" },
  ],
  sports: [
    { title: "Underdog club stuns champions in season opener", source: "Sports Central", blurb: "a late surge sealed one of the biggest upsets in recent memory and set the tone for the season" },
    { title: "Wearable tech is changing how athletes recover", source: "Athlete Lab", blurb: "teams are using continuous monitoring to personalize training loads and reduce injury risk" },
    { title: "Host city unveils plans for a car-free games village", source: "Global Games", blurb: "organizers promise a compact, transit-first event with venues reachable on foot or by rail" },
  ],
  movies: [
    { title: "Original sci-fi film tops the box office for a third week", source: "Screen Report", blurb: "audiences are embracing a non-franchise story, encouraging studios to take more creative risks" },
    { title: "Streaming services rethink release windows for theaters", source: "Reel News", blurb: "platforms are giving films longer theatrical runs after data showed cinema releases boost streaming viewership" },
    { title: "Restored silent-era classic premieres with a live orchestra", source: "Film Archive", blurb: "a painstaking digital restoration brought a long-lost print back to the big screen" },
  ],
  gaming: [
    { title: "Indie hit becomes the most-wishlisted game of the year", source: "Pixel Post", blurb: "a small studio's cozy exploration game drew massive interest after a viral demo weekend" },
    { title: "Cloud gaming gets a boost from new low-latency networks", source: "Game Stream", blurb: "improved edge infrastructure is making high-fidelity streaming playable on modest connections" },
    { title: "Esports league adds mixed-gender team requirement", source: "Esports Today", blurb: "the change aims to widen participation and grow the competitive scene" },
  ],
  politics: [
    { title: "Lawmakers debate new rules for online platform transparency", source: "Capitol Brief", blurb: "proposed legislation would require large platforms to disclose how recommendation systems work" },
    { title: "Record turnout expected as early voting opens", source: "Civic Daily", blurb: "election officials expanded polling hours and locations to handle anticipated demand" },
    { title: "Regional leaders sign water-sharing agreement", source: "World Affairs", blurb: "the deal sets out cooperative management of a river basin serving millions of people" },
  ],
  health: [
    { title: "Study links regular walking to longer healthy lifespan", source: "Health Pulse", blurb: "researchers found even modest daily step counts were associated with meaningful health benefits" },
    { title: "New blood test detects several cancers earlier", source: "Clinical Wire", blurb: "early trial results suggest the screening could catch disease before symptoms appear" },
    { title: "Sleep scientists explain why weekends throw off your clock", source: "Wellness Now", blurb: "shifting bedtimes create a form of social jet lag that affects mood and metabolism" },
  ],
  travel: [
    { title: "Night trains make a comeback across Europe and Asia", source: "Wanderlust", blurb: "new sleeper routes are drawing travelers seeking lower-carbon alternatives to short flights" },
    { title: "Slow travel trend reshapes how tourists plan trips", source: "Travel Notes", blurb: "visitors are choosing fewer destinations and longer stays to experience places more deeply" },
    { title: "Airports roll out biometric boarding at more gates", source: "Jet Set", blurb: "facial verification is speeding up boarding while raising questions about data retention" },
  ],
  food: [
    { title: "Fermentation goes mainstream in home kitchens", source: "Kitchen Table", blurb: "from kimchi to kombucha, home cooks are embracing age-old techniques for flavor and gut health" },
    { title: "Chefs turn to climate-resilient grains", source: "Food Forward", blurb: "millets and other hardy crops are appearing on menus as growers adapt to changing weather" },
    { title: "Street food markets revive downtown districts", source: "Taste Report", blurb: "cities are using food halls and night markets to bring life back to commercial centers" },
  ],
  space: [
    { title: "Lunar lander sends back first images from the far side", source: "Orbit News", blurb: "the mission's cameras captured high-resolution views of a region rarely studied up close" },
    { title: "Telescope spots water vapor on a distant exoplanet", source: "Cosmos Daily", blurb: "astronomers say the finding refines models of how habitable worlds form" },
    { title: "Reusable rockets push launch costs to new lows", source: "Launch Pad", blurb: "rapid booster turnaround is enabling more frequent and affordable access to orbit" },
  ],
  history: [
    { title: "Archaeologists uncover a 3,000-year-old trading post", source: "Past Times", blurb: "artifacts found at the site point to long-distance trade networks earlier than previously believed" },
    { title: "Digitized archives reveal forgotten wartime letters", source: "Heritage Weekly", blurb: "volunteers transcribed thousands of documents, shedding light on everyday life in the period" },
    { title: "Ancient shipwreck yields remarkably preserved cargo", source: "Deep History", blurb: "divers recovered amphorae and tools that offer clues about maritime commerce" },
  ],
  books: [
    { title: "Debut novel wins the year's top literary prize", source: "Book Review", blurb: "judges praised the author's inventive structure and emotional depth" },
    { title: "Independent bookstores report a surprising sales boom", source: "Paper Trail", blurb: "community events and curated selections are drawing readers back to local shops" },
    { title: "Audiobooks drive a surge in classic literature sales", source: "Reading Room", blurb: "listeners are rediscovering older works through high-quality narrated editions" },
  ],
  photography: [
    { title: "Wildlife photo of the year captures a rare snow leopard", source: "Lens Life", blurb: "the winning image was the result of months of patient tracking in the mountains" },
    { title: "Smartphone sensors rival entry-level cameras", source: "Shutter Daily", blurb: "computational photography advances are narrowing the gap with dedicated equipment" },
    { title: "Film photography finds a new generation of fans", source: "Darkroom", blurb: "young photographers are embracing analog cameras for their deliberate, tactile process" },
  ],
  cars: [
    { title: "Affordable EVs finally reach price parity with gas cars", source: "Auto Insight", blurb: "falling battery costs are enabling manufacturers to offer electric models at mainstream prices" },
    { title: "Solid-state batteries enter pilot production", source: "Drive Tech", blurb: "the technology promises faster charging and greater range for next-generation vehicles" },
    { title: "Classic car restorations go electric", source: "Motor Weekly", blurb: "workshops are converting vintage vehicles with modern electric drivetrains" },
  ],
  cricket: [
    { title: "Spinner's five-wicket haul seals a thrilling Test win", source: "Cricket Chronicle", blurb: "a dramatic final session turned the match after the batting side had looked set to draw" },
    { title: "T20 league expands with two new franchises", source: "Boundary Line", blurb: "organizers say the expansion will bring top-level cricket to new cities" },
    { title: "Young opener breaks long-standing batting record", source: "Pitch Report", blurb: "the 19-year-old became the youngest player to reach the milestone in the format" },
  ],
  football: [
    { title: "Late winner keeps title race wide open", source: "Football Focus", blurb: "a stoppage-time goal sent fans into raptures and tightened the top of the table" },
    { title: "Clubs invest heavily in youth academies", source: "Pitchside", blurb: "teams are prioritizing homegrown talent as transfer fees continue to rise" },
    { title: "Women's league sets new attendance record", source: "Goal Line", blurb: "a sold-out stadium highlighted the rapid growth of the women's game" },
  ],
  formula1: [
    { title: "Rookie claims maiden pole in a wet qualifying session", source: "Grid Insider", blurb: "changing conditions produced a shock result at the top of the timesheets" },
    { title: "Teams unveil designs for new sustainable fuel era", source: "Pit Wall", blurb: "upcoming regulations will require fully sustainable fuels and more electric power" },
    { title: "Strategy gamble delivers dramatic race victory", source: "Paddock Post", blurb: "a bold one-stop call allowed the winner to leapfrog rivals in the closing laps" },
  ],
  stocks: [
    { title: "Tech stocks lead markets higher on strong earnings", source: "Street Report", blurb: "upbeat quarterly results from major companies lifted major indices" },
    { title: "Index funds hit record share of investor assets", source: "Market Watchers", blurb: "passive investing continues to grow as fees fall and investors seek simplicity" },
    { title: "Small caps rally as rate worries ease", source: "Ticker Tape", blurb: "smaller companies outperformed as investors priced in a steadier rate outlook" },
  ],
  crypto: [
    { title: "Bitcoin volatility drops to multi-year lows", source: "Chain Daily", blurb: "analysts attribute the calm to growing institutional participation and regulated products" },
    { title: "Regulators finalize rules for stablecoin issuers", source: "Block Report", blurb: "the framework sets reserve and disclosure requirements for dollar-backed tokens" },
    { title: "Ethereum upgrade cuts transaction fees on layer-2 networks", source: "Crypto Brief", blurb: "the change makes everyday transactions cheaper for users of scaling networks" },
  ],
};

export const MOCK_WORDS: WordOfDay[] = [
  { word: "Serendipity", pronunciation: "/ˌser.ənˈdɪp.ə.ti/", partOfSpeech: "noun", meaning: "The occurrence of events by chance in a happy or beneficial way.", example: "Finding that rare book in a tiny shop was pure serendipity." },
  { word: "Ephemeral", pronunciation: "/ɪˈfem.ər.əl/", partOfSpeech: "adjective", meaning: "Lasting for a very short time.", example: "The beauty of cherry blossoms is ephemeral, which makes it all the more precious." },
  { word: "Sonder", pronunciation: "/ˈsɒn.dər/", partOfSpeech: "noun", meaning: "The realization that each passerby has a life as vivid and complex as your own.", example: "Watching the crowded station, she was struck by a sudden sense of sonder." },
  { word: "Petrichor", pronunciation: "/ˈpet.rɪ.kɔːr/", partOfSpeech: "noun", meaning: "A pleasant smell that frequently accompanies the first rain after a long dry spell.", example: "The petrichor rising from the garden signaled the end of summer." },
  { word: "Ineffable", pronunciation: "/ɪnˈef.ə.bəl/", partOfSpeech: "adjective", meaning: "Too great or extreme to be expressed or described in words.", example: "The view from the summit filled them with ineffable joy." },
  { word: "Luminous", pronunciation: "/ˈluː.mɪ.nəs/", partOfSpeech: "adjective", meaning: "Full of or shedding light; bright or shining.", example: "The luminous moon lit the path through the forest." },
  { word: "Halcyon", pronunciation: "/ˈhæl.si.ən/", partOfSpeech: "adjective", meaning: "Denoting a period of time in the past that was idyllically happy and peaceful.", example: "He often spoke of the halcyon days of his childhood by the sea." },
  { word: "Mellifluous", pronunciation: "/məˈlɪf.lu.əs/", partOfSpeech: "adjective", meaning: "Sweet or musical; pleasant to hear.", example: "Her mellifluous voice made the audiobook a delight." },
  { word: "Quixotic", pronunciation: "/kwɪkˈsɒt.ɪk/", partOfSpeech: "adjective", meaning: "Exceedingly idealistic; unrealistic and impractical.", example: "His quixotic plan to cycle around the world on a unicycle amused everyone." },
  { word: "Resilience", pronunciation: "/rɪˈzɪl.i.əns/", partOfSpeech: "noun", meaning: "The capacity to recover quickly from difficulties.", example: "The community showed remarkable resilience after the storm." },
  { word: "Eloquent", pronunciation: "/ˈel.ə.kwənt/", partOfSpeech: "adjective", meaning: "Fluent or persuasive in speaking or writing.", example: "She gave an eloquent speech that moved the entire room." },
  { word: "Wanderlust", pronunciation: "/ˈwɒn.də.lʌst/", partOfSpeech: "noun", meaning: "A strong desire to travel and explore the world.", example: "Wanderlust led him to sell his car and buy a one-way ticket." },
  { word: "Ubiquitous", pronunciation: "/juːˈbɪk.wɪ.təs/", partOfSpeech: "adjective", meaning: "Present, appearing, or found everywhere.", example: "Smartphones have become ubiquitous in modern life." },
  { word: "Zenith", pronunciation: "/ˈzen.ɪθ/", partOfSpeech: "noun", meaning: "The time at which something is most powerful or successful.", example: "The empire reached its zenith in the second century." },
];

export const MOCK_QUOTES: Quote[] = [
  { text: "The best way to predict the future is to invent it.", author: "Alan Kay" },
  { text: "Curiosity is the wick in the candle of learning.", author: "William Arthur Ward" },
  { text: "Simplicity is the ultimate sophistication.", author: "Leonardo da Vinci" },
  { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Knowledge is power. Information is liberating.", author: "Kofi Annan" },
  { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
  { text: "Do what you can, with what you have, where you are.", author: "Theodore Roosevelt" },
  { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
  { text: "Well done is better than well said.", author: "Benjamin Franklin" },
];

export const MOCK_FACTS: Fact[] = [
  { id: "f1", text: "Octopuses have three hearts and blue blood." },
  { id: "f2", text: "Honey never spoils — edible honey has been found in ancient Egyptian tombs." },
  { id: "f3", text: "A day on Venus is longer than a year on Venus." },
  { id: "f4", text: "Bananas are berries, but strawberries are not." },
  { id: "f5", text: "The Eiffel Tower can grow more than 15 cm taller in summer due to thermal expansion." },
  { id: "f6", text: "Sharks existed before trees — by roughly 50 million years." },
  { id: "f7", text: "There are more possible chess games than atoms in the observable universe." },
  { id: "f8", text: "Wombat droppings are cube-shaped." },
  { id: "f9", text: "Light from the Sun takes about 8 minutes and 20 seconds to reach Earth." },
  { id: "f10", text: "A group of flamingos is called a 'flamboyance'." },
];

export const MOCK_TRIVIA: TriviaQuestionWithAnswer[] = [
  { id: "t1", question: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Mercury"], answer: "Mars", category: "Science", difficulty: "easy" },
  { id: "t2", question: "Who painted the Mona Lisa?", options: ["Michelangelo", "Raphael", "Leonardo da Vinci", "Donatello"], answer: "Leonardo da Vinci", category: "Art", difficulty: "easy" },
  { id: "t3", question: "What is the chemical symbol for gold?", options: ["Ag", "Au", "Gd", "Go"], answer: "Au", category: "Science", difficulty: "easy" },
  { id: "t4", question: "How many players are on a cricket team on the field?", options: ["9", "10", "11", "12"], answer: "11", category: "Sports", difficulty: "easy" },
  { id: "t5", question: "Which year did humans first land on the Moon?", options: ["1965", "1969", "1972", "1959"], answer: "1969", category: "History", difficulty: "easy" },
  { id: "t6", question: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], answer: "Pacific", category: "Geography", difficulty: "easy" },
  { id: "t7", question: "Which language has the most native speakers?", options: ["English", "Hindi", "Mandarin Chinese", "Spanish"], answer: "Mandarin Chinese", category: "General", difficulty: "medium" },
  { id: "t8", question: "What does 'CPU' stand for?", options: ["Central Processing Unit", "Computer Power Unit", "Core Program Utility", "Central Peripheral Unit"], answer: "Central Processing Unit", category: "Technology", difficulty: "easy" },
  { id: "t9", question: "Which F1 team is based in Maranello?", options: ["McLaren", "Ferrari", "Mercedes", "Red Bull"], answer: "Ferrari", category: "Sports", difficulty: "medium" },
  { id: "t10", question: "Who wrote '1984'?", options: ["Aldous Huxley", "George Orwell", "Ray Bradbury", "H.G. Wells"], answer: "George Orwell", category: "Books", difficulty: "easy" },
  { id: "t11", question: "What is the smallest prime number?", options: ["0", "1", "2", "3"], answer: "2", category: "Math", difficulty: "easy" },
  { id: "t12", question: "Which country hosted the first modern Olympic Games?", options: ["France", "Greece", "Italy", "USA"], answer: "Greece", category: "History", difficulty: "medium" },
  { id: "t13", question: "What is the hardest natural substance?", options: ["Quartz", "Diamond", "Titanium", "Graphene"], answer: "Diamond", category: "Science", difficulty: "easy" },
  { id: "t14", question: "Which cryptocurrency was created by Satoshi Nakamoto?", options: ["Ethereum", "Litecoin", "Bitcoin", "Dogecoin"], answer: "Bitcoin", category: "Finance", difficulty: "easy" },
  { id: "t15", question: "What is the capital of Australia?", options: ["Sydney", "Melbourne", "Canberra", "Perth"], answer: "Canberra", category: "Geography", difficulty: "medium" },
];

export const MOCK_HISTORY: HistoryEvent[] = [
  { year: 1969, text: "Apollo 11 astronauts become the first humans to walk on the Moon." },
  { year: 1989, text: "The Berlin Wall falls, paving the way for German reunification." },
  { year: 1903, text: "The Wright brothers make the first controlled, powered airplane flights." },
  { year: 1991, text: "The World Wide Web becomes publicly available." },
  { year: 1953, text: "Watson and Crick describe the double-helix structure of DNA." },
  { year: 1928, text: "Alexander Fleming discovers penicillin." },
  { year: 1947, text: "India gains independence from British rule." },
  { year: 1876, text: "Alexander Graham Bell is granted a patent for the telephone." },
  { year: 1990, text: "The Hubble Space Telescope is launched into orbit." },
  { year: 2004, text: "The Cassini spacecraft enters orbit around Saturn." },
];
