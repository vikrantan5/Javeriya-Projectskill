import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Brain, Loader2, CheckCircle, XCircle, Trophy, Target } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const SkillQuizModal = ({ isOpen, onClose, skillName, skillLevel = 'intermediate', onSuccess }) => {
  const [quiz, setQuiz] = useState(null);
  const [testId, setTestId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && skillName) {
      generateQuiz();
    }
  }, [isOpen, skillName]);

  const generateQuiz = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${BACKEND_URL}/api/ai/generate-quiz/${skillName}?skill_level=${skillLevel}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setQuiz(response.data.questions);
      setTestId(response.data.test_id);
      setAnswers(new Array(response.data.questions.length).fill(null));
    } catch (error) {
      console.error('Error generating quiz:', error);
      alert('Failed to generate quiz. Please try again.');
      onClose();
    }
    setLoading(false);
  };

  const handleAnswerSelect = (answerIndex) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answerIndex;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (currentQuestion < quiz.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    if (answers.includes(null)) {
      alert('Please answer all questions before submitting');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${BACKEND_URL}/api/ai/submit-quiz/${testId}`,
        { answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setResult(response.data);
      setShowResult(true);
      
      if (response.data.passed && onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz. Please try again.');
    }
    setSubmitting(false);
  };

  const resetQuiz = () => {
    setQuiz(null);
    setTestId(null);
    setCurrentQuestion(0);
    setAnswers([]);
    setShowResult(false);
    setResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6" />
            {skillName} Verification Quiz
          </h2>
          <button onClick={resetQuiz} className="p-2 hover:bg-white/20 rounded-lg">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Generating personalized quiz...</p>
            </div>
          ) : showResult ? (
            <div className="text-center py-8">
              <div className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center ${
                result.passed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
              }`}>
                {result.passed ? (
                  <Trophy className="w-12 h-12 text-green-600 dark:text-green-400" />
                ) : (
                  <Target className="w-12 h-12 text-red-600 dark:text-red-400" />
                )}
              </div>

              <h3 className={`text-3xl font-bold mb-4 ${
                result.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              }`}>
                {result.passed ? 'Congratulations! 🎉' : 'Keep Learning! 📚'}
              </h3>

              <p className="text-xl text-gray-700 dark:text-gray-300 mb-6">{result.message}</p>

              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 mb-6">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Score</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{result.score}/{result.total}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Percentage</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{result.percentage}%</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Status</p>
                    <p className={`text-2xl font-bold ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                      {result.passed ? 'Passed' : 'Failed'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                {!result.passed && (
                  <button
                    onClick={generateQuiz}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all"
                  >
                    Try Again
                  </button>
                )}
                <button
                  onClick={resetQuiz}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          ) : quiz ? (
            <div>
              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Question {currentQuestion + 1} of {quiz.length}
                  </span>
                  <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                    {Math.round(((currentQuestion + 1) / quiz.length) * 100)}% Complete
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-600 to-purple-600 transition-all duration-300"
                    style={{ width: `${((currentQuestion + 1) / quiz.length) * 100}%` }}
                  ></div>
                </div>
              </div>

              {/* Question */}
              <div className="mb-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
                  {quiz[currentQuestion].question}
                </h3>

                <div className="space-y-3">
                  {quiz[currentQuestion].options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      className={`w-full p-4 text-left rounded-xl border-2 transition-all ${
                        answers[currentQuestion] === index
                          ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                      }`}
                      data-testid={`quiz-option-${index}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          answers[currentQuestion] === index
                            ? 'border-indigo-600 bg-indigo-600'
                            : 'border-gray-300 dark:border-gray-600'
                        }`}>
                          {answers[currentQuestion] === index && (
                            <CheckCircle className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <span className="text-gray-900 dark:text-white font-medium">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0}
                  className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {answers.filter(a => a !== null).length} / {quiz.length} answered
                </div>

                {currentQuestion === quiz.length - 1 ? (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center gap-2"
                    data-testid="submit-quiz-button"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Quiz'
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleNext}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all"
                  >
                    Next
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SkillQuizModal;
