package com.maya.rpg.api;

import android.util.Log;
import com.google.gson.Gson;
import com.maya.rpg.BuildConfig;
import com.maya.rpg.model.RefreshResponse;
import java.util.Collections;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.MediaType;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.converter.gson.GsonConverterFactory;
import java.util.concurrent.TimeUnit;

public class RetrofitClient {
    private static final Object refreshLock = new Object();
    private static final Gson gson = new Gson();
    private static Retrofit retrofit = null;

    public static ApiService getApiService() {
        if (retrofit == null) {
            HttpLoggingInterceptor logging = new HttpLoggingInterceptor();
            logging.setLevel(BuildConfig.DEBUG
                    ? HttpLoggingInterceptor.Level.BODY
                    : HttpLoggingInterceptor.Level.NONE);

            OkHttpClient client = new OkHttpClient.Builder()
                    .addInterceptor(logging)
                    .addInterceptor(chain -> {
                        String token = TokenManager.getToken();
                        Request original = chain.request();
                        if (token != null && !token.isEmpty()) {
                            Request request = original.newBuilder()
                                    .header("Authorization", "Bearer " + token)
                                    .method(original.method(), original.body())
                                    .build();
                            return chain.proceed(request);
                        }
                        return chain.proceed(original);
                    })
                    .authenticator((route, response) -> {
                        if (!shouldAttemptRefresh(response.request())) {
                            return null;
                        }

                        if (responseCount(response) >= 2) {
                            TokenManager.clearToken();
                            return null;
                        }

                        synchronized (refreshLock) {
                            String currentToken = TokenManager.getToken();
                            String sentToken = response.request().header("Authorization");
                            if (currentToken != null && sentToken != null
                                    && !sentToken.equals("Bearer " + currentToken)) {
                                return response.request().newBuilder()
                                        .header("Authorization", "Bearer " + currentToken)
                                        .build();
                            }

                            String newAccessToken = refreshAccessToken();
                            if (newAccessToken == null) {
                                return null;
                            }

                            return response.request().newBuilder()
                                    .header("Authorization", "Bearer " + newAccessToken)
                                    .build();
                        }
                    })
                    .connectTimeout(60, TimeUnit.SECONDS)
                    .readTimeout(60, TimeUnit.SECONDS)
                    .writeTimeout(60, TimeUnit.SECONDS)
                    .build();

            retrofit = new Retrofit.Builder()
                    .baseUrl(BuildConfig.API_BASE_URL)
                    .addConverterFactory(GsonConverterFactory.create())
                    .client(client)
                    .build();
        }
        return retrofit.create(ApiService.class);
    }

    public static void reset() {
        retrofit = null;
    }

    private static String refreshAccessToken() {
        String refreshToken = TokenManager.getRefreshToken();
        if (refreshToken == null || refreshToken.trim().isEmpty()) {
            TokenManager.clearToken();
            return null;
        }

        OkHttpClient refreshClient = new OkHttpClient.Builder()
                .connectTimeout(60, TimeUnit.SECONDS)
                .readTimeout(60, TimeUnit.SECONDS)
                .writeTimeout(60, TimeUnit.SECONDS)
                .build();
        RequestBody body = RequestBody.create(
                gson.toJson(Collections.singletonMap("refreshToken", refreshToken)),
                MediaType.parse("application/json; charset=utf-8")
        );
        Request request = new Request.Builder()
                .url(BuildConfig.API_BASE_URL + "auth/refresh")
                .post(body)
                .build();

        try (okhttp3.Response response = refreshClient.newCall(request).execute()) {
            if (!response.isSuccessful() || response.body() == null) {
                TokenManager.clearToken();
                return null;
            }

            RefreshResponse refreshResponse =
                    gson.fromJson(response.body().charStream(), RefreshResponse.class);
            if (refreshResponse == null || refreshResponse.getAccessToken() == null) {
                TokenManager.clearToken();
                return null;
            }

            TokenManager.saveToken(refreshResponse.getAccessToken());
            if (refreshResponse.getRefreshToken() != null) {
                TokenManager.saveRefreshToken(refreshResponse.getRefreshToken());
            }
            return refreshResponse.getAccessToken();
        } catch (Exception e) {
            Log.e("MayaAuth", "Falha ao renovar token", e);
            return null;
        }
    }

    private static int responseCount(okhttp3.Response response) {
        int count = 1;
        while ((response = response.priorResponse()) != null) {
            count++;
        }
        return count;
    }

    private static boolean shouldAttemptRefresh(Request request) {
        String path = request.url().encodedPath();
        return !path.endsWith("/auth/login")
                && !path.endsWith("/auth/register")
                && !path.endsWith("/auth/recover-password")
                && !path.endsWith("/auth/reset-password")
                && !path.endsWith("/auth/refresh")
                && !path.endsWith("/auth/lgpd-policy");
    }
}
