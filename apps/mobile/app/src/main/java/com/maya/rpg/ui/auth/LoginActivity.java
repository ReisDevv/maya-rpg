package com.maya.rpg.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.widget.Button;
import android.widget.EditText;
import android.widget.TextView;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;

import com.google.firebase.messaging.FirebaseMessaging;
import com.maya.rpg.R;
import com.maya.rpg.api.RetrofitClient;
import com.maya.rpg.api.TokenManager;
import com.maya.rpg.fcm.MayaFirebaseMessagingService;
import com.maya.rpg.model.LoginRequest;
import com.maya.rpg.model.LoginResponse;
import com.maya.rpg.ui.home.HomeActivity;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class LoginActivity extends AppCompatActivity {

    private static final String TAG = "MayaLogin";

    private EditText etEmail, etPassword;
    private Button btnArrowLogin;
    private TextView tvForgotPassword;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_login);

        etEmail = findViewById(R.id.etEmail);
        etPassword = findViewById(R.id.etPassword);
        btnArrowLogin = findViewById(R.id.btnArrowLogin);
        tvForgotPassword = findViewById(R.id.tvForgotPassword);

        btnArrowLogin.setOnClickListener(v -> doLogin());
        tvForgotPassword.setOnClickListener(v ->
                startActivity(new Intent(this, RecoverPasswordActivity.class))
        );

        findViewById(R.id.llSocialButtons).setOnClickListener(v ->
                Toast.makeText(this, "Funcionalidade em desenvolvimento (Em breve)", Toast.LENGTH_SHORT).show()
        );

        animateLoginEntrance();
    }

    private void animateLoginEntrance() {
        View clLogo = findViewById(R.id.clLogo);
        View tvLoginHeader = findViewById(R.id.tvLoginHeader);
        View clForm = findViewById(R.id.clForm);
        View tvSocialLabel = findViewById(R.id.tvSocialLabel);
        View llSocialButtons = findViewById(R.id.llSocialButtons);

        animateLoginView(clLogo, 0);
        animateLoginView(tvLoginHeader, 100);
        animateLoginView(clForm, 200);
        animateLoginView(tvSocialLabel, 350);
        animateLoginView(llSocialButtons, 420);
    }

    private void animateLoginView(View view, long delayMs) {
        if (view == null) return;
        view.setAlpha(0f);
        Animation anim = AnimationUtils.loadAnimation(this, R.anim.slide_up_fade_in);
        anim.setStartOffset(delayMs);
        anim.setFillAfter(true);
        anim.setAnimationListener(new Animation.AnimationListener() {
            @Override public void onAnimationStart(Animation a) { view.setAlpha(1f); }
            @Override public void onAnimationEnd(Animation a) {}
            @Override public void onAnimationRepeat(Animation a) {}
        });
        view.startAnimation(anim);
    }

    private void doLogin() {
        String identifier = etEmail.getText().toString().trim();
        String password = etPassword.getText().toString().trim();

        if (identifier.isEmpty() || password.isEmpty()) {
            Toast.makeText(this, "Preencha todos os campos", Toast.LENGTH_SHORT).show();
            return;
        }

        setLoadingState(true);

        RetrofitClient.getApiService().login(new LoginRequest(identifier, password))
                .enqueue(new Callback<LoginResponse>() {
                    @Override
                    public void onResponse(Call<LoginResponse> call, Response<LoginResponse> response) {
                        setLoadingState(false);

                        if (response.isSuccessful() && response.body() != null) {
                            LoginResponse body = response.body();
                            LoginResponse.UserData userData = body.getUser();

                            if (userData != null) {
                                TokenManager.saveToken(body.getAccessToken());
                                TokenManager.saveRefreshToken(body.getRefreshToken());
                                TokenManager.saveUserName(userData.getName());
                                TokenManager.saveFirstAccess(userData.isFirstAccess());

                                // Cache local do aceite LGPD recebido do backend
                                TokenManager.saveLgpdAccepted(userData.hasAcceptedLgpd());

                                RetrofitClient.reset();

                                // Envia o token FCM atual ao backend (não bloqueia o fluxo)
                                pushFcmTokenInBackground();

                                if ("PATIENT".equals(userData.getRole())) {
                                    fetchPatientIdAndContinue(userData);
                                } else {
                                    routeAfterLogin(userData);
                                }
                            }
                        } else {
                            String errorMsg = response.code() == 401
                                    ? "Email ou Senha incorretos."
                                    : "Erro no servidor.";
                            Toast.makeText(LoginActivity.this, errorMsg, Toast.LENGTH_SHORT).show();
                        }
                    }

        @Override
        public void onFailure(Call<LoginResponse> call, Throwable t) {
            setLoadingState(false);
            Log.e(TAG, "Falha na conexão: " + t.getClass().getSimpleName() + " - " + t.getMessage(), t);
            String msg;
            if (t instanceof java.net.SocketTimeoutException) {
                msg = "Servidor demorou para responder. Tente novamente.";
            } else if (t instanceof java.net.UnknownHostException) {
                msg = "Sem conexão com a internet.";
            } else if (t instanceof java.net.ConnectException) {
                msg = "Não foi possível conectar ao servidor. Tente novamente.";
            } else if (t instanceof javax.net.ssl.SSLHandshakeException) {
                msg = "Erro de segurança na conexão. Tente novamente.";
            } else {
                msg = "Falha na conexão. Tente novamente em alguns segundos.";
            }
            Toast.makeText(LoginActivity.this, msg, Toast.LENGTH_LONG).show();
        }
                });
    }

    private void fetchPatientIdAndContinue(LoginResponse.UserData userData) {
        RetrofitClient.getApiService().getMyPatient()
                .enqueue(new Callback<com.maya.rpg.model.Patient>() {
                    @Override
                    public void onResponse(Call<com.maya.rpg.model.Patient> call,
                                           Response<com.maya.rpg.model.Patient> patientResponse) {
                        if (patientResponse.isSuccessful() && patientResponse.body() != null) {
                            TokenManager.savePatientId(patientResponse.body().getId());
                            routeAfterLogin(userData);
                        } else {
                            handlePatientLookupError("Não foi possível carregar seu cadastro de paciente.");
                        }
                    }

                    @Override
                    public void onFailure(Call<com.maya.rpg.model.Patient> call, Throwable t) {
                        Log.e(TAG, "Erro de rede em /patients/me.", t);
                        handlePatientLookupError("Falha ao carregar seu cadastro. Tente novamente.");
                    }
                });
    }

    private void handlePatientLookupError(String message) {
        TokenManager.clearAll();
        RetrofitClient.reset();
        setLoadingState(false);
        Toast.makeText(this, message, Toast.LENGTH_LONG).show();
    }

    /**
     * Decide o destino conforme o estado do usuário:
     *   1. Trocar senha (firstAccess)  →  ChangePasswordActivity
     *   2. Aceitar LGPD (ainda não aceitou) →  LgpdConsentActivity
     *   3. Tudo ok → HomeActivity
     */
    private void routeAfterLogin(LoginResponse.UserData userData) {
        Intent intent;
        if (userData.isFirstAccess()) {
            intent = new Intent(this, ChangePasswordActivity.class);
        } else if (!TokenManager.hasAcceptedLgpd()) {
            intent = new Intent(this, LgpdConsentActivity.class);
        } else {
            intent = new Intent(this, HomeActivity.class);
        }
        startActivity(intent);
        finish();
    }

    private void pushFcmTokenInBackground() {
        FirebaseMessaging.getInstance().getToken()
                .addOnSuccessListener(token -> {
                    if (token != null && !token.isEmpty()) {
                        MayaFirebaseMessagingService.sendTokenToBackend(token);
                    }
                })
                .addOnFailureListener(e ->
                        Log.w(TAG, "Não foi possível obter o token FCM atual.", e)
                );
    }

    private void setLoadingState(boolean isLoading) {
        btnArrowLogin.setEnabled(!isLoading);
        btnArrowLogin.setAlpha(isLoading ? 0.5f : 1.0f);
    }
}
