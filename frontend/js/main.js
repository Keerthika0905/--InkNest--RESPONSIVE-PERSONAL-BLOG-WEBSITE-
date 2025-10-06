document.addEventListener('DOMContentLoaded', () => {
const API_BASE_URL = 'https://inknext.onrender.com/api';
    const mainFeed = document.getElementById('main-feed');
    const recommendedTagsContainer = document.getElementById('recommended-tags');
    const searchInput = document.getElementById('search-input');
    const logoLink = document.getElementById('logo-link');

    let allPosts = [];

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const options = { month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    };

    const calculateReadTime = (content) => {
        if (!content) return '';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const text = tempDiv.textContent || tempDiv.innerText || '';
        const wordsPerMinute = 225;
        const wordCount = text.split(/\s+/).length;
        const minutes = Math.ceil(wordCount / wordsPerMinute);
        return `${minutes} min read`;
    };

    const createSnippet = (content, maxLength = 100) => {
        if (!content) return '';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const text = tempDiv.textContent || tempDiv.innerText || '';
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    };

    const renderPosts = (postsToRender) => {
        if (postsToRender.length === 0) {
            mainFeed.innerHTML = '<p>No articles found.</p>';
            return;
        }

        const postsHtml = postsToRender.map(post => {
            const isExternal = post.source !== 'My Blog (Blogger)' && post.source !== 'Local Data';
            const linkHref = isExternal ? post.id : `#/post/${encodeURIComponent(post.id)}`;
            const linkTarget = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
            const readTime = calculateReadTime(post.content);
            const snippet = createSnippet(post.content);

            return `
                <div class="post-card">
                    <div class="post-card-content">
                        <div class="post-card-source">${post.source}</div>
                        <a href="${linkHref}" ${linkTarget}>
                            <h2>${post.title}</h2>
                            <p class="post-snippet">${snippet}</p>
                        </a>
                        <div class="post-meta">
                            <span>${formatDate(post.date)}</span>
                            <span>${readTime}</span>
                        </div>
                    </div>
                    <img src="${post.imageUrl}" alt="${post.title}" class="post-card-image">
                </div>
            `;
        }).join('');

        mainFeed.innerHTML = postsHtml;
    };

    const renderRecommendedTags = (posts) => {
        const tagCounts = {};
        posts.forEach(post => {
            (post.tags || []).forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });
        const sortedTags = Object.entries(tagCounts).sort(([, a], [, b]) => b - a).slice(0, 7);
        const tagsHtml = sortedTags.map(([tag]) => `<a href="#/tag/${tag}" class="tag-link">${tag}</a>`).join('');
        recommendedTagsContainer.innerHTML = tagsHtml;
    };

    const router = async () => {
        if (allPosts.length === 0) {
            try {
                mainFeed.innerHTML = '<div class="loader">Loading articles...</div>';
                const response = await fetch(`${API_BASE_URL}/content`);
                if (!response.ok) throw new Error('Network failed');
                allPosts = await response.json();
            } catch (error) {
                mainFeed.innerHTML = '<p>Could not load articles. Is the backend server running?</p>';
                return;
            }
        }

        renderRecommendedTags(allPosts);

        const hash = window.location.hash;
        if (hash.startsWith('#/tag/')) {
            const tagName = decodeURIComponent(hash.split('/')[2]);
            const filteredPosts = allPosts.filter(post => (post.tags || []).includes(tagName));
            renderPosts(filteredPosts);
        } else {
            renderPosts(allPosts);
        }
    };

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredPosts = allPosts.filter(post => post.title.toLowerCase().includes(searchTerm));
        renderPosts(filteredPosts);
    });

    logoLink.addEventListener('click', (e) => {
        e.preventDefault();
        allPosts = [];
        searchInput.value = '';
        window.location.hash = '#';
        router();
    });

    window.addEventListener('hashchange', router);
    router();
});
