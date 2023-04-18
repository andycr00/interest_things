// complete Object based on specific propertie, merging his attributes

import * as _ from "lodash";

export default function fallback(obj: { [k: string]: any }): any {
  for (let key in obj) {
    if (typeof obj[key] !== "object") continue;
    const defaultFallback = Object.keys(obj[key]).find((val) =>
      val.includes("[all]")
    );

    if (!defaultFallback) {
      fallback(obj[key]);
      continue;
    }

    for (let i in obj[key]) {
      if (!validateObjectName(defaultFallback.replace("[all]", ""), i))
        continue;
      if (i.includes("[all]")) continue;
      const defaultFallbackValue = JSON.parse(
        JSON.stringify(obj[key][defaultFallback])
      );
      const toComplete = JSON.parse(JSON.stringify(obj[key][i]));

      obj[key][i] = _.merge(defaultFallbackValue, toComplete);
    }
    fallback(obj[key]);
  }

  return obj;
}

const validateObjectName = (name: string, variable: string) => {
  return name == variable.match(/[A-Za-z0-9]+/)?.toString();
};
