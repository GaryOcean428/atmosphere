<script lang="ts" setup>
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { type GeoLocationType, convertGeoNumberToString, latLongToJoinedString } from 'atmosphere-sdk'
import { useDebounceFn } from '@vueuse/core'

interface Props {
  modelValue?: string | null
}

interface Emits {
  (event: 'update:modelValue', model: GeoLocationType): void
}

const props = defineProps<Props>()

const emits = defineEmits<Emits>()

const column = inject(ColumnInj)

const { tileUrl, attribution } = useMapConfig()

const vModel = useVModel(props, 'modelValue', emits)

const activeCell = inject(ActiveCellInj, ref(false))

const isPublic = inject(IsPublicInj, ref(false))

const readonly = inject(ReadonlyInj, ref(false))

const isLinkRecordDropdown = inject(IsLinkRecordDropdownInj, ref(false))

const isExpanded = ref(false)

const isLoading = ref(false)

// --- Map picker state ---
const mapContainerRef = ref<HTMLElement>()
const mapInstanceRef = ref<L.Map>()
const markerRef = ref<L.Marker>()
const isUpdatingFromMap = ref(false)

const DEFAULT_CENTER: [number, number] = [20, 0]
const DEFAULT_ZOOM = 2
const LOCATION_ZOOM = 15
const AUTO_POSITION_ZOOM = 10

const [latitude, longitude] = (vModel.value || '').split(';')

const formState = reactive({
  latitude,
  longitude,
})

function syncToFormState(lat: number, lng: number) {
  isUpdatingFromMap.value = true
  formState.latitude = convertGeoNumberToString(lat)
  formState.longitude = convertGeoNumberToString(lng)
  nextTick(() => {
    isUpdatingFromMap.value = false
  })
}

function setupMarkerDrag(marker: L.Marker) {
  marker.on('dragend', () => {
    const pos = marker.getLatLng()
    syncToFormState(pos.lat, pos.lng)
  })
}

function updateMarkerPosition(lat: number, lng: number) {
  if (!mapInstanceRef.value) return
  if (markerRef.value) {
    markerRef.value.setLatLng([lat, lng])
  } else {
    const marker = L.marker([lat, lng], { draggable: !readonly.value }).addTo(mapInstanceRef.value)
    setupMarkerDrag(marker)
    markerRef.value = marker
  }
}

function onMapClick(e: L.LeafletMouseEvent) {
  if (readonly.value) return
  const { lat, lng } = e.latlng
  updateMarkerPosition(lat, lng)
  syncToFormState(lat, lng)
}

function initMap() {
  if (!mapContainerRef.value || mapInstanceRef.value) return

  const hasCoords = formState.latitude && formState.longitude
  const lat = parseFloat(formState.latitude)
  const lng = parseFloat(formState.longitude)
  const validCoords = hasCoords && !isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180
  const center: [number, number] = validCoords ? [lat, lng] : DEFAULT_CENTER
  const zoom = validCoords ? LOCATION_ZOOM : DEFAULT_ZOOM

  const map = L.map(mapContainerRef.value, {
    center,
    zoom,
    zoomControl: false,
    attributionControl: true,
  })

  L.control.zoom({ position: 'bottomleft' }).addTo(map)

  L.tileLayer(tileUrl.value, {
    maxZoom: 19,
    attribution: attribution.value,
  }).addTo(map)

  if (validCoords) {
    const marker = L.marker(center, { draggable: !readonly.value }).addTo(map)
    setupMarkerDrag(marker)
    markerRef.value = marker
  } else {
    // No saved coordinates - try auto-positioning with geolocation
    tryAutoPositionMap()
  }

  map.on('click', onMapClick)
  mapInstanceRef.value = map
}

function tryAutoPositionMap() {
  if (!navigator.geolocation) return

  const onSuccess: PositionCallback = (position: GeolocationPosition) => {
    // Guard: only update if map still exists (user might have closed overlay)
    if (!mapInstanceRef.value) return

    const { latitude, longitude } = position.coords
    mapInstanceRef.value.setView([latitude, longitude], AUTO_POSITION_ZOOM)
  }

  const onError: PositionErrorCallback = (err: GeolocationPositionError) => {
    // Silent failure - common for denied permissions
    console.debug(`Geolocation auto-position skipped: ${err.code}`)
  }

  const options: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 2000,
  }

  navigator.geolocation.getCurrentPosition(onSuccess, onError, options)
}

function destroyMap() {
  if (mapInstanceRef.value) {
    mapInstanceRef.value.remove()
    mapInstanceRef.value = undefined
    markerRef.value = undefined
  }
}

// --- Geocoding search (Nominatim / OpenStreetMap) ---
interface NominatimResult {
  place_id: number
  lat: string
  lon: string
  display_name: string
  type: string
}

const searchQuery = ref('')
const searchResults = ref<NominatimResult[]>([])
const isSearching = ref(false)
const showSearchResults = ref(false)
const searchInputRef = ref<HTMLInputElement>()

const NOMINATIM_API = 'https://nominatim.openstreetmap.org/search'

let searchAbortController: AbortController | null = null
let searchBlurTimer: ReturnType<typeof setTimeout> | null = null
let copyTooltipTimer: ReturnType<typeof setTimeout> | null = null

const performSearch = useDebounceFn(async () => {
  const query = searchQuery.value.trim()
  if (query.length < 3) {
    searchResults.value = []
    showSearchResults.value = false
    return
  }

  // Abort any in-flight request
  searchAbortController?.abort()
  searchAbortController = new AbortController()

  isSearching.value = true
  try {
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      limit: '5',
      addressdetails: '0',
    })

    const response = await fetch(`${NOMINATIM_API}?${params.toString()}`, {
      headers: {
        'Accept-Language': navigator.language || 'en',
      },
      signal: searchAbortController.signal,
    })

    if (!response.ok) throw new Error('Geocoding request failed')

    const data: NominatimResult[] = await response.json()
    searchResults.value = data
    showSearchResults.value = data.length > 0
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === 'AbortError') return
    console.error('Geocoding error:', err)
    searchResults.value = []
    showSearchResults.value = false
  } finally {
    isSearching.value = false
  }
}, 400)

function selectSearchResult(result: NominatimResult) {
  const lat = parseFloat(result.lat)
  const lng = parseFloat(result.lon)

  // Update form state
  syncToFormState(lat, lng)

  // Update map
  updateMarkerPosition(lat, lng)
  mapInstanceRef.value?.setView([lat, lng], LOCATION_ZOOM)

  // Clear search
  searchQuery.value = result.display_name
  showSearchResults.value = false
}

function onSearchKeydown(e: KeyboardEvent) {
  // Prevent overlay from closing on Escape when search has results
  if (e.key === 'Escape' && showSearchResults.value) {
    e.stopPropagation()
    showSearchResults.value = false
    return
  }
  // Prevent form submission on Enter in search
  if (e.key === 'Enter') {
    e.preventDefault()
    e.stopPropagation()
  }
}

function onSearchBlur() {
  // Delay hiding to allow click on result
  if (searchBlurTimer) clearTimeout(searchBlurTimer)
  searchBlurTimer = setTimeout(() => {
    showSearchResults.value = false
  }, 200)
}

watch(searchQuery, () => {
  if (searchQuery.value.trim().length >= 3) {
    performSearch()
  } else {
    searchResults.value = []
    showSearchResults.value = false
  }
})

// Debounced sync: input fields -> map
const syncMapFromInputs = useDebounceFn(() => {
  if (isUpdatingFromMap.value || !mapInstanceRef.value) return

  const lat = parseFloat(formState.latitude)
  const lng = parseFloat(formState.longitude)
  if (isNaN(lat) || isNaN(lng)) return
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return

  updateMarkerPosition(lat, lng)
  mapInstanceRef.value.setView([lat, lng], Math.max(mapInstanceRef.value.getZoom(), LOCATION_ZOOM))
}, 500)

const identifier = {
  latitude: `atm-geo-lat-${Math.random().toString(36).substring(2, 10)}`,
  longitude: `atm-geo-lng-${Math.random().toString(36).substring(2, 10)}`,
}

const isLocationSet = computed(() => {
  return !!vModel.value
})

const { t } = useI18n()

const latLongStr = computed(() => {
  const [lat, lng] = (vModel.value || '').split(';')
  return lat && lng ? `${lat}; ${lng}` : t('labels.setLocation')
})

const isLatitudeInvalid = computed(() => {
  if (!formState.latitude) return false
  const lat = parseFloat(formState.latitude)
  return isNaN(lat) || lat < -90 || lat > 90
})

const isLongitudeInvalid = computed(() => {
  if (!formState.longitude) return false
  const lng = parseFloat(formState.longitude)
  return isNaN(lng) || lng < -180 || lng > 180
})

const handleFinish = () => {
  if (isLatitudeInvalid.value || isLongitudeInvalid.value) return
  vModel.value = latLongToJoinedString(parseFloat(formState.latitude), parseFloat(formState.longitude))
  isExpanded.value = false
}

const clear = () => {
  isExpanded.value = false

  formState.latitude = latitude
  formState.longitude = longitude
}

const clearValue = () => {
  vModel.value = null
  formState.latitude = ''
  formState.longitude = ''
  isExpanded.value = false
}

const onClickSetCurrentLocation = () => {
  isLoading.value = true
  const onSuccess: PositionCallback = (position: GeolocationPosition) => {
    const crd = position.coords
    formState.latitude = `${convertGeoNumberToString(crd.latitude)}`
    formState.longitude = `${convertGeoNumberToString(crd.longitude)}`
    isLoading.value = false
  }

  const onError: PositionErrorCallback = (err: GeolocationPositionError) => {
    console.error(`ERROR(${err.code}): ${err.message}`)
    isLoading.value = false
  }

  const options = {
    enableHighAccuracy: true,
    timeout: 20000,
    maximumAge: 2000,
  }
  navigator.geolocation.getCurrentPosition(onSuccess, onError, options)
}

const openInGoogleMaps = () => {
  const [latitude, longitude] = (vModel.value || '').split(';')
  if (!latitude || !longitude) return
  const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(latitude)},${encodeURIComponent(longitude)}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

const openInOSM = () => {
  const [latitude, longitude] = (vModel.value || '').split(';')
  if (!latitude || !longitude) return
  const url = `https://www.openstreetmap.org/?mlat=${encodeURIComponent(latitude)}&mlon=${encodeURIComponent(
    longitude,
  )}#map=15/${latitude}/${longitude}`
  window.open(url, '_blank', 'noopener,noreferrer')
}

const handleClose = (e: MouseEvent) => {
  if (e.target instanceof HTMLElement && !e.target.closest('.atm-geodata-picker-overlay')) {
    isExpanded.value = false
  }
}

useEventListener(document, 'click', handleClose, true)

/**
 * Parse a pasted string into "lat;lng" format.
 * Accepts: "lat;lng", "lat,lng", "lat, lng", or "lat lng"
 * Returns the normalised "lat;lng" string, or null if unparseable.
 */
function parseGeoString(raw: string): string | null {
  const trimmed = raw.trim()

  // Try convertCellData first (handles Atmosphere internal formats) — but only when column metadata is available
  if (column?.value?.uidt) {
    try {
      const converted = convertCellData({ value: trimmed, to: column.value.uidt, column: column.value }, false)
      if (converted) return converted
    } catch {
      // fall through to manual parsing
    }
  }

  // Manual parsing: split on ; or , or whitespace
  const parts = trimmed.split(/[;,\s]+/).filter(Boolean)
  if (parts.length === 2) {
    const lat = parseFloat(parts[0])
    const lng = parseFloat(parts[1])
    if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return `${convertGeoNumberToString(lat)};${convertGeoNumberToString(lng)}`
    }
  }
  return null
}

const isUnderLookup = inject(IsUnderLookupInj, ref(false))
const isCanvasInjected = inject(IsCanvasInjectionInj, false)
const isExpandedForm = inject(IsExpandedFormOpenInj, ref(false))
const isGrid = inject(IsGridInj, ref(false))
const isEditColumn = inject(EditColumnInj, ref(false))
const isForm = inject(IsFormInj, ref(false))

const handlePaste = (e: ClipboardEvent) => {
  if ([identifier.latitude, identifier.longitude].includes(e.target?.id)) {
    return
  }
  const clipboardData = e.clipboardData?.getData('text/plain') || ''
  if (!clipboardData) return

  // Allow paste both when overlay is open AND when in expanded form (overlay may be closed)
  if (isExpanded.value || isExpandedForm.value) {
    const value = parseGeoString(clipboardData)
    if (value) {
      const pastedLat = value.split(';')[0]
      const pastedLng = value.split(';')[1]
      formState.latitude = pastedLat
      formState.longitude = pastedLng

      // In expanded form with overlay closed, commit directly
      if (isExpandedForm.value && !isExpanded.value) {
        e.preventDefault()
        vModel.value = latLongToJoinedString(parseFloat(pastedLat), parseFloat(pastedLng))
      }
    }
  }
}

const handleBlur = (e: Event) => {
  const target = e.target as HTMLInputElement
  const originalValue = target.value
  const value = convertGeoNumberToString(Number(originalValue))
  if (value !== originalValue) {
    if (target.id === identifier.latitude) {
      formState.latitude = value
    } else if (target.id === identifier.longitude) {
      formState.longitude = value
    }
  }
}

onMounted(() => {
  if (!isUnderLookup.value && isCanvasInjected && !isExpandedForm.value && isGrid.value && !isEditColumn.value) {
    forcedNextTick(() => {
      isExpanded.value = true
    })
  }
})

watch(
  () => vModel,
  (newValue) => {
    if (newValue.value) {
      formState.latitude = newValue.value?.split(';')[0]
      formState.longitude = newValue.value?.split(';')[1]
    } else {
      formState.latitude = ''
      formState.longitude = ''
    }
  },
)

const isCopied = ref(false)

const copyCoordinates = (e: Event) => {
  e.stopPropagation()
  const text = latLongStr.value
  if (text && text !== t('labels.setLocation')) {
    navigator.clipboard.writeText(text).then(() => {
      isCopied.value = true
      if (copyTooltipTimer) clearTimeout(copyTooltipTimer)
      copyTooltipTimer = setTimeout(() => {
        isCopied.value = false
      }, 2000)
    })
  }
}

const openEditor = (e: Event) => {
  e.stopPropagation()
  if (!readonly.value) {
    isExpanded.value = true
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  // Allow copy shortcuts to pass through
  if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
    return
  }

  if (e.key === 'Escape' && isExpanded.value) {
    e.preventDefault()
    e.stopImmediatePropagation()
    isExpanded.value = false
  }

  if (e.key === 'Enter') {
    e.preventDefault()
    if (readonly.value) {
      return
    }
    isExpanded.value = !isExpanded.value
  }
}

// --- Map lifecycle: init when overlay opens, destroy when it closes ---
watch(isExpanded, async (expanded) => {
  if (expanded) {
    await nextTick()
    // Leaflet needs the container to be fully rendered and sized
    setTimeout(() => {
      initMap()
      mapInstanceRef.value?.invalidateSize()
    }, 150)
  } else {
    destroyMap()
  }
})

// --- Bidirectional sync: input fields -> map (debounced) ---
watch(
  () => [formState.latitude, formState.longitude],
  () => {
    syncMapFromInputs()
  },
)

// --- Cleanup on unmount ---
onBeforeUnmount(() => {
  destroyMap()
  searchAbortController?.abort()
  if (searchBlurTimer) clearTimeout(searchBlurTimer)
  if (copyTooltipTimer) clearTimeout(copyTooltipTimer)
})
</script>

<template>
  <div tabindex="0" class="focus:outline-none focus-visible:outline-none" @paste="handlePaste" @keydown="handleKeyDown">
    <AtDropdown v-model:visible="isExpanded" :disabled="readonly" overlay-class-name="atm-geodata-overlay-dropdown">
      <div
        v-if="!isLocationSet"
        :class="{
          '!justify-start !ml-0 ': isExpandedForm || isForm,
          'mt-0.5': isForm && !isPublic,
          '!-mt-0.25': isForm && isPublic,
        }"
        class="w-full flex justify-center max-w-64 mx-auto"
      >
        <AtButton
          v-if="(activeCell && !readonly) || isForm || isEditColumn"
          size="xsmall"
          type="secondary"
          data-testid="atm-geo-data-set-location-button"
        >
          <div class="flex items-center px-2 gap-2">
            <GeneralIcon class="text-atm-content-gray-muted h-3.5 w-3.5" icon="ncMapPin" />
            <span class="text-tiny">
              {{ latLongStr }}
            </span>
          </div>
        </AtButton>
      </div>

      <div
        v-else
        data-testid="atm-geo-data-lat-long-set"
        tabindex="1"
        :class="{
          '!py-1': !isForm,
          'pt-1': isForm && !isPublic,
        }"
        class="atm-cell-field h-full w-full flex items-center focus-visible:!outline-none focus:!outline-none whitespace-nowrap truncate"
      >
        <!-- Expanded form: selectable text with copy + edit buttons -->
        <template v-if="isExpandedForm">
          <span class="atm-geodata-selectable-text" @click.stop>{{ latLongStr }}</span>
          <div v-if="!isLinkRecordDropdown" class="atm-geodata-action-icons" @click.stop>
            <AtTooltip>
              <template #title>{{ isCopied ? $t('general.copied') : $t('general.copy') }}</template>
              <GeneralIcon
                :icon="isCopied ? 'check' : 'copy'"
                class="atm-geodata-action-icon"
                :class="{ '!text-green-600': isCopied }"
                :aria-label="isCopied ? $t('general.copied') : $t('general.copy')"
                role="button"
                tabindex="0"
                @click="copyCoordinates"
                @keydown.enter="copyCoordinates"
              />
            </AtTooltip>
            <AtTooltip v-if="!readonly">
              <template #title>{{ $t('general.edit') }}</template>
              <GeneralIcon
                icon="ncEdit"
                class="atm-geodata-action-icon"
                :aria-label="$t('general.edit')"
                role="button"
                tabindex="0"
                @click="openEditor"
                @keydown.enter="openEditor"
              />
            </AtTooltip>
          </div>
        </template>
        <!-- Grid view: click anywhere to open editor (existing behavior) -->
        <template v-else>
          {{ latLongStr }}
        </template>
      </div>
      <template #overlay>
        <div class="atm-geodata-picker-overlay" @click.stop @paste="handlePaste">
          <a-form :model="formState" class="atm-geodata-form" @finish="handleFinish">
            <!-- Modal content area -->
            <div class="atm-geodata-content">
              <!-- Coordinates section -->
              <div class="atm-geodata-section-label">{{ $t('labels.coordinates') }}</div>
              <div class="atm-geodata-coordinates-grid">
                <div class="atm-geodata-input-group">
                  <label :for="identifier.latitude" class="atm-geodata-input-label">{{ $t('labels.latitude') }}</label>
                  <a-input
                    :id="identifier.latitude"
                    v-model:value="formState.latitude"
                    data-testid="atm-geo-data-latitude"
                    type="number"
                    step="0.0000000001"
                    class="atm-geodata-input-field"
                    :placeholder="t('labels.enterLatitude')"
                    :min="-90"
                    :disabled="readonly"
                    required
                    :max="90"
                    :status="isLatitudeInvalid ? 'error' : ''"
                    @blur="handleBlur"
                    @keydown.stop
                    @selectstart.capture.stop
                    @mousedown.stop
                  />
                  <span v-if="isLatitudeInvalid" class="atm-geodata-error-text">{{ t('msg.error.latitudeRange') }}</span>
                </div>

                <div class="atm-geodata-input-group">
                  <label :for="identifier.longitude" class="atm-geodata-input-label">{{ $t('labels.longitude') }}</label>
                  <a-input
                    :id="identifier.longitude"
                    v-model:value="formState.longitude"
                    data-testid="atm-geo-data-longitude"
                    type="number"
                    step="0.0000000001"
                    class="atm-geodata-input-field"
                    :placeholder="t('labels.enterLongitude')"
                    required
                    :min="-180"
                    :disabled="readonly"
                    :max="180"
                    :status="isLongitudeInvalid ? 'error' : ''"
                    @blur="handleBlur"
                    @keydown.stop
                    @selectstart.capture.stop
                    @mousedown.stop
                  />
                  <span v-if="isLongitudeInvalid" class="atm-geodata-error-text">{{ t('msg.error.longitudeRange') }}</span>
                </div>
              </div>

              <!-- Map with integrated search & controls -->
              <div class="atm-geodata-map-wrapper">
                <div
                  ref="mapContainerRef"
                  data-testid="atm-geo-data-map-picker"
                  class="atm-geodata-map-picker"
                  role="application"
                  :aria-label="$t('labels.mapPicker')"
                />

                <!-- Search overlay on map -->
                <div v-if="!readonly" class="atm-geodata-map-search">
                  <div class="atm-geodata-search-input-row">
                    <GeneralIcon icon="search" class="atm-geodata-search-icon" />
                    <input
                      ref="searchInputRef"
                      v-model="searchQuery"
                      data-testid="atm-geo-data-search"
                      type="text"
                      class="atm-geodata-search-input"
                      :placeholder="$t('labels.searchForPlace')"
                      role="combobox"
                      :aria-expanded="showSearchResults"
                      aria-autocomplete="list"
                      aria-controls="atm-geo-search-results"
                      @keydown="onSearchKeydown"
                      @blur="onSearchBlur"
                      @keydown.stop
                      @mousedown.stop
                    />
                    <GeneralIcon v-if="isSearching" icon="loading" class="atm-geodata-search-spinner animate-spin" />
                  </div>
                  <div v-if="showSearchResults" id="atm-geo-search-results" role="listbox" class="atm-geodata-search-results">
                    <div
                      v-for="result in searchResults"
                      :key="result.place_id"
                      role="option"
                      class="atm-geodata-search-result-item"
                      @mousedown.prevent="selectSearchResult(result)"
                    >
                      <GeneralIcon icon="ncMapPin" class="atm-geodata-result-icon" />
                      <span class="atm-geodata-result-text">{{ result.display_name }}</span>
                    </div>
                  </div>
                </div>

                <!-- Current location button -->
                <div v-if="!readonly" class="atm-geodata-locate-wrapper">
                  <AtTooltip placement="bottom">
                    <template #title>{{ $t('labels.currentLocation') }}</template>
                    <button
                      class="atm-geodata-locate-btn"
                      :class="{ 'atm-geodata-locate-btn--loading': isLoading }"
                      :disabled="isLoading"
                      :aria-label="$t('labels.currentLocation')"
                      type="button"
                      @click.stop.prevent="onClickSetCurrentLocation"
                    >
                      <GeneralIcon v-if="!isLoading" icon="currentLocation" class="h-4 w-4" />
                      <GeneralIcon v-else icon="loading" class="h-4 w-4 animate-spin" />
                    </button>
                  </AtTooltip>
                </div>
              </div>

              <!-- Info hint -->
              <div v-if="!readonly" class="atm-geodata-info-hint">
                <GeneralIcon icon="info" class="h-3.5 w-3.5 flex-shrink-0" />
                <span>{{ $t('labels.clickMapToSetLocation') }}</span>
              </div>
            </div>

            <!-- Footer -->
            <div class="atm-geodata-footer">
              <div class="atm-geodata-footer-left">
                <template v-if="vModel">
                  <AtTooltip>
                    <template #title>
                      <div class="flex items-center gap-1">
                        {{ $t('activity.map.googleMaps') }}
                        <GeneralIcon icon="ncExternalLink" class="h-3 w-3" />
                      </div>
                    </template>
                    <AtButton type="secondary" size="small" class="!px-2" @click="openInGoogleMaps">
                      <GeneralIcon icon="ncLogoGoogleMapColored" class="h-4 w-4" />
                    </AtButton>
                  </AtTooltip>

                  <AtTooltip>
                    <template #title>
                      <div class="flex items-center gap-1">
                        {{ $t('activity.map.osm') }}
                        <GeneralIcon icon="ncExternalLink" class="h-3 w-3" />
                      </div>
                    </template>
                    <AtButton type="secondary" size="small" class="!px-2" @click="openInOSM">
                      <GeneralIcon icon="ncLogoOpenStreetMapColored" class="h-4 w-4" />
                    </AtButton>
                  </AtTooltip>
                </template>
              </div>

              <div class="atm-geodata-footer-right">
                <AtButton
                  v-if="isLocationSet"
                  type="secondary"
                  size="small"
                  class="!text-red-500 !hover:bg-red-50"
                  data-testid="atm-geo-data-clear"
                  @click="clearValue"
                >
                  {{ $t('general.clear') }}
                </AtButton>
                <AtButton type="secondary" size="small" @click="clear">
                  {{ $t('general.cancel') }}
                </AtButton>

                <AtButton html-type="submit" size="small" data-testid="atm-geo-data-save">
                  {{ $t('general.save') }}
                </AtButton>
              </div>
            </div>
          </a-form>
        </div>
      </template>
    </AtDropdown>
  </div>
</template>

<style scoped lang="scss">
/* Selectable coordinate text in expanded form */
.atm-geodata-selectable-text {
  user-select: text;
  cursor: text;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.atm-geodata-action-icons {
  @apply flex items-center gap-2 ml-2 flex-shrink-0;
}

.atm-geodata-action-icon {
  @apply w-4 h-4 text-atm-content-gray-muted cursor-pointer;
  transition: color 0.15s;

  &:hover {
    @apply text-atm-content-gray;
  }
}

/* Overlay modal structure */
.atm-geodata-picker-overlay {
  @apply bg-atm-bg-default rounded-xl overflow-hidden flex flex-col;
  width: 540px;
  max-width: 95vw;
  max-height: 85vh;
}

.atm-geodata-form {
  @apply flex flex-col h-full;
}

.atm-geodata-content {
  @apply flex flex-col gap-4 px-5 py-4 overflow-y-auto;
  flex: 1;
}

.atm-geodata-section-label {
  @apply text-atm-content-gray-subtle text-xs font-semibold uppercase tracking-wide mb-1;
}

/* Two-column coordinates grid */
.atm-geodata-coordinates-grid {
  @apply grid grid-cols-2 gap-4;
}

.atm-geodata-input-group {
  @apply flex flex-col gap-1.5;
}

.atm-geodata-input-label {
  @apply text-atm-content-gray text-small font-medium;
}

.atm-geodata-input-field {
  @apply !rounded-lg;
}

:deep(.atm-geodata-input-field input) {
  @apply !text-sm;
}

.atm-geodata-error-text {
  @apply text-atm-content-red-dark text-xs;
}

/* Search overlay on map */
.atm-geodata-map-search {
  @apply absolute;
  top: 12px;
  left: 12px;
  right: 56px; /* leave room for the locate button + gap */
  z-index: 1000;
}

.atm-geodata-search-input-row {
  @apply flex items-center rounded-lg bg-atm-bg-default;
  padding: 0 12px;
  height: 36px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  transition: box-shadow 0.2s;

  &:focus-within {
    box-shadow: 0 1px 6px rgba(0, 0, 0, 0.18);
  }
}

.atm-geodata-search-icon {
  @apply text-atm-content-gray-muted w-4 h-4 flex-shrink-0;
}

.atm-geodata-search-spinner {
  @apply text-atm-content-gray-muted w-3.5 h-3.5 flex-shrink-0;
}

.atm-geodata-search-input {
  @apply flex-1 border-none outline-none text-atm-content-gray bg-transparent min-w-0;
  font-size: 13px;
  padding: 0 8px;

  &::placeholder {
    @apply text-atm-content-gray-muted;
  }
}

.atm-geodata-search-results {
  @apply bg-atm-bg-default rounded-lg;
  margin-top: 4px;
  max-height: 180px;
  overflow-y: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.atm-geodata-search-result-item {
  @apply flex items-start gap-2 px-3 py-2 cursor-pointer;
  transition: background 0.15s;

  &:hover {
    @apply bg-atm-bg-gray-light;
  }

  &:first-child {
    border-radius: 8px 8px 0 0;
  }

  &:last-child {
    border-radius: 0 0 8px 8px;
  }

  &:only-child {
    border-radius: 8px;
  }
}

.atm-geodata-result-icon {
  @apply text-atm-content-gray-muted w-3.5 h-3.5 flex-shrink-0 mt-0.5;
}

.atm-geodata-result-text {
  @apply text-atm-content-gray text-xs leading-[1.4];
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

/* Map wrapper (relative container for overlay controls) */
.atm-geodata-map-wrapper {
  @apply relative;
}

/* Interactive map picker */
.atm-geodata-map-picker {
  @apply border-1 border-atm-border-gray-medium rounded-xl overflow-hidden;
  height: 300px;
  z-index: 0;
}

/* Dark mode: invert OSM tiles via CSS filter to preserve detail */
:deep(.atm-geodata-map-picker .leaflet-tile-pane) {
  html.dark & {
    filter: invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9);
  }
}

/* Wrapper positions the locate button absolutely on the map */
.atm-geodata-locate-wrapper {
  @apply absolute;
  top: 12px;
  right: 12px;
  z-index: 1000;
}

/* Current-location icon button on map — aligned with search bar */
.atm-geodata-locate-btn {
  @apply flex items-center justify-center bg-atm-bg-default rounded-lg cursor-pointer border-none;
  width: 36px;
  height: 36px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  transition: background 0.15s;
  color: var(--atm-content-gray-subtle);

  &:hover:not(:disabled) {
    @apply bg-atm-bg-gray-light border-atm-border-gray-dark;
    color: var(--atm-content-gray);
  }

  &:disabled {
    @apply cursor-wait opacity-70;
  }

  &--loading {
    color: var(--atm-content-brand);
  }
}

:deep(.atm-geodata-map-picker .leaflet-control-zoom) {
  border: none;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);

  a {
    @apply bg-atm-bg-default text-atm-content-gray;
    text-decoration: none !important;
    border-bottom-color: var(--atm-border-gray-medium, #e5e7eb) !important;

    &:hover {
      @apply bg-atm-bg-gray-light;
    }
  }
}

:deep(.atm-geodata-map-picker .leaflet-control-attribution) {
  @apply text-[10px] bg-atm-bg-default/80 text-atm-content-gray-muted;

  a {
    @apply text-atm-content-gray-muted;
  }
}

/* Info hint below map */
.atm-geodata-info-hint {
  @apply flex items-center gap-1.5 text-atm-content-gray-muted text-xs -mt-2;
}

/* Footer */
.atm-geodata-footer {
  @apply flex items-center justify-between gap-3 px-5 py-3 border-t-1 border-atm-border-gray-medium bg-atm-bg-gray-extralight;
}

.atm-geodata-footer-left {
  @apply flex gap-2;
}

.atm-geodata-footer-right {
  @apply flex gap-2;
}
</style>

<style lang="scss">
.atm-geodata-overlay-dropdown {
  min-width: 540px !important;
  max-width: 95vw !important;

  .ant-dropdown-content {
    @apply !p-0;
  }
}
</style>
