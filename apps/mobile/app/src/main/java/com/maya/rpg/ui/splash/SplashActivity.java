package com.maya.rpg.ui.splash;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.view.animation.Animation;
import android.view.animation.AnimationUtils;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;
import com.maya.rpg.R;
import com.maya.rpg.api.TokenManager;
import com.maya.rpg.ui.auth.ChangePasswordActivity;
import com.maya.rpg.ui.auth.LgpdConsentActivity;
import com.maya.rpg.ui.auth.LoginActivity;
import com.maya.rpg.ui.home.HomeActivity;

public class SplashActivity extends AppCompatActivity {

    private static final int SPLASH_DURATION = 3000; // 3 seconds

    private final ActivityResultLauncher<String> notificationPermissionLauncher =
            registerForActivityResult(new ActivityResultContracts.RequestPermission(), granted -> {
                // Proceed regardless of the user's choice — the app works without notifications,
                // but push messages won't arrive until permission is granted.
            });

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_splash);

        requestNotificationPermissionIfNeeded();

        ImageView ivSplashLogo = findViewById(R.id.ivSplashLogo);
        TextView tvSplashWelcome = findViewById(R.id.tvSplashWelcome);

        Animation logoAnim = AnimationUtils.loadAnimation(this, R.anim.splash_logo_enter);
        Animation textAnim = AnimationUtils.loadAnimation(this, R.anim.splash_text_enter);

        ivSplashLogo.startAnimation(logoAnim);
        tvSplashWelcome.startAnimation(textAnim);

        new Handler().postDelayed(() -> {
            startActivity(resolveNextScreen());
            overridePendingTransition(R.anim.fade_in, R.anim.fade_out);
            finish();
        }, SPLASH_DURATION);
    }

    private void requestNotificationPermissionIfNeeded() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS)
                    != PackageManager.PERMISSION_GRANTED) {
                notificationPermissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS);
            }
        }
    }

    private Intent resolveNextScreen() {
        if (!TokenManager.isLoggedIn()) {
            return new Intent(this, LoginActivity.class);
        }

        if (TokenManager.isFirstAccess()) {
            return new Intent(this, ChangePasswordActivity.class);
        }

        if (!TokenManager.hasAcceptedLgpd()) {
            return new Intent(this, LgpdConsentActivity.class);
        }

        return new Intent(this, HomeActivity.class);
    }
}
