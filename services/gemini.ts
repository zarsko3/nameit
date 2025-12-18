// AI features disabled - using static content instead
// To enable AI: get a Gemini API key from https://aistudio.google.com/apikey

export async function getNameInsights(nameHebrew: string, meaning: string) {
  // Return static insights based on the name's meaning
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate loading
  
  return `✨ ${nameHebrew} - שם יפהפה עם משמעות עמוקה

• המשמעות "${meaning}" מעניקה לשם תחושה של ייחודיות ואופי מיוחד

• שם זה נושא עמו מסורת עברית עשירה ומשמעות רוחנית

• בחירה מצוינת שמשלבת יופי, משמעות ומקוריות`;
}

export async function getRelatedNames(nameHebrew: string) {
  // Return empty array - feature disabled without AI
  return [];
}
