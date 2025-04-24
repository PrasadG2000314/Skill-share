package com.example.skillshare.controller;

import com.example.skillshare.dto.UserProfileDto;
import com.example.skillshare.model.User;
import com.example.skillshare.repository.UserRepository;
import com.example.skillshare.service.FileStorageService;
import com.example.skillshare.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final UserService userService;
    private final FileStorageService fileStorageService;

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal UserDetails currentUser) {
        String email = currentUser.getUsername();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return ResponseEntity.ok(user);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getUserProfile(
            @PathVariable String userId,
            @AuthenticationPrincipal UserDetails currentUser) {

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> response = new HashMap<>();
        Map<String, Object> userData = new HashMap<>();

        // Manually populate userData with fields from user
        userData.put("id", user.getId());
        userData.put("name", user.getName());
        userData.put("email", user.getEmail());
        userData.put("username", user.getUsername());
        userData.put("bio", user.getBio());
        userData.put("location", user.getLocation());
        userData.put("profilePicture", user.getProfilePicture());
        userData.put("coverPicture", user.getCoverPicture());
        userData.put("skills", user.getSkills());
        userData.put("interests", user.getInterests());
        userData.put("followerCount", user.getFollowers().size());
        userData.put("followingCount", user.getFollowing().size());
        userData.put("createdAt", user.getCreatedAt());
        userData.put("updatedAt", user.getUpdatedAt());

        // Add isFollowing flag if authenticated
        if (currentUser != null) {
            String currentEmail = currentUser.getUsername();
            User currentUserEntity = userRepository.findByEmail(currentEmail)
                    .orElse(null);

            if (currentUserEntity != null) {
                boolean isFollowing = currentUserEntity.getFollowing().contains(userId);
                userData.put("isFollowing", isFollowing);
            }
        }

        response.put("data", userData);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @AuthenticationPrincipal UserDetails currentUser,
            @RequestBody UserProfileDto userProfileDto) {

        String email = currentUser.getUsername();
        User updatedUser = userService.updateUserProfile(email, userProfileDto);
        return ResponseEntity.ok(updatedUser);
    }

    // Only the profile picture and cover photo methods need updates:

    @PostMapping("/profile/picture")
    public ResponseEntity<?> updateProfilePicture(
            @AuthenticationPrincipal UserDetails currentUser,
            @RequestParam("profilePicture") MultipartFile file) {

        String email = currentUser.getUsername();
        String imageUrl = fileStorageService.storeFile(file);
        User updatedUser = userService.updateProfilePicture(email, imageUrl);

        // Return the full user object with updated profile picture
        Map<String, Object> response = new HashMap<>();
        response.put("data", updatedUser);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/profile/cover")
    public ResponseEntity<?> updateCoverPicture(
            @AuthenticationPrincipal UserDetails currentUser,
            @RequestParam("coverPhoto") MultipartFile file) {

        String email = currentUser.getUsername();
        String imageUrl = fileStorageService.storeFile(file);
        User updatedUser = userService.updateCoverPicture(email, imageUrl);

        // Return the full user object with updated cover photo
        Map<String, Object> response = new HashMap<>();
        response.put("data", updatedUser);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{userId}/follow")
    public ResponseEntity<?> followUser(
            @AuthenticationPrincipal UserDetails currentUser,
            @PathVariable String userId) {

        String email = currentUser.getUsername();
        User currentUserEntity = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Current user not found"));

        // Prevent users from following themselves
        if (currentUserEntity.getId().equals(userId)) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", "Users cannot follow themselves");
            return ResponseEntity.badRequest().body(errorResponse);
        }

        userService.followUser(email, userId);

        // Get the updated user data with isFollowing flag
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> response = new HashMap<>();
        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("name", user.getName());
        userData.put("username", user.getUsername() != null ? user.getUsername() : "");
        userData.put("followerCount", user.getFollowers().size());
        userData.put("followingCount", user.getFollowing().size());
        userData.put("isFollowing", true);

        response.put("data", userData);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{userId}/follow")
    public ResponseEntity<?> unfollowUser(
            @AuthenticationPrincipal UserDetails currentUser,
            @PathVariable String userId) {

        String email = currentUser.getUsername();
        userService.unfollowUser(email, userId);

        // Get the updated user data with isFollowing flag
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Map<String, Object> response = new HashMap<>();
        Map<String, Object> userData = new HashMap<>();
        userData.put("id", user.getId());
        userData.put("name", user.getName());
        userData.put("username", user.getUsername() != null ? user.getUsername() : "");
        userData.put("followerCount", user.getFollowers().size());
        userData.put("followingCount", user.getFollowing().size());
        userData.put("isFollowing", false);

        response.put("data", userData);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{userId}/followers")
    public ResponseEntity<?> getUserFollowers(
            @PathVariable String userId,
            @AuthenticationPrincipal UserDetails currentUser) {

        List<User> followers = userService.getUserFollowers(userId);
        List<Map<String, Object>> followerList = new ArrayList<>();

        // Get the current user's following list to check if the current user follows
        // each follower
        String currentEmail = currentUser != null ? currentUser.getUsername() : null;
        List<String> currentUserFollowing = new ArrayList<>();

        if (currentEmail != null) {
            User currentUserEntity = userRepository.findByEmail(currentEmail)
                    .orElse(null);
            if (currentUserEntity != null) {
                currentUserFollowing = currentUserEntity.getFollowing();
            }
        }

        // Convert each follower to a map with required fields
        for (User follower : followers) {
            Map<String, Object> followerMap = new HashMap<>();
            followerMap.put("id", follower.getId());
            followerMap.put("name", follower.getName());
            followerMap.put("username", follower.getUsername() != null ? follower.getUsername() : "");
            followerMap.put("profilePicture", follower.getProfilePicture());
            followerMap.put("isFollowing", currentUserFollowing.contains(follower.getId()));

            followerList.add(followerMap);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("data", followerList);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{userId}/following")
    public ResponseEntity<?> getUserFollowing(
            @PathVariable String userId,
            @AuthenticationPrincipal UserDetails currentUser) {

        List<User> following = userService.getUserFollowing(userId);
        List<Map<String, Object>> followingList = new ArrayList<>();

        // Get the current user's following list to check if the current user follows
        // each followed user
        String currentEmail = currentUser != null ? currentUser.getUsername() : null;
        List<String> currentUserFollowing = new ArrayList<>();

        if (currentEmail != null) {
            User currentUserEntity = userRepository.findByEmail(currentEmail)
                    .orElse(null);
            if (currentUserEntity != null) {
                currentUserFollowing = currentUserEntity.getFollowing();
            }
        }

        // Convert each following to a map with required fields
        for (User followed : following) {
            Map<String, Object> followedMap = new HashMap<>();
            followedMap.put("id", followed.getId());
            followedMap.put("name", followed.getName());
            followedMap.put("username", followed.getUsername() != null ? followed.getUsername() : "");
            followedMap.put("profilePicture", followed.getProfilePicture());
            followedMap.put("isFollowing", currentUserFollowing.contains(followed.getId()));

            followingList.add(followedMap);
        }

        Map<String, Object> response = new HashMap<>();
        response.put("data", followingList);
        return ResponseEntity.ok(response);
    }

    // Skill management endpoints
    @PostMapping("/me/skills")
    public ResponseEntity<?> addSkill(
            @AuthenticationPrincipal UserDetails currentUser,
            @RequestBody Map<String, String> payload) {

        String email = currentUser.getUsername();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String skillName = payload.get("name");
        if (!user.getSkills().contains(skillName)) {
            user.getSkills().add(skillName);
            userRepository.save(user);
        }

        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/me/skills/{skillName}")
    public ResponseEntity<?> removeSkill(
            @AuthenticationPrincipal UserDetails currentUser,
            @PathVariable String skillName) {

        String email = currentUser.getUsername();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.getSkills().remove(skillName);
        userRepository.save(user);

        return ResponseEntity.ok(user);
    }
}
