import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Container, Grid, Box, Typography, TextField, Chip, Paper,
  InputAdornment, CircularProgress, MenuItem, Select, FormControl,
  InputLabel, Divider
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { useQuery } from 'react-query';
import { postApi, skillApi } from '../services/api';
import PostCard from '../components/PostCard';

const POPULAR_SKILLS = [
  'Programming', 'Design', 'Photography', 'Writing', 
  'Music', 'Cooking', 'Languages', 'Marketing'
];

export default function ExploreSkillsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [selectedSkill, setSelectedSkill] = useState(searchParams.get('skill') || '');
  const [sortBy, setSortBy] = useState('recent');
  const [page, setPage] = useState(0);

  useEffect(() => {
    // Update URL when filters change
    const params = new URLSearchParams();
    if (searchTerm) params.set('search', searchTerm);
    if (selectedSkill) params.set('skill', selectedSkill);
    setSearchParams(params);
  }, [searchTerm, selectedSkill, setSearchParams]);

  // When URL changes from external navigation
  useEffect(() => {
    const skillParam = searchParams.get('skill');
    if (skillParam) {
      setSelectedSkill(skillParam);
    }
    
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearchTerm(searchParam);
    }
  }, [searchParams]);

  const { data: popularSkillsData } = useQuery(
    ['popularSkills'],
    () => skillApi.getPopularSkills(),
    {
      staleTime: 300000, // 5 minutes
    }
  );

  const popularSkills = popularSkillsData?.data || POPULAR_SKILLS;

  const { data: postsData, isLoading, isError } = useQuery(
    ['explorePosts', searchTerm, selectedSkill, sortBy, page],
    () => postApi.explorePosts({ search: searchTerm, skill: selectedSkill, sortBy, page }),
    {
      keepPreviousData: true,
    }
  );

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(0);
  };

  const handleSkillClick = (skill) => {
    setSelectedSkill(skill === selectedSkill ? '' : skill);
    setPage(0);
  };

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
    setPage(0);
  };

  const posts = postsData?.data?.content || [];
  const hasMore = postsData?.data?.hasNext;

  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Explore Skills
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Discover content from different skill categories and find new skills to learn
        </Typography>

        <Paper sx={{ p: 3, mb: 4 }}>
          <Box component="form" onSubmit={handleSearch}>
            <TextField
              fullWidth
              placeholder="Search for skills or posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ mb: 3 }}
            />

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Popular Skills
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {popularSkills.map((skill) => (
                  <Chip
                    key={skill}
                    label={skill}
                    clickable
                    color={selectedSkill === skill ? "primary" : "default"}
                    variant={selectedSkill === skill ? "filled" : "outlined"}
                    onClick={() => handleSkillClick(skill)}
                  />
                ))}
              </Box>
            </Box>

            <Divider sx={{ mb: 3 }} />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <FormControl sx={{ minWidth: 150 }}>
                <InputLabel id="sort-by-label">Sort By</InputLabel>
                <Select
                  labelId="sort-by-label"
                  value={sortBy}
                  label="Sort By"
                  onChange={handleSortChange}
                  size="small"
                >
                  <MenuItem value="recent">Most Recent</MenuItem>
                  <MenuItem value="popular">Most Popular</MenuItem>
                  <MenuItem value="trending">Trending</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>
        </Paper>

        {selectedSkill && (
          <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
            <Typography variant="h5" component="h2" sx={{ mr: 2 }}>
              {selectedSkill}
            </Typography>
            <Chip 
              label="Clear" 
              size="small" 
              onClick={() => setSelectedSkill('')}
            />
          </Box>
        )}

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : isError ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="error">
              Failed to load posts. Please try again later.
            </Typography>
          </Box>
        ) : posts.length === 0 ? (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No posts found
            </Typography>
            <Typography color="text.secondary">
              Try adjusting your search or filters
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={3}>
            {posts.map(post => (
              <Grid item xs={12} key={post.id}>
                <PostCard post={post} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
}
