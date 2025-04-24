import { useState, useContext, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar, Toolbar, Typography, Box, Container, Button, Avatar,
  IconButton, Drawer, List, ListItem, ListItemIcon, ListItemText,
  Divider, useMediaQuery, useTheme, Badge, Menu, MenuItem, Tooltip,
  Popover, Paper, ListItemAvatar, Typography as MuiTypography
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Explore as ExploreIcon,
  Bookmark as BookmarkIcon,
  AccountCircle as AccountIcon,
  Notifications as NotificationsIcon,
  Create as CreateIcon,
  Logout as LogoutIcon,
  Login as LoginIcon,
  PersonAdd as RegisterIcon,
  Comment as CommentIcon,
  Favorite as LikeIcon,
  Person as PersonIcon
} from '@mui/icons-material';
import { useQuery, useQueryClient } from 'react-query';
import { AuthContext } from '../contexts/AuthContext';
import { getFullImageUrl } from '../utils/imageUtils';
import { notificationApi } from '../services/api';
import { format } from 'date-fns';

export default function Layout() {
  const { currentUser, isAuthenticated, logout } = useContext(AuthContext);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profileMenuAnchor, setProfileMenuAnchor] = useState(null);
  const [notificationsAnchor, setNotificationsAnchor] = useState(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setProfileMenuAnchor(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setProfileMenuAnchor(null);
  };

  const handleNotificationsOpen = (event) => {
    setNotificationsAnchor(event.currentTarget);
    // Refetch notifications when opened
    queryClient.invalidateQueries(['notifications']);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchor(null);
  };

  const handleLogout = async () => {
    logout();
    handleProfileMenuClose();
    navigate('/login');
  };
  
  const { data: unreadCount } = useQuery(
    ['unreadNotifications'], 
    () => notificationApi.getUnreadCount(),
    { 
      enabled: isAuthenticated,
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  const { data: notifications } = useQuery(
    ['notifications'],
    () => notificationApi.getNotifications(),
    {
      enabled: isAuthenticated && Boolean(notificationsAnchor),
      onSuccess: () => {
        // Invalidate unread count after getting notifications
        queryClient.invalidateQueries(['unreadNotifications']);
      }
    }
  );

  const handleNotificationClick = async (notification) => {
    // Mark notification as read
    await notificationApi.markAsRead(notification.id);
    
    // Invalidate queries to refresh data
    queryClient.invalidateQueries(['notifications']);
    queryClient.invalidateQueries(['unreadNotifications']);
    
    // Close notifications menu
    handleNotificationsClose();
    
    // Navigate based on notification type
    switch(notification.type) {
      case 'COMMENT':
      case 'LIKE':
        navigate(`/posts/${notification.entityId}`);
        break;
      case 'FOLLOW':
        navigate(`/profile/${notification.senderId}`);
        break;
      case 'LEARNING_UPDATE':
        // Assuming this redirects to the learning progress
        navigate(`/learning-progress/${notification.entityId}`);
        break;
      default:
        navigate('/');
    }
  };

  const handleMarkAllAsRead = async () => {
    await notificationApi.markAllAsRead();
    queryClient.invalidateQueries(['notifications']);
    queryClient.invalidateQueries(['unreadNotifications']);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { name: 'Home', path: '/', icon: <HomeIcon />, auth: true },
    { name: 'Explore', path: '/explore', icon: <ExploreIcon />, auth: false },
    { name: 'Saved Posts', path: '/saved-posts', icon: <BookmarkIcon />, auth: true },
  ];

  const drawer = (
    <Box onClick={handleDrawerToggle} sx={{ width: 250 }}>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="h6" component="div">
          SkillShare
        </Typography>
      </Box>
      <Divider />
      <Divider />
      <List>
        {isAuthenticated ? (
          <>
            <ListItem button onClick={() => navigate(`/profile/${currentUser.id}`)}>
              <ListItemIcon><AccountIcon /></ListItemIcon>
              <ListItemText primary="Profile" />
            </ListItem>
            <ListItem button onClick={handleLogout}>
              <ListItemIcon><LogoutIcon /></ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </>
        ) : (
          <>
            <ListItem button onClick={() => navigate('/login')}>
              <ListItemIcon><LoginIcon /></ListItemIcon>
              <ListItemText primary="Login" />
            </ListItem>
            <ListItem button onClick={() => navigate('/register')}>
              <ListItemIcon><RegisterIcon /></ListItemIcon>
              <ListItemText primary="Register" />
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );
  
  // Function to render notification icon based on type
  const getNotificationIcon = (type) => {
    switch(type) {
      case 'COMMENT':
        return <CommentIcon color="primary" />;
      case 'LIKE':
        return <LikeIcon color="error" />;
      case 'FOLLOW':
        return <PersonIcon color="success" />;
      default:
        return <NotificationsIcon />;
    }
  };

  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          {isMobile && (
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
          )}
          
          <Typography
            variant="h6"
            component="div"
            sx={{ 
              flexGrow: 1, 
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
            onClick={() => navigate('/')}
          >
            SkillShare
          </Typography>
          

          {isAuthenticated ? (
            <>
              <Tooltip title="Create Post">
                <IconButton 
                  color="inherit" 
                  onClick={() => navigate('/create-post')}
                  sx={{ mr: 1 }}
                >
                  <CreateIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Notifications">
                <IconButton 
                  color="inherit" 
                  sx={{ mr: 1 }}
                  onClick={handleNotificationsOpen}
                >
                  <Badge badgeContent={unreadCount?.data || 0} color="error">
                    <NotificationsIcon />
                  </Badge>
                </IconButton>
              </Tooltip>
              
              <Popover
                open={Boolean(notificationsAnchor)}
                anchorEl={notificationsAnchor}
                onClose={handleNotificationsClose}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <Paper sx={{ width: 320, maxHeight: 400, overflow: 'auto' }}>
                  <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="h6">Notifications</Typography>
                    <Button size="small" onClick={handleMarkAllAsRead}>
                      Mark All as Read
                    </Button>
                  </Box>
                  <Divider />
                  <List sx={{ py: 0 }}>
                    {notifications?.data?.content?.length > 0 ? (
                      notifications.data.content.map((notification) => (
                        <ListItem 
                          key={notification.id}
                          button 
                          onClick={() => handleNotificationClick(notification)}
                          sx={{
                            bgcolor: notification.read ? 'transparent' : 'action.hover',
                          }}
                        >
                          <ListItemAvatar>
                            <Avatar>
                              {getNotificationIcon(notification.type)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText 
                            primary={notification.content}
                            secondary={format(new Date(notification.createdAt), 'MMM d, yyyy • h:mm a')}
                          />
                        </ListItem>
                      ))
                    ) : (
                      <ListItem>
                        <ListItemText primary="No notifications" />
                      </ListItem>
                    )}
                  </List>
                </Paper>
              </Popover>
              
              <Tooltip title="Profile">
                <IconButton
                  onClick={handleProfileMenuOpen}
                  size="small"
                  edge="end"
                >
                  <Avatar 
                    alt={currentUser?.name}
                    src={getFullImageUrl(currentUser.profilePicture) || '/default-avatar.png'}                    
                    sx={{ width: 32, height: 32 }}
                  />
                </IconButton>
              </Tooltip>
              
              <Menu
                anchorEl={profileMenuAnchor}
                open={Boolean(profileMenuAnchor)}
                onClose={handleProfileMenuClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={() => {
                  handleProfileMenuClose();
                  navigate(`/profile/${currentUser.id}`);
                }}>
                  <ListItemIcon>
                    <AccountIcon fontSize="small" />
                  </ListItemIcon>
                  My Profile
                </MenuItem>
                <MenuItem onClick={() => {
                  handleProfileMenuClose();
                  navigate('/edit-profile');
                }}>
                  <ListItemIcon>
                    <CreateIcon fontSize="small" />
                  </ListItemIcon>
                  Edit Profile
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Box>
              <Button 
                color="inherit" 
                onClick={() => navigate('/login')}
                sx={{ mr: 1 }}
              >
                Login
              </Button>
              <Button 
                variant="contained" 
                color="secondary" 
                onClick={() => navigate('/register')}
              >
                Register
              </Button>
            </Box>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true, // Better mobile performance
        }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: 250 },
        }}
      >
        {drawer}
      </Drawer>

      <Container component="main" sx={{ py: 3, flexGrow: 1 }}>
        <Outlet />
      </Container>

      <Box component="footer" sx={{ py: 3, bgcolor: 'background.paper', textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          © {new Date().getFullYear()} SkillShare - Connect, Learn, Grow
        </Typography>
      </Box>
    </>
  );
}
