const select = id => document.getElementById(id);
const bodyEl = select('body');
const headerNav = select('header-nav');
const itemCountsEl = select('category-item-count');
const newsContainer = select('news-posts');
const sortViewEl = select('sort-view');
const newsModal = select('newsModal');
const newsStatusBtns = select('news-status-btns');

const dataStore = {
    displayed_news: []
}

const getData = async url => {
    const res = await fetch(url);
    const data = await res.json();

    return data;
}

const renderLoader = () => {
    bodyEl.classList.add('overflow-hidden')
    const loaderContainer = document.createElement('div');
    const classes = ['loader-container', 'position-absolute', 'top-0', 'left-0', 'vw-100', 'vh-100', 'd-flex', 'justify-content-center', 'align-items-center'];
    loaderContainer.classList.add(...classes);
    loaderContainer.innerHTML = `
        <div class="spinner-grow text-light" role="status">
            <span class="visually-hidden">Loading...</span>
        </div>
        `;

    bodyEl.appendChild(loaderContainer);
}

const hideLoader = () => {
    bodyEl.classList.remove('overflow-hidden');
    bodyEl.querySelector('.loader-container').remove();
}

const renderCategories = async () => {
    try {
        // 1. Render loader
        renderLoader();

        // 2. Get data
        const data = await getData('https://openapi.programming-hero.com/api/news/categories');

        // 3. Hide loader on data arrival
        data && hideLoader();

        const categories = data.data.news_category;

        // 4. Display each category on UI
        categories.forEach((cat, i) => {
            const catItem = document.createElement('li');
            catItem.classList.add('nav-item');
            catItem.setAttribute('data-id', `${cat.category_id}`);

            // 2.1: active 5th nav item and render the news of this category
            if (i === 1) {
                catItem.classList.add('nav-item-active');
                loadNews(cat.category_id);
            }

            // 2.2: insert into nav list
            catItem.innerHTML = `
            <a class="nav-link" href="#">${cat.category_name}</a>
        `;

            headerNav.appendChild(catItem);
        })
    } catch (err) {
        alert('Category not found!');
        hideLoader();
    }
}
renderCategories()

const countNews = newsCount => {
    let countStr = newsCount >= 1 ? `${newsCount} items found` : 'No item found';
    itemCountsEl.textContent = `${countStr} for category Entertainment`
}

const formatNewsDetails = str => {
    const newStr = str.slice(0, 200);
    return `${newStr}...`;
}

const copyDataStoreArr = () => {
    const dataStoreCopy = JSON.parse(JSON.stringify(dataStore));
    return dataStoreCopy.displayed_news;
}

const sortNewsByViews = newsAll => {
    const newsArr = Array.isArray(newsAll) ? newsAll : copyDataStoreArr();
    dataStore.sortBy = sortViewEl.value === 'default' ? false : sortViewEl.value === 'higherFirst' ? 'higherFirst' : 'lowerFirst';

    let sortedNews;
    // Highest to lowest
    if (dataStore.sortBy === 'higherFirst') {
        sortedNews = newsArr.sort((n1, n2) => n2.total_view - n1.total_view);
        // Lowest to highest 
    } else if (dataStore.sortBy === 'lowerFirst') {
        sortedNews = newsArr.sort((n1, n2) => n1.total_view - n2.total_view);
    } else {
        // Default
        sortedNews = newsArr;
    }

    renderNews(sortedNews);
}

const sortNewsByStatus = (e, newsAll) => {
    if (e) {
        const btn = e.target;
        dataStore.sortStatus = btn.dataset.status ?? dataStore.sortStatus;

        if (!dataStore.sortStatus) return;
    
        if (btn.classList.contains('news-btn')) {
            [...e.currentTarget.children].forEach(btn => btn.classList.remove('news-btn-active'));
            btn.classList.add('news-btn-active');
        }
    }

    const newsArr = newsAll || copyDataStoreArr();

    let sortedNews;
    if (dataStore.sortStatus === 'todaysPick') {
        sortedNews = newsArr.filter(news => news.others_info.is_todays_pick);
    } else if(dataStore.sortStatus === 'trending') {
        sortedNews = newsArr.filter(news => news.others_info.is_trending);
    } else {
        sortedNews = newsArr;
    }

    sortNewsByViews(sortedNews);
}

const loadNews = async id => {
    try {
        // 1. Render loader
        renderLoader();

        const data = await getData(`https://openapi.programming-hero.com/api/news/category/${id}`);

        // 2. Hide loader on data arrival
        data && hideLoader();

        dataStore.displayed_news = data.data;
        sortNewsByStatus(undefined, dataStore.displayed_news)

        // 3. Display Post Count Status
        countNews(dataStore.displayed_news.length);
    } catch (err) {
        alert('News could not found!');
        hideLoader();
    }
}

const renderNews = newsArr => {
    // Clear news container before adding new posts
    newsContainer.textContent = '';

    // Add posts 
    newsArr.forEach(news => {
        const newsItem = document.createElement('div');
        newsItem.classList.add('col');
        newsItem.innerHTML = `
        <div class="card flex-lg-row flex-column border-0 shadow-sm my-5" data-id='${news._id}'>
        <div class="card-header news-card-header border-0">
            <img src="${news.image_url}" class="card-img-top img-fluid news-post-img" alt="News Pic">
        </div>
        <div class="card-body news-card-body mt-lg-0 mt-2">
            <h3 class="card-title fs-5 fw-semibold mb-3">${news.title}</h3>
            <p class="card-text">${formatNewsDetails(news.details)}</p>
            <ul class="news-infos list-unstyled d-sm-flex justify-content-between align-items-center mt-4">
                <li class="d-flex align-items-center">
                    <img class="news-author me-2 rounded-circle" src="${news.author.img}" alt="">
                    <div>
                        <h5 class="fs-6 fw-semibold mb-0">${news.author.name ? news.author.name : 'Author name unknown'}</h5>
                        <p class="text-muted m-0">${news.author.published_date ? news.author.published_date : 'Published date unknown'}</p>
                    </div>
                </li>
                <li class="d-flex align-items-center">
                    <i class="fa-solid fa-eye text-muted"></i>
                    <h5 class="mb-0 ms-2">${news.total_view ? `${news.total_view }K` : 'No views'}</h5>
                </li>
                <li class="text-muted">
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star-half-stroke"></i>
                </li>
                <li>
                    <button class='btn-details border-0 bg-transparent' data-bs-toggle="modal" data-bs-target="#newsModal">
                        <i class="fa-solid fa-arrow-right"></i>
                    </button>
                </li>
            </ul>
        </div>
    </div>
        `;

        newsContainer.appendChild(newsItem);
    })
}

/**
 * 1. loaded news grether than 10 ? 
 *      show first 10 news and showMore 
 *    showMore click => 10 news ? 
 *       show next 10 news : show the rest
 *              rest = 0 ? remove showMore
 * 2. loaded news less than 10 ?
 *      show all the news
 */

const loadCategoryWiseNews = e => {
    const navItem = e.target.closest('.nav-item');

    if (!navItem) return;

    // Remove active class from previous active nav item and add to the current nav item
    const navitemAll = document.querySelectorAll('.nav-item');
    navitemAll.forEach(item => item.classList.remove('nav-item-active'));
    navItem.classList.add('nav-item-active')

    // Get category id to render news
    const id = navItem.dataset.id;
    loadNews(id);

}

const getNewsDetails = async e => {
    const btnDetails = e.target.closest('.btn-details');

    if (!btnDetails) return;

    const id = btnDetails.closest('.card').dataset.id;
    try {
        // Render Loader
        renderLoader();

        const data = await getData(`https://openapi.programming-hero.com/api/news/${id}`);
        const news = await data;

        // Hide loader on data arrival
        hideLoader();

        // If there is news details, then display it
        news && displayNewsDetails(news.data[0]);
    } catch (err) {
        alert('News details is not found!');
        hideLoader();
    }

}

const displayNewsDetails = news => {
    const newsDialog = document.getElementById('modal-dialog');
    const newsDiv = document.createElement('div');
    newsDiv.classList.add('modal-content');

    newsDiv.innerHTML = `
        <div class="modal-header">
            <h5 class="modal-title fs-3 fw-semibold" id="exampleModalLabel">${news.title}</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
            <div class='text-center border-bottom pb-3 mb-5'>
                <img class='img-fluid modal-img' src='${news.image_url}'>
                <div class="d-inline-flex align-items-center mt-4">
                    <img class="news-author me-2 rounded-circle" src="${news.author.img}" alt="">
                    <div>
                        <h5 class="fs-6 fw-semibold mb-0">${news.author.name ? news.author.name : 'Author name unknown'}</h5>
                        <p class="text-muted m-0">${news.author.published_date ? news.author.published_date : 'Published date unknown'}</p>
                    </div>
                </div>
                <ul class="news-details-info list-unstyled d-flex justify-content-between align-items-center mt-4">
                <li class="d-flex align-items-center">
                    <i class="fa-solid fa-eye text-muted"></i>
                    <h5 class="mb-0 ms-2">${news.total_view ? `${news.total_view }K` : 'No views'}</h5>
                </li>
                <li class="text-muted">
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star"></i>
                    <i class="fa-solid fa-star-half-stroke"></i>
                </li>
            </ul>
            </div>
            <p>${news.details}</p>
        </div>
    `;
    newsDialog.appendChild(newsDiv);
}

const resetModal = e => {
    if (
        e.target.classList.contains('btn-close') ||
        e.target.classList.contains('modal')
    ) {
        document.getElementById('modal-dialog').textContent = '';
    }
}

headerNav.addEventListener('click', loadCategoryWiseNews);
sortViewEl.addEventListener('change', sortNewsByStatus);
newsContainer.addEventListener('click', getNewsDetails);
newsModal.addEventListener('click', resetModal);
newsStatusBtns.addEventListener('click', sortNewsByStatus);