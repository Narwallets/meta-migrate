import { useState, useEffect } from "react"
import Box from "@mui/material/Box"
import { Grid } from "@mui/material"
import OctopusLogo from "../public/octopus_logo.png"
// const NoCorsProxy = require("no-cors-proxy")
// const port = 3000
// const host = "localhost"

export default function SummaryBox() {
    const [percentage, setPercentage] = useState(29)
    const [percentageStNear, setPercentageStNear] = useState(11)

    async function getMetapoolMetrics(): Promise<any> {
        const narwalletsResponse: Response = await fetch("https://validators.narwallets.com/metrics_json", {
            headers: {
                "Access-Control-Allow-Origin": window.location.href
            }
        })
        const jsonResponse = await narwalletsResponse.json()
        return jsonResponse
    }
    useEffect(() => {
        async function getPercentage() {
            try {
                let percentage = Number((await getMetapoolMetrics())?.ref_oct_st_near_apr)
                if (isNaN(percentage) || percentage === 0) {
                    percentage = 25
                }
                setPercentage(percentage)
            } catch (ex) {
                console.log("Error obtaining the APR")
                // alert("Error")
            }
        }
        async function getPercentageStNear() {
            try {
                let percentage = Number((await getMetapoolMetrics()).st_near_30_day_apy)
                if (isNaN(percentage) || percentage === 0) {
                    percentage = 11
                }
                setPercentageStNear(percentage)
            } catch (ex) {
                console.log("Error obtaining the APR")
                // alert("Error")
            }
        }

        getPercentage()
        getPercentageStNear()
    }, [percentage, percentageStNear])
    return (
        <Grid className="title">
            <Box className="main-title">Go from 0% to {(percentageStNear / 2 + percentage).toFixed(2)}% APY</Box>
            <Box className="secondary-title">
                <Box>Get now {percentageStNear}% stNEAR APY (half) and </Box>
                <Box>{percentage}% extra in the Farm!</Box>
            </Box>
            {/* <Box className="secondary-title">Half of {percentageStNear}% + {percentage}% = {percentageStNear / 2 + percentage}%</Box> */}
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
