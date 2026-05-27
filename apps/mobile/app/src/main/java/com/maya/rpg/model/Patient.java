package com.maya.rpg.model;

import com.google.gson.annotations.SerializedName;

public class Patient {
    @SerializedName("id")
    private String id;

    @SerializedName("fullName")
    private String fullName;

    @SerializedName("email")
    private String email;

    @SerializedName("phone")
    private String phone;

    @SerializedName("cpf")
    private String cpf;

    @SerializedName("birthDate")
    private String birthDate;

    @SerializedName("status")
    private String status;

    @SerializedName("notes")
    private String notes;

    public String getId() { return id; }
    public String getFullName() { return fullName; }
    public String getName() { return fullName; } // Alias para compatibilidade
    public String getEmail() { return email; }
    public String getPhone() { return phone; }
    public String getCpf() { return cpf; }
    public String getBirthDate() { return birthDate; }
    public String getStatus() { return status; }
    public String getNotes() { return notes; }
    public String getProfilePhotoUrl() { return null; } // placeholder — API ainda não retorna campo de foto
}