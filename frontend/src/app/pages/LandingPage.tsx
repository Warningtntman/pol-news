import { Link } from 'react-router';
import { Users, ArrowRight } from 'lucide-react';
import {
  missionMarqueeRow1,
  missionMarqueeRow2,
  missionMarqueeRow3,
} from '../data/missionMarqueeImages';

function MissionMarqueeRow({
  urls,
  animationClass,
}: {
  urls: readonly string[];
  animationClass: string;
}) {
  return (
    <div className="h-28 w-full overflow-hidden md:h-32">
      <div className={`flex h-full w-max gap-2 ${animationClass}`}>
        {[0, 1].map((dup) =>
          urls.map((src, i) => (
            <img
              key={`${dup}-${i}`}
              src={src}
              alt=""
              className="h-full w-48 shrink-0 object-cover md:w-52"
              loading="lazy"
              decoding="async"
            />
          ))
        )}
      </div>
    </div>
  );
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 font-['Inter']">
      {/* Header */}
      <header className="border-b border-gray-200 bg-gray-50/90 backdrop-blur-sm sticky top-0 z-30">
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
      <section className="relative max-w-4xl mx-auto px-4 py-16 text-center bg-slate-50/50">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            backgroundImage:
              'radial-gradient(ellipse 85% 55% at 50% 0%, rgba(148, 163, 184, 0.28), transparent 55%)',
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15, 23, 42, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.03) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
          aria-hidden
        />
        <div className="relative">
          <h2 className="font-['Merriweather'] font-bold text-3xl sm:text-4xl md:text-5xl text-gray-900 mb-6 leading-tight">
            Stop guessing how a story leans. <br />
            <span
              style={{
                backgroundImage: 'linear-gradient(90deg, #2563EB 0%, #94A3B8 50%, #DC2626 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              We analyze the bias for you.
            </span>
          </h2>

          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Pol-News clusters live political coverage from major outlets and runs each article through an LLM
            (via the InsForge AI gateway) to estimate left, center, and right lean—so you see the slant at a
            glance instead of working it out on your own.
          </p>

          <Link
            to="/feed"
            className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg rounded-xl transition-all shadow-md shadow-slate-900/15 hover:shadow-lg hover:shadow-slate-900/20"
          >
            Start Exploring
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Mission Statement */}
      <section className="bg-gray-50 border-y border-gray-200 relative overflow-hidden pb-16">
        {/* LOC historical photo marquees (left / right / left) */}
        <div
          className="absolute inset-0 flex flex-col justify-center gap-2 opacity-10 pointer-events-none"
          aria-hidden
        >
          <MissionMarqueeRow urls={missionMarqueeRow1} animationClass="animate-marquee-row-1" />
          <MissionMarqueeRow urls={missionMarqueeRow2} animationClass="animate-marquee-row-2" />
          <MissionMarqueeRow urls={missionMarqueeRow3} animationClass="animate-marquee-row-3" />
        </div>

        <div className="relative z-10 mx-auto max-w-3xl px-4 py-16 text-center">
          <div className="rounded-2xl bg-white/90 px-6 py-8 shadow-sm backdrop-blur-sm md:px-8 md:py-10">
            <Users className="mx-auto mb-6 h-12 w-12 text-blue-600" />

            <h3 className="mb-6 font-['Merriweather'] text-3xl font-bold text-gray-900">
              Our Mission
            </h3>

            <p className="mb-4 text-lg leading-relaxed text-gray-700 drop-shadow-sm [text-shadow:0_1px_2px_rgba(255,255,255,0.9)]">
              In an era of increasing polarization, Pol-News believes that access to multiple
              perspectives isn't just valuable—it's essential to democracy.
            </p>

            <p className="mb-4 text-lg leading-relaxed text-gray-700 drop-shadow-sm [text-shadow:0_1px_2px_rgba(255,255,255,0.9)]">
              We don't curate your news feed based on what keeps you clicking. We don't hide
              sources that challenge your beliefs. Instead, we make it radically easy to see
              how <em>everyone</em> is covering the same event.
            </p>

            <p className="text-lg font-semibold text-gray-900 drop-shadow-sm [text-shadow:0_1px_2px_rgba(255,255,255,0.95)]">
              Because informed citizens deserve the full picture.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}