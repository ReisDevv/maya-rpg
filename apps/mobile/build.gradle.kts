// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.google.services) apply false
}

val localBuildRoot = System.getenv("LOCALAPPDATA")
    ?.let { file("$it/MayaRPG-mobile/gradle-build") }
    ?: file(".gradle/local-build")

layout.buildDirectory.set(localBuildRoot.resolve("root"))

subprojects {
    val projectBuildName = path.removePrefix(":").replace(":", "-").ifBlank { name }
    layout.buildDirectory.set(localBuildRoot.resolve(projectBuildName))
}
