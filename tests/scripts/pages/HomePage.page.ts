import { type Page, type Locator, expect } from '@playwright/test'

export class HomePage {
  readonly path = '/'

  constructor(readonly page: Page) {}

  jalsoochakLogoWithText0(): Locator { return this.page.locator('a[href="/"]') }
  xTwitter1(): Locator { return this.page.locator('a[href="https://x.com/arghyamindia"]') }
  linkedin2(): Locator { return this.page.locator('a[href="https://www.linkedin.com/company/arghyam/"]') }
  email3(): Locator { return this.page.locator('a[href="mailto:info@arghyam.org"]') }
  subDivisionalOfficerLogin4(): Locator { return this.page.locator('a[href="/staff/login"]') }
  sectionOfficerLogin5(): Locator { return this.page.locator('a[href="/staff/login"]') }
  systemUsersLogin6(): Locator { return this.page.locator('a[href="/login"]') }
  jalsoochakWebsite7(): Locator { return this.page.locator('a[href="https://jalsoochak.in/"]') }
  dashboardGlossary8(): Locator { return this.page.locator('a[href="/glossary"]') }
  arghyam9(): Locator { return this.page.locator('a[href="https://arghyam.org/"]') }
  changeLanguage10(): Locator { return this.page.getByRole('button', { name: 'Change language', exact: true }) }
  element0810202611(): Locator { return this.page.getByRole('button', { name: 'Duration', exact: true }) }
  moreInfo12(): Locator { return this.page.getByRole('button', { name: 'More info', exact: true }) }
  stateView13(): Locator { return this.page.getByRole('button', { name: 'State View', exact: true }) }
  districtView14(): Locator { return this.page.getByRole('button', { name: 'District View', exact: true }) }
  showFullscreenMap15(): Locator { return this.page.getByRole('button', { name: 'Show fullscreen map', exact: true }) }
  stateUt16(): Locator { return this.page.getByRole('button', { name: 'State/UT', exact: true }) }
  regularity17(): Locator { return this.page.getByRole('button', { name: 'Regularity (%)', exact: true }) }
  quantityMld18(): Locator { return this.page.getByRole('button', { name: 'Quantity (MLD)', exact: true }) }
  quantityLpcd19(): Locator { return this.page.getByRole('button', { name: 'Quantity (LPCD)', exact: true }) }
  household20(): Locator { return this.page.getByRole('button', { name: 'Household', exact: true }) }
  assam00000520740921(): Locator { return this.page.getByRole('button', { name: 'Assam\n	0.0%	0.0	0	52,07,409', exact: true }) }
  uttarPradesh00000022(): Locator { return this.page.getByRole('button', { name: 'Uttar Pradesh\n	0.0%	0.0	0	0', exact: true }) }
  uttarakhand00000023(): Locator { return this.page.getByRole('button', { name: 'Uttarakhand\n	0.0%	0.0	0	0', exact: true }) }
  karnataka00000024(): Locator { return this.page.getByRole('button', { name: 'Karnataka\n	0.0%	0.0	0	0', exact: true }) }
  regularityPerformanceInfo25(): Locator { return this.page.getByRole('button', { name: 'Regularity Performance info', exact: true }) }
  geography26(): Locator { return this.page.getByRole('button', { name: 'Regularity performance view by', exact: true }) }
  quantityPerformanceInfo27(): Locator { return this.page.getByRole('button', { name: 'Quantity Performance info', exact: true }) }
  geography28(): Locator { return this.page.getByRole('button', { name: 'Quantity performance view by', exact: true }) }
  englishenglish11(): Locator { return this.page.getByRole('button', { name: 'EnglishEnglish', exact: true }) }
  hindi12(): Locator { return this.page.getByRole('button', { name: 'Hindiहिन्दी', exact: true }) }
  assamese13(): Locator { return this.page.getByRole('button', { name: 'Assameseঅসমীয়া', exact: true }) }
  today16(): Locator { return this.page.getByRole('button', { name: 'Today', exact: true }) }
  yesterday17(): Locator { return this.page.getByRole('button', { name: 'Yesterday', exact: true }) }
  thisWeek18(): Locator { return this.page.getByRole('button', { name: 'This week', exact: true }) }
  lastWeek19(): Locator { return this.page.getByRole('button', { name: 'Last week', exact: true }) }
  clear22(): Locator { return this.page.getByRole('button', { name: 'Clear', exact: true }) }
  apply23(): Locator { return this.page.getByRole('button', { name: 'Apply', exact: true }) }
  clearAllFilters24(): Locator { return this.page.getByRole('button', { name: 'Clear all filters', exact: true }) }
  geography36(): Locator { return this.page.getByRole('button', { name: 'Geography', exact: true }) }
  time37(): Locator { return this.page.getByRole('button', { name: 'Time', exact: true }) }
  geography40(): Locator { return this.page.getByRole('button', { name: 'Geography', exact: true }) }
  time41(): Locator { return this.page.getByRole('button', { name: 'Time', exact: true }) }
  switchMapMetricCurrentlySelectedRegularity42(): Locator { return this.page.getByRole('textbox', { name: 'Switch map metric. Currently selected: Regularity', exact: true }) }
  ddMmYyyy52(): Locator { return this.page.getByRole('textbox', { name: 'dd/mm/yyyy', exact: true }) }
  ddMmYyyy54(): Locator { return this.page.getByRole('textbox', { name: 'dd/mm/yyyy', exact: true }) }

  async goto(baseURL: string): Promise<void> {
    await this.page.goto(new URL(this.path, baseURL).toString(), { waitUntil: 'domcontentloaded' })
  }

  async expectLoaded(): Promise<void> {
    expect(new URL(this.page.url()).pathname).toBe(this.path)
  }
}