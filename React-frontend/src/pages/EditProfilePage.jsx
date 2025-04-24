import { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container, Box, Typography, TextField, Button, Avatar,
  Paper, Grid, CircularProgress, Alert, Chip, IconButton
} from '@mui/material';
import {
  PhotoCamera as CameraIcon,
  Add as AddIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useMutation } from 'react-query';
import { userApi, skillApi } from '../services/api';
import { AuthContext } from '../contexts/AuthContext';
import { getFullImageUrl } from '../utils/imageUtils';

const validationSchema = Yup.object({
  name: Yup.string()
    .required('Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be at most 50 characters'),
  username: Yup.string()
    .required('Username is required')
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .matches(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers and underscores'),
  bio: Yup.string()
    .max(160, 'Bio must be at most 160 characters'),
  email: Yup.string()
    .email('Enter a valid email')
    .required('Email is required'),
});

export default function EditProfilePage() {
  const [profilePictureFile, setProfilePictureFile] = useState(null);
  const [coverPhotoFile, setCoverPhotoFile] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState(null);
  const [skillInput, setSkillInput] = useState('');
  const [error, setError] = useState('');
  const { currentUser, updateUserData } = useContext(AuthContext);
  const navigate = useNavigate();

  // Add mutations for image uploads separately from profile update
  const updateProfilePictureMutation = useMutation(
    (file) => userApi.updateProfilePicture(file),
    {
      onSuccess: (response) => {
        const updatedUser = response.data.data || response.data;
        // Update the current user with new profile picture
        updateUserData({
          ...currentUser,
          profilePicture: updatedUser.profilePicture
        });
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Failed to update profile picture. Please try again.');
      }
    }
  );

  const updateCoverPictureMutation = useMutation(
    (file) => userApi.updateCoverPicture(file),
    {
      onSuccess: (response) => {
        const updatedUser = response.data.data || response.data;
        // Update the current user with new cover picture
        updateUserData({
          ...currentUser,
          coverPicture: updatedUser.coverPicture
        });
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Failed to update cover photo. Please try again.');
      }
    }
  );

  const updateProfileMutation = useMutation(
    (formData) => userApi.updateUser(formData),
    {
      onSuccess: (data) => {
        updateUserData(data.data);
        navigate(`/profile/${currentUser.id}`);
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Failed to update profile. Please try again.');
      }
    }
  );

  const addSkillMutation = useMutation(
    (skillName) => skillApi.addUserSkill(skillName),
    {
      onSuccess: (data) => {
        formik.setFieldValue('skills', data.data.skills);
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Failed to add skill. Please try again.');
      }
    }
  );

  const removeSkillMutation = useMutation(
    (skillName) => skillApi.removeUserSkill(skillName),
    {
      onSuccess: (data) => {
        formik.setFieldValue('skills', data.data.skills);
      },
      onError: (error) => {
        setError(error.response?.data?.message || 'Failed to remove skill. Please try again.');
      }
    }
  );

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    } else {
      // Set initial previews based on current user data
      if (currentUser.profilePicture) {
        setProfilePicturePreview(getFullImageUrl(currentUser.profilePicture));
      }
      if (currentUser.coverPicture) {
        setCoverPhotoPreview(getFullImageUrl(currentUser.coverPicture));
      }
    }
  }, [currentUser, navigate]);

  const formik = useFormik({
    initialValues: {
      name: currentUser?.name || '',
      username: currentUser?.username || '',
      bio: currentUser?.bio || '',
      email: currentUser?.email || '',
      skills: currentUser?.skills || [],
    },
    validationSchema,
    onSubmit: async (values) => {
      setError('');
      
      try {
        // First upload images if they exist
        if (profilePictureFile) {
          await updateProfilePictureMutation.mutateAsync(profilePictureFile);
        }
        
        if (coverPhotoFile) {
          await updateCoverPictureMutation.mutateAsync(coverPhotoFile);
        }
        
        // Then update profile data
        updateProfileMutation.mutate(values);
      } catch (error) {
        console.error("Error updating profile:", error);
        setError("An error occurred while updating your profile. Please try again.");
      }
    },
  });

  const handleProfilePictureChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setProfilePictureFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePicturePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverPhotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setCoverPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSkill = () => {
    if (skillInput.trim()) {
      addSkillMutation.mutate(skillInput.trim());
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skill) => {
    removeSkillMutation.mutate(skill);
  };

  if (!currentUser) {
    return null;
  }

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Edit Profile
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={formik.handleSubmit} noValidate>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="subtitle1" gutterBottom>
                Profile Picture
              </Typography>
              
              <Box sx={{ position: 'relative', mb: 3 }}>
                <Avatar
                  src={profilePicturePreview || getFullImageUrl(currentUser.profilePicture)}
                  alt={currentUser.name}
                  sx={{ width: 150, height: 150 }}
                />
                <input
                  accept="image/*"
                  id="profile-picture-upload"
                  type="file"
                  onChange={handleProfilePictureChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="profile-picture-upload">
                  <IconButton
                    color="primary"
                    component="span"
                    sx={{
                      position: 'absolute',
                      bottom: 0,
                      right: 0,
                      bgcolor: 'background.paper',
                      '&:hover': { bgcolor: 'background.default' },
                    }}
                  >
                    <CameraIcon />
                  </IconButton>
                </label>
              </Box>

              <Typography variant="subtitle1" gutterBottom>
                Cover Photo
              </Typography>
              
              <Box
                sx={{
                  width: '100%',
                  height: 100,
                  bgcolor: 'grey.200',
                  borderRadius: 1,
                  overflow: 'hidden',
                  position: 'relative',
                  backgroundImage: coverPhotoPreview || getFullImageUrl(currentUser.coverPicture) ? 
                                  `url(${coverPhotoPreview || getFullImageUrl(currentUser.coverPicture)})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <input
                  accept="image/*"
                  id="cover-photo-upload"
                  type="file"
                  onChange={handleCoverPhotoChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="cover-photo-upload">
                  <IconButton
                    color="primary"
                    component="span"
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      bgcolor: 'background.paper',
                      '&:hover': { bgcolor: 'background.default' },
                    }}
                  >
                    <CameraIcon />
                  </IconButton>
                </label>
              </Box>
            </Grid>

            <Grid item xs={12} md={8}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="name"
                label="Full Name"
                name="name"
                value={formik.values.name}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.name && Boolean(formik.errors.name)}
                helperText={formik.touched.name && formik.errors.name}
                disabled={updateProfileMutation.isLoading}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                value={formik.values.username}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.username && Boolean(formik.errors.username)}
                helperText={formik.touched.username && formik.errors.username}
                disabled={updateProfileMutation.isLoading}
                InputProps={{
                  startAdornment: <Typography variant="body1" color="text.secondary">@</Typography>,
                }}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                disabled={updateProfileMutation.isLoading}
              />
              
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
                helperText={
                  (formik.touched.bio && formik.errors.bio) || 
                  `${formik.values.bio.length}/160 characters`
                }
                disabled={updateProfileMutation.isLoading}
              />
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Skills
                </Typography>
                
                <Box sx={{ display: 'flex' }}>
                  <TextField
                    size="small"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="Add a skill"
                    disabled={addSkillMutation.isLoading || updateProfileMutation.isLoading}
                    sx={{ flexGrow: 1 }}
                  />
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddSkill}
                    disabled={!skillInput.trim() || addSkillMutation.isLoading || updateProfileMutation.isLoading}
                    startIcon={<AddIcon />}
                    sx={{ ml: 1 }}
                  >
                    Add
                  </Button>
                </Box>
                
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                  {formik.values.skills.map((skill) => (
                    <Chip
                      key={skill}
                      label={skill}
                      onDelete={() => handleRemoveSkill(skill)}
                      disabled={removeSkillMutation.isLoading || updateProfileMutation.isLoading}
                    />
                  ))}
                </Box>
              </Box>
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(`/profile/${currentUser.id}`)}
              disabled={updateProfileMutation.isLoading || 
                      updateProfilePictureMutation.isLoading || 
                      updateCoverPictureMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={updateProfileMutation.isLoading || 
                updateProfilePictureMutation.isLoading || 
                updateCoverPictureMutation.isLoading ||
                !formik.isValid}
      >
        {(updateProfileMutation.isLoading || 
          updateProfilePictureMutation.isLoading || 
          updateCoverPictureMutation.isLoading) ? (
          <CircularProgress size={24} />
        ) : (
          "Save Changes"
        )}
      </Button>
    </Box>
  </Box>
</Paper>
</Container>
);
}

