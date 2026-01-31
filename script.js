const playButton = document.querySelector(".play-button");
const prevButton = document.querySelector('.icon-button[aria-label="Previous"]');
const nextButton = document.querySelector('.icon-button[aria-label="Next"]');
const menuButton = document.querySelector(".menu-button");
const player = document.querySelector(".player");
const playerTitle = document.querySelector(".player-title");
const playlistList = null;
const menuOverlay = document.querySelector(".menu-overlay");
const menuClose = document.querySelector(".menu-close");
const menuPlaylistList = document.querySelector(
    ".menu-popup-body .playlist-list"
);
const audio = document.querySelector("#audio");
const seekBar = document.querySelector(".seek-bar");
const albumArt = document.querySelector(".album-art");
const fallbackArt = document.querySelector(".fallback-art");

// JAM elements
const jamButton = document.querySelector(".jam-button");
const jamText = document.querySelector(".jam-text");

let isSeeking = false;

const SUPABASE_URL = "https://rkvdecivawhhwdczburz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_MYUaQjH-S8LnQXK5x9YYKg_6D1VuCch";
const SUPABASE_TABLE = "songs";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_PUBLISHABLE_KEY
);

let songs = [];
let currentIndex = 0;

// ===== JAM STATE =====
let jamChannel = null;
let isJamming = false;
let jamUsers = {};
let ignoreNextBroadcast = false;

function getDeviceId() {
    let id = localStorage.getItem("jam_device_id");
    if (!id) {
        id = "dev_" + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
        localStorage.setItem("jam_device_id", id);
    }
    return id;
}

const deviceId = getDeviceId();

// ===== JAM FUNCTIONS =====
function updateJamUI() {
    const userCount = Object.keys(jamUsers).length;
    
    if (!isJamming) {
        jamButton.dataset.active = "false";
        if (jamText) jamText.textContent = "JAM (0)";
        return;
    }
    
    jamButton.dataset.active = "true";
    if (jamText) jamText.textContent = `JAM (${userCount})`;
}

function broadcastAction(action, payload = {}) {
    if (!jamChannel || !isJamming) return;
    
    jamChannel.send({
        type: "broadcast",
        event: "sync",
        payload: {
            action,
            deviceId,
            timestamp: Date.now(),
            ...payload
        }
    });
}

function handleBroadcast(payload) {
    if (payload.deviceId === deviceId) return;
    if (ignoreNextBroadcast) {
        ignoreNextBroadcast = false;
        return;
    }
    
    const { action } = payload;
    
    switch (action) {
        case "play":
            if (payload.songIndex !== undefined && payload.songIndex !== currentIndex) {
                currentIndex = payload.songIndex;
                setActiveSong();
            }
            if (payload.currentTime !== undefined) {
                audio.currentTime = payload.currentTime;
            }
            audio.play().catch(() => {});
            playButton.dataset.state = "playing";
            playButton.querySelector(".icon").textContent = "⏸";
            player?.classList.add("is-playing");
            break;
            
        case "pause":
            audio.pause();
            playButton.dataset.state = "paused";
            playButton.querySelector(".icon").textContent = "▶";
            player?.classList.remove("is-playing");
            break;
            
        case "next":
        case "prev":
        case "select":
            if (payload.songIndex !== undefined) {
                currentIndex = payload.songIndex;
                setActiveSong();
                if (payload.isPlaying) {
                    audio.play().catch(() => {});
                    playButton.dataset.state = "playing";
                    playButton.querySelector(".icon").textContent = "⏸";
                    player?.classList.add("is-playing");
                }
            }
            break;
            
        case "seek":
            if (payload.currentTime !== undefined && audio.duration) {
                audio.currentTime = payload.currentTime;
                if (seekBar) {
                    seekBar.value = (payload.currentTime / audio.duration) * 100;
                }
            }
            break;
    }
}

async function joinJam() {
    if (isJamming) return;
    
    jamChannel = supabaseClient.channel("jam-session", {
        config: {
            presence: { key: deviceId }
        }
    });
    
    jamChannel
        .on("presence", { event: "sync" }, () => {
            const state = jamChannel.presenceState();
            jamUsers = {};
            Object.keys(state).forEach(key => {
                jamUsers[key] = state[key][0];
            });
            updateJamUI();
        })
        .on("broadcast", { event: "sync" }, ({ payload }) => {
            handleBroadcast(payload);
        });
    
    await jamChannel.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
            await jamChannel.track({
                deviceId,
                joinedAt: Date.now()
            });
            isJamming = true;
            updateJamUI();
        }
    });
}

async function leaveJam() {
    if (!isJamming || !jamChannel) return;
    
    await jamChannel.untrack();
    await jamChannel.unsubscribe();
    jamChannel = null;
    isJamming = false;
    jamUsers = {};
    updateJamUI();
}

function toggleJam() {
    if (isJamming) {
        leaveJam();
    } else {
        joinJam();
    }
}

if (jamButton) {
    jamButton.addEventListener("click", toggleJam);
}

function updateTitle() {
    if (!playerTitle || !songs[currentIndex]) return;
    playerTitle.textContent = songs[currentIndex].name;
}

function updateCoverImage() {
    const track = songs[currentIndex];
    if (!albumArt) return;
    
    const imageUrl = track?.image_url;
    
    if (!imageUrl) {
        albumArt.classList.remove("loaded");
        albumArt.src = "";
        return;
    }
    
    const img = new Image();
    img.onload = () => {
        albumArt.src = imageUrl;
        albumArt.classList.add("loaded");
    };
    img.onerror = () => {
        albumArt.classList.remove("loaded");
        albumArt.src = "";
    };
    img.src = imageUrl;
}

function setActiveSong() {
    const track = songs[currentIndex];
    if (!track || !audio) return;
    audio.src = track.url;
    updateTitle();
    updateCoverImage();
    syncPlaylistActive();
}

function syncPlaylistActive() {
    if (menuPlaylistList) {
        [...menuPlaylistList.children].forEach((item, index) => {
            item.classList.toggle("is-active", index === currentIndex);
        });
    }
}

if (playButton) {
    playButton.addEventListener("click", () => {
        const isPlaying = playButton.dataset.state === "playing";
        playButton.dataset.state = isPlaying ? "paused" : "playing";
        playButton.setAttribute("aria-label", isPlaying ? "Play" : "Pause");
        playButton.querySelector(".icon").textContent = isPlaying ? "▶" : "⏸";
        if (player) {
            player.classList.toggle("is-playing", !isPlaying);
        }
        if (audio) {
            if (isPlaying) {
                audio.pause();
                broadcastAction("pause");
            } else {
                audio.play().catch(() => {});
                broadcastAction("play", {
                    songIndex: currentIndex,
                    currentTime: audio.currentTime
                });
            }
        }
    });
}

if (prevButton) {
    prevButton.addEventListener("click", () => {
        if (!songs.length) return;
        currentIndex = (currentIndex - 1 + songs.length) % songs.length;
        setActiveSong();
        const isPlaying = playButton?.dataset.state === "playing";
        if (audio && isPlaying) {
            audio.play().catch(() => {});
        }
        broadcastAction("prev", {
            songIndex: currentIndex,
            isPlaying
        });
    });
}

if (nextButton) {
    nextButton.addEventListener("click", () => {
        if (!songs.length) return;
        currentIndex = (currentIndex + 1) % songs.length;
        setActiveSong();
        const isPlaying = playButton?.dataset.state === "playing";
        if (audio && isPlaying) {
            audio.play().catch(() => {});
        }
        broadcastAction("next", {
            songIndex: currentIndex,
            isPlaying
        });
    });
}

function openMenu() {
    if (!menuOverlay) return;
    menuOverlay.removeAttribute("hidden");
    requestAnimationFrame(() => {
        menuOverlay.classList.add("is-open");
    });
}

function closeMenu() {
    if (!menuOverlay) return;
    menuOverlay.classList.remove("is-open");
    window.setTimeout(() => {
        menuOverlay.setAttribute("hidden", "");
    }, 200);
}

if (menuButton && menuOverlay) {
    menuButton.addEventListener("click", openMenu);
}

if (menuClose && menuOverlay) {
    menuClose.addEventListener("click", closeMenu);
}

if (menuOverlay) {
    menuOverlay.addEventListener("click", (event) => {
        if (event.target === menuOverlay) {
            closeMenu();
        }
    });
}

async function loadSongs() {
    const { data, error } = await supabaseClient
        .from(SUPABASE_TABLE)
        .select("name, url, image_url")
        .order("name", { ascending: true });

    if (error) {
        console.error("Failed to load songs:", error.message);
        return;
    }

    songs = (data || []).filter(
        (track) => track.name && track.url
    );

    if (!songs.length) {
        return;
    }

    currentIndex = 0;

    if (menuPlaylistList) {
        menuPlaylistList.innerHTML = "";
        songs.forEach((track, index) => {
            const item = document.createElement("li");
            item.className = "playlist-item";
            item.textContent = track.name;
            item.dataset.index = index;
            item.addEventListener("click", (e) => {
                e.stopPropagation();
                currentIndex = index;
                setActiveSong();
                if (playButton) {
                    playButton.dataset.state = "playing";
                    playButton.setAttribute("aria-label", "Pause");
                    playButton.querySelector(".icon").textContent = "⏸";
                }
                if (player) {
                    player.classList.add("is-playing");
                }
                audio?.play().catch(() => {});
                broadcastAction("select", {
                    songIndex: currentIndex,
                    isPlaying: true
                });
                closeMenu();
            });
            menuPlaylistList.appendChild(item);
        });
    }

    setActiveSong();
}

if (audio) {
    audio.addEventListener("timeupdate", () => {
        if (!isSeeking && audio.duration) {
            const percent = (audio.currentTime / audio.duration) * 100;
            if (seekBar) seekBar.value = percent;
        }
    });

    audio.addEventListener("loadedmetadata", () => {
        if (seekBar) seekBar.value = 0;
    });

    audio.addEventListener("ended", () => {
        if (!songs.length) return;
        currentIndex = (currentIndex + 1) % songs.length;
        setActiveSong();
        if (playButton) {
            playButton.dataset.state = "playing";
            playButton.setAttribute("aria-label", "Pause");
            playButton.querySelector(".icon").textContent = "⏸";
        }
        if (player) {
            player.classList.add("is-playing");
        }
        audio.play().catch(() => {});
    });
}

if (seekBar) {
    seekBar.addEventListener("input", () => {
        isSeeking = true;
    });

    seekBar.addEventListener("change", () => {
        if (audio && audio.duration) {
            audio.currentTime = (seekBar.value / 100) * audio.duration;
            broadcastAction("seek", {
                currentTime: audio.currentTime
            });
        }
        isSeeking = false;
    });
}

loadSongs();