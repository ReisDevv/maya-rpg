package com.maya.rpg.model;

import com.google.gson.annotations.SerializedName;
import java.util.List;

public class FullPrescriptionsResponse {
    @SerializedName("data")
    private List<Prescription> data;

    @SerializedName("total")
    private int total;

    @SerializedName("patientId")
    private String patientId;

    @SerializedName("generatedAt")
    private String generatedAt;

    public List<Prescription> getData() {
        return data;
    }

    public int getTotal() {
        return total;
    }

    public String getPatientId() {
        return patientId;
    }

    public String getGeneratedAt() {
        return generatedAt;
    }
}
