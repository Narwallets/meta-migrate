import { Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Icon } from "@mui/material"
import { yton } from "../utils/math"

type row = {
    location: string
    link: string
    amount?: string
    unit: string
    noline?: boolean
}

export default function LocateComponent(props: { rows: row[] }) {
    return (
        <>
            <TableContainer>
                <Table stickyHeader sx={{ width: 1 }}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Location</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell align="left"></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {props.rows.map((row, i) => (
                            <TableRow
                                key={i}
                                sx={
                                    !!row?.noline
                                        ? { "& *": { border: "0 !important" } }
                                        : { "&:last-child td, &:last-child th": { border: "0 !important" } }
                                }
                            >
                                <TableCell
                                    component="th"
                                    scope="row"
                                    sx={{ cursor: "pointer" }}
                                    onClick={event => (window.location.href = row.link)}
                                >
                                    {row.location !== "" ? (
                                        <>
                                            {row.location}&nbsp;
                                            <Icon
                                                sx={{
                                                    verticalAlign: "middle",
                                                    ml: 1,
                                                    color: "#aaa",
                                                    fontSize: "1.2em",
                                                    "&:hover": {
                                                        color: "#000"
                                                    }
                                                }}
                                            >
                                                open_in_new
                                            </Icon>
                                        </>
                                    ) : (
                                        <>&nbsp;</>
                                    )}
                                </TableCell>
                                <TableCell align="right">
                                    {row.amount ? yton(row.amount + (row.unit === "OCT" ? "000000" : ""))! : "..."}{" "}
                                </TableCell>
                                <TableCell sx={{ width: "10ch" }}>{row.unit}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </>
    )
}
