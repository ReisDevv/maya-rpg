package com.maya.rpg.db;

import android.content.Context;
import androidx.work.Constraints;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.WorkManager;
import com.maya.rpg.worker.SyncWorker;
import com.google.gson.Gson;
import com.google.gson.reflect.TypeToken;
import com.maya.rpg.db.entity.CachedPrescription;
import com.maya.rpg.model.Prescription;
import java.lang.reflect.Type;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Gerencia o cache local de prescrições no Room.
 * Todas as operações de banco são feitas em thread de fundo.
 */
public class OfflineManager {

    private static final Gson gson = new Gson();
    private static final ExecutorService executor = Executors.newSingleThreadExecutor();

    public interface Callback<T> {
        void onResult(T result);
    }

    /** Persiste lista de prescrições no cache local. */
    public static void cachePrescriptions(Context context, String patientId,
                                          List<Prescription> prescriptions) {
        executor.execute(() -> {
            AppDatabase db = AppDatabase.getInstance(context);
            List<CachedPrescription> entities = new ArrayList<>();
            long now = System.currentTimeMillis();

            for (Prescription p : prescriptions) {
                CachedPrescription cp = new CachedPrescription();
                cp.id = p.getId();
                cp.patientId = patientId;
                cp.title = p.getTitle();
                cp.description = p.getDescription();
                cp.exercisesJson = gson.toJson(p.getExercises());
                cp.startDate = p.getStartDate();
                cp.endDate = p.getEndDate();
                cp.isActive = p.isActive();
                cp.cachedAt = now;
                entities.add(cp);
            }

            db.cachedPrescriptionDao().deleteByPatient(patientId);
            db.cachedPrescriptionDao().insertAll(entities);
        });
    }

    /** Lê prescrições do cache local em thread de fundo e retorna na callback (main thread). */
    public static void loadCachedPrescriptions(Context context, String patientId,
                                               android.os.Handler mainHandler,
                                               Callback<List<Prescription>> callback) {
        executor.execute(() -> {
            AppDatabase db = AppDatabase.getInstance(context);
            List<CachedPrescription> cached = db.cachedPrescriptionDao().getByPatient(patientId);
            List<Prescription> result = new ArrayList<>();

            Type listType = new TypeToken<List<Prescription.PrescriptionExercise>>() {}.getType();

            for (CachedPrescription cp : cached) {
                Prescription p = new Prescription();
                p.setId(cp.id);
                p.setPatientId(cp.patientId);
                p.setTitle(cp.title);
                p.setDescription(cp.description);
                p.setStartDate(cp.startDate);
                p.setEndDate(cp.endDate);
                p.setActive(cp.isActive);
                if (cp.exercisesJson != null) {
                    p.setExercises(gson.fromJson(cp.exercisesJson, listType));
                }
                result.add(p);
            }

            mainHandler.post(() -> callback.onResult(result));
        });
    }

    /** Dispara uma sincronização imediata dos check-ins pendentes. */
    public static void triggerSync(Context context) {
        Constraints constraints = new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.CONNECTED)
                .build();

        OneTimeWorkRequest syncRequest = new OneTimeWorkRequest.Builder(SyncWorker.class)
                .setConstraints(constraints)
                .build();

        WorkManager.getInstance(context).enqueue(syncRequest);
    }
}
