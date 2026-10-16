import { describe, it, expect } from "vitest";
import {
  getKZProtocols,
  getSymptomDictionary,
  getSymptomMaps,
  normalizeSymptoms,
  checkRedFlags,
  extractPatientProfile,
  runSafetyCheck,
  analyzeSymptomConsultation,
  verifyDosageNumbers,
  getConsultationAuditLogs,
} from "../lib/kz-protocol-service";

describe("9-Step Clinical Triage & Knowledge Bases Tests", () => {
  // Knowledge bases tests
  it("successfully loads all three medical knowledge bases", async () => {
    const protocols = await getKZProtocols();
    const dictionary = await getSymptomDictionary();
    const maps = await getSymptomMaps();

    expect(protocols.length).toBe(1187);
    expect(dictionary.length).toBeGreaterThanOrEqual(4197);
    expect(maps.length).toBe(1187);

    // Verify first protocol schema
    const p = protocols[0];
    expect(p.protocol_id).toBeDefined();
    expect(p.name).toBeDefined();
    expect(p.icd10).toBeDefined();
    expect(p.confirm_tests).toBeDefined();

    // Verify dictionary entry with negations
    const polydipsia = dictionary.find((s) => s.id === "polydipsia");
    expect(polydipsia).toBeDefined();
    expect(polydipsia?.negations).toContain("не хочу пить");
    expect(polydipsia?.synonyms_kz).toContain("жиі шөлдеймін");
  }, 15000);

  // Step 2: Normalization with Negation Handling
  it("STRICTLY separates detected symptoms and negated symptoms (Negation Test)", async () => {
    const dict = await getSymptomDictionary();
    const text = "Басым қатты ауырып тұр, бірақ менде қызуым жоқ және жөтел жоқ";

    const { detectedSymptoms, negatedSymptoms } = normalizeSymptoms(text, dict);

    // Negated symptoms must be caught in negated list
    expect(negatedSymptoms).toContain("fever");
    expect(negatedSymptoms).toContain("cough");

    // Negated symptoms must NEVER be present in detected symptoms!
    expect(detectedSymptoms).not.toContain("fever");
    expect(detectedSymptoms).not.toContain("cough");

    // Positive symptom must be detected
    expect(detectedSymptoms).toContain("headache");
  });

  it("handles Russian negation 'жажды нет' without detecting polydipsia", async () => {
    const dict = await getSymptomDictionary();
    const text = "У меня слабость, но жажды нет и температуры нет";

    const { detectedSymptoms, negatedSymptoms } = normalizeSymptoms(text, dict);

    expect(negatedSymptoms).toContain("polydipsia");
    expect(negatedSymptoms).toContain("fever");
    expect(detectedSymptoms).not.toContain("polydipsia");
    expect(detectedSymptoms).not.toContain("fever");
  });

  // Step 3: Red Flags (Emergency Triage)
  it("triggers immediate Red Flag for severe chest pain (ACS/Heart Attack)", () => {
    const redFlag = checkRedFlags("Кеуде тұсым қатты қысып ауырып, сол қолыма беріп жатыр");
    expect(redFlag.hasRedFlag).toBe(true);
    expect(redFlag.type).toBe("chest_pain_acs");
    expect(redFlag.actionRequired).toBe("103_EMERGENCY_CALL");
  });

  it("triggers immediate Red Flag for stroke signs (FAST test)", () => {
    const redFlag = checkRedFlags("Науқастың беті қисайып, қолы істемей, сөйлей алмай қалды");
    expect(redFlag.hasRedFlag).toBe(true);
    expect(redFlag.type).toBe("stroke_fast");
    expect(redFlag.actionRequired).toBe("103_EMERGENCY_CALL");
  });

  it("triggers immediate Red Flag for loss of consciousness", () => {
    const redFlag = checkRedFlags("Адам есінен танып құлап қалды");
    expect(redFlag.hasRedFlag).toBe(true);
    expect(redFlag.type).toBe("unconsciousness");
  });

  it("bypasses scoring and returns emergency call when red flag is present in consultation", async () => {
    const result = await analyzeSymptomConsultation("Кеуде қатты қысып, дем ала алмай жатырмын");
    expect(result.isEmergency).toBe(true);
    expect(result.redFlag?.hasRedFlag).toBe(true);
    expect(result.formattedResponse).toContain("103");
    expect(result.formattedResponse).toContain("ШҰҒЫЛ ҚАУІП БЕЛГІСІ");
  });

  // Step 4: Patient Profile
  it("extracts comprehensive patient profile including pregnancy weeks and allergies", () => {
    const text = "Мен әйелмін, 30 жастамын, 28 апта жүктілік, пенициллинге аллергиям бар";
    const profile = extractPatientProfile(text);

    expect(profile.gender).toBe("female");
    expect(profile.age).toBe(30);
    expect(profile.ageCategory).toBe("adult");
    expect(profile.isPregnant).toBe(true);
    expect(profile.pregnancyWeeks).toBe(28);
    expect(profile.allergies).toContain("пенициллин");
  });

  // Step 8: Safety Verification
  it("generates deterministic safety warnings for pregnancy and pediatric patients", async () => {
    const protocols = await getKZProtocols();
    const sampleProtocol = protocols[0];

    const pregnantProfile = extractPatientProfile("жүктілік 32 апта");
    const safetyPregnant = runSafetyCheck(sampleProtocol, pregnantProfile);
    expect(safetyPregnant.warningsKz.some((w) => w.includes("Жүктілік"))).toBe(true);

    const childProfile = extractPatientProfile("Балам 5 жаста");
    const safetyChild = runSafetyCheck(sampleProtocol, childProfile);
    expect(safetyChild.warningsKz.some((w) => w.includes("Балалар"))).toBe(true);
  });

  // Step 9: Full 9-step pipeline output
  it("formats full medical consultation response with confirm tests and MedElement protocol link", async () => {
    const result = await analyzeSymptomConsultation(
      "Менде қант диабетінің белгілері бар сияқты: жиі шөлдеймін, көп су ішемін, жиі дәретке барамын, көзім бұлдырап тұр, 45 жастағы ер адаммын"
    );

    expect(result.isEmergency).toBe(false);
    expect(result.candidateProtocols.length).toBeGreaterThan(0);
    expect(result.formattedResponse).toContain("ҚР Денсаулық сақтау министрлігінің Клиникалық протоколы");
    expect(result.formattedResponse).toContain("диабет");
    expect(result.formattedResponse).toContain("MedElement");
    expect(result.formattedResponse).toContain("диагностикалық зерттеулер");
  });

  // Target Architecture: 4 branches verification (med_app_final_architecture.png)
  describe("Architecture Diagram 4 Branches & Dosage Verification", () => {
    it("Branch 1: returns stage 'emergency' (Срочно к врачу 103 / 112) for red flag", async () => {
      const result = await analyzeSymptomConsultation("Қатты қан кету және есімнен танып қалу");
      expect(result.stage).toBe("emergency");
      expect(result.isEmergency).toBe(true);
      expect(result.formattedResponse).toContain("СКОРАЯ 103 / 112");
    }, 15000);

    it("Branch 2: returns stage 'clarification' (нет: ещё вопрос) for first-turn ambiguous symptoms", async () => {
      const result = await analyzeSymptomConsultation("ішім ауырып тұр");
      expect(result.stage).toBe("clarification");
      expect(result.needsClarification).toBe(true);
      expect(result.isExamNeeded).toBe(false);
      expect(result.clarificationQuestions?.length).toBeGreaterThan(0);
      expect(result.formattedResponse).toContain("нет: ещё вопрос");
    }, 15000);

    it("Branch 3: returns stage 'exam_needed' (Нужен осмотр: Вопросы кончились) when clarification rounds already happened", async () => {
      // Prior history contains assistant clarification question
      const history = [
        { role: "user", content: "ішім ауырып тұр" },
        {
          role: "assistant",
          content: "нақтылау сұрақтары: нақты қай жері ауырып тұр? жасыңыз қандай?",
        },
      ];
      // User answers clarification question, but symptoms remain non-specific/below threshold
      const result = await analyzeSymptomConsultation("2 күн болды, орташа сыздап ауырады", history);
      expect(result.stage).toBe("exam_needed");
      expect(result.isExamNeeded).toBe(true);
      expect(result.needsClarification).toBe(false);
      expect(result.formattedResponse).toContain("НУЖЕН ОСМОТР (Вопросы кончились)");
      expect(result.formattedResponse).toContain("Диагностикалық минимум");
    }, 15000);

    it("Branch 4: returns stage 'protocol_answer' (порог набран -> RAG по МКБ -> Проверка цифр)", async () => {
      const result = await analyzeSymptomConsultation(
        "Менде қант диабеті: жиі шөлдеймін, көп су ішемін, жиі дәретке барамын, 45 жастағы ер адаммын"
      );
      expect(result.stage).toBe("protocol_answer");
      expect(result.primaryProtocol).toBeDefined();
      expect(result.dosageVerification).toBeDefined();
      expect(result.dosageVerification?.safetyNotice).toBeDefined();
      expect(result.formattedResponse).toContain("Поиск по коду МКБ");
      expect(result.protocolUrl).toBeDefined();

      // Verify audit record logged for expert doctor review
      const auditLogs = getConsultationAuditLogs();
      expect(auditLogs.length).toBeGreaterThan(0);
      const lastLog = auditLogs[auditLogs.length - 1];
      expect(lastLog.stage).toBe("protocol_answer");
    }, 15000);

    it("verifies dosage numbers against official protocol text (Проверка цифр)", () => {
      const protocolTreatment = "Метформин 500 мг күніне 2 рет тамақтан кейін қабылданады.";
      const validCheck = verifyDosageNumbers(protocolTreatment, "Метформин 500 мг");
      expect(validCheck.hasNumbersInAdvice).toBe(true);
      expect(validCheck.isVerbatimWithProtocol).toBe(true);
      expect(validCheck.safetyNotice).toContain("Проверка цифр");

      const invalidCheck = verifyDosageNumbers(protocolTreatment, "Метформин 2000 мг 4 рет");
      expect(invalidCheck.isVerbatimWithProtocol).toBe(false);
      expect(invalidCheck.safetyNotice).toContain("Проверка цифр");
    });
  });
});
