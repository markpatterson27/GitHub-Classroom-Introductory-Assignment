// Activity 3 - Comment on Feedback PR
// This script checks if the user who has triggered the workflow has made any
// comments on the Feedback PR.
// The script will return 'success' if a comment is found, and 'fail' otherwise.
// If successful the script will also create a file in the .github/results folder.

module.exports = async ({core, github, context}) => {
    const activityFilePath = '.github/results/activity3.txt'

    // start step summary
    const summary = core.summary
    summary.addHeading(`Activity 3 - Comment on Feedback PR`, 3)

    // get comments on Feedback PR
    let commentList = []
    try {
        const res = await github.rest.issues.listComments({
            owner: context.repo.owner,
            repo: context.repo.repo,
            issue_number: process.env.ISSUE,
        });
        commentList = res.data
        console.log(commentList)
    }
    catch (error) {
        console.log(error)
        summary.addRaw(`:exclamation::x: Error. Could not get comments from Feedback PR (${process.env.ISSUE}).`)
        await summary.write()
        return 'fail'
    }

    // is comment list non-zero AND does actor equal one of comment authors
    if (Array.isArray(commentList) && commentList.length && commentList.some(comment => comment.user.login == context.actor)) {
        console.log("comments found")
        summary.addRaw(`:white_check_mark: Success. Comment found for <code>${context.actor}</code> on Feedback PR (${process.env.ISSUE}).`)

        // write result to file
        const fs = require('fs');
        fs.writeFile(activityFilePath, 'pass', function (err) {
            if (err) return console.log(err);
        });

        await summary.write()
        return 'success'
    }
    else {
        console.log(`no comments for ${context.actor} found`)
        summary.addRaw(`:x: Fail. No comments found for <code>${context.actor}</code> on Feedback PR (${process.env.ISSUE}).`)
        await summary.write()
        return 'fail'
    }
}
