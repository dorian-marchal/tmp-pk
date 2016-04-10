var Post = require('../Post');
var UserUtil = require('./UserUtil');

var PageUtil = {

    /**
     * Returns the newly sent post of the current user.
     *
     * A post is returned if :
     * - It is the last one on the page
     * - Its anchor is present in the URL
     * - Its author is the current user
     * - It is "new"
     *
     * @param {int} postMaxAgeMs Max age in milliseconds for a post to be
     *        considered as "new".
     * @return {Post|null} Newly sent post on the page.
     *         null if there is no valid newly sent post on the page.
     */
    getNewlySentPost: function(postMaxAgeMs) {
        var targetedPost;

        try {
            if (!PageUtil.onLastTopicPage()) {
                throw new Error('Not on a last topic page.');
            }

            targetedPost = PageUtil.getTargetedPost();

            if (targetedPost === null) {
                throw new Error('No targeted post on page.');
            }

            if (!targetedPost.isLastOnPage()) {
                throw new Error('The post is not the last one.');
            }

            if (targetedPost.authorAlias !== UserUtil.getAlias()) {
                throw new Error('Not the author of the post.');
            }

            if (new Date() - targetedPost.getDate() > postMaxAgeMs) {
                throw new Error('The post is too old.');
            }
        }
        catch (err) {
            console.log('PageUtil#getNewlySentPost:', err.message);
            targetedPost = null;
        }

        return targetedPost;
    },

    /**
     * @return {int|null} ID of the targeted post in the URL (anchor)
     *         or null if there is no targeted post.
     */
    _getTargetedPostId: function() {
        // https://regex101.com/r/gW0pX7/1
        var matches = location.hash.match(/^#post_(\d+)$/);

        if (matches === null) {
            return null;
        }

        return parseInt(matches[1], 10);
    },

    /**
     * @return {Post|null} Post targeted in the URL (anchor) or null if no
     *         targeted post is found.
     */
    getTargetedPost: function() {

        var targetedPostId = PageUtil._getTargetedPostId();
        var targetedPost;

        try {
            if (targetedPostId === null) {
                throw new Error('No targeted post.');
            }

            targetedPost = Post.getOnPage(targetedPostId);

            if (targetedPost === null) {
                throw new Error('Targeted post does not exist');
            }
        }
        catch (err) {
            console.log('PageUtil#getTargetedPost:', err.message);
            targetedPost = null;
        }

        return targetedPost;
    },

    /**
     * @return {boolean} true if the user is on a topic page.
     */
    inTopic: function() {
        return location.pathname.match(/forums\/(1|42)/);
    },

    /**
     * @return {boolean} true if the current page is the last one of a topic.
     */
    onLastTopicPage: function() {
        return PageUtil.inTopic() && document.querySelector('.pagi-fin-actif') === null;
    },
};

module.exports = PageUtil;
