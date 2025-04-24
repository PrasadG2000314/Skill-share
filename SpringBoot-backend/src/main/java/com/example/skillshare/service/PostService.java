package com.example.skillshare.service;

import com.example.skillshare.dto.PostDto;
import com.example.skillshare.model.Notification;
import com.example.skillshare.model.Post;
import com.example.skillshare.model.User;
import com.example.skillshare.repository.CommentRepository;
import com.example.skillshare.repository.NotificationRepository;
import com.example.skillshare.repository.PostRepository;
import com.example.skillshare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final NotificationRepository notificationRepository;

    public Page<Post> getAllPosts(Pageable pageable) {
        return postRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    public Post getPostById(String postId) {
        return postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));
    }

    public Page<Post> getPostsByUserId(String userId, Pageable pageable) {
        return postRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
    }

    public Page<Post> getFeedPosts(String email, Pageable pageable) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        List<String> followingIds = user.getFollowing();
        followingIds.add(user.getId()); // Include user's own posts

        return postRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    public Post createPost(String email, PostDto postDto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Post post = new Post();
        post.setUserId(user.getId());
        post.setContent(postDto.getContent());
        post.setSkillCategory(postDto.getSkillCategory());
        post.setMediaUrls(postDto.getMediaUrls());
        post.setCreatedAt(new Date());
        post.setUpdatedAt(new Date());

        return postRepository.save(post);
    }

    public Post updatePost(String email, String postId, PostDto postDto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getUserId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to update this post");
        }

        post.setContent(postDto.getContent());

        // Only update skill category if provided
        if (postDto.getSkillCategory() != null) {
            post.setSkillCategory(postDto.getSkillCategory());
        }

        // Only update media URLs if provided and not empty
        if (postDto.getMediaUrls() != null && !postDto.getMediaUrls().isEmpty()) {
            post.setMediaUrls(postDto.getMediaUrls());
        }

        post.setUpdatedAt(new Date());

        return postRepository.save(post);
    }

    public void deletePost(String email, String postId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getUserId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to delete this post");
        }

        // Delete all comments related to the post
        commentRepository.deleteByPostId(postId);

        postRepository.delete(post);
    }

    public void likePost(String email, String postId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (!post.getLikedBy().contains(user.getId())) {
            post.getLikedBy().add(user.getId());
            post.setLikesCount(post.getLikesCount() + 1);
            postRepository.save(post);

            // Create notification if the liker is not the post owner
            if (!user.getId().equals(post.getUserId())) {
                Notification notification = new Notification();
                notification.setUserId(post.getUserId());
                notification.setSenderId(user.getId());
                notification.setType("LIKE");
                notification.setContent(user.getName() + " liked your post");
                notification.setEntityId(postId);
                notification.setCreatedAt(new Date());

                notificationRepository.save(notification);
            }
        }
    }

    public void unlikePost(String email, String postId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        if (post.getLikedBy().contains(user.getId())) {
            post.getLikedBy().remove(user.getId());
            post.setLikesCount(Math.max(0, post.getLikesCount() - 1));
            postRepository.save(post);
        }
    }
}
