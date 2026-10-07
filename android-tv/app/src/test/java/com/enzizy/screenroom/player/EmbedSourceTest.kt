package com.enzizy.screenroom.player

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Assert.assertThrows
import org.junit.Test

class EmbedSourceTest {
    @Test fun `movie and TV paths use their provider format`() {
        assertEquals("https://vidsrc.sbs/embed/movie/27205", EmbedSource.VIDSRC.url("movie", 27205))
        assertEquals("https://vidsrc.sbs/embed/tv/1396/0/1", EmbedSource.VIDSRC.url("tv", 1396, 0, 1))
        assertTrue(EmbedSource.CINESRC.url("tv", 1396, 2, 3).startsWith("https://cinesrc.st/embed/tv/1396?s=2&e=3&"))
    }
    @Test fun `invalid identifiers cannot enter embed URLs`() {
        assertThrows(IllegalArgumentException::class.java) { EmbedSource.CINESRC.url("person", 1) }
        assertThrows(IllegalArgumentException::class.java) { EmbedSource.VIDSRC.url("movie", -1) }
        assertThrows(IllegalArgumentException::class.java) { EmbedSource.VIDSRC.url("tv", 1, 1, 0) }
    }
}
