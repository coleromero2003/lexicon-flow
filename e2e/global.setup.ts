import { clerk, clerkSetup } from '@clerk/testing/playwright'
import { test as setup } from '@playwright/test'
import path from 'path'

setup.describe.configure({ mode: 'serial' })

setup('global setup', async ({}) => {
  await clerkSetup()
})

const authFile = path.join(__dirname, '../e2e/.clerk/user.json')

setup('authenticate and save state to storage', async ({ page }) => {
  // Perform authentication steps.
  // This example uses a Clerk helper to authenticate
  await page.goto('/')
  await clerkSetup()
  await clerk.signIn({
    page,
    signInParams: {
      strategy: 'password',
      identifier: process.env.E2E_CLERK_USER_USERNAME!,
      password: process.env.E2E_CLERK_USER_PASSWORD!,
    },
  })
  await page.goto('/dashboard')
  // Ensure the user has successfully accessed the protected page
  // by checking an element on the page that only the authenticated user can access
  await page.waitForSelector("h1:has-text('Projects')")

  await page.context().storageState({ path: authFile })
})


