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
