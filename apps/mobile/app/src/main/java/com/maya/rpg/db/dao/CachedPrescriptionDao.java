package com.maya.rpg.db.dao;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import com.maya.rpg.db.entity.CachedPrescription;
import java.util.List;

@Dao
public interface CachedPrescriptionDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insertAll(List<CachedPrescription> prescriptions);

    @Query("SELECT * FROM cached_prescriptions WHERE patientId = :patientId ORDER BY cachedAt DESC")
    List<CachedPrescription> getByPatient(String patientId);

    @Query("DELETE FROM cached_prescriptions WHERE patientId = :patientId")
    void deleteByPatient(String patientId);
}
