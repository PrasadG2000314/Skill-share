import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, Button, Paper
} from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';

export default function NotFoundPage({ message }) {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Paper
        elevation={3}
        sx={{
          p: 4,
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}
      >
        <Typography variant="h1" sx={{ fontWeight: 'bold', mb: 2 }}>
          404
        </Typography>
        <Typography variant="h5" gutterBottom>
          Page Not Found
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          {message || "Sorry, we couldn't find the page you're looking for."}
        </Typography>
        <Box sx={{ mt: 2 }}>
          <Button
            variant="contained"
            startIcon={<HomeIcon />}
            onClick={() => navigate('/')}
          >
            Go Home
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
