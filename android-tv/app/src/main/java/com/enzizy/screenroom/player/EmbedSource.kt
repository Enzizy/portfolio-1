package com.enzizy.screenroom.player

enum class EmbedSource(val label: String) {
    CINESRC("CineSrc"), VIDSRC("VidSrc");

    fun url(type: String, id: Int, season: Int = 1, episode: Int = 1): String {
        require(type == "movie" || type == "tv")
        require(id > 0 && season >= 0 && episode > 0)
        return when (this) {
            CINESRC -> "https://cinesrc.st/embed/$type/$id" +
                (if (type == "tv") "?s=$season&e=$episode&" else "?") +
                "autoplay=true&autonext=false&color=%23F5A35C"
            VIDSRC -> "https://vidsrc.sbs/embed/$type/$id" + if (type == "tv") "/$season/$episode" else ""
        }
    }
}
