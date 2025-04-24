package com.example.skillshare.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class JwtAuthResponse {
    private String accessToken;
    private String tokenType = "Bearer";
    private String userId;

    public JwtAuthResponse(String accessToken, String userId) {
        this.accessToken = accessToken;
        this.userId = userId;
    }
}
