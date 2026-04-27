import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // استيراد الإضافة الجديدة

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // تفعيل التيلويند هنا
  ],
})