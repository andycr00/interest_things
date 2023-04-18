export const whereStatement = (
  params: {
    [k: string]: string | undefined;
  },
  likeParams: {
    [k: string]: string | undefined;
  }
): { [k: string]: any } => {
  const values: { [k: string]: any } = {};
  for (const i in params) {
    if (params[i] !== undefined && params[i] !== "") values[i] = params[i];
  }

  for (const i in likeParams) {
    if (likeParams[i] !== undefined && likeParams[i] !== "")
      values[i] = { [Op.iLike]: likeParams[i]?.replace(/\*/g, "%") };
  }

  return values;
};