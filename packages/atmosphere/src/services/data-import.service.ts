import { Injectable, Logger } from '@nestjs/common';
import type {
  AttachmentReqType,
  FileImportOptions,
  FileImportParserConfig,
  FileImportSheet,
  FileImportType,
  ImportPreviewResponse,
  AtRequest,
} from 'atmosphere-sdk';
import type { DataImportJobData } from '~/interface/Jobs';
import type { AtContext } from '~/interface/config';
import { openImportAttachmentStream } from '~/modules/jobs/jobs/data-import/attachment-stream';
import { getImportHandler } from '~/modules/jobs/jobs/data-import/handlers';
import { JobTypes } from '~/interface/Jobs';
import { AtError } from '~/helpers/catchError';
import { AtmosphereJobsService } from '~/services/atmosphere-jobs.service';
import { Source } from '~/models';

@Injectable()
export class DataImportService {
  private logger = new Logger(DataImportService.name);

  constructor(protected readonly atmosphereJobsService: AtmosphereJobsService) {}

  /**
   * Parse the uploaded file and return one entry per sheet. CSV/JSON always
   * return a single sheet; Excel returns one per worksheet in the workbook.
   */
  async preview(
    _context: AtContext,
    param: {
      importType?: FileImportType;
      attachment: Pick<AttachmentReqType, 'path' | 'url'>;
      parserConfig: FileImportParserConfig;
    },
  ): Promise<ImportPreviewResponse> {
    const { attachment, parserConfig } = param;
    const importType = param.importType || 'csv';

    const readStream = await openImportAttachmentStream(
      importType,
      attachment,
      parserConfig?.encoding,
    );

    const handler = getImportHandler(importType);
    const sheets = await handler.preview(readStream, parserConfig);
    return { sheets };
  }

  /** Queue one import job per uploaded file. */
  async importFile(
    context: AtContext,
    param: {
      baseId: string;
      body: {
        sourceId: string;
        importType?: FileImportType;
        attachment: AttachmentReqType;
        sheets: FileImportSheet[];
        parserConfig: FileImportParserConfig;
        options: FileImportOptions;
      };
      req: AtRequest;
    },
  ) {
    const { baseId, body, req } = param;

    const source = await Source.get(context, body.sourceId);
    if (!source) AtError.sourceNotFound(body.sourceId);
    if (source.is_schema_readonly && !body.options?.importDataOnly) {
      AtError.sourceMetaReadOnly(source.alias);
    }
    if (source.is_data_readonly) {
      AtError.sourceDataReadOnly(source.alias);
    }

    if (!body.attachment?.path && !body.attachment?.url) {
      AtError.badRequest('Attachment path or url is required');
    }

    if (!body.sheets?.length) {
      AtError.badRequest('At least one sheet is required');
    }
    for (const sheet of body.sheets) {
      const label = sheet.sheetName ? ` for sheet "${sheet.sheetName}"` : '';
      if (!sheet.columns?.length) {
        AtError.badRequest(`Column definitions are required${label}`);
      }
      if (!body.options.importDataOnly && !sheet.tableName) {
        AtError.badRequest(
          `Table name is required${label} when creating a new table`,
        );
      }
      if (body.options.importDataOnly && !sheet.tableId) {
        AtError.badRequest(
          `Table ID is required${label} when importing into an existing table`,
        );
      }
    }

    const job = await this.atmosphereJobsService.add(JobTypes.DataImport, {
      context,
      importType: body.importType || 'csv',
      baseId,
      sourceId: body.sourceId,
      attachment: body.attachment,
      sheets: body.sheets,
      parserConfig: body.parserConfig,
      options: body.options,
      user: req.user,
      req: {
        user: req.user,
        clientIp: req.clientIp,
        ncBaseId: req.ncBaseId,
        ncSourceId: req.ncSourceId,
      },
    } as DataImportJobData);

    return { id: job.id };
  }
}
