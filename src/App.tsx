import CssBaseline from "@mui/material/CssBaseline"
import { createTheme, ThemeProvider } from "@mui/material/styles"
import TimelineComponent from "./components/timeline"
import SummaryBox from "./components/summaryBox"
import Header from "./components/header"
import { Box, Button, Grid, Icon, Paper } from "@mui/material"
import { useReducer } from "react"
import WalletComponent from "./components/wallet"
import BaseLogic from "./services/near"
import { getPage } from "./utils/navigation"
import { NavLink, Outlet, useParams } from "react-router-dom"
import PageComponent from "./components/page"
import { recipes } from "./recipes/recipes"

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
        updateApp: any
        updatePage: any
    }
}

const theme = createTheme({
    palette: {
        type: "light",
        primary: {
            main: "#8542eb",
            light: "#f6f2fd",
            dark: "#8542eb"
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

window.nearInitPromise = BaseLogic.initNear().then(window.updateApp)

export default function App() {
    return (
        <ThemeProvider theme={theme}>
            <Box
                sx={{
                    height: 1,
                    minWidth: "1150px",
                    display: "flex",
                    flexFlow: "column nowrap"
                }}
            >
                <CssBaseline />
                <Header />
                <Outlet />
            </Box>
        </ThemeProvider>
    )
}

export function RecipePage() {
    const params = useParams()
    const page = getPage()
    const [, forceUpdate] = useReducer(x => x + 1, 0)
    window.updateApp = forceUpdate
    if (!params.recipeId || parseInt(params.recipeId) === null) return <></>
    return (
        <>
            {page === 0 && params.recipeId === "1" ? <SummaryBox /> : <></>}
            <Grid
                container
                sx={{
                    width: 1,
                    height: 1,
                    flex: "1 1 0"
                }}
                className="main-container timeline-container"
                direction="row"
                justifyContent="center"
                alignItems="center"
                wrap="nowrap"
                position="sticky"
            >
                <Grid
                    item
                    container
                    className="nav-container"
                    direction="column"
                    alignItems="flex-end"
                    wrap="nowrap"
                    flexShrink={0}
                    sx={{
                        height: "fit-content",
                        ml: "2em"
                    }}
                    xs={2}
                >
                    <WalletComponent />
                    <TimelineComponent steps={recipes[parseInt(params.recipeId!)].steps} />
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
                    <Paper
                        className={"secondary-container-h" + (getPage() == 4 ? " secondary-container-h-last" : "")}
                        sx={{
                            width: 1,
                            // height: "fit-content",
                            display: "flex",
                            height: "40em",
                            my: "auto",
                            // minHeight: 1,
                            // mb: 4,
                            // "& > *": {
                            //     height: "unset !important"
                            // }
                        }}
                        elevation={2}
                    >
                        <PageComponent recipe={parseInt(params.recipeId!)} page={getPage()} />
                    </Paper>
                </Grid>
                {/* Empty item for design purposes */}
                <Grid item xs={2} sx={{ height: 0, flex: "1 1 0 !important" }} />
            </Grid>
        </>
    )
}

export function CatalogPage() {
    return (
        <Grid
            container
            sx={{
                width: 1,
                height: 1,
                flex: "1 1 0",
                overflowY: "scroll",
                mt: 20
            }}
            direction="column"
            alignItems="center"
            wrap="nowrap"
        >
            {recipes.map(r => (
                <Paper
                    sx={{
                        width: 0.5,
                        maxWidth: "800px",
                        height: "min-content",
                        mb: 4,
                        p: 2,
                        display: "flex",
                        flexFlow: "column nowrap",
                        position: "relative",
                        "&::before": {
                            content: "''",
                            position: "absolute",
                            left: "-6rem",
                            right: "calc(100% - 12px)",
                            top: "0",
                            bottom: "0",
                            zIndex: "-1",
                            borderRadius: "12px 0 0 12px",
                            background: theme.palette.primary.main,
                            opacity: 0.7
                        }
                    }}
                    elevation={2}
                >
                    <h1
                        style={{
                            position: "absolute",
                            left: "-6rem",
                            right: "100%",
                            top: "0",
                            bottom: "0.5em",
                            height: "fit-content",
                            textAlign: "center",
                            marginTop: "auto",
                            marginBottom: "auto",
                            color: theme.palette.primary.light
                        }}
                    >
                        {r.apy()}
                    </h1>
                    <span
                        style={{
                            position: "absolute",
                            left: "-6rem",
                            right: "100%",
                            bottom: "1em",
                            height: "fit-content",
                            textAlign: "center",
                            fontWeight: "900",
                            color: theme.palette.primary.light
                        }}
                    >
                        APY
                    </span>
                    <h3 style={{ marginTop: 0 }}>{r.title}</h3>
                    <div>{r.description}</div>
                    {r.comingsoon ? (
                        <Button
                            variant="outlined"
                            sx={{ borderRadius: "100px", position: "absolute", right: "16px", bottom: "16px" }}
                        >
                            COMING SOON!
                        </Button>
                    ) : (
                        <NavLink to={`/${r.id}`} key={r.id}>
                            <Button
                                variant="outlined"
                                sx={{ borderRadius: "100px", position: "absolute", right: "16px", bottom: "16px" }}
                                endIcon={<Icon>navigate_next</Icon>}
                            >
                                START
                            </Button>
                        </NavLink>
                    )}
                </Paper>
            ))}
        </Grid>
    )
}
