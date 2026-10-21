import { type Page, type Locator, type Request, expect } from '@playwright/test'

export type Language = 'English' | 'Hindi' | 'Assamese'
export const LANGUAGE_CODES: Record<Language, string> = { English: 'en', Hindi: 'hi', Assamese: 'as' }
export const KPI_LABELS = ['Quantity in MLD', 'Quantity in LPCD', 'Regularity'] as const
export const STATE_KPI_LABELS = ['Schemes Supplying Water', 'Quantity in MLD', 'Quantity in LPCD', 'Regularity', 'Critical Schemes'] as const
export const SUMMARY_METRIC_COLUMNS = ['Regularity (%)', 'Quantity (MLD)', 'Quantity (LPCD)', 'Household'] as const
export const QUICK_RANGES = ['Today', 'Yesterday', 'This week', 'Last week', 'This month', 'Last month'] as const

const API = '/api/v1/analytics/'

/** dd/mm/yyyy for a local Date. */
export function ddmmyyyy(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

/** dd/mm/yyyy -> yyyy-mm-dd */
export function toIso(display: string): string {
  const [dd, mm, yyyy] = display.split('/')
  return `${yyyy}-${mm}-${dd}`
}

/** Parses Indian-grouped numbers and percentages ("54,22,016", "0.0%", "-66.7%"). */
export function parseNumber(text: string): number {
  const n = Number(text.replace(/[,%\s]/g, '').replace(/[^\d.-]/g, ''))
  if (Number.isNaN(n)) throw new Error(`Not a number: "${text}"`)
  return n
}

export class DashboardPage {
  constructor(readonly page: Page) {}

  // ---------- navigation ----------
  async goto(path = '/'): Promise<void> {
    await this.page.goto(path, { waitUntil: 'domcontentloaded' })
    await this.waitForData()
  }

  async waitForData(): Promise<void> {
    // Language-independent readiness: the filter bar has rendered and no widget is still loading.
    await expect(this.search()).toBeVisible({ timeout: 30_000 })
    await expect(this.main().getByText(/^Loading/)).toHaveCount(0, { timeout: 30_000 })
  }

  /** Records analytics API requests made while the page is in use. */
  trackAnalytics(): string[] {
    const urls: string[] = []
    this.page.on('request', (r: Request) => { if (r.url().includes(API)) urls.push(r.url()) })
    return urls
  }

  // ---------- header & language ----------
  header(): Locator { return this.page.getByRole('banner') }
  logoLink(): Locator { return this.header().getByRole('link') }
  logoImage(): Locator { return this.header().getByRole('img') }
  subtitle(): Locator { return this.header().getByRole('paragraph').first() }
  languageButton(): Locator { return this.page.getByRole('button', { name: 'Change language' }) }
  languageMenu(): Locator { return this.page.getByRole('menu').filter({ has: this.page.getByRole('menuitem', { name: /Hindi/ }) }) }
  languageOptions(): Locator { return this.languageMenu().getByRole('menuitem') }
  languageOption(language: Language): Locator { return this.page.getByRole('menuitem', { name: new RegExp(`^${language}`) }) }

  async selectLanguage(language: Language): Promise<void> {
    await this.languageButton().click()
    await this.languageOption(language).click()
    await expect.poll(() => this.storedLanguage()).toBe(LANGUAGE_CODES[language])
  }

  storedLanguage(): Promise<string | null> {
    return this.page.evaluate(() => localStorage.getItem('i18nextLng'))
  }

  // ---------- filters ----------
  main(): Locator { return this.page.getByRole('main') }
  search(): Locator { return this.main().getByRole('textbox').first() }
  searchOptions(): Locator { return this.page.getByTestId('search-options-grid') }
  searchOption(name: string): Locator { return this.searchOptions().getByRole('button', { name, exact: true }) }
  closeSearch(): Locator { return this.page.getByRole('button', { name: 'Close search dropdown' }) }
  modeTab(name: 'Administrative' | 'Departmental'): Locator { return this.page.getByRole('tab', { name }) }
  breadcrumb(name: string): Locator { return this.page.getByRole('button', { name: `Breadcrumb: ${name}` }) }
  clearBreadcrumb(name: string): Locator { return this.page.getByRole('button', { name: `Clear breadcrumb ${name}` }) }
  clearAllFilters(): Locator { return this.page.getByRole('button', { name: 'Clear all filters' }) }
  /** Heading above the search options, e.g. "Districts (36)". */
  optionsHeading(): Locator { return this.main().getByText(/^[A-Za-z/ ]+ \(\d+\)$/) }
  breadcrumbs(): Locator { return this.page.getByRole('button', { name: /^Breadcrumb: / }) }

  async openSearch(): Promise<void> {
    if (!(await this.searchOptions().isVisible())) await this.search().click()
    await expect(this.searchOptions()).toBeVisible()
  }

  /** Picks a geography from the search dropdown and waits for the URL to reflect it. */
  async selectGeography(name: string): Promise<void> {
    await this.openSearch()
    const before = this.page.url()
    await this.searchOption(name).click()
    await expect.poll(() => this.page.url()).not.toBe(before)
    await expect(this.breadcrumb(name).last()).toBeVisible()
  }

  durationButton(): Locator { return this.page.getByRole('button', { name: 'Duration' }) }
  durationPanel(): Locator { return this.page.getByRole('dialog').filter({ hasText: 'Quick ranges' }) }
  startInput(): Locator { return this.durationPanel().getByRole('textbox').nth(0) }
  endInput(): Locator { return this.durationPanel().getByRole('textbox').nth(1) }
  applyButton(): Locator { return this.durationPanel().getByRole('button', { name: 'Apply' }) }
  clearButton(): Locator { return this.durationPanel().getByRole('button', { name: 'Clear' }) }
  quickRange(name: string): Locator { return this.durationPanel().getByRole('button', { name, exact: true }) }

  async openDuration(): Promise<void> {
    if (!(await this.durationPanel().isVisible())) await this.durationButton().click()
    await expect(this.durationPanel()).toBeVisible()
  }

  /** Dismisses the panel without applying by clicking outside it (Escape is ignored while an input has focus). */
  async closeDuration(): Promise<void> {
    await this.header().click({ position: { x: 5, y: 5 } })
    await expect(this.durationPanel()).toBeHidden()
  }

  async enterRange(start: string, end: string): Promise<void> {
    await this.openDuration()
    await this.startInput().fill(start)
    await this.endInput().fill(end)
  }

  async applyRange(start: string, end: string): Promise<void> {
    await this.enterRange(start, end)
    await expect(this.applyButton()).toBeEnabled()
    await this.applyButton().click()
    await expect(this.durationPanel()).toBeHidden()
  }

  async selectQuickRange(name: string): Promise<void> {
    await this.openDuration()
    await this.quickRange(name).click()
  }

  storedFilters(): Promise<Record<string, unknown>> {
    return this.page.evaluate(() => JSON.parse(localStorage.getItem('central-dashboard-filters') ?? '{}'))
  }

  // ---------- KPI cards ----------
  kpiCard(label: string): Locator {
    return this.main().getByText(label, { exact: true }).first().locator('xpath=ancestor::div[.//button[@aria-label="More info"]][1]')
  }

  async kpi(label: string): Promise<{ value: string, comparison: string | null }> {
    const lines = (await this.kpiCard(label).innerText()).split('\n').map(s => s.trim()).filter(Boolean)
    const idx = lines.indexOf(label)
    return { value: lines[idx + 1], comparison: lines.find(l => / vs previous /.test(l)) ?? null }
  }

  // ---------- map ----------
  mapLegend(): Locator { return this.page.getByRole('list', { name: 'Map value ranges' }) }
  mapMetricSwitch(): Locator { return this.page.getByRole('checkbox', { name: /^Switch map metric/ }) }
  mapViewButton(name: 'State View' | 'District View'): Locator { return this.page.getByRole('group', { name: 'Map view' }).getByRole('button', { name }) }
  showFullscreen(): Locator { return this.page.getByRole('button', { name: 'Show fullscreen map' }) }
  exitFullscreen(): Locator { return this.page.getByRole('button', { name: 'Exit fullscreen map' }) }
  fullscreenDialog(): Locator { return this.page.getByRole('dialog').filter({ has: this.exitFullscreen() }) }
  /** The labelled map image listing every region drawn on the map. */
  mapImage(): Locator { return this.main().getByRole('img').filter({ hasNotText: /^$/ }).filter({ has: this.page.locator('svg, path') }).first() }

  mapCard(): Locator { return this.showFullscreen().locator('xpath=ancestor::div[.//*[@aria-label="Map value ranges"]][1]') }
  mapRegion(name: string): Locator { return this.mapCard().locator('svg text').filter({ hasText: new RegExp(`^${name}$`) }) }

  async mapRegions(scope: Locator = this.mapCard()): Promise<string[]> {
    return scope.locator('svg text').evaluateAll(es => es.map(e => (e.textContent ?? '').trim()).filter(Boolean))
  }

  async selectedMapMetric(): Promise<string> {
    return (await this.mapMetricSwitch().first().getAttribute('aria-label'))!.replace(/^.*Currently selected: /, '')
  }

  // ---------- performance summary ----------
  /** The Performance Summary table; district scope also renders a scheme performance table after it. */
  summaryTable(): Locator { return this.main().getByRole('table').first() }
  summaryRows(): Locator { return this.summaryTable().locator('tbody tr') }
  sortButton(column: string): Locator { return this.summaryTable().getByRole('button', { name: column, exact: true }) }
  columnHeader(column: string): Locator { return this.summaryTable().getByRole('columnheader', { name: column, exact: true }) }
  summaryRow(name: string): Locator { return this.summaryRows().filter({ has: this.page.getByRole('cell', { name, exact: true }) }) }

  async summaryHeaders(): Promise<string[]> {
    return this.summaryTable().getByRole('columnheader').allInnerTexts().then(a => a.map(s => s.trim()))
  }

  async summaryRecords(): Promise<string[][]> {
    return this.summaryRows().evaluateAll(rows => rows.map(r => Array.from(r.querySelectorAll('td')).map(td => (td.textContent ?? '').trim())))
  }

  // ---------- charts ----------
  chartCard(title: string): Locator {
    return this.main().getByText(title, { exact: true }).locator('xpath=ancestor::div[.//*[@_echarts_instance_]][1]')
  }
  chartViewBy(chart: 'Regularity' | 'Quantity'): Locator {
    return this.page.getByRole('button', { name: new RegExp(`${chart} performance view by$`, 'i') })
  }
  async selectChartView(chart: 'Regularity' | 'Quantity', view: 'Geography' | 'Time'): Promise<void> {
    await this.chartViewBy(chart).click()
    await this.page.getByRole('menuitem', { name: view, exact: true }).filter({ visible: true }).click()
    await expect(this.chartViewBy(chart)).toHaveText(view)
  }
  async chartTexts(title: string): Promise<string[]> {
    return this.chartCard(title).locator('[_echarts_instance_] text').evaluateAll(es => es.map(e => (e.textContent ?? '').trim()).filter(Boolean))
  }
  /** The plot canvas; each bar chart also has a narrow fixed y-axis instance before it. */
  chartCanvas(title: string): Locator { return this.chartCard(title).locator('[_echarts_instance_]').last().locator('canvas').first() }
  chartScale(name: 'Day' | 'Week' | 'Month' | 'Quarter' | 'Year'): Locator { return this.page.getByRole('button', { name, exact: true }) }

  /** Number of painted (non-transparent) pixels on a chart canvas. */
  async chartPaintedPixels(title: string): Promise<number> {
    return this.chartCanvas(title).evaluate((c: HTMLCanvasElement) => {
      const { data } = c.getContext('2d')!.getImageData(0, 0, c.width, c.height)
      let painted = 0
      for (let i = 3; i < data.length; i += 4) if (data[i] > 0) painted++
      return painted
    })
  }

  /** Sweeps the pointer across the visible part of the (horizontally scrollable) plot and collects ECharts tooltip texts. */
  async chartTooltips(title: string, steps = 10, yRatios: number[] = [0.7]): Promise<string[]> {
    await this.chartCard(title).scrollIntoViewIfNeeded()
    const card = (await this.chartCard(title).boundingBox())!
    const plot = (await this.chartCanvas(title).boundingBox())!
    const [x0, x1] = [Math.max(card.x, plot.x), Math.min(card.x + card.width, plot.x + plot.width)]
    const texts = new Set<string>()
    for (let i = 1; i < steps; i++) {
      for (const yRatio of yRatios) {
        await this.page.mouse.move(x0 + ((x1 - x0) * i) / steps, plot.y + plot.height * yRatio)
        await this.page.waitForTimeout(150)
        const visible = await this.chartCard(title).locator('div[style*="z-index: 9999999"]').evaluateAll(ds =>
          ds.filter(d => getComputedStyle(d).visibility === 'visible').map(d => (d as HTMLElement).innerText.trim()))
        visible.filter(Boolean).forEach(t => texts.add(t))
      }
    }
    await this.page.mouse.move(0, 0)
    return [...texts]
  }

  /** Scrolls a horizontally scrollable chart to its far end. */
  async scrollChartToEnd(title: string): Promise<void> {
    await this.chartCanvas(title).evaluate(canvas => {
      let el: HTMLElement | null = canvas.parentElement
      while (el && el.scrollWidth <= el.clientWidth + 1) el = el.parentElement
      if (el) el.scrollLeft = el.scrollWidth
    })
  }

  loadError(): Locator { return this.main().getByText('Failed to load data. Please reload the page.') }

  // ---------- footer ----------
  footerLink(name: string): Locator { return this.page.getByRole('link', { name, exact: true }) }
  copyright(): Locator { return this.page.getByText(/© \d{4} JalSoochak/) }

  // ---------- helpers ----------
  async hasHorizontalOverflow(): Promise<boolean> {
    return this.page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1)
  }

  /** Elements whose text is cut off (scrollWidth exceeds clientWidth) within a container, ignoring scroll containers. */
  async clippedText(container: Locator): Promise<string[]> {
    return container.evaluate(root => Array.from(root.querySelectorAll<HTMLElement>('p, button, a, th, td, span'))
      .filter(e => {
        const s = getComputedStyle(e)
        if (s.overflowX === 'auto' || s.overflowX === 'scroll' || e.clientWidth === 0) return false
        return (s.overflow === 'hidden' || s.textOverflow === 'ellipsis') && e.scrollWidth > e.clientWidth + 1
      })
      .map(e => (e.textContent ?? '').trim()))
  }
}
