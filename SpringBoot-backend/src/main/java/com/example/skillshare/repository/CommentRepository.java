package com.example.skillshare.repository;

import com.example.skillshare.model.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface CommentRepository extends MongoRepository<Comment, String> {
    Page<Comment> findByPostIdOrderByCreatedAtDesc(String postId, Pageable pageable);

    void deleteByPostId(String postId);

    int countByPostId(String postId);
}
