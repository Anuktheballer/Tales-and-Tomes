document.addEventListener('DOMContentLoaded', () => {
    // --- State ---
    let allPosts = [];
    let currentView = 'home-view'; // The ID of the currently visible view
    let previousView = 'home-view'; // The ID of the view we were on before navigating to a single post
  
    // --- DOM Elements ---
    const mainContent = document.getElementById('main-content');
    const views = document.querySelectorAll('.view'); // All elements with class 'view'
    const navLinks = document.querySelectorAll('nav a.nav-link'); // Navigation links
  
    // Specific view containers
    const homeView = document.getElementById('home-view');
    const reviewsView = document.getElementById('reviews-view');
    const chaptersView = document.getElementById('chapters-view');
    const singlePostView = document.getElementById('single-post-view');
  
    // Post list containers within views
    const reviewsListHome = document.getElementById('reviews-list-home');
    const chaptersListHome = document.getElementById('chapters-list-home');
    const reviewsListAll = document.getElementById('reviews-list-all');
    const chaptersListAll = document.getElementById('chapters-list-all');
  
    // Optional: Error message area
    const errorMessageArea = document.getElementById('error-message-area');
  
    // --- Functions ---
  
    /**
     * Fetches post data from the posts.json file.
     * Sorts posts by date (newest first) and initiates the display.
     * Handles potential fetch errors.
     * @async
     */
    async function fetchPosts() {
      showLoadingMessages(true); // Show loading indicators
      hideErrorMessages(); // Hide previous errors
      try {
        const response = await fetch('posts.json'); // Assumes posts.json is in the same directory as index.html
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
        }
        allPosts = await response.json();
        // Sort posts by date, newest first. Handles potential invalid dates gracefully.
        allPosts.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          // Check if dates are valid before comparing
          if (isNaN(dateA) && isNaN(dateB)) return 0;
          if (isNaN(dateA)) return 1; // Put invalid dates last
          if (isNaN(dateB)) return -1; // Put invalid dates last
          return dateB - dateA;
        });
        displayHomepage(); // Display the initial view (homepage)
      } catch (error) {
        console.error("Could not fetch or process posts:", error);
        // Display a user-friendly error message in the UI
        showError(`Error loading blog content: ${error.message}. Please check the file path or network connection and try again later.`);
        // Optionally clear loading placeholders in specific areas if needed
        reviewsListHome.innerHTML = '';
        chaptersListHome.innerHTML = '';
        reviewsListAll.innerHTML = '';
        chaptersListAll.innerHTML = '';
      } finally {
          showLoadingMessages(false); // Hide loading indicators regardless of success/failure
      }
    }
  
    /**
     * Creates the HTML markup for a single post summary.
     * @param {Object} post - The post object containing id, title, date, summary.
     * @returns {string} HTML string representing the post summary.
     */
    function createPostSummaryHTML(post) {
      // Format date for better readability
      const postDate = new Date(post.date);
      const formattedDate = !isNaN(postDate) ? postDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Invalid Date';
  
      return `
        <article>
            <h3><a href="#" class="post-link" data-id="${post.id}">${post.title}</a></h3>
            <span class="post-date">${formattedDate}</span>
            <p>${post.summary}</p>
        </article>
      `;
    }
  
    /**
     * Renders a list of post summaries into a target HTML element.
     * @param {Array<Object>} postsToRender - Array of post objects to display.
     * @param {HTMLElement} targetElement - The DOM element to render the list into.
     * @param {string} noPostsMessage - Message to display if postsToRender is empty.
     */
    function renderPostList(postsToRender, targetElement, noPostsMessage) {
      targetElement.innerHTML = ''; // Clear placeholder/old content
      if (!postsToRender || postsToRender.length === 0) {
        targetElement.innerHTML = `<p>${noPostsMessage}</p>`;
        return;
      }
      // Build HTML string efficiently
      let listHTML = '';
      postsToRender.forEach(post => {
        listHTML += createPostSummaryHTML(post);
      });
      targetElement.innerHTML = listHTML; // Set innerHTML once
    }
  
    /**
     * Displays the homepage view, showing recent reviews and chapters.
     * @param {number} [limit=3] - The maximum number of posts to show per section.
     */
    function displayHomepage(limit = 3) {
      hideErrorMessages(); // Clear any previous errors
      const recentReviews = allPosts.filter(post => post.type === 'review').slice(0, limit);
      const recentChapters = allPosts.filter(post => post.type === 'chapter').slice(0, limit);
      renderPostList(recentReviews, reviewsListHome, "No reviews posted yet.");
      renderPostList(recentChapters, chaptersListHome, "No chapters posted yet.");
      showView('home-view');
    }
  
    /**
     * Displays a view showing all posts of a specific type (e.g., 'review', 'chapter').
     * @param {string} type - The type of posts to display ('review' or 'chapter').
     */
    function displaySection(type) {
        hideErrorMessages();
        const postsOfType = allPosts.filter(post => post.type === type);
        if (type === 'review') {
            renderPostList(postsOfType, reviewsListAll, "No reviews found.");
            showView('reviews-view');
        } else if (type === 'chapter') {
            renderPostList(postsOfType, chaptersListAll, "No chapters found.");
            showView('chapters-view');
        }
        // Add else if for other types if needed
    }
  
    /**
     * Displays the content of a single post.
     * @param {string} postId - The unique ID of the post to display.
     */
    function displaySinglePost(postId) {
      hideErrorMessages();
      const post = allPosts.find(p => p.id === postId);
      if (!post) {
        singlePostView.innerHTML = "<p>Sorry, the requested post could not be found.</p>";
        showView('single-post-view'); // Show the view even if post not found
        return;
      }
  
      previousView = currentView; // Store where we came from before showing the single post
  
      const postDate = new Date(post.date);
      const formattedDate = !isNaN(postDate) ? postDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'Invalid Date';
  
      // Use <article> tag for semantic structure
      singlePostView.innerHTML = `
          <article>
              <a href="#" class="back-button" data-target="${previousView}">&larr; Back to ${previousView.split('-')[0]}</a>
              <h2>${post.title}</h2>
              <span class="post-date">Published on ${formattedDate}</span>
              <div class="post-content">
                  ${post.content} </div>
          </article>
      `;
      showView('single-post-view');
    }
  
    /**
     * Shows the specified view and hides all others. Updates the currentView state.
     * Scrolls the page to the top.
     * @param {string} viewIdToShow - The ID of the view element to make visible.
     */
    function showView(viewIdToShow) {
      views.forEach(view => view.classList.add('hidden')); // Hide all views first
      const viewToShow = document.getElementById(viewIdToShow);
  
      if (viewToShow) {
        viewToShow.classList.remove('hidden');
        currentView = viewIdToShow; // Update state
        updateNavActiveState(); // Update navigation highlighting
        window.scrollTo(0, 0); // Scroll to top for new view
      } else {
        // Fallback: If the view ID is invalid, show the home view
        console.warn(`View with ID "${viewIdToShow}" not found. Falling back to home view.`);
        homeView.classList.remove('hidden');
        currentView = 'home-view';
        updateNavActiveState();
      }
    }
  
    /**
     * Updates the visual state (e.g., 'active' class, aria-current attribute) of navigation links
     * based on the currently displayed view.
     */
    function updateNavActiveState() {
      navLinks.forEach(link => {
        link.classList.remove('active');
        link.removeAttribute('aria-current'); // Remove ARIA attribute first
        const linkTargetViewBase = link.id.split('-')[1]; // e.g., 'home', 'reviews', 'chapters'
        let isActive = false;
  
        // Determine if this link corresponds to the current view
        switch (currentView) {
          case 'home-view':
            isActive = (linkTargetViewBase === 'home');
            break;
          case 'reviews-view':
            isActive = (linkTargetViewBase === 'reviews');
            break;
          case 'chapters-view':
            isActive = (linkTargetViewBase === 'chapters');
            break;
          // Add cases for other top-level views like 'about-view' if you add them
          case 'single-post-view':
            // Highlight the nav link corresponding to the section the user came from
            if (previousView === 'reviews-view' && linkTargetViewBase === 'reviews') isActive = true;
            else if (previousView === 'chapters-view' && linkTargetViewBase === 'chapters') isActive = true;
            // If coming directly to a single post (e.g., bookmark) or from home, decide which nav item to highlight.
            // Often, highlighting 'Home' or none is acceptable, or determine based on post type.
            else if (previousView === 'home-view') {
                 // Example: Highlight home if came from home
                 // isActive = (linkTargetViewBase === 'home');
                 // OR, find the post and highlight based on type (more complex)
                 // const currentPost = allPosts.find(p => p.id === /* need the current post ID here */);
                 // if (currentPost?.type === 'review' && linkTargetViewBase === 'reviews') isActive = true;
                 // else if (currentPost?.type === 'chapter' && linkTargetViewBase === 'chapters') isActive = true;
            }
            break;
          // Add default or handle other cases if necessary
        }
  
        if (isActive) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'page'); // Set ARIA attribute for accessibility
        }
      });
    }
  
     /**
      * Shows or hides loading indicator paragraphs.
      * @param {boolean} show - True to show loading messages, false to hide.
      */
     function showLoadingMessages(show) {
         const loadingElements = document.querySelectorAll('.loading-message');
         loadingElements.forEach(el => {
             el.style.display = show ? 'block' : 'none';
         });
     }
  
     /**
      * Displays an error message in the designated error area.
      * @param {string} message - The error message to display.
      */
     function showError(message) {
          if (errorMessageArea) {
              errorMessageArea.textContent = message;
              errorMessageArea.classList.remove('hidden');
          } else {
              // Fallback if error area doesn't exist
              alert(message); // Simple alert as fallback
          }
     }
  
     /**
      * Hides the error message area.
      */
     function hideErrorMessages() {
          if (errorMessageArea) {
              errorMessageArea.textContent = '';
              errorMessageArea.classList.add('hidden');
          }
     }
  
    // --- Event Listeners ---
  
    // Navigation link clicks
    navLinks.forEach(link => {
      link.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent default anchor link behavior
        const targetId = event.target.id;
        // Map link ID to the corresponding view function
        if (targetId === 'nav-home') displayHomepage();
        else if (targetId === 'nav-reviews') displaySection('review');
        else if (targetId === 'nav-chapters') displaySection('chapter');
        // Add else if for 'nav-about' if implemented
      });
    });
  
    // Event Delegation for clicks within the main content area
    mainContent.addEventListener('click', (event) => {
      const clickedElement = event.target;
  
      // Check if a post title link was clicked
      // Use closest() to handle clicks on elements inside the link if necessary
      const postLink = clickedElement.closest('a.post-link');
      if (postLink) {
        event.preventDefault();
        const postId = postLink.dataset.id;
        if (postId) {
          displaySinglePost(postId);
        }
        return; // Stop further checks
      }
  
      // Check if the back button was clicked
      const backButton = clickedElement.closest('a.back-button');
      if (backButton) {
        event.preventDefault();
        const targetView = backButton.dataset.target || 'home-view'; // Fallback to home
  
        // Navigate back, ensuring the list views are (re)populated if necessary
        // The showView function handles hiding/showing, but we need to ensure content is loaded
        if (targetView === 'reviews-view') displaySection('review');
        else if (targetView === 'chapters-view') displaySection('chapter');
        else if (targetView === 'home-view') displayHomepage();
        else showView(targetView); // Handles other views like potential About page
  
        return; // Stop further checks
      }
    });
  
    // --- Initial Load ---
    fetchPosts(); // Fetch data and render the initial view when the DOM is ready
  
  });