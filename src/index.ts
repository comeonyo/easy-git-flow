#!/usr/bin/env ts-node

import { Command } from 'commander';
import simpleGit, { SimpleGit } from 'simple-git';
import * as process from 'process';

const program = new Command();

// CLI 옵션 설정
program
    .version('1.0.0')
    .description('티켓 번호로 release candidate 브랜치를 자동 생성하는 CLI 도구 (release-easy)')
    .requiredOption('-t, --ticket <ticketId>', 'JIRA 티켓 번호 (예: PROJ-123)')
    .option('-r, --release <releaseName>', 'Release candidate 브랜치 이름 (기본: release/<오늘날짜>)')
    // 운영 브랜치 기본값을 "main"으로 설정
    .option('-p, --prod <prodBranch>', '운영 베이스 브랜치 (기본: main)', 'main')
    // 개발 브랜치 기본값을 "dev"로 설정
    .option('-d, --develop <developBranch>', '개발 브랜치 (기본: dev)', 'dev')
    // dry-run 옵션 수정
    .option('--dry-run', 'Dry run mode: simulate actions without executing git commands');

program.parse(process.argv);
const options = program.opts();

const ticketId: string = options.ticket;
const prodBranch: string = options.prod;
const developBranch: string = options.develop;
const releaseBranch: string =
    options.release || `release/${new Date().toISOString().split('T')[0]}`;
const dryRun: boolean = options.dryRun || false;

const git: SimpleGit = simpleGit();

async function runReleaseProcess(): Promise<void> {
    try {
        console.log(`티켓번호 ${ticketId}에 해당하는 커밋을 ${developBranch} 브랜치에서 검색합니다...`);

        // 1. 개발 브랜치(dev)로 전환
        const branches = await git.branch();
        if (!branches.all.includes(developBranch)) {
            console.error(`개발 브랜치 ${developBranch}가 존재하지 않습니다.`);
            return;
        }
        if (dryRun) {
            console.log(`[DRY-RUN] Would checkout branch: ${developBranch}`);
        } else {
            await git.checkout(developBranch);
        }

        // 2. 최근 커밋 로그(예: 최근 100개) 중에서 티켓 번호가 포함된 커밋 검색
        const log = await git.log({ n: 100 });
        const commits = log.all.filter((commit) => commit.message.includes(ticketId));

        if (commits.length === 0) {
            console.log(`티켓 번호 ${ticketId}가 포함된 커밋을 찾을 수 없습니다.`);
            return;
        }

        console.log(`검색된 커밋 목록:`);
        commits.forEach((commit) => {
            console.log(`- ${commit.hash}: ${commit.message}`);
        });

        // 3. 운영 브랜치(prodBranch)로 전환 후, 새로운 release 브랜치 생성
        if (dryRun) {
            console.log(`[DRY-RUN] Would checkout branch: ${prodBranch}`);
            console.log(`[DRY-RUN] Would create and checkout new branch: ${releaseBranch} from ${prodBranch}`);
        } else {
            console.log(`\n${prodBranch} 브랜치로 전환 후, ${releaseBranch} 브랜치를 생성합니다...`);
            await git.checkout(prodBranch);
            await git.checkoutBranch(releaseBranch, prodBranch);
            console.log(`새 release 브랜치 ${releaseBranch} 생성 완료.`);
        }

        // 4. 검색된 각 커밋을 순차적으로 cherry-pick
        for (const commit of commits) {
            if (dryRun) {
                console.log(`[DRY-RUN] Would cherry-pick commit ${commit.hash}`);
            } else {
                try {
                    console.log(`Cherry-picking 커밋 ${commit.hash}...`);
                    await git.raw(['cherry-pick', commit.hash]);
                    console.log(`커밋 ${commit.hash} cherry-pick 성공.`);
                } catch (err) {
                    console.error(`커밋 ${commit.hash} cherry-pick 중 에러 발생:`, err);
                    console.log(`문제가 발생하여 cherry-pick을 abort 합니다.`);
                    await git.raw(['cherry-pick', '--abort']);
                    return;
                }
            }
        }

        console.log(`\nRelease candidate 브랜치 ${releaseBranch}가 생성되었으며, 티켓 번호 ${ticketId} 관련 커밋이 적용되었습니다.`);
        console.log(`이제 해당 브랜치에서 테스트 및 검증을 진행한 후 운영 배포를 진행할 수 있습니다.`);
    } catch (error) {
        console.error('Release 과정 중 오류 발생:', error);
    }
}

runReleaseProcess();