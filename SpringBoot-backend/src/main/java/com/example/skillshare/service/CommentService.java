package com.example.skillshare.service;

import com.example.skillshare.dto.CommentDto;
import com.example.skillshare.model.Comment;
import com.example.skillshare.model.Notification;
import com.example.skillshare.model.Post;
import com.example.skillshare.model.User;
import com.example.skillshare.repository.CommentRepository;
import com.example.skillshare.repository.NotificationRepository;
import com.example.skillshare.repository.PostRepository;
import com.example.skillshare.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final NotificationRepository notificationRepository;

    public Comment getCommentById(String commentId) {
        return commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));
    }

    public Page<Comment> getCommentsByPostId(String postId, Pageable pageable) {
        Page<Comment> commentsPage = commentRepository.findByPostIdOrderByCreatedAtDesc(postId, pageable);

        // Enrich comments with user information
        List<Comment> enrichedComments = commentsPage.getContent().stream()
                .map(comment -> {
                    User user = userRepository.findById(comment.getUserId())
                            .orElse(null);
                    if (user != null) {
                        // Add user information to the comment
                        comment.setUserName(user.getName());
                        comment.setUserProfilePicture(user.getProfilePicture());
                    }
                    return comment;
                })
                .collect(Collectors.toList());

        return new PageImpl<>(enrichedComments, pageable, commentsPage.getTotalElements());
    }

    public Comment addComment(String email, String postId, CommentDto commentDto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new RuntimeException("Post not found"));

        Comment comment = new Comment();
        comment.setPostId(postId);
        comment.setUserId(user.getId());
        comment.setContent(commentDto.getContent());
        comment.setCreatedAt(new Date());
        comment.setUpdatedAt(new Date());

        // Add user information directly to the comment
        comment.setUserName(user.getName());
        comment.setUserProfilePicture(user.getProfilePicture());

        Comment savedComment = commentRepository.save(comment);

        // Update comment count in post
        post.setCommentsCount(post.getCommentsCount() + 1);
        postRepository.save(post);

        // Create notification if commenter is not the post owner
        if (!user.getId().equals(post.getUserId())) {
            Notification notification = new Notification();
            notification.setUserId(post.getUserId());
            notification.setSenderId(user.getId());
            notification.setType("COMMENT");
            notification.setContent(user.getName() + " commented on your post");
            notification.setEntityId(postId);
            notification.setCreatedAt(new Date());

            notificationRepository.save(notification);
        }

        return savedComment;
    }

    public Comment updateComment(String email, String commentId, CommentDto commentDto) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        if (!comment.getUserId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to update this comment");
        }

        comment.setContent(commentDto.getContent());
        comment.setUpdatedAt(new Date());

        return commentRepository.save(comment);
    }

    public void deleteComment(String email, String commentId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found"));

        if (!comment.getUserId().equals(user.getId())) {
            throw new RuntimeException("You are not authorized to delete this comment");
        }

        Post post = postRepository.findById(comment.getPostId())
                .orElseThrow(() -> new RuntimeException("Post not found"));

        // Update comment count in post
        post.setCommentsCount(Math.max(0, post.getCommentsCount() - 1));
        postRepository.save(post);

        commentRepository.delete(comment);
    }
}
