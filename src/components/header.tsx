import * as React from "react"
import { Grid, Button, Icon, Box } from "@mui/material"
import RecipesLogo from "../public/logo.png"
import { NavLink } from "react-router-dom"
export default function Header() {
    return (
        <Grid
            className="header"
            sx={{
                m: 4
            }}
        >
            <header>
                {/* <NavLink to={"/"}> */}
                <a href={`${window.location.href.split("?")[0]}`}>
                    <img className="logo" src={RecipesLogo} alt=""></img>
                </a>
                {/* </NavLink> */}
                <Box className="back" component="span" justifyContent="flex-end">
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
