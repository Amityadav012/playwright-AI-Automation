import { type Page, type Locator, expect } from '@playwright/test'

export class GlossaryPage {
  readonly path = '/glossary'

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
  englishenglish11(): Locator { return this.page.getByRole('button', { name: 'EnglishEnglish', exact: true }) }
  hindi12(): Locator { return this.page.getByRole('button', { name: 'Hindiहिन्दी', exact: true }) }
  assamese13(): Locator { return this.page.getByRole('button', { name: 'Assameseঅসমীয়া', exact: true }) }

  async goto(baseURL: string): Promise<void> {
    await this.page.goto(new URL(this.path, baseURL).toString(), { waitUntil: 'domcontentloaded' })
  }

  async expectLoaded(): Promise<void> {
    expect(new URL(this.page.url()).pathname).toBe(this.path)
  }
}