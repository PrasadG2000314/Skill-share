package com.example.skillshare.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.Transient;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "posts")
public class Post {
    @Id
    private String id;
    private String userId;
    private String content;
    private List<String> mediaUrls = new ArrayList<>();
    private String skillCategory;
    private int likesCount = 0;
    private int commentsCount = 0;
    private List<String> likedBy = new ArrayList<>();
    private Date createdAt = new Date();
    private Date updatedAt = new Date();

    // Transient fields for user information
    @Transient
    private String userName;
    @Transient
    private String username;
    @Transient
    private String userProfilePicture;

    // Manual getters and setters for transient fields
    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getUserProfilePicture() {
        return userProfilePicture;
    }

    public void setUserProfilePicture(String userProfilePicture) {
        this.userProfilePicture = userProfilePicture;
    }
}
