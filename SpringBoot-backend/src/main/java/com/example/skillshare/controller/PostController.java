package com.example.skillshare.controller;

import com.example.skillshare.dto.CommentDto;
import com.example.skillshare.dto.PostDto;
import com.example.skillshare.model.Comment;
import com.example.skillshare.model.Post;
import com.example.skillshare.model.User;
import com.example.skillshare.repository.UserRepository;
import com.example.skillshare.service.CommentService;
import com.example.skillshare.service.FileStorageService;
import com.example.skillshare.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
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
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final CommentService commentService;
    private final FileStorageService fileStorageService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Page<Post>> getAllPosts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<Post> posts = postService.getAllPosts(pageable);
        enrichPostsWithUserData(posts);
        return ResponseEntity.ok(posts);
    }

    @GetMapping("/feed")
    public ResponseEntity<Page<Post>> getFeedPosts(
            @AuthenticationPrincipal UserDetails currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<Post> posts = postService.getFeedPosts(currentUser.getUsername(), pageable);
        enrichPostsWithUserData(posts);
        return ResponseEntity.ok(posts);
    }

    @GetMapping("/{postId}")
    public ResponseEntity<Post> getPostById(@PathVariable String postId) {
        Post post = postService.getPostById(postId);
        enrichPostWithUserData(post);
        return ResponseEntity.ok(post);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<Page<Post>> getPostsByUserId(
            @PathVariable String userId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<Post> posts = postService.getPostsByUserId(userId, pageable);
        enrichPostsWithUserData(posts);
        return ResponseEntity.ok(posts);
    }

    @PostMapping
    public ResponseEntity<Post> createPost(
            @AuthenticationPrincipal UserDetails currentUser,
            @RequestParam("content") String content,
            @RequestParam(value = "skillCategory", required = false) String skillCategory,
            @RequestParam(value = "files", required = false) MultipartFile[] files) {

        System.out.println("Received create post request from: " + currentUser.getUsername());
        System.out.println("Content: " + content);
        System.out.println("Skill Category: " + skillCategory);

        List<String> mediaUrls = new ArrayList<>();

        if (files != null) {
            System.out.println("Files count: " + files.length);
            for (MultipartFile file : files) {
                String fileUrl = fileStorageService.storeFile(file);
                mediaUrls.add(fileUrl);
            }
        }

        PostDto postDto = new PostDto();
        postDto.setContent(content);
        postDto.setSkillCategory(skillCategory);
        postDto.setMediaUrls(mediaUrls);

        Post post = postService.createPost(currentUser.getUsername(), postDto);
        enrichPostWithUserData(post);
        return ResponseEntity.ok(post);
    }

    @PutMapping("/{postId}")
    public ResponseEntity<Post> updatePost(
            @AuthenticationPrincipal UserDetails currentUser,
            @PathVariable String postId,
            @RequestBody PostDto postDto) {

        // Get the existing post first
        Post existingPost = postService.getPostById(postId);

        // If no new media URLs are provided, preserve the existing ones
        if (postDto.getMediaUrls() == null || postDto.getMediaUrls().isEmpty()) {
            postDto.setMediaUrls(existingPost.getMediaUrls());
        }

        // Update the post
        Post post = postService.updatePost(currentUser.getUsername(), postId, postDto);
        enrichPostWithUserData(post);
        return ResponseEntity.ok(post);
    }

    @DeleteMapping("/{postId}")
    public ResponseEntity<?> deletePost(
            @AuthenticationPrincipal UserDetails currentUser,
            @PathVariable String postId) {

        postService.deletePost(currentUser.getUsername(), postId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{postId}/like")
    public ResponseEntity<?> likePost(
            @AuthenticationPrincipal UserDetails currentUser,
            @PathVariable String postId) {

        postService.likePost(currentUser.getUsername(), postId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{postId}/unlike")
    public ResponseEntity<?> unlikePost(
            @AuthenticationPrincipal UserDetails currentUser,
            @PathVariable String postId) {

        postService.unlikePost(currentUser.getUsername(), postId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{postId}/comments")
    public ResponseEntity<Map<String, Object>> getPostComments(
            @PathVariable String postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<Comment> comments = commentService.getCommentsByPostId(postId, pageable);

        // Enrich comments with user data
        for (Comment comment : comments.getContent()) {
            User user = userRepository.findById(comment.getUserId()).orElse(null);
            if (user != null) {
                comment.setUserName(user.getName());
                comment.setUsername(user.getUsername());
                comment.setUserProfilePicture(user.getProfilePicture());
            }
        }

        Map<String, Object> response = new HashMap<>();
        response.put("content", comments.getContent());
        response.put("totalElements", comments.getTotalElements());
        response.put("totalPages", comments.getTotalPages());
        response.put("currentPage", comments.getNumber());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/{postId}/comments")
    public ResponseEntity<Comment> addComment(
            @AuthenticationPrincipal UserDetails currentUser,
            @PathVariable String postId,
            @RequestBody CommentDto commentDto) {

        System.out.println("Adding comment to post: " + postId);
        System.out.println("By user: " + currentUser.getUsername());
        System.out.println("Comment content: " + commentDto.getContent());

        Comment comment = commentService.addComment(currentUser.getUsername(), postId, commentDto);

        // Enrich with user data
        User user = userRepository.findByEmail(currentUser.getUsername()).orElse(null);
        if (user != null) {
            comment.setUserName(user.getName());
            comment.setUsername(user.getUsername());
            comment.setUserProfilePicture(user.getProfilePicture());
        }

        return ResponseEntity.ok(comment);
    }

    // Helper methods to enrich posts with user data
    private void enrichPostsWithUserData(Page<Post> posts) {
        for (Post post : posts.getContent()) {
            enrichPostWithUserData(post);
        }
    }

    private void enrichPostWithUserData(Post post) {
        User user = userRepository.findById(post.getUserId()).orElse(null);
        if (user != null) {
            post.setUserName(user.getName());
            post.setUsername(user.getUsername());
            post.setUserProfilePicture(user.getProfilePicture());
        }
    }
}
