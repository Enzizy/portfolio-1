plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

// A server address, never an API key. Cleartext is limited to local debug hosts.
val catalogBaseUrl = providers.gradleProperty("catalogBaseUrl").orNull?.trimEnd('/')
if (catalogBaseUrl != null) {
    val uri = java.net.URI(catalogBaseUrl)
    val localDebug = uri.scheme == "http" && uri.host in listOf("10.0.2.2", "127.0.0.1", "localhost")
    require((uri.scheme == "https" || localDebug) && uri.host != null && uri.userInfo == null &&
        uri.query == null && uri.fragment == null && !catalogBaseUrl.contains('"') && !catalogBaseUrl.contains('\\')) {
        "catalogBaseUrl must use HTTPS or a local debug host"
    }
}

android {
    namespace = "com.enzizy.screenroom"
    compileSdk = 36
    defaultConfig {
        applicationId = "com.enzizy.screenroom"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0"
    }
    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            buildConfigField("String", "CATALOG_BASE_URL", "\"${catalogBaseUrl ?: "http://10.0.2.2:8787"}\"")
        }
        release {
            buildConfigField("String", "CATALOG_BASE_URL", "\"${catalogBaseUrl?.takeIf { it.startsWith("https://") } ?: ""}\"")
            isMinifyEnabled = false
        }
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2025.10.01"))
    implementation("androidx.compose.foundation:foundation")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.tv:tv-material:1.0.1")
    implementation("androidx.activity:activity-compose:1.11.0")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.9.4")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.9.4")
    implementation("androidx.webkit:webkit:1.14.0")
    implementation("io.coil-kt:coil-compose:2.7.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    testImplementation("junit:junit:4.13.2")
}
