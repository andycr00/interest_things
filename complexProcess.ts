export const create = async (req: Request, res: Response) => {

  const seq = await sequelize();
  const t = await seq!.transaction();
  try {
    const identities = {
      given_name: firstName,
      family_name: surnames,
      middle_name: middleName,
      connection_id: connectionId,
    };

    const user = await createUser(
      identities,
      { email: validatedEmail, username, password: passwordHash, enabled },
      t
    );

    if (scopes && _.isArray(scopes) && scopes.length > 0) {
      const claims: string[] = [];
      scopes
        .filter((scope) => scope.claims?.filter((claim: ClaimDTO) => claim.id))
        .map((scope) =>
          scope.claims?.map((claim: ClaimDTO) => claims.push(claim.id))
        );

      await validateClaimsBelongsScopes(scopes);

      await deleteUserScopes(scopes, user, t);

      await validateScopesExists(scopes, t);

      await validateClaimExists(claims, t);

      const userScopeIds = await createScopes(scopes, user.id, t);

      await deleteUserClaims(claims, userScopeIds, t);
    }

    await t.commit();
    return res.status(200).json({ status: "SUCCESS", value: user.id });
  } catch (error) {
    await t.rollback();
    LOGGER.error(JSON.stringify(error, null, 2));
    if (error instanceof Error) {
      return res
        .status(500)
        .json(
          validator.responseError("An error ocurred while creating User", [
            "User creation",
          ])
        );
    }
    return res.status(409).json(error);
  }
};

const createUser = async (
  identities: {
    given_name: string;
    family_name: string;
    middle_name: string;
    connection_id: string;
  },
  values: {
    email: string;
    username: string;
    password: string;
    enabled: boolean;
  },
  transaction: any
) => {
  if (!values.username) values.username = values.email.split("@")[0];

  const [createUser] = await User.upsert(
    { ...values, identities: [{ ...identities }] },
    {
      transaction,
      fields: ["identities", "password", "enabled"],
      conflictFields: ["email"],
    }
  );

  return createUser;
};

const deleteUserScopes = async (
  scopes: ScopeDTO[],
  user: User,
  transaction: any
) => {
  const deleteUserScopes = scopes
    .filter((scope: ScopeDTO) => scope.id)
    .map((scope: ScopeDTO) => scope.id);

  await UserScope.destroy({
    where: { userId: user.id, scopeId: { [Op.notIn]: deleteUserScopes } },
    transaction,
  });
};

const validateScopesExists = async (scopes: ScopeDTO[], transaction: any) => {
  const scopeIds = scopes.map((scope) => scope.id);

  const scope = await Scope.findAll({
    where: { id: { [Op.in]: scopeIds } },
    transaction,
  });

  if (scope.length !== scopeIds.length) {
    const validScopeIds = scope.map((scp) => scp.id);
    const invalid = scopeIds.filter((x) => !validScopeIds.includes(x));
    throw validator.responseError("Scopes sent does not exists", invalid);
  }
};

const createScopes = async (
  scopes: ScopeDTO[],
  userId: string,
  transaction: any
) => {
  const userScopeIds: string[] = [];
  for (let i = 0; i < scopes.length; i++) {
    const scope = scopes[i];
    const [userScope] = await UserScope.upsert(
      { scopeId: scope.id, userId },
      { conflictFields: ["scopeId", "userId"], transaction }
    );

    userScopeIds.push(userScope.id);

    if (!scope.claims) continue;

    await createUserClaims(scope.claims, userScope.id, transaction);
  }

  return userScopeIds;
};

const deleteUserClaims = async (
  claims: string[],
  userScopeIds: string[],
  transaction: any
) => {
  for (let i = 0; i < userScopeIds.length; i++) {
    const userScopeId = userScopeIds[i];

    await UserClaim.destroy({
      where: { userScopeId, claimId: { [Op.notIn]: claims } },
      transaction,
    });
  }
};

const createUserClaims = async (
  claims: any[],
  userScopeId: string,
  transaction: any
) => {
  for (let i = 0; i < claims.length; i++) {
    const claim = claims[i];
    await UserClaim.upsert(
      { claimId: claim.id, userScopeId, value: { value: claim.values } },
      { conflictFields: ["claimId", "userScopeId"], transaction }
    );
  }
};

const validateClaimExists = async (claims: string[], transaction: any) => {
  const claim = await Claim.findAll({
    where: { id: { [Op.in]: claims } },
    transaction,
  });

  if (claim.length !== claims.length) {
    const validClaimIds = claim.map((clm) => clm.id);
    const invalid = claims.filter((x) => !validClaimIds.includes(x));
    throw validator.responseError("Claims sent does not exists", invalid);
  }
};

const validateClaimsBelongsScopes = async (scopes: ScopeDTO[]) => {
  for (let i = 0; i < scopes.length; i++) {
    const scope = scopes[i];

    const claims = scope.claims
      ?.filter((claim) => claim.id)
      .map((claim) => claim.id);

    const scp = await Claim.count({ where: { scopeId: scope.id, id: claims } });

    if (claims?.length !== scp)
      throw validator.responseError(
        `Claims not associated to Scope: ${scope.id}`,
        ["Claims"]
      );
  }
};
