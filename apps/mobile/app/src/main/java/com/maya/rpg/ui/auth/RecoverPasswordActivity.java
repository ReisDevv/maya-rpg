package com.maya.rpg.ui.auth;

import android.os.Bundle;
import android.text.TextUtils;
import android.util.Patterns;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.TextView;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatActivity;

import com.maya.rpg.R;
import com.maya.rpg.api.RetrofitClient;
import com.maya.rpg.model.RecoverPasswordResponse;
import com.maya.rpg.model.ResetPasswordRequest;

import java.util.Collections;
import java.util.Map;

import retrofit2.Call;
import retrofit2.Callback;
import retrofit2.Response;

public class RecoverPasswordActivity extends AppCompatActivity {

    private EditText etEmail, etToken, etNovaSenha;
    private Button btnEnviar, btnRedefinir;
    private ImageButton btnFechar;
    private View layoutStep1, layoutStep2;
    private TextView tvVoltarLogin, tvVoltarPasso1;
    
    private String currentRequestId;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_recover_password);

        etEmail = findViewById(R.id.etEmail);
        etToken = findViewById(R.id.etToken);
        etNovaSenha = findViewById(R.id.etNovaSenha);
        btnEnviar = findViewById(R.id.btnEnviar);
        btnRedefinir = findViewById(R.id.btnRedefinir);
        btnFechar = findViewById(R.id.btnFechar);
        layoutStep1 = findViewById(R.id.layoutStep1);
        layoutStep2 = findViewById(R.id.layoutStep2);
        tvVoltarLogin = findViewById(R.id.tvVoltarLogin);
        tvVoltarPasso1 = findViewById(R.id.tvVoltarPasso1);

        btnFechar.setOnClickListener(v -> finish());
        tvVoltarLogin.setOnClickListener(v -> finish());
        tvVoltarPasso1.setOnClickListener(v -> showStep1());
        
        btnEnviar.setOnClickListener(v -> requestToken());
        btnRedefinir.setOnClickListener(v -> resetPassword());
    }

    private void showStep1() {
        layoutStep1.setVisibility(View.VISIBLE);
        layoutStep2.setVisibility(View.GONE);
    }

    private void showStep2() {
        layoutStep1.setVisibility(View.GONE);
        layoutStep2.setVisibility(View.VISIBLE);
    }

    private void requestToken() {
        String email = etEmail.getText().toString().trim();

        if (TextUtils.isEmpty(email)) {
            etEmail.setError(getString(R.string.login_email_hint));
            etEmail.requestFocus();
            return;
        }

        if (!Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            etEmail.setError(getString(R.string.recover_hint_email));
            etEmail.requestFocus();
            return;
        }

        btnEnviar.setEnabled(false);
        btnEnviar.setText("…");

        Map<String, String> body = Collections.singletonMap("email", email);
        RetrofitClient.getApiService().recoverPassword(body).enqueue(new Callback<RecoverPasswordResponse>() {
            @Override
            public void onResponse(Call<RecoverPasswordResponse> call,
                                   Response<RecoverPasswordResponse> response) {
                btnEnviar.setEnabled(true);
                btnEnviar.setText(R.string.recover_btn_send);

                if (response.isSuccessful() && response.body() != null) {
                    currentRequestId = response.body().getRequestId();
                    Toast.makeText(RecoverPasswordActivity.this,
                            R.string.recover_msg_code_sent, Toast.LENGTH_LONG).show();
                    showStep2();
                } else {
                    Toast.makeText(RecoverPasswordActivity.this,
                            R.string.recover_msg_error_request, Toast.LENGTH_SHORT).show();
                }
            }

            @Override
            public void onFailure(Call<RecoverPasswordResponse> call, Throwable t) {
                btnEnviar.setEnabled(true);
                btnEnviar.setText(R.string.recover_btn_send);
                Toast.makeText(RecoverPasswordActivity.this,
                        R.string.recover_msg_error_connection, Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void resetPassword() {
        String code = etToken.getText().toString().trim();
        String novaSenha = etNovaSenha.getText().toString();

        if (TextUtils.isEmpty(code)) {
            etToken.setError(getString(R.string.recover_hint_code));
            etToken.requestFocus();
            return;
        }

        if (novaSenha.length() < 6) {
            etNovaSenha.setError(getString(R.string.recover_hint_new_password));
            etNovaSenha.requestFocus();
            return;
        }

        if (currentRequestId == null) {
            Toast.makeText(this, R.string.recover_msg_session_expired, Toast.LENGTH_SHORT).show();
            showStep1();
            return;
        }

        btnRedefinir.setEnabled(false);
        btnRedefinir.setText("…");

        ResetPasswordRequest req = new ResetPasswordRequest(currentRequestId, code, novaSenha);
        RetrofitClient.getApiService().resetPassword(req).enqueue(new Callback<Map<String, String>>() {
            @Override
            public void onResponse(Call<Map<String, String>> call,
                                   Response<Map<String, String>> response) {
                btnRedefinir.setEnabled(true);
                btnRedefinir.setText(R.string.recover_btn_save);
                if (response.isSuccessful()) {
                    Toast.makeText(RecoverPasswordActivity.this,
                            R.string.recover_msg_success_reset, Toast.LENGTH_LONG).show();
                    finish();
                } else {
                    Toast.makeText(RecoverPasswordActivity.this,
                            R.string.recover_msg_invalid_code, Toast.LENGTH_LONG).show();
                }
            }

            @Override
            public void onFailure(Call<Map<String, String>> call, Throwable t) {
                btnRedefinir.setEnabled(true);
                btnRedefinir.setText(R.string.recover_btn_save);
                Toast.makeText(RecoverPasswordActivity.this,
                        R.string.recover_msg_error_connection, Toast.LENGTH_SHORT).show();
            }
        });
    }
}
