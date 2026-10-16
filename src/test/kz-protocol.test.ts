import { describe, it, expect } from "vitest";
import {
  detectGender,
  detectAge,
  searchKZProtocols,
  analyzeSymptomConsultation,
} from "../lib/kz-protocol-service";

describe("KZ Protocol Service Tests", () => {
  it("correctly detects gender from Kazakh and Russian text", () => {
    expect(detectGender("Мен ер адаммын, 30 жастамын")).toBe("male");
    expect(detectGender("Еркекпін, басым ауырып тұр")).toBe("male");
    expect(detectGender("Мужчина, 40 лет, болит спина")).toBe("male");

    expect(detectGender("Мен әйелмін, 25 жастамын")).toBe("female");
    expect(detectGender("Жүктіліктің 28-аптасы, басым ауырып тұр")).toBe("female");
    expect(detectGender("Женщина, 30 лет, беременность")).toBe("female");

    expect(detectGender("Басым ауырып жатыр")).toBe("unknown");
  });

  it("correctly detects age from text", () => {
    expect(detectAge("Баламның қызуы 38.5, 4 жаста")).toBe("child");
    expect(detectAge("Сәби 6 айлық")).toBe("child");
    expect(detectAge("Мен 35 жастамын")).toBe("adult");
    expect(detectAge("Ересек адам")).toBe("adult");
  });

  it("STRICTLY excludes female protocols when user is male", async () => {
    const results = await searchKZProtocols("бас ауруы қан қысымы жүрек айну", {
      gender: "male",
      limit: 10,
    });

    for (const r of results) {
      expect(r.protocol.gender).not.toBe("female");
    }
  }, 15000);

  it("STRICTLY excludes male protocols when user is female", async () => {
    const results = await searchKZProtocols("зәр шығарудың қиындауы қабыну", {
      gender: "female",
      limit: 10,
    });

    for (const r of results) {
      expect(r.protocol.gender).not.toBe("male");
    }
  }, 15000);

  it("triggers clarifying questions when symptom is ambiguous", async () => {
    const result = await analyzeSymptomConsultation("ішім ауырып тұр");
    expect(result.needsClarification).toBe(true);
    expect(result.clarificationQuestions?.length).toBeGreaterThan(0);
    expect(result.formattedResponse).toContain("ҚР Денсаулық сақтау министрлігінің Клиникалық протоколдары");
  });

  it("confidently selects HELLP-синдром for classic pregnancy symptoms", async () => {
    const result = await analyzeSymptomConsultation(
      "Мен әйелмін, 32 апта жүктілік, басым қатты ауырып жатыр, оң жақ қабырға астым қатты шаншып ауырады, жүрегім айнып құсып жатырмын, көзім бұлдырап тұр"
    );
    expect(result.primaryProtocol).toBeDefined();
    // Should match HELLP-синдром or a related pregnancy emergency protocol
    expect(result.formattedResponse).toContain("Клиникалық протоколы");
    expect(result.protocolUrl).toContain("https://diseases.medelement.com/");
    expect(result.formattedResponse).toContain("MedElement");
  }, 15000);
});
