import type { NextAPIRequest, NextAPIResponse } from 'next';
import fs
    from 'fs';
const path = 'src/assets/logs/test-log.txt';

export default async function handler(req: NextAPIRequest, res: NextAPIResponse) {
  try {
    const content = await fs.readFile(path, 'utf-8');
    res.status = 200;
    res.json({
      logs: [{
        fileName: 'test-log.txt',
        content: content.toString()
      }]
    });
  } catch (error) {
    res.status = 500;
    res.json({ error: 'Failed to read log', detail: error });
  }
}
