import React from "react"
import ReactDOM from "react-dom"
import "./index.css"
import reportWebVitals from "./reportWebVitals"
import App, { CatalogPage, RecipePage } from "./App"
import * as buffer from "buffer"
import { BrowserRouter, Route, Routes } from "react-router-dom"
;(window as any).Buffer = buffer.Buffer // https://github.com/isaacs/core-util-is/issues/27#issuecomment-878969583

ReactDOM.render(
    <React.StrictMode>
        <BrowserRouter basename="/dapp/mainnet/meta-recipes">
            <Routes>
                <Route path="/" element={<App />}>
                    <Route path="/" element={<CatalogPage />} />
                    {/* <Route path=":recipeId" element={<RecipePage />} /> */}
                </Route>
            </Routes>
        </BrowserRouter>
    </React.StrictMode>,
    document.getElementById("root")
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
