// Activity 1 - Accept assignment
// This script checks if the repo name contains the name of one of the collaborators.
// The repo name is expected to be in the format `assignmentname-username` or `assignmentname-username-i`.
// The script will return 'success' if a match is found, and 'fail' otherwise.
// If successful the script will also create a file in the .github/results folder.

module.exports = async ({core, github, context}) => {
    const activityFilePath = '.github/results/activity1.txt'

    // get summary file
    const summary = core.summary
    summary.addHeading(`Activity 1 - Accept assignment`, 3)

    // get repo name
    const repoName = context.repo.repo.toLowerCase()

    // get repo members
    let collaborators = []
    try {
        const res = await github.rest.repos.listCollaborators({
            owner: context.repo.owner,
            repo: context.repo.repo,
        });
        collaborators = res.data
        console.log(collaborators)
    } catch (error) {
        console.log(error)
        summary.addRaw(`:exclamation::x: Error. Could not get repository collaborators.`)
        await summary.write()
        return 'fail'
    }

    // check if one of collab list matches repository name suffix. make case insensitive.
    // pattern is `assignmentname-username` or `assignmentname-username-i`. #TODO: optionally remove number suffix and use endsWith to match
    if (collaborators.some(collaborator=>repoName.includes(collaborator.login.toLowerCase()))) {
        console.log("found collaborator match to repo suffix")
        summary.addRaw(`:white_check_mark: Success. Collaborator name found in repository name -> Indicates that the assignment was successfully accepted.`)

        // write result to file
        const fs = require('fs');
        fs.writeFile(activityFilePath, 'pass', function (err) {
            if (err) return console.log(err);
        });

        await summary.write()
        return 'success'
    }
    else {
        console.log("no match to repo suffix")
        summary.addRaw(`:x: Fail. Repository name suffix does not match collaborator name.`)
        await summary.write()
        return 'fail'
    }
}
