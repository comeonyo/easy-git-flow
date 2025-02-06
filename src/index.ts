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
    .option('-p, --prod <prodBranch>', '운영 베이스 브랜치 (기본: main)', 'main')
    .option('-d, --develop <developBranch>', '개발 브랜치 (기본: dev)', 'dev')
    .option('--dryRun', 'Dry run mode');

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
                    console.error(`\n오류: 커밋 ${commit.hash}를 cherry-pick 하는 동안 문제가 발생했습니다.`);
                    console.error(`문제 내용: 해당 커밋을 자동 병합하는 과정에서 충돌이 발생했습니다.`);
                    console.error(`---------------------------------------------------------------`);
                    console.error(`해결 방법:`);
                    console.error(`1. 터미널에서 'git status'를 실행하여 충돌 파일 목록을 확인합니다.`);
                    console.error(`2. 충돌이 발생한 파일(예: src/index.ts)을 열어 수동으로 충돌 부분을 수정합니다.`);
                    console.error(`3. 수정한 후, 'git add <파일명>' 명령어로 변경사항을 스테이징합니다.`);
                    console.error(`4. 'git cherry-pick --continue' 명령어를 실행하여 cherry-pick 작업을 계속합니다.`);
                    console.error(`---------------------------------------------------------------`);
                    console.error(`또는, 해당 커밋을 건너뛰고 싶다면 'git cherry-pick --skip' 명령어를 사용하세요.`);
                    // cherry-pick 충돌 발생 시, 자동으로 작업을 중단합니다.
                    return;
                }
            }
        }

        console.log(`\nRelease candidate 브랜치 ${releaseBranch}가 생성되었으며, 티켓 번호 ${ticketId} 관련 커밋이 적용되었습니다.`);
        console.log(`이제 해당 브랜치에서 테스트 및 검증을 진행한 후 운영 배포를 진행할 수 있습니다.`);
    } catch (error) {
        console.error('\nRelease 과정 중 오류가 발생했습니다.');
        console.error('문제 해결을 위해 최신 상태의 브랜치와 커밋 로그를 확인하시기 바랍니다.');
    }
}

runReleaseProcess();
