import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
	baseURL: process.env.OPENAI_API_BASE || "https://api.openai.com/v1",
});

/**
 * Generate a personalized quit plan based on current and target nicotine intake.
 */
export const generateQuitPlanAdvice = async (data) => {
	const {
		currentIntake,
		targetIntake,
		timelineMonths,
		brandNicotine,
		brandName,
	} = data;

	const prompt = `
    User current monthly nicotine intake: ${currentIntake} mg
    Target monthly nicotine intake: ${targetIntake} mg
    Timeline: ${timelineMonths} months
    Current Brand: ${brandName} (${brandNicotine} mg per stick)

    Calculate the following:
    1. Weekly reduction steps to reach the target.
    2. Allowed stick count per day for the first month based on the target.
    3. A motivational message.
    4. Health impact milestones for this timeline.

    Return the response in valid JSON format with the following keys:
    {
      "daily_stick_allowance": number,
      "weekly_milestones": [
        { "week": number, "target_mg": number, "description": string }
      ],
      "health_impact": [
        { "milestone": string, "benefit": string }
      ],
      "motivational_message": string
    }
  `;

	try {
		const response = await openai.chat.completions.create({
			model: "google/gemini-2.0-flash-001", // Using a stable model from OpenRouter
			messages: [{ role: "user", content: prompt }],
			response_format: { type: "json_object" },
		});

		return JSON.parse(response.choices[0].message.content);
	} catch (error) {
		console.error("AI Service Error (generateQuitPlanAdvice):", error);
		// Fallback calculation if AI fails
		const sticks =
			Math.round((targetIntake / brandNicotine / 30) * 10) / 10;
		return {
			daily_stick_allowance: sticks,
			weekly_milestones: [],
			health_impact: [],
			motivational_message:
				"Keep going! You're making a great choice for your health.",
		};
	}
};

/**
 * Provide brand adjustment suggestions.
 */
export const getBrandSuggestions = async (currentBrand, targetIntake) => {
	const prompt = `
    Current Brand: ${currentBrand.brand_name} (${currentBrand.nicotine_per_cigarette} mg nicotine)
    Target Monthly Nicotine: ${targetIntake} mg

    Suggest 3 alternative lower-nicotine brands and simulate how many sticks per month the user can have with each to meet the target.
    
    Return the response in valid JSON format:
    {
      "suggestions": [
        { "brand_name": string, "nicotine_per_stick": number, "allowed_sticks_per_month": number, "benefit": string }
      ],
      "analysis": string
    }
  `;

	try {
		const response = await openai.chat.completions.create({
			model: "google/gemini-2.0-flash-001",
			messages: [{ role: "user", content: prompt }],
			response_format: { type: "json_object" },
		});

		return JSON.parse(response.choices[0].message.content);
	} catch (error) {
		console.error("AI Service Error (getBrandSuggestions):", error);
		return {
			suggestions: [],
			analysis: "Unable to provide suggestions at this time.",
		};
	}
};

/**
 * Provide mood or time-based interventions.
 */
export const getInterventions = async (context) => {
	const { mood, timeOfDay, cravingLevel } = context;

	const prompt = `
    Current context:
    Mood: ${mood}
    Time of Day: ${timeOfDay}
    Craving Level: ${cravingLevel}

    Provide 3 quick activities or mental tips to delay or replace nicotine intake.
    
    Return the response in valid JSON format:
    {
      "interventions": [
        { "title": string, "description": string, "type": "mental" | "physical" | "distraction" }
      ],
      "ai_insight": string
    }
  `;

	try {
		const response = await openai.chat.completions.create({
			model: "google/gemini-2.0-flash-001",
			messages: [{ role: "user", content: prompt }],
			response_format: { type: "json_object" },
		});

		return JSON.parse(response.choices[0].message.content);
	} catch (error) {
		console.error("AI Service Error (getInterventions):", error);
		return {
			interventions: [],
			ai_insight: "Take a deep breath and wait 5 minutes.",
		};
	}
};
