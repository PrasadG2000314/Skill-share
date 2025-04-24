package com.example.skillshare.service;

import com.example.skillshare.dto.UserProfileDto;
import com.example.skillshare.model.User;
import com.example.skillshare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

        private final UserRepository userRepository;

        public User updateUserProfile(String email, UserProfileDto userProfileDto) {
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                // Update user profile
                user.setName(userProfileDto.getName());
                user.setUsername(userProfileDto.getUsername());
                user.setBio(userProfileDto.getBio());
                user.setLocation(userProfileDto.getLocation());
                user.setSkills(userProfileDto.getSkills());
                user.setInterests(userProfileDto.getInterests());
                user.setUpdatedAt(new Date());

                return userRepository.save(user);
        }

        public User updateProfilePicture(String email, String imageUrl) {
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                user.setProfilePicture(imageUrl);
                user.setUpdatedAt(new Date());

                return userRepository.save(user);
        }

        public User updateCoverPicture(String email, String imageUrl) {
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                user.setCoverPicture(imageUrl);
                user.setUpdatedAt(new Date());

                return userRepository.save(user);
        }

        public void followUser(String followerEmail, String followedUserId) {
                User follower = userRepository.findByEmail(followerEmail)
                                .orElseThrow(() -> new RuntimeException("Follower user not found"));

                // Prevent users from following themselves
                if (follower.getId().equals(followedUserId)) {
                        throw new IllegalArgumentException("Users cannot follow themselves");
                }

                User followed = userRepository.findById(followedUserId)
                                .orElseThrow(() -> new RuntimeException("User to follow not found"));

                if (!follower.getFollowing().contains(followedUserId)) {
                        follower.getFollowing().add(followedUserId);
                        userRepository.save(follower);

                        followed.getFollowers().add(follower.getId());
                        userRepository.save(followed);
                }
        }

        public void unfollowUser(String followerEmail, String followedUserId) {
                User follower = userRepository.findByEmail(followerEmail)
                                .orElseThrow(() -> new RuntimeException("Follower user not found"));

                User followed = userRepository.findById(followedUserId)
                                .orElseThrow(() -> new RuntimeException("User to unfollow not found"));

                follower.getFollowing().remove(followedUserId);
                userRepository.save(follower);

                followed.getFollowers().remove(follower.getId());
                userRepository.save(followed);
        }

        public List<User> getUserFollowers(String userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                return user.getFollowers().stream()
                                .map(followerId -> userRepository.findById(followerId)
                                                .orElseThrow(() -> new RuntimeException("Follower not found")))
                                .collect(Collectors.toList());
        }

        public List<User> getUserFollowing(String userId) {
                User user = userRepository.findById(userId)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                return user.getFollowing().stream()
                                .map(followingId -> userRepository.findById(followingId)
                                                .orElseThrow(() -> new RuntimeException("Following user not found")))
                                .collect(Collectors.toList());
        }
}
