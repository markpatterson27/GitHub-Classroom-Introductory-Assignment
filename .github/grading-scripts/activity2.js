// Activity 2 - Make commit
// This script checks if the user who has triggered the workflow has made any
// commits to the repository.
// The script will return 'success' if a commit is found, and 'fail' otherwise.
// If successful the script will also create a file in the .github/results folder.

module.exports = async ({core, github, context}) => {
    const activityFilePath = '.github/results/activity2.txt'

    // start step summary
    const summary = core.summary
    summary.addHeading(`Activity 2 - Make commit`, 3)

    // get commits, filtered by actor
    let commitList = []
    try {
        const res = await github.rest.repos.listCommits({
            owner: context.repo.owner,
            repo: context.repo.repo,
            author: context.actor,
        });
        commitList = res.data
        console.log(commitList)
    }
    catch (error) {
        console.log(error)
        summary.addRaw(`:exclamation::x: Error. Could not get repository commits.`)
        await summary.write()
        return 'fail'
    }

    // is commit list non-zero
    if (Array.isArray(commitList) && commitList.length) {
        console.log("commits found")
        summary.addRaw(`:white_check_mark: Success. Commit found for <code>${context.actor}</code>.`)

        // write result to file
        const fs = require('fs');
        fs.writeFile(activityFilePath, 'pass', function (err) {
            if (err) return console.log(err);
        });

        await summary.write()
        return 'success'
    }
    else {
        console.log(`no commits for ${context.actor} found`)
        summary.addRaw(`:x: Fail. No commits found for <code>${context.actor}</code>.`)
        await summary.write()
        return 'fail'
    }
}
