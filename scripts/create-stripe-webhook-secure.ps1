$ErrorActionPreference = "Stop"

Write-Host "Paste your Stripe secret key into the hidden prompt. It will not be printed or written to disk."
Write-Host "This creates the Panda Notes Stripe webhook and stores only the webhook signing secret in Vercel."

$secureSecret = Read-Host "Stripe secret key" -AsSecureString
$secretPointer = [IntPtr]::Zero
$plainSecret = $null

try {
  $secretPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureSecret)
  $plainSecret = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer)

  if ([string]::IsNullOrWhiteSpace($plainSecret) -or -not $plainSecret.StartsWith("sk_")) {
    throw "That does not look like a Stripe secret key. It should start with sk_test_ or sk_live_."
  }

  if (-not $env:PANDA_NOTES_STRIPE_WEBHOOK_URL) {
    $env:PANDA_NOTES_STRIPE_WEBHOOK_URL = "https://panda-notes-smoky.vercel.app/api/stripe-webhook"
  }

  $env:STRIPE_SECRET_KEY = $plainSecret
  npm.cmd run stripe:webhook

  if ($LASTEXITCODE -ne 0) {
    throw "Stripe webhook creation failed."
  }
} finally {
  if ($secretPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secretPointer)
  }

  Remove-Item Env:\STRIPE_SECRET_KEY -ErrorAction SilentlyContinue
  $plainSecret = $null

  if ($secureSecret) {
    $secureSecret.Dispose()
  }
}
