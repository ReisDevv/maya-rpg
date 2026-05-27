package com.maya.rpg.model;

import com.google.gson.annotations.SerializedName;

@SuppressWarnings("unused")
public class ResetPasswordRequest {
    @SerializedName("requestId")
    private final String requestId;

    @SerializedName("code")
    private final String code;

    @SerializedName("newPassword")
    private final String newPassword;

    public ResetPasswordRequest(String requestId, String code, String newPassword) {
        this.requestId = requestId;
        this.code = code;
        this.newPassword = newPassword;
    }

    public String getRequestId() {
        return requestId;
    }

    public String getCode() {
        return code;
    }

    public String getNewPassword() {
        return newPassword;
    }
}
