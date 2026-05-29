    // ---------- FIXED AND FULLY FUNCTIONAL CODE ----------
    // DOM elements
    const RECO_CONTAINER = document.getElementById("recommendations");
    const moviesContainer = document.getElementById("movies");
    const favContainer = document.getElementById("favorites");
    const searchInput = document.getElementById("search");
    
    // API constants (your existing key)
    const API_KEY = "e1fd8e813ed0175f104a01d32094f865";
    const BASE_URL = "https://api.themoviedb.org/3";
    const POPULAR_URL = `${BASE_URL}/movie/popular?api_key=${API_KEY}&language=en-US&page=1`;
    const SEARCH_URL = `${BASE_URL}/search/movie?api_key=${API_KEY}&language=en-US&query=`;
    
    // ------------------------------------------------------------------
    // 1. FETCH MOVIES (popular or search) + render with favorite buttons
    // ------------------------------------------------------------------
    function fetchAndRenderMovies(url, container, isRecommendationMode = false) {
        // For main movies container, show loading only if not recommendations
        if (container === moviesContainer) {
            container.innerHTML = "<div style='text-align:center; padding:2rem;'>⏳ Loading cinematic gems...</div>";
        }
        
        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                if (!data.results) {
                    container.innerHTML = "<p>✨ No results found</p>";
                    return;
                }
                if (container === moviesContainer) {
                    container.innerHTML = "";
                } else if (container === RECO_CONTAINER && !isRecommendationMode) {
                    // for reco container we handle separately later but keep logic
                }
                
                const movies = data.results;
                if (movies.length === 0 && container === moviesContainer) {
                    container.innerHTML = "<p>😢 No movies match your search.</p>";
                    return;
                }
                
                // render inside the proper container
                if (container === moviesContainer) {
                    renderMovieGrid(movies, container, "main");
                } else if (container === RECO_CONTAINER) {
                    renderMovieRecommendations(movies, container);
                }
            })
            .catch(err => {
                console.error("Fetch error:", err);
                if (container === moviesContainer) {
                    container.innerHTML = "<p style='color:#ff8888'>⚠️ Network error. Check your connection or API key.</p>";
                }
            });
    }
    
    // renders grid for main & favorites (with fav/remove controls)
    function renderMovieGrid(movies, container, type) {
        container.innerHTML = "";
        movies.forEach(movie => {
            const movieCard = document.createElement("div");
            movieCard.classList.add("movie");
            const posterPath = movie.poster_path 
                ? `https://image.tmdb.org/t/p/w342${movie.poster_path}` 
                : "https://via.placeholder.com/300x450?text=No+Cover";
            
            // common inner structure
            let buttonHtml = "";
            if (type === "main") {
                buttonHtml = `<button class="fav-btn" data-id="${movie.id}" data-title="${movie.title.replace(/'/g, "\\'")}">❤️ Favorite</button>`;
            } else if (type === "favorites") {
                buttonHtml = `<button class="remove-btn" data-id="${movie.id}">❌ Remove</button>`;
            }
            
            movieCard.innerHTML = `
                <img src="${posterPath}" alt="${movie.title}" loading="lazy">
                <h3>${movie.title}</h3>
                ${buttonHtml}
            `;
            
            // click on card -> show details + fetch similar movies for that movie
            movieCard.addEventListener("click", (e) => {
                // if click originated from button, prevent double trigger
                if (e.target.classList && (e.target.classList.contains("fav-btn") || e.target.classList.contains("remove-btn"))) {
                    return;
                }
                showMovieDetails(movie);
                // 🔥 CRITICAL: fetch similar movies for the clicked movie (recommendations update)
                fetchSimilarMovies(movie.id);
            });
            
            // handle favorite button (only for main cards)
            if (type === "main") {
                const favBtn = movieCard.querySelector(".fav-btn");
                favBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    addToFavorites(movie);
                });
            } 
            // handle remove button (favorites)
            else if (type === "favorites") {
                const removeBtn = movieCard.querySelector(".remove-btn");
                removeBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    removeFromFavorites(movie.id);
                });
            }
            
            container.appendChild(movieCard);
        });
    }
    
    // ------------------------------------------------------------------
    // 2. RECOMMENDATION ENGINE (fully fixed) 
    // ------------------------------------------------------------------
    function fetchSimilarMovies(movieId) {
        if (!movieId) return;
        const url = `${BASE_URL}/movie/${movieId}/similar?api_key=${API_KEY}&language=en-US&page=1`;
        
        fetch(url)
            .then(res => res.json())
            .then(data => {
                const similarMovies = data.results || [];
                renderMovieRecommendations(similarMovies, RECO_CONTAINER);
            })
            .catch(err => {
                console.warn("Similar movies error:", err);
                RECO_CONTAINER.innerHTML = `<div style="color:#aaa; padding:1rem;">⚠️ Could not load recommendations</div>`;
            });
    }
    
    function renderMovieRecommendations(movies, container) {
        container.innerHTML = "";
        if (!movies || movies.length === 0) {
            container.innerHTML = `<div style="color:#aaa; padding:1rem;">✨ Click on any movie to see similar recommendations ✨</div>`;
            return;
        }
        
        // show top 12 similar movies
        const sliced = movies.slice(0, 12);
        sliced.forEach(movie => {
            if (!movie.poster_path) return; // skip missing posters
            const recoCard = document.createElement("div");
            recoCard.classList.add("movie");
            recoCard.style.minWidth = "130px";
            recoCard.style.cursor = "pointer";
            
            const posterUrl = `https://image.tmdb.org/t/p/w200${movie.poster_path}`;
            recoCard.innerHTML = `
                <img src="${posterUrl}" alt="${movie.title}" loading="lazy">
                <p style="font-weight:500; margin-top:6px;">${movie.title}</p>
            `;
            // when clicking on recommended movie => show details & update recommendations (netflix style)
            recoCard.addEventListener("click", (e) => {
                e.stopPropagation();
                showMovieDetails(movie);
                // update recommendations again based on this new movie
                fetchSimilarMovies(movie.id);
            });
            container.appendChild(recoCard);
        });
    }
    
    // ------------------------------------------------------------------
    // 3. POPUP + TRAILER (fixed and robust)
    // ------------------------------------------------------------------
    function showMovieDetails(movie) {
        // avoid duplicate overlays
        const existingOverlay = document.querySelector(".overlay");
        if (existingOverlay) existingOverlay.remove();
        
        const overlay = document.createElement("div");
        overlay.classList.add("overlay");
        
        const imageUrl = movie.poster_path
            ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
            : "https://via.placeholder.com/300x450?text=No+Image";
        
        fetch(`${BASE_URL}/movie/${movie.id}/videos?api_key=${API_KEY}&language=en-US`)
            .then(res => res.json())
            .then(videoData => {
                const trailer = videoData.results?.find(vid => vid.type === "Trailer" && vid.site === "YouTube");
                const trailerHtml = trailer 
                    ? `<iframe src="https://www.youtube.com/embed/${trailer.key}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`
                    : `<p style="background:#1f2538; padding:12px; border-radius:20px;">🎬 No trailer available, but you can still enjoy this gem!</p>`;
                
                const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "N/A";
                const year = movie.release_date ? movie.release_date.slice(0,4) : "TBA";
                
                overlay.innerHTML = `
                    <div class="popup">
                        <span class="close">&times;</span>
                        <img src="${imageUrl}" alt="${movie.title}" />
                        <h2>${movie.title} <span style="font-size:1rem;">(${year})</span></h2>
                        ${trailerHtml}
                        <p><strong>📖 Overview:</strong> ${movie.overview ? movie.overview.slice(0, 220) : "No synopsis provided"}${movie.overview?.length > 220 ? "..." : ""}</p>
                        <h3>⭐ ${rating} / 10 · ${movie.vote_count ? movie.vote_count.toLocaleString() : 0} votes</h3>
                        <button id="quickFavPopup" style="margin-top:12px; background:#e6b422; border:none; padding:8px 14px; border-radius:40px; font-weight:bold; cursor:pointer;">❤️ Add to Favorites</button>
                    </div>
                `;
                
                document.body.appendChild(overlay);
                
                // close handlers
                const closeBtn = overlay.querySelector(".close");
                closeBtn.addEventListener("click", () => overlay.remove());
                overlay.addEventListener("click", (e) => {
                    if (e.target === overlay) overlay.remove();
                });
                
                // Quick add from popup
                const favPopupBtn = overlay.querySelector("#quickFavPopup");
                favPopupBtn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    addToFavorites(movie);
                    favPopupBtn.textContent = "✅ Added!";
                    setTimeout(() => { favPopupBtn.textContent = "❤️ Add to Favorites"; }, 1500);
                });
            })
            .catch(() => {
                // fallback if video API fails
                overlay.innerHTML = `
                    <div class="popup">
                        <span class="close">&times;</span>
                        <img src="${imageUrl}" />
                        <h2>${movie.title}</h2>
                        <p>No trailer could be loaded.</p>
                        <p>${movie.overview?.slice(0, 200) || "Overview not available"}</p>
                        <h3>⭐ ${movie.vote_average || "?"}</h3>
                        <button id="quickFavPopup" style="margin:12px auto; background:#e6b422; padding:8px 14px; border-radius:40px;">❤️ Add to Favorites</button>
                    </div>
                `;
                document.body.appendChild(overlay);
                overlay.querySelector(".close")?.addEventListener("click", () => overlay.remove());
                overlay.addEventListener("click", (e) => { if (e.target === overlay) overlay.remove(); });
                const btn = overlay.querySelector("#quickFavPopup");
                if (btn) btn.addEventListener("click", (e) => { e.stopPropagation(); addToFavorites(movie); btn.textContent = "✅ Saved!"; setTimeout(()=> btn.textContent="❤️ Add to Favorites", 1300); });
            });
    }
    
    // ------------------------------------------------------------------
    // 4. FAVORITES (LocalStorage) + display
    // ------------------------------------------------------------------
    function getFavorites() {
        const stored = localStorage.getItem("cine_favorites");
        if (!stored) return [];
        try {
            return JSON.parse(stored);
        } catch(e) { return []; }
    }
    
    function saveFavorites(favs) {
        localStorage.setItem("cine_favorites", JSON.stringify(favs));
    }
    
    function addToFavorites(movie) {
        let favs = getFavorites();
        const exists = favs.some(m => m.id === movie.id);
        if (!exists) {
            favs.push(movie);
            saveFavorites(favs);
            displayFavorites();
            showToastMessage(`✨ "${movie.title}" added to favorites!`);
        } else {
            showToastMessage(`📌 "${movie.title}" is already in favorites`);
        }
    }
    
    function removeFromFavorites(movieId) {
        let favs = getFavorites();
        const updated = favs.filter(m => m.id !== movieId);
        saveFavorites(updated);
        displayFavorites();
        showToastMessage(`🗑️ Removed from favorites.`);
    }
    
    function displayFavorites() {
        if (!favContainer) return;
        const favMovies = getFavorites();
        favContainer.innerHTML = "";
        if (favMovies.length === 0) {
            favContainer.innerHTML = `<div style="grid-column:1/-1; text-align:center; color:#99a4c2;">💔 No favorites yet — click ❤️ on any movie!</div>`;
            return;
        }
        renderMovieGrid(favMovies, favContainer, "favorites");
    }
    
    // simple inline toast (optional)
    function showToastMessage(msg) {
        let toast = document.querySelector(".custom-toast");
        if (toast) toast.remove();
        const div = document.createElement("div");
        div.className = "custom-toast";
        div.textContent = msg;
        div.style.position = "fixed";
        div.style.bottom = "20px";
        div.style.left = "20px";
        div.style.background = "#1e293b";
        div.style.color = "#FFE484";
        div.style.padding = "10px 20px";
        div.style.borderRadius = "40px";
        div.style.zIndex = "2000";
        div.style.fontWeight = "500";
        div.style.boxShadow = "0 4px 14px rgba(0,0,0,0.5)";
        document.body.appendChild(div);
        setTimeout(() => div.remove(), 2000);
    }
    
    // ------------------------------------------------------------------
    // 5. SEARCH with debounce (FIXED to work correctly)
    // ------------------------------------------------------------------
    let debounceTimer;
    function handleSearch() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = searchInput.value.trim();
            if (query !== "") {
                const encodedQuery = encodeURIComponent(query);
                fetchAndRenderMovies(SEARCH_URL + encodedQuery, moviesContainer, false);
            } else {
                fetchAndRenderMovies(POPULAR_URL, moviesContainer, false);
            }
        }, 500);
    }
    
    searchInput.addEventListener("input", handleSearch);
    
    // ------------------------------------------------------------------
    // 6. INITIALIZE everything: Load popular, favorites, plus default recommendations? (empty state)
    // ------------------------------------------------------------------
    function init() {
        // load main movies (popular)
        fetchAndRenderMovies(POPULAR_URL, moviesContainer, false);
        // load favorites from storage
        displayFavorites();
        // initial recommendations placeholder (friendly hint)
        RECO_CONTAINER.innerHTML = `<div style="color:#b9c3db; padding:1rem; text-align:center;">🎬 Click any movie above → get smart similar picks here!</div>`;
        
        // additional: for demo, when a movie from recommendations is clicked -> updates again
        // already handled inside renderMovieRecommendations
    }
    
    init();


