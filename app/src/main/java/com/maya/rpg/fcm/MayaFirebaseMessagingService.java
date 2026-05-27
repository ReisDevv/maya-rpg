package com.maya.rpg.fcm;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;
import com.maya.rpg.R;
import com.maya.rpg.api.ApiService;
import com.maya.rpg.api.RetrofitClient;
import com.maya.rpg.api.TokenManager;
import com.maya.rpg.model.FcmTokenRequest;
import com.maya.rpg.ui.splash.SplashActivity;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class MayaFirebaseMessagingService extends FirebaseMessagingService {

    private static final String TAG = "MayaFCM";
    private static final String CHANNEL_ID = "maya_rpg_push";

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        Log.d(TAG, "Novo token FCM recebido: " + token);
        
        // Se o usuário estiver logado, envia o token para a API
        if (TokenManager.getToken() != null) {
            sendTokenToBackend(token);
        }
    }

    public static void sendTokenToBackend(String token) {
        ApiService api = RetrofitClient.getApiService();
        api.updateFcmToken(new FcmTokenRequest(token)).enqueue(new Callback<Void>() {
            @Override
            public void onResponse(Call<Void> call, Response<Void> response) {
                if (response.isSuccessful()) {
                    Log.d(TAG, "Token FCM atualizado no backend com sucesso.");
                } else {
                    Log.e(TAG, "Falha ao atualizar token FCM no backend: " + response.code());
                }
            }

            @Override
            public void onFailure(Call<Void> call, Throwable t) {
                Log.e(TAG, "Erro de rede ao atualizar token FCM", t);
            }
        });
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage message) {
        super.onMessageReceived(message);

        String title = "Clínica Maya";
        String body = "Você tem uma nova notificação.";

        if (message.getNotification() != null) {
            title = message.getNotification().getTitle();
            body = message.getNotification().getBody();
        } else if (!message.getData().isEmpty()) {
            title = message.getData().getOrDefault("title", title);
            body = message.getData().getOrDefault("body", body);
        }

        showNotification(title, body);
    }

    private void showNotification(String title, String body) {
        NotificationManager notificationManager =
                (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Notificações da Clínica",
                    NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Avisos importantes sobre seu tratamento");
            notificationManager.createNotificationChannel(channel);
        }

        Intent intent = new Intent(this, SplashActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pendingIntent = PendingIntent.getActivity(
                this, 0, intent, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_ONE_SHOT
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.mipmap.ic_launcher_round)
                .setContentTitle(title)
                .setContentText(body)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent)
                .setPriority(NotificationCompat.PRIORITY_HIGH);

        notificationManager.notify((int) System.currentTimeMillis(), builder.build());
    }
}
