import type { RouteObject } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { HomePage } from '@/pages/HomePage';
import { NewGamePage } from '@/pages/NewGamePage';
import { DashboardPage } from '@/pages/DashboardPage';
import { InboxPage } from '@/pages/InboxPage';
import { RosterPage } from '@/pages/RosterPage';
import { LinesPage } from '@/pages/LinesPage';
import { SchedulePage } from '@/pages/SchedulePage';
import { StandingsPage } from '@/pages/StandingsPage';
import { StatisticsPage } from '@/pages/StatisticsPage';
import { ContractsPage } from '@/pages/ContractsPage';
import { SalaryCapPage } from '@/pages/SalaryCapPage';
import { DatabaseStatusPage } from '@/pages/DatabaseStatusPage';
import { SettingsPage } from '@/pages/SettingsPage';

export const routes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  { path: '/new', element: <NewGamePage /> },
  {
    path: '/game',
    element: <Layout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'inbox', element: <InboxPage /> },
      { path: 'roster', element: <RosterPage /> },
      { path: 'lines', element: <LinesPage /> },
      { path: 'schedule', element: <SchedulePage /> },
      { path: 'standings', element: <StandingsPage /> },
      { path: 'statistics', element: <StatisticsPage /> },
      { path: 'contracts', element: <ContractsPage /> },
      { path: 'cap', element: <SalaryCapPage /> },
      { path: 'database', element: <DatabaseStatusPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
];
