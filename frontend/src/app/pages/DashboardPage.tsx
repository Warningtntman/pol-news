import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import { mockPoliticians } from '../data/mockData';

export function DashboardPage() {
  const navigate = useNavigate();

  // Mock alignment data for visualization
  const alignmentData = [
    {
      category: 'Tech Policy',
      value: 65,
      fill: '#2563EB',
    },
    {
      category: 'Economic Policy',
      value: 80,
      fill: '#94A3B8',
    },
    {
      category: 'Social Issues',
      value: 55,
      fill: '#DC2626',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-['Inter']">
      {/* Top Nav */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate('/feed')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="font-['Merriweather'] font-bold text-2xl text-gray-900">
            Your Alignment
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        {/* Alignment Visualization */}
        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="font-['Merriweather'] font-bold text-xl text-gray-900 mb-2">
            Your True Alignment
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Based on 14 issue quizzes
          </p>

          <div className="h-64 mb-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart
                cx="50%"
                cy="50%"
                innerRadius="30%"
                outerRadius="90%"
                data={alignmentData}
                startAngle={90}
                endAngle={-270}
              >
                <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                <RadialBar
                  background
                  dataKey="value"
                  cornerRadius={10}
                  label={{ position: 'insideStart', fill: '#fff', fontSize: 12 }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#2563EB' }} />
                <span className="text-sm font-medium text-gray-700">Tech Policy</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">65% Center-Left</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#94A3B8' }} />
                <span className="text-sm font-medium text-gray-700">Economic Policy</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">80% Center</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#DC2626' }} />
                <span className="text-sm font-medium text-gray-700">Social Issues</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">55% Center-Left</span>
            </div>
          </div>
        </section>

        {/* Politician Matches */}
        <section>
          <h2 className="font-['Merriweather'] font-bold text-xl text-gray-900 mb-4">
            Politicians Who Share Your Stances
          </h2>

          <div className="space-y-4">
            {mockPoliticians.map((politician) => (
              <div
                key={politician.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  {/* Headshot */}
                  <img
                    src={politician.imageUrl}
                    alt={politician.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />

                  {/* Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900">
                      {politician.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">{politician.title}</p>
                    
                    {/* Shared Values Tags */}
                    <div className="flex flex-wrap gap-2">
                      {politician.sharedValues.map((value, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full"
                        >
                          {value}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Match Score */}
                  <div className="flex flex-col items-center">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center border-4"
                      style={{ borderColor: '#10B981' }}
                    >
                      <span className="font-bold text-lg" style={{ color: '#10B981' }}>
                        {politician.matchScore}%
                      </span>
                    </div>
                    <span className="text-xs text-gray-600 mt-1">Match</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}