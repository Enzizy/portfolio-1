package com.enzizy.screenroom.ui

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.enzizy.screenroom.data.CatalogRepository
import com.enzizy.screenroom.data.Title
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.launch

data class CatalogState(
    val type: String = "movie",
    val query: String = "",
    val items: List<Title> = emptyList(),
    val loading: Boolean = true,
    val error: String? = null,
)

class CatalogViewModel : ViewModel() {
    val repository = CatalogRepository()
    var state by mutableStateOf(CatalogState())
        private set
    private var request: Job? = null

    init { load() }

    fun load(type: String = state.type, query: String = state.query) {
        request?.cancel()
        state = CatalogState(type = type, query = query.trim())
        request = viewModelScope.launch {
            try {
                val items = repository.catalog(type, query)
                state = state.copy(items = items, loading = false)
            } catch (error: CancellationException) {
                throw error
            } catch (_: Exception) {
                state = state.copy(loading = false, error = "Could not load titles. Check your connection and try again.")
            }
        }
    }
}
