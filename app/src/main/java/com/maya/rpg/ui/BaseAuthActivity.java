package com.maya.rpg.ui;

import android.content.Intent;
import android.os.Bundle;
import androidx.appcompat.app.AppCompatActivity;
import com.maya.rpg.api.TokenManager;
import com.maya.rpg.ui.auth.LoginActivity;

/**
 * Base class for every Activity that requires an authenticated session.
 *
 * <p>All protected screens (Home, Profile, PatientList, PatientDetail,
 * ExercisePlan, ExerciseDetail, Evolution) must extend this class instead
 * of AppCompatActivity directly.
 *
 * <p>On every resume the token is validated locally. If it is absent the
 * user is redirected to LoginActivity and the entire back stack is cleared,
 * preventing navigation back to a protected screen via the system back button.
 */
public abstract class BaseAuthActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Guard runs here too so the screen never renders for a logged-out user.
        redirectIfUnauthenticated();
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Re-checked on every resume: covers expired/revoked tokens and
        // scenarios where another user logs out on a shared device.
        redirectIfUnauthenticated();
    }

    private void redirectIfUnauthenticated() {
        if (!TokenManager.isLoggedIn()) {
            Intent intent = new Intent(this, LoginActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            startActivity(intent);
            finish();
        }
    }
}
