{{/* Chart name */}}
{{- define "atmosphere.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/* Fully qualified app name */}}
{{- define "atmosphere.fullname" -}}
{{- if .Values.fullnameOverride -}}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- $name := default .Chart.Name .Values.nameOverride -}}
{{- if contains $name .Release.Name -}}
{{- .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- else -}}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}
{{- end -}}

{{- define "atmosphere.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "atmosphere.selectorLabels" -}}
app.kubernetes.io/name: {{ include "atmosphere.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{- define "atmosphere.labels" -}}
helm.sh/chart: {{ include "atmosphere.chart" . }}
{{ include "atmosphere.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- with .Values.commonLabels }}
{{ toYaml . }}
{{- end }}
{{- end -}}

{{/* Merge commonAnnotations with per-resource annotations (resource-specific win on key collision) */}}
{{- define "atmosphere.annotations" -}}
{{- $merged := merge (deepCopy (.extraAnnotations | default dict)) .context.Values.commonAnnotations -}}
{{- if $merged }}
{{- toYaml $merged }}
{{- end }}
{{- end -}}

{{- define "atmosphere.serviceAccountName" -}}
{{- if .Values.serviceAccount.create -}}
{{- default (include "atmosphere.fullname" .) .Values.serviceAccount.name -}}
{{- else -}}
{{- default "default" .Values.serviceAccount.name -}}
{{- end -}}
{{- end -}}

{{- define "atmosphere.image" -}}
{{- $registry := default .Values.image.registry .Values.global.imageRegistry -}}
{{- $repository := .Values.image.repository -}}
{{- if .Values.image.digest -}}
{{- if $registry -}}{{- printf "%s/%s@%s" $registry $repository .Values.image.digest -}}
{{- else -}}{{- printf "%s@%s" $repository .Values.image.digest -}}{{- end -}}
{{- else -}}
{{- $tag := default .Chart.AppVersion .Values.image.tag -}}
{{- if $registry -}}{{- printf "%s/%s:%s" $registry $repository $tag -}}
{{- else -}}{{- printf "%s:%s" $repository $tag -}}{{- end -}}
{{- end -}}
{{- end -}}

{{- define "atmosphere.imagePullSecrets" -}}
{{- $secrets := concat .Values.global.imagePullSecrets .Values.image.pullSecrets | uniq -}}
{{- if $secrets }}
imagePullSecrets:
{{- range $secrets }}
{{- if kindIs "string" . }}
  - name: {{ . }}
{{- else }}
  - {{ toYaml . | nindent 4 | trim }}
{{- end }}
{{- end }}
{{- end }}
{{- end -}}

{{- define "atmosphere.secretName" -}}
{{- include "atmosphere.fullname" . -}}
{{- end -}}

{{/* Render a value as a template (string or object) */}}
{{- define "atmosphere.tplvalues.render" -}}
{{- if typeIs "string" .value }}
{{- tpl .value .context }}
{{- else }}
{{- tpl (.value | toYaml) .context }}
{{- end }}
{{- end -}}

{{/* true when Redis is configured by any means */}}
{{- define "atmosphere.redisConfigured" -}}
{{- if or .Values.externalRedis.host .Values.externalRedis.existingSecret -}}true{{- end -}}
{{- end -}}

{{/* Fail fast when HA is requested without Redis */}}
{{- define "atmosphere.validateRedis" -}}
{{- $ha := or (gt (int .Values.replicaCount) 1) .Values.worker.enabled .Values.autoscaling.enabled -}}
{{- if and $ha (not (include "atmosphere.redisConfigured" .)) -}}
{{- fail "Atmosphere requires Redis for multi-replica or worker deployments. Set externalRedis.host (or externalRedis.existingSecret), or set replicaCount=1, autoscaling.enabled=false, and worker.enabled=false." -}}
{{- end -}}
{{- end -}}

{{/* Assemble the DATABASE_URL (standard postgres URL form) from inline fields */}}
{{- define "atmosphere.dbUrl" -}}
{{- $d := .Values.externalDatabase -}}
{{- $base := printf "postgresql://%s:%s@%s:%v/%s" (urlquery $d.username) (urlquery $d.password) $d.host (toString $d.port) $d.database -}}
{{- if $d.sslMode -}}{{- printf "%s?sslmode=%s" $base $d.sslMode -}}{{- else -}}{{- $base -}}{{- end -}}
{{- end -}}

{{/* Assemble ATMOSPHERE_REDIS_URL from inline fields */}}
{{- define "atmosphere.redisUrl" -}}
{{- $r := .Values.externalRedis -}}
{{- $scheme := ternary "rediss" "redis" $r.tls -}}
{{- if $r.password -}}{{- printf "%s://:%s@%s:%v" $scheme (urlquery $r.password) $r.host (toString $r.port) -}}
{{- else -}}{{- printf "%s://%s:%v" $scheme $r.host (toString $r.port) -}}{{- end -}}
{{- end -}}

{{/* Auto-generate+persist JWT secret: reuse the existing cluster value on upgrade */}}
{{- define "atmosphere.jwtSecret" -}}
{{- $existing := lookup "v1" "Secret" .Release.Namespace (include "atmosphere.secretName" .) -}}
{{- if and $existing $existing.data (index $existing.data "ATMOSPHERE_AUTH_JWT_SECRET") -}}
{{- index $existing.data "ATMOSPHERE_AUTH_JWT_SECRET" | b64dec -}}
{{- else if .Values.auth.jwtSecret -}}
{{- .Values.auth.jwtSecret -}}
{{- else -}}
{{- randAlphaNum 64 -}}
{{- end -}}
{{- end -}}

{{/* Auto-generate+persist encryption key (never rotated) */}}
{{- define "atmosphere.encryptionKey" -}}
{{- $existing := lookup "v1" "Secret" .Release.Namespace (include "atmosphere.secretName" .) -}}
{{- if and $existing $existing.data (index $existing.data "ATMOSPHERE_CONNECTION_ENCRYPT_KEY") -}}
{{- index $existing.data "ATMOSPHERE_CONNECTION_ENCRYPT_KEY" | b64dec -}}
{{- else if .Values.auth.encryptionKey -}}
{{- .Values.auth.encryptionKey -}}
{{- else -}}
{{- randAlphaNum 64 -}}
{{- end -}}
{{- end -}}

{{/* Secret env block: every secret env var via valueFrom.secretKeyRef (existingSecret or chart-managed) */}}
{{- define "atmosphere.secretEnv" -}}
- name: {{ .Values.externalDatabase.urlEnvVar | default "DATABASE_URL" }}
  valueFrom:
    secretKeyRef:
      {{- if .Values.externalDatabase.existingSecret }}
      name: {{ .Values.externalDatabase.existingSecret }}
      key: {{ .Values.externalDatabase.existingSecretUrlKey | default "DATABASE_URL" }}
      {{- else }}
      name: {{ include "atmosphere.secretName" . }}
      key: DATABASE_URL
      {{- end }}
{{- if include "atmosphere.redisConfigured" . }}
- name: ATMOSPHERE_REDIS_URL
  valueFrom:
    secretKeyRef:
      {{- if .Values.externalRedis.existingSecret }}
      name: {{ .Values.externalRedis.existingSecret }}
      key: {{ .Values.externalRedis.existingSecretUrlKey | default "ATMOSPHERE_REDIS_URL" }}
      {{- else }}
      name: {{ include "atmosphere.secretName" . }}
      key: ATMOSPHERE_REDIS_URL
      {{- end }}
{{- end }}
- name: ATMOSPHERE_AUTH_JWT_SECRET
  valueFrom:
    secretKeyRef:
      {{- if .Values.auth.existingSecret }}
      name: {{ .Values.auth.existingSecret }}
      key: {{ .Values.auth.jwtSecretKey | default "ATMOSPHERE_AUTH_JWT_SECRET" }}
      {{- else }}
      name: {{ include "atmosphere.secretName" . }}
      key: ATMOSPHERE_AUTH_JWT_SECRET
      {{- end }}
- name: ATMOSPHERE_CONNECTION_ENCRYPT_KEY
  valueFrom:
    secretKeyRef:
      {{- if .Values.auth.existingSecret }}
      name: {{ .Values.auth.existingSecret }}
      key: {{ .Values.auth.encryptionKeyKey | default "ATMOSPHERE_CONNECTION_ENCRYPT_KEY" }}
      {{- else }}
      name: {{ include "atmosphere.secretName" . }}
      key: ATMOSPHERE_CONNECTION_ENCRYPT_KEY
      {{- end }}
{{- if .Values.smtp.enabled }}
- name: ATMOSPHERE_SMTP_PASSWORD
  valueFrom:
    secretKeyRef:
      {{- if .Values.smtp.existingSecret }}
      name: {{ .Values.smtp.existingSecret }}
      key: {{ .Values.smtp.passwordKey | default "ATMOSPHERE_SMTP_PASSWORD" }}
      {{- else }}
      name: {{ include "atmosphere.secretName" . }}
      key: ATMOSPHERE_SMTP_PASSWORD
      {{- end }}
{{- end }}
{{- if .Values.monitoring.sentry.enabled }}
- name: ATMOSPHERE_SENTRY_DSN
  valueFrom:
    secretKeyRef:
      {{- if .Values.monitoring.sentry.existingSecret }}
      name: {{ .Values.monitoring.sentry.existingSecret }}
      key: {{ .Values.monitoring.sentry.dsnKey | default "ATMOSPHERE_SENTRY_DSN" }}
      {{- else }}
      name: {{ include "atmosphere.secretName" . }}
      key: ATMOSPHERE_SENTRY_DSN
      {{- end }}
{{- end }}
{{- end -}}
