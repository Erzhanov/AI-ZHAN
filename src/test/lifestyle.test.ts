import { describe, expect, it } from "vitest";
import { calculateLifestylePlan, parseAllergies } from "@/lib/lifestyle";

describe("lifestyle planner", () => {
  it("calculates a safe plan with allergy and blood pressure notes", () => {
    const plan = calculateLifestylePlan({
      gender: "female",
      age: 32,
      heightCm: 168,
      weightKg: 72,
      activityLevel: "medium",
      goal: "lose_weight",
      allergies: ["жаңғақ"],
      bloodPressure: "high",
    });

    expect(plan.calories).toBeGreaterThanOrEqual(1250);
    expect(plan.proteinG).toBeGreaterThan(100);
    expect(plan.restDays).toContain("Жексенбі");
    expect(plan.safetyNotes.join(" ")).toContain("жаңғақ");
    expect(plan.workouts.some((workout) => workout.intensity === "light")).toBe(true);
  });

  it("parses comma-separated allergies", () => {
    expect(parseAllergies("сүт, жаңғақ,  бал ")).toEqual(["сүт", "жаңғақ", "бал"]);
  });
});
