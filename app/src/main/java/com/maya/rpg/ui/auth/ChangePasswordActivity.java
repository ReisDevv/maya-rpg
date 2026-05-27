package com.maya.rpg.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.widget.Button;
import android.widget.EditText;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.maya.rpg.R;
import com.maya.rpg.api.RetrofitClient;
import com.maya.rpg.api.TokenManager;
import com.maya.rpg.ui.home.HomeActivity;
import java.util.HashMap;
import java.util.Map;
import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class ChangePasswordActivity extends AppCompatActivity {

    private EditText etNewPassword, etConfirmPassword;
    private Button btnSave;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_change_password);

        etNewPassword = findViewById(R.id.etNewPassword);
        etConfirmPassword = findViewById(R.id.etConfirmPassword);
        btnSave = findViewById(R.id.btnSave);

        btnSave.setOnClickListener(v -> {
            String newPass = etNewPassword.getText().toString();
            String confirmPass = etConfirmPassword.getText().toString();

            if (newPass.isEmpty() || confirmPass.isEmpty()) {
                Toast.makeText(this, "Preencha ambos os campos", Toast.LENGTH_SHORT).show();
                return;
            }

            if (!newPass.equals(confirmPass)) {
                Toast.makeText(this, "As senhas não coincidem", Toast.LENGTH_SHORT).show();
                return;
            }

            String passwordError = validatePassword(newPass);
            if (passwordError != null) {
                Toast.makeText(this, passwordError, Toast.LENGTH_LONG).show();
                return;
            }

            doChangePassword(newPass);
        });
    }

    /**
     * Returns null if the password meets all requirements, or an error message string.
     * Requirements: min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit, 1 special char.
     */
    private String validatePassword(String password) {
        if (password.length() < 8) {
            return "A senha deve ter no mínimo 8 caracteres.";
        }
        if (!password.matches(".*[A-Z].*")) {
            return "A senha deve conter ao menos uma letra maiúscula (ex: A, B, C).";
        }
        if (!password.matches(".*[a-z].*")) {
            return "A senha deve conter ao menos uma letra minúscula (ex: a, b, c).";
        }
        if (!password.matches(".*[0-9].*")) {
            return "A senha deve conter ao menos um número (ex: 1, 2, 3).";
        }
        if (!password.matches(".*[^A-Za-z0-9].*")) {
            return "A senha deve conter ao menos um caractere especial (ex: @, #, !).";
        }
        return null;
    }

    private void doChangePassword(String newPassword) {
        btnSave.setEnabled(false);
        btnSave.setAlpha(0.5f);

        Map<String, String> body = new HashMap<>();
        body.put("newPassword", newPassword);

        RetrofitClient.getApiService().changePassword(body).enqueue(new Callback<Void>() {
            @Override
            public void onResponse(Call<Void> call, Response<Void> response) {
                btnSave.setEnabled(true);
                btnSave.setAlpha(1.0f);

                if (response.isSuccessful()) {
                    TokenManager.saveFirstAccess(false);
                    Toast.makeText(ChangePasswordActivity.this, "Senha atualizada com sucesso!", Toast.LENGTH_SHORT).show();
                    Intent next = TokenManager.hasAcceptedLgpd()
                            ? new Intent(ChangePasswordActivity.this, HomeActivity.class)
                            : new Intent(ChangePasswordActivity.this, LgpdConsentActivity.class);
                    next.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                    startActivity(next);
                    finish();
                } else {
                    try {
                        String errorMsg = response.errorBody() != null ? response.errorBody().string() : "Erro desconhecido";
                        Log.e("MayaPassError", "Erro ao trocar senha (" + response.code() + "): " + errorMsg);
                    } catch (Exception e) {
                        Log.e("MayaPassError", "Falha ao ler erro", e);
                    }
                    Toast.makeText(ChangePasswordActivity.this, "Erro no servidor ao trocar senha.", Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<Void> call, Throwable t) {
                btnSave.setEnabled(true);
                btnSave.setAlpha(1.0f);
                Log.e("MayaPassError", "Falha na conexão", t);
                Toast.makeText(ChangePasswordActivity.this, "Falha na conexão. Tente novamente.", Toast.LENGTH_SHORT).show();
            }
        });
    }
}
