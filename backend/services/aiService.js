require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateKnowledgeDraft(extractedText) {
  if (!extractedText || !extractedText.trim()) {
    throw new Error("Empty input text provided.");
  }

  // Phase 9: Limit to 5000 characters to optimize cost
  const limitedText = extractedText.slice(0, 5000);

  const prompt = `You are a DHL logistics SOP assistant.

Convert the following operational content into a structured knowledge base article.

Return ONLY valid JSON with:
- title
- summary
- tags
- steps
- warnings

Content:
${limitedText}
`;

  try {
    // gemini-1.5-flash was returning 404, updated to gemini-flash-latest
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
      }
    });

    let aiDraft = result.response.text();
    
    // Phase 6: JSON Output cleaning
    if (aiDraft.startsWith('```json')) {
      aiDraft = aiDraft.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (aiDraft.startsWith('```')) {
      aiDraft = aiDraft.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }
    aiDraft = aiDraft.trim();

    // Phase 7: Error handling - Invalid JSON fallback
    let parsedDraft;
    try {
      parsedDraft = JSON.parse(aiDraft);
    } catch (err) {
      console.error("Failed to parse Gemini response as JSON:", aiDraft);
      throw new Error("Invalid response format from AI.");
    }
    
    // Format steps and warnings into a unified content string for the database
    let combinedContent = '';
    
    if (parsedDraft.steps && Array.isArray(parsedDraft.steps) && parsedDraft.steps.length > 0) {
      combinedContent += '## SOP Steps\n';
      parsedDraft.steps.forEach((step, index) => {
        combinedContent += `${index + 1}. ${step}\n`;
      });
      combinedContent += '\n';
    }

    if (parsedDraft.warnings && Array.isArray(parsedDraft.warnings) && parsedDraft.warnings.length > 0) {
      combinedContent += '## Warnings & Notes\n';
      parsedDraft.warnings.forEach(warning => {
        combinedContent += `- ⚠️ ${warning}\n`;
      });
    }

    if (!combinedContent.trim()) {
      // If AI didn't return steps/warnings, fallback to the text
      combinedContent = limitedText;
    }

    return {
      title: parsedDraft.title || 'Generated SOP',
      summary: parsedDraft.summary || 'Summary unavailable',
      content: combinedContent.trim(),
      tags: parsedDraft.tags && Array.isArray(parsedDraft.tags) ? parsedDraft.tags.join(', ') : 'sop'
    };

  } catch (error) {
    console.error("Gemini Error:", error.message);
    if (error.message.includes("API key")) {
      throw new Error("Invalid Gemini API Key configuration.");
    } else if (error.message.includes("fetch failed") || error.message.includes("timeout")) {
      throw new Error("AI service timeout or connection failed.");
    }
    throw new Error("Failed to generate AI Draft. Please try again.");
  }
}

module.exports = {
  generateKnowledgeDraft,
};
