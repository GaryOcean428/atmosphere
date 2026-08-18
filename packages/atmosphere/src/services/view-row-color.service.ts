import { Injectable } from '@nestjs/common';
import type {
  ColumnReqType,
  FilterType,
  AtContext,
  AtRequest,
  RowColoringInfo,
} from 'atmosphere-sdk';
import type { MetaService } from '~/meta/meta.service';
import type { Column } from '~/models';

export interface RowColorConditionBody {
  color: string;
  is_set_as_background: boolean;
  atm_order: number;
  type?: string;
  fk_target_column_id?: string;
}

@Injectable()
export class ViewRowColorService {
  async getByViewId(
    _context: AtContext,
    _param: {
      fk_view_id?: string;
      ncMeta?: MetaService;
    },
  ): Promise<RowColoringInfo | null> {
    return null;
  }

  async addRowColoringCondition(
    _context: AtContext,
    _param: {
      fk_view_id?: string;
      condition: RowColorConditionBody & { id?: string };
      req?: AtRequest;
      filter?: FilterType;
      filters?: FilterType[];
      ncMeta?: MetaService;
    },
  ): Promise<{
    id: string;
    info: RowColoringInfo;
  }> {
    return null;
  }

  async updateRowColoringCondition(
    _context: AtContext,
    _param: {
      fk_view_id?: string;
      fk_row_coloring_conditions_id: string;
      condition: RowColorConditionBody;
      req?: AtRequest;
      ncMeta?: MetaService;
    },
  ) {}

  async deleteRowColoringCondition(
    _context: AtContext,
    _param: {
      fk_view_id?: string;
      fk_row_coloring_conditions_id: string;
      req?: AtRequest;
      ncMeta?: MetaService;
    },
  ) {}

  async setRowColoringSelect(
    _context: AtContext,
    _param: {
      fk_view_id?: string;
      fk_column_id: string;
      is_set_as_background: boolean;
      req?: AtRequest;
      ncMeta?: MetaService;
    },
  ) {}

  async removeRowColorInfo(
    _context: AtContext,
    _param: {
      fk_view_id?: string;
      req?: AtRequest;
      ncMeta?: MetaService;
    },
  ) {}

  async checkIfColumnInvolved(
    _context: AtContext,
    _param: {
      existingColumn: Column;
      newColumn?: Column | ColumnReqType;
      action: 'delete' | 'update';
      ncMeta?: MetaService;
    },
  ) {
    return {
      applyRowColorInvolvement: async () => {},
    };
  }

  async restoreRowColoring(
    _context: AtContext,
    _param: {
      fk_view_id: string;
      snapshot: {
        row_coloring_mode: string | null;
        meta?: unknown;
        conditions?: unknown;
      };
      req?: AtRequest;
      ncMeta?: MetaService;
    },
  ) {}
}
