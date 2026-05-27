package com.maya.rpg.model;

import com.google.gson.annotations.SerializedName;

public class ProfileUpdateRequest {
    @SerializedName("fullName")
    private final String fullName;

    @SerializedName("phone")
    private final String phone;

    @SerializedName("birthDate")
    private final String birthDate;

    public ProfileUpdateRequest(String fullName, String phone, String birthDate) {
        this.fullName = fullName;
        this.phone = phone;
        this.birthDate = birthDate;
    }
}
