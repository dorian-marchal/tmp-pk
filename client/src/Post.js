/**
 * Represents a post on jeuxvideo.com forums.
 * @constructor
 */
var Post = function() {};

/**
 * @param {int} postId
 * @return {Post|null} The Post if it is presents on the current page.
 *         null if the post is not found on the page.
 */
Post.getOnPage = function(postId) {
    var postAnchorId = 'post_' + postId;
    var postAnchor = document.getElementById(postAnchorId);
    var post;

    try {
        if (postAnchor === null) {
            throw new Error('Anchor does not exist.');
        }

        var postEl = postAnchor.nextElementSibling;
        if (postEl === null) {
            throw new Error('Post element does not exist.');
        }

        post = Post.getFromDomElement(postEl);
    }
    catch (err) {
        console.log('Post::getOnPage', err.message);
        post = null;
    }

    return post;
};

/**
 * @param {HTMLElement} postEl .bloc-message-forum element of the post.
 * @return {Post} Post corresponding to the element.
 */
Post.getFromDomElement = function(postEl) {
    var post = new Post();
    post.el = postEl;
    post.id = parseInt(post.el.dataset.id, 10);
    post.authorAliasWithCase = post.el.querySelector('.bloc-pseudo-msg').textContent.trim();
    post.authorAlias = post.authorAliasWithCase.toLowerCase();
    post.frenchDate = post.el.querySelector('.bloc-date-msg').textContent.trim();

    return post;
};

Post.prototype = {
    constructor: Post,

    /**
     * @return {Date} Post date
     * @throws {Error} If the Post has no date.
     */
    getDate: function() {
        if (typeof this.frenchDate === 'undefined') {
            throw new Error('Post has no date.');
        }

        var monthNumbers = { 'janvier': 0, 'février': 1, 'mars': 2, 'avril': 3,
            'mai': 4, 'juin': 5, 'juillet': 6, 'août': 7, 'septembre': 8,
            'octobre': 9, 'novembre': 10, 'décembre': 11 };

        // https://regex101.com/r/dA3mK7/1
        var matches = this.frenchDate.match(/^[\s]*(\d{1,2})(?:er)? ([^\s]*) (\d{4}) à (\d{2}):(\d{2}):(\d{2})$/);
        if (matches === null) {
            throw new Error('Cannot parse date.');
        }
        return new Date(matches[3], monthNumbers[matches[2]], matches[1], matches[4], matches[5], matches[6]);
    },

    /**
     * @return {boolean} true if the Post is the last one on the current page.
     */
    isLastOnPage: function() {
        return this.el && !this.el.nextElementSibling.classList.contains('bloc-message-forum-anchor');
    },
};

module.exports = Post;
