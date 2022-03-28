import * as React from "react"
import Timeline from "@mui/lab/Timeline"
import TimelineItem from "@mui/lab/TimelineItem"
import TimelineSeparator from "@mui/lab/TimelineSeparator"
import TimelineConnector from "@mui/lab/TimelineConnector"
import TimelineContent from "@mui/lab/TimelineContent"
import TimelineDot from "@mui/lab/TimelineDot"
import { getPage, jumpTo } from "../utils/navigation"

function getColor(page: number): "grey" | "primary" | "success" {
    const currentPage = getPage()

    if (currentPage === page) return "primary"

    return "grey"
}

export default function TimelineComponent() {
    return (
        <Timeline
            className="timeline"
            sx={{
                flexBasis: "12.5rem",
                alignItems: "end",
                "& > .MuiTimelineItem-root::before": {
                    flex: 0
                },
                "& > *": {
                    cursor: "pointer"
                }
            }}
            position="left"
        >
            <TimelineItem className="timeline-item" onClick={() => jumpTo(0)}>
                <TimelineSeparator className="timeline-item-separator">
                    <TimelineDot
                        className="timeline-item-dot"
                        color={getColor(0)}
                    />
                    <TimelineConnector className="timeline-item-conector" />
                </TimelineSeparator>
                <TimelineContent className="timeline-item-content">
                    OLD POSITION
                </TimelineContent>
            </TimelineItem>
            <TimelineItem className="timeline-item" onClick={() => jumpTo(1)}>
                <TimelineSeparator className="timeline-item-separator">
                    <TimelineDot
                        className="timeline-item-dot"
                        color={getColor(1)}
                    />
                    <TimelineConnector className="timeline-item-conector" />
                </TimelineSeparator>
                <TimelineContent className="timeline-item-content">
                    CONVERT
                </TimelineContent>
            </TimelineItem>
            <TimelineItem className="timeline-item" onClick={() => jumpTo(2)}>
                <TimelineSeparator className="timeline-item-separator">
                    <TimelineDot
                        className="timeline-item-dot"
                        color={getColor(2)}
                    />
                    <TimelineConnector className="timeline-item-conector" />
                </TimelineSeparator>
                <TimelineContent className="timeline-item-content">
                    NEW POSITION
                </TimelineContent>
            </TimelineItem>
            <TimelineItem className="timeline-item" onClick={() => jumpTo(3)}>
                <TimelineSeparator className="timeline-item-separator">
                    <TimelineDot
                        className="timeline-item-dot"
                        color={getColor(3)}
                    />
                </TimelineSeparator>
                <TimelineContent className="timeline-item-content">
                    PROFIT
                </TimelineContent>
            </TimelineItem>
            <TimelineItem className="timeline-item" onClick={() => jumpTo(4)}>
                <TimelineSeparator className="timeline-item-separator">
                    <TimelineDot
                        className="timeline-item-dot"
                        color={getColor(4)}
                    />
                </TimelineSeparator>
                <TimelineContent className="timeline-item-content">
                    LOCATE MY FUNDS
                </TimelineContent>
            </TimelineItem>
        </Timeline>
    )
}
