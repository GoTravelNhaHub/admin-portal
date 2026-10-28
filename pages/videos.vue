<template>
  <div class="mx-auto max-w-[1400px] space-y-5 px-4 py-6 sm:px-6 lg:px-8">
    <div class="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 class="text-[20px] font-bold leading-7 tracking-[-0.02em] text-[#0A1024]">Videos</h2>
        <p class="text-[14px] text-[#64748B]">YouTube Shorts recorded from the live site: capture → narration → render → validation.</p>
      </div>
      <button type="button" class="btn-secondary min-h-10 w-auto px-3.5 text-[13px]" :disabled="loading" @click="loadAll">
        <svg class="h-4 w-4" :class="loading ? 'animate-spin' : ''" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3M18 3v4h-4M6 21v-4h4" />
        </svg>
        {{ loading ? 'Refreshing…' : 'Refresh' }}
      </button>
    </div>

    <p v-if="error" class="alert-error" role="alert">{{ error }}</p>

    <!-- Host readiness -->
    <section v-if="status" class="rounded-2xl border bg-white p-5" :class="status.canRender ? 'border-[#E2E8F0]' : 'border-[#FED7AA]'" aria-labelledby="ready-title">
      <h3 id="ready-title" class="text-[15px] font-bold text-[#0A1024]">
        {{ status.canRender ? 'Ready to render' : status.serverless ? 'Rendering is not available on this host' : 'Not ready to render' }}
      </h3>
      <p v-if="status.serverless" class="mt-1 text-[13px] text-[#64748B]">
        The API runs on a serverless host. Renders need a long-running server with FFmpeg and Chromium. Finished videos can still be viewed here if their files are on this host.
      </p>
      <ul class="mt-3 grid gap-2 text-[13px] sm:grid-cols-2 lg:grid-cols-4">
        <li v-for="check in readiness" :key="check.label" class="flex items-start gap-2">
          <span class="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white" :class="check.ok ? 'bg-[#059669]' : 'bg-[#DC2626]'" aria-hidden="true">{{ check.ok ? '✓' : '!' }}</span>
          <span><span class="font-semibold text-[#0A1024]">{{ check.label }}</span><span class="block text-[#64748B]">{{ check.detail }}</span></span>
        </li>
      </ul>
    </section>

    <!-- Running / latest job -->
    <section v-if="activeJob" class="rounded-2xl border border-[#E2E8F0] bg-white" aria-labelledby="job-title">
      <header class="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F5F9] px-5 py-4">
        <div class="min-w-0">
          <h3 id="job-title" class="text-[15px] font-bold text-[#0A1024]">
            {{ activeJob.config }}
            <span class="ml-2 rounded-full border px-2 py-0.5 text-[12px] font-semibold" :class="jobBadge(activeJob.status)">{{ activeJob.status }}</span>
          </h3>
          <p class="text-[12px] text-[#64748B]">Started {{ when(activeJob.startedAt || activeJob.createdAt) }} by {{ activeJob.startedBy || 'unknown' }}</p>
        </div>
        <div class="flex items-center gap-2">
          <ol class="flex items-center gap-1 text-[12px]" aria-label="Stages">
            <li
              v-for="stage in activeJob.stages"
              :key="stage"
              class="rounded-full border px-2 py-0.5 font-semibold"
              :class="stageBadge(activeJob, stage)"
            >
              {{ stage }}
            </li>
          </ol>
          <button v-if="activeJob.status === 'running'" type="button" class="btn-secondary min-h-9 w-auto px-3 text-[13px] text-[#B91C1C]" :disabled="busy" @click="cancelJob">Cancel</button>
          <button v-else type="button" class="btn-secondary min-h-9 w-auto px-3 text-[13px]" @click="activeJob = null">Close</button>
        </div>
      </header>
      <p v-if="activeJob.error" class="mx-5 mt-4 alert-error">{{ activeJob.error }}</p>
      <pre ref="logEl" class="m-5 max-h-80 overflow-auto rounded-xl bg-[#0A1024] p-4 text-[12px] leading-5 text-[#E2E8F0]">{{ activeJob.log?.join('\n') || 'Waiting for output…' }}</pre>
    </section>

    <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <!-- Configs -->
      <section class="rounded-2xl border border-[#E2E8F0] bg-white" aria-labelledby="configs-title">
        <header class="flex items-center justify-between gap-3 border-b border-[#F1F5F9] px-5 py-4">
          <h3 id="configs-title" class="text-[15px] font-bold text-[#0A1024]">Video configs</h3>
          <span class="text-[12px] text-[#64748B]">A new video is a new config</span>
        </header>
        <ul class="divide-y divide-[#F1F5F9]">
          <li v-for="cfg in configs" :key="cfg.name" class="px-5 py-4" :class="selected?.name === cfg.name ? 'bg-[#F8FAFC]' : ''">
            <div class="flex flex-wrap items-start justify-between gap-3">
              <button type="button" class="min-w-0 text-left" @click="select(cfg)">
                <span class="block truncate text-[14px] font-semibold text-[#0A1024]">{{ cfg.title || cfg.name }}</span>
                <span class="block text-[12px] text-[#64748B]">
                  <span class="font-mono">{{ cfg.name }}</span> · {{ cfg.language || '—' }} · {{ cfg.destination || '—' }} · {{ cfg.durationSeconds ?? '—' }} s · edited {{ when(cfg.updatedAt) }}
                </span>
                <span class="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                  <span v-if="cfg.error" class="rounded-full border border-[#FECACA] bg-[#FEF2F2] px-2 py-0.5 font-semibold text-[#B91C1C]">{{ cfg.error }}</span>
                  <span v-if="cfg.render?.final" class="rounded-full border px-2 py-0.5 font-semibold" :class="validationBadge(cfg.render.final.validation?.status)">
                    Final · {{ cfg.render.final.validation?.status || 'not validated' }}
                  </span>
                  <span v-if="cfg.render?.draft" class="rounded-full border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-0.5 font-semibold text-[#475569]">Draft</span>
                  <span v-if="!cfg.render?.final && !cfg.render?.draft && !cfg.error" class="text-[#94A3B8]">Not rendered yet</span>
                </span>
              </button>
              <div class="flex shrink-0 flex-wrap gap-1.5">
                <button type="button" class="btn-primary min-h-9 w-auto px-3 text-[13px]" :disabled="!!cfg.error || !status?.canRender || !!status?.running" @click="openRender(cfg)">Render</button>
                <button type="button" class="btn-secondary min-h-9 w-auto px-3 text-[13px]" @click="openEditor(cfg.name)">Edit</button>
                <button type="button" class="btn-secondary min-h-9 w-auto px-3 text-[13px]" @click="duplicate(cfg.name)">Duplicate</button>
              </div>
            </div>

            <!-- Render options -->
            <form v-if="renderFor === cfg.name" class="mt-3 space-y-3 rounded-xl border border-[#E2E8F0] bg-white p-3" @submit.prevent="startJob(cfg.name)">
              <fieldset>
                <legend class="form-label">Stages</legend>
                <div class="flex flex-wrap gap-3 text-[13px]">
                  <label v-for="stage in STAGES" :key="stage" class="inline-flex items-center gap-1.5">
                    <input v-model="renderForm.stages" type="checkbox" :value="stage" class="h-4 w-4 accent-[#0066E4]" /> {{ stage }}
                  </label>
                </div>
                <p class="mt-1 text-[12px] text-[#64748B]">Later stages reuse the files of earlier ones, so you can re-render without capturing again.</p>
              </fieldset>
              <label class="block">
                <span class="form-label">Narration voice</span>
                <select v-model="renderForm.ttsProvider" class="form-input">
                  <option value="">From the config</option>
                  <option value="auto">Auto (first configured provider)</option>
                  <option value="elevenlabs">ElevenLabs</option>
                  <option value="google">Google</option>
                  <option value="azure">Azure</option>
                  <option value="say">macOS say (draft only)</option>
                </select>
              </label>
              <div class="flex gap-2">
                <button type="submit" class="btn-primary min-h-9 w-auto px-4 text-[13px]" :disabled="busy || !renderForm.stages.length">{{ busy ? 'Starting…' : 'Start render' }}</button>
                <button type="button" class="btn-secondary min-h-9 w-auto px-4 text-[13px]" @click="renderFor = null">Cancel</button>
              </div>
            </form>
          </li>
          <li v-if="!configs.length && !loading" class="px-5 py-8 text-center text-[14px] text-[#64748B]">No video configs yet.</li>
        </ul>
      </section>

      <!-- Preview -->
      <section class="rounded-2xl border border-[#E2E8F0] bg-white" aria-labelledby="preview-title">
        <header class="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F5F9] px-5 py-4">
          <h3 id="preview-title" class="text-[15px] font-bold text-[#0A1024]">{{ selected ? selected.title || selected.name : 'Preview' }}</h3>
          <div v-if="selected?.render?.final && selected?.render?.draft" class="inline-grid grid-cols-2 gap-1 rounded-xl bg-[#E2E8F0]/70 p-1" role="tablist" aria-label="Render to show">
            <button
              v-for="option in (['final', 'draft'] as const)"
              :key="option"
              type="button"
              role="tab"
              :aria-selected="variant === option"
              class="min-h-8 rounded-lg px-3 text-[12px] font-semibold capitalize"
              :class="variant === option ? 'bg-white text-[#0A1024] shadow-[0_1px_3px_rgba(10,16,36,0.12)]' : 'text-[#64748B] hover:text-[#0A1024]'"
              @click="variant = option"
            >
              {{ option }}
            </button>
          </div>
        </header>
        <div v-if="!selected" class="px-5 py-10 text-center text-[14px] text-[#64748B]">Pick a config to see its latest render.</div>
        <div v-else-if="!shown" class="px-5 py-10 text-center text-[14px] text-[#64748B]">This config has not been rendered yet.</div>
        <div v-else class="grid gap-5 p-5 lg:grid-cols-[minmax(0,280px)_minmax(0,1fr)]">
          <video :key="fileUrl(shown.files.video!.path)" class="aspect-[9/16] w-full rounded-xl bg-black" controls preload="metadata" :src="fileUrl(shown.files.video!.path)" />
          <div class="min-w-0 space-y-4">
            <div v-if="shown.validation">
              <p class="text-[14px] font-semibold" :class="shown.validation.status === 'PASSED' ? 'text-[#047857]' : 'text-[#B91C1C]'">Validation {{ shown.validation.status }}</p>
              <ul v-if="shown.validation.failed.length" class="mt-1 list-disc pl-5 text-[13px] text-[#B91C1C]">
                <li v-for="item in shown.validation.failed" :key="item">{{ item }}</li>
              </ul>
              <ul v-if="shown.validation.warnings.length" class="mt-1 list-disc pl-5 text-[13px] text-[#B45309]">
                <li v-for="item in shown.validation.warnings" :key="item">{{ item }}</li>
              </ul>
            </div>
            <ul class="space-y-1.5 text-[13px]">
              <li v-for="item in downloads" :key="item.key" class="flex items-center justify-between gap-3">
                <span class="text-[#334155]">{{ item.label }} <span class="text-[#94A3B8]">· {{ size(item.file.size) }} · {{ when(item.file.updatedAt) }}</span></span>
                <span class="flex gap-3">
                  <a :href="fileUrl(item.file.path)" target="_blank" rel="noopener" class="text-link">Open</a>
                  <a :href="fileUrl(item.file.path, true)" class="text-link">Download</a>
                </span>
              </li>
            </ul>
            <img v-if="shown.files.contactSheet" :src="fileUrl(shown.files.contactSheet.path)" alt="Contact sheet: 24 frames of the video" class="w-full rounded-xl border border-[#E2E8F0]" loading="lazy" />
          </div>
        </div>
      </section>
    </div>

    <!-- Recent jobs -->
    <section class="rounded-2xl border border-[#E2E8F0] bg-white" aria-labelledby="jobs-title">
      <header class="border-b border-[#F1F5F9] px-5 py-4">
        <h3 id="jobs-title" class="text-[15px] font-bold text-[#0A1024]">Recent renders</h3>
      </header>
      <ul class="divide-y divide-[#F1F5F9]">
        <li v-for="job in jobs" :key="job.id">
          <button type="button" class="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-3 text-left hover:bg-[#F8FAFC]" @click="openJob(job.id)">
            <span class="min-w-0 text-[13px]">
              <span class="font-semibold text-[#0A1024]">{{ job.config }}</span>
              <span class="text-[#64748B]"> · {{ job.stages.join(' → ') }} · {{ when(job.createdAt) }} · {{ job.startedBy || 'unknown' }}</span>
            </span>
            <span class="rounded-full border px-2 py-0.5 text-[12px] font-semibold" :class="jobBadge(job.status)">{{ job.status }}{{ job.stage && job.status !== 'succeeded' ? ` (${job.stage})` : '' }}</span>
          </button>
        </li>
        <li v-if="!jobs.length" class="px-5 py-6 text-center text-[14px] text-[#64748B]">No renders started from admin yet.</li>
      </ul>
    </section>

    <!-- Config editor -->
    <div v-if="editor" class="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1024]/50 p-4" @click.self="editor = null">
      <div class="flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-xl" role="dialog" aria-modal="true" aria-labelledby="editor-title">
        <header class="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F5F9] px-5 py-4">
          <h3 id="editor-title" class="text-[15px] font-bold text-[#0A1024]">{{ editor.isNew ? 'New config' : 'Edit config' }}</h3>
          <label class="flex items-center gap-2 text-[13px]">
            <span class="text-[#64748B]">Name</span>
            <input v-model="editor.name" :disabled="!editor.isNew" class="form-input min-h-9 w-56 font-mono text-[13px]" pattern="[a-z0-9][a-z0-9-]{0,63}" />
          </label>
        </header>
        <textarea v-model="editor.text" spellcheck="false" class="min-h-[50vh] flex-1 resize-none border-0 p-5 font-mono text-[12px] leading-5 text-[#0A1024] focus:outline-none"></textarea>
        <footer class="flex flex-wrap items-center justify-between gap-3 border-t border-[#F1F5F9] px-5 py-3">
          <p class="text-[12px] text-[#B91C1C]">{{ editor.error }}</p>
          <div class="flex gap-2">
            <button type="button" class="btn-secondary min-h-9 w-auto px-4 text-[13px]" @click="editor = null">Close</button>
            <button type="button" class="btn-primary min-h-9 w-auto px-4 text-[13px]" :disabled="busy" @click="saveEditor">{{ busy ? 'Saving…' : 'Save' }}</button>
          </div>
        </footer>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

definePageMeta({
  layout: 'default',
  middleware: 'admin'
})

const STAGES = ['capture', 'voice', 'render', 'validate'] as const
type Stage = (typeof STAGES)[number]
type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled' | 'interrupted'

interface FileInfo { path: string; size: number; updatedAt: string }
interface RenderVariant {
  files: Record<'video' | 'srt' | 'script' | 'contactSheet' | 'report' | 'timeline', FileInfo | null>
  validation: { status: string; failed: string[]; warnings: string[] } | null
}
interface VideoConfigRow {
  name: string
  id: string | null
  title: string | null
  destination: string | null
  language: string | null
  durationSeconds: number | null
  updatedAt: string
  error: string | null
  render: { final: RenderVariant | null; draft: RenderVariant | null } | null
}
interface VideoJob {
  id: string
  config: string
  stages: Stage[]
  status: JobStatus
  stage: Stage | null
  completedStages: Stage[]
  error: string | null
  startedBy: string | null
  createdAt: string
  startedAt: string | null
  log?: string[]
}
interface StudioStatus {
  canRender: boolean
  serverless: boolean
  ffmpeg: { ok: boolean; version: string | null }
  ffprobe: { ok: boolean; version: string | null }
  chromium: boolean
  tts: { elevenlabs: boolean; google: boolean; azure: boolean; forced: string | null }
  dataDir: string
  running: { id: string; config: string; stage: Stage | null } | null
}

const status = ref<StudioStatus | null>(null)
const configs = ref<VideoConfigRow[]>([])
const jobs = ref<VideoJob[]>([])
const activeJob = ref<VideoJob | null>(null)
const selected = ref<VideoConfigRow | null>(null)
const variant = ref<'final' | 'draft'>('final')
const renderFor = ref<string | null>(null)
const renderForm = ref<{ stages: Stage[]; ttsProvider: string }>({ stages: [...STAGES], ttsProvider: '' })
const editor = ref<{ name: string; text: string; isNew: boolean; error: string } | null>(null)
const loading = ref(false)
const busy = ref(false)
const error = ref('')
const logEl = ref<HTMLElement | null>(null)
let poll: ReturnType<typeof setInterval> | null = null

const fileUrl = (path: string, download = false) =>
  apiUrl(`/api/admin/videos/file?${new URLSearchParams({ path, ...(download ? { download: '1' } : {}) })}`)

const when = (value: string | null) => (value ? new Date(value).toLocaleString('en-SG', { dateStyle: 'medium', timeStyle: 'short' }) : '—')
const size = (bytes: number) => (bytes > 1e6 ? `${(bytes / 1e6).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1e3))} KB`)

const readiness = computed(() => {
  const s = status.value
  if (!s) return []
  const providers = (['elevenlabs', 'google', 'azure'] as const).filter((p) => s.tts[p])
  return [
    { label: 'FFmpeg', ok: s.ffmpeg.ok && s.ffprobe.ok, detail: s.ffmpeg.ok ? s.ffmpeg.version || 'installed' : 'ffmpeg/ffprobe not found on the API host' },
    { label: 'Chromium', ok: s.chromium, detail: s.chromium ? 'Playwright browser installed' : 'Run npm run video:install on the API host' },
    { label: 'Narration', ok: providers.length > 0, detail: providers.length ? providers.join(', ') : 'Set ElevenLabs, Google or Azure TTS keys' },
    { label: 'Worker', ok: !s.serverless, detail: s.running ? `Rendering ${s.running.config} (${s.running.stage || 'starting'})` : s.serverless ? 'Serverless host' : 'Idle' }
  ]
})

const shown = computed<RenderVariant | null>(() => {
  const render = selected.value?.render
  if (!render) return null
  return (variant.value === 'draft' ? render.draft : render.final) || render.final || render.draft
})

const downloads = computed(() => {
  const files = shown.value?.files
  if (!files) return []
  const labels: Array<[keyof RenderVariant['files'], string]> = [
    ['video', 'Video (MP4)'],
    ['srt', 'Subtitles (SRT)'],
    ['script', 'Script'],
    ['report', 'Validation report'],
    ['contactSheet', 'Contact sheet'],
    ['timeline', 'Timeline (JSON)']
  ]
  return labels.filter(([key]) => files[key]).map(([key, label]) => ({ key, label, file: files[key]! }))
})

const jobBadge = (s: JobStatus) =>
  s === 'succeeded'
    ? 'border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]'
    : s === 'running' || s === 'queued'
      ? 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]'
      : s === 'failed'
        ? 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]'
        : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]'

const stageBadge = (job: VideoJob, stage: Stage) =>
  job.completedStages.includes(stage)
    ? 'border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]'
    : job.stage === stage
      ? job.status === 'running'
        ? 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1D4ED8]'
        : 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]'
      : 'border-[#E2E8F0] bg-white text-[#94A3B8]'

const validationBadge = (s?: string) =>
  s === 'PASSED' ? 'border-[#A7F3D0] bg-[#ECFDF5] text-[#047857]' : s ? 'border-[#FECACA] bg-[#FEF2F2] text-[#B91C1C]' : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#475569]'

const select = (cfg: VideoConfigRow) => {
  selected.value = cfg
  variant.value = cfg.render?.final ? 'final' : 'draft'
}

const loadAll = async () => {
  loading.value = true
  error.value = ''
  try {
    const [s, c, j] = await Promise.all([
      $api<{ data: StudioStatus }>('/api/admin/videos/status'),
      $api<{ data: VideoConfigRow[] }>('/api/admin/videos/configs'),
      $api<{ data: VideoJob[] }>('/api/admin/videos/jobs')
    ])
    status.value = s.data
    configs.value = c.data
    jobs.value = j.data
    if (selected.value) selected.value = c.data.find((row) => row.name === selected.value!.name) || null
    else if (c.data.length) select(c.data[0])
    if (s.data.running && (!activeJob.value || activeJob.value.id !== s.data.running.id)) await openJob(s.data.running.id)
  } catch (e: any) {
    error.value = e?.data?.message || 'Could not load the video studio.'
  } finally {
    loading.value = false
  }
}

const openJob = async (id: string) => {
  try {
    const res = await $api<{ data: VideoJob }>(`/api/admin/videos/jobs/${id}`)
    activeJob.value = res.data
    startPolling()
  } catch (e: any) {
    error.value = e?.data?.message || 'Could not load the job.'
  }
}

const startPolling = () => {
  if (poll) return
  poll = setInterval(async () => {
    const job = activeJob.value
    if (!job || (job.status !== 'running' && job.status !== 'queued')) {
      stopPolling()
      return
    }
    try {
      const res = await $api<{ data: VideoJob }>(`/api/admin/videos/jobs/${job.id}`)
      activeJob.value = res.data
      if (res.data.status !== 'running' && res.data.status !== 'queued') {
        stopPolling()
        await loadAll()
      }
    } catch {
      // keep polling; a blip should not hide the log
    }
  }, 2000)
}

const stopPolling = () => {
  if (poll) clearInterval(poll)
  poll = null
}

watch(
  () => activeJob.value?.log?.length,
  async () => {
    await nextTick()
    if (logEl.value) logEl.value.scrollTop = logEl.value.scrollHeight
  }
)

const openRender = (cfg: VideoConfigRow) => {
  renderFor.value = renderFor.value === cfg.name ? null : cfg.name
  renderForm.value = { stages: [...STAGES], ttsProvider: '' }
}

const startJob = async (name: string) => {
  busy.value = true
  error.value = ''
  try {
    const res = await $api<{ data: VideoJob }>('/api/admin/videos/jobs', {
      method: 'POST',
      body: {
        config: name,
        stages: STAGES.filter((s) => renderForm.value.stages.includes(s)),
        ...(renderForm.value.ttsProvider ? { ttsProvider: renderForm.value.ttsProvider } : {})
      }
    })
    renderFor.value = null
    activeJob.value = { ...res.data, log: [] }
    startPolling()
    await loadAll()
  } catch (e: any) {
    error.value = e?.data?.message || 'Could not start the render.'
  } finally {
    busy.value = false
  }
}

const cancelJob = async () => {
  if (!activeJob.value || !window.confirm('Stop this render? Files from finished stages are kept.')) return
  busy.value = true
  try {
    await $api(`/api/admin/videos/jobs/${activeJob.value.id}/cancel`, { method: 'POST' })
  } catch (e: any) {
    error.value = e?.data?.message || 'Could not cancel the render.'
  } finally {
    busy.value = false
  }
}

const openEditor = async (name: string) => {
  try {
    const res = await $api<{ data: unknown }>(`/api/admin/videos/configs/${name}`)
    editor.value = { name, text: JSON.stringify(res.data, null, 2), isNew: false, error: '' }
  } catch (e: any) {
    error.value = e?.data?.message || 'Could not open the config.'
  }
}

/** Copies a config under a new name, with its id and output paths renamed so renders don't overwrite each other. */
const duplicate = async (name: string) => {
  try {
    const res = await $api<{ data: any }>(`/api/admin/videos/configs/${name}`)
    const newName = `${name}-copy`
    const cfg = res.data
    const oldId = String(cfg.id || name)
    cfg.id = newName
    for (const key of Object.keys(cfg.output || {})) {
      if (typeof cfg.output[key] === 'string') cfg.output[key] = cfg.output[key].split(oldId).join(newName)
    }
    editor.value = { name: newName, text: JSON.stringify(cfg, null, 2), isNew: true, error: '' }
  } catch (e: any) {
    error.value = e?.data?.message || 'Could not copy the config.'
  }
}

const saveEditor = async () => {
  if (!editor.value) return
  let body: Record<string, any>
  try {
    body = JSON.parse(editor.value.text)
  } catch (e: any) {
    editor.value.error = `Not valid JSON: ${e.message}`
    return
  }
  if (editor.value.isNew && configs.value.some((c) => c.name === editor.value!.name)) {
    editor.value.error = 'A config with this name already exists.'
    return
  }
  busy.value = true
  try {
    await $api(`/api/admin/videos/configs/${editor.value.name}`, { method: 'PUT', body })
    const savedName = editor.value.name
    editor.value = null
    await loadAll()
    const row = configs.value.find((c) => c.name === savedName)
    if (row) select(row)
  } catch (e: any) {
    if (editor.value) editor.value.error = e?.data?.message || 'Could not save the config.'
  } finally {
    busy.value = false
  }
}

onMounted(loadAll)
onBeforeUnmount(stopPolling)
</script>
