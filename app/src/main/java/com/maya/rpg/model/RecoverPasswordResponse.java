package com.maya.rpg.model;

import com.google.gson.annotations.SerializedName;

@SuppressWarnings("unused")
public class RecoverPasswordResponse {
    @SerializedName("message")
    private String message;

    @SerializedName("requestId")
    private String requestId;

    @SerializedName("devToken")
    private String devToken; // Mantido para compatibilidade se o backend ainda enviar

    public String getMessage() {
        return message;
    }

    public String getRequestId() {
        return requestId;
    }

    public String getDevToken() {
        return devToken;
    }
}
