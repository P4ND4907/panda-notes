$ErrorActionPreference = "Stop"

Write-Host "Paste your Stripe secret key into the hidden prompt. It will not be printed or written to disk."
Write-Host "Only public Stripe Payment Link URLs will be saved to public/stripe-links.json."

$secureSecret = Read-Host "Stripe secret key" -AsSecureString
$secretPointer = [IntPtr]::Zero
$plainSecret = $null

try {
  $secretPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureSecret)
  $plainSecret = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secretPointer)

  if ([string]::IsNullOrWhiteSpace($plainSecret) -or -not $plainSecret.StartsWith("sk_")) {
    throw "That does not look like a Stripe secret key. It should start with sk_test_ or sk_live_."
  }

  if (-not $env:PANDA_NOTES_BASE_URL) {
    $env:PANDA_NOTES_BASE_URL = "https://p4nd4907.github.io/panda-notes/"
  }

  $env:STRIPE_SECRET_KEY = $plainSecret
  npm.cmd run stripe:links

  if ($LASTEXITCODE -ne 0) {
    throw "Stripe link creation failed."
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
