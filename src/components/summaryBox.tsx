import { useState, useEffect } from "react"
import Box from "@mui/material/Box"
import { Grid } from "@mui/material"
import OctopusLogo from "../public/octopus_logo.png"
// const NoCorsProxy = require("no-cors-proxy")
// const port = 3000
// const host = "localhost"

export default function SummaryBox() {
    const [percentage, setPercentage] = useState(29)

    async function getFarmAPR(): Promise<string> {
        const narwalletsResponse: Response = await fetch("https://validators.narwallets.com/metrics_json")
        const jsonResponse = await narwalletsResponse.json()
        return jsonResponse.ref_oct_st_near_apr
    }
    useEffect(() => {
        async function getPercentage() {
            try {
                let percentage = Number(await getFarmAPR())
                if (isNaN(percentage) || percentage === 0) {
                    percentage = 25
                }
                setPercentage(percentage)
            } catch (ex) {
                console.log("Error obtaining the APR")
                // alert("Error")
            }
        }
        getPercentage()
    }, [percentage])
    return (
        <Grid className="title">
            <Box className="main-title">Go from 0% to {(11 + percentage).toFixed(2)}% APY</Box>
            <Box className="secondary-title">
                <Box>Get now 11% by stNEAR and </Box>
                <Box>{percentage}% extra in the Farm!</Box>
            </Box>
            <Box component="span">
                <Box className="tertiary-title" component="span">
                    The Octopus’ new Farm!{" "}
                </Box>
                <Box className="oct-logo" component="span">
                    <img className="octopus-logo" src={OctopusLogo} alt=""></img>
                </Box>
            </Box>
        </Grid>
    )
}
