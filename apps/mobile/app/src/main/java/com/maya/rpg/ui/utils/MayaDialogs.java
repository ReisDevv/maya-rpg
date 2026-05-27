package com.maya.rpg.ui.utils;

import android.app.AlertDialog;
import android.content.Context;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import com.maya.rpg.R;
import com.maya.rpg.api.NetworkMonitor;

/**
 * Utilitário para mostrar diálogos amigáveis de erro de conexão e estado.
 *
 * <p>Unifica a forma como informamos ao usuário sobre problemas de rede,
 * especialmente quando o servidor Render está em hibernação.</p>
 */
public class MayaDialogs {

    private MayaDialogs() { /* utilitário */ }

    /**
     * Mostra um diálogo de erro de conexão com ação de retry.
     *
     * @param context   Activity ou Context
     * @param title     Título do diálogo
     * @param message   Mensagem amigável
     * @param onRetry   Callback para tentar novamente
     */
    public static void showConnectionError(Context context, String title,
                                           String message, Runnable onRetry) {
        new AlertDialog.Builder(context)
                .setTitle(title)
                .setMessage(message)
                .setPositiveButton("Tentar novamente", (d, w) -> onRetry.run())
                .setNegativeButton("Cancelar", null)
                .setCancelable(false)
                .show();
    }

    /**
     * Mostra diálogo de servidor dormindo com barra de progresso.
     * Ideal quando a API no Render retorna 503 e precisa acordar.
     */
    public static void showServerWakingUp(Context context, Runnable onReady) {
        AlertDialog.Builder builder = new AlertDialog.Builder(context);
        View view = LayoutInflater.from(context)
                .inflate(R.layout.dialog_server_waking, null);

        ProgressBar progress = view.findViewById(R.id.progressWakeUp);
        TextView tvCounter = view.findViewById(R.id.tvWakeUpCounter);
        Button btnRetry = view.findViewById(R.id.btnWakeRetry);
        Button btnCancel = view.findViewById(R.id.btnWakeCancel);

        AlertDialog dialog = builder.setView(view).setCancelable(false).create();

        // Timer de 60 segundos (render warmup)
        final long[] remaining = {60};
        java.util.Timer timer = new java.util.Timer();
        timer.scheduleAtFixedRate(new java.util.TimerTask() {
            @Override
            public void run() {
                remaining[0]--;
                if (remaining[0] <= 0) {
                    timer.cancel();
                    if (context instanceof android.app.Activity) {
                        ((android.app.Activity) context).runOnUiThread(() -> {
                            dialog.dismiss();
                            onReady.run();
                        });
                    }
                } else {
                    tvCounter.setText("Aguarde " + remaining[0] + "s (servidor acordando)...");
                }
            }
        }, 0, 1000);

        btnRetry.setOnClickListener(v -> {
            timer.cancel();
            dialog.dismiss();
            onReady.run();
        });

        btnCancel.setOnClickListener(v -> {
            timer.cancel();
            dialog.dismiss();
        });

        dialog.show();
    }
}
