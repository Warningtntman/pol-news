import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QuizQuestion, QuizOption } from '../data/mockData';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router';

interface QuizOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  questions: QuizQuestion[];
  topic: string;
}

export function QuizOverlay({ isOpen, onClose, questions, topic }: QuizOverlayProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizOption[]>([]);
  const [showCoin, setShowCoin] = useState(false);
  const [coinAlignment, setCoinAlignment] = useState<'left' | 'center' | 'right'>('center');
  const navigate = useNavigate();

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  const handleAnswer = (option: QuizOption) => {
    setAnswers([...answers, option]);
    setCoinAlignment(option.alignment);
    setShowCoin(true);

    setTimeout(() => {
      setShowCoin(false);
      
      if (isLastQuestion) {
        // Quiz complete - navigate to dashboard
        setTimeout(() => {
          navigate('/dashboard');
          onClose();
          setCurrentQuestionIndex(0);
          setAnswers([]);
        }, 300);
      } else {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    }, 800);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Quiz Card */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[70vh] overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-['Merriweather'] font-bold text-xl text-gray-900">
                    Where do you stand on {topic}?
                  </h3>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 font-['Inter']"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex gap-1.5">
                  {questions.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        idx <= currentQuestionIndex ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Question */}
              <p className="font-['Inter'] text-lg text-gray-900 mb-6">
                {currentQuestion.question}
              </p>

              {/* Options */}
              <div className="space-y-3 mb-6">
                {currentQuestion.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleAnswer(option)}
                    className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-left font-['Inter'] text-gray-900"
                  >
                    {option.text}
                  </button>
                ))}
              </div>

              {/* Alignment Coin Animation */}
              <AnimatePresence>
                {showCoin && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: [0, 1.2, 1],
                      opacity: [0, 1, 0],
                      x: coinAlignment === 'left' ? -30 : coinAlignment === 'right' ? 30 : 0,
                    }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.8 }}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  >
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center shadow-lg"
                      style={{
                        backgroundColor:
                          coinAlignment === 'left'
                            ? '#2563EB'
                            : coinAlignment === 'right'
                            ? '#DC2626'
                            : '#94A3B8',
                      }}
                    >
                      <Sparkles className="w-8 h-8 text-white" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
