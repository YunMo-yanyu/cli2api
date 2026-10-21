import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Card, Chip, Table } from '@heroui/react'
import { ArrowClockwise, CurrencyCny, Coins, Stack } from '@phosphor-icons/react'
import { fetchUsageCost, fetchUsagePricing, type CostBreakdown, type PricingCatalog } from '@/api/usage'
import { EmptyPanel } from '@/components/ui/EmptyPanel'
import { FilterToggle } from '@/components/ui/FilterToggle'
import { PageAlert } from '@/components/ui/PageAlert'
import { SkeletonBlock } from '@/components/ui/PageSkeletons'
import { useI18n } from '@/hooks/useI18n'
import { formatCNY, formatCompact, formatUnitPrice } from '@/lib/format'

const CostChart = lazy(() => import('@/components/usage/CostChart').then((mod) => ({ default: mod.CostChart })))

type UsageWindow = '24' | '168' | 'all'

const EMPTY_BREAKDOWN: CostBreakdown = {
  window: { from: '', to: '', hours: 24 },
  currency: 'CNY',
  models: [],
  totals: {
    id: 'total', label: '', vendor: '', currency: 'CNY',
    requests: 0, cache_hit: 0, cache_miss: 0, output: 0, total_tokens: 0,
    cost: 0, cost_off_peak: 0, cost_peak: 0, peak_requests: 0,
  },
  series: [],
}

function pct(part: number, whole: number) {
  if (!whole) return '0%'
  const value = (part / whole) * 100
  return `${value >= 10 ? value.toFixed(0) : value.toFixed(1)}%`
}

export function UsagePage() {
  const { t, lang } = useI18n()
  const [window, setWindow] = useState<UsageWindow>('all')
  const [breakdown, setBreakdown] = useState<CostBreakdown | null>(null)
  const [pricing, setPricing] = useState<PricingCatalog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    void fetchUsagePricing()
      .then((data) => { if (!cancelled) setPricing(data) })
      .catch(() => { /* pricing table is optional decoration */ })
    return () => { cancelled = true }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const query = window === 'all'
        ? {}
        : { from: new Date(Date.now() - Number(window) * 3600 * 1000).toISOString(), to: new Date().toISOString() }
      const data = await fetchUsageCost(query)
      setBreakdown(data)
      setError('')
    } catch (err) {
      setBreakdown(null)
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }, [window])

  useEffect(() => { void load() }, [load])

  const data = breakdown ?? EMPTY_BREAKDOWN
  const totals = data.totals
  const hasData = totals.requests > 0 && data.models.length > 0

  const metrics = [
    { label: t('usageEstCost'), value: formatCNY(totals.cost), detail: `${formatCNY(totals.cost_peak)} ${t('usagePeak')} · ${formatCNY(totals.cost_off_peak)} ${t('usageOffPeak')}`, icon: CurrencyCny },
    { label: t('usageTotalTokens'), value: formatCompact(totals.total_tokens), detail: `${formatCompact(totals.cache_hit)} / ${formatCompact(totals.cache_miss)} / ${formatCompact(totals.output)}  ${t('usageTokenSplitNote')}`, icon: Stack },
    { label: t('usageRequests'), value: String(totals.requests), detail: `${totals.peak_requests} ${t('usagePeak')} · ${totals.requests - totals.peak_requests} ${t('usageOffPeak')}`, icon: Coins },
    { label: t('usageCacheHitRate'), value: pct(totals.cache_hit, totals.cache_hit + totals.cache_miss), detail: formatCompact(totals.cache_hit), icon: Coins },
  ]

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4 border-b border-separator pb-4">
        <div>
          <h2 data-gsap-reveal className="text-2xl font-semibold tracking-[-0.035em]">{t('usageTitle')}</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">{t('usageLead')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <FilterToggle
            value={window}
            onChange={(next) => setWindow(next as UsageWindow)}
            ariaLabel={t('usageWindow')}
            options={[
              { id: '24', label: t('usageWindow24h') },
              { id: '168', label: t('usageWindow7d') },
              { id: 'all', label: t('usageWindowTotal') },
            ]}
          />
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-muted transition-colors hover:text-foreground"
          >
            <ArrowClockwise size={14} />{t('refresh')}
          </button>
        </div>
      </section>

      {error ? <PageAlert title={t('failedUsage', { msg: error })} /> : null}

      <section data-gsap-reveal className="grid overflow-hidden rounded-3xl border border-border bg-surface sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric, index) => {
          const Icon = metric.icon
          return (
            <div
              key={metric.label}
              className={`min-h-32 p-5 ${index ? 'border-t border-separator sm:border-l sm:border-t-0' : ''} ${index === 2 ? 'sm:border-l-0 sm:border-t xl:border-l xl:border-t-0' : ''}`}
            >
              <div className="flex items-center justify-between gap-2 text-xs font-medium text-muted">
                {metric.label}
                <Icon size={15} className="text-muted" />
              </div>
              <div className="mt-6">
                <div className="mono text-2xl font-semibold tracking-[-0.035em]">
                  {loading ? <SkeletonBlock className="h-8 w-28" /> : metric.value}
                </div>
                <div className="mt-1 text-[11px] leading-5 text-muted">
                  {loading ? <SkeletonBlock className="h-3 w-40" /> : metric.detail}
                </div>
              </div>
            </div>
          )
        })}
      </section>

      <Card data-gsap-reveal className="overflow-hidden p-0">
        <div className="flex items-center justify-between gap-3 border-b border-separator px-5 py-4">
          <div>
            <h3 className="font-semibold tracking-[-0.015em]">{t('usageChartTitle')}</h3>
            <p className="mt-0.5 text-xs text-muted">{t('usageChartHint')}</p>
          </div>
          <Chip size="sm" variant="soft" color="default">{formatCNY(totals.cost)}</Chip>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="grid h-72 place-items-center"><SkeletonBlock className="h-56 w-full" /></div>
          ) : hasData ? (
            <Suspense fallback={<div className="grid h-72 place-items-center"><SkeletonBlock className="h-56 w-full" /></div>}>
              <CostChart series={data.series} models={data.models} lang={lang} emptyLabel={t('usageChartEmpty')} />
            </Suspense>
          ) : (
            <EmptyPanel icon={<CurrencyCny size={22} />} title={t('usageEmpty')} hint={t('usageRetentionHint')} />
          )}
        </div>
      </Card>

      <Card data-gsap-reveal className="overflow-hidden p-0">
        <div className="flex items-center justify-between gap-3 border-b border-separator px-5 py-4">
          <div>
            <h3 className="font-semibold tracking-[-0.015em]">{t('usageBreakdownTitle')}</h3>
            <p className="mt-0.5 text-xs text-muted">{t('usageBreakdownHint')}</p>
          </div>
        </div>
        {loading ? (
          <div className="space-y-3 p-5">
            {[0, 1, 2].map((row) => <SkeletonBlock key={row} className="h-9 w-full" />)}
          </div>
        ) : !hasData ? (
          <EmptyPanel title={t('usageEmpty')} hint={t('usageRetentionHint')} />
        ) : (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label={t('usageBreakdownTitle')}>
                <Table.Header>
                  <Table.Column isRowHeader>{t('usageColModel')}</Table.Column>
                  <Table.Column>{t('usageColRequests')}</Table.Column>
                  <Table.Column>{t('usageColInputHit')}</Table.Column>
                  <Table.Column>{t('usageColInputMiss')}</Table.Column>
                  <Table.Column>{t('usageColOutput')}</Table.Column>
                  <Table.Column>{t('usageColTokens')}</Table.Column>
                  <Table.Column>{t('usageColSplit')}</Table.Column>
                  <Table.Column>{t('usageColCost')}</Table.Column>
                </Table.Header>
                <Table.Body>
                  {data.models.map((model) => (
                    <Table.Row key={model.id}>
                      <Table.Cell>
                        <div className="text-sm font-medium">{model.label}</div>
                        <div className="mono mt-0.5 text-[10px] text-muted">{model.id}</div>
                      </Table.Cell>
                      <Table.Cell><span className="mono text-xs">{model.requests}</span></Table.Cell>
                      <Table.Cell><span className="mono text-xs">{formatCompact(model.cache_hit)}</span></Table.Cell>
                      <Table.Cell><span className="mono text-xs">{formatCompact(model.cache_miss)}</span></Table.Cell>
                      <Table.Cell><span className="mono text-xs">{formatCompact(model.output)}</span></Table.Cell>
                      <Table.Cell><span className="mono text-xs">{formatCompact(model.total_tokens)}</span></Table.Cell>
                      <Table.Cell>
                        <span className="mono text-xs text-muted">{formatCNY(model.cost_peak)} / {formatCNY(model.cost_off_peak)}</span>
                      </Table.Cell>
                      <Table.Cell><span className="mono text-sm font-semibold">{formatCNY(model.cost)}</span></Table.Cell>
                    </Table.Row>
                  ))}
                  <Table.Row>
                    <Table.Cell><span className="text-sm font-semibold">{t('usageTotals')}</span></Table.Cell>
                    <Table.Cell><span className="mono text-xs font-semibold">{totals.requests}</span></Table.Cell>
                    <Table.Cell><span className="mono text-xs font-semibold">{formatCompact(totals.cache_hit)}</span></Table.Cell>
                    <Table.Cell><span className="mono text-xs font-semibold">{formatCompact(totals.cache_miss)}</span></Table.Cell>
                    <Table.Cell><span className="mono text-xs font-semibold">{formatCompact(totals.output)}</span></Table.Cell>
                    <Table.Cell><span className="mono text-xs font-semibold">{formatCompact(totals.total_tokens)}</span></Table.Cell>
                    <Table.Cell><span className="mono text-xs text-muted">{formatCNY(totals.cost_peak)} / {formatCNY(totals.cost_off_peak)}</span></Table.Cell>
                    <Table.Cell><span className="mono text-sm font-semibold">{formatCNY(totals.cost)}</span></Table.Cell>
                  </Table.Row>
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card data-gsap-reveal className="overflow-hidden p-0">
          <div className="border-b border-separator px-5 py-4">
            <h3 className="font-semibold tracking-[-0.015em]">{t('usagePriceTitle')}</h3>
            <p className="mt-0.5 text-xs text-muted">{t('usagePeakNote')}</p>
          </div>
          <div className="divide-y divide-separator">
            {(pricing?.models ?? []).map((model) => (
              <div key={model.id} className="px-5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-medium">{model.label}</div>
                  <span className="mono text-[10px] text-muted">{model.currency}</span>
                </div>
                <div className="mono mt-1 text-[10px] text-muted">{model.id}</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-lg bg-surface-secondary px-2.5 py-2">
                    <div className="text-[10px] text-muted">{t('usagePriceBandOff')}</div>
                    <div className="mono mt-0.5">{formatUnitPrice(model.off_peak.cache_hit)} · {formatUnitPrice(model.off_peak.cache_miss)} · {formatUnitPrice(model.off_peak.output)}</div>
                    <div className="mt-1 text-[9px] text-muted">{t('usagePriceHit')} · {t('usagePriceMiss')} · {t('usagePriceOutput')}</div>
                  </div>
                  <div className="rounded-lg bg-surface-secondary px-2.5 py-2">
                    <div className="text-[10px] text-muted">{t('usagePriceBandPeak')}</div>
                    <div className="mono mt-0.5">{formatUnitPrice(model.peak.cache_hit)} · {formatUnitPrice(model.peak.cache_miss)} · {formatUnitPrice(model.peak.output)}</div>
                    <div className="mt-1 text-[9px] text-muted">{t('usagePriceHit')} · {t('usagePriceMiss')} · {t('usagePriceOutput')}</div>
                  </div>
                </div>
              </div>
            ))}
            {!pricing?.models?.length ? (
              <div className="px-5 py-8 text-sm text-muted">{t('usageEmpty')}</div>
            ) : null}
          </div>
        </Card>

        <Card data-gsap-reveal className="overflow-hidden p-0">
          <div className="border-b border-separator px-5 py-4">
            <h3 className="font-semibold tracking-[-0.015em]">{t('usageNoteTitle')}</h3>
          </div>
          <div className="space-y-3 px-5 py-4 text-xs leading-6 text-muted">
            <p>{t('usageRenderNote')}</p>
            <p>{t('usageRetentionHint')}</p>
            <p>{t('usagePeakNote')}</p>
            {data.unpriced?.length ? <p>{t('usageUnpricedHint', { models: data.unpriced.join(', ') })}</p> : null}
            {pricing?.note ? <p className="mono text-[10px]">{pricing.note}</p> : null}
          </div>
        </Card>
      </div>
    </div>
  )
}
