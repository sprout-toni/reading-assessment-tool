import React, { useState } from 'react';
import { generatePersonalizedRecommendation } from './services/openai';

const ReadingAssessmentTool = () => {
  const [currentStep, setCurrentStep] = useState('intro');
  const [parentData, setParentData] = useState({
    grade: '',
    age: '',
    dyslexiaHistory: '',
    strugglingLevel: ''
  });
  const [testPath, setTestPath] = useState('');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [responses, setResponses] = useState({});
  const [results, setResults] = useState(null);
  const [aiRecommendation, setAiRecommendation] = useState('');
  const [loadingRecommendation, setLoadingRecommendation] = useState(false);

  const colors = {
    teal: '#259388',
    darkerTeal: '#0E796F',
    lightTeal: '#56D1BD',
    goldenYellow: '#F7D361',
    midnightBlue: '#0B1028',
    cream: '#F9F3ED',
    orange: '#E29148',
    coralRed: '#DB655C',
    purple: '#7356DF',
    cloudBlue: '#B1CFD4',
    electricBlue: '#4D81D5'
  };

  const kindergartenQuestions = [
    {
      id: 1,
      title: "Letter Sounds",
      instruction: "Ask your child: What are the letter sounds for each letter on the screen?",
      letters: "S A T P O M",
      maxWrong: 6
    },
    {
      id: 2,
      title: "Sound Segmentation",
      instruction: "Say: 'Now I want you to tell me each sound in each of these words. For example, if I say cat, the sounds are /k/ /a/ /t/'",
      words: ["bus", "coat", "fish"],
      maxWrong: 3
    },
    {
      id: 3,
      title: "Sound Deletion",
      instruction: "Say: 'Now I'm going to say a word and I want you to take part of the word away to make a new word. For example, if I say feel and take out /f/, I get eel.'",
      tasks: [
        "Say 'bus' without the /b/ sound",
        "Say 'fall' without the /f/ sound",
        "Say 'gate' without the /g/ sound"
      ],
      maxWrong: 3
    }
  ];

  const gradeQuestions = [
    {
      id: 1,
      title: "Word Reading",
      instruction: "Ask your child to read these words:",
      words: ["fine", "turn", "stove", "bait"],
      maxWrong: 4
    },
    {
      id: 2,
      title: "Sound Segmentation",
      instruction: "Say: 'Now I want you to tell me each sound in each of these words. For example, if I say cat, the sounds are /k/ /a/ /t/'",
      words: ["bus", "coat", "fish"],
      maxWrong: 3
    },
    {
      id: 3,
      title: "Sound Deletion",
      instruction: "Say: 'Now I'm going to say a word and I want you to take part of the word away to make a new word. For example, if I say feel and take out /f/, I get eel.'",
      tasks: [
        "Say 'bus' without the /b/ sound",
        "Say 'fall' without the /f/ sound",
        "Say 'gate' without the /g/ sound"
      ],
      maxWrong: 3
    },
    {
      id: 4,
      title: "Nonsense Words 1",
      instruction: "Ask your child to read this list of made-up words:",
      words: ["litch", "mudge", "vux", "quam", "cep"],
      maxWrong: 5
    },
    {
      id: 5,
      title: "Nonsense Words 2",
      instruction: "Ask your child to read this list of made-up words:",
      words: ["kray", "fraw", "chout", "koe", "poid"],
      maxWrong: 5
    }
  ];

  const scoringMatrix = {
    kindergarten: {
      1: { 0: 'kudos', 1: 'suggestion', 2: 'suggestion', 3: 'action', 4: 'action', 5: 'action', 6: 'action' },
      2: { 0: 'kudos', 1: 'suggestion', 2: 'action', 3: 'action' },
      3: { 0: 'kudos', 1: 'suggestion', 2: 'action', 3: 'action' }
    },
    grade: {
      1: { 0: 'kudos', 1: 'suggestion', 2: 'action', 3: 'action', 4: 'action' },
      2: { 0: 'kudos', 1: 'suggestion', 2: 'action', 3: 'action' },
      3: { 0: 'kudos', 1: 'suggestion', 2: 'action', 3: 'action' },
      4: { 0: 'kudos', 1: 'suggestion', 2: 'suggestion', 3: 'action', 4: 'action', 5: 'action' },
      5: { 0: 'kudos', 1: 'suggestion', 2: 'suggestion', 3: 'action', 4: 'action', 5: 'action' }
    }
  };

  const handleParentDataChange = (field, value) => {
    setParentData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const startTest = () => {
    const grade = parseInt(parentData.grade);
    if (grade <= 1) {
      setTestPath('kindergarten');
    } else {
      setTestPath('grade');
    }
    setCurrentStep('test');
    setCurrentQuestion(0);
  };

  const handleResponseChange = (questionId, wrongCount) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: wrongCount
    }));
  };

  const nextQuestion = () => {
    const questions = testPath === 'kindergarten' ? kindergartenQuestions : gradeQuestions;
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      calculateResults();
    }
  };

  const calculateResults = async () => {
    const matrix = scoringMatrix[testPath];
    let overallResult = 'kudos';
    const questionResults = {};

    Object.keys(responses).forEach(qId => {
      const wrongCount = responses[qId];
      const result = matrix[qId][wrongCount] || 'action';
      questionResults[qId] = result;

      if (result === 'action') {
        overallResult = 'action';
      } else if (result === 'suggestion' && overallResult !== 'action') {
        overallResult = 'suggestion';
      }
    });

    const resultData = {
      overall: overallResult,
      questions: questionResults,
      responses: responses
    };

    setResults(resultData);
    setCurrentStep('results');

    // Generate AI recommendation
    setLoadingRecommendation(true);
    try {
      const recommendation = await generatePersonalizedRecommendation({
        parentData,
        testPath,
        responses,
        overallResult
      });
      setAiRecommendation(recommendation);
    } catch (error) {
      console.error('Failed to generate AI recommendation:', error);
      setAiRecommendation(getFallbackRecommendation(overallResult));
    } finally {
      setLoadingRecommendation(false);
    }
  };

  const getFallbackRecommendation = (result) => {
    if (result === 'kudos') {
      return "Your child is demonstrating strong foundational reading skills. Continue to support their literacy development with rich reading experiences and regular practice. Consider exploring advanced reading materials to further enhance their growth.";
    } else if (result === 'suggestion') {
      return "The assessment indicates some areas where your child could benefit from additional support. Early intervention is key to reading success. I recommend scheduling a consultation with our reading specialists at Sprout Labs to discuss targeted strategies: https://meetings.hubspot.com/aockert/consultation";
    } else {
      return "The results suggest your child would significantly benefit from specialized reading intervention. Research shows that early, systematic instruction can make a profound difference. Please schedule a consultation with Sprout Labs immediately to begin developing a comprehensive support plan: https://meetings.hubspot.com/aockert/consultation";
    }
  };

  const getResultMessage = (result) => {
    switch(result) {
      case 'kudos':
        return {
          title: "Excellent Work!",
          message: "Your child is performing well with their reading skills. Consider enriching their learning experience with advanced reading materials.",
          color: colors.teal,
          action: "Explore enrichment resources on Sprout Labs"
        };
      case 'suggestion':
        return {
          title: "Room for Growth",
          message: "Your child shows some areas where additional support could be beneficial. Consider speaking with a Reading Specialist to get a deeper understanding of what's happening.",
          color: colors.goldenYellow,
          action: "Consult with a Reading Specialist"
        };
      case 'action':
        return {
          title: "Take Action Now",
          message: "The results suggest there could be something more serious affecting your child's reading development. Early intervention is crucial - don't wait to seek professional help.",
          color: colors.coralRed,
          action: "Schedule an assessment immediately"
        };
      default:
        return {
          title: "Assessment Complete",
          message: "Please review the individual question results below.",
          color: colors.teal,
          action: "Continue monitoring progress"
        };
    }
  };

  const IntroScreen = () => (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-3xl sm:text-4xl font-light mb-4" style={{ color: colors.midnightBlue }}>
          AI-Powered Mini Reading Test
        </h1>
        <p className="text-base sm:text-lg text-gray-600 px-2">
          A quick screening tool to help identify if your child needs additional reading support
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8 mb-6">
        <h2 className="text-xl sm:text-2xl font-light mb-6" style={{ color: colors.teal }}>
          About Your Child
        </h2>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.midnightBlue }}>
              What grade is your child in right now?
            </label>
            <select
              value={parentData.grade}
              onChange={(e) => handleParentDataChange('grade', e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent"
            >
              <option value="">Select grade</option>
              <option value="0">Kindergarten</option>
              <option value="1">1st Grade</option>
              <option value="2">2nd Grade</option>
              <option value="3">3rd Grade</option>
              <option value="4">4th Grade</option>
              <option value="5">5th Grade</option>
              <option value="6">6th Grade</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.midnightBlue }}>
              How old is your child?
            </label>
            <input
              type="number"
              value={parentData.age}
              onChange={(e) => handleParentDataChange('age', e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent"
              placeholder="Enter age"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.midnightBlue }}>
              Is there a history of dyslexia in your family?
            </label>
            <div className="space-y-3">
              {['Yes', 'No', 'Not sure'].map(option => (
                <label key={option} className="flex items-center cursor-pointer p-2 -m-2 rounded-lg hover:bg-gray-50">
                  <input
                    type="radio"
                    name="dyslexia"
                    value={option}
                    checked={parentData.dyslexiaHistory === option}
                    onChange={(e) => handleParentDataChange('dyslexiaHistory', e.target.value)}
                    className="mr-3 text-brand-teal focus:ring-brand-teal"
                  />
                  <span className="text-sm sm:text-base">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: colors.midnightBlue }}>
              How much is your child struggling with reading?
            </label>
            <div className="space-y-3">
              {['Not at all', 'Not sure', 'A little', 'A lot'].map(option => (
                <label key={option} className="flex items-center cursor-pointer p-2 -m-2 rounded-lg hover:bg-gray-50">
                  <input
                    type="radio"
                    name="struggling"
                    value={option}
                    checked={parentData.strugglingLevel === option}
                    onChange={(e) => handleParentDataChange('strugglingLevel', e.target.value)}
                    className="mr-3 text-brand-teal focus:ring-brand-teal"
                  />
                  <span className="text-sm sm:text-base">{option}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={startTest}
          disabled={!parentData.grade || !parentData.age || !parentData.dyslexiaHistory || !parentData.strugglingLevel}
          className="w-full mt-8 py-4 px-6 rounded-lg text-white font-medium text-base sm:text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-brand-teal/30"
          style={{ backgroundColor: colors.teal }}
        >
          Begin Reading Assessment
        </button>
      </div>
    </div>
  );

  const TestScreen = () => {
    const questions = testPath === 'kindergarten' ? kindergartenQuestions : gradeQuestions;
    const currentQ = questions[currentQuestion];
    const currentResponse = responses[currentQ.id] || 0;

    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="mb-6">
          <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center mb-4 space-y-2 xs:space-y-0">
            <h2 className="text-xl sm:text-2xl font-light" style={{ color: colors.midnightBlue }}>
              Question {currentQuestion + 1} of {questions.length}
            </h2>
            <div className="text-sm" style={{ color: colors.teal }}>
              {Math.round(((currentQuestion + 1) / questions.length) * 100)}% Complete
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-300"
              style={{
                backgroundColor: colors.teal,
                width: `${((currentQuestion + 1) / questions.length) * 100}%`
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8">
          <h3 className="text-lg sm:text-xl font-medium mb-6" style={{ color: colors.teal }}>
            {currentQ.title}
          </h3>

          <div className="mb-8">
            <p className="text-gray-700 mb-4 text-sm sm:text-base leading-relaxed">{currentQ.instruction}</p>

            {currentQ.letters && (
              <div className="text-center p-4 sm:p-6 bg-gray-50 rounded-lg mb-4">
                <div className="text-2xl sm:text-3xl font-bold tracking-wider" style={{ color: colors.midnightBlue }}>
                  {currentQ.letters}
                </div>
              </div>
            )}

            {currentQ.words && (
              <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4 mb-4">
                {currentQ.words.map((word, index) => (
                  <div key={index} className="text-center p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <span className="text-lg sm:text-xl font-medium" style={{ color: colors.midnightBlue }}>
                      {word}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {currentQ.tasks && (
              <div className="space-y-3 mb-4">
                {currentQ.tasks.map((task, index) => (
                  <div key={index} className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-700 text-sm sm:text-base">{task}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mb-8">
            <label className="block text-sm font-medium mb-4" style={{ color: colors.midnightBlue }}>
              How many did your child get wrong?
            </label>
            <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-4 gap-2 sm:gap-3">
              {Array.from({ length: currentQ.maxWrong + 1 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => handleResponseChange(currentQ.id, i)}
                  className={`p-2 sm:p-3 rounded-lg border-2 font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-teal/50 ${
                    currentResponse === i
                      ? 'border-teal-500 text-white'
                      : 'border-gray-200 text-gray-700 hover:border-teal-300'
                  }`}
                  style={{
                    backgroundColor: currentResponse === i ? colors.teal : 'transparent',
                    borderColor: currentResponse === i ? colors.teal : '#e5e7eb'
                  }}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={nextQuestion}
            className="w-full py-3 sm:py-4 px-6 rounded-lg text-white font-medium text-base sm:text-lg transition-all hover:opacity-90 focus:outline-none focus:ring-4 focus:ring-brand-teal/30"
            style={{ backgroundColor: colors.teal }}
          >
            {currentQuestion < questions.length - 1 ? 'Next Question' : 'Complete Assessment'}
          </button>
        </div>
      </div>
    );
  };

  const ResultsScreen = () => {
    const resultInfo = getResultMessage(results.overall);

    return (
      <div className="max-w-2xl mx-auto p-4 sm:p-6">
        <div className="text-center mb-6 sm:mb-8">
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: resultInfo.color + '20' }}
          >
            <div className="text-2xl sm:text-3xl">
              {results.overall === 'kudos' ? '🎉' : results.overall === 'suggestion' ? '💡' : '⚠️'}
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-light mb-4 px-2" style={{ color: colors.midnightBlue }}>
            {resultInfo.title}
          </h1>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-8 mb-6">
          {loadingRecommendation ? (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center space-x-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2" style={{ borderColor: colors.teal }}></div>
                <span className="text-gray-600">Generating personalized recommendation...</span>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-base sm:text-lg font-medium mb-4" style={{ color: colors.teal }}>
                  Personalized Recommendation
                </h3>
                <p className="text-base sm:text-lg text-gray-700 leading-relaxed">
                  {aiRecommendation || resultInfo.message}
                </p>
              </div>

              <div
                className="p-4 rounded-lg mb-6"
                style={{ backgroundColor: resultInfo.color + '10' }}
              >
                <p className="font-medium text-sm sm:text-base" style={{ color: resultInfo.color }}>
                  Assessment Level: {resultInfo.title}
                </p>
              </div>
            </>
          )}

          <div className="border-t pt-6">
            <h3 className="text-base sm:text-lg font-medium mb-4" style={{ color: colors.teal }}>
              Detailed Results
            </h3>
            <div className="space-y-3">
              {Object.keys(results.questions).map(qId => {
                const questionResult = results.questions[qId];
                const wrongCount = results.responses[qId];
                const questions = testPath === 'kindergarten' ? kindergartenQuestions : gradeQuestions;
                const question = questions.find(q => q.id == qId);

                return (
                  <div key={qId} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-700 text-sm sm:text-base flex-1 mr-3">{question?.title}</span>
                    <div className="flex items-center flex-shrink-0">
                      <span className="text-xs sm:text-sm text-gray-500 mr-2 sm:mr-3">
                        {wrongCount} wrong
                      </span>
                      <div
                        className={`w-3 h-3 rounded-full ${
                          questionResult === 'kudos' ? 'bg-green-400' :
                          questionResult === 'suggestion' ? 'bg-yellow-400' : 'bg-red-400'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            onClick={() => {
              setCurrentStep('intro');
              setCurrentQuestion(0);
              setResponses({});
              setResults(null);
              setAiRecommendation('');
              setLoadingRecommendation(false);
              setParentData({
                grade: '',
                age: '',
                dyslexiaHistory: '',
                strugglingLevel: ''
              });
            }}
            className="w-full mt-6 py-3 px-6 border-2 rounded-lg font-medium transition-all hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-brand-teal/30 text-sm sm:text-base"
            style={{ borderColor: colors.teal, color: colors.teal }}
          >
            Take Another Assessment
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.cream, fontFamily: 'Lexend, system-ui, sans-serif' }}>
      {currentStep === 'intro' && <IntroScreen />}
      {currentStep === 'test' && <TestScreen />}
      {currentStep === 'results' && <ResultsScreen />}
    </div>
  );
};

export default ReadingAssessmentTool;