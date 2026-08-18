import * as atm_011 from '~/meta/migrations/v2/atm_011';
import * as atm_012_alter_column_data_types from '~/meta/migrations/v2/atm_012_alter_column_data_types';
import * as atm_013_sync_source from '~/meta/migrations/v2/atm_013_sync_source';
import * as atm_014_alter_column_data_types from '~/meta/migrations/v2/atm_014_alter_column_data_types';
import * as atm_015_add_meta_col_in_column_table from '~/meta/migrations/v2/atm_015_add_meta_col_in_column_table';
import * as atm_016_alter_hooklog_payload_types from '~/meta/migrations/v2/atm_016_alter_hooklog_payload_types';
import * as atm_017_add_user_token_version_column from '~/meta/migrations/v2/atm_017_add_user_token_version_column';
import * as atm_018_add_meta_in_view from '~/meta/migrations/v2/atm_018_add_meta_in_view';
import * as atm_019_add_meta_in_meta_tables from '~/meta/migrations/v2/atm_019_add_meta_in_meta_tables';
import * as atm_020_kanban_view from '~/meta/migrations/v2/atm_020_kanban_view';
import * as atm_021_add_fields_in_token from '~/meta/migrations/v2/atm_021_add_fields_in_token';
import * as atm_022_qr_code_column_type from '~/meta/migrations/v2/atm_022_qr_code_column_type';
import * as atm_023_multiple_source from '~/meta/migrations/v2/atm_023_multiple_source';
import * as atm_024_barcode_column_type from '~/meta/migrations/v2/atm_024_barcode_column_type';
import * as atm_025_add_row_height from '~/meta/migrations/v2/atm_025_add_row_height';
import * as atm_026_map_view from '~/meta/migrations/v2/atm_026_map_view';
import * as atm_027_add_comparison_sub_op from '~/meta/migrations/v2/atm_027_add_comparison_sub_op';
import * as atm_028_add_enable_scanner_in_form_columns_meta_table from '~/meta/migrations/v2/atm_028_add_enable_scanner_in_form_columns_meta_table';
import * as atm_029_webhook from '~/meta/migrations/v2/atm_029_webhook';
import * as atm_030_add_description_field from '~/meta/migrations/v2/atm_030_add_description_field';
import * as atm_031_remove_fk_and_add_idx from '~/meta/migrations/v2/atm_031_remove_fk_and_add_idx';
import * as atm_033_add_group_by from '~/meta/migrations/v2/atm_033_add_group_by';
import * as atm_034_erd_filter_and_notification from '~/meta/migrations/v2/atm_034_erd_filter_and_notification';
import * as atm_035_add_username_to_users from '~/meta/migrations/v2/atm_035_add_username_to_users';
import * as atm_036_base_deleted from '~/meta/migrations/v2/atm_036_base_deleted';
import * as atm_037_rename_project_and_base from '~/meta/migrations/v2/atm_037_rename_project_and_base';
import * as atm_038_formula_parsed_tree_column from '~/meta/migrations/v2/atm_038_formula_parsed_tree_column';
import * as atm_039_sqlite_alter_column_types from '~/meta/migrations/v2/atm_039_sqlite_alter_column_types';
import * as atm_040_form_view_alter_column_types from '~/meta/migrations/v2/atm_040_form_view_alter_column_types';
import * as atm_041_calendar_view from '~/meta/migrations/v2/atm_041_calendar_view';
import * as atm_042_user_block from '~/meta/migrations/v2/atm_042_user_block';
import * as atm_043_user_refresh_token from '~/meta/migrations/v2/atm_043_user_refresh_token';
import * as atm_044_view_column_index from '~/meta/migrations/v2/atm_044_view_column_index';
import * as atm_045_extensions from '~/meta/migrations/v2/atm_045_extensions';
import * as atm_046_comment_mentions from '~/meta/migrations/v2/atm_046_comment_mentions';
import * as atm_047_comment_migration from '~/meta/migrations/v2/atm_047_comment_migration';
import * as atm_048_view_links from '~/meta/migrations/v2/atm_048_view_links';
import * as atm_049_clear_notifications from '~/meta/migrations/v2/atm_049_clear_notifications';
import * as atm_050_tenant_isolation from '~/meta/migrations/v2/atm_050_tenant_isolation';
import * as atm_051_source_readonly_columns from '~/meta/migrations/v2/atm_051_source_readonly_columns';
import * as atm_052_field_aggregation from '~/meta/migrations/v2/atm_052_field_aggregation';
import * as atm_053_jobs from '~/meta/migrations/v2/atm_053_jobs';
import * as atm_054_id_length from '~/meta/migrations/v2/atm_054_id_length';
import * as atm_055_junction_pk from '~/meta/migrations/v2/atm_055_junction_pk';
import * as atm_056_integration from '~/meta/migrations/v2/atm_056_integration';
import * as atm_057_file_references from '~/meta/migrations/v2/atm_057_file_references';
import * as atm_058_button_colum from '~/meta/migrations/v2/atm_058_button_colum';
import * as atm_059_invited_by from '~/meta/migrations/v2/atm_059_invited_by';
import * as atm_060_descriptions from '~/meta/migrations/v2/atm_060_descriptions';
import * as atm_061_integration_is_default from '~/meta/migrations/v2/atm_061_integration_is_default';
import * as atm_062_integration_store from '~/meta/migrations/v2/atm_062_integration_store';
import * as atm_063_form_field_filter from '~/meta/migrations/v2/atm_063_form_field_filter';
import * as atm_064_pg_minimal_dbs from '~/meta/migrations/v2/atm_064_pg_minimal_dbs';
import * as atm_065_encrypt_flag from '~/meta/migrations/v2/atm_065_encrypt_flag';
import * as atm_066_ai_button from '~/meta/migrations/v2/atm_066_ai_button';
import * as atm_067_personal_view from '~/meta/migrations/v2/atm_067_personal_view';
import * as atm_068_user_delete from '~/meta/migrations/v2/atm_068_user_delete';
import * as atm_069_ai_prompt from '~/meta/migrations/v2/atm_069_ai_prompt';
import * as atm_070_data_reflection from '~/meta/migrations/v2/atm_070_data_reflection';
import * as atm_071_add_meta_in_users from '~/meta/migrations/v2/atm_071_add_meta_in_users';
import * as atm_072_col_button_pk from '~/meta/migrations/v2/atm_072_col_button_pk';
import * as atm_073_file_reference_indexes from '~/meta/migrations/v2/atm_073_file_reference_indexes';
import * as atm_074_missing_context_indexes from '~/meta/migrations/v2/atm_074_missing_context_indexes';
import * as atm_075_audit_refactor from '~/meta/migrations/v2/atm_075_audit_refactor';
import * as atm_076_sync_configs from '~/meta/migrations/v2/atm_076_sync_configs';
import * as atm_077_column_index_name from '~/meta/migrations/v2/atm_077_column_index_name';
import * as atm_078_mcp_tokens from '~/meta/migrations/v2/atm_078_mcp_tokens';
import * as atm_079_cross_base_link from '~/meta/migrations/v2/atm_079_cross_base_link';
import * as atm_080_sync_mappings from '~/meta/migrations/v2/atm_080_sync_mappings';

import * as atm_081_audit from '~/meta/migrations/v2/atm_081_audit';
import * as atm_082_row_color_conditions from '~/meta/migrations/v2/atm_082_row_color_conditions';
import * as atm_083_permissions from '~/meta/migrations/v2/atm_083_permissions';
import * as atm_084_hook_trigger_fields from '~/meta/migrations/v2/atm_084_hook_trigger_fields';
import * as atm_085_base_default_role from '~/meta/migrations/v2/atm_085_base_default_role';
import * as atm_086_dashboards_widgets from '~/meta/migrations/v2/atm_086_dashboards_widgets';
import * as atm_087_widget_error from '~/meta/migrations/v2/atm_087_widget_error';
import * as atm_088_add_sso_client_to_api_tokens from '~/meta/migrations/v2/atm_088_add_sso_client_to_api_tokens';
import * as atm_089_dashboard_sharing from '~/meta/migrations/v2/atm_089_dashboard_sharing';
import * as atm_090_add_is_new_user_to_users from '~/meta/migrations/v2/atm_090_add_is_new_user_to_users';
import * as atm_091_unify_model from '~/meta/migrations/v2/atm_091_unify_model';
import * as atm_092_composite_pk from '~/meta/migrations/v2/atm_092_composite_pk';
import * as atm_093_oauth_server from '~/meta/migrations/v2/atm_093_oauth_server';
import * as atm_094_add_meta_to_filter_exp_v2 from '~/meta/migrations/v2/atm_094_add_meta_to_filter_exp_v2';

import * as atm_096_deprecate_unused from '~/meta/migrations/v2/atm_096_deprecate_unused';
import * as atm_097_unify_schema from '~/meta/migrations/v2/atm_097_unify_schema';
import * as atm_098_default_workspace from '~/meta/migrations/v2/atm_098_default_workspace';

// Create a custom migration source class
export default class XcMigrationSourcev2 {
  // Must return a Promise containing a list of migrations.
  // Migrations can be whatever you want, they will be passed as
  // arguments to getMigrationName and getMigration
  public getMigrations(): Promise<any> {
    // In this run we are just returning migration names
    return Promise.resolve([
      'atm_011',
      'atm_012_alter_column_data_types',
      'atm_013_sync_source',
      'atm_014_alter_column_data_types',
      'atm_015_add_meta_col_in_column_table',
      'atm_016_alter_hooklog_payload_types',
      'atm_017_add_user_token_version_column',
      'atm_018_add_meta_in_view',
      'atm_019_add_meta_in_meta_tables',
      'atm_020_kanban_view',
      'atm_021_add_fields_in_token',
      'atm_022_qr_code_column_type',
      'atm_023_multiple_source',
      'atm_024_barcode_column_type',
      'atm_025_add_row_height',
      'atm_026_map_view',
      'atm_027_add_comparison_sub_op',
      'atm_028_add_enable_scanner_in_form_columns_meta_table',
      'atm_029_webhook',
      'atm_030_add_description_field',
      'atm_031_remove_fk_and_add_idx',
      'atm_033_add_group_by',
      'atm_034_erd_filter_and_notification',
      'atm_035_add_username_to_users',
      'atm_036_base_deleted',
      'atm_037_rename_project_and_base',
      'atm_038_formula_parsed_tree_column',
      'atm_039_sqlite_alter_column_types',
      'atm_040_form_view_alter_column_types',
      'atm_041_calendar_view',
      'atm_042_user_block',
      'atm_043_user_refresh_token',
      'atm_044_view_column_index',
      'atm_045_extensions',
      'atm_046_comment_mentions',
      'atm_047_comment_migration',
      'atm_048_view_links',
      'atm_049_clear_notifications',
      'atm_050_tenant_isolation',
      'atm_051_source_readonly_columns',
      'atm_052_field_aggregation',
      'atm_053_jobs',
      'atm_054_id_length',
      'atm_055_junction_pk',
      'atm_056_integration',
      'atm_057_file_references',
      'atm_058_button_colum',
      'atm_059_invited_by',
      'atm_060_descriptions',
      'atm_061_integration_is_default',
      'atm_062_integration_store',
      'atm_063_form_field_filter',
      'atm_064_pg_minimal_dbs',
      'atm_065_encrypt_flag',
      'atm_066_ai_button',
      'atm_067_personal_view',
      'atm_068_user_delete',
      'atm_069_ai_prompt',
      'atm_070_data_reflection',
      'atm_071_add_meta_in_users',
      'atm_072_col_button_pk',
      'atm_073_file_reference_indexes',
      'atm_074_missing_context_indexes',
      'atm_075_audit_refactor',
      'atm_076_sync_configs',
      'atm_077_column_index_name',
      'atm_078_mcp_tokens',
      'atm_079_cross_base_link',
      'atm_080_sync_mappings',
      'atm_081_audit',
      'atm_082_row_color_conditions',
      'atm_083_permissions',
      'atm_084_hook_trigger_fields',
      'atm_085_base_default_role',
      'atm_086_dashboards_widgets',
      'atm_087_widget_error',
      'atm_088_add_sso_client_to_api_tokens',
      'atm_089_dashboard_sharing',
      'atm_090_add_is_new_user_to_users',
      'atm_091_unify_model',
      'atm_092_composite_pk',
      'atm_093_oauth_server',
      'atm_094_add_meta_to_filter_exp_v2',
      'atm_096_deprecate_unused',
      'atm_097_unify_schema',
      'atm_098_default_workspace',
    ]);
  }

  public getMigrationName(migration): string {
    return migration;
  }

  public getMigration(migration): any {
    switch (migration) {
      case 'atm_011':
        return atm_011;
      case 'atm_012_alter_column_data_types':
        return atm_012_alter_column_data_types;
      case 'atm_013_sync_source':
        return atm_013_sync_source;
      case 'atm_014_alter_column_data_types':
        return atm_014_alter_column_data_types;
      case 'atm_015_add_meta_col_in_column_table':
        return atm_015_add_meta_col_in_column_table;
      case 'atm_016_alter_hooklog_payload_types':
        return atm_016_alter_hooklog_payload_types;
      case 'atm_017_add_user_token_version_column':
        return atm_017_add_user_token_version_column;
      case 'atm_018_add_meta_in_view':
        return atm_018_add_meta_in_view;
      case 'atm_019_add_meta_in_meta_tables':
        return atm_019_add_meta_in_meta_tables;
      case 'atm_020_kanban_view':
        return atm_020_kanban_view;
      case 'atm_021_add_fields_in_token':
        return atm_021_add_fields_in_token;
      case 'atm_022_qr_code_column_type':
        return atm_022_qr_code_column_type;
      case 'atm_023_multiple_source':
        return atm_023_multiple_source;
      case 'atm_024_barcode_column_type':
        return atm_024_barcode_column_type;
      case 'atm_025_add_row_height':
        return atm_025_add_row_height;
      case 'atm_026_map_view':
        return atm_026_map_view;
      case 'atm_027_add_comparison_sub_op':
        return atm_027_add_comparison_sub_op;
      case 'atm_028_add_enable_scanner_in_form_columns_meta_table':
        return atm_028_add_enable_scanner_in_form_columns_meta_table;
      case 'atm_029_webhook':
        return atm_029_webhook;
      case 'atm_030_add_description_field':
        return atm_030_add_description_field;
      case 'atm_031_remove_fk_and_add_idx':
        return atm_031_remove_fk_and_add_idx;
      case 'atm_033_add_group_by':
        return atm_033_add_group_by;
      case 'atm_034_erd_filter_and_notification':
        return atm_034_erd_filter_and_notification;
      case 'atm_035_add_username_to_users':
        return atm_035_add_username_to_users;
      case 'atm_036_base_deleted':
        return atm_036_base_deleted;
      case 'atm_037_rename_project_and_base':
        return atm_037_rename_project_and_base;
      case 'atm_038_formula_parsed_tree_column':
        return atm_038_formula_parsed_tree_column;
      case 'atm_039_sqlite_alter_column_types':
        return atm_039_sqlite_alter_column_types;
      case 'atm_040_form_view_alter_column_types':
        return atm_040_form_view_alter_column_types;
      case 'atm_041_calendar_view':
        return atm_041_calendar_view;
      case 'atm_042_user_block':
        return atm_042_user_block;
      case 'atm_043_user_refresh_token':
        return atm_043_user_refresh_token;
      case 'atm_044_view_column_index':
        return atm_044_view_column_index;
      case 'atm_045_extensions':
        return atm_045_extensions;
      case 'atm_046_comment_mentions':
        return atm_046_comment_mentions;
      case 'atm_047_comment_migration':
        return atm_047_comment_migration;
      case 'atm_048_view_links':
        return atm_048_view_links;
      case 'atm_049_clear_notifications':
        return atm_049_clear_notifications;
      case 'atm_050_tenant_isolation':
        return atm_050_tenant_isolation;
      case 'atm_051_source_readonly_columns':
        return atm_051_source_readonly_columns;
      case 'atm_052_field_aggregation':
        return atm_052_field_aggregation;
      case 'atm_053_jobs':
        return atm_053_jobs;
      case 'atm_054_id_length':
        return atm_054_id_length;
      case 'atm_055_junction_pk':
        return atm_055_junction_pk;
      case 'atm_056_integration':
        return atm_056_integration;
      case 'atm_057_file_references':
        return atm_057_file_references;
      case 'atm_058_button_colum':
        return atm_058_button_colum;
      case 'atm_059_invited_by':
        return atm_059_invited_by;
      case 'atm_060_descriptions':
        return atm_060_descriptions;
      case 'atm_061_integration_is_default':
        return atm_061_integration_is_default;
      case 'atm_062_integration_store':
        return atm_062_integration_store;
      case 'atm_063_form_field_filter':
        return atm_063_form_field_filter;
      case 'atm_064_pg_minimal_dbs':
        return atm_064_pg_minimal_dbs;
      case 'atm_065_encrypt_flag':
        return atm_065_encrypt_flag;
      case 'atm_066_ai_button':
        return atm_066_ai_button;
      case 'atm_067_personal_view':
        return atm_067_personal_view;
      case 'atm_068_user_delete':
        return atm_068_user_delete;
      case 'atm_069_ai_prompt':
        return atm_069_ai_prompt;
      case 'atm_070_data_reflection':
        return atm_070_data_reflection;
      case 'atm_071_add_meta_in_users':
        return atm_071_add_meta_in_users;
      case 'atm_072_col_button_pk':
        return atm_072_col_button_pk;
      case 'atm_073_file_reference_indexes':
        return atm_073_file_reference_indexes;
      case 'atm_074_missing_context_indexes':
        return atm_074_missing_context_indexes;
      case 'atm_075_audit_refactor':
        return atm_075_audit_refactor;
      case 'atm_076_sync_configs':
        return atm_076_sync_configs;
      case 'atm_077_column_index_name':
        return atm_077_column_index_name;
      case 'atm_078_mcp_tokens':
        return atm_078_mcp_tokens;
      case 'atm_079_cross_base_link':
        return atm_079_cross_base_link;
      case 'atm_080_sync_mappings':
        return atm_080_sync_mappings;
      case 'atm_081_audit':
        return atm_081_audit;
      case 'atm_082_row_color_conditions':
        return atm_082_row_color_conditions;
      case 'atm_083_permissions':
        return atm_083_permissions;
      case 'atm_084_hook_trigger_fields':
        return atm_084_hook_trigger_fields;
      case 'atm_085_base_default_role':
        return atm_085_base_default_role;
      case 'atm_086_dashboards_widgets':
        return atm_086_dashboards_widgets;
      case 'atm_087_widget_error':
        return atm_087_widget_error;
      case 'atm_088_add_sso_client_to_api_tokens':
        return atm_088_add_sso_client_to_api_tokens;
      case 'atm_089_dashboard_sharing':
        return atm_089_dashboard_sharing;
      case 'atm_090_add_is_new_user_to_users':
        return atm_090_add_is_new_user_to_users;
      case 'atm_091_unify_model':
        return atm_091_unify_model;
      case 'atm_092_composite_pk':
        return atm_092_composite_pk;
      case 'atm_093_oauth_server':
        return atm_093_oauth_server;
      case 'atm_094_add_meta_to_filter_exp_v2':
        return atm_094_add_meta_to_filter_exp_v2;
      case 'atm_096_deprecate_unused':
        return atm_096_deprecate_unused;
      case 'atm_097_unify_schema':
        return atm_097_unify_schema;
      case 'atm_098_default_workspace':
        return atm_098_default_workspace;
    }
  }
}
