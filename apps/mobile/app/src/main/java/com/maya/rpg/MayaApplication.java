package com.maya.rpg;

import android.app.Application;
import android.content.SharedPreferences;
import androidx.appcompat.app.AppCompatDelegate;
import androidx.work.Constraints;
import androidx.work.NetworkType;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkManager;
import com.maya.rpg.api.TokenManager;
import com.maya.rpg.worker.ReminderWorker;
import java.util.concurrent.TimeUnit;

public class MayaApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();

        // Restaura preferência de tema salva pelo usuário
        SharedPreferences prefs = getSharedPreferences("maya_prefs", MODE_PRIVATE);
        int nightMode = prefs.getInt("night_mode", AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM);
        AppCompatDelegate.setDefaultNightMode(nightMode);

        // Inicializa o armazenamento seguro globalmente
        TokenManager.init(this);

        // Agenda lembretes diários
        scheduleDailyReminders();
    }

    private void scheduleDailyReminders() {
        Constraints constraints = new Constraints.Builder()
                .setRequiredNetworkType(NetworkType.NOT_REQUIRED)
                .build();

        PeriodicWorkRequest reminderRequest =
                new PeriodicWorkRequest.Builder(ReminderWorker.class, 6, TimeUnit.HOURS)
                        .setConstraints(constraints)
                        .addTag("DAILY_REMINDER")
                        .build();

        WorkManager.getInstance(this).enqueueUniquePeriodicWork(
                "daily_exercise_reminder",
                androidx.work.ExistingPeriodicWorkPolicy.UPDATE,
                reminderRequest
        );
    }
}
