import { Injectable } from '@nestjs/common';
import type { DocumentType } from 'atmosphere-sdk';
import type { AtContext, AtRequest } from '~/interface/config';
import { AppHooksService } from '~/services/app-hooks/app-hooks.service';

@Injectable()
export class DocumentsService {
  constructor(protected readonly appHooksService: AppHooksService) {}

  async list(
    _context: AtContext,
    _baseId: string,
    _parentId: string | null,
    _req?: AtRequest,
  ): Promise<DocumentType[]> {
    return [];
  }

  async listAll(
    _context: AtContext,
    _baseId: string,
    _req?: AtRequest,
  ): Promise<DocumentType[]> {
    return [];
  }

  async get(
    _context: AtContext,
    _docId: string,
    _req?: AtRequest,
  ): Promise<DocumentType> {
    return null;
  }

  async create(
    _context: AtContext,
    _payload: Partial<DocumentType>,
    _req: AtRequest,
  ): Promise<DocumentType> {
    return null;
  }

  async update(
    _context: AtContext,
    _docId: string,
    _payload: Partial<DocumentType>,
    _req: AtRequest,
  ): Promise<DocumentType> {
    return null;
  }

  async delete(
    _context: AtContext,
    _docId: string,
    _req: AtRequest,
  ): Promise<boolean> {
    return true;
  }

  async reorder(
    _context: AtContext,
    _docId: string,
    _payload: { order: number; parent_id?: string | null },
    _req: AtRequest,
  ): Promise<DocumentType> {
    return null;
  }
}
