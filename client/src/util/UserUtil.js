var UserUtil = {

    /**
     * Returns the lowercased alias of the current user.
     *
     * @return {string} Current user alias.
     * @throws Error If the alias can't be found.
     */
    getAlias: function() {
        return document.querySelector('.account-pseudo').textContent.trim().toLowerCase();
    },
};

module.exports = UserUtil;
