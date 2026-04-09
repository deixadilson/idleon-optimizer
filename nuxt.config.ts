// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: ['~/assets/css/main.css'],
  routeRules: {
    '/**/*.png': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/**/*.jpg': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/**/*.svg': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    '/**/*.webp': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } }
  }
})
