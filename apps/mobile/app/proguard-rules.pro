# Add project specific ProGuard rules here.

# ── Retrofit ────────────────────────────────────────────────────────────────
-dontwarn retrofit2.**
-keep class retrofit2.** { *; }
-keepattributes Signature
-keepattributes Exceptions
-keepattributes *Annotation*

# Keep all Retrofit service interfaces
-keep interface com.maya.rpg.api.** { *; }

# ── Gson / Model classes ─────────────────────────────────────────────────────
# Keep model fields so Gson can deserialize API responses
-keep class com.maya.rpg.model.** { *; }
-keepclassmembers class com.maya.rpg.model.** { *; }

# ── OkHttp ───────────────────────────────────────────────────────────────────
-dontwarn okhttp3.**
-dontwarn okio.**

# ── Room ─────────────────────────────────────────────────────────────────────
-keep class com.maya.rpg.db.entity.** { *; }
-keepclassmembers class com.maya.rpg.db.entity.** { *; }

# ── Debugging: preserve line numbers in crash stack traces ───────────────────
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile