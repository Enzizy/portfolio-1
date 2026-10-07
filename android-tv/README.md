# Screen Room for Android TV

A standalone Kotlin / Compose for TV app inside the portfolio repository. Open **this folder** as the Android Studio project. The Next.js site has its own build and is not needed to build the APK.

## First version

- Native movie / series browsing, search, title details, season and episode selection.
- Orange focus highlights, TV launcher icon / banner, landscape layout and remote navigation.
- CineSrc playback with VidSrc switching. CineSrc supports remote play / pause and ten-second seeking through its documented player API.
- A restricted WebView: local trusted wrapper, validated message origin and sender, no file access, no popup windows or external intent navigation. Leaving the app stops playback; returning offers a reload.
- A small catalog server that keeps the TMDB key outside the APK, normalizes responses and caches up to 200 requests for five minutes.

This is the first implementation, **not a verified APK release**. Android compilation and real TV playback still need verification. VidSrc remote controls depend on its embedded UI; it does not expose the CineSrc command API. Actual stream availability is controlled by each provider. History, favorites, accounts and automatic updates are not implemented yet.

## Prerequisites

- Android Studio with a JDK 17 or newer, Android SDK Platform 36 and Build Tools 36.0.0.
- Android TV emulator or physical Android TV / Google TV device running Android 8+.
- Node.js 22+ for the catalog server.

Use **D:** for Android Studio, the SDK, emulator images, temporary files and Gradle caches. C: had less than 1 GB free during initial development. Before building, set these paths in your PowerShell session (adjust the JDK path to your installation):

```powershell
$env:JAVA_HOME = 'D:\Android\Android Studio\jbr'
$env:ANDROID_HOME = 'D:\Android\Sdk'
$env:GRADLE_USER_HOME = 'D:\Android\gradle-cache'
$env:ANDROID_USER_HOME = 'D:\Android\user'
$env:ANDROID_AVD_HOME = 'D:\Android\avd'
$env:TEMP = 'D:\Android\tmp'
$env:TMP = $env:TEMP
New-Item -ItemType Directory -Force -Path $env:TEMP | Out-Null
```

Android Studio may create an ignored `local.properties` file with the SDK path. The Gradle wrapper is checked in and its distribution and wrapper JAR checksums were verified against Gradle's official downloads.

## Start the catalog server

The existing portfolio `.env.local` must contain `TMDB_API_KEY`. No key is copied into this project or the Android app.

```powershell
cd D:\programs\Portfolio\android-tv\server
npm start
```

No npm install is needed. The server listens on `127.0.0.1:8787`. Check `http://127.0.0.1:8787/health`; `configured` should be `true`. It supports these fixed routes:

```text
GET /catalog?type=movie|tv
GET /search?type=movie|tv&q=title
GET /titles/movie|tv/{id}
GET /titles/tv/{id}/seasons/{number}
```

## Build and run on an emulator

```powershell
cd D:\programs\Portfolio\android-tv
.\gradlew.bat :app:assembleDebug
```

The debug build connects to `http://10.0.2.2:8787`, which is the Android emulator's address for your computer. Install `app\build\outputs\apk\debug\app-debug.apk` through Android Studio, or use `adb install -r` with that file. Look for **Screen Room** in the TV launcher.

## Test on a physical TV

Connect the TV with Android Studio / ADB first. For local development, forward the catalog port and build with the loopback address:

```powershell
adb reverse tcp:8787 tcp:8787
.\gradlew.bat :app:assembleDebug -PcatalogBaseUrl=http://127.0.0.1:8787
adb install -r app\build\outputs\apk\debug\app-debug.apk
```

Keep the computer and catalog server running for this local setup. To run independently of the computer, deploy `server/` as a Node service, set `TMDB_API_KEY`, `HOST=0.0.0.0` and the host's `PORT`, and provide its HTTPS address using `-PcatalogBaseUrl=https://your-catalog.example`. Configure rate limits at the public host before distributing the app. Native apps do not need CORS headers.

Release builds disable cleartext networking. Without an HTTPS catalog URL, a release build has no configured catalog. Release signing is deliberately unset; use Android Studio's signed APK flow and keep the keystore outside Git.

## Checks

```powershell
cd server
npm test
cd ..
.\gradlew.bat :app:testDebugUnitTest :app:lintDebug :app:assembleDebug
```

The Node tests exercise route validation, caching, credential handling, provider failure responses, player origin checks and remote commands. Kotlin tests cover the actual provider URL builder.

Device acceptance checks: launch from the TV home screen; browse / search using only the remote; select a movie and a series episode; test both servers; try play / pause and seek on CineSrc; press Up to reach the server controls; test Back, Home, resume and connection failures. A successful web or catalog test does not establish real TV playback compatibility.

Provider reference: [CineSrc player API](https://cinesrc.st/docs). Android UI reference: [Compose for TV](https://developer.android.com/training/tv/playback/compose).
