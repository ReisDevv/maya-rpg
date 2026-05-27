plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.google.services)
}

repositories {
    google()
    mavenCentral()
    maven { url = uri("https://jitpack.io") }
}

android {
    namespace = "com.maya.rpg"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.maya.rpg"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"
        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        buildConfigField(
            "String",
            "API_BASE_URL",
            "\"https://maya-rpg-api-1t7v.onrender.com/api/\""
        )
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_11
        targetCompatibility = JavaVersion.VERSION_11
    }

    buildFeatures {
        viewBinding = true
        buildConfig = true
    }
}

dependencies {
    implementation(libs.appcompat)
    implementation(libs.material)
    implementation(libs.activity)
    implementation(libs.constraintlayout)

    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    implementation("com.github.bumptech.glide:glide:4.16.0")

    // ViewPager2 — usado no carrossel de imagens dos exercícios
    implementation("androidx.viewpager2:viewpager2:1.1.0")

    implementation("androidx.security:security-crypto:1.1.0-alpha06")

    // Room (SQLite local cache + histórico)
    implementation("androidx.room:room-runtime:2.6.1")
    annotationProcessor("androidx.room:room-compiler:2.6.1")

    // WorkManager (notificações agendadas)
    implementation("androidx.work:work-runtime:2.9.0")

    // Firebase
    implementation(platform(libs.firebase.bom))
    implementation(libs.firebase.messaging)

    // Gráficos (Evolução)
    implementation(files("libs/MPAndroidChart-v3.1.0.aar"))

    // Calendário
    implementation("com.applandeo:material-calendar-view:1.9.2")

    testImplementation(libs.junit)
    androidTestImplementation(libs.ext.junit)
    androidTestImplementation(libs.espresso.core)

    // Room testing — banco in-memory para testes de integração dos DAOs
    androidTestImplementation("androidx.room:room-testing:2.6.1")
}
