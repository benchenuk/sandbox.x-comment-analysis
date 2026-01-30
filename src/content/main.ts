import { createApp } from 'vue'
import App from './App.vue'
import './styles/content.css'

const mountPoint = document.createElement('div')
mountPoint.id = 'x-thread-analyzer-root'
document.body.appendChild(mountPoint)

const app = createApp(App)
app.mount(mountPoint)