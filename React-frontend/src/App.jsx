import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ReactQueryDevtools } from 'react-query/devtools';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfilePage from './pages/ProfilePage';
import EditProfilePage from './pages/EditProfilePage';
import ExplorePage from './pages/ExploreSkillsPage';
import PostPage from './pages/PostPage';
import LearningPlanPage from './pages/LearningPlanPage';
import CreateLearningPlanPage from './pages/CreateLearningPlanPage';
import SavedPostsPage from './pages/SavedPostsPage';
import NotFoundPage from './pages/NotFoundPage';

// Components
import Layout from './components/Layout';

// Create theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#f50057',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route path="/" element={<Layout />}>
          <Route index element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          } />

          <Route path="profile/:userId" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          
          <Route path="edit-profile" element={
            <ProtectedRoute>
              <EditProfilePage />
            </ProtectedRoute>
          } />
          
          <Route path="explore" element={<ExplorePage />} />
          
          <Route path="posts/:postId" element={<PostPage />} />
          
          <Route path="learning-plans/:planId" element={<LearningPlanPage />} />
          
          <Route path="learning-plans/create" element={
            <ProtectedRoute>
              <CreateLearningPlanPage />
            </ProtectedRoute>
          } />
          
          <Route path="learning-plans/edit/:planId" element={
            <ProtectedRoute>
              <CreateLearningPlanPage />
            </ProtectedRoute>
          } />
          
          <Route path="saved-posts" element={
            <ProtectedRoute>
              <SavedPostsPage />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      <ReactQueryDevtools initialIsOpen={false} />
    </ThemeProvider>
  );
}

export default App;
