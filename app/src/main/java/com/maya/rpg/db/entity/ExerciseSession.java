package com.maya.rpg.db.entity;

import androidx.room.Entity;
import androidx.room.Ignore;
import androidx.room.PrimaryKey;
import com.google.gson.annotations.SerializedName;

@Entity(tableName = "exercise_sessions")
public class ExerciseSession {
    @PrimaryKey(autoGenerate = true)
    public int id;

 public String patientId;
 public String prescriptionId;
 public String exerciseId;
 public long completedAt;

 @SerializedName("isCompleted")
 public boolean completed;

 public int painLevel;
 public int feelingLevel;
 public String notes;

 @SerializedName("isSynced")
 public boolean isSynced;

    @Ignore
    @SerializedName("executedAt")
    public String executedAtIso;

    public ExerciseSession() {}

    public void setPatientId(String patientId) { this.patientId = patientId; }
    public void setPrescriptionId(String prescriptionId) { this.prescriptionId = prescriptionId; }
    public void setExerciseId(String exerciseId) { this.exerciseId = exerciseId; }
    public void setCompletedAt(long completedAt) { this.completedAt = completedAt; }
    public void setCompleted(boolean completed) { this.completed = completed; }
    public void setPainLevel(int painLevel) { this.painLevel = painLevel; }
    public void setFeelingLevel(int feelingLevel) { this.feelingLevel = feelingLevel; }
    public void setNotes(String notes) { this.notes = notes; }
    public void setSynced(boolean synced) { this.isSynced = synced; }

    public String getPatientId() { return patientId; }
    public String getPrescriptionId() { return prescriptionId; }
    public String getExerciseId() { return exerciseId; }
    public long getCompletedAt() { return completedAt; }
    public boolean isCompleted() { return completed; }
    public int getPainLevel() { return painLevel; }
    public int getFeelingLevel() { return feelingLevel; }
    public String getNotes() { return notes; }
    public boolean isSynced() { return isSynced; }
    public String getExecutedAtIso() { return executedAtIso; }
}
