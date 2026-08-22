import { Injectable, NotFoundException } from '@nestjs/common';
import { createReadStream, existsSync, realpathSync } from 'fs';
import { join, sep } from 'path';
import { Response } from 'express';
import {
  findLibraryDocument,
  LIBRARY_DOCUMENTS,
} from './documents.catalog';

@Injectable()
export class DocumentsService {
  private readonly dir = join(process.cwd(), 'assets', 'documents');

  list() {
    return LIBRARY_DOCUMENTS.map(({ id, title, description }) => ({
      id,
      title,
      description,
    }));
  }

  stream(id: string, disposition: 'inline' | 'attachment', res: Response) {
    const doc = findLibraryDocument(id);
    if (!doc) throw new NotFoundException('Document not found');

    const filePath = join(this.dir, doc.fileName);
    if (!existsSync(filePath)) {
      throw new NotFoundException('Document not found');
    }

    const resolved = realpathSync(filePath);
    const root = realpathSync(this.dir);
    if (resolved !== root && !resolved.startsWith(root + sep)) {
      throw new NotFoundException('Document not found');
    }

    const downloadName = `${doc.title.replace(/[/\\"]/g, '')}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `${disposition}; filename="${downloadName}"`,
    );
    res.setHeader('Cache-Control', 'private, no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');

    const stream = createReadStream(filePath);
    stream.on('error', () => {
      if (!res.headersSent) {
        res.status(404).end();
      } else {
        res.end();
      }
    });
    stream.pipe(res);
  }
}
