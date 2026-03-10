import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const detectFoodFromImage = async (base64Image) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `Analyze this food image and return only JSON : 
    {
     "foods" : [
       {
        "name" :"string",
        "quantity": number,
        "unit": "string",
        "calories": number,
        "protein": number,
        "fat": number,
        "carbs": number
       }
     ],

      "totalCalories": number,
        "totalProtein": number,
        "totalFat": number,
        "totalCarbs": number,
        "needsQuantityInput": boolean,
        "uncertainItems": []
   }
   `;


   const result = await model.generateContent([
     prompt,

     {
       inlineData: {
         mimeType: "image/jpeg",
         data: base64Image,
       },
     },
   ]);


   const text = result.response.text();

    const cleaned = text.replace(/```json|```/g, "").trim();
    return JSON.parse(cleaned);


  } catch (error) {
      throw new Error(`AI detection failed: ${error.message}`);
  }
};
