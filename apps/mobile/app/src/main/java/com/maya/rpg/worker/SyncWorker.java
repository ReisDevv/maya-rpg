package com.maya.rpg.worker;

import android.content.Context;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import com.maya.rpg.api.ApiService;
import com.maya.rpg.api.RetrofitClient;
import com.maya.rpg.db.AppDatabase;
import com.maya.rpg.db.entity.ExerciseSession;
import com.maya.rpg.model.CheckInRequest;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Locale;
import java.util.TimeZone;

import retrofit2.Response;

public class SyncWorker extends Worker {

    public SyncWorker(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
    }

    @NonNull
    @Override
    public Result doWork() {
        AppDatabase db = AppDatabase.getInstance(getApplicationContext());
        List<ExerciseSession> unsynced = db.exerciseSessionDao().getUnsyncedSessions();

        if (unsynced.isEmpty()) {
            return Result.success();
        }

        ApiService api = RetrofitClient.getApiService();
        SimpleDateFormat isoFormat = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        isoFormat.setTimeZone(TimeZone.getTimeZone("UTC"));

        List<CheckInRequest> batch = new ArrayList<>();
        List<Integer> idsToMark = new ArrayList<>();

        for (ExerciseSession session : unsynced) {
            if (session.getExerciseId() == null || session.getExerciseId().trim().isEmpty()) {
                Log.w("SyncWorker", "Sessão local antiga sem exerciseId ignorada: " + session.id);
                continue;
            }
            String isoDate = isoFormat.format(new Date(session.getCompletedAt()));
 int feelingRaw = session.getFeelingLevel();
 Integer feelingLevel = feelingRaw > 0 ? feelingRaw : null;
 batch.add(new CheckInRequest(
 session.getPrescriptionId(),
 session.getExerciseId(),
 session.getPainLevel(),
 feelingLevel,
 session.getNotes(),
 session.isCompleted(),
 isoDate
 ));
            idsToMark.add(session.id);
        }

        if (batch.isEmpty()) {
            return Result.success();
        }

        try {
            Response<List<Void>> response = api.syncCheckIns(batch).execute();

            if (response.isSuccessful()) {
                db.exerciseSessionDao().markAsSynced(idsToMark);
                Log.d("SyncWorker", "Sincronização em lote concluída: " + batch.size() + " itens.");
                return Result.success();
            } else {
                Log.e("SyncWorker", "Erro na sincronização em lote: " + response.code());
                return Result.retry();
            }
        } catch (Exception e) {
            Log.e("SyncWorker", "Falha na conexão durante sincronização em lote", e);
            return Result.retry();
        }
    }
}
