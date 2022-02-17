import * as React from "react"
import { Grid, useTheme, Button, Icon, Box } from "@mui/material"
import RecipesLogo from "../public/logo.svg"
export default function Header() {
    const theme = useTheme() as any
    return (
        <Grid sx={{ margin: 4 }}>
            <header>
                <img src={RecipesLogo} alt=""></img>
                <Box component="span" justifyContent="flex-end">
                    <Button
                        variant="outlined"
                        sx={{
                            borderRadius: "100px",
                            float: "right",
                            textTransform: "capitalize"
                        }}
                        href="https://metapool.app/"
                        startIcon={<Icon>arrow_back_ios</Icon>}
                    >
                        Back to Meta Pool
                    </Button>
                </Box>
            </header>
        </Grid>
    )
}
