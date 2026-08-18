import type { AtContext } from '~/interface/config';
import type { Condition } from '~/db/CustomKnex';
import Atmosphere from '~/Atmosphere';
import {
  CacheDelDirection,
  CacheGetType,
  CacheScope,
  MetaTable,
} from '~/utils/globals';
import AtmosphereCache from '~/cache/AtmosphereCache';
import { extractProps } from '~/helpers/extractProps';
import { prepareForDb, prepareForResponse } from '~/utils/modelUtils';

export default class Job {
  id: string;
  job: string;
  status: string;
  result: string;
  fk_user_id: string;
  fk_workspace_id: string;
  base_id: string;
  created_at: Date;
  updated_at: Date;

  constructor(data: Partial<Job>) {
    Object.assign(this, data);
  }

  public static async insert(
    context: AtContext,
    jobObj: Partial<Job>,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const insertObj = extractProps(jobObj, [
      'id',
      'job',
      'status',
      'result',
      'fk_user_id',
    ]);

    const { id } = await ncMeta.metaInsert2(
      context.workspace_id,
      context.base_id,
      MetaTable.JOBS,
      insertObj,
    );

    return this.get(context, id, ncMeta);
  }

  public static async update(
    context: AtContext,
    jobId: string,
    jobObj: Partial<Job>,
    ncMeta = Atmosphere.ncMeta,
  ) {
    const updateObj = extractProps(jobObj, ['status', 'result']);

    const res = await ncMeta.metaUpdate(
      context.workspace_id,
      context.base_id,
      MetaTable.JOBS,
      prepareForDb(updateObj, 'result'),
      jobId,
    );

    await AtmosphereCache.update(
      'root',
      `${CacheScope.JOBS}:${jobId}`,
      prepareForResponse(updateObj, 'result'),
    );

    return res;
  }

  public static async delete(
    context: AtContext,
    jobId: string,
    ncMeta = Atmosphere.ncMeta,
  ) {
    await ncMeta.metaDelete(
      context.workspace_id,
      context.base_id,
      MetaTable.JOBS,
      jobId,
    );

    await AtmosphereCache.deepDel(
      'root',
      `${CacheScope.JOBS}:${jobId}`,
      CacheDelDirection.CHILD_TO_PARENT,
    );
  }

  public static async get(context: AtContext, id: any, ncMeta = Atmosphere.ncMeta) {
    let jobData =
      id &&
      (await AtmosphereCache.get(
        'root',
        `${CacheScope.JOBS}:${id}`,
        CacheGetType.TYPE_OBJECT,
      ));

    if (!jobData) {
      jobData = await ncMeta.metaGet2(
        context.workspace_id,
        context.base_id,
        MetaTable.JOBS,
        id,
      );

      jobData = prepareForResponse(jobData, 'result');

      await AtmosphereCache.set('root', `${CacheScope.JOBS}:${id}`, jobData);
    }

    return jobData && new Job(jobData);
  }

  public static async list(
    context: AtContext,
    opts: {
      condition?: Record<string, string>;
      xcCondition?: Condition;
    },
    ncMeta = Atmosphere.ncMeta,
  ): Promise<Job[]> {
    const jobList = await ncMeta.metaList2(
      context.workspace_id,
      context.base_id,
      MetaTable.JOBS,
      opts,
    );

    return jobList.map((job) => {
      return new Job(prepareForResponse(job, 'result'));
    });
  }
}
