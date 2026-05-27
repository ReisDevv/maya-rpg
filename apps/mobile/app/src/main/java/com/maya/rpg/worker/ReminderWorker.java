package com.maya.rpg.worker;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import androidx.work.Worker;
import androidx.work.WorkerParameters;

import com.maya.rpg.R;
import com.maya.rpg.ui.splash.SplashActivity;

import java.util.Random;

public class ReminderWorker extends Worker {

    private static final String CHANNEL_ID = "maya_rpg_reminders";

    private final String[] messages = {
            "Hora do seu RPG! 🧘‍♂️",
            "Sua coluna agradece um pouco de exercício!",
            "Vamos manter a postura? Dra. Maya te espera.",
            "Que tal 5 minutinhos de alongamento agora?",
            "Não esqueça de registrar seu progresso de hoje!",
            "Pronto para mais uma sessão de RPG?"
    };

    private final String[] bodies = {
            "A Dra. Maya separou seus exercícios de hoje. Vamos lá?",
            "Pequenos hábitos geram grandes resultados. Vamos treinar?",
            "Sua rotina de exercícios está pronta para ser realizada.",
            "Sente-se, respire fundo e comece sua série de hoje.",
            "Consistência é a chave da sua evolução. Vamos?",
            "Acesse o app e veja o que preparamos para você hoje."
    };

    public ReminderWorker(@NonNull Context context, @NonNull WorkerParameters workerParams) {
        super(context, workerParams);
    }

    @NonNull
    @Override
    public Result doWork() {
        Context context = getApplicationContext();

        NotificationManager notificationManager =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Lembretes de Exercícios",
                    NotificationManager.IMPORTANCE_DEFAULT
            );
            channel.setDescription("Notificações periódicas para realizar o RPG");
            notificationManager.createNotificationChannel(channel);
        }

        Random random = new Random();
        String title = messages[random.nextInt(messages.length)];
        String body = bodies[random.nextInt(bodies.length)];

        Intent intent = new Intent(context, SplashActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                context, 0, intent, PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher_round)
                .setContentTitle(title)
                .setContentText(body)
                .setPriority(NotificationCompat.PRIORITY_DEFAULT)
                .setContentIntent(pendingIntent)
                .setAutoCancel(true)
                .setColor(ContextCompat.getColor(context, R.color.maya_teal_header));

        notificationManager.notify(1, builder.build());

        return Result.success();
    }
}