package com.example.skillshare.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
public class Notification {
    @Id
    private String id;
    private String userId;
    private String senderId;
    private String type; // LIKE, COMMENT, FOLLOW, LEARNING_UPDATE
    private String content;
    private String entityId; // postId, commentId, etc.
    private boolean read = false;
    private Date createdAt = new Date();
}
