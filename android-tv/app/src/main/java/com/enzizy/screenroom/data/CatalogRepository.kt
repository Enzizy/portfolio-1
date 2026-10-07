package com.enzizy.screenroom.data

import com.enzizy.screenroom.BuildConfig
import java.io.IOException
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.ensureActive
import kotlinx.coroutines.withContext
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.HttpUrl.Companion.toHttpUrl
import org.json.JSONObject

data class Title(
    val id: Int,
    val mediaType: String,
    val name: String,
    val overview: String,
    val year: String,
    val poster: String?,
    val backdrop: String?,
    val rating: Double,
)
data class Season(val number: Int, val name: String)
data class Episode(val number: Int, val name: String)
data class Details(val title: Title, val seasons: List<Season>)

class CatalogRepository {
    private val client = OkHttpClient.Builder().callTimeout(18, TimeUnit.SECONDS).build()

    suspend fun catalog(type: String, query: String): List<Title> {
        val params = mutableMapOf("type" to type)
        if (query.isNotBlank()) params["q"] = query.trim()
        val json = request(if (query.isBlank()) "/catalog" else "/search", params)
        val items = json.getJSONArray("items")
        return List(items.length()) { title(items.getJSONObject(it)) }
    }

    suspend fun details(type: String, id: Int): Details {
        val json = request("/titles/$type/$id")
        val seasons = json.getJSONArray("seasons")
        return Details(title(json), List(seasons.length()) {
            seasons.getJSONObject(it).let { s -> Season(s.getInt("number"), s.getString("name")) }
        })
    }

    suspend fun episodes(id: Int, season: Int): List<Episode> {
        val items = request("/titles/tv/$id/seasons/$season").getJSONArray("episodes")
        return List(items.length()) {
            items.getJSONObject(it).let { e -> Episode(e.getInt("number"), e.getString("name")) }
        }
    }

    private suspend fun request(path: String, params: Map<String, String> = emptyMap()): JSONObject = withContext(Dispatchers.IO) {
        if (BuildConfig.CATALOG_BASE_URL.isBlank()) throw IOException("This build has no catalog server configured.")
        val url = (BuildConfig.CATALOG_BASE_URL + path).toHttpUrl().newBuilder()
        params.forEach { (key, value) -> url.addQueryParameter(key, value) }
        client.newCall(Request.Builder().url(url.build()).build()).execute().use { response ->
            ensureActive()
            if (!response.isSuccessful) throw IOException(
                if (response.code == 404) "This title is no longer available." else "The catalog is unavailable. Please try again."
            )
            JSONObject(response.body?.string() ?: throw IOException("The catalog returned an empty response."))
        }
    }

    private fun title(json: JSONObject) = Title(
        id = json.getInt("id"), mediaType = json.getString("mediaType"),
        name = json.getString("title"), overview = json.optString("overview"),
        year = json.optString("year"), poster = json.optionalString("poster"),
        backdrop = json.optionalString("backdrop"), rating = json.optDouble("rating", 0.0),
    )

    private fun JSONObject.optionalString(key: String): String? = if (isNull(key)) null else optString(key).ifBlank { null }
}
