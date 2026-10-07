package com.enzizy.screenroom.player

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.tv.material3.Button
import androidx.tv.material3.Text
import com.enzizy.screenroom.data.Title

@Composable
fun PlayerScreen(title: Title, season: Int, episode: Int, onBack: () -> Unit) {
    var source by rememberSaveable { mutableStateOf(EmbedSource.CINESRC) }
    var attempt by remember { mutableIntStateOf(0) }
    var status by remember(source, attempt) { mutableStateOf("Loading player…") }
    var suspended by remember { mutableStateOf(false) }
    var host by remember { mutableStateOf<PlayerHost?>(null) }
    val controls = remember { FocusRequester() }
    val lifecycle = LocalLifecycleOwner.current.lifecycle
    LaunchedEffect(Unit) { controls.requestFocus() }
    BackHandler { if (host?.exitFullscreen() != true) onBack() }
    DisposableEffect(lifecycle) {
        val observer = LifecycleEventObserver { _, event ->
            // Stop immediately: Compose may not dispose the view until the app resumes.
            if (event == Lifecycle.Event.ON_STOP) {
                host?.stopPlayback()
                suspended = true
            }
        }
        lifecycle.addObserver(observer)
        onDispose { lifecycle.removeObserver(observer) }
    }
    Column(Modifier.fillMaxSize().background(Color.Black)) {
        Column(Modifier.fillMaxWidth().padding(horizontal = 28.dp, vertical = 16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text(title.name + if (title.mediaType == "tv") " · S$season E$episode" else "", color = Color.White, fontSize = 18.sp)
            LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp), contentPadding = PaddingValues(4.dp)) {
                item { Button(onClick = onBack, modifier = Modifier.focusRequester(controls)) { Text("Back") } }
                item { Button(onClick = { source = if (source == EmbedSource.CINESRC) EmbedSource.VIDSRC else EmbedSource.CINESRC; suspended = false }) { Text("Server: ${source.label}") } }
                item { Button(onClick = { attempt++; suspended = false }) { Text("Reload") } }
                item { Button(onClick = { host?.focusPlayer() }) { Text("Focus player") } }
                if (source == EmbedSource.CINESRC) item { Button(onClick = { host?.control("toggle") }) { Text("Play / pause") } }
            }
            Text(status, color = Color(0xFFB6ADA5), fontSize = 12.sp)
        }
        Box(Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
            if (suspended) {
                Button(onClick = { suspended = false; attempt++ }) { Text("Reload playback") }
            } else key(source, attempt) {
                AndroidView(
                    factory = { context -> PlayerHost(context, source, title.mediaType, title.id, season, episode,
                        onEvent = { event -> status = when (event) {
                            "error" -> "This server reported a problem. Try the other server or reload."
                            "ready" -> "Ready. Focus the player to use remote playback controls."
                            "playing" -> "Playing"
                            "paused" -> "Paused"
                            else -> "Player loaded. Select Focus player to continue."
                        } }, onControls = { controls.requestFocus() }).also { host = it } },
                    modifier = Modifier.fillMaxSize(),
                    onRelease = { view -> view.release(); if (host === view) host = null },
                )
            }
        }
        Text(if (source == EmbedSource.CINESRC) "In player: OK plays or pauses · Left / right seeks 10s · Up returns to controls" else "Use the player’s controls · Up returns to the server switch", Modifier.padding(horizontal = 28.dp, vertical = 10.dp), color = Color(0xFFB6ADA5), fontSize = 12.sp)
    }
}
