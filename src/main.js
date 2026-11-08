import { createApp } from 'vue'
import './style.css'
import './styles/tokens.css'
import App from './App.vue'
import { finishBoot } from './lib/boot'
import { TroisJSVuePlugin } from 'troisjs'

createApp(App).use(TroisJSVuePlugin).mount('#app')
finishBoot()
