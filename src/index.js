import { Notify } from 'notiflix/build/notiflix-notify-aio';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';
import { PixabayAPI } from './js/PixabayAPI';
import { createMarkup } from './js/createMarkup';
import { refs } from './js/refs';

const pixabay = new PixabayAPI();
const lightbox = new SimpleLightbox('.gallery a');

const options = {
  root: null,
  rootMargin: '100px',
  threshold: 1.0,
};

const io = new IntersectionObserver(onScroll, options);

refs.form.addEventListener('submit', onSubmit);

async function onSubmit(e) {
  e.preventDefault();
  const { searchQuery } = e.currentTarget;
  const query = searchQuery.value.trim().toLowerCase();

  if (!query) {
    Notify.failure('Enter query to search!');
    return;
  }

  pixabay.query = query;

  clearPage();

  try {
    const { hits: results, totalHits: total } = await pixabay.getPhotos();

    if (results.length === 0) {
      Notify.info(
        `Sorry, there are no images matching your search query. Please try again.`
      );
      return;
    }

    const markup = createMarkup(results);
    refs.list.insertAdjacentHTML('beforeend', markup);

    lightbox.refresh();

    pixabay.calculateTotalPages(total);

    if (pixabay.isShowLoadMore) {
      const target = document.querySelector('.photo-card:last-child');
      io.observe(target);
    }

    Notify.success(`Hooray! We found ${total} images.`);
  } catch (error) {
    Notify.failure(error.message, 'Something went wrong!');
    clearPage();
  }
}

async function onScroll(entries, observer) {
  entries.forEach(async entry => {
    if (entry.isIntersecting) {
      pixabay.incrementPage();
      observer.unobserve(entry.target);

      try {
        const { hits: results } = await pixabay.getPhotos();

        const markup = createMarkup(results);
        refs.list.insertAdjacentHTML('beforeend', markup);
        lightbox.refresh();

        if (pixabay.isShowLoadMore) {
          const target = document.querySelector('.photo-card:last-child');
          io.observe(target);
        } else {
          Notify.warning(
            "We're sorry, but you've reached the end of search results."
          );
        }
      } catch (error) {
        Notify.failure(error.message, 'Something went wrong!');
        clearPage();
      }
    }
  });
}

function clearPage() {
  pixabay.resetPage();
  refs.list.innerHTML = '';
  refs.loadMoreBtn.classList.add('is-hidden');
}
