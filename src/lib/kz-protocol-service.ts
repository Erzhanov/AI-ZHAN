/**
 * Kazakhstan Clinical Protocols (ҚР Денсаулық сақтау министрлігінің Клиникалық хаттамалары) Service
 * Implementation of the 9-Step Clinical Triage & Protocol RAG Pipeline
 *
 * Three Knowledge Bases:
 * 1. Symptom Dictionary (symptom_dictionary.json) - terms, folk synonyms, and negations in KZ/RU
 * 2. Symptom Maps (symptom_maps.json) - disease symptoms, weights, thresholds, and confirm tests
 * 3. KZ Clinical Protocols (kz_protocols.json) - 1,187 official RK protocols structured into sections
 */

// ==========================================
// 1. DATA TYPES & INTERFACES
// ==========================================

export interface SymptomDefinition {
  id: string;
  term_ru: string;
  synonyms_ru: string[];
  synonyms_kz: string[];
  negations: string[];
}

export interface DiseaseSymptomWeight {
  id: string;
  weight: number;
}

export interface DiseaseSymptomMap {
  diagnosis: string;
  icd10: string;
  protocol_id: string;
  symptoms: DiseaseSymptomWeight[];
  threshold: number;
  confirm_tests: string[];
  source_url: string;
}

export interface KZProtocol {
  id: number;
  protocol_id: string;
  name: string;
  url: string;
  version: string;
  icd10: string;
  specialties: string;
  gender: "female" | "male" | "both";
  age: "child" | "adult" | "all";
  description: string;
  complaints: string;
  emergency: string;
  treatment: string;
  confirm_tests: string[];
  _symptoms?: SymptomDefinition[];
  _symptom_map?: DiseaseSymptomMap;
}

export interface PatientProfile {
  gender: "male" | "female" | "unknown";
  age: number | null;
  ageCategory: "child" | "adult" | "unknown";
  isPregnant: boolean;
  pregnancyWeeks?: number;
  allergies: string[];
  chronicDiseases: string[];
  currentMedications: string[];
}

export interface RedFlagResult {
  hasRedFlag: boolean;
  type?: string;
  titleKz?: string;
  titleRu?: string;
  guidanceKz?: string;
  guidanceRu?: string;
  actionRequired: string;
}

export interface SafetyCheckResult {
  isSafe: boolean;
  warningsKz: string[];
  warningsRu: string[];
  prescriptionNotice: string;
}

export type ArchitectureStage =
  | "emergency"        // Этап 1: Красные флаги -> Срочно к врачу (Скорая 103 / 112)
  | "clarification"    // Этап 2: Порог уверенности -> нет: ещё вопрос
  | "exam_needed"      // Этап 2: Порог уверенности -> Нужен осмотр (Вопросы кончились)
  | "protocol_answer"; // Этап 3: Ответ по протоколу (порог набран -> RAG по МКБ -> Проверка цифр -> Безопасный ответ)

export interface DosageVerificationResult {
  hasNumbersInAdvice: boolean;
  isVerbatimWithProtocol: boolean;
  extractedDosages: string[];
  safetyNotice: string;
}

export interface ProtocolSearchResult {
  protocol: KZProtocol;
  score: number;
  matchedKeywords: string[];
  symptomMatches?: number;
}

export interface SymptomAnalysisResult {
  // Architecture Stage
  stage: ArchitectureStage;

  // Steps 1 & 2
  detectedSymptoms: string[];
  negatedSymptoms: string[];
  detectedSymptomDetails: Array<{ id: string; name: string }>;

  // Step 3
  isEmergency: boolean;
  redFlag?: RedFlagResult;

  // Step 4
  patientProfile: PatientProfile;

  // Steps 5 & 6
  candidateProtocols: KZProtocol[];
  candidateScores?: Array<{ protocol: KZProtocol; score: number; threshold: number }>;
  primaryProtocol?: KZProtocol;
  isAmbiguous: boolean;
  needsClarification: boolean;
  isExamNeeded?: boolean;
  clarificationQuestions?: string[];
  differentialDiagnosis?: string[];

  // Steps 7, 8, 9
  safetyCheck: SafetyCheckResult;
  dosageVerification?: DosageVerificationResult;
  formattedResponse: string;
  protocolUrl?: string;

  // Backward compatibility
  detectedGender: "male" | "female" | "unknown";
  detectedAge: "child" | "adult" | "unknown";
}

export interface ConsultationAuditRecord {
  id: string;
  timestamp: string;
  stage?: ArchitectureStage;
  input: string;
  detectedSymptoms: string[];
  negatedSymptoms: string[];
  profile: PatientProfile;
  isEmergency: boolean;
  redFlagType?: string;
  candidateProtocols: string[];
  primaryProtocol?: string;
  score?: number;
  threshold?: number;
  dosageVerification?: DosageVerificationResult;
  safetyWarnings: string[];
}

// ==========================================
// 2. KNOWLEDGE BASE LOADERS & CACHING
// ==========================================

let cachedProtocols: KZProtocol[] | null = null;
let cachedDictionary: SymptomDefinition[] | null = null;
let cachedMaps: DiseaseSymptomMap[] | null = null;

export async function getKZProtocols(): Promise<KZProtocol[]> {
  if (cachedProtocols) return cachedProtocols;
  const mod = await import("@/data/kz_protocols.json");
  cachedProtocols = (mod.default || mod) as unknown as KZProtocol[];
  return cachedProtocols;
}

export async function getSymptomDictionary(): Promise<SymptomDefinition[]> {
  if (cachedDictionary) return cachedDictionary;
  const mod = await import("@/data/symptom_dictionary.json");
  cachedDictionary = (mod.default || mod) as unknown as SymptomDefinition[];
  return cachedDictionary;
}

export async function getSymptomMaps(): Promise<DiseaseSymptomMap[]> {
  if (cachedMaps) return cachedMaps;
  const mod = await import("@/data/symptom_maps.json");
  cachedMaps = (mod.default || mod) as unknown as DiseaseSymptomMap[];
  return cachedMaps;
}

// Kazakh & Russian semantic vocabulary for fallback text searches
const SYMPTOM_MAP: Record<string, string[]> = {
  // 1. Blood Pressure & Cardiovascular (prioritized phrases)
  "қан қысымы": ["артериальная гипертензия", "артериальное давление", "гипертензия", "гипертония", "давление"],
  "қан қысымым": ["артериальная гипертензия", "артериальное давление", "гипертензия", "гипертония", "давление"],
  "жоғары қысым": ["артериальная гипертензия", "артериальное давление", "гипертензия", "гипертония"],
  "қысымым": ["артериальная гипертензия", "артериальное давление", "гипертензия", "гипертония"],
  "қысым": ["артериальное давление", "гипертензия", "гипотензия", "криз"],

  // 2. Gastrointestinal & Nausea (distinguish nausea from heart!)
  "жүрек айну": ["тошнота", "позывы на рвоту", "гастрит"],
  "жүрегім айнып": ["тошнота", "позывы на рвоту", "гастрит"],
  "жүрегі айниды": ["тошнота", "рвота", "гастрит"],
  "айнып тұр": ["тошнота", "рвота", "гастрит"],
  "құсу": ["рвота", "рвотные массы"],
  "іш өту": ["диарея", "понос", "жидкий стул", "гастроэнтерит"],
  "іш қату": ["запор", "задержка стула", "непроходимость кишечника"],
  "іш ауруы": ["боль в животе", "острый живот", "аппендицит", "гастрит", "холецистит", "панкреатит"],
  "ішім ауырып": ["боль в животе", "гастрит", "аппендицит", "холецистит", "панкреатит"],
  "ішім": ["боль в животе", "живот", "абдоминальная"],
  "іш": ["боль в животе", "живот", "абдоминальная", "эпигастрии", "подреберье"],
  "асқазан": ["желудок", "гастрит", "язва", "диспепсия"],
  "асқазаным": ["желудок", "гастрит", "язва", "диспепсия"],
  "қыжыл": ["изжога", "гастрит", "гастроэзофагеальная", "диспепсия"],
  "қыжылдап": ["изжога", "гастрит", "гастроэзофагеальная", "диспепсия"],
  "бауыр": ["печень", "гепатит", "желтуха", "цирроз"],
  "өт": ["желчный пузырь", "холецистит", "желчнокаменная"],

  // 3. Head & Neurological (distinguish dizziness from headache)
  "пульсирует": ["мигрень", "пульсирующая", "головная боль"],
  "солқылдап": ["мигрень", "пульсирующая", "головная боль"],
  "жарыққа": ["мигрень", "фотофобия", "светобоязнь"],
  "жарық": ["мигрень", "фотофобия", "светобоязнь"],
  "бас айналу": ["головокружение", "вертиго", "нарушение координации"],
  "басым айналып": ["головокружение", "вертиго"],
  "басы айналады": ["головокружение", "вертиго"],
  "бас ауруы": ["мигрень", "головные боли", "головная боль", "цефалгия"],
  "басым ауырып": ["мигрень", "головные боли", "головная боль", "цефалгия"],
  "басы ауырады": ["мигрень", "головные боли", "головная боль", "цефалгия"],
  "басым": ["головная боль", "цефалгия", "мигрень"],
  "бас": ["головная боль", "мигрень", "цефалгия"],
  "ми": ["мозг", "энцефалопатия", "инсульт", "черепно-мозговая"],

  // 4. Dental (Stomatology)
  "тіс ауруы": ["пульпит", "кариес", "зубная боль", "зубов"],
  "тісім ауырып": ["пульпит", "кариес", "зубная боль", "зубов"],
  "тісім": ["пульпит", "кариес", "зубная боль", "зубов"],
  "тіс": ["пульпит", "кариес", "зубная боль", "зубов"],

  // 5. Respiratory & Throat
  "тамақ ауруы": ["фарингит", "тонзиллит", "ангина", "боль в горле"],
  "тамағым ауырып": ["фарингит", "тонзиллит", "ангина", "боль в горле"],
  "тамағым": ["фарингит", "тонзиллит", "ангина", "боль в горле"],
  "тамақ": ["горло", "фарингит", "тонзиллит", "ангина", "боль в горле"],
  "жөтел": ["кашель", "сухой кашель", "влажный кашель", "бронхит", "пневмония"],
  "жөтеліп": ["кашель", "бронхит", "пневмония"],
  "қақырық": ["мокрота", "гнойная мокрота", "слизистая"],
  "ентігу": ["одышка", "удушье", "затрудненное дыхание", "астма"],
  "тыныс": ["дыхание", "одышка", "бронхоспазм", "пневмония"],
  "өкпе": ["легкое", "пневмония", "бронхит", "плеврит"],
  "мұрын": ["нос", "ринит", "гайморит", "заложенность носа"],
  "тұмау": ["грипп", "орви", "ринит"],

  // 6. Cardiac (only when not "жүрек айну")
  "жүрек": ["сердце", "стенокардия", "инфаркт", "аритмия", "ишемическая"],
  "жүрегім": ["сердце", "стенокардия", "инфаркт", "ишемическая"],
  "кеуде": ["грудная клетка", "боль за грудиной", "стенокардия", "пневмония"],

  // 7. Endocrine & Diabetes
  "шөлдей беремін": ["сахарный диабет", "жажда", "полидипсия"],
  "жиі шөлдеймін": ["сахарный диабет", "жажда", "полидипсия"],
  "қант диабеті": ["сахарный диабет", "диабет"],
  "диабет": ["сахарный диабет", "диабет"],
  "шөл": ["жажда", "сухость во рту", "полидипсия"],
  "шөлдеймін": ["жажда", "полидипсия", "сухость во рту"],

  // 8. Nephrology & Urinary
  "бүйрек": ["почка", "пиелонефрит", "почечная колика", "нефрит"],
  "бүйрегім": ["почка", "пиелонефрит", "почечная колика", "нефрит"],
  "бел": ["поясница", "почечная колика", "радикулит", "остеохондроз"],
  "белім": ["поясница", "почечная колика", "радикулит", "остеохондроз"],
  "зәр": ["мочеиспускание", "дизурия", "цистит", "гематурия"],
  "кіші дәрет": ["дизурия", "цистит", "частое мочеиспускание", "полиурия"],
  "жиі дәретке": ["частое мочеиспускание", "полиурия", "сахарный диабет", "цистит"],
  "қуық": ["мочевой пузырь", "цистит", "уретрит"],

  // 9. Musculoskeletal & Joints
  "буын": ["сустав", "артрит", "артроз", "отек сустава"],
  "буыным": ["сустав", "артрит", "артроз"],
  "буындарым": ["сустав", "артрит", "артроз", "полиартрит"],
  "тізе": ["коленный сустав", "артрит", "артроз", "гонартроз"],
  "тізем": ["коленный сустав", "артрит", "артроз", "гонартроз"],
  "аяқ": ["нога", "конечности", "отеки", "перелом", "варикоз", "боль в ноге"],
  "аяғым": ["нога", "конечности", "отеки", "перелом", "варикоз", "боль в ноге", "коленного сустава", "артрит"],
  "аяғы": ["нога", "конечности", "отеки", "перелом", "варикоз", "боль в ноге"],
  "аяқтарым": ["нога", "конечности", "отеки", "варикоз", "артрит"],
  "қол": ["рука", "кисть", "плечо", "перелом", "конечности"],
  "қолым": ["рука", "кисть", "плечо", "перелом", "сустав"],
  "қолдарым": ["рука", "кисть", "суставы", "полиартрит"],
  "иық": ["плечо", "плечевой сустав", "периартрит"],
  "иығым": ["плечо", "плечевой сустав", "периартрит"],
  "мойын": ["шея", "остеохондроз", "миозит", "шейный"],
  "мойным": ["шея", "остеохондроз", "миозит", "шейный"],
  "арқа": ["спина", "позвоночник", "остеохондроз", "дорсалгия"],
  "арқам": ["спина", "позвоночник", "остеохондроз", "дорсалгия"],
  "жауырын": ["лопатка", "спина", "межреберная невралгия"],
  "жауырыным": ["лопатка", "спина", "межреберная невралгия"],

  // 10. Ophthalmology & ENT
  "көз": ["глаз", "зрения", "конъюнктивит", "нарушения зрения"],
  "көзім": ["зрения", "нарушения зрения", "конъюнктивит"],
  "бұлдырап": ["нарушения зрения", "нечеткость"],
  "құлақ": ["ухо", "отит", "слух", "боль в ухе"],
  "құлағым": ["ухо", "отит", "слух", "боль в ухе"],
  "құлағы": ["ухо", "отит", "слух"],
  "мұрным": ["нос", "ринит", "гайморит", "заложенность носа"],

  // 11. Dermatology & Allergies
  "бөртпе": ["сыпь", "высыпания", "пятна", "везикулы", "папулы", "дерматит"],
  "қышыма": ["зуд", "кожный зуд", "крапивница", "аллергия"],
  "қышып": ["зуд", "кожный зуд", "крапивница"],
  "қышыну": ["зуд", "кожный зуд", "крапивница", "дерматит"],
  "аллергия": ["аллергия", "аллергический", "крапивница", "дерматит", "ринит"],
  "тері": ["кожа", "дерматит", "экзема", "псориаз"],

  // 12. General Symptoms, Fever, Fatigue & Sleep
  "қызу": ["лихорадка", "повышение температуры", "гипертермия", "озноб"],
  "қызуым": ["лихорадка", "повышение температуры", "температура 38", "температура 39"],
  "қызуым көтерілді": ["лихорадка", "повышение температуры", "орви", "грипп"],
  "температура": ["температура", "лихорадка", "повышение температуры"],
  "ыстық": ["лихорадка", "жар", "озноб"],
  "ыстығым": ["лихорадка", "жар", "температура"],
  "қан": ["кровотечение", "анемия", "гемоглобин", "гематома"],
  "ұйқысыздық": ["бессонница", "нарушение сна", "астения", "невроз"],
  "ұйқы": ["сон", "бессонница", "нарушение сна"],
  "ұйқым": ["сон", "бессонница", "нарушение сна"],
  "әлсіздік": ["слабость", "астения", "утомляемость", "анемия", "недомогание"],
  "әлсіреп": ["слабость", "астения", "утомляемость"],
  "шаршау": ["утомляемость", "астения", "слабость"],
  "суық тию": ["орви", "простуда", "ринит", "фарингит", "грипп"],
  "суық тиді": ["орви", "простуда", "ринит", "фарингит", "грипп"],
  "суықтап": ["орви", "простуда", "ринит", "грипп"],
  "диарея": ["диарея", "острый гастроэнтерит", "жидкий стул"],
  "шаншу": ["колика", "острая боль", "невралгия"],
  "шаншып": ["колика", "острая боль", "невралгия"],
  "сыздап": ["ноющая боль", "хроническая боль", "артрит", "остеохондроз"],
  "сырқырап": ["ломота", "артрит", "суставы", "интоксикация"],
  "қақсап": ["ломота", "артралгия", "боль в суставах"],
  "ауырып": ["боль", "болевой синдром"],
  "ауырсыну": ["боль", "болевой синдром"],
  "тахикардия": ["тахикардия", "аритмия", "сердцебиение"],
  "жүрек соғысы": ["тахикардия", "аритмия", "сердцебиение"],
  "жүрегім жиі": ["тахикардия", "аритмия", "сердцебиение"],

  // 13. Obstetrics & Gynecology
  "жүкті": ["беременность", "беременных", "преэклампсия", "гестоз", "токсикоз", "hellp"],
  "жүктілік": ["беременность", "срок беременности", "шевеление плода", "hellp", "преэклампсия"],
  "босану": ["роды", "послеродовой", "схватки"],
  "етеккір": ["менструация", "менструальный цикл", "аменорея", "дисменорея"],
  "жатыр": ["матка", "миома", "эндометрит", "эндометриоз"],
  "емшек": ["молочная железа", "мастит", "лактация"],

  // 14. Pediatrics & Andrology
  "простата": ["простата", "предстательная железа", "простатит", "аденома"],
  "ұрық": ["яичко", "мошонка", "орхит", "эпидидимит"],
  "жыныс": ["половой член", "баланит", "фимоз"],
  "бала": ["дети", "детский", "педиатрия", "новорожденный", "грудной"],
  "сәби": ["младенец", "новорожденный", "грудной возраст"],
};

// ==========================================
// 3. STEP 2: NORMALIZATION & NEGATIONS
// ==========================================

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Checks whether a symptom or medical stem is explicitly negated in Kazakh or Russian.
 * Examples: "температуры нет", "лихорадки нет", "қызуым жоқ", "басым ауырмайды", "жажды нет".
 */
export function isTermNegatedInText(term: string, text: string): boolean {
  const lower = text.toLowerCase();
  const cleanTerm = term
    .trim()
    .toLowerCase()
    .replace(/^[•·*\s\t-]+/, "")
    .replace(/[()[\]]/g, " ")
    .trim();
  if (cleanTerm.length < 3) return false;

  // Fast-path: If the stem is not in the text, it cannot possibly be negated
  const stem = cleanTerm.slice(0, Math.min(cleanTerm.length, 3));
  if (!lower.includes(stem)) return false;

  const escaped = escapeRegex(cleanTerm);

  // 1. Russian negation patterns
  const ruPatterns = [
    new RegExp(`(?:нет|без|не наблюдается|отсутствует|не беспокоит|не было)\\s+(?:у меня\\s+)?${escaped}`, "iu"),
    new RegExp(`${escaped}[а-яa-z]*\\s+(?:нет|отсутствует|не наблюдается|не беспокоит|не было)`, "iu"),
    new RegExp(`не\\s+${escaped}`, "iu"),
    new RegExp(`жалоб\\s+на\\s+${escaped}\\s+нет`, "iu"),
  ];

  // 2. Kazakh negation patterns
  const kzPatterns = [
    new RegExp(`${escaped}[а-яәіңғүұқөһa-z]*\\s+(?:жоқ|байқалмайды|мазаламайды|болған жоқ|емес|байқалмады)`, "iu"),
    new RegExp(`(?:жоқ|болған жоқ)\\s*:\\s*${escaped}`, "iu"),
    new RegExp(`${escaped}[а-яәіңғүұқөһa-z]*(?:майды|мейді|пайды|пейді|байда|бейді)`, "iu"),
  ];

  return [...ruPatterns, ...kzPatterns].some((rx) => rx.test(lower));
}

/**
 * Normalizes free-form text into formal symptom IDs from the symptom dictionary.
 * Strictly separates present symptoms from negated symptoms.
 */
export function normalizeSymptoms(
  text: string,
  dictionary: SymptomDefinition[]
): {
  detectedSymptoms: string[];
  negatedSymptoms: string[];
  detectedTerms: Array<{ id: string; name: string }>;
} {
  const lower = text.toLowerCase();
  const detected = new Set<string>();
  const negated = new Set<string>();
  const detectedTerms: Array<{ id: string; name: string }> = [];

  for (const s of dictionary) {
    // 1. Check explicit negations from the dictionary
    let isNegated = false;
    for (const neg of s.negations || []) {
      if (neg && neg.length >= 3 && lower.includes(neg.toLowerCase())) {
        isNegated = true;
        break;
      }
    }

    // 2. Check linguistic negation patterns against the primary term
    if (!isNegated && isTermNegatedInText(s.term_ru, lower)) {
      isNegated = true;
    }

    if (isNegated) {
      negated.add(s.id);
      continue; // NEVER add to detected symptoms if negated!
    }

    // 3. Check positive symptom presence (Kazakh & Russian synonyms)
    let isPresent = false;
    let matchedName = s.term_ru;

    const allSynonyms = [
      ...(s.synonyms_kz || []),
      ...(s.synonyms_ru || []),
      s.term_ru,
    ];

    for (const syn of allSynonyms) {
      if (!syn || syn.length < 3) continue;
      const cleanSyn = syn.toLowerCase().replace(/^[•·*\s\t-]+/, "").trim();
      if (cleanSyn.length < 3) continue;

      if (lower.includes(cleanSyn)) {
        isPresent = true;
        matchedName = cleanSyn;
        break;
      }
    }

    // High-frequency clinical expressions stem pairing (e.g. "басым қатты ауырып тұр")
    if (!isPresent) {
      if (s.id === "headache" && /(бас|басым)[\p{L}\s]{0,25}ауыр/iu.test(lower)) {
        isPresent = true;
        matchedName = "бас ауруы";
      } else if (s.id === "polyuria" && /(дәрет|зәр)[\p{L}\s]{0,25}(жиі|көп)/iu.test(lower)) {
        isPresent = true;
        matchedName = "полиурия (жиі дәретке бару)";
      }
    }

    if (isPresent) {
      detected.add(s.id);
      detectedTerms.push({ id: s.id, name: matchedName });
    }
  }

  return {
    detectedSymptoms: Array.from(detected),
    negatedSymptoms: Array.from(negated),
    detectedTerms,
  };
}

// ==========================================
// 4. STEP 3: RED FLAGS (EMERGENCY TRIAGE)
// ==========================================

/**
 * Deterministic Emergency Red Flags Evaluator.
 * Placed BEFORE any scoring or diagnostics.
 * If severe signs are detected, immediately triggers "Call 103".
 */
export function checkRedFlags(text: string): RedFlagResult {
  const lower = text.toLowerCase();

  const redFlagDefinitions = [
    {
      type: "chest_pain_acs",
      keywords: [
        "кеуде қатты қысып", "жүрек талмасы", "давящая боль в груди", "боль за грудиной",
        "боль отдает в левую руку", "жүрек тоқтап қала жаздады", "инфаркт", "жүрек қысуы",
      ],
      patterns: [
        /(кеуде|жүрек)[\p{L}\s]{0,25}(қысып|ауырып|басып|шаншып)/iu,
        /(давящая|острая|сильная)\s+боль\s+(в\s+груди|за\s+грудиной)/iu,
        /боль\s+(в\s+груди|за\s+грудиной).*?(руку|плечо|лопатку)/iu,
      ],
      titleKz: "ОСТРЫЙ КОРОНАРНЫЙ СИНДРОМ / ЖҮРЕК ТАЛМАСЫ ҚАУПІ",
      titleRu: "ОСТРЫЙ КОРОНАРНЫЙ СИНДРОМ / ПОДОЗРЕНИЕ НА ИНФАРКТ",
      guidanceKz: "Кеуде тұсының батып, сол қолға немесе жаққа таралып ауырсынуы — жедел инфаркт белгісі болуы мүмкін. Науқасты тыныш жартылай отырғызып, таза ауа кіргізіңіз. Нитроглицерин (қан қысымы төмен болмаса ғана).",
      guidanceRu: "Давящая загрудинная боль с иррадиацией — признак острой ишемии миокарда. Покой, полусидячее положение, доступ свежего воздуха.",
    },
    {
      type: "stroke_fast",
      keywords: [
        "бет қисайып", "аяқ-қолы тартып", "істемей қалды", "сөйлей алмай", "тілі күрмеліп",
        "перекосило лицо", "онемела рука", "нарушение речи", "инсульт", "асимметрия лица",
      ],
      titleKz: "ИНСУЛЬТ БЕЛГІЛЕРІ (FAST / УДАР ТЕСТ)",
      titleRu: "ПРИЗНАКИ ОСТРОГО ИНСУЛЬТА (FAST)",
      guidanceKz: "Беттің қисаюы, қол-аяқ әлсіздігі, сөйлеудің бұзылуы — жедел инсульт көрсеткіші. Алғашқы 4.5 сағатта ауруханаға жеткізу өмірді сақтап қалады. Тамақ немесе су бермеңіз!",
      guidanceRu: "Асимметрия лица, слабость конечностей, дизартрия. Терапевтическое окно — 4.5 часа. Не поить, не кормить, зафиксировать время начала.",
    },
    {
      type: "unconsciousness",
      keywords: [
        "есінен танып", "есімнен тандым", "есімнен танып", "естен тану", "естен танды", "потеря сознания", "обморок", "кома", "құлап қалды ес-түссіз", "бессознательное",
      ],
      patterns: [
        /(ес[іе]нен|естен|есімнен)\s*тан/iu,
      ],
      titleKz: "ЕСТЕН ТАНУ / ЕС-ТҮССІЗ КҮЙ",
      titleRu: "ПОТЕРЯ СОЗНАНИЯ / КОМАТОЗНОЕ СОСТОЯНИЕ",
      guidanceKz: "Естен тану — тыныс алу жолдарының бітелуі мен ми гипоксиясына әкелуі мүмкін. Науқасты бір қырына жатқызыңыз (құсық тыныс жолына кетпеуі үшін).",
      guidanceRu: "Устойчивое боковое положение для предотвращения аспирации, контроль дыхания и пульса.",
    },
    {
      type: "massive_bleeding",
      keywords: [
        "қан кету", "қатты қан кету", "қан құсу", "рвота с кровью", "кофейная гуща", "қан тоқтамай", "массивное кровотечение", "қара нәжіс", "қан кетіп жатыр", "кровотечение",
      ],
      patterns: [
        /қан\s*кет/iu,
      ],
      titleKz: "МАССИВТІ ҚАН КЕТУ / ҚАН ҚҰСУ",
      titleRu: "МАССИВНОЕ КРОВОТЕЧЕНИЕ / ЖЕЛУДОЧНО-КИШЕЧНОЕ КРОВОТЕЧЕНИЕ",
      guidanceKz: "Қан құсу немесе ішкі қан кету дереу хирург пен гемостаз шараларын қажет етеді. Асқазанға суық қойып, тамақ пен сұйықтық ішуге тыйым салынады.",
      guidanceRu: "Холод на эпигастрий, абсолютный покой, запрет приема пищи и воды.",
    },
    {
      type: "severe_asphyxia",
      keywords: [
        "дем ала алмай қалдым", "тұншығып жатырмын", "удушье", "задыхаюсь", "синеют губы", "астматический статус", "тұншығу",
      ],
      titleKz: "АУЫР ТЫНЫС ЖЕТКІЛІКСІЗДІГІ / ТҰНШЫҒУ",
      titleRu: "ОСТРАЯ ДЫХАТЕЛЬНАЯ НЕДОСТАТОЧНОСТЬ / АСФИКСИЯ",
      guidanceKz: "Дем жетпеуі, еріннің көгеруі — өкпе мен тыныс жолдарының жедел тарылуы. Науқасты отырғызып, терезені ашып, тығыз киімдерін босатыңыз.",
      guidanceRu: "Обеспечить доступ кислорода, сидячее положение с упором руками.",
    },
    {
      type: "anaphylaxis",
      keywords: [
        "анафилаксия", "тамағым бітеліп ісініп барады", "аллергиялық шок", "отек квинке",
      ],
      titleKz: "АНАФИЛАКТИКАЛЫҚ ШОК / КВИНКЕ ІСІНУІ",
      titleRu: "АНАФИЛАКТИЧЕСКИЙ ШОК / ОТЕК КВИНКЕ",
      guidanceKz: "Тамақтың жедел ісінуі тұншығуға әкеледі. Шұғыл түрде жедел жәрдем шақырыңыз!",
      guidanceRu: "Угроза обструкции верхних дыхательных путей. Экстренный вызов СМП.",
    },
    {
      type: "suicidal_crisis",
      keywords: [
        "өзіме қол салғым келеді", "суицид", "өмір сүргім келмейді", "мысли о самоубийстве", "покончить с собой",
      ],
      titleKz: "СУИЦИДТІК ДАҒДАРЫС / ШҰҒЫЛ ПСИХОЛОГИЯЛЫҚ КӨМЕК",
      titleRu: "СУИЦИДАЛЬНЫЙ КРИЗИС / ПСИХОЛОГИЧЕСКАЯ ПОМОЩЬ",
      guidanceKz: "Өміріңіз қымбат! Шұғыл түрде ҚР бірыңғай сенім телефоны: 111 немесе 150 нөміріне тегін қоңырау шалыңыз, немесе 103 нөмірінен көмек сұраңыз.",
      guidanceRu: "Срочная помощь психологов и кризисных центров в Казахстане: тел. 111, тел. 150 или 103.",
    },
  ];

  for (const flag of redFlagDefinitions) {
    const matchesKeyword = flag.keywords.some((kw) => lower.includes(kw));
    const matchesPattern = flag.patterns ? flag.patterns.some((rx) => rx.test(lower)) : false;
    if (matchesKeyword || matchesPattern) {
      return {
        hasRedFlag: true,
        type: flag.type,
        titleKz: flag.titleKz,
        titleRu: flag.titleRu,
        guidanceKz: flag.guidanceKz,
        guidanceRu: flag.guidanceRu,
        actionRequired: "103_EMERGENCY_CALL",
      };
    }
  }

  return {
    hasRedFlag: false,
    actionRequired: "CONTINUE_TRIAGE",
  };
}

// ==========================================
// 5. STEP 4: PATIENT PROFILE
// ==========================================

export function detectGender(
  text: string,
  history: { role: string; content: string }[] = []
): "male" | "female" | "unknown" {
  const combined = [
    ...history.map((h) => h.content.toLowerCase()),
    text.toLowerCase(),
  ].join(" ");

  const maleTerms = [
    "еркек", "ер адам", "ер кісі", "жігіт", "ата", "әке",
    "мужчин", "парен", "мальчик", "мужск", "папа", "брат", "дедушк",
    "male", "man", "boy"
  ];

  const femaleTerms = [
    "әйел", "қыз", "келіншек", "ана", "жүкті", "босан", "етеккір",
    "женщин", "девушк", "девочк", "беременн", "женск", "мама", "сестр", "бабушк",
    "female", "woman", "girl", "pregnant"
  ];

  const matchTerm = (terms: string[]) =>
    terms.some((term) => {
      const regex = new RegExp(`(?:^|[^\\p{L}\\p{N}])${term}[\\p{L}]*`, "iu");
      return regex.test(combined);
    });

  const isMale = matchTerm(maleTerms);
  const isFemale = matchTerm(femaleTerms);

  if (isMale && !isFemale) return "male";
  if (isFemale && !isMale) return "female";
  return "unknown";
}

export function detectAge(
  text: string,
  history: { role: string; content: string }[] = []
): "child" | "adult" | "unknown" {
  const combined = [
    ...history.map((h) => h.content.toLowerCase()),
    text.toLowerCase(),
  ].join(" ");

  const childTerms = [
    "бала", "балам", "сәби", "нәресте", "бөбек", "балалар", "ребенок", "дети", "малыш", "младенец", "новорожденный", "грудничок"
  ];

  const adultTerms = ["ересек", "үлкен кісі", "взрослый"];

  const matchTerm = (terms: string[]) =>
    terms.some((term) => {
      const regex = new RegExp(`(?:^|[^\\p{L}\\p{N}])${term}(?:$|[^\\p{L}\\p{N}])`, "iu");
      return regex.test(combined);
    });

  if (/(\d+)\s*(айлық|ай|мес)/i.test(combined)) {
    return "child";
  }

  const ageMatch = combined.match(/(\d+)\s*(жаста|жастамын|жасар|лет|года)/i);
  if (ageMatch) {
    const ageVal = parseInt(ageMatch[1], 10);
    if (!isNaN(ageVal)) {
      return ageVal < 18 ? "child" : "adult";
    }
  }

  const isChild = matchTerm(childTerms);
  const isAdult = matchTerm(adultTerms);

  if (isChild && !isAdult) return "child";
  if (isAdult && !isChild) return "adult";
  return "unknown";
}

export function detectPregnancy(
  text: string,
  history: { role: string; content: string }[] = []
): { isPregnant: boolean; weeks?: number } {
  const combined = [
    ...history.map((h) => h.content.toLowerCase()),
    text.toLowerCase(),
  ].join(" ");

  const isPregnant = /(жүкті|жүктілік|беременн|беременность|срок беременности|триместр)/i.test(combined);
  const weeksMatch = combined.match(/(\d+)\s*(?:-|–)?\s*(?:апта|нед)/i);
  const weeks = weeksMatch ? parseInt(weeksMatch[1], 10) : undefined;

  return { isPregnant, weeks };
}

export function extractPatientProfile(
  text: string,
  history: { role: string; content: string }[] = []
): PatientProfile {
  const combined = [
    ...history.map((h) => h.content.toLowerCase()),
    text.toLowerCase(),
  ].join(" ");

  const gender = detectGender(text, history);
  const ageCategory = detectAge(text, history);

  let numericAge: number | null = null;
  const ageMatch = combined.match(/(\d+)\s*(жаста|жастамын|жасар|лет|года)/i);
  if (ageMatch) {
    numericAge = parseInt(ageMatch[1], 10);
  }

  const { isPregnant, weeks } = detectPregnancy(text, history);

  // Allergies
  const allergies: string[] = [];
  const allergyTerms = ["пенициллин", "аспирин", "антибиотик", "цефтриаксон", "новокаин", "лидокаин"];
  for (const term of allergyTerms) {
    if (combined.includes(term) && /(аллергия|төзбеушілік|непереносимость)/i.test(combined)) {
      allergies.push(term);
    }
  }

  // Chronic conditions
  const chronicDiseases: string[] = [];
  const chronicList = [
    { key: "диабет", label: "Сахарный диабет / Қант диабеті" },
    { key: "гипертония", label: "Артериальная гипертензия / Қан қысымы" },
    { key: "астма", label: "Бронхиальная астма / Демікпе" },
  ];
  for (const c of chronicList) {
    if (combined.includes(c.key)) {
      chronicDiseases.push(c.label);
    }
  }

  return {
    gender,
    age: numericAge,
    ageCategory,
    isPregnant,
    pregnancyWeeks: weeks,
    allergies,
    chronicDiseases,
    currentMedications: [],
  };
}

// ==========================================
// 6. STEPS 5 & 6: SCORING & THRESHOLD
// ==========================================

const STOP_WORDS = new Set([
  "бар", "жоқ", "мен", "сен", "біз", "бір", "үшін", "деп", "менің", "оның", "осы", "бұл",
  "сияқты", "туралы", "болды", "тұр", "жатыр", "келеді", "етті", "адам", "адаммын", "кісі",
  "күн", "ай", "жыл", "етеді", "бармын", "жаста", "жастамын", "лет", "года", "для", "или",
  "как", "был", "была", "были", "есть", "нет", "при", "это", "этот", "эта", "эти", "все",
  "всех", "мне", "меня", "уже", "очень", "сильно", "после", "через", "қан", "көп"
]);

export function expandQueryTokens(query: string): string[] {
  const lower = query.toLowerCase();
  const tokens = new Set<string>();

  const words = lower
    .replace(/[^a-zA-Zа-яА-ЯёЁәіңғүұқөһ0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !STOP_WORDS.has(w));
  words.forEach((w) => tokens.add(w));

  // Sort keys by length descending so longer phrases match first
  const keysSorted = Object.keys(SYMPTOM_MAP).sort((a, b) => b.length - a.length);

  for (const key of keysSorted) {
    if (lower.includes(key)) {
      // Disambiguate composite phrases from misleading standalone substrings
      if (key.startsWith("қан") && (lower.includes("қан қысым") || lower.includes("қысым"))) continue;
      if (key.startsWith("жүрек") && (lower.includes("айн") || lower.includes("айнып") || lower.includes("құсу"))) continue;
      if (key.startsWith("бас") && (lower.includes("бас айн") || lower.includes("айнал"))) continue;

      const synonyms = SYMPTOM_MAP[key] || [];
      synonyms.forEach((syn) => {
        tokens.add(syn.toLowerCase());
        syn.split(/\s+/).forEach((w) => {
          const cleanW = w.toLowerCase();
          if (cleanW.length >= 3 && !STOP_WORDS.has(cleanW)) {
            tokens.add(cleanW);
          }
        });
      });
    }
  }

  return Array.from(tokens);
}

let cachedMapByPid: Map<string, DiseaseSymptomMap> | null = null;
function getMapByPid(maps: DiseaseSymptomMap[]): Map<string, DiseaseSymptomMap> {
  if (cachedMapByPid) return cachedMapByPid;
  cachedMapByPid = new Map<string, DiseaseSymptomMap>();
  for (const m of maps) {
    cachedMapByPid.set(m.protocol_id, m);
    cachedMapByPid.set(m.diagnosis.toLowerCase().trim(), m);
  }
  return cachedMapByPid;
}

/**
 * Searches and scores Kazakhstan clinical protocols.
 * Enforces strict gender and age filtering!
 */
export async function searchKZProtocols(
  query: string,
  options: {
    gender?: "male" | "female" | "unknown";
    age?: "child" | "adult" | "unknown";
    limit?: number;
  } = {}
): Promise<ProtocolSearchResult[]> {
  const queryLower = query.toLowerCase();
  const [protocols, maps, dictionary] = await Promise.all([
    getKZProtocols(),
    getSymptomMaps(),
    getSymptomDictionary(),
  ]);

  const userGender = options.gender || "unknown";
  const userAge = options.age || "unknown";
  const limit = options.limit || 5;

  const { detectedSymptoms, negatedSymptoms } = normalizeSymptoms(query, dictionary);
  const detectedSet = new Set(detectedSymptoms);
  const negatedSet = new Set(negatedSymptoms);
  const tokens = expandQueryTokens(query);

  const mapByPid = getMapByPid(maps);

  const results: ProtocolSearchResult[] = [];

  for (const protocol of protocols) {
    // 0. Deprioritize terminal palliative care protocols unless explicitly requested
    if (
      protocol.name.includes("Паллиативная помощь") &&
      !queryLower.includes("паллиатив") &&
      !queryLower.includes("инкурабель") &&
      !queryLower.includes("онкология")
    ) {
      continue;
    }

    // 0.1 Strict Pregnancy Exclusion when user is NOT pregnant
    const isPregnantMentioned = /(жүкті|жүктілік|беременн|32 апта|триместр)/i.test(queryLower);
    const isPregnancyProtocol =
      /(беременност|беременных|родов|роды|послеродов|HELLP|преэклампси|эклампси|гестоз)/i.test(
        protocol.name
      ) || protocol.name.includes("Рвота беременных");

    if (isPregnancyProtocol && !isPregnantMentioned) {
      continue;
    }

    // 1. Strict Gender Filter
    if (userGender === "male" && protocol.gender === "female") continue;
    if (userGender === "female" && protocol.gender === "male") continue;

    // 2. Strict Age Filter
    const isPediatricTitle = /(у детей|педиатрия|у новорожденных|у подростков|детск)/i.test(protocol.name);
    const isAdultTitle = /(у взрослых|взрослых)/i.test(protocol.name);

    if (userAge === "adult" && (protocol.age === "child" || isPediatricTitle)) continue;
    if (userAge === "child" && (protocol.age === "adult" || isAdultTitle)) continue;

    let score = 0;
    const matchedKeywords: string[] = [];
    let symptomMatches = 0;

    const sMap = mapByPid.get(protocol.protocol_id) || mapByPid.get(protocol.name.toLowerCase().trim());
    if (sMap && sMap.symptoms) {
      for (const sw of sMap.symptoms) {
        if (detectedSet.has(sw.id)) {
          score += (sw.weight || 1) * 3;
          symptomMatches++;
          matchedKeywords.push(sw.id);
        } else if (negatedSet.has(sw.id)) {
          // Negative weight penalty when key symptom is explicitly absent!
          score -= (sw.weight || 1) * 2;
        }
      }
    }

    // Keyword & field matching
    const nameLower = protocol.name.toLowerCase();
    const complaintsLower = protocol.complaints.toLowerCase();
    const descLower = protocol.description.toLowerCase();
    const emergLower = protocol.emergency.toLowerCase();

    for (const token of tokens) {
      if (token.length < 3) continue;
      let tokenMatched = false;

      // Prevent false positive substring match of "боль" in "больным" / "больница"
      if (token === "боль") {
        const isTruePain = /(?:^|[\s,.;:!?()«»"'-])боль(?:[\s,.;:!?()«»"'-]|$)/i;
        if (isTruePain.test(nameLower)) {
          score += 25;
          tokenMatched = true;
        }
        if (isTruePain.test(complaintsLower)) {
          score += 10;
          tokenMatched = true;
        }
        if (tokenMatched && !matchedKeywords.includes(token)) matchedKeywords.push(token);
        continue;
      }

      if (token.includes(" ")) {
        if (nameLower.includes(token)) {
          score += 35; // Decisive boost for multi-word title match
          tokenMatched = true;
        }
        if (complaintsLower.includes(token)) {
          score += 15;
          tokenMatched = true;
        }
      } else {
        const wordRegex = new RegExp(`(?:^|[\\s,.;:!?()«»"'-])${token}`, "i");
        if (wordRegex.test(nameLower)) {
          score += 20;
          tokenMatched = true;
        }
        if (wordRegex.test(complaintsLower)) {
          score += 8;
          tokenMatched = true;
        }
        if (wordRegex.test(descLower)) {
          score += 3;
          tokenMatched = true;
        }
        if (wordRegex.test(emergLower)) {
          score += 4;
          tokenMatched = true;
        }
      }

      if (tokenMatched && !matchedKeywords.includes(token)) {
        matchedKeywords.push(token);
      }
    }

    // Specific disease boost
    if (nameLower.includes("диабет") && (queryLower.includes("диабет") || queryLower.includes("қант"))) {
      score += 45;
    }
    if (
      nameLower.includes("мигрень") &&
      (queryLower.includes("мигрен") || queryLower.includes("пульсир") || queryLower.includes("жарық") || queryLower.includes("солқылд") || queryLower.includes("басым"))
    ) {
      score += 50;
    }
    if (
      (nameLower.includes("гипертензия") || nameLower.includes("гипертония")) &&
      (queryLower.includes("қысым") || queryLower.includes("давлен") || queryLower.includes("гипертенз") || /\b1[4-9]\d\/[89]\d\b/.test(queryLower))
    ) {
      score += 50;
    }
    if (
      (nameLower.includes("гастрит") || nameLower.includes("язвенная болезнь")) &&
      (queryLower.includes("асқазан") || queryLower.includes("қыжыл") || queryLower.includes("гастрит") || queryLower.includes("желудок"))
    ) {
      score += 50;
    }
    if (
      (nameLower.includes("кариес") || nameLower.includes("пульпит")) &&
      (queryLower.includes("тіс") || queryLower.includes("зуб"))
    ) {
      score += 50;
    }
    if (
      (nameLower.includes("бронхит") || nameLower.includes("пневмония")) &&
      (queryLower.includes("жөтел") || queryLower.includes("қақырық") || queryLower.includes("бронхит"))
    ) {
      score += 50;
    }

    // Pregnancy context boost for pregnancy-specific emergencies
    if (isPregnantMentioned) {
      const isLatePregnancy = /(3[0-9]|2[8-9])\s*апта/i.test(queryLower);
      if (protocol.name.includes("HELLP") && isLatePregnancy) {
        score += 35; // Decisive boost for 3rd trimester HELLP syndrome
      } else if (protocol.name.includes("Рвота беременных") && isLatePregnancy) {
        score -= 20; // Morning sickness occurs in 1st trimester, not 32nd week!
      }
    }

    if (userAge === "unknown" && (isPediatricTitle || protocol.age === "child")) {
      score -= 20; // Deprioritize pediatric protocols unless child is explicitly mentioned
    }

    if (score > 6) {
      results.push({
        protocol,
        score,
        matchedKeywords,
        symptomMatches,
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

// ==========================================
// 7. STEP 8: SAFETY CHECK MODULE
// ==========================================

export function runSafetyCheck(
  protocol: KZProtocol,
  profile: PatientProfile
): SafetyCheckResult {
  const warningsKz: string[] = [];
  const warningsRu: string[] = [];

  if (profile.isPregnant) {
    warningsKz.push(
      "⚠️ Жүктілік кезіндегі қауіпсіздік: Препараттар тек акушер-гинеколог бақылауымен тағайындалады. НПВС және тератогенді дәрілерге қатаң тыйым салынады."
    );
    warningsRu.push(
      "⚠️ Безопасность при беременности: Препараты назначаются строго под контролем акушера-гинеколога. НПВП и потенциально тератогенные средства противопоказаны."
    );
  }

  if (profile.ageCategory === "child") {
    warningsKz.push(
      "⚠️ Балалар қауіпсіздігі: Балаларға ересектердің дозасын немесе аспирин препараттарын беруге болмайды (Рей синдромы қаупі). Доза салмаққа (мг/кг) сай есептеледі."
    );
    warningsRu.push(
      "⚠️ Безопасность детей: Детям запрещен аспирин (риск синдрома Рея) и взрослые дозировки. Доза рассчитывается по массе тела педиатром."
    );
  }

  if (profile.allergies.length > 0) {
    warningsKz.push(
      `⚠️ Аллергиялық қауіп: Сіз көрсеткен аллергия (${profile.allergies.join(", ")}) ескеріліп, дәрі-дәрмектерді дәрігер жеке таңдауы тиіс.`
    );
    warningsRu.push(
      `⚠️ Аллергоанамнез: Указанные аллергии (${profile.allergies.join(", ")}) требуют исключения перекрестных реакций.`
    );
  }

  const prescriptionNotice =
    "Рецептуралық препараттар тек дәрігердің очная консультациясынан кейін тағайындалады. Өз бетінше емделуге қатаң тыйым салынады.";

  return {
    isSafe: warningsKz.length === 0,
    warningsKz,
    warningsRu,
    prescriptionNotice,
  };
}

/**
 * ЭТАП 3: Проверка цифр (Дозы совпали с текстом?)
 * Deterministically checks that any numbers and dosages cited
 * match the official protocol text, preventing medical dosage hallucinations.
 */
export function verifyDosageNumbers(
  protocolText: string,
  proposedText?: string
): DosageVerificationResult {
  const textToVerify = proposedText || protocolText;
  const dosageRegex =
    /(?:^|[^\p{L}\p{N}])(\d+(?:[.,]\d+)?\s*(?:мг|г|мл|мкг|мг\/кг|ед|МЕ|табл|капсул|рет|раза|дней|күн|mg|g|ml|mcg))(?=[^\p{L}\p{N}]|$)/giu;
  const matches = Array.from(textToVerify.matchAll(dosageRegex));
  const dosages = matches.map((m) => m[1].trim());

  let isVerbatim = true;
  for (const dose of dosages) {
    if (!protocolText.toLowerCase().includes(dose.toLowerCase())) {
      isVerbatim = false;
      break;
    }
  }

  const safetyNotice =
    isVerbatim && dosages.length > 0
      ? "✅ Дозалар верификацияланды (Проверка цифр): Мөлшерлер ҚР Клиникалық хаттамасының мәтінімен толық сәйкеседі."
      : "💊 Дозалар қауіпсіздігі (Проверка цифр): Дәрі-дәрмектердің нақты дозасы мен қабылдау сызбасы пациенттің жасы, салмағы мен бауыр/бүйрек функциясына байланысты тек емдеуші дәрігердің очная рецептімен тағайындалады. Хаттамадан тыс дозаларды қабылдауға тыйым салынады.";

  return {
    hasNumbersInAdvice: dosages.length > 0,
    isVerbatimWithProtocol: isVerbatim,
    extractedDosages: dosages,
    safetyNotice,
  };
}

// ==========================================
// 8. AUDIT LOGGING TELEMETRY
// ==========================================

const auditLogBuffer: ConsultationAuditRecord[] = [];

export function logConsultationAudit(record: ConsultationAuditRecord): void {
  auditLogBuffer.push(record);
  if (auditLogBuffer.length > 500) {
    auditLogBuffer.shift();
  }
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(
        "kz_protocol_audit_last",
        JSON.stringify(record)
      );
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

export function getConsultationAuditLogs(): ConsultationAuditRecord[] {
  return [...auditLogBuffer];
}

export function clearConsultationAuditLogs(): void {
  auditLogBuffer.length = 0;
}

// ==========================================
// 9. COMPLETE 9-STEP CLINICAL CONSULTATION PIPELINE
// ==========================================

export async function analyzeSymptomConsultation(
  currentMessage: string,
  history: { role: string; content: string }[] = []
): Promise<SymptomAnalysisResult> {
  const [dictionary, maps] = await Promise.all([
    getSymptomDictionary(),
    getSymptomMaps(),
  ]);

  const allUserTexts = [
    ...history.filter((h) => h.role === "user").map((h) => h.content),
    currentMessage,
  ].join(" ");

  // STEP 1 & 2: Normalization & Negations
  const { detectedSymptoms, negatedSymptoms, detectedTerms } = normalizeSymptoms(
    allUserTexts,
    dictionary
  );

  // STEP 3: Red Flags (Emergency Triage before any diagnostics)
  const redFlag = checkRedFlags(allUserTexts);
  if (redFlag.hasRedFlag) {
    const formattedResponse = `🚨 **ШҰҒЫЛ ҚАУІП БЕЛГІСІ: СРОЧНО К ВРАЧУ (СКОРАЯ 103 / 112) - ${redFlag.titleKz || "103"}**

---
⚠️ **ҚАУІП АНЫҚТАЛДЫ:** Сіз сипаттаған симптомдар шұғыл медициналық араласуды қажет ететін қауіпті жағдайға сәйкес келеді!

📞 **ДЕРЕУ ЖАСАЛАТЫН ӘРЕКЕТ:**
Дереу **103 (жедел жәрдем / скорая помощь)** немесе **112** нөміріне қоңырау шалыңыз, немесе жақын маңдағы шұғыл қабылдау бөліміне жеткізілуіңіз қажет!

🚑 **Алғашқы көмек шаралары:**
${redFlag.guidanceKz || redFlag.guidanceRu}

---
⚠️ **Ескерту:** Бұл жағдайда сұрақ-жауапты немесе онлайн кеңесті күтпеңіз, секундтар шешуші рөл атқарады! Жедел жәрдем шақырыңыз!`;

    const emergencyResult: SymptomAnalysisResult = {
      stage: "emergency",
      detectedSymptoms,
      negatedSymptoms,
      detectedSymptomDetails: detectedTerms,
      isEmergency: true,
      redFlag,
      patientProfile: extractPatientProfile(currentMessage, history),
      candidateProtocols: [],
      isAmbiguous: false,
      needsClarification: false,
      safetyCheck: { isSafe: false, warningsKz: [], warningsRu: [], prescriptionNotice: "" },
      formattedResponse,
      detectedGender: detectGender(currentMessage, history),
      detectedAge: detectAge(currentMessage, history),
    };

    logConsultationAudit({
      id: Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
      stage: "emergency",
      input: currentMessage,
      detectedSymptoms,
      negatedSymptoms,
      profile: emergencyResult.patientProfile,
      isEmergency: true,
      redFlagType: redFlag.type,
      candidateProtocols: [],
      safetyWarnings: ["EMERGENCY_TRIGGERED"],
    });

    return emergencyResult;
  }

  // STEP 4: Patient Profile Extraction
  const patientProfile = extractPatientProfile(currentMessage, history);

  // STEP 5: Multi-disease Scoring
  const searchResults = await searchKZProtocols(allUserTexts, {
    gender: patientProfile.gender,
    age: patientProfile.ageCategory,
    limit: 5,
  });

  const candidateProtocols = searchResults.map((r) => r.protocol);

  // STEP 6: Threshold & Differential Disambiguation (Порог уверенности)
  const wordCount = currentMessage.trim().split(/\s+/).length;
  const hasMultipleDetails =
    /(\d+\s*(күн|апта|сағат|жаста|температура)|құсу|қызу|шаншу|сыздап|оң жақ|сол жақ|басталды|етеккір|жүкті)/i.test(
      allUserTexts
    );

  const hasGenderAmbiguity =
    patientProfile.gender === "unknown" &&
    candidateProtocols.some((p) => p.gender !== "both");

  const topResult = searchResults[0];
  const topMap = topResult
    ? maps.find(
        (m) =>
          m.protocol_id === topResult.protocol.protocol_id ||
          m.diagnosis.toLowerCase().trim() === topResult.protocol.name.toLowerCase().trim()
      )
    : null;

  const threshold = topMap?.threshold || 8;
  const topScore = topResult?.score || 0;

  // Determine if threshold is met or clarification is needed
  const isDecisiveMargin =
    searchResults.length <= 1 ||
    (topScore >= threshold && (topScore - searchResults[1].score) >= 5);

  const isScoreSufficient = topScore >= threshold && isDecisiveMargin;

  const needsClarification =
    candidateProtocols.length > 1 &&
    (!hasMultipleDetails || wordCount < 5 || hasGenderAmbiguity || !isScoreSufficient);

  // Detect prior rounds of clarification to know if questions have ended
  const priorClarificationCount = history.filter(
    (h) =>
      h.role === "assistant" &&
      (h.content.includes("нақтылау сұрақтары") ||
        h.content.includes("ещё вопрос") ||
        h.content.includes("нақты қай протокол") ||
        h.content.includes("жауап беруіңізді сұраймын") ||
        h.content.includes("УТОЧНЕНИЕ ДИАГНОЗА"))
  ).length;

  // BRANCH: Below threshold
  if (needsClarification && candidateProtocols.length > 0) {
    // If questions were already asked and answered, questions are finished -> «Нужен осмотр (Вопросы кончились)»
    if (priorClarificationCount >= 1) {
      const candidateSummary = candidateProtocols
        .slice(0, 3)
        .map(
          (p, i) =>
            `${i + 1}. **«${p.name}»** (МКБ-10: ${p.icd10.split(",")[0] || "Көрсетілмеген"}) — бейіні: ${p.specialties}`
        )
        .join("\n");

      const allTests = Array.from(
        new Set(
          candidateProtocols
            .slice(0, 3)
            .flatMap((p) => p.confirm_tests || [])
            .map((t) => t.replace(/^[\t•·*\s-]+/, "").trim())
            .filter(Boolean)
        )
      ).slice(0, 5);

      const testListFormatted =
        allTests.length > 0
          ? allTests.map((t) => `- ${t}`).join("\n")
          : "- Жалпы қан талдауы (ОАК), биохимиялық зерттеу, УДЗ (көрсеткіштер бойынша)";

      const formattedResponse = `📋 **ДӘРІГЕР ҚАРАУЫ ҚАЖЕТ / НУЖЕН ОСМОТР (Вопросы кончились)**

---
🔍 **ЖАҒДАЙДЫ БАҒАЛАУ (Порог жеткіліксіз):**
Нақтылау сұрақтарынан кейін де симптомдар бірнеше хаттамаға сәйкес келіп тұр және нақты бір диагнозды сенімді таңдау үшін сенімділік шегі жеткіліксіз (порог набран емес). 
ҚР Денсаулық сақтау министрлігінің қауіпсіздік талаптары бойынша, жасанды интеллект бұл кезеңде өз бетінше диагноз қоймайды. **Міндетті түрде дәрігердің көзбе-көз қарап тексеруі (очный осмотр, пальпация) қажет!**

🔬 **Ықтимал бағыттар (Дифференциалды диагноз):**
${candidateSummary}

🧪 **Тапсыру ұсынылатын талдаулар (Диагностикалық минимум):**
${testListFormatted}

👨‍⚕️ **Қай маманға жүгіну қажет:**
Учаскелік терапевтке (немесе педиатрға / бейінді дәрігерге) қаралып, физикалды тексеруден өтіп, талдауларға жолдама алыңыз.

---
🚨 **Қауіпсіздік ескертуі:** Егер жағдайыңыз кенеттен нашарласа (қатты өткір ауырсыну, 38.5°C-тан жоғары қызу, тоқтаусыз құсу, қан кету, естен тану) — нақтылауды күтпей, дереу **103 (жедел жәрдем / скорая 103 / 112)** шақырыңыз!`;

      const examResult: SymptomAnalysisResult = {
        stage: "exam_needed",
        detectedSymptoms,
        negatedSymptoms,
        detectedSymptomDetails: detectedTerms,
        isEmergency: false,
        patientProfile,
        candidateProtocols,
        candidateScores: searchResults.map((r) => ({
          protocol: r.protocol,
          score: r.score,
          threshold,
        })),
        isAmbiguous: true,
        needsClarification: false,
        isExamNeeded: true,
        differentialDiagnosis: candidateProtocols.slice(0, 3).map((p) => p.name),
        safetyCheck: { isSafe: true, warningsKz: [], warningsRu: [], prescriptionNotice: "" },
        formattedResponse,
        detectedGender: patientProfile.gender,
        detectedAge: patientProfile.ageCategory,
      };

      logConsultationAudit({
        id: Math.random().toString(36).slice(2),
        timestamp: new Date().toISOString(),
        stage: "exam_needed",
        input: currentMessage,
        detectedSymptoms,
        negatedSymptoms,
        profile: patientProfile,
        isEmergency: false,
        candidateProtocols: candidateProtocols.map((p) => p.name),
        score: topScore,
        threshold,
        safetyWarnings: ["EXAM_NEEDED_QUESTIONS_FINISHED"],
      });

      return examResult;
    }

    // Otherwise questions remain -> «нет: ещё вопрос»
    const questions: string[] = [
      "**Науқастың жынысы мен жасы қандай?** (Еркек пе, әйел ме? Жүктілік бар ма және неше апта? ҚР хаттамалары бойынша бұл диагнозды нақты ажырату үшін шешуші мәнге ие).",
      "**Ауырсынудың нақты орналасуы мен сипаты қандай?** (Дәл қай жері ауырып тұр: оң/сол жақ қабырға асты, төменгі бөлік, самай, желке? Ауырсыну өткір ме, әлде сыздап тұр ма?)",
      "**Бұл белгілер қашан басталды және қанша уақыттан бері мазалап келеді?** (Кенеттен өткір басталды ма, әлде бірнеше күннен бері күшейіп келе ме?)",
      "**Қосымша қандай симптомдар бар?** (Дене қызуы, жүрек айну/құсу, қан қысымының өзгеруі, іштің кебуі немесе диарея, бөртпе, ентігу бар ма?)",
    ];

    const protocolNames = candidateProtocols
      .slice(0, 3)
      .map((p) => `«${p.name}» (${p.icd10.split(",")[0] || ""})`)
      .join(", ");

    const formattedResponse = `❓ **НАҚТЫЛАУ СҰРАҚТАРЫ / УТОЧНЕНИЕ ДИАГНОЗА (нет: ещё вопрос)**

ҚР Денсаулық сақтау министрлігінің Клиникалық протоколдары бойынша сіздің алғашқы шағымыңызға ұқсас бірнеше хаттама бар (${protocolNames}). 

Медициналық хаттамалардағы **«Жалобы и анамнез»** (шағымдар мен белгілер) тармақтары бір-біріне ұқсас болуы мүмкін болғандықтан, **нақты қай протоколға дәл сәйкес келетінін сенімді түрде анықтау үшін** төмендегі нақтылау сұрақтарына жауап беруіңізді сұраймын:

1. ${questions[0]}
2. ${questions[1]}
3. ${questions[2]}
4. ${questions[3]}

> ⚠️ **Қауіпсіздік ескертуі:** Егер сізде ауырсыну шыдатпайтын өте өткір болса, есіңіз бұлдырап, қан кету немесе тыныс алу қиындаса — нақтылауды күтпей, дереу **103 (жедел жәрдем / скорая 103 / 112)** шақырыңыз!`;

    const clarificationResult: SymptomAnalysisResult = {
      stage: "clarification",
      detectedSymptoms,
      negatedSymptoms,
      detectedSymptomDetails: detectedTerms,
      isEmergency: false,
      patientProfile,
      candidateProtocols,
      candidateScores: searchResults.map((r) => ({
        protocol: r.protocol,
        score: r.score,
        threshold,
      })),
      isAmbiguous: true,
      needsClarification: true,
      isExamNeeded: false,
      clarificationQuestions: questions,
      differentialDiagnosis: candidateProtocols.slice(0, 3).map((p) => p.name),
      safetyCheck: { isSafe: true, warningsKz: [], warningsRu: [], prescriptionNotice: "" },
      formattedResponse,
      detectedGender: patientProfile.gender,
      detectedAge: patientProfile.ageCategory,
    };

    logConsultationAudit({
      id: Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
      stage: "clarification",
      input: currentMessage,
      detectedSymptoms,
      negatedSymptoms,
      profile: patientProfile,
      isEmergency: false,
      candidateProtocols: candidateProtocols.map((p) => p.name),
      score: topScore,
      threshold,
      safetyWarnings: ["CLARIFICATION_NEEDED"],
    });

    return clarificationResult;
  }

  // STEP 7: Protocol RAG (Поиск по коду МКБ: нужный раздел)
  const primary = candidateProtocols[0] || null;

  if (!primary) {
    const formattedResponse = `ҚР Клиникалық протоколдарының ресми дерекқорынан бұл сұраныс бойынша нақты хаттама табылмады. 

Симптомдарыңызды толығырақ жазыңыз (мысалы: қай жеріңіз ауырып тұр, дене қызуыңыз бар ма, қанша уақыттан бері мазалайды). Денсаулығыңызға байланысты нақты сұрақтар бойынша учаскелік терапевтке немесе бейінді дәрігерге қаралғаныңыз абзал.`;

    return {
      stage: "exam_needed",
      detectedSymptoms,
      negatedSymptoms,
      detectedSymptomDetails: detectedTerms,
      isEmergency: false,
      patientProfile,
      candidateProtocols: [],
      isAmbiguous: false,
      needsClarification: false,
      isExamNeeded: true,
      safetyCheck: { isSafe: true, warningsKz: [], warningsRu: [], prescriptionNotice: "" },
      formattedResponse,
      detectedGender: patientProfile.gender,
      detectedAge: patientProfile.ageCategory,
    };
  }

  // STEP 8: Dosage Verification ("Проверка цифр") & Safety Verification
  const dosageVerification = verifyDosageNumbers(primary.treatment);
  const safetyCheck = runSafetyCheck(primary, patientProfile);

  // STEP 9: Structured Medical Response ("Безопасный ответ: источник и к врачу")
  const complaintsClean = primary.complaints
    ? primary.complaints.slice(0, 300)
    : "Протокол бойынша тән шағымдар мен клиникалық белгілер";

  const treatmentClean = primary.treatment
    ? primary.treatment.slice(0, 300)
    : "Дәрігерлік тексеруден кейін амбулаториялық немесе стационарлық ем тағайындалады";

  const emergencyClean = primary.emergency
    ? primary.emergency.slice(0, 300)
    : "Жағдайдың кенеттен нашарлауы, дене қызуының 39°C-тан асуы, естен тану, қан кету";

  const confirmTestsList =
    primary.confirm_tests && primary.confirm_tests.length > 0
      ? primary.confirm_tests
          .slice(0, 4)
          .map((t) => `- ${t.replace(/^[\t•·*\s-]+/, "")}`)
          .join("\n")
      : "- Жалпы қан анализі, биохимиялық талдау, УДЗ (көрсеткіштер бойынша)";

  const safetyBlock =
    safetyCheck.warningsKz.length > 0
      ? `\n### ⚠️ Қауіпсіздік және сақтық шаралары:\n${safetyCheck.warningsKz.join("\n")}\n`
      : "";

  const formattedResponse = `Сіздің симптомдарыңыз бен берген жауаптарыңыз ҚР Денсаулық сақтау министрлігінің Клиникалық протоколы бойынша: **«${primary.name}»** ауруына сәйкес келеді.

---

### 📋 1. Сәйкес келетін ҚР Клиникалық хаттамасы (Поиск по коду МКБ):
- **Атауы:** ${primary.name}
- **МКБ-10 кодтары:** ${primary.icd10}
- **Хаттама коды (ID):** ${primary.protocol_id}
- **Хаттама нұсқасы:** ${primary.version}
- **Бейіні (мамандығы):** ${primary.specialties}

### 🔍 2. Протокол бойынша симптомдардың сәйкестігі («Жалобы и анамнез»):
Бұл хаттамада көрсетілген негізгі клиникалық белгілер:
${complaintsClean}

### 🧪 3. Ұсынылатын диагностикалық зерттеулер мен талдаулар:
${confirmTestsList}

### 💊 4. Протокол бойынша алғашқы көмек және емделу жолдары:
${treatmentClean}

*${dosageVerification.safetyNotice}*
*${safetyCheck.prescriptionNotice}*
${safetyBlock}
### 🚨 5. Қай кезде шұғыл дәрігерге бару керек (Қауіп белгілері / Госпитализация):
Хаттама бойынша шұғыл ауруханаға жүгіну немесе жедел жәрдем (103) шақыру көрсеткіштері:
${emergencyClean}

### 👨‍⚕️ 6. Қай маманға қаралу қажет (Безопасный ответ: «к врачу»):
Бұл жағдайда алғашқы көмек пен нақты ем тағайындау үшін учаскелік терапевтке немесе **${primary.specialties}** дәрігеріне қаралғаныңыз жөн.

---
⚠️ **Маңызды:** Жасанды интеллект кеңесі ақпараттық мақсатта ҚР ресми хаттамасына сүйеніп ұсынылды және дәрігердің жеке қарап тексеруін алмастырмайды.

🔗 **Ресми ҚР Клиникалық протоколына сілтеме (Источник):**  
[${primary.name} — MedElement ресми хаттамасын оқу](${primary.url})`;

  const result: SymptomAnalysisResult = {
    stage: "protocol_answer",
    detectedSymptoms,
    negatedSymptoms,
    detectedSymptomDetails: detectedTerms,
    isEmergency: false,
    patientProfile,
    candidateProtocols,
    candidateScores: searchResults.map((r) => ({
      protocol: r.protocol,
      score: r.score,
      threshold,
    })),
    primaryProtocol: primary,
    isAmbiguous: false,
    needsClarification: false,
    isExamNeeded: false,
    safetyCheck,
    dosageVerification,
    formattedResponse,
    protocolUrl: primary.url,
    detectedGender: patientProfile.gender,
    detectedAge: patientProfile.ageCategory,
  };

  logConsultationAudit({
    id: Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
    stage: "protocol_answer",
    input: currentMessage,
    detectedSymptoms,
    negatedSymptoms,
    profile: patientProfile,
    isEmergency: false,
    candidateProtocols: candidateProtocols.map((p) => p.name),
    primaryProtocol: primary.name,
    score: topScore,
    threshold,
    dosageVerification,
    safetyWarnings: safetyCheck.warningsKz,
  });

  return result;
}
