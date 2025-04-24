package com.example.skillshare.dto;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class UserProfileDto {
    private String name;
    private String username;
    private String email;
    private String bio;
    private String location;
    private List<String> skills = new ArrayList<>();
    private List<String> interests = new ArrayList<>();
}
