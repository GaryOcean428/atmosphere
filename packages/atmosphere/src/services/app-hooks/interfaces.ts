import type { SyncSource } from '~/models';
import type {
  BaseType,
  ColumnType,
  CommentType,
  FilterType,
  HookType,
  IntegrationType,
  PluginTestReqType,
  PluginType,
  ProjectRoles,
  ProjectUserReqType,
  SortType,
  SourceType,
  TableType,
  UserType,
  ViewType,
  WidgetType,
} from 'atmosphere-sdk';
import type { AtContext, AtRequest } from '~/interface/config';
import type { CustomUrl } from '~/models';

export type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export interface AtBaseEvent {
  context: AtContext;
  req: AtRequest;
  clientId?: string;
}

export interface ProjectInviteEvent extends AtBaseEvent {
  base: BaseType;
  user: UserType;
  invitedBy: UserType;
  role: ProjectRoles | string;
}

export interface RowCommentEvent extends AtBaseEvent {
  base: BaseType;
  user: UserType;
  model: TableType;
  rowId: string;
  comment: CommentType;
  ip?: string;
  /**
   * Source surface when the comment rode an interface-scoped op — mention
   * notifications stamp it so clicks route back to the interface. Absent =
   * posted in the data app.
   */
  source?: { interfaceId: string; pageId: string };
}

export interface RowMentionEvent extends AtBaseEvent {
  model: TableType;
  rowId: string;
  user: UserType;
  column: ColumnType;
  mentions: string[];
}

export interface ProjectUserUpdateEvent extends AtBaseEvent {
  base: BaseType;
  user: UserType;
  baseUser: Partial<ProjectUserReqType>;
  oldBaseUser: Partial<ProjectUserReqType>;
}
export interface UserProfileUpdateEvent
  extends Optional<AtBaseEvent, 'context'> {
  user: UserType;
  oldUser: Partial<UserType>;
}

export interface ProjectUserDeleteEvent extends AtBaseEvent {
  base: BaseType;
  user: UserType;
}

export interface ProjectUserResendInviteEvent extends AtBaseEvent {
  base: BaseType;
  user: UserType;
  baseUser: ProjectUserReqType;
}

export interface ProjectCreateEvent extends AtBaseEvent {
  base: BaseType;
  user: UserType;
  xcdb: boolean;
}

export interface ProjectUpdateEvent extends AtBaseEvent {
  base: BaseType;
  updateObj: Record<string, any>;
  oldBaseObj: BaseType;
  user: UserType;
}

export interface TableUpdateEvent extends AtBaseEvent {
  table: Partial<TableType>;
  prevTable: TableType;
}

export interface ProjectDeleteEvent extends AtBaseEvent {
  base: BaseType;
  user: UserType;
}

export interface WelcomeEvent extends Optional<AtBaseEvent, 'context'> {
  user: UserType;
}

export interface UserSignupEvent extends Optional<AtBaseEvent, 'context'> {
  user: UserType;
}

export interface UserInviteEvent extends Optional<AtBaseEvent, 'context'> {
  user: UserType;
  role: string;
  workspaceInvite?: boolean;
  workspaceId?: string;
}

export interface UserSigninEvent extends Optional<AtBaseEvent, 'context'> {
  user: UserType;
}

export interface UserSigninFailedEvent
  extends Optional<AtBaseEvent, 'context' | 'req'> {
  email?: string;
  provider?: string;
  reason?: string;
}

export interface UserSignoutEvent extends Optional<AtBaseEvent, 'context'> {
  user: UserType;
}

export interface ApiCreatedEvent extends AtBaseEvent {
  info: any;
}

export interface UserPasswordChangeEvent
  extends Optional<AtBaseEvent, 'context'> {
  user: UserType;
}

export interface UserPasswordForgotEvent
  extends Optional<AtBaseEvent, 'context'> {
  user: UserType;
}

export interface UserPasswordResetEvent
  extends Optional<AtBaseEvent, 'context'> {
  user: UserType;
}

export interface UserEmailVerificationEvent
  extends Optional<AtBaseEvent, 'context'> {
  user: UserType;
}

export interface TableEvent extends AtBaseEvent {
  table: TableType;
  user: UserType;
  source?: SourceType;
}

export interface ViewEvent extends AtBaseEvent {
  view: ViewType;
  user?: UserType;
}

export interface ViewCreateEvent extends AtBaseEvent {
  view: ViewType;
  owner: UserType;
  user?: UserType;
}
export interface ViewDeleteEvent extends AtBaseEvent {
  view: ViewType;
  owner: UserType;
  user?: UserType;
}

export interface SharedViewUpdateEvent extends AtBaseEvent {
  view: ViewType;
  sharedView: any;
  oldSharedView: any;
  user?: UserType;
}

export interface ViewUpdateEvent extends ViewEvent {
  oldView: ViewType;
  owner: UserType;
}

export interface FormViewUpdateEvent extends AtBaseEvent {
  view: ViewType;
  formView: any;
  oldFormView: any;
}

export interface GridViewUpdateEvent extends AtBaseEvent {
  view: ViewType;
  gridView: any;
  oldGridView: any;
  owner: UserType;
}

export interface KanbanViewUpdateEvent extends AtBaseEvent {
  view: ViewType;
  kanbanView: any;
  oldKanbanView: any;
  owner: UserType;
}

export interface GalleryViewUpdateEvent extends AtBaseEvent {
  view: ViewType;
  galleryView: any;
  oldGalleryView: any;
  owner: UserType;
}

export interface CalendarViewUpdateEvent extends AtBaseEvent {
  view: ViewType;
  calendarView: any;
  oldCalendarView: any;
  owner: UserType;
}

export interface MapViewUpdateEvent extends AtBaseEvent {
  view: ViewType;
  mapView: any;
  oldMapView: any;
  owner: UserType;
}

export interface TimelineViewUpdateEvent extends AtBaseEvent {
  view: ViewType;
  timelineView: any;
  oldTimelineView: any;
  owner: UserType;
}

export interface GanttViewUpdateEvent extends AtBaseEvent {
  view: ViewType;
  ganttView: any;
  oldGanttView: any;
  owner: UserType;
}

export interface FormViewUpdateEvent extends AtBaseEvent {
  view: ViewType;
  formView: any;
  oldFormView: any;
  owner: UserType;
}

export interface ListViewUpdateEvent extends AtBaseEvent {
  view: ViewType;
  listView: any;
  oldListView: any;
  owner: UserType;
}

type FilterEventAdditionalProp =
  | {
      hook: HookType;
    }
  | {
      view: ViewType;
    }
  | {
      linkColumn: ColumnType;
    }
  | {
      widget: WidgetType;
    };

export type FilterEvent = AtBaseEvent & {
  filter: FilterType;
  ip?: string;
  column?: ColumnType;
} & FilterEventAdditionalProp;

export type FilterUpdateEvent = FilterEvent & {
  oldFilter: FilterType;
};

export interface ColumnEvent extends AtBaseEvent {
  table: TableType;
  columnId: string;
  column: ColumnType;
  columns: ColumnType[];
}

export interface ColumnUpdateEvent extends ColumnEvent {
  oldColumn: ColumnType;
}

export interface SortEvent extends AtBaseEvent {
  sort: SortType;
  ip?: string;
  view: ViewType;
  column: ColumnType;
}

export interface SortUpdateEvent extends SortEvent {
  oldSort: SortType;
}

export interface OrgUserInviteEvent extends Omit<AtBaseEvent, 'context'> {
  user: UserType;
  count?: number;
  context?: AtContext;
}

export interface OrgUserUpdateEvent extends Omit<AtBaseEvent, 'context'> {
  userId: string;
  orgId: string;
  oldRole?: string;
  newRole: string;
  context?: AtContext;
}

export interface OrgUserDeleteEvent extends Omit<AtBaseEvent, 'context'> {
  userId: string;
  context?: AtContext;
}

export interface OrgUserAddEvent extends Omit<AtBaseEvent, 'context'> {
  userId: string;
  orgId: string;
  role: string;
  context?: AtContext;
}

export interface OrgUserRemoveEvent extends Omit<AtBaseEvent, 'context'> {
  userId: string;
  orgId: string;
  context?: AtContext;
}

export interface OrgWorkspaceEvent extends Omit<AtBaseEvent, 'context'> {
  workspaceId: string;
  orgId: string;
  context?: AtContext;
}

export interface ViewColumnEvent extends AtBaseEvent {
  viewColumn: any;
  view: ViewType;
  column: ColumnType;
}

export interface ViewColumnUpdateEvent extends ViewColumnEvent {
  oldViewColumn: any;
  internal?: boolean;
}

export interface RelationEvent extends AtBaseEvent {
  column: ColumnType;
}

export interface WebhookEvent extends AtBaseEvent {
  hook: HookType;
  tableId: string;
}

export interface WebhookUpdateEvent extends WebhookEvent {
  oldHook: HookType;
}

export interface WebhookTriggerEvent extends AtBaseEvent {
  hook: HookType;
  data: any;
}

export interface ApiTokenCreateEvent extends Optional<AtBaseEvent, 'context'> {
  userId: string;
  tokenId: string;
  tokenTitle: string;
  scopeCount?: number;
  permissionCategories?: string[];
  hasExpiry?: boolean;
}

export interface ApiTokenUpdateEvent extends Optional<AtBaseEvent, 'context'> {
  userId: string;
  tokenId: string;
  tokenTitle: string;
  scopeCount?: number;
  permissionCategories?: string[];
  hasExpiry?: boolean;
}

export interface ApiTokenDeleteEvent extends Optional<AtBaseEvent, 'context'> {
  userId: string;
  tokenId: string;
  tokenTitle: string;
}

export interface PluginTestEvent extends Optional<AtBaseEvent, 'context'> {
  testBody: PluginTestReqType;
}

export interface PluginEvent extends Optional<AtBaseEvent, 'context'> {
  plugin: PluginType;
}

export interface SharedBaseEvent extends AtBaseEvent {
  link?: string;
  base?: BaseType;
  sharedBaseRole: string;
  uuid: string;
  customUrl?: CustomUrl;
}

export interface SharedBaseDeleteEvent
  extends Omit<SharedBaseEvent, 'sharedBaseRole'> {}

export interface SourceEvent extends AtBaseEvent {
  source: SourceType;
  integration: IntegrationType;
}

export interface AttachmentEvent extends Optional<AtBaseEvent, 'context'> {
  type: 'url' | 'file';
}

export interface FormColumnEvent extends AtBaseEvent {
  formColumn: any;
}

export interface GridColumnEvent extends AtBaseEvent {}

export interface MetaDiffEvent extends AtBaseEvent {
  base: BaseType;
  source?: SourceType;
}

export interface UIAclEvent extends AtBaseEvent {
  base: any;
  role: string;
  view: any;
  disabled: boolean;
}

export interface SyncSourceEvent extends AtBaseEvent {
  syncSource: Partial<SyncSource>;
}

export interface IntegrationEvent extends Optional<AtBaseEvent, 'context'> {
  integration: IntegrationType;
  user: UserType;
  ip?: string;
}

export interface SourceUpdateEvent extends SourceEvent {
  oldSource: Partial<SourceType>;
}

export interface BaseDuplicateEvent extends AtBaseEvent {
  sourceBase: BaseType;
  destBase?: BaseType;
  user: UserType;
  id?: string;
  error?: string;
  options?: unknown;
}

export interface TableDuplicateEvent extends AtBaseEvent {
  sourceTable: TableType;
  destTable?: TableType;
  user: UserType;
  id?: string;
  error?: string;
  title?: string;
  options?: unknown;
}

export interface ColumnDuplicateEvent extends AtBaseEvent {
  table: TableType;
  sourceColumn: ColumnType;
  destColumn?: ColumnType;
  user: UserType;
  id?: string;
  error?: string;
  options?: unknown;
}

export interface ViewDuplicateEvent extends AtBaseEvent {
  sourceView: ViewType;
  destView?: ViewType;
  id?: string;
  error?: string;
}

export interface ModelRoleVisibilityEvent extends AtBaseEvent {
  view: ViewType;
  role: string;
  disabled: boolean;
}

export interface DataImportEvent extends AtBaseEvent {
  view: ViewType;
  table: TableType;
  type: 'excel' | 'csv';
  id: string;
}

export interface IntegrationEvent extends Optional<AtBaseEvent, 'context'> {
  integration: IntegrationType;
  user: UserType;
  ip?: string;
}

export interface IntegrationUpdateEvent extends IntegrationEvent {
  oldIntegration: IntegrationType;
}

export interface DataExportEvent extends AtBaseEvent {
  view: ViewType;
  table: TableType;
  type: 'excel' | 'csv' | 'json' | 'ics';
}

export interface RecordsSoftDeleteEvent extends AtBaseEvent {
  tableId: string;
  rowIds: string[];
  deletedAt: string;
}

export interface RecordsRestoreEvent extends AtBaseEvent {
  tableId: string;
  rowIds: string[];
}

export interface RecordsPermanentDeleteEvent extends AtBaseEvent {
  tableId: string;
  rowIds: string[];
}

export type AppEventPayload =
  | ProjectInviteEvent
  | ProjectCreateEvent
  | ProjectUpdateEvent
  | ProjectDeleteEvent
  | WelcomeEvent
  | UserSignupEvent
  | UserSigninEvent
  | TableEvent
  | ViewEvent
  | FilterEvent
  | SortEvent
  | RowCommentEvent
  | RowMentionEvent
  | WebhookTriggerEvent
  | ColumnEvent
  | ResourceRestoreEvent
  | ResourcePermanentDeleteEvent;

export interface ResourceRestoreEvent extends AtBaseEvent {
  resourceType: string;
  resourceId: string;
  name: string;
  user: Partial<UserType>;
}

export interface ResourcePermanentDeleteEvent extends AtBaseEvent {
  resourceType: string;
  resourceId: string;
  name: string;
  user: Partial<UserType>;
}
