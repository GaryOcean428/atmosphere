import { Injectable } from '@nestjs/common';
import { extractRolesObj, AtApiVersion, OrgUserRoles } from 'atmosphere-sdk';
import type {
  BaseUpdateV3Type,
  BaseV3Type,
  ProjectReqType,
  UserType,
} from 'atmosphere-sdk';
import type { AtContext, AtRequest } from '~/interface/config';
import { BaseMetaProps } from '~/types/metaProps/base-meta-props';
import { AtError } from '~/helpers/catchError';
import { Base, BaseUser, Source } from '~/models';
import { BasesService } from '~/services/bases.service';
import { RootScopes } from '~/utils/globals';
import { validatePayload } from '~/helpers';
import { baseBuilder, sourceBuilder } from '~/utils/builders/base';
import { BaseMemberHelpers } from '~/services/v3/members/base-member-helpers';

@Injectable()
export class BasesV3Service {
  constructor(protected readonly basesService: BasesService) {
    this.baseMemberHelpers = new BaseMemberHelpers();
  }

  protected async getBaseList(
    context: AtContext,
    param: {
      user: { id: string; roles?: string | Record<string, boolean> };
      query?: any;
      workspaceId?: string;
      req?: AtRequest;
    },
  ) {
    return extractRolesObj(param.user?.roles)[OrgUserRoles.SUPER_ADMIN]
      ? await Base.list()
      : await BaseUser.getProjectsList(param.user.id, {
          ...param.query,
          workspaceId: param.workspaceId,
        });
  }

  baseMemberHelpers: BaseMemberHelpers;

  async baseList(
    context: AtContext,
    param: {
      user: { id: string; roles?: string | Record<string, boolean> };
      query?: any;
      workspaceId: string;
      req?: AtRequest;
    },
  ) {
    const bases = await this.getBaseList(context, param);

    const formattedBases: BaseV3Type[] = [];

    for (const base of bases) {
      const sources = sourceBuilder().build(
        (await new Base(base as Partial<Base>).getSources()).filter(
          (s) => !new Source(s).isMeta(),
        ),
      );
      formattedBases.push({
        ...baseBuilder().build(base),
        sources: sources.length ? sources : undefined,
      });
    }
    return formattedBases;
  }

  async getProject(context: AtContext, param: { baseId: string }) {
    const base: Base | BaseV3Type = await Base.get(context, param.baseId);

    const sources = sourceBuilder().build(
      (await new Base(base as Partial<Base>).getSources()).filter(
        (s) => !new Source(s).isMeta(),
      ),
    );
    return {
      ...baseBuilder().build(base),
      sources: sources.length ? sources : undefined,
    } as BaseV3Type;
  }

  async getProjectWithInfo(
    context: AtContext,
    param: { baseId: string; qsInclude?: string[]; includeConfig?: boolean },
  ) {
    const base = await this.basesService.getProjectWithInfo(context, param);

    if (!base) AtError.notFound('Base not found');

    // filter non-meta sources
    const sources = base.sources.filter((s) => !new Source(s).isMeta());

    return {
      ...baseBuilder().build(base),
      sources: sources?.length ? sourceBuilder().build(sources) : undefined,
      ...(param.qsInclude?.includes('members')
        ? await this.baseMemberHelpers.getBaseMember(context, {
            baseId: param.baseId,
            isPrivateBase: base.default_role === 'no-access',
          })
        : {}),
    } as BaseV3Type;
  }

  async baseUpdate(
    context: AtContext,
    param: {
      baseId: string;
      base: BaseUpdateV3Type;
      user: UserType;
      req: AtRequest;
    },
  ) {
    validatePayload(
      'swagger-v3.json#/components/schemas/BaseUpdate',
      param.base,
      true,
      {
        api_version: AtApiVersion.V3,
      },
    );
    const meta = param.base.meta as unknown as Record<string, unknown>;

    if (meta?.icon_color) {
      meta.iconColor = meta.icon_color;
      delete meta.icon_color;
    }
    if (meta) {
      const metaParsed = BaseMetaProps.safeParse(meta);
      if (metaParsed.error) {
        AtError.get({ api_version: AtApiVersion.V3 }).zodError({
          message: `'meta' property invalid`,
          errors: metaParsed.error,
        });
      }
    }

    await this.basesService.baseUpdate(context, {
      ...param,
      base: {
        ...param.base,
        ...(await this.parseBaseRequest(context, param.base)),
      },
      apiVersion: AtApiVersion.V3,
    });
    return this.getProjectWithInfo(context, { baseId: param.baseId });
  }

  async baseCreate(param: {
    base: ProjectReqType;
    user: any;
    req: any;
    workspaceId: string;
  }) {
    validatePayload(
      'swagger-v3.json#/components/schemas/BaseCreate',
      param.base,
      true,
      {
        api_version: AtApiVersion.V3,
      },
    );

    const base = {
      ...param.base,
      fk_workspace_id: param.workspaceId,
      type: 'database',
      ...(await this.parseBaseRequest(
        { workspace_id: param.workspaceId } as any,
        param.base,
      )),
    } as ProjectReqType;

    const meta = param.base.meta as unknown as Record<string, unknown>;

    if (meta?.icon_color) {
      meta.iconColor = meta.icon_color;
      delete meta.icon_color;
    }
    if (meta) {
      const metaParsed = BaseMetaProps.safeParse(meta);
      if (metaParsed.error) {
        AtError.get({ api_version: AtApiVersion.V3 }).zodError({
          message: `'meta' property invalid`,
          errors: metaParsed.error,
        });
      }
    }

    const res = await this.basesService.baseCreate({
      ...param,
      base,
      apiVersion: AtApiVersion.V3,
    });
    return this.getProjectWithInfo(
      { workspace_id: res.fk_workspace_id, base_id: RootScopes.WORKSPACE },
      { baseId: res.id },
    );
  }

  async baseSoftDelete(
    context: AtContext,
    param: { baseId: any; user: UserType; req: AtRequest },
  ) {
    await this.basesService.baseSoftDelete(context, param);
    return {};
  }

  async parseBaseRequest(_context: { workspace_id: string }, _base: any) {
    return {} as any;
  }
}
