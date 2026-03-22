import { Link } from 'react-router';
import { Eye, Scale, Users, Layers, ArrowRight } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 font-['Inter']">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-['Merriweather'] font-bold text-2xl text-gray-900">
            Pol-News
          </h1>
          <Link
            to="/feed"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Explore Feed
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="mb-6">
          <span className="inline-block px-4 py-1.5 bg-blue-50 text-blue-700 text-sm font-semibold rounded-full mb-4">
            Beyond the Echo Chamber
          </span>
        </div>
        
        <h2 className="font-['Merriweather'] font-bold text-5xl md:text-6xl text-gray-900 mb-6 leading-tight">
          See Every Side of <br />
          <span className="bg-gradient-to-r from-blue-600 via-gray-600 to-red-600 bg-clip-text text-transparent">
            Every Story
          </span>
        </h2>
        
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
          Pol-News doesn't tell you what to think. We show you how every major news source 
          covers the same story—so you can form your own informed opinion.
        </p>

        <Link
          to="/feed"
          className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg rounded-xl transition-colors shadow-lg hover:shadow-xl"
        >
          Start Exploring
          <ArrowRight className="w-5 h-5" />
        </Link>
      </section>

      {/* How It Works */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h3 className="font-['Merriweather'] font-bold text-3xl text-gray-900 text-center mb-12">
          How Pol-News Works
        </h3>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
              <Eye className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-['Merriweather'] font-bold text-xl text-gray-900 mb-3">
              360° Story Clusters
            </h4>
            <p className="text-gray-600 leading-relaxed">
              Every major story is grouped with articles from across the political 
              spectrum—from NYT to Fox News to Reuters.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-4">
              <Scale className="w-6 h-6 text-gray-600" />
            </div>
            <h4 className="font-['Merriweather'] font-bold text-xl text-gray-900 mb-3">
              Real-Time Bias Tracking
            </h4>
            <p className="text-gray-600 leading-relaxed">
              Our transparency meter shows you exactly where each source leans—
              left, center, or right—on every article.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-4">
              <Layers className="w-6 h-6 text-red-600" />
            </div>
            <h4 className="font-['Merriweather'] font-bold text-xl text-gray-900 mb-3">
              Three Perspectives, One Topic
            </h4>
            <p className="text-gray-600 leading-relaxed">
              Each story cluster includes left, center, and right summaries grounded in
              short quotes from real coverage—so you can see how framing shifts across outlets.
            </p>
          </div>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="bg-white border-y border-gray-200 relative overflow-hidden">
        {/* Scrolling Background Images */}
        <div className="absolute inset-0 flex opacity-10 pointer-events-none">
          <div className="flex gap-0 animate-scroll-bg">
            <img
              src="https://images.unsplash.com/photo-1673121209001-e996ecf40807?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXBpdG9sJTIwYnVpbGRpbmclMjB3YXNoaW5ndG9uJTIwZGN8ZW58MXx8fHwxNzc0MDcxMjM4fDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt=""
              className="h-full w-auto object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1597700331582-aab3614b3c0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2b3RpbmclMjBiYWxsb3QlMjBkZW1vY3JhY3l8ZW58MXx8fHwxNzc0MDIyMDI0fDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt=""
              className="h-full w-auto object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1769377488995-7da651d039b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb2xpdGljYWwlMjBwcm90ZXN0JTIwZGVtb25zdHJhdGlvbnxlbnwxfHx8fDE3NzQwNzEyMzl8MA&ixlib=rb-4.1.0&q=80&w=1080"
              alt=""
              className="h-full w-auto object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1678165874657-304df6185c8d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbWVyaWNhbiUyMGZsYWclMjBwYXRyaW90aWN8ZW58MXx8fHwxNzc0MDQxOTk5fDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt=""
              className="h-full w-auto object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1697237089826-331838962a04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXByZW1lJTIwY291cnQlMjBqdXN0aWNlfGVufDF8fHx8MTc3NDA3MTI0MHww&ixlib=rb-4.1.0&q=80&w=1080"
              alt=""
              className="h-full w-auto object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1467251589161-f9c68fa14c59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMGhvdXNlJTIwZ292ZXJubWVudHxlbnwxfHx8fDE3NzQwNzEyNDJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
              alt=""
              className="h-full w-auto object-cover"
            />
            {/* Duplicate set for seamless loop */}
            <img
              src="https://images.unsplash.com/photo-1673121209001-e996ecf40807?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXBpdG9sJTIwYnVpbGRpbmclMjB3YXNoaW5ndG9uJTIwZGN8ZW58MXx8fHwxNzc0MDcxMjM4fDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt=""
              className="h-full w-auto object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1597700331582-aab3614b3c0c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx2b3RpbmclMjBiYWxsb3QlMjBkZW1vY3JhY3l8ZW58MXx8fHwxNzc0MDIyMDI0fDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt=""
              className="h-full w-auto object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1769377488995-7da651d039b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwb2xpdGljYWwlMjBwcm90ZXN0JTIwZGVtb25zdHJhdGlvbnxlbnwxfHx8fDE3NzQwNzEyMzl8MA&ixlib=rb-4.1.0&q=80&w=1080"
              alt=""
              className="h-full w-auto object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1678165874657-304df6185c8d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbWVyaWNhbiUyMGZsYWclMjBwYXRyaW90aWN8ZW58MXx8fHwxNzc0MDQxOTk5fDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt=""
              className="h-full w-auto object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1697237089826-331838962a04?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXByZW1lJTIwY291cnQlMjBqdXN0aWNlfGVufDF8fHx8MTc3NDA3MTI0MHww&ixlib=rb-4.1.0&q=80&w=1080"
              alt=""
              className="h-full w-auto object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1467251589161-f9c68fa14c59?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aGl0ZSUyMGhvdXNlJTIwZ292ZXJubWVudHxlbnwxfHx8fDE3NzQwNzEyNDJ8MA&ixlib=rb-4.1.0&q=80&w=1080"
              alt=""
              className="h-full w-auto object-cover"
            />
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-16 text-center relative z-10">
          <Users className="w-12 h-12 text-blue-600 mx-auto mb-6" />
          
          <h3 className="font-['Merriweather'] font-bold text-3xl text-gray-900 mb-6">
            Our Mission
          </h3>
          
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            In an era of increasing polarization, Pol-News believes that access to 
            multiple perspectives isn't just valuable—it's essential to democracy.
          </p>
          
          <p className="text-lg text-gray-700 leading-relaxed mb-4">
            We don't curate your news feed based on what keeps you clicking. We don't 
            hide sources that challenge your beliefs. Instead, we make it radically 
            easy to see how <em>everyone</em> is covering the same event.
          </p>
          
          <p className="text-lg font-semibold text-gray-900">
            Because informed citizens deserve the full picture.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-12 shadow-2xl">
          <h3 className="font-['Merriweather'] font-bold text-4xl text-white mb-4">
            Ready to Break Your Bubble?
          </h3>
          <p className="text-xl text-blue-100 mb-8">
            Start reading the news without the filter.
          </p>
          <Link
            to="/feed"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white hover:bg-gray-100 text-blue-600 font-semibold text-lg rounded-xl transition-colors shadow-lg"
          >
            Explore Stories Now
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8 text-center text-sm text-gray-600">
          <p>© 2026 Pol-News. Non-partisan news for informed citizens.</p>
        </div>
      </footer>
    </div>
  );
}