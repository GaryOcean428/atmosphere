import { Inject, Injectable } from '@nestjs/common';
import {
  AppEvents,
  type AtContext,
  type AtRequest,
  ProjectStatus,
} from 'atmosphere-sdk';
import { Base, Source } from '~/models';
import Atmosphere from '~/Atmosphere';
import { MetaTable } from '~/cli';
import { generateUniqueName } from '~/helpers/exportImportHelpers';
import { JobTypes } from '~/interface/Jobs';
import { AppHooksService } from '~/services/app-hooks/app-hooks.service';
import { BasesService } from '~/services/bases.service';
import { IJobsService } from '~/modules/jobs/jobs-service.interface';
import { AtError } from '~/helpers/ncError';

@Injectable()
export class DuplicateService {
  constructor(
    @Inject('JobsService') protected readonly jobsService: IJobsService,
    protected readonly basesService: BasesService,
    protected readonly appHooksService: AppHooksService,
  ) {}

  async duplicateBase({
    context,
    req,
    baseId,
    sourceId,
    body,
  }: {
    context: AtContext;
    req: AtRequest;
    baseId: string;
    sourceId?: string;
    body?: {
      options?: {
        excludeData?: boolean;
        excludeViews?: boolean;
        excludeHooks?: boolean;
        excludeScripts?: boolean;
        excludeDashboards?: boolean;
        excludeInterfaces?: boolean;
        excludeWorkflows?: boolean;
        excludeDocuments?: boolean;
      };
      // override duplicated base
      base?: any;
    };
  }) {
    const base = await Base.get(context, baseId);

    if (!base) {
      AtError.get(context).baseNotFound(baseId);
    }

    if (base.is_sandbox) {
      AtError.get(context).badRequest(
        'Sandbox bases cannot be duplicated. Duplicate the master base instead.',
      );
    }

    const source = sourceId
      ? await Source.get(context, sourceId)
      : (await base.getSources())[0];

    if (!source) {
      if (sourceId) {
        AtError.get(context).sourceNotFound(sourceId);
      }
      AtError.get(context).noSourcesFound();
    }

    if (
      body.base?.fk_workspace_id &&
      body.base?.fk_workspace_id !== '' &&
      (base.fk_workspace_id || body.base?.fk_workspace_id) &&
      base.fk_workspace_id !== body.base?.fk_workspace_id
    ) {
      await this.handleDifferentWs({
        context,
        req,
        sourceBase: base,
        targetBase: body.base,
      });
    }
    const targetWorkspaceId =
      body.base?.fk_workspace_id ?? context.workspace_id;
    const bases = await Base.list(targetWorkspaceId);

    const targetBaseTitle = body.base?.title ?? base.title;
    const uniqueTitle = generateUniqueName(
      `${targetBaseTitle} copy`,
      bases.map((p) => p.title),
    );

    const parentAuditId = await Atmosphere.ncAudit.genNanoid(MetaTable.AUDIT);

    req.ncParentAuditId = parentAuditId;

    const dupProject = await this.basesService.baseCreate({
      base: {
        title: uniqueTitle,
        status: ProjectStatus.JOB,
        ...(body.base || {}),
        fk_workspace_id: targetWorkspaceId,
      },
      user: {
        id: req.user.id,
        email: req.user.email,
        display_name: req.user.display_name,
      },
      req,
    });

    this.appHooksService.emit(AppEvents.BASE_DUPLICATE_START, {
      sourceBase: base,
      destBase: dupProject,
      user: req.user,
      req,
      context,
      id: parentAuditId,
      options: body?.options,
    });

    req.ncParentAuditId = parentAuditId;

    const job = await this.jobsService.add(JobTypes.DuplicateBase, {
      context,
      user: req.user,
      baseId: base.id,
      sourceId: source.id,
      dupProjectId: dupProject.id,
      dupWorkspaceId: dupProject.fk_workspace_id,
      options: body.options || {},
      req,
    });

    return { id: job.id, base_id: dupProject.id };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected async handleDifferentWs(params: {
    sourceBase: Base;
    targetBase: Base;
    context: AtContext;
    req: AtRequest;
  }) {
    AtError.notImplemented();
  }
}
