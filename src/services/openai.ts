import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

interface AssessmentData {
  parentData: {
    grade: string;
    age: string;
    dyslexiaHistory: string;
    strugglingLevel: string;
  };
  testPath: string;
  responses: Record<string, number>;
  overallResult: string;
}

interface QuestionAnalysis {
  letterSounds?: number;
  soundSegmentation?: number;
  soundDeletion?: number;
  wordReading?: number;
  nonsenseWords1?: number;
  nonsenseWords2?: number;
}

export async function generatePersonalizedRecommendation(assessmentData: AssessmentData): Promise<string> {
  const { parentData, testPath, responses, overallResult } = assessmentData;

  // Analyze question patterns
  const analysis = analyzeQuestionPatterns(responses, testPath);

  // Build context for the AI
  const contextPrompt = buildContextPrompt(parentData, testPath, analysis, overallResult);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert Reading Specialist with extensive training in the Orton-Gillingham method and Structured Literacy principles. You provide empathetic yet professional guidance to parents about their children's reading development. Your responses should subtly integrate research from the Science of Reading while maintaining an accessible tone. Always emphasize the importance of early intervention when struggles are identified.`
        },
        {
          role: "user",
          content: contextPrompt
        }
      ],
      max_tokens: 200,
      temperature: 0.7
    });

    return completion.choices[0].message.content || getFallbackMessage(overallResult);
  } catch (error) {
    console.error('OpenAI API error:', error);
    return getFallbackMessage(overallResult);
  }
}

function analyzeQuestionPatterns(responses: Record<string, number>, testPath: string): QuestionAnalysis {
  const analysis: QuestionAnalysis = {};

  if (testPath === 'kindergarten') {
    analysis.letterSounds = responses['1'] || 0;
    analysis.soundSegmentation = responses['2'] || 0;
    analysis.soundDeletion = responses['3'] || 0;
  } else {
    analysis.wordReading = responses['1'] || 0;
    analysis.soundSegmentation = responses['2'] || 0;
    analysis.soundDeletion = responses['3'] || 0;
    analysis.nonsenseWords1 = responses['4'] || 0;
    analysis.nonsenseWords2 = responses['5'] || 0;
  }

  return analysis;
}

function buildContextPrompt(
  parentData: any,
  testPath: string,
  analysis: QuestionAnalysis,
  overallResult: string
): string {
  const grade = parentData.grade === '0' ? 'Kindergarten' : `${parentData.grade}st/nd/rd/th Grade`;
  const hasFamilyHistory = parentData.dyslexiaHistory === 'Yes';

  let strugglingAreas = [];
  let strengths = [];

  // Analyze patterns
  if (testPath === 'kindergarten') {
    if (analysis.letterSounds && analysis.letterSounds > 2) strugglingAreas.push('letter sounds');
    else if (analysis.letterSounds === 0) strengths.push('letter sound knowledge');

    if (analysis.soundSegmentation && analysis.soundSegmentation > 1) strugglingAreas.push('sound segmentation');
    else if (analysis.soundSegmentation === 0) strengths.push('phonological awareness');

    if (analysis.soundDeletion && analysis.soundDeletion > 1) strugglingAreas.push('sound manipulation');
    else if (analysis.soundDeletion === 0) strengths.push('advanced phonological skills');
  } else {
    if (analysis.wordReading && analysis.wordReading > 1) strugglingAreas.push('word reading fluency');
    else if (analysis.wordReading === 0) strengths.push('word recognition');

    if (analysis.soundSegmentation && analysis.soundSegmentation > 1) strugglingAreas.push('phonological awareness');
    if (analysis.soundDeletion && analysis.soundDeletion > 1) strugglingAreas.push('sound manipulation');

    if (analysis.nonsenseWords1 && analysis.nonsenseWords1 > 2) strugglingAreas.push('phonetic decoding');
    if (analysis.nonsenseWords2 && analysis.nonsenseWords2 > 2) strugglingAreas.push('advanced decoding patterns');
  }

  return `
Please provide a personalized recommendation for parents of a ${parentData.age}-year-old in ${grade}.

Assessment Context:
- Family history of dyslexia: ${parentData.dyslexiaHistory}
- Current reading struggle level: ${parentData.strugglingLevel}
- Overall assessment result: ${overallResult}
- Areas of concern: ${strugglingAreas.length > 0 ? strugglingAreas.join(', ') : 'none identified'}
- Areas of strength: ${strengths.length > 0 ? strengths.join(', ') : 'assessment complete'}

Requirements:
- 3-5 sentences maximum
- Professional yet empathetic tone
- Integrate Orton-Gillingham and Structured Literacy principles naturally
- ${hasFamilyHistory ? 'Emphasize the significance of family history in reading difficulties' : ''}
- Focus on early intervention importance
- End with appropriate next step:
  ${overallResult === 'kudos' ?
    '- For no issues: Suggest continued monitoring and enrichment' :
    '- For any issues: Focus on the importance of professional support and early intervention'
  }

Provide only the recommendation text, no additional formatting or labels.
  `.trim();
}

function getFallbackMessage(overallResult: string): string {
  if (overallResult === 'kudos') {
    return "Your child is demonstrating strong foundational reading skills. Continue to support their literacy development with rich reading experiences and regular practice. Consider exploring advanced reading materials to further enhance their growth.";
  } else if (overallResult === 'suggestion') {
    return "The assessment indicates some areas where your child could benefit from additional support. Early intervention is key to reading success. I recommend working with reading specialists to discuss targeted strategies.";
  } else {
    return "The results suggest your child would significantly benefit from specialized reading intervention. Research shows that early, systematic instruction can make a profound difference.";
  }
}