export const whereStatement = (
  params: {
    [k: string]: string | undefined;
  },
  likeParams: {
    [k: string]: string | undefined;
  }
): string => {
  let whereQuery: string[] = [];
  for (let key in params) {
    params[key] !== undefined && params[key] !== ""
      ? whereQuery.push(`payload->>'${key}' = '${params[key]}'`)
      : null;
  }
  for (let k in likeParams) {
    likeParams[k] !== undefined && likeParams[k] !== ""
      ? whereQuery.push(
          `payload->>'${k}' ILIKE '${likeParams[k]?.replace(/\*/g, "%")}'`
        )
      : null;
  }

  return whereQuery.length ? "WHERE " + whereQuery.join(" AND ") : "";
};