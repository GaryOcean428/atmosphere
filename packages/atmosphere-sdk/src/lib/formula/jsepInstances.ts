import jsep from 'atm-jsep';
import template from 'atm-jsep-plugin-template';
import object from 'atm-jsep-plugin-object';
import ternary from 'atm-jsep-plugin-ternary';
import arrow from 'atm-jsep-plugin-arrow';
import { jsepCurlyHook, jsepIndexHook } from './hooks';

// Formula jsep instance - with curly hook only
export const formulaJsep = jsep.instance();
formulaJsep.defaultConfig();
formulaJsep.plugins.register(jsepCurlyHook);

// Formula jsep instance with position tracking - with curly hook and index hook
export const formulaJsepWithIndex = jsep.instance();
formulaJsepWithIndex.defaultConfig();
formulaJsepWithIndex.plugins.register(jsepCurlyHook, jsepIndexHook);

// Workflow jsep instance - with template, object, ternary plugins
export const workflowJsep = jsep.instance();
workflowJsep.defaultConfig();
workflowJsep.plugins.register(template, object, ternary, arrow);
