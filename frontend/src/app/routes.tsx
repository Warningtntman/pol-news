import { createBrowserRouter } from 'react-router';
import { LandingPage } from './pages/LandingPage';
import { FeedPage } from './pages/FeedPage';
import { ArticlePage } from './pages/ArticlePage';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: LandingPage,
  },
  {
    path: '/feed',
    Component: FeedPage,
  },
  {
    path: '/article/:storyId/:articleId',
    Component: ArticlePage,
  },
]);