import CssBaseline from "@mui/material/CssBaseline"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import TimelineComponent from "./components/timeline"
import PaperComponent from "./components/paper"
import SummaryBox from "./components/summaryBox"
import Header from "./components/header"
import { Grid } from "@mui/material"
import { useReducer } from "react"
import { Refresh } from "./utils/refresh"
import WalletComponent from "./components/wallet"
import { initNear } from "./services/near"
import { getPage } from "./utils/navigation"

declare module "@mui/material/styles/createPalette" {
    interface Palette {
        type: string
    }
    interface PaletteOptions {
        type?: string
    }
}

declare global {
    interface Window {
        FORCEUPDATE: any
        REFRESHER: Refresh[]
        EMPTY_REFRESH: Refresh
    }
}

const theme = createTheme({
    palette: {
        type: "light",
        primary: {
            main: "#8542eb",
            light: "#f6f2fd",
            dark: "rgba(133,66,235,0.4392156862745098)"
        },
        secondary: {
            main: "#4bc7ef"
        },
        background: {
            default: "#f8f9fa",
            paper: "#ffffff"
        },
        warning: {
            main: "#f9ba37"
        },
        success: {
            main: "#5ace84"
        },
        info: {
            main: "#4bc7ef"
        }
    },
    typography: {
        fontFamily: "Inter"
    },
    shape: {
        borderRadius: 12
    },
    spacing: 8
})

window.nearInitPromise = initNear().then(window.FORCEUPDATE)

export default function App() {
    const [, forceUpdate] = useReducer(x => x + 1, 0)
    window.FORCEUPDATE = forceUpdate
    const page = getPage()
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Header />
            <SummaryBox page={page} />
            <Grid
                // container
                // sx={{
                //     width: 1,
                //     height: 1
                // }}
                className="main-container"
                justifyContent="center"
                wrap="nowrap"
                marginTop="2%"
                position="sticky"
            >
                <Grid
                    item
                    container
                    className="nav-container"
                    direction="column"
                    alignItems="flex-end"
                    wrap="nowrap"
                    xs={2}
                    sx={{
                        ml: "2em"
                    }}
                >
                    <WalletComponent />
                    <TimelineComponent />
                </Grid>
                <Grid
                    item
                    className="secondary-container"
                    sx={{
                        height: 0.5,
                        minHeight: "25rem",
                        flexBasis: "50rem",
                        flexShrink: 0,
                        width: 0.5
                    }}
                >
                    <PaperComponent />
                </Grid>
                {/* Empty item for design purposes */}
                <Grid item xs={2} />
            </Grid>
        </ThemeProvider>
    )
}
