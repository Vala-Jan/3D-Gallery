# Jednoduchy lokalni webovy server pro 3D galerii.
# Nepotrebuje internet ani instalaci - vyuziva jen soucasti, ktere ma Windows uz v sobe.
# Spoustet pres spustit-galerii.bat, ne primo.

param(
    [int]$Port = 8080
)

$Root = $PSScriptRoot

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$Port/")

try {
    $listener.Start()
} catch {
    Write-Host "Port $Port je uz obsazeny (server pravdepodobne uz bezi)."
    Write-Host "Pokud galerie v prohlizeci nefunguje, zavrete toto i predchozi okno serveru a zkuste to znovu."
    Start-Sleep -Seconds 5
    exit 1
}

Write-Host "3D galerie bezi na http://localhost:$Port/"
Write-Host "Toto okno nechte otevrene, dokud chcete mit galerii spustenou."
Write-Host "Zavrenim tohoto okna server vypnete."

$mime = @{
    ".html" = "text/html; charset=utf-8"
    ".js"   = "application/javascript"
    ".mjs"  = "application/javascript"
    ".css"  = "text/css"
    ".json" = "application/json"
    ".glb"  = "model/gltf-binary"
    ".gltf" = "model/gltf+json"
    ".bin"  = "application/octet-stream"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".webp" = "image/webp"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2" = "font/woff2"
}

$rootFull = [IO.Path]::GetFullPath($Root)

while ($listener.IsListening) {
    $context = $null
    try {
        $context = $listener.GetContext()
    } catch {
        break
    }

    $request = $context.Request
    $response = $context.Response

    try {
        $urlPath = [Uri]::UnescapeDataString($request.Url.LocalPath)
        if ($urlPath -eq "/") { $urlPath = "/index.html" }

        $relative = $urlPath.TrimStart("/") -replace "/", [IO.Path]::DirectorySeparatorChar
        $filePath = [IO.Path]::GetFullPath((Join-Path $Root $relative))

        if (-not $filePath.StartsWith($rootFull)) {
            $response.StatusCode = 403
        } elseif (Test-Path -LiteralPath $filePath -PathType Leaf) {
            $ext = [IO.Path]::GetExtension($filePath).ToLower()
            $contentType = $mime[$ext]
            if (-not $contentType) { $contentType = "application/octet-stream" }

            $bytes = [IO.File]::ReadAllBytes($filePath)
            $response.ContentType = $contentType
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
        }
    } catch {
        try { $response.StatusCode = 500 } catch {}
    } finally {
        $response.OutputStream.Close()
    }
}
