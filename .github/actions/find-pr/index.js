const core = require('@actions/core');
const github = require('@actions/github');

async function findPR () {
    try {
        // get action inputs
        const token = core.getInput('github-token', {required: true});
        const prTitle = core.getInput('pr-title');
        const baseBranch = core.getInput('base-branch');
        const prBody = core.getInput('pr-body');

        // auth octokit
        const octokit = new github.getOctokit(token);

        // get list of PRs
        const prList = await octokit.rest.pulls.list({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
        });
        console.log(`Get PR list response - status: ${prList.status}`)

        // is PR list non-zero
        if (Array.isArray(prList.data) && prList.data.length) {
            // iterate through PR list looking for Feedback PR
            // PR needs to match base branch and match prTitle
            for (pr of prList.data) {
                if (pr.head.ref == github.context.ref.split('/')[2] && pr.base.ref == baseBranch && pr.title.match(new RegExp(prTitle, 'i'))) {
                    console.log(`${prTitle} PR found`);
                    return pr.number
                }
            }
        };

        console.log(`${prTitle} PR not found`);

        // get last commit on main
        const responseGetCommit = await octokit.rest.repos.getCommit({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            ref: 'refs/heads/main',
        });
        console.log(`Get refs/heads/main commit response - status: ${responseGetCommit.status}`);
        const lastCommit = responseGetCommit.data;

        var baseBranchSHA;

        // try to get base branch. if not exist, create
        try {
            const responseGetBranch = await octokit.rest.repos.getBranch({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                branch: baseBranch,
            });
            // console.log(responseGetBranch); //debug
            console.log(`Get ${baseBranch} branch response - status: ${responseGetBranch.status}`);
            baseBranchSHA = responseGetBranch.data.commit.sha;
        } catch(error) {
            if(error.name === 'HttpError' && error.status === 404) {
                console.log(`${baseBranch} branch not found`)
                // create base branch
                const responseCreateRef = await octokit.rest.git.createRef({
                    owner: github.context.repo.owner,
                    repo: github.context.repo.repo,
                    ref: `refs/heads/${baseBranch}`,
                    sha: lastCommit.sha,
                });
                // console.log(responseCreateRef); //debug
                console.log(`Create ${baseBranch} branch response - status: ${responseCreateRef.status}`);
                baseBranchSHA = responseCreateRef.data.object.sha;
            } else {
                throw Error(error)
            }
        };

        // const baseBranchSHA = (typeof responseGetBranch === 'undefined') ? responseCreateRef.data.object.sha : responseGetBranch.data.commit.sha;
        console.log(`base SHA: ${baseBranchSHA}`); //debug
        console.log(`last commit SHA: ${lastCommit.sha}`); //debug

        // if base and main branches have same sha
        if (baseBranchSHA == lastCommit.sha) {
            // create empty commit
            const responseCreateCommit = await octokit.rest.git.createCommit({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                message: `Setup ${prTitle} PR`,
                tree: lastCommit.commit.tree.sha,
                parents: [lastCommit.sha],
            });
            console.log(`Create empty commit response - status: ${responseCreateCommit.status}`);

            // update refs/heads/main
            const responseUpdateRef = await octokit.rest.git.updateRef({
                owner: github.context.repo.owner,
                repo: github.context.repo.repo,
                ref: 'heads/main',
                sha: responseCreateCommit.data.sha,
            });
            console.log(`Update refs response - status: ${responseUpdateRef.status}`);
        };

        // create PR
        const responsePullsCreate = await octokit.rest.pulls.create({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            head: 'main',
            base: baseBranch,
            title: prTitle,
            body: prBody,
        });
        // console.log(responsePullsCreate); //debug
        console.log(`Create PR response - status: ${responsePullsCreate.status}`);

        return responsePullsCreate.data.number;
    } catch (error) {
        core.setFailed(error.message);
    }
}

async function run() {
    try {
        const prNumber = await findPR();
        console.log(`PR issue number: ${prNumber}`);
        core.setOutput("pr-number", prNumber);

    } catch (error) {
        core.setFailed(error.message);
    }
}

run();
