import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { TroisJSVuePlugin } from 'troisjs'

createApp(App).use(TroisJSVuePlugin).mount('#app')
