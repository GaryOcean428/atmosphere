export const useInterfacePermissions = createSharedComposable(() => {
  const isInterfaceOnlyUser = computed(() => false)

  const maybeNavigateToInterfaceOnlyBase = async (_base: AtProject) => false

  const navigateToBaseInterface = (_base: AtProject) => {}

  const isInterfacesUiEnabled = computed(() => false)

  const baseOpensInterfaceByDefault = (_base?: AtProject | null) => false

  const baseHasRealRole = (_base?: AtProject | null) => false

  return {
    isInterfaceOnlyUser,
    maybeNavigateToInterfaceOnlyBase,
    navigateToBaseInterface,
    isInterfacesUiEnabled,
    baseOpensInterfaceByDefault,
    baseHasRealRole,
  }
})
