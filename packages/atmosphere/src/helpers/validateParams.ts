import { AtError } from './ncError';
import type { AtApiVersion } from 'atmosphere-sdk';

export default function validateParams(
  props: string[],
  body: any,
  option?: {
    api_version?: AtApiVersion;
  },
) {
  for (const prop of props) {
    if (!(prop in body)) {
      AtError.get({ api_version: option?.api_version }).invalidRequestBody(
        `Missing '${prop}' property in request body`,
      );
    }
  }
}
