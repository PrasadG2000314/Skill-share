package com.example.skillshare.model;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Data
@Document(collection = "users")
public class User {
    @Id
    private String id;
    private String name;
    private String email;
    private String username;
    private String password;
    private String role;
    private String bio;
    private String location;
    private String provider;
    private String providerId;
    private String profilePicture;
    private String coverPicture;
    private List<String> skills = new ArrayList<>();
    private List<String> interests = new ArrayList<>();
    private List<String> followers = new ArrayList<>();
    private List<String> following = new ArrayList<>();
    private Date createdAt;
    private Date updatedAt;
}
