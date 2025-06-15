let ogData = {
    title: "OpenGraph Preview Tool",
    description: "A powerful tool to preview how your content will appear when shared on social media platforms like Twitter, Facebook, LinkedIn, Instagram, TikTok, and Pinterest.",
    image: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1200&h=630&fit=crop",
    url: "https://example.com",
    siteName: "Your Site",
    type: "website",
    // Rich Pin specific data
    richPin: {
        type: "website",
        // Article specific
        author: "",
        publishedTime: "",
        section: "",
        // Product specific
        price: "",
        currency: "USD",
        availability: "in stock",
        brand: "",
        productId: ""
    }
};

// Parse query string parameters and auto-fill form fields
function parseQueryStringAndFillFields() {
    const urlParams = new URLSearchParams(window.location.search);

    // Map of query parameter names to ogData fields
    const paramMap = {
        'urlInput': 'urlInput',
        'title': 'title',
        'description': 'description',
        'image': 'image',
        'url': 'url',
        'site_name': 'siteName',
        'type': 'type',
        'author': 'author',
        'section': 'section',
        'price': 'price',
        'currency': 'currency',
        'availability': 'availability',
        'brand': 'brand'
    };

    let hasParams = false;

    // Check for urlInput parameter and populate the URL input
    if (urlParams.has('urlInput')) {
        const urlInputValue = urlParams.get('urlInput');
        if (urlInputValue) {
            document.getElementById('urlInput').value = urlInputValue;
            hasParams = true;
        }
    }

    // Process other parameters
    for (const [param, field] of Object.entries(paramMap)) {
        if (param === 'urlInput') continue; // Already handled above

        if (urlParams.has(param)) {
            const value = urlParams.get(param);
            if (value) {
                hasParams = true;

                // Handle rich pin fields
                if (['author', 'section', 'price', 'currency', 'availability', 'brand'].includes(field)) {
                    ogData.richPin[field] = value;
                } else {
                    ogData[field] = value;
                }
            }
        }
    }

    // If any parameters were found, update the form and previews
    if (hasParams) {
        updateFormFields();
        updatePreviews();
        toggleEnrichmentFields();

        // Show a toast notification
        showToast('Form auto-filled from URL parameters', 'success');
    }
}

// DOM elements
const urlInput = document.getElementById('urlInput');
const fetchBtn = document.getElementById('fetchBtn');
const fetchBtnText = document.getElementById('fetchBtnText');
const loadingSpinner = document.getElementById('loadingSpinner');

const titleInput = document.getElementById('titleInput');
const descriptionInput = document.getElementById('descriptionInput');
const imageInput = document.getElementById('imageInput');
const urlManualInput = document.getElementById('urlManualInput');
const siteNameInput = document.getElementById('siteNameInput');
const contentTypeSelect = document.getElementById('contentType');

const tabButtons = document.querySelectorAll('.tab-button');
const tabContents = document.querySelectorAll('.tab-content');

const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

const viewCodeBtn = document.getElementById('viewCodeBtn');
const codeModal = document.getElementById('codeModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const copyCodeBtn = document.getElementById('copyCodeBtn');
const copyShareURLBtn = document.getElementById('copyShareURLBtn');
const codeOutput = document.getElementById('codeOutput');

// Theme toggle elements
const themeToggle = document.getElementById('themeToggle');
const themeIcon = themeToggle.querySelector('.theme-icon');

// Initialize the app
function init() {
    // Parse query string parameters first
    parseQueryStringAndFillFields();

    updatePreviews();
    updateFormFields();

    // Add event listeners
    fetchBtn.addEventListener('click', fetchOpenGraphData);
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            fetchOpenGraphData();
        }
    });

    // Form field listeners
    titleInput.addEventListener('input', (e) => updateField('title', e.target.value));
    descriptionInput.addEventListener('input', (e) => updateField('description', e.target.value));
    imageInput.addEventListener('input', (e) => updateField('image', e.target.value));
    urlManualInput.addEventListener('input', (e) => updateField('url', e.target.value));
    siteNameInput.addEventListener('input', (e) => updateField('siteName', e.target.value));

    // Content type listener
    contentTypeSelect.addEventListener('change', (e) => {
        ogData.type = e.target.value;
        ogData.richPin.type = e.target.value;
        toggleEnrichmentFields();
        updatePreviews();
    });

    // Article enrichment listeners
    const articleAuthor = document.getElementById('articleAuthor');
    const articleSection = document.getElementById('articleSection');

    if (articleAuthor) articleAuthor.addEventListener('input', (e) => updateRichPinField('author', e.target.value));
    if (articleSection) articleSection.addEventListener('input', (e) => updateRichPinField('section', e.target.value));

    // Product enrichment listeners
    const productPrice = document.getElementById('productPrice');
    const productCurrency = document.getElementById('productCurrency');
    const productAvailability = document.getElementById('productAvailability');
    const productBrand = document.getElementById('productBrand');

    if (productPrice) productPrice.addEventListener('input', (e) => updateRichPinField('price', e.target.value));
    if (productCurrency) productCurrency.addEventListener('change', (e) => updateRichPinField('currency', e.target.value));
    if (productAvailability) productAvailability.addEventListener('change', (e) => updateRichPinField('availability', e.target.value));
    if (productBrand) productBrand.addEventListener('input', (e) => updateRichPinField('brand', e.target.value));

    // Tab listeners
    tabButtons.forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });

    // Code modal listeners
    viewCodeBtn.addEventListener('click', showCodeModal);
    closeModalBtn.addEventListener('click', hideCodeModal);
    copyCodeBtn.addEventListener('click', copyCodeToClipboard);
    copyShareURLBtn.addEventListener('click', copyShareURLToClipboard);
    codeModal.addEventListener('click', (e) => {
        if (e.target === codeModal) {
            hideCodeModal();
        }
    });

    // ESC key to close modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !codeModal.classList.contains('hidden')) {
            hideCodeModal();
        }
    });

    // Theme toggle listener
    themeToggle.addEventListener('click', toggleTheme);

    // Initialize enrichment fields
    toggleEnrichmentFields();
}

// Theme management
function initializeDarkMode() {
    // Check for saved theme preference or default to 'system'
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        enableDarkMode();
    } else {
        enableLightMode();
    }

    // Listen for changes in system dark mode preference
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            if (e.matches) {
                enableDarkMode();
            } else {
                enableLightMode();
            }
        }
    });
}

function enableDarkMode() {
    document.body.classList.add('dark');
    //themeIcon.textContent = '☀️';
    //updateThemeIcon();
}

function enableLightMode() {
    document.body.classList.remove('dark');
    //themeIcon.textContent = '🌙';
    //updateThemeIcon();
}

function toggleTheme() {
    if (document.body.classList.contains('dark')) {
        enableLightMode();
        localStorage.setItem('theme', 'light');
    } else {
        enableDarkMode();
        localStorage.setItem('theme', 'dark');
    }
}

function updateThemeIcon() {
    // Add a small animation when toggling
    themeIcon.style.transform = 'scale(0.8)';
    setTimeout(() => {
        themeIcon.style.transform = 'scale(1)';
    }, 150);
}

// Update a Rich Pin field
function updateRichPinField(field, value) {
    ogData.richPin[field] = value;
    updatePreviews();
}

// Toggle enrichment fields based on content type
function toggleEnrichmentFields() {
    const enrichmentFields = document.getElementById('enrichmentFields');
    const articleEnrichment = document.getElementById('articleEnrichment');
    const productEnrichment = document.getElementById('productEnrichment');

    if (enrichmentFields && articleEnrichment && productEnrichment) {
        if (ogData.type === 'article') {
            enrichmentFields.style.display = 'block';
            articleEnrichment.style.display = 'block';
            productEnrichment.style.display = 'none';
        } else if (ogData.type === 'product') {
            enrichmentFields.style.display = 'block';
            articleEnrichment.style.display = 'none';
            productEnrichment.style.display = 'block';
        } else {
            enrichmentFields.style.display = 'none';
            articleEnrichment.style.display = 'none';
            productEnrichment.style.display = 'none';
        }
    }
}

// Update a field in ogData and refresh previews
function updateField(field, value) {
    ogData[field] = value;
    updatePreviews();
}

// Update form fields with current ogData
function updateFormFields() {
    titleInput.value = ogData.title;
    descriptionInput.value = ogData.description;
    imageInput.value = ogData.image;
    urlManualInput.value = ogData.url;
    siteNameInput.value = ogData.siteName;
    contentTypeSelect.value = ogData.type;

    // Update enrichment fields
    const articleAuthor = document.getElementById('articleAuthor');
    const articleSection = document.getElementById('articleSection');
    const productPrice = document.getElementById('productPrice');
    const productCurrency = document.getElementById('productCurrency');
    const productAvailability = document.getElementById('productAvailability');
    const productBrand = document.getElementById('productBrand');

    if (articleAuthor) articleAuthor.value = ogData.richPin.author;
    if (articleSection) articleSection.value = ogData.richPin.section;
    if (productPrice) productPrice.value = ogData.richPin.price;
    if (productCurrency) productCurrency.value = ogData.richPin.currency;
    if (productAvailability) productAvailability.value = ogData.richPin.availability;
    if (productBrand) productBrand.value = ogData.richPin.brand;
}

// Get domain from URL
function getDomain(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return "example.com";
    }
}

// Update all social media previews
function updatePreviews() {
    updateTwitterPreview();
    updateFacebookPreview();
    updateLinkedInPreview();
    updateInstagramPreview();
    updateTikTokPreview();
    updatePinterestPreview();
}

// Update Twitter preview
function updateTwitterPreview() {
    document.getElementById('twitterTitle').textContent = ogData.title;
    document.getElementById('twitterDescription').textContent = ogData.description;
    document.getElementById('twitterDomain').textContent = getDomain(ogData.url);

    const twitterImage = document.getElementById('twitterImage');
    twitterImage.src = ogData.image;
    twitterImage.onerror = () => {
        twitterImage.src = "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=200&fit=crop";
    };
}

// Update Facebook preview
function updateFacebookPreview() {
    document.getElementById('facebookTitle').textContent = ogData.title;
    document.getElementById('facebookDescription').textContent = ogData.description;
    document.getElementById('facebookDomain').textContent = getDomain(ogData.url).toUpperCase();

    const facebookImage = document.getElementById('facebookImage');
    facebookImage.src = ogData.image;
    facebookImage.onerror = () => {
        facebookImage.src = "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=200&fit=crop";
    };
}

// Update LinkedIn preview
function updateLinkedInPreview() {
    document.getElementById('linkedinTitle').textContent = ogData.title;
    document.getElementById('linkedinDescription').textContent = ogData.description;
    document.getElementById('linkedinDomain').textContent = getDomain(ogData.url);

    const linkedinImage = document.getElementById('linkedinImage');
    linkedinImage.src = ogData.image;
    linkedinImage.onerror = () => {
        linkedinImage.src = "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=200&fit=crop";
    };
}

// Update Instagram preview
function updateInstagramPreview() {
    document.getElementById('instagramTitle').textContent = ogData.title;
    document.getElementById('instagramDescription').textContent = ogData.description;
    document.getElementById('instagramDomain').textContent = `#${getDomain(ogData.url).replace('.', '')} #webdev #tools`;

    const instagramImage = document.getElementById('instagramImage');
    instagramImage.src = ogData.image;
    instagramImage.onerror = () => {
        instagramImage.src = "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=400&fit=crop";
    };
}

// Update TikTok preview
function updateTikTokPreview() {
    document.getElementById('tiktokTitle').textContent = ogData.title;
    document.getElementById('tiktokDescription').textContent = ogData.description;

    const tiktokImage = document.getElementById('tiktokImage');
    tiktokImage.src = ogData.image;
    tiktokImage.onerror = () => {
        tiktokImage.src = "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=600&fit=crop";
    };
}

// Update Pinterest preview
function updatePinterestPreview() {
    document.getElementById('pinterestTitle').textContent = ogData.title;
    document.getElementById('pinterestDescription').textContent = ogData.description;
    document.getElementById('pinterestDomain').textContent = getDomain(ogData.url);

    const pinterestImage = document.getElementById('pinterestImage');
    pinterestImage.src = ogData.image;
    pinterestImage.onerror = () => {
        pinterestImage.src = "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=600&h=800&fit=crop";
    };

    // Update Rich Pin specific elements
    const richPinBadge = document.getElementById('pinterestRichPinBadge');
    const richPinInfo = document.getElementById('pinterestRichPinInfo');

    if (richPinBadge && richPinInfo) {
        if (ogData.richPin.type === 'article' && (ogData.richPin.author || ogData.richPin.section)) {
            richPinBadge.textContent = 'Article';
            richPinBadge.style.display = 'inline-block';
            richPinInfo.innerHTML = '';

            if (ogData.richPin.author) {
                richPinInfo.innerHTML += `<div class="pinterest-rich-pin-author">By ${ogData.richPin.author}</div>`;
            }
            if (ogData.richPin.section) {
                richPinInfo.innerHTML += `<div class="pinterest-rich-pin-section">${ogData.richPin.section}</div>`;
            }
            richPinInfo.style.display = 'block';
        } else if (ogData.richPin.type === 'product' && (ogData.richPin.price || ogData.richPin.brand)) {
            richPinBadge.textContent = 'Product';
            richPinBadge.style.display = 'inline-block';
            richPinInfo.innerHTML = '';

            if (ogData.richPin.price) {
                richPinInfo.innerHTML += `<div class="pinterest-rich-pin-price">${ogData.richPin.currency} ${ogData.richPin.price}</div>`;
            }
            if (ogData.richPin.brand) {
                richPinInfo.innerHTML += `<div class="pinterest-rich-pin-brand">${ogData.richPin.brand}</div>`;
            }
            if (ogData.richPin.availability) {
                richPinInfo.innerHTML += `<div class="pinterest-rich-pin-availability">${ogData.richPin.availability}</div>`;
            }
            richPinInfo.style.display = 'block';
        } else {
            richPinBadge.style.display = 'none';
            richPinInfo.style.display = 'none';
        }
    }
}

// Switch between tabs
function switchTab(tabName) {
    // Update tab buttons
    tabButtons.forEach(button => {
        button.classList.toggle('active', button.dataset.tab === tabName);
    });

    // Update tab content
    tabContents.forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
}

// Show toast notification
function showToast(message, type = 'info') {
    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');

    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Fetch OpenGraph data from URL
async function fetchOpenGraphData() {
    const url = urlInput.value.trim();

    if (!url) {
        showToast('Please enter a valid URL', 'error');
        return;
    }

    // Validate URL format
    try {
        new URL(url);
    } catch {
        showToast('Please enter a valid URL format', 'error');
        return;
    }

    // Show loading state
    fetchBtn.disabled = true;
    fetchBtnText.textContent = '';
    loadingSpinner.classList.remove('hidden');

    // CORS proxy services as fallbacks
    const corsProxies = [
        `https://corsproxy.io/?${encodeURIComponent(url)}`,
        `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
        `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`
    ];

    let lastError = null;

    for (const proxyUrl of corsProxies) {
        try {
            console.log(`Trying proxy: ${proxyUrl}`);
            const response = await fetch(proxyUrl, {
                method: 'GET',
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'User-Agent': 'Mozilla/5.0 (compatible; OpenGraph-Preview-Bot/1.0)',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            let htmlContent = '';

            // Handle different proxy response formats
            if (proxyUrl.includes('allorigins.win')) {
                const data = await response.json();
                htmlContent = data.contents;
            } else {
                htmlContent = await response.text();
            }

            if (!htmlContent || htmlContent.trim().length === 0) {
                throw new Error('Empty response received');
            }

            console.log('Successfully fetched HTML content');

            // Parse HTML content to extract OpenGraph tags
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlContent, 'text/html');

            // Extract OpenGraph data
            const getMetaContent = (property) => {
                const element = doc.querySelector(`meta[property="${property}"]`) ||
                            doc.querySelector(`meta[name="${property}"]`);
                return element?.getAttribute('content') || '';
            };

            const title = getMetaContent('og:title') ||
                         doc.querySelector('title')?.textContent ||
                         'No title found';

            const description = getMetaContent('og:description') ||
                               getMetaContent('description') ||
                               'No description found';

            const image = getMetaContent('og:image') ||
                         'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=1200&h=630&fit=crop';

            const siteName = getMetaContent('og:site_name') ||
                            new URL(url).hostname;

            const type = getMetaContent('og:type') || 'website';

            // Extract Rich Pin data
            const author = getMetaContent('article:author') || '';
            const publishedTime = getMetaContent('article:published_time') || '';
            const section = getMetaContent('article:section') || '';
            const price = getMetaContent('product:price:amount') || '';
            const currency = getMetaContent('product:price:currency') || 'USD';
            const availability = getMetaContent('product:availability') || 'in stock';
            const brand = getMetaContent('product:brand') || '';

            // Update ogData
            ogData = {
                title: title.trim(),
                description: description.trim(),
                image: image,
                url: url,
                siteName: siteName,
                type: type,
                richPin: {
                    type: type,
                    author: author,
                    publishedTime: publishedTime,
                    section: section,
                    price: price,
                    currency: currency,
                    availability: availability,
                    brand: brand,
                    productId: ''
                }
            };

            updatePreviews();
            updateFormFields();
            toggleEnrichmentFields();

            showToast('OpenGraph data fetched successfully!', 'success');

            // Reset loading state
            fetchBtn.disabled = false;
            fetchBtnText.textContent = 'Fetch';
            loadingSpinner.classList.add('hidden');

            return; // Success, exit the function

        } catch (error) {
            console.error(`Proxy ${proxyUrl} failed:`, error);
            lastError = error;
            continue; // Try next proxy
        }
    }

    // If we get here, all proxies failed
    console.error('All CORS proxies failed. Last error:', lastError);
    showToast('Failed to fetch OpenGraph data. All proxy services are currently unavailable. You can manually edit the fields below.', 'error');

    // Reset loading state
    fetchBtn.disabled = false;
    fetchBtnText.textContent = 'Fetch';
    loadingSpinner.classList.add('hidden');
}

// Generate OpenGraph meta tags code
function generateOpenGraphCode() {
    const metaTags = [
        `<meta property="og:title" content="${escapeHtml(ogData.title)}" />`,
        `<meta property="og:description" content="${escapeHtml(ogData.description)}" />`,
        `<meta property="og:image" content="${escapeHtml(ogData.image)}" />`,
        `<meta property="og:url" content="${escapeHtml(ogData.url)}" />`,
        `<meta property="og:site_name" content="${escapeHtml(ogData.siteName)}" />`,
        `<meta property="og:type" content="${escapeHtml(ogData.type)}" />`,
        '',
        '<!-- Twitter Card tags -->',
        `<meta name="twitter:card" content="summary_large_image" />`,
        `<meta name="twitter:title" content="${escapeHtml(ogData.title)}" />`,
        `<meta name="twitter:description" content="${escapeHtml(ogData.description)}" />`,
        `<meta name="twitter:image" content="${escapeHtml(ogData.image)}" />`,
    ];

    // Add Rich Pin specific meta tags
    if (ogData.richPin.type === 'article') {
        metaTags.push('');
        metaTags.push('<!-- Pinterest Article Rich Pin tags -->');
        if (ogData.richPin.author) {
            metaTags.push(`<meta property="article:author" content="${escapeHtml(ogData.richPin.author)}" />`);
        }
        if (ogData.richPin.publishedTime) {
            metaTags.push(`<meta property="article:published_time" content="${escapeHtml(ogData.richPin.publishedTime)}" />`);
        }
        if (ogData.richPin.section) {
            metaTags.push(`<meta property="article:section" content="${escapeHtml(ogData.richPin.section)}" />`);
        }
    } else if (ogData.richPin.type === 'product') {
        metaTags.push('');
        metaTags.push('<!-- Pinterest Product Rich Pin tags -->');
        if (ogData.richPin.price) {
            metaTags.push(`<meta property="product:price:amount" content="${escapeHtml(ogData.richPin.price)}" />`);
        }
        if (ogData.richPin.currency) {
            metaTags.push(`<meta property="product:price:currency" content="${escapeHtml(ogData.richPin.currency)}" />`);
        }
        if (ogData.richPin.availability) {
            metaTags.push(`<meta property="product:availability" content="${escapeHtml(ogData.richPin.availability)}" />`);
        }
        if (ogData.richPin.brand) {
            metaTags.push(`<meta property="product:brand" content="${escapeHtml(ogData.richPin.brand)}" />`);
        }
    }

    metaTags.push('');
    metaTags.push('<!-- Additional meta tags -->');
    metaTags.push(`<meta name="description" content="${escapeHtml(ogData.description)}" />`);
    metaTags.push(`<link rel="canonical" href="${escapeHtml(ogData.url)}" />`);

    return metaTags.join('\n');
}

// Escape HTML characters
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show code modal
function showCodeModal() {
    const code = generateOpenGraphCode();
    codeOutput.textContent = code;
    codeModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

// Hide code modal
function hideCodeModal() {
    codeModal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Copy code to clipboard
async function copyCodeToClipboard() {
    try {
        await navigator.clipboard.writeText(codeOutput.textContent);
        showToast('Code copied to clipboard!', 'success');
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = codeOutput.textContent;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('Code copied to clipboard!', 'success');
    }
}

async function copyShareURLToClipboard() {
    const shareURL = new URL(window.location.href);
    shareURL.searchParams.forEach((_, key) => {
        shareURL.searchParams.delete(key);
    });
    shareURL.searchParams.set('urlInput', urlInput.value);
    shareURL.searchParams.set('title', titleInput.value);
    shareURL.searchParams.set('description', descriptionInput.value);
    shareURL.searchParams.set('image', imageInput.value);
    shareURL.searchParams.set('url', urlManualInput.value);
    shareURL.searchParams.set('site_name', siteNameInput.value);
    shareURL.searchParams.set('type', contentTypeSelect.value);
    shareURL.searchParams.set('utm_source', 'og.prevue.me');

    // Add rich pin fields if available
    const richPinFields = ['author', 'section', 'price', 'currency', 'availability', 'brand'];
    richPinFields.forEach(field => {
        if (ogData.richPin[field]) {
            shareURL.searchParams.set(field, ogData.richPin[field]);
        }
    });

    try {
        await navigator.clipboard.writeText(shareURL.toString());
        showToast('Share URL copied to clipboard!', 'success');
    } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = shareURL.toString();
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast('Share URL copied to clipboard!', 'success');
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    init();
    initializeDarkMode();
});