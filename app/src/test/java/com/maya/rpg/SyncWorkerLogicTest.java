package com.maya.rpg;

import static org.junit.Assert.*;

import com.maya.rpg.model.CheckInRequest;
import com.maya.rpg.db.entity.ExerciseSession;

import org.junit.Test;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

public class SyncWorkerLogicTest {

    @Test
    public void exerciseSessionToCheckInRequestMapping() {
        ExerciseSession session = new ExerciseSession();
        session.setPatientId("patient-1");
        session.setPrescriptionId("prescription-1");
        session.setExerciseId("exercise-1");
        session.setPainLevel(4);
        session.setNotes("Leve desconforto");
        session.setCompletedAt(1746271200000L);

        SimpleDateFormat isoFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        isoFormat.setTimeZone(TimeZone.getTimeZone("UTC"));
        String isoDate = isoFormat.format(new Date(session.getCompletedAt()));

 CheckInRequest request = new CheckInRequest(
 session.getPrescriptionId(),
 session.getExerciseId(),
 session.getPainLevel(),
 session.getNotes(),
 true,
 isoDate
 );

        assertEquals("prescription-1", request.getPrescriptionId());
        assertEquals("exercise-1", request.getExerciseId());
        assertEquals(4, request.getPainLevel());
        assertEquals("Leve desconforto", request.getNotes());
        assertNotNull(request.getExecutedAt());
    }

    @Test
    public void batchExcludesSessionsWithoutExerciseId() {
        List<ExerciseSession> sessions = new ArrayList<>();

        ExerciseSession valid = new ExerciseSession();
        valid.setExerciseId("exercise-1");
        valid.setPrescriptionId("prescription-1");
        valid.setPainLevel(3);
        valid.setCompletedAt(System.currentTimeMillis());
        sessions.add(valid);

        ExerciseSession noExerciseId = new ExerciseSession();
        noExerciseId.setExerciseId(null);
        noExerciseId.setPrescriptionId("prescription-1");
        noExerciseId.setPainLevel(2);
        noExerciseId.setCompletedAt(System.currentTimeMillis());
        sessions.add(noExerciseId);

        ExerciseSession emptyExerciseId = new ExerciseIdSession();
        emptyExerciseId.setExerciseId("");
        emptyExerciseId.setPrescriptionId("prescription-1");
        emptyExerciseId.setPainLevel(1);
        emptyExerciseId.setCompletedAt(System.currentTimeMillis());
        sessions.add(emptyExerciseId);

        List<ExerciseSession> filtered = new ArrayList<>();
        for (ExerciseSession s : sessions) {
            if (s.getExerciseId() != null && !s.getExerciseId().trim().isEmpty()) {
                filtered.add(s);
            }
        }

        assertEquals(1, filtered.size());
        assertEquals("exercise-1", filtered.get(0).getExerciseId());
    }

    private static class ExerciseIdSession extends ExerciseSession {}
}
