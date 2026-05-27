package com.maya.rpg.model;

import com.google.gson.annotations.SerializedName;

public class MedicalRecord {
    @SerializedName("id")
    private String id;

    @SerializedName("date")
    private String date;

    @SerializedName("chiefComplaint")
    private String chiefComplaint;

    @SerializedName("clinicalNotes")
    private String clinicalNotes;

    @SerializedName("painLevel")
    private Integer painLevel;

    @SerializedName("mobilityNotes")
    private String mobilityNotes;

    @SerializedName("postureAssessment")
    private String postureAssessment;

    @SerializedName("treatmentPlan")
    private String treatmentPlan;

    @SerializedName("createdAt")
    private String createdAt;

    public String getId() { return id; }
    public String getDate() { return date; }
    public String getChiefComplaint() { return chiefComplaint; }
    public String getClinicalNotes() { return clinicalNotes; }
    public Integer getPainLevel() { return painLevel; }
    public String getMobilityNotes() { return mobilityNotes; }
    public String getPostureAssessment() { return postureAssessment; }
    public String getTreatmentPlan() { return treatmentPlan; }
    public String getCreatedAt() { return createdAt; }
}
