package com.maya.rpg.api;

import android.content.Context;
import android.content.SharedPreferences;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;

public class TokenManager {
    private static final String PREF_NAME = "maya_prefs";
    private static final String KEY_TOKEN = "jwt_token";
    private static final String KEY_REFRESH_TOKEN = "refresh_token";
    private static final String KEY_PATIENT_ID = "patient_id";
    private static final String KEY_USER_NAME = "user_name";
    private static final String KEY_LGPD_ACCEPTED = "lgpd_accepted";
    private static final String KEY_FIRST_ACCESS = "first_access";
    private static final String KEY_PROFILE_PHOTO_URI = "profile_photo_uri";
    private static SharedPreferences prefs;

    public static void init(Context context) {
        prefs = createEncryptedPrefs(context);
        if (prefs == null) {
            // Chave do Keystore perdida (desinstall/reinstall, backup/restore, wipe de dados).
            // Apaga o arquivo corrompido e recria — o usuário precisará fazer login novamente.
            android.util.Log.w("MayaToken", "EncryptedSharedPreferences corrompido — limpando e recriando.");
            context.deleteSharedPreferences(PREF_NAME);
            // Também remove a master key antiga do Keystore para evitar conflito.
            try {
                java.security.KeyStore ks = java.security.KeyStore.getInstance("AndroidKeyStore");
                ks.load(null);
                ks.deleteEntry(MasterKey.DEFAULT_MASTER_KEY_ALIAS);
            } catch (Exception ignored) {}
            prefs = createEncryptedPrefs(context);
        }
        if (prefs == null) {
            throw new RuntimeException(
                "Não foi possível inicializar o armazenamento seguro de credenciais. " +
                "O dispositivo pode não suportar Android Keystore.");
        }
    }

    private static SharedPreferences createEncryptedPrefs(Context context) {
        try {
            MasterKey masterKey = new MasterKey.Builder(context)
                    .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                    .build();
            return EncryptedSharedPreferences.create(
                    context,
                    PREF_NAME,
                    masterKey,
                    EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                    EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            );
        } catch (Exception e) {
            android.util.Log.e("MayaToken", "Falha ao abrir EncryptedSharedPreferences", e);
            return null;
        }
    }

    public static void saveToken(String token) {
        prefs.edit().putString(KEY_TOKEN, token).commit();
    }

    public static String getToken() {
        return prefs != null ? prefs.getString(KEY_TOKEN, null) : null;
    }

    public static void saveRefreshToken(String refreshToken) {
        if (prefs != null) prefs.edit().putString(KEY_REFRESH_TOKEN, refreshToken).commit();
    }

    public static String getRefreshToken() {
        return prefs != null ? prefs.getString(KEY_REFRESH_TOKEN, null) : null;
    }

    public static void clearToken() {
        if (prefs != null) {
            prefs.edit()
                    .remove(KEY_TOKEN)
                    .remove(KEY_REFRESH_TOKEN)
                    .apply();
        }
    }

    public static boolean isLoggedIn() {
        return getToken() != null;
    }

    public static void savePatientId(String patientId) {
        prefs.edit().putString(KEY_PATIENT_ID, patientId).commit();
    }

    public static String getPatientId() {
        return prefs != null ? prefs.getString(KEY_PATIENT_ID, null) : null;
    }

    public static void saveUserName(String name) {
        prefs.edit().putString(KEY_USER_NAME, name).commit();
    }

    public static String getUserName() {
        return prefs != null ? prefs.getString(KEY_USER_NAME, null) : null;
    }

    public static void saveLgpdAccepted(boolean accepted) {
        if (prefs != null) prefs.edit().putBoolean(KEY_LGPD_ACCEPTED, accepted).apply();
    }

    public static boolean hasAcceptedLgpd() {
        return prefs != null && prefs.getBoolean(KEY_LGPD_ACCEPTED, false);
    }

    public static void saveFirstAccess(boolean firstAccess) {
        if (prefs != null) prefs.edit().putBoolean(KEY_FIRST_ACCESS, firstAccess).apply();
    }

    public static boolean isFirstAccess() {
        return prefs != null && prefs.getBoolean(KEY_FIRST_ACCESS, false);
    }

    public static void saveProfilePhotoUri(String uri) {
        if (prefs != null) prefs.edit().putString(KEY_PROFILE_PHOTO_URI, uri).apply();
    }

    public static String getProfilePhotoUri() {
        return prefs != null ? prefs.getString(KEY_PROFILE_PHOTO_URI, null) : null;
    }

    public static void clearAll() {
        if (prefs != null) prefs.edit().clear().apply();
    }
}
