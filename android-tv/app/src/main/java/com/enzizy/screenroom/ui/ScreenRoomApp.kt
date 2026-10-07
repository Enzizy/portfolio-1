package com.enzizy.screenroom.ui

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.tv.material3.*
import coil.compose.AsyncImage
import com.enzizy.screenroom.data.*
import com.enzizy.screenroom.player.PlayerScreen
import kotlinx.coroutines.CancellationException

private val Ink = Color(0xFFF5F0EB)
private val Muted = Color(0xFFB6ADA5)
private val Canvas = Color(0xFF171615)
private val Accent = Color(0xFFF5A35C)

@Composable
fun ScreenRoomApp(model: CatalogViewModel = viewModel()) {
    var selectedId by rememberSaveable { mutableStateOf<Int?>(null) }
    var selectedType by rememberSaveable { mutableStateOf("movie") }
    var playback by remember { mutableStateOf<Triple<Title, Int, Int>?>(null) }
    MaterialTheme(colorScheme = darkColorScheme(primary = Accent, onPrimary = Canvas, background = Canvas, onBackground = Ink, surface = Color(0xFF262321), onSurface = Ink)) {
        Box(Modifier.fillMaxSize().background(Canvas)) {
            val playing = playback
            val id = selectedId
            when {
                playing != null -> PlayerScreen(playing.first, playing.second, playing.third, onBack = { playback = null })
                id != null -> DetailsScreen(model.repository, selectedType, id, onBack = { selectedId = null }, onPlay = { title, season, episode -> playback = Triple(title, season, episode) })
                else -> HomeScreen(model) { title -> selectedType = title.mediaType; selectedId = title.id }
            }
        }
    }
}

@Composable
private fun HomeScreen(model: CatalogViewModel, onTitle: (Title) -> Unit) {
    val state = model.state
    var search by rememberSaveable { mutableStateOf("") }
    val firstFocus = remember { FocusRequester() }
    LaunchedEffect(Unit) { firstFocus.requestFocus() }
    LazyColumn(contentPadding = PaddingValues(horizontal = 40.dp, vertical = 28.dp), verticalArrangement = Arrangement.spacedBy(22.dp)) {
        item {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(14.dp)) {
                Column(Modifier.weight(1f)) {
                    Text("screen room", style = MaterialTheme.typography.headlineMedium, color = Ink)
                    Text("A little off the clock.", color = Muted, fontSize = 13.sp)
                }
                Button(onClick = { model.load("movie", ""); search = "" }, modifier = Modifier.focusRequester(firstFocus)) { Text("Movies") }
                Button(onClick = { model.load("tv", ""); search = "" }) { Text("TV series") }
            }
        }
        item {
            Row(horizontalArrangement = Arrangement.spacedBy(14.dp), verticalAlignment = Alignment.CenterVertically) {
                SearchField(search, { search = it.take(100) }, { model.load(query = search) }, Modifier.weight(1f))
                Button(onClick = { model.load(query = search) }) { Text("Search") }
                if (state.query.isNotBlank()) Button(onClick = { search = ""; model.load(query = "") }) { Text("Clear") }
            }
        }
        when {
            state.loading -> item { StatusText("Finding something to watch…") }
            state.error != null -> item { ErrorMessage(state.error) { model.load() } }
            state.items.isEmpty() -> item { StatusText("No titles found. Try another search.") }
            else -> {
                if (state.query.isBlank()) item { FeaturedTitle(state.items.first(), onTitle) }
                item {
                    Text(if (state.query.isBlank()) "Trending ${if (state.type == "movie") "movies" else "series"}" else "Results for “${state.query}”", color = Ink, style = MaterialTheme.typography.titleLarge)
                }
                item {
                    LazyRow(contentPadding = PaddingValues(8.dp), horizontalArrangement = Arrangement.spacedBy(18.dp)) {
                        items(state.items, key = { "${it.mediaType}-${it.id}" }) { title -> PosterCard(title) { onTitle(title) } }
                    }
                }
            }
        }
        item { Text("Data and artwork from TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.", color = Muted, fontSize = 11.sp) }
    }
}

@Composable
private fun SearchField(value: String, onChange: (String) -> Unit, onSearch: () -> Unit, modifier: Modifier) {
    var focused by remember { mutableStateOf(false) }
    BasicTextField(
        value = value, onValueChange = onChange, singleLine = true,
        modifier = modifier.onFocusChanged { focused = it.isFocused }.border(2.dp, if (focused) Accent else Color(0xFF48413C), RoundedCornerShape(12.dp)).padding(14.dp),
        textStyle = TextStyle(color = Ink, fontSize = 16.sp), cursorBrush = Brush.verticalGradient(listOf(Accent, Accent)),
        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search), keyboardActions = KeyboardActions(onSearch = { onSearch() }),
        decorationBox = { inner -> Box { if (value.isEmpty()) Text("Search movies or series", color = Muted, fontSize = 16.sp); inner() } },
    )
}

@Composable
private fun FeaturedTitle(title: Title, onTitle: (Title) -> Unit) {
    Box(Modifier.fillMaxWidth().height(230.dp)) {
        AsyncImage(title.backdrop, contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
        Box(Modifier.fillMaxSize().background(Brush.horizontalGradient(listOf(Canvas, Canvas.copy(alpha = .85f), Color.Transparent))))
        Column(Modifier.padding(20.dp).widthIn(max = 460.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("TONIGHT’S PICK", color = Accent, fontSize = 12.sp)
            Text(title.name, color = Ink, style = MaterialTheme.typography.headlineLarge, maxLines = 2, overflow = TextOverflow.Ellipsis)
            Text(title.overview, color = Muted, maxLines = 2, overflow = TextOverflow.Ellipsis, fontSize = 14.sp)
            Button(onClick = { onTitle(title) }) { Text("View details") }
        }
    }
}

@Composable
private fun PosterCard(title: Title, onClick: () -> Unit) {
    Card(onClick = onClick, modifier = Modifier.width(132.dp), scale = CardDefaults.scale(focusedScale = 1.04f),
        border = CardDefaults.border(focusedBorder = Border(androidx.compose.foundation.BorderStroke(3.dp, Accent)))) {
        Box(Modifier.fillMaxWidth().height(188.dp).background(Color(0xFF302A26)), contentAlignment = Alignment.Center) {
            Text(title.name, modifier = Modifier.padding(12.dp), maxLines = 3, color = Muted, fontSize = 14.sp)
            AsyncImage(title.poster, contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
        }
        Column(Modifier.padding(10.dp)) {
            Text(title.name, maxLines = 1, overflow = TextOverflow.Ellipsis, fontSize = 13.sp)
            Text(title.year, fontSize = 11.sp)
        }
    }
}

@Composable
private fun DetailsScreen(repository: CatalogRepository, type: String, id: Int, onBack: () -> Unit, onPlay: (Title, Int, Int) -> Unit) {
    var details by remember(id, type) { mutableStateOf<Details?>(null) }
    var error by remember(id, type) { mutableStateOf(false) }
    var retry by remember { mutableIntStateOf(0) }
    var season by rememberSaveable(id, type) { mutableStateOf<Int?>(null) }
    var episodes by remember(id, season) { mutableStateOf<List<Episode>?>(null) }
    var episodeError by remember(id, season) { mutableStateOf(false) }
    var episodeRetry by remember { mutableIntStateOf(0) }
    val backFocus = remember { FocusRequester() }
    BackHandler(onBack = onBack)
    LaunchedEffect(Unit) { backFocus.requestFocus() }
    LaunchedEffect(id, type, retry) {
        error = false
        try {
            details = repository.details(type, id)
            if (season == null) season = details?.seasons?.firstOrNull { it.number > 0 }?.number ?: details?.seasons?.firstOrNull()?.number
        } catch (e: CancellationException) { throw e }
        catch (_: Exception) { error = true }
    }
    LaunchedEffect(id, season, episodeRetry) {
        val number = season ?: return@LaunchedEffect
        if (type != "tv") return@LaunchedEffect
        episodes = null
        episodeError = false
        try { episodes = repository.episodes(id, number) }
        catch (e: CancellationException) { throw e }
        catch (_: Exception) { episodeError = true }
    }
    LazyColumn(contentPadding = PaddingValues(40.dp), verticalArrangement = Arrangement.spacedBy(20.dp)) {
        item { Button(onClick = onBack, modifier = Modifier.focusRequester(backFocus)) { Text("Back to browsing") } }
        when {
            error -> item { ErrorMessage("Could not load this title.") { retry++ } }
            details == null -> item { StatusText("Loading title…") }
            else -> {
                val data = details!!
                item {
                    Row(horizontalArrangement = Arrangement.spacedBy(28.dp)) {
                        AsyncImage(data.title.poster, contentDescription = null, modifier = Modifier.width(150.dp).height(225.dp), contentScale = ContentScale.Crop)
                        Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                            Text(data.title.name, color = Ink, style = MaterialTheme.typography.headlineLarge)
                            Text("${data.title.year}  ·  ${if (type == "tv") "TV series" else "Movie"}  ·  ${String.format(java.util.Locale.US, "%.1f", data.title.rating)}/10", color = Accent)
                            Text(data.title.overview.ifBlank { "No synopsis available." }, color = Muted, fontSize = 16.sp)
                            if (type == "movie") Button(onClick = { onPlay(data.title, 1, 1) }) { Text("Play movie") }
                        }
                    }
                }
                if (type == "tv") {
                    item {
                        LazyRow(horizontalArrangement = Arrangement.spacedBy(14.dp), contentPadding = PaddingValues(8.dp)) {
                            items(data.seasons, key = { it.number }) { entry -> Button(onClick = { season = entry.number }) { Text("${if (entry.number == season) "• " else ""}${entry.name}") } }
                        }
                    }
                    when {
                        data.seasons.isEmpty() -> item { StatusText("No seasons available yet.") }
                        episodeError -> item { ErrorMessage("Could not load episodes.") { episodeRetry++ } }
                        episodes == null -> item { StatusText("Loading episodes…") }
                        episodes!!.isEmpty() -> item { StatusText("No episodes available yet.") }
                        else -> items(episodes!!, key = { it.number }) { episode ->
                            Button(onClick = { onPlay(data.title, season ?: 1, episode.number) }) { Text("${episode.number}. ${episode.name}") }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun StatusText(message: String) { Text(message, Modifier.padding(vertical = 30.dp), color = Muted) }

@Composable
private fun ErrorMessage(message: String, retry: () -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text(message, color = Muted)
        Button(onClick = retry) { Text("Try again") }
    }
}
