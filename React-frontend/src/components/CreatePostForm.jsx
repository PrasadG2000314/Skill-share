import { useState, useContext } from 'react';
import { 
  Box, TextField, Button, Card, CardContent, 
  Typography, InputAdornment, IconButton,
  Chip, Avatar, CircularProgress
} from '@mui/material';
import { PhotoCamera as PhotoIcon, Clear as ClearIcon } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { AuthContext } from '../contexts/AuthContext';
import { postApi } from '../services/api';
import { useMutation, useQueryClient } from 'react-query';

export default function CreatePostForm() {
  const { currentUser } = useContext(AuthContext);
  const [content, setContent] = useState('');
  const [skillCategory, setSkillCategory] = useState('');
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const queryClient = useQueryClient();

  const createPostMutation = useMutation(
    (formData) => postApi.createPost(formData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['feedPosts']);
        queryClient.invalidateQueries(['userPosts', currentUser.id]);
        setContent('');
        setSkillCategory('');
        setFiles([]);
        setPreviews([]);
      }
    }
  );

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': [],
      'video/*': []
    },
    maxFiles: 4,
    onDrop: (acceptedFiles) => {
      setFiles([...files, ...acceptedFiles].slice(0, 4));
      
      const newPreviews = acceptedFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      
      setPreviews([...previews, ...newPreviews].slice(0, 4));
    }
  });

  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);

    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index].preview);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!content.trim()) return;
    
    const formData = new FormData();
    formData.append('content', content);
    formData.append('skillCategory', skillCategory);
    
    files.forEach(file => {
      formData.append('files', file);
    });
    
    createPostMutation.mutate(formData);
  };

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
          <Avatar 
            src={currentUser?.profilePicture} 
            alt={currentUser?.name}
            sx={{ mr: 1.5, width: 40, height: 40 }}
          />
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1">
              {currentUser?.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Share your skills and knowledge
            </Typography>
          </Box>
        </Box>

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="What skill are you working on today?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            placeholder="Add a skill category (e.g. programming, music, cooking)"
            value={skillCategory}
            onChange={(e) => setSkillCategory(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start">#</InputAdornment>,
            }}
            sx={{ mb: 2 }}
          />

          {previews.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', mb: 2 }}>
              {previews.map((preview, index) => (
                <Box
                  key={index}
                  sx={{
                    position: 'relative',
                    width: 100,
                    height: 100,
                    m: 0.5,
                    borderRadius: 1,
                    overflow: 'hidden'
                  }}
                >
                  <img
                    src={preview.preview}
                    alt={`upload-preview-${index}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover'
                    }}
                  />
                  <IconButton
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      },
                      p: 0.5
                    }}
                    onClick={() => removeFile(index)}
                  >
                    <ClearIcon fontSize="small" sx={{ color: 'white' }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Chip
                label="Add Media"
                icon={<PhotoIcon />}
                variant="outlined"
                sx={{ mr: 1 }}
                clickable
                {...getRootProps()}
              />
              <input {...getInputProps()} />
            </Box>

            <Button
              type="submit"
              variant="contained"
              disabled={!content.trim() || createPostMutation.isLoading}
            >
              {createPostMutation.isLoading ? (
                <CircularProgress size={24} />
              ) : (
                'Post'
              )}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
