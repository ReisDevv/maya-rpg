package com.maya.rpg.model;

import com.google.gson.annotations.SerializedName;

public class LoginResponse {
    @SerializedName("accessToken")
    private String accessToken;

    @SerializedName("refreshToken")
    private String refreshToken;

    @SerializedName("user")
    private UserData user;

    public String getAccessToken() { return accessToken; }
    public String getRefreshToken() { return refreshToken; }
    public UserData getUser() { return user; }

    public static class UserData {
        @SerializedName("id")
        private String id;

        @SerializedName("name")
        private String name;

        @SerializedName("email")
        private String email;

        @SerializedName("role")
        private String role;

        @SerializedName("isFirstAccess")
        private boolean isFirstAccess;

        @SerializedName("lgpdAcceptedAt")
        private String lgpdAcceptedAt;

        public String getId() { return id; }
        public String getName() { return name; }
        public String getEmail() { return email; }
        public String getRole() { return role; }
        public boolean isFirstAccess() { return isFirstAccess; }
        public String getLgpdAcceptedAt() { return lgpdAcceptedAt; }
        public boolean hasAcceptedLgpd() {
            return lgpdAcceptedAt != null && !lgpdAcceptedAt.isEmpty();
        }
    }
}