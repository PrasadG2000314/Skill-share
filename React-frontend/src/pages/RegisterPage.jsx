import { useState, useContext } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, TextField, Button, Grid,
  Link, Paper, Divider, Alert, CircularProgress,
  Stepper, Step, StepLabel
} from '@mui/material';
import { Google as GoogleIcon, GitHub as GitHubIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { AuthContext } from '../contexts/AuthContext';

const steps = ['Create Account', 'Personal Details'];

const validationSchema = [
  // Step 1 validation
  Yup.object({
    name: Yup.string().required('Name is required'),
    email: Yup.string()
      .email('Invalid email address')
      .required('Email is required'),
    password: Yup.string()
      .min(6, 'Password must be at least 6 characters')
      .required('Password is required'),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], 'Passwords must match')
      .required('Confirm password is required'),
  }),
  // Step 2 validation
  Yup.object({
    bio: Yup.string().max(250, 'Bio must be at most 250 characters'),
    skills: Yup.string(),
    interests: Yup.string(),
  }),
];

export default function RegisterPage() {
  const { register } = useContext(AuthContext);
  const [activeStep, setActiveStep] = useState(0);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      bio: '',
      skills: '',
      interests: '',
    },
    validationSchema: validationSchema[activeStep],
    onSubmit: async (values) => {
      if (activeStep === 0) {
        // Move to next step
        setActiveStep(1);
      } else {
        // Final submission
        setIsLoading(true);
        setError('');
        
        try {
          const skillsArray = values.skills
            ? values.skills.split(',').map(s => s.trim()).filter(Boolean)
            : [];
            
          const interestsArray = values.interests
            ? values.interests.split(',').map(s => s.trim()).filter(Boolean)
            : [];
            
          const userData = {
            name: values.name,
            email: values.email,
            password: values.password,
            bio: values.bio || '',
            skills: skillsArray,
            interests: interestsArray
          };
          
          const result = await register(
            values.name,
            values.email,
            values.password,
            {
              bio: values.bio,
              skills: skillsArray,
              interests: interestsArray,
            }
          );
          
          if (result && result.success) {
            // Redirect to login page with success message
            navigate('/login', { state: { message: 'Registration successful! Please sign in.' } });
          } else {
            setError(result?.message || 'Registration failed. Please try again.');
          }
        } catch (err) {
          setError('An unexpected error occurred. Please try again.');
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      }
    },
  });

  const handleBack = () => {
    setActiveStep(0);
  };

  const handleOAuthLogin = (provider) => {
    window.location.href = `http://localhost:4000/oauth2/authorize/${provider}?redirect_uri=${window.location.origin}/oauth2/redirect`;
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <>
            <TextField
              margin="normal"
              required
              fullWidth
              id="name"
              label="Full Name"
              name="name"
              autoComplete="name"
              autoFocus
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.name && Boolean(formik.errors.name)}
              helperText={formik.touched.name && formik.errors.name}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
              helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
            />
          </>
        );
      case 1:
        return (
          <>
            <TextField
              margin="normal"
              fullWidth
              id="bio"
              label="Bio (optional)"
              name="bio"
              multiline
              rows={3}
              value={formik.values.bio}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.bio && Boolean(formik.errors.bio)}
              helperText={formik.touched.bio && formik.errors.bio}
            />
            <TextField
              margin="normal"
              fullWidth
              id="skills"
              label="Skills (comma separated, optional)"
              name="skills"
              placeholder="E.g. Programming, Design, Photography"
              value={formik.values.skills}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.skills && Boolean(formik.errors.skills)}
              helperText={formik.touched.skills && formik.errors.skills}
            />
            <TextField
              margin="normal"
              fullWidth
              id="interests"
              label="Interests (comma separated, optional)"
              name="interests"
              placeholder="E.g. Music, Cooking, Travel"
              value={formik.values.interests}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.interests && Boolean(formik.errors.interests)}
              helperText={formik.touched.interests && formik.errors.interests}
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 8 }}>
        <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography variant="h4" component="h1" gutterBottom>
              Create an account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Join the SkillShare community
            </Typography>
          </Box>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={formik.handleSubmit} noValidate>
            {renderStepContent()}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              {activeStep > 0 ? (
                <Button onClick={handleBack}>
                  Back
                </Button>
              ) : (
                <Box />
              )}
              <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={24} /> : 
                  activeStep === steps.length - 1 ? 'Register' : 'Next'}
              </Button>
            </Box>
          </Box>

          {activeStep === 0 && (
            <>
              <Divider sx={{ my: 3 }}>or</Divider>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<GoogleIcon />}
                  onClick={() => handleOAuthLogin('google')}
                  sx={{ py: 1.2 }}
                >
                  Continue with Google
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<GitHubIcon />}
                  onClick={() => handleOAuthLogin('github')}
                  sx={{ py: 1.2 }}
                >
                  Continue with GitHub
                </Button>
              </Box>
            </>
          )}

          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="body2">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" variant="body2">
                Sign in
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
