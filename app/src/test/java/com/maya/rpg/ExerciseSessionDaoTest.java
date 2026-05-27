package com.maya.rpg;

import static org.junit.Assert.*;

import com.maya.rpg.db.entity.ExerciseSession;

import org.junit.Before;
import org.junit.Test;

public class ExerciseSessionDaoTest {

    private ExerciseSession session;

    @Before
    public void setUp() {
        session = new ExerciseSession();
        session.setPatientId("patient-1");
        session.setPrescriptionId("prescription-1");
        session.setExerciseId("exercise-1");
        session.setCompletedAt(System.currentTimeMillis());
        session.setCompleted(true);
        session.setPainLevel(5);
        session.setNotes("Dor moderada");
        session.setSynced(false);
    }

    @Test
    public void exerciseSessionHoldsAllFields() {
        assertEquals("patient-1", session.getPatientId());
        assertEquals("prescription-1", session.getPrescriptionId());
        assertEquals("exercise-1", session.getExerciseId());
        assertTrue(session.isCompleted());
        assertEquals(5, session.getPainLevel());
        assertEquals("Dor moderada", session.getNotes());
        assertFalse(session.isSynced());
    }

    @Test
    public void painLevelBoundaryZero() {
        session.setPainLevel(0);
        assertEquals(0, session.getPainLevel());
    }

    @Test
    public void painLevelBoundaryTen() {
        session.setPainLevel(10);
        assertEquals(10, session.getPainLevel());
    }

    @Test
    public void syncedFlagToggles() {
        session.setSynced(false);
        assertFalse(session.isSynced());
        session.setSynced(true);
        assertTrue(session.isSynced());
    }

    @Test
    public void notesCanBeNullOrEmpty() {
        session.setNotes(null);
        assertNull(session.getNotes());
        session.setNotes("");
        assertEquals("", session.getNotes());
    }
}
