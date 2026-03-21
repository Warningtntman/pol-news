import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { BiasMeter } from '../components/BiasMeter';
import { QuizOverlay } from '../components/QuizOverlay';
import { mockStoryClusters, mockQuizQuestions } from '../data/mockData';

export function ArticlePage() {
  const { storyId, articleId } = useParams();
  const navigate = useNavigate();
  const [quizOpen, setQuizOpen] = useState(false);

  const story = mockStoryClusters.find((s) => s.id === storyId);
  const article = story?.sources.find((a) => a.id === articleId);

  if (!article || !story) {
    return <div>Article not found</div>;
  }

  return (
    <div className="min-h-screen bg-white font-['Inter']">
      {/* Sticky Top Nav with Bias Meter */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => navigate('/feed')}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700">
                {article.publisherLogo}
              </div>
              <span className="font-medium text-sm text-gray-900">
                {article.publisher}
              </span>
            </div>
          </div>
          
          <BiasMeter bias={article.bias} />
        </div>
      </header>

      {/* Article Content */}
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="font-['Merriweather'] font-bold text-3xl text-gray-900 mb-6 leading-tight">
          {article.headline}
        </h1>

        <div className="prose prose-lg max-w-none">
          <p className="text-gray-700 leading-relaxed mb-4">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod 
            tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, 
            quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
          </p>
          
          <p className="text-gray-700 leading-relaxed mb-4">
            Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore 
            eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt 
            in culpa qui officia deserunt mollit anim id est laborum.
          </p>
          
          <p className="text-gray-700 leading-relaxed mb-4">
            Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium 
            doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore 
            veritatis et quasi architecto beatae vitae dicta sunt explicabo.
          </p>
          
          <p className="text-gray-700 leading-relaxed mb-8">
            Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, 
            sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt.
          </p>
        </div>

        {/* CTA Button */}
        <button
          onClick={() => setQuizOpen(true)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors shadow-lg hover:shadow-xl"
        >
          Test Your Stance: Take the 60-Second Quiz
        </button>
      </main>

      {/* Quiz Overlay */}
      <QuizOverlay
        isOpen={quizOpen}
        onClose={() => setQuizOpen(false)}
        questions={mockQuizQuestions}
        topic="AI Regulation"
      />
    </div>
  );
}