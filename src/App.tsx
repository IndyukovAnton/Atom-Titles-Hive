import { Routes, Route } from "react-router-dom"
import '@/assets/css/App.css'

import { LayoutPage } from "@/layouts/layoutPage"
import { HomePage } from "@/pages/pageHome"

function App() {
  return (
    <Routes>
      <Route path="/" element={ <LayoutPage />}>
        <Route index element={ <HomePage />}></Route>
      </Route>
    </Routes>
  )
}

export default App
