package com.maya.rpg.db.entity;

import androidx.room.Entity;
import androidx.room.PrimaryKey;
import androidx.annotation.NonNull;

@Entity(tableName = "cached_prescriptions")
public class CachedPrescription {

    @PrimaryKey
    @NonNull
    public String id;

    public String patientId;
    public String title;
    public String description;
    public String exercisesJson; // Gson serializado
    public String startDate;
    public String endDate;
    public boolean isActive;
    public long cachedAt; // System.currentTimeMillis()

    public CachedPrescription() {}
}
