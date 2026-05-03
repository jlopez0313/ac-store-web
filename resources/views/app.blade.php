<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">

<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description"
        content="{{ config('app.name') }} - Sistema premium de gestión de inventarios, ventas y muestras para comercios modernos. Optimiza tu operación logística con tecnología de punta.">
    <meta name="keywords"
        content="{{ config('app.name') }}, gestión de inventario, ventas, muestras, logística, ecommerce, retail, administración de bodegas, bodegas, locales, distribuidores, marcas, productos, inventario">
    <meta name="author" content="{{ config('app.name') }} Team">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="{{ config('app.url') }}">
    <meta property="og:title" content="{{ config('app.name') }} | Gestión Inteligente de Inventarios">
    <meta property="og:description"
        content="Optimiza tus ventas y controla tu stock en tiempo real con {{ config('app.name') }}. La plataforma diseñada para el crecimiento de tu negocio.">
    <meta property="og:image" content="{{ asset('img/og-image.png') }}">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="{{ config('app.url') }}">
    <meta property="twitter:title" content="{{ config('app.name') }} | Gestión Inteligente de Inventarios">
    <meta property="twitter:description"
        content="Optimiza tus ventas y controla tu stock en tiempo real con {{ config('app.name') }}.">
    <meta property="twitter:image" content="{{ asset('img/og-image.png') }}">

    <title inertia>{{ config('app.name', 'AC-Store') }}</title>

    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

    @routes
    @viteReactRefresh
    @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
    @inertiaHead
</head>

<body class="antialiased">
    @inertia
</body>

</html>