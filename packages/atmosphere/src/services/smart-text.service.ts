import { Injectable } from '@nestjs/common';
import type { ProseMirrorDoc } from 'atmosphere-sdk';
import type { AtContext, AtRequest } from '~/interface/config';

export interface SmartTextGetResult {
  pm: ProseMirrorDoc | null;
  markdown: string | null;
}

/**
 * SmartText cell content service. CE stub — returns no-op results.
 * EE override (`src/ee/services/smart-text.service.ts`) provides the
 * full read/write implementation against `atm_row_meta` JSONB.
 */
@Injectable()
export class SmartTextService {
  async getContent(
    _context: AtContext,
    _param: {
      tableId: string;
      rowId: string;
      columnId: string;
    },
  ): Promise<SmartTextGetResult> {
    return { pm: null, markdown: null };
  }

  async updateContent(
    _context: AtContext,
    _param: {
      tableId: string;
      rowId: string;
      columnId: string;
      pmContent: ProseMirrorDoc;
      req: AtRequest;
    },
  ): Promise<SmartTextGetResult> {
    return { pm: null, markdown: null };
  }
}
