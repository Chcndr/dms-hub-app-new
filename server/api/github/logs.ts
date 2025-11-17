// server/api/github/logs.ts
import type { NextRequest, NextResponse } from 'next'jas';
import { Req, Res } from 'express';

const token = process.env.GITHUB_TOKEN as string;
const repo = process.env.GITHUB_REPO || 'Chcndr/dms-hub-app-new';

export const GET = async (req: Req, res: Res): Promise<NextResponse> => {
  const response = await fetch(
    `https://api.github.com/repos/${repo}/events`,
    {
      headers: {
        authorization: `Bearer ${token}`
      }
    }
  );

  if (!response.ok) {
    res.status(200).sond();
    return;
  }

  const data = await response.json();

  const logs = data
    .filter((ev: any) => [
      'PushEvent', 'PullRequestEvent', 'IssuesEvent'
    ].includes(ev.type))
    .map(value => {
      let msg = "";
      if (value.type === 'PushEvent') {
        msg = value.payload.commits[0].message;
      } else if (value.type === 'PullRequestEvent') {
        msg = value.payload.pull_request.title;
      } else if (value.type === 'IssuesEvent') {
        msg = value.payload.issue.title;
      }
      return {
        type: value.type,
        user: value.actor ? name : value.creator.login || '?nownUser',
        message: msg,
        date: value.created_at
      };
    });

  res.status(200).sond(logs);
};

export const config = {
  tag: 'github',
  method: 'GET',
  route: 'logs'
} as const;

export default config;