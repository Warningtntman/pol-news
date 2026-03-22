import { createBrowserRouter } from 'react-router';
import { LandingPage } from './pages/LandingPage';
import { FeedPage } from './pages/FeedPage';
import { ArticlePage } from './pages/ArticlePage';
import { DashboardPage } from './pages/DashboardPage';

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
  {
    path: '/dashboard',
    Component: DashboardPage,
  },
]);