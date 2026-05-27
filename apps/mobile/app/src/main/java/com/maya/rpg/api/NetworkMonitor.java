package com.maya.rpg.api;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.NetworkInfo;

/**
 * Monitora o estado da rede e a saúde da API.
 *
 * <p>Como o plano gratuito do Render hiberna a API após inatividade,
 * esta classe detecta quando o servidor está "dormindo" e sinaliza
 * para que a UI mostre uma mensagem educativa ao usuário.</p>
 */
public class NetworkMonitor {

    private static final long RENDER_WARMUP_MS = 45_000; // 45 segundos típicos no Render

    private final Context context;
    private long lastServerUnavailable = 0;

    public NetworkMonitor(Context context) {
        this.context = context.getApplicationContext();
    }

    /** Retorna true se o dispositivo tem conexão à Internet. */
    public boolean isOnline() {
        ConnectivityManager cm =
                (ConnectivityManager) context.getSystemService(Context.CONNECTIVITY_SERVICE);
        if (cm == null) return false;
        NetworkInfo activeNetwork = cm.getActiveNetworkInfo();
        return activeNetwork != null && activeNetwork.isConnectedOrConnecting();
    }

    /**
     * Registra que o servidor retornou 503 (Server sleeping).
     * Retorna true se já passou tempo de warm-up e a API pode estar viva.
     */
    public boolean markServerUnavailable() {
        lastServerUnavailable = System.currentTimeMillis();
        return false; // Ainda não está pronto para retry
    }

    /**
     * Verifica se podemos fazer retry automático após um 503.
     * O Render precisa de ~30-60s para acordar no plano free.
     */
    public boolean canRetryAfterServerSleep() {
        if (lastServerUnavailable == 0) return true;
        long elapsed = System.currentTimeMillis() - lastServerUnavailable;
        return elapsed > RENDER_WARMUP_MS;
    }

    /**
     * Retorna uma mensagem amigável com base na causa do erro de rede.
     * @param isOnline resultado de {@link #isOnline()} chamado pelo contexto do Activity
     */
    public static String getFriendlyMessage(Throwable t, boolean serverWas503, boolean isOnline) {
        if (!isOnline) {
            return "Sem conexão com a internet." +
                   "\nVerifique seu Wi-Fi ou dados móveis.";
        }

        if (serverWas503 || t instanceof java.net.SocketTimeoutException) {
            return "O servidor está acordando..." +
                   "\nIsso pode levar até 60 segundos no plano gratuito. Aguarde!";
        }

        if (t instanceof java.net.UnknownHostException) {
            return "Não foi possível encontrar o servidor." +
                   "\nVerifique sua conexão ou tente novamente.";
        }

        if (t instanceof javax.net.ssl.SSLHandshakeException) {
            return "Erro de segurança (SSL)." +
                   "\nVerifique a data do seu dispositivo.";
        }

        return "Falha na conexão." +
               "\nTente novamente em alguns segundos.";
    }

    /** @deprecated Use {@link #getFriendlyMessage(Throwable, boolean, boolean)} passing isOnline explicitly. */
    @Deprecated
    public static String getFriendlyMessage(Throwable t, boolean serverWas503) {
        return getFriendlyMessage(t, serverWas503, true);
    }
}
