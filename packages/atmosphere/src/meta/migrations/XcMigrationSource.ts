import * as project from './v1/atm_001_init';
import * as m2m from './v1/atm_002_add_m2m';
import * as fkn from './v1/atm_003_add_fkn_column';
import * as viewType from './v1/atm_004_add_view_type_column';
import * as viewName from './v1/atm_005_add_view_name_column';
import * as atm_006_alter_nc_shared_views from './v1/atm_006_alter_nc_shared_views';
import * as atm_007_alter_nc_shared_views_1 from './v1/atm_007_alter_nc_shared_views_1';
import * as atm_008_add_nc_shared_bases from './v1/atm_008_add_nc_shared_bases';
import * as atm_009_add_model_order from './v1/atm_009_add_model_order';
import * as atm_010_add_parent_title_column from './v1/atm_010_add_parent_title_column';
import * as atm_011_remove_old_ses_plugin from './v1/atm_011_remove_old_ses_plugin';
import * as atm_012_cloud_cleanup from './v1/atm_012_cloud_cleanup';

// Create a custom migration source class
export default class XcMigrationSource {
  // Must return a Promise containing a list of migrations.
  // Migrations can be whatever you want, they will be passed as
  // arguments to getMigrationName and getMigration
  public getMigrations(): Promise<any> {
    // In this run we are just returning migration names
    return Promise.resolve([
      'project',
      'm2m',
      'fkn',
      'viewType',
      'viewName',
      'atm_006_alter_nc_shared_views',
      'atm_007_alter_nc_shared_views_1',
      'atm_008_add_nc_shared_bases',
      'atm_009_add_model_order',
      'atm_010_add_parent_title_column',
      'atm_011_remove_old_ses_plugin',
      'atm_012_cloud_cleanup',
    ]);
  }

  public getMigrationName(migration): string {
    return migration;
  }

  public getMigration(migration): any {
    switch (migration) {
      case 'project':
        return project;
      case 'm2m':
        return m2m;
      case 'fkn':
        return fkn;
      case 'viewType':
        return viewType;
      case 'viewName':
        return viewName;
      case 'atm_006_alter_nc_shared_views':
        return atm_006_alter_nc_shared_views;
      case 'atm_007_alter_nc_shared_views_1':
        return atm_007_alter_nc_shared_views_1;
      case 'atm_008_add_nc_shared_bases':
        return atm_008_add_nc_shared_bases;
      case 'atm_009_add_model_order':
        return atm_009_add_model_order;
      case 'atm_010_add_parent_title_column':
        return atm_010_add_parent_title_column;
      case 'atm_011_remove_old_ses_plugin':
        return atm_011_remove_old_ses_plugin;
      case 'atm_012_cloud_cleanup':
        return atm_012_cloud_cleanup;
    }
  }
}
