const API_KEY = "e1fd8e813ed0175f104a01d32094f865";

const URL = `https://api.themoviedb.org/3/movie/popular?api_key=${API_KEY}`;
const SEARCH_URL = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=`;
const VIDEO_URL = `https://api.themoviedb.org/3/movie/`;

const moviesContainer = document.getElementById("movies");
const favContainer = document.getElementById("favorites");
const searchInput = document.getElementById("search");

// 🎬 FETCH MOVIES
function getMovies(url) {
  moviesContainer.innerHTML = "<h2>Loading...</h2>";

  fetch(url)
    .then(res => res.json())
    .then(data => {
      moviesContainer.innerHTML = "";

      data.results.forEach(movie => {
        const div = document.createElement("div");
        div.classList.add("movie");

        const imageURL = movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : "https://via.placeholder.com/300x450?text=No+Image";

        div.innerHTML = `
          <img src="${imageURL}" />
          <h3>${movie.title}</h3>
          <button class="fav-btn">❤️</button>
        `;

        // Popup
        div.addEventListener("click", () => {
          showMovieDetails(movie);
        });

        // Favorite button
        const favBtn = div.querySelector(".fav-btn");

        favBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          addToFavorites(movie);
        });

        moviesContainer.appendChild(div);
      });
    });
}

// 🔍 SEARCH (DEBOUNCE)
let timeout;

searchInput.addEventListener("keyup", () => {
  clearTimeout(timeout);

  timeout = setTimeout(() => {
    const query = searchInput.value;

    if (query.trim() !== "") {
      getMovies(SEARCH_URL + query);
    } else {
      getMovies(URL);
    }
  }, 500);
});

// 🎬 POPUP + TRAILER
function showMovieDetails(movie) {
  const overlay = document.createElement("div");
  overlay.classList.add("overlay");

  const imageURL = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : "https://via.placeholder.com/300x450?text=No+Image";

  fetch(`${VIDEO_URL}${movie.id}/videos?api_key=${API_KEY}`)
    .then(res => res.json())
    .then(data => {
      const trailer = data.results.find(
        vid => vid.type === "Trailer" && vid.site === "YouTube"
      );

      overlay.innerHTML = `
        <div class="popup">
          <span class="close">&times;</span>
          <img src="${imageURL}" />
          <h2>${movie.title}</h2>

          ${
            trailer
              ? `<iframe src="https://www.youtube.com/embed/${trailer.key}" allowfullscreen></iframe>`
              : `<p>No trailer available</p>`
          }

          <p>${movie.overview.slice(0, 150)}...</p>
          <h3>⭐ ${movie.vote_average}</h3>
        </div>
      `;

      document.body.appendChild(overlay);

      overlay.querySelector(".close").addEventListener("click", () => {
        overlay.remove();
      });

      overlay.addEventListener("click", (e) => {
        if (e.target === overlay) overlay.remove();
      });
    });
}

// ❤️ FAVORITES
function getFavorites() {
  return JSON.parse(localStorage.getItem("favorites")) || [];
}

function addToFavorites(movie) {
  let favs = getFavorites();

  if (!favs.find(m => m.id === movie.id)) {
    favs.push(movie);
  }

  localStorage.setItem("favorites", JSON.stringify(favs));
  displayFavorites();
}

function removeFromFavorites(id) {
  let favs = getFavorites().filter(m => m.id !== id);

  localStorage.setItem("favorites", JSON.stringify(favs));
  displayFavorites();
}

function displayFavorites() {
  const favs = getFavorites();
  favContainer.innerHTML = "";

  favs.forEach(movie => {
    const div = document.createElement("div");
    div.classList.add("movie");

    const imageURL = movie.poster_path
      ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
      : "https://via.placeholder.com/300x450?text=No+Image";

    div.innerHTML = `
      <img src="${imageURL}" />
      <h3>${movie.title}</h3>
      <button class="remove-btn">❌</button>
    `;

    // remove button
    const removeBtn = div.querySelector(".remove-btn");

    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation(); // IMPORTANT FIX
      removeFromFavorites(movie.id);
    });

    // popup
    div.addEventListener("click", () => {
      showMovieDetails(movie);
    });

    favContainer.appendChild(div);
  });
}

// 🚀 INIT
getMovies(URL);
displayFavorites();