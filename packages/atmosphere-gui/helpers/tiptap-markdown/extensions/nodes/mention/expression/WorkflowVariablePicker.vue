<script setup lang="ts">
import type { VariableDefinition } from 'atmosphere-sdk'
import { WorkflowNodeCategory } from 'atmosphere-sdk'

interface NodeGroup {
  nodeId: string
  nodeTitle: string
  category: WorkflowNodeCategory
  variables: VariableDefinition[]
}

interface Props {
  items: VariableDefinition[]
  groupedItems?: NodeGroup[]
  command: (attrs: { id: string; label: string; expression: string }) => void
  query?: string
}

const props = withDefaults(defineProps<Props>(), {
  query: '',
  groupedItems: () => [],
})

// State
const selectedNodeIndex = ref(0)

const selectedVariableIndex = ref(0)

const searchQuery = ref(props.query || '')

const navigationStack = ref<{ title: string; variables: VariableDefinition[] }[]>([])

const nodeGroups = computed(() => {
  if (props.groupedItems && props.groupedItems.length > 0) {
    return props.groupedItems
  }

  const groups: Record<string, NodeGroup> = {}

  props.items.forEach((variable: any) => {
    const nodeTitle = variable.extra?.sourceNodeTitle || 'Variables'
    const nodeId = variable.extra?.sourceNodeId || 'default'

    if (!groups[nodeId]) {
      groups[nodeId] = {
        nodeId,
        nodeTitle,
        variables: [],
      }
    }
    groups[nodeId].variables.push(variable)
  })

  return Object.values(groups)
})

const selectedNode = computed(() => {
  if (nodeGroups.value.length === 0) return null
  return nodeGroups.value[selectedNodeIndex.value] || null
})

const currentVariables = computed(() => {
  if (navigationStack.value.length > 0) {
    const node = navigationStack.value[navigationStack.value.length - 1]
    if (node) {
      return node.variables
    }
  }
  return Array.isArray(selectedNode.value?.variables) ? selectedNode.value.variables : []
})

const currentTitle = computed(() => {
  if (navigationStack.value.length > 0) {
    const node = navigationStack.value[navigationStack.value.length - 1]
    if (node) {
      return node.title
    }
  }
  return 'Choose data'
})

const filteredVariables = computed(() => {
  if (!searchQuery.value) {
    return currentVariables.value
  }

  const query = searchQuery.value.toLowerCase()
  return currentVariables.value.filter(
    (v) =>
      v.name.toLowerCase().includes(query) ||
      v.key.toLowerCase().includes(query) ||
      v.extra?.description?.toLowerCase().includes(query),
  )
})

// Group variables by groupKey (fields, meta, iteration, etc.)
const groupedVariables = computed(() => {
  const groups: Record<string, VariableDefinition[]> = {
    fields: [],
    meta: [],
    iteration: [],
    other: [],
  }

  filteredVariables.value.forEach((v) => {
    const groupKey = v.groupKey || 'other'
    if (!groups[groupKey]) {
      groups[groupKey] = []
    }
    groups[groupKey].push(v)
  })

  return groups
})

const hasVariables = computed(() => filteredVariables.value.length > 0)

const groupLabels: Record<string, string> = {
  fields: 'Insert value from field',
  meta: 'System fields',
  iteration: 'Iteration variables',
  other: 'Other',
}

const scrollToSelected = () => {
  nextTick(() => {
    const selectedEl = document.querySelector('.atm-workflow-variable-picker .atm-variable-item.is-selected')
    selectedEl?.scrollIntoView({ block: 'nearest' })
  })
}

const currentParentVariable = ref<VariableDefinition | null>(null)

const navigateInto = (variable: VariableDefinition) => {
  if (variable.children && variable.children.length > 0) {
    navigationStack.value.push({
      title: variable.name,
      variables: variable.children,
    })
    currentParentVariable.value = variable
    selectedVariableIndex.value = 0
    searchQuery.value = ''
  }
}

const goBack = () => {
  if (navigationStack.value.length > 0) {
    navigationStack.value.pop()
    selectedVariableIndex.value = 0
    if (navigationStack.value.length > 0) {
      const parentLevel = navigationStack.value[navigationStack.value.length - 2]
      if (parentLevel) {
        currentParentVariable.value =
          parentLevel.variables.find((v) => v.name === navigationStack.value[navigationStack.value.length - 1].title) || null
      }
    } else {
      currentParentVariable.value = null
    }
  }
}

const upHandler = () => {
  selectedVariableIndex.value = Math.max(0, selectedVariableIndex.value - 1)
  scrollToSelected()
}

const downHandler = () => {
  selectedVariableIndex.value = Math.min(filteredVariables.value.length - 1, selectedVariableIndex.value + 1)
  scrollToSelected()
}

const leftHandler = () => {
  if (navigationStack.value.length > 0) {
    goBack()
  } else {
    selectedNodeIndex.value = Math.max(0, selectedNodeIndex.value - 1)
  }
}

const selectVariable = (variable: VariableDefinition) => {
  const expression = `{{ ${variable.key} }}`

  props.command({
    id: variable.key,
    label: variable.name,
    expression,
  })
}

const rightHandler = () => {
  const variable = filteredVariables.value[selectedVariableIndex.value]
  if (variable?.children && variable.children.length > 0) {
    navigateInto(variable)
  }
}

const enterHandler = () => {
  const variable = filteredVariables.value[selectedVariableIndex.value]
  if (variable) {
    if (variable.children && variable.children.length > 0) {
      navigateInto(variable)
    } else {
      selectVariable(variable)
    }
  }
}

const onKeyDown = ({ event }: { event: KeyboardEvent }) => {
  if (event.key === 'ArrowUp') {
    upHandler()
    return true
  }

  if (event.key === 'ArrowDown') {
    downHandler()
    return true
  }

  if (event.key === 'ArrowLeft') {
    leftHandler()
    return true
  }

  if (event.key === 'ArrowRight') {
    rightHandler()
    return true
  }

  if (event.key === 'Enter') {
    event.stopPropagation()
    enterHandler()
    return true
  }

  if (event.key === 'Escape' && navigationStack.value.length > 0) {
    goBack()
    return true
  }

  return false
}

const selectNode = (index: number) => {
  selectedNodeIndex.value = index
  selectedVariableIndex.value = 0
  navigationStack.value = []
}

const getVariableIcon = (variable: VariableDefinition) => {
  if (variable.extra?.icon) {
    return variable.extra.icon
  }

  if (variable.isArray || variable.type === 'array') {
    return 'cellJson'
  }

  // Type-based icons (fallback)
  switch (variable.type) {
    case 'string':
      return 'cellText'
    case 'number':
    case 'integer':
      return 'cellNumber'
    case 'boolean':
      return 'cellCheckbox'
    case 'datetime':
      return 'cellDatetime'
    case 'object':
      return 'cellJson'
    default:
      return 'cellSystemText'
  }
}

const getNodeIcon = (node: NodeGroup) => {
  const firstVar = node.variables[0]
  if (firstVar?.extra?.nodeIcon) {
    return firstVar.extra.nodeIcon
  }
  return 'ncAutomation'
}

watch(selectedNodeIndex, () => {
  selectedVariableIndex.value = 0
  navigationStack.value = []
  searchQuery.value = ''
})

defineExpose({
  onKeyDown,
})
</script>

<template>
  <div
    class="atm-workflow-variable-picker flex bg-atm-bg-default border-1 border-atm-border-gray-medium rounded-lg shadow-lg overflow-hidden"
    style="width: 560px; max-height: 400px"
    @mousedown.stop
  >
    <div class="atm-variable-picker-nodes w-[220px] border-r border-atm-border-gray-medium flex flex-col">
      <div class="px-3 py-2 text-sm font-semibold text-atm-content-gray-emphasis border-b border-atm-border-gray-light">
        Use data from...
      </div>
      <div class="flex-1 overflow-y-auto atm-scrollbar-thin">
        <div
          v-for="(node, index) in nodeGroups"
          :key="node.nodeId"
          class="atm-node-item flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors"
          :class="{
            'bg-atm-bg-brand-light border-l-2 border-l-atm-border-brand': index === selectedNodeIndex,
            'hover:bg-atm-bg-gray-light': index !== selectedNodeIndex,
          }"
          @click="selectNode(index)"
        >
          <div
            class="w-8 h-8 rounded-md flex items-center justify-center"
            :class="{
              'bg-atm-bg-brand text-atm-content-brand-disabled': [
                WorkflowNodeCategory.TRIGGER,
                WorkflowNodeCategory.ACTION,
              ].includes(node.category),
              'bg-atm-bg-maroon-dark text-atm-content-maroon-dark': node.category === WorkflowNodeCategory.FLOW,
            }"
          >
            <GeneralIcon :icon="getNodeIcon(node)" class="w-4 h-4" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-atm-content-gray-emphasis truncate">{{ node.nodeTitle }}</div>
            <div class="text-xs text-atm-content-gray-muted">{{ node.variables.length }} fields</div>
          </div>
          <GeneralIcon v-if="index === selectedNodeIndex" icon="check" class="w-4 h-4 text-atm-content-brand flex-none" />
        </div>

        <div v-if="nodeGroups.length === 0" class="px-4 py-8 text-center text-atm-content-gray-disabled text-sm">
          No data sources available.<br />
          Run previous steps first.
        </div>
      </div>
    </div>

    <!-- Right Panel: Variable Selection -->
    <div class="atm-variable-picker-variables flex-1 flex flex-col min-w-0">
      <!-- Header with back button and title -->
      <div class="px-3 py-2 border-b border-atm-border-gray-light flex items-center gap-2">
        <AtButton v-if="navigationStack.length > 0" size="xs" type="text" class="!px-1" @click="goBack">
          <GeneralIcon icon="arrowLeft" class="w-4 h-4" />
        </AtButton>
        <span class="text-sm font-semibold text-atm-content-gray-emphasis">{{ currentTitle }}</span>
      </div>

      <!-- Search -->
      <div class="px-3 py-2 border-b border-atm-border-gray-light">
        <a-input v-model:value="searchQuery" placeholder="Search..." class="!rounded-md atm-input-shadow" allow-clear @click.stop>
          <template #prefix>
            <GeneralIcon icon="search" class="text-atm-content-gray-disabled w-4 h-4" />
          </template>
        </a-input>
      </div>

      <!-- Variables List -->
      <div class="flex-1 overflow-y-auto atm-scrollbar-thin">
        <template v-if="hasVariables">
          <!-- Fields Group -->
          <template v-if="groupedVariables.fields?.length">
            <div class="px-3 pt-3 pb-1 text-xs font-semibold text-atm-content-gray-muted uppercase tracking-wide">
              {{ groupLabels.fields }}
            </div>
            <div
              v-for="variable in groupedVariables.fields"
              :key="variable.key"
              class="atm-variable-item flex items-center gap-2 px-3 py-2 mx-2 rounded-md transition-colors"
              :class="{
                'is-selected bg-atm-bg-gray-light': filteredVariables.indexOf(variable) === selectedVariableIndex,
                'hover:bg-atm-bg-gray-extralight': filteredVariables.indexOf(variable) !== selectedVariableIndex,
              }"
            >
              <div
                class="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                @click="variable.children?.length ? navigateInto(variable) : selectVariable(variable)"
              >
                <div class="w-7 h-7 rounded flex items-center justify-center bg-atm-bg-gray-medium">
                  <GeneralIcon :icon="getVariableIcon(variable)" class="w-4 h-4" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-atm-content-gray-emphasis truncate">{{ variable.name }}</div>
                  <div v-if="variable?.extra?.description" class="text-xs text-atm-content-gray-disabled truncate">
                    {{ variable.extra.description }}
                  </div>
                </div>
              </div>
              <AtButton size="xs" type="secondary" class="flex-none" @click.stop="selectVariable(variable)">
                {{ $t('labels.select') }}
              </AtButton>
            </div>
          </template>

          <!-- Iteration Group -->
          <template v-if="groupedVariables.iteration?.length">
            <div class="px-3 pt-3 pb-1 text-xs font-semibold text-atm-content-gray-muted uppercase tracking-wide">
              {{ groupLabels.iteration }}
            </div>
            <div
              v-for="variable in groupedVariables.iteration"
              :key="variable.key"
              class="atm-variable-item flex items-center gap-2 px-3 py-2 mx-2 rounded-md transition-colors"
              :class="{
                'is-selected bg-atm-bg-gray-light': filteredVariables.indexOf(variable) === selectedVariableIndex,
                'hover:bg-atm-bg-gray-extralight': filteredVariables.indexOf(variable) !== selectedVariableIndex,
              }"
            >
              <div
                class="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                @click="variable.children?.length ? navigateInto(variable) : selectVariable(variable)"
              >
                <div class="w-7 h-7 rounded flex items-center justify-center bg-atm-bg-gray-medium">
                  <GeneralIcon :icon="getVariableIcon(variable)" class="w-4 h-4 text-atm-content-gray-subtle" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-atm-content-gray-emphasis truncate">{{ variable.name }}</div>
                  <div v-if="variable?.extra?.description" class="text-xs text-atm-content-gray-disabled truncate">
                    {{ variable.extra.description }}
                  </div>
                </div>
              </div>
              <AtButton size="xs" type="secondary" class="flex-none" @click.stop="selectVariable(variable)">
                {{ $t('labels.select') }}
              </AtButton>
            </div>
          </template>

          <template v-if="groupedVariables.meta?.length">
            <div class="px-3 pt-3 pb-1 text-xs font-semibold text-atm-content-gray-muted uppercase tracking-wide">
              {{ groupLabels.meta }}
            </div>
            <div
              v-for="variable in groupedVariables.meta"
              :key="variable.key"
              class="atm-variable-item flex items-center gap-2 px-3 py-2 mx-2 rounded-md transition-colors"
              :class="{
                'is-selected bg-atm-bg-gray-light': filteredVariables.indexOf(variable) === selectedVariableIndex,
                'hover:bg-atm-bg-gray-extralight': filteredVariables.indexOf(variable) !== selectedVariableIndex,
              }"
            >
              <div
                class="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                @click="variable.children?.length ? navigateInto(variable) : selectVariable(variable)"
              >
                <div class="w-7 h-7 rounded flex items-center justify-center bg-atm-bg-gray-medium">
                  <GeneralIcon :icon="getVariableIcon(variable)" class="w-4 h-4 text-atm-content-gray-subtle" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-atm-content-gray-emphasis truncate">{{ variable.name }}</div>
                  <div v-if="variable.extra?.description" class="text-xs text-atm-content-gray-disabled truncate">
                    {{ variable.extra.description }}
                  </div>
                </div>
              </div>
              <AtButton size="xs" type="secondary" class="flex-none" @click.stop="selectVariable(variable)">
                {{ $t('labels.select') }}
              </AtButton>
            </div>
          </template>

          <template v-if="groupedVariables.other?.length">
            <div class="px-3 pt-3 pb-1 text-xs font-semibold text-atm-content-gray-muted uppercase tracking-wide">
              {{ groupLabels.other }}
            </div>
            <div
              v-for="variable in groupedVariables.other"
              :key="variable.key"
              class="atm-variable-item flex items-center gap-2 px-3 py-2 mx-2 rounded-md transition-colors"
              :class="{
                'is-selected bg-atm-bg-gray-light': filteredVariables.indexOf(variable) === selectedVariableIndex,
                'hover:bg-atm-bg-gray-extralight': filteredVariables.indexOf(variable) !== selectedVariableIndex,
              }"
            >
              <div
                class="flex items-center gap-2 flex-1 min-w-0 cursor-pointer"
                @click="variable.children?.length ? navigateInto(variable) : selectVariable(variable)"
              >
                <div class="w-7 h-7 rounded flex items-center justify-center bg-atm-bg-gray-medium">
                  <GeneralIcon :icon="getVariableIcon(variable)" class="w-4 h-4 text-atm-content-gray-subtle" />
                </div>
                <div class="flex-1 min-w-0">
                  <div class="text-sm font-medium text-atm-content-gray-emphasis truncate">{{ variable.name }}</div>
                  <div v-if="variable.extra?.description" class="text-xs text-atm-content-gray-disabled truncate">
                    {{ variable.extra.description }}
                  </div>
                </div>
              </div>
              <AtButton size="xs" type="secondary" class="flex-none" @click.stop="selectVariable(variable)">
                {{ $t('labels.select') }}
              </AtButton>
            </div>
          </template>
        </template>

        <div v-else class="px-4 py-8 text-center text-atm-content-gray-disabled text-sm">
          {{ searchQuery ? 'No variables found' : 'Select a data source' }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.atm-workflow-variable-picker {
  @apply select-none;
}

.atm-node-item {
  &:first-child {
    @apply mt-1;
  }
  &:last-child {
    @apply mb-1;
  }
}

.atm-variable-item {
  &:last-child {
    @apply mb-2;
  }
}
</style>
