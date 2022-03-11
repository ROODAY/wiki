module.exports = {
    pathPrefix: "/reponame",
    plugins: [{
        resolve: `gatsby-theme-garden`,
        options: {
            contentPath: `${__dirname}/content`,
            rootNote: `/hello`,
        },
    }, ],
    siteMetadata: {
        title: `Rudy's Notes`,
    },
}