package com.enzizy.screenroom.player

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.Bitmap
import android.net.Uri
import android.view.KeyEvent
import android.view.View
import android.webkit.*
import android.widget.FrameLayout
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewCompat
import androidx.webkit.WebViewFeature
import org.json.JSONObject

@SuppressLint("SetJavaScriptEnabled")
class PlayerHost(
    context: Context,
    private val source: EmbedSource,
    type: String,
    id: Int,
    season: Int,
    episode: Int,
    private val onEvent: (String) -> Unit,
    private val onControls: () -> Unit,
) : FrameLayout(context) {
    private val webView = WebView(context)
    private var fullscreenView: View? = null
    private var fullscreenCallback: WebChromeClient.CustomViewCallback? = null
    private var destroyed = false

    init {
        keepScreenOn = true
        val loader = WebViewAssetLoader.Builder().addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(context)).build()
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
            allowContentAccess = false
            mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
            javaScriptCanOpenWindowsAutomatically = false
            setSupportMultipleWindows(true)
        }
        webView.webChromeClient = object : WebChromeClient() {
            override fun onCreateWindow(view: WebView?, isDialog: Boolean, isUserGesture: Boolean, resultMsg: android.os.Message?): Boolean = false
            override fun onPermissionRequest(request: PermissionRequest) { request.deny() }
            override fun onShowCustomView(view: View, callback: CustomViewCallback) {
                if (fullscreenView != null) { callback.onCustomViewHidden(); return }
                fullscreenView = view
                fullscreenCallback = callback
                addView(view, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
            }
            override fun onHideCustomView() { exitFullscreen() }
            override fun getDefaultVideoPoster(): Bitmap = Bitmap.createBitmap(1, 1, Bitmap.Config.ARGB_8888)
        }
        webView.webViewClient = object : WebViewClient() {
            override fun shouldInterceptRequest(view: WebView, request: WebResourceRequest): WebResourceResponse? = loader.shouldInterceptRequest(request.url)
            override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
                // Third-party frames cannot replace the app with a redirect or an external intent.
                if (request.isForMainFrame) return request.url.scheme != "https" || request.url.host != LOCAL_HOST
                return request.url.scheme != "https" && request.url.toString() != "about:blank"
            }
            override fun onReceivedError(view: WebView, request: WebResourceRequest, error: WebResourceError) {
                if (request.isForMainFrame) onEvent("error")
            }
            override fun onReceivedSslError(view: WebView, handler: SslErrorHandler, error: android.net.http.SslError) { handler.cancel() }
        }
        // Unlike addJavascriptInterface, this bridge is only exposed to the trusted local origin.
        if (WebViewFeature.isFeatureSupported(WebViewFeature.WEB_MESSAGE_LISTENER)) {
            WebViewCompat.addWebMessageListener(webView, "ScreenRoom", setOf("https://$LOCAL_HOST")) { _, message, origin, mainFrame, _ ->
                if (!destroyed && mainFrame && origin.scheme == "https" && origin.host == LOCAL_HOST) {
                    val event = runCatching { JSONObject(message.data ?: "").optString("type") }.getOrNull()
                    if (event in setOf("ready", "loaded", "playing", "paused", "error")) onEvent(event!!)
                }
            }
        }
        addView(webView, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
        val wrapper = Uri.parse("https://$LOCAL_HOST/assets/player.html").buildUpon()
            .appendQueryParameter("source", source.name.lowercase())
            .appendQueryParameter("embed", source.url(type, id, season, episode)).build()
        webView.loadUrl(wrapper.toString())
    }

    fun control(action: String) {
        if (source == EmbedSource.CINESRC && action in setOf("play", "pause", "toggle", "forward", "rewind")) {
            webView.evaluateJavascript("window.screenRoomControl && window.screenRoomControl('$action')", null)
        }
    }

    fun focusPlayer() { webView.requestFocus() }

    fun stopPlayback() {
        if (destroyed) return
        keepScreenOn = false
        webView.stopLoading()
        webView.loadUrl("about:blank")
        webView.onPause()
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.keyCode == KeyEvent.KEYCODE_DPAD_UP) {
            if (event.action == KeyEvent.ACTION_DOWN) { exitFullscreen(); onControls() }
            return true
        }
        if (source == EmbedSource.CINESRC) {
            val action = when (event.keyCode) {
                KeyEvent.KEYCODE_DPAD_CENTER, KeyEvent.KEYCODE_ENTER, KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE -> "toggle"
                KeyEvent.KEYCODE_MEDIA_PLAY -> "play"
                KeyEvent.KEYCODE_MEDIA_PAUSE -> "pause"
                KeyEvent.KEYCODE_DPAD_LEFT, KeyEvent.KEYCODE_MEDIA_REWIND -> "rewind"
                KeyEvent.KEYCODE_DPAD_RIGHT, KeyEvent.KEYCODE_MEDIA_FAST_FORWARD -> "forward"
                else -> null
            }
            if (action != null) {
                if (event.action == KeyEvent.ACTION_DOWN && event.repeatCount == 0) control(action)
                return true
            }
        }
        return super.dispatchKeyEvent(event)
    }

    fun exitFullscreen(): Boolean {
        val view = fullscreenView ?: return false
        removeView(view)
        fullscreenView = null
        fullscreenCallback?.onCustomViewHidden()
        fullscreenCallback = null
        return true
    }

    fun release() {
        if (destroyed) return
        destroyed = true
        exitFullscreen()
        keepScreenOn = false
        webView.stopLoading()
        webView.loadUrl("about:blank")
        removeAllViews()
        webView.destroy()
    }

    companion object { private const val LOCAL_HOST = "appassets.androidplatform.net" }
}
