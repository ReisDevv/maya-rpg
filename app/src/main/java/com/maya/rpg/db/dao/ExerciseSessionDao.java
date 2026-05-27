package com.maya.rpg.db.dao;

import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.Query;
import com.maya.rpg.db.entity.ExerciseSession;
import java.util.List;

@Dao
public interface ExerciseSessionDao {

    @Insert
    void insert(ExerciseSession session);

    @Query("SELECT * FROM exercise_sessions WHERE patientId = :patientId ORDER BY completedAt DESC")
    List<ExerciseSession> getByPatient(String patientId);

    // Sessões dos últimos 7 dias para o gráfico semanal
    @Query("SELECT * FROM exercise_sessions WHERE patientId = :patientId AND completedAt >= :since ORDER BY completedAt DESC")
    List<ExerciseSession> getByPatientSince(String patientId, long since);

    // Total de sessões por prescrição (para estatísticas)
    @Query("SELECT COUNT(*) FROM exercise_sessions WHERE patientId = :patientId AND prescriptionId = :prescriptionId")
    int countByPrescription(String patientId, String prescriptionId);

    // Buscar sessões não sincronizadas
    @Query("SELECT * FROM exercise_sessions WHERE isSynced = 0")
    List<ExerciseSession> getUnsyncedSessions();

    // Marcar sessões como sincronizadas
    @Query("UPDATE exercise_sessions SET isSynced = 1 WHERE id IN (:ids)")
    void markAsSynced(List<Integer> ids);

    // Apaga sessões já sincronizadas de um paciente — usado para refrescar o cache
    // a partir da fonte de verdade (API). Mantém pendentes (isSynced = 0) intactas
    // para não perder check-ins ainda não enviados ao backend.
    @Query("DELETE FROM exercise_sessions WHERE patientId = :patientId AND isSynced = 1")
    void deleteByPatient(String patientId);
}
