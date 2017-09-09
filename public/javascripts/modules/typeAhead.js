import axios from 'axios';
import dompurify from 'dompurify';

// function searchResultsHTML(results) {
//   return results.map(result => {
//     return `
//       <a href="/podcast/${result.slug}" class="search__result">
//         <strong>${result.name}</strong>
//       </a>
//     `;
//   }).join('');
// }


function makeResultToHTMLConverter(category) {
	return (result) => `
      <a href="/${category}/${result.slug}" class="search__result">
        <strong>${result.name}</strong>
      </a>
    `;
}

function searchResultsHTML(results) {
  const podcasts = results.podcasts.map(makeResultToHTMLConverter("podcast"));
  const videos = results.videos.map(makeResultToHTMLConverter("video"));
  return podcasts.concat(videos).join('');
}

function typeAhead(search) {
  if (!search) return;

  const searchInput = search.querySelector('input[name="search"]');
  const searchResults = search.querySelector('.search__results');

  searchInput.on('input', function() {
    // if there is no value, quit it!
    if (!this.value) {
      searchResults.style.display = 'none';
      return; // stop!
    }

    // show the search results!
    searchResults.style.display = 'block';

    axios
      .get(`/api/search?q=${this.value}`)
      .then(res => {
        if (res.data.podcasts.length || res.data.videos.length) {
          searchResults.innerHTML = dompurify.sanitize(searchResultsHTML(res.data));
          return;
        }
        // tell them nothing came back
        searchResults.innerHTML = dompurify.sanitize(`<div class="search__result">Няма резултати за ${this.value}</div>`);
      })
      .catch(err => {
        console.error(err);
      });
  });

  // handle keyboard inputs
  searchInput.on('keyup', (e) => {
    // if they aren't pressing up, down or enter, who cares!
    if (![38, 40, 13].includes(e.keyCode)) {
      return; // nah
    }
    const activeClass = 'search__result--active';
    const current = search.querySelector(`.${activeClass}`);
    const items = search.querySelectorAll('.search__result');
    let next;
    if (e.keyCode === 40 && current) {
      next = current.nextElementSibling || items[0];
    } else if (e.keyCode === 40) {
      next = items[0];
    } else if (e.keyCode === 38 && current) {
      next = current.previousElementSibling || items[items.length - 1]
    } else if (e.keyCode === 38) {
      next = items[items.length - 1];
    } else if (e.keyCode === 13 && current.href) {
      window.location = current.href;
      return;
    }
    if (current) {
      current.classList.remove(activeClass);
    }
    next.classList.add(activeClass);
  });
}

export default typeAhead;
