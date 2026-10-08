import './assets/tailwind.css'
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import i18n from './i18n'

document.documentElement.lang =
  i18n.global.locale.value === 'pt' ? 'pt-BR' : i18n.global.locale.value

const app = createApp(App)

app.use(router)
app.use(i18n)
app.mount('#app')
