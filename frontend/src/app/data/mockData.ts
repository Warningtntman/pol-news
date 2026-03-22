export interface BiasScore {
  left: number;
  center: number;
  right: number;
}

export interface SourceArticle {
  id: string;
  publisher: string;
  publisherLogo: string;
  iconUrl?: string;
  headline: string;
  bias: BiasScore;
  url: string;
}

export interface StoryCluster {
  id: string;
  mainHeadline: string;
  sources: SourceArticle[];
  timestamp: string;
}

export interface QuizQuestion {
  id: string;
  topic: string;
  question: string;
  options: QuizOption[];
}

export interface QuizOption {
  id: string;
  text: string;
  alignment: 'left' | 'center' | 'right';
}

export interface UserAlignment {
  topic: string;
  score: number; // -100 (far left) to 100 (far right)
}

export interface PoliticianMatch {
  id: string;
  name: string;
  title: string;
  party: string;
  imageUrl: string;
  matchScore: number;
  sharedValues: string[];
}

export const mockStoryClusters: StoryCluster[] = [
  {
    id: '1',
    mainHeadline: 'Senate Passes New AI Regulation Bill',
    timestamp: '2 hours ago',
    sources: [
      {
        id: '1a',
        publisher: 'The New York Times',
        publisherLogo: 'NYT',
        headline: 'Historic AI Bill Promises Strict Oversight of Tech Giants',
        bias: { left: 70, center: 30, right: 0 },
        url: '#',
      },
      {
        id: '1b',
        publisher: 'Reuters',
        publisherLogo: 'R',
        headline: 'Senate Approves AI Regulation Framework in Bipartisan Vote',
        bias: { left: 5, center: 90, right: 5 },
        url: '#',
      },
      {
        id: '1c',
        publisher: 'Fox News',
        publisherLogo: 'FOX',
        headline: 'New AI Law Raises Concerns Over Innovation and Competition',
        bias: { left: 0, center: 20, right: 80 },
        url: '#',
      },
      {
        id: '1d',
        publisher: 'The Wall Street Journal',
        publisherLogo: 'WSJ',
        headline: 'AI Regulation Bill Faces Industry Pushback',
        bias: { left: 15, center: 50, right: 35 },
        url: '#',
      },
    ],
  },
  {
    id: '2',
    mainHeadline: 'Federal Reserve Announces Interest Rate Decision',
    timestamp: '4 hours ago',
    sources: [
      {
        id: '2a',
        publisher: 'Bloomberg',
        publisherLogo: 'BB',
        headline: 'Fed Holds Rates Steady Amid Economic Uncertainty',
        bias: { left: 10, center: 80, right: 10 },
        url: '#',
      },
      {
        id: '2b',
        publisher: 'CNBC',
        publisherLogo: 'CNBC',
        headline: 'Market Rally Expected After Fed Rate Announcement',
        bias: { left: 5, center: 70, right: 25 },
        url: '#',
      },
      {
        id: '2c',
        publisher: 'The Guardian',
        publisherLogo: 'TG',
        headline: 'Critics Say Fed Should Cut Rates to Help Working Families',
        bias: { left: 75, center: 25, right: 0 },
        url: '#',
      },
    ],
  },
  {
    id: '3',
    mainHeadline: 'Supreme Court Hears Arguments on Climate Policy',
    timestamp: '6 hours ago',
    sources: [
      {
        id: '3a',
        publisher: 'NPR',
        publisherLogo: 'NPR',
        headline: 'Environmental Groups Urge Court to Uphold EPA Regulations',
        bias: { left: 60, center: 35, right: 5 },
        url: '#',
      },
      {
        id: '3b',
        publisher: 'Associated Press',
        publisherLogo: 'AP',
        headline: 'Supreme Court Considers Scope of Federal Climate Authority',
        bias: { left: 10, center: 85, right: 5 },
        url: '#',
      },
      {
        id: '3c',
        publisher: 'National Review',
        publisherLogo: 'NR',
        headline: 'Court Skeptical of Administrative Overreach on Climate',
        bias: { left: 0, center: 15, right: 85 },
        url: '#',
      },
    ],
  },
];

export const mockQuizQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    topic: 'AI Regulation',
    question: 'Should AI companies be required to open-source their training data?',
    options: [
      {
        id: 'q1a',
        text: 'Yes, transparency is essential for public accountability',
        alignment: 'left',
      },
      {
        id: 'q1b',
        text: 'Only for high-risk AI systems in sensitive domains',
        alignment: 'center',
      },
      {
        id: 'q1c',
        text: 'No, it would harm innovation and competitive advantage',
        alignment: 'right',
      },
    ],
  },
  {
    id: 'q2',
    topic: 'AI Regulation',
    question: 'Who should primarily regulate artificial intelligence development?',
    options: [
      {
        id: 'q2a',
        text: 'Federal government with comprehensive oversight',
        alignment: 'left',
      },
      {
        id: 'q2b',
        text: 'Industry self-regulation with government guidance',
        alignment: 'center',
      },
      {
        id: 'q2c',
        text: 'Minimal regulation to allow market forces to decide',
        alignment: 'right',
      },
    ],
  },
  {
    id: 'q3',
    topic: 'AI Regulation',
    question: 'Should there be mandatory AI ethics boards for tech companies?',
    options: [
      {
        id: 'q3a',
        text: 'Yes, with diverse representation and veto power',
        alignment: 'left',
      },
      {
        id: 'q3b',
        text: 'Recommended but voluntary advisory boards',
        alignment: 'center',
      },
      {
        id: 'q3c',
        text: 'No, companies should decide their own structure',
        alignment: 'right',
      },
    ],
  },
];

export const mockPoliticians: PoliticianMatch[] = [
  {
    id: 'p1',
    name: 'Sen. Mark Kelly',
    title: 'U.S. Senator, Arizona',
    party: 'Democratic',
    imageUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop',
    matchScore: 88,
    sharedValues: ['Tech Regulation', 'Privacy', 'Innovation'],
  },
  {
    id: 'p2',
    name: 'Rep. Liz Cheney',
    title: 'Former U.S. Representative, Wyoming',
    party: 'Republican',
    imageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&h=200&fit=crop',
    matchScore: 76,
    sharedValues: ['National Security', 'Tech Policy', 'Transparency'],
  },
  {
    id: 'p3',
    name: 'Sen. Amy Klobuchar',
    title: 'U.S. Senator, Minnesota',
    party: 'Democratic',
    imageUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=200&h=200&fit=crop',
    matchScore: 82,
    sharedValues: ['Consumer Protection', 'Tech Regulation', 'Privacy'],
  },
  {
    id: 'p4',
    name: 'Sen. Josh Hawley',
    title: 'U.S. Senator, Missouri',
    party: 'Republican',
    imageUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
    matchScore: 71,
    sharedValues: ['Big Tech Accountability', 'Privacy', 'Free Speech'],
  },
  {
    id: 'p5',
    name: 'Rep. Ro Khanna',
    title: 'U.S. Representative, California',
    party: 'Democratic',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
    matchScore: 85,
    sharedValues: ['Tech Innovation', 'Worker Rights', 'Privacy'],
  },
];
